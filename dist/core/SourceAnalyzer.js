/**
 * SOURCE ANALYZER
 * Lee commits, AST, cambios de tipo y detecta breaking changes
 * Extrae el significado semántico de los cambios en código
 */
import { simpleGit } from 'simple-git';
export class SourceAnalyzer {
    constructor(repoPath) {
        this.repoPath = repoPath;
        this.git = simpleGit(repoPath);
    }
    /**
     * Parsea commits convencionales desde git log
     * Extrae tipo, scope, breaking changes
     */
    async parseConventionalCommits(fromRef = 'HEAD~10', toRef = 'HEAD') {
        const log = await this.git.log({ [fromRef]: toRef });
        return log.all.map((commit) => {
            const message = commit.message;
            const [header, ...bodyLines] = message.split('\n');
            // Parsear header: type(scope): subject
            const headerMatch = header.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
            const [, type = 'other', scope, subject] = headerMatch || [, 'other', undefined, header];
            // Detectar breaking changes en BREAKING CHANGE: o en footer
            const body = bodyLines.join('\n');
            const breaking = body.includes('BREAKING CHANGE:') ||
                header.includes('!:') ||
                /^BREAKING[\s-]CHANGE/m.test(message);
            return {
                hash: commit.hash.substring(0, 7),
                type: this.normalizeCommitType(type),
                scope,
                subject,
                body,
                breaking,
                footers: this.parseFooters(message),
                date: new Date(commit.date),
                author: commit.author_name || 'Unknown',
            };
        });
    }
    /**
     * Analiza cambios entre dos versiones
     * Detecta: signature changes, type changes, removals
     */
    async analyzeFileDiff(filePath, fromRef, toRef) {
        try {
            const diff = await this.git.diff([fromRef, toRef, '--', filePath]);
            return this.parseFileDiff(filePath, diff);
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Detecta exportaciones removidas (breaking change crítico)
     */
    async detectRemovedExports(fromRef, toRef) {
        const oldExports = await this.extractExports(fromRef);
        const newExports = await this.extractExports(toRef);
        return Array.from(oldExports).filter(exp => !newExports.has(exp));
    }
    /**
     * Detecta cambios de firma de función
     * old: function foo(a: string): void
     * new: function foo(a: string, b: number): void
     * Detecta si es breaking (params requeridos sin default)
     */
    async detectSignatureChanges(fromRef, toRef) {
        const changes = [];
        const files = await this.git.diff([fromRef, toRef, '--name-only']);
        for (const file of files.split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.js'))) {
            const oldContent = await this.getFileContent(file, fromRef);
            const newContent = await this.getFileContent(file, toRef);
            const signatureMatch = this.findSignatureChanges(oldContent, newContent);
            for (const change of signatureMatch) {
                changes.push({
                    file,
                    type: 'signature-change',
                    oldContent: change.old,
                    newContent: change.new,
                    severity: this.assessSeverity(change),
                    breakingChange: this.isBreakingSignature(change),
                });
            }
        }
        return changes;
    }
    /**
     * Detecta cambios de tipos TypeScript
     * old: type User = { id: string }
     * new: type User = { id: string; email: string }
     */
    async detectTypeChanges(fromRef, toRef) {
        const changes = [];
        const files = await this.git.diff([fromRef, toRef, '--name-only']);
        for (const file of files.split('\n').filter(f => f.endsWith('.ts'))) {
            const oldContent = await this.getFileContent(file, fromRef);
            const newContent = await this.getFileContent(file, toRef);
            const typeChanges = this.findTypeChanges(oldContent, newContent);
            for (const change of typeChanges) {
                changes.push({
                    file,
                    type: 'type-change',
                    oldContent: change.old,
                    newContent: change.new,
                    severity: this.assessTypeSeverity(change),
                    breakingChange: change.isRequired,
                });
            }
        }
        return changes;
    }
    /**
     * Extrae todas las exportaciones de un archivo en un ref específico
     */
    async extractExports(ref) {
        const pattern = /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|type|interface)\s+(\w+)/g;
        const exports = new Set();
        try {
            const files = await this.git.raw(['ls-tree', '-r', '--name-only', ref]);
            for (const file of files.split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.d.ts'))) {
                try {
                    const content = await this.getFileContent(file, ref);
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        exports.add(match[1]);
                    }
                }
                catch { }
            }
        }
        catch { }
        return exports;
    }
    /**
     * Obtiene contenido de un archivo en un ref específico
     */
    async getFileContent(filePath, ref) {
        try {
            return await this.git.show([`${ref}:${filePath}`]);
        }
        catch {
            return '';
        }
    }
    /**
     * Parsea cambios en un diff de archivo
     */
    parseFileDiff(filePath, diff) {
        // Simplified: extract added/removed lines
        const lines = diff.split('\n');
        const changes = [];
        for (const line of lines) {
            if (line.startsWith('-') && !line.startsWith('---')) {
                changes.push({
                    file: filePath,
                    type: 'removal',
                    oldContent: line.substring(1),
                    severity: 'high',
                    breakingChange: true,
                });
            }
        }
        return changes;
    }
    /**
     * Encuentra cambios de firma entre dos versiones
     */
    findSignatureChanges(oldContent, newContent) {
        const sigPattern = /(?:export\s+)?(?:async\s+)?(?:function|const)\s+(\w+)\s*\(([^)]*)\)[:\s]*/g;
        const oldSigs = new Map();
        const newSigs = new Map();
        let match;
        while ((match = sigPattern.exec(oldContent)) !== null) {
            oldSigs.set(match[1], match[0]);
        }
        sigPattern.lastIndex = 0;
        while ((match = sigPattern.exec(newContent)) !== null) {
            newSigs.set(match[1], match[0]);
        }
        const changes = [];
        for (const [name, oldSig] of oldSigs) {
            const newSig = newSigs.get(name);
            if (newSig && newSig !== oldSig) {
                changes.push({ old: oldSig, new: newSig });
            }
        }
        return changes;
    }
    /**
     * Encuentra cambios de tipos TypeScript
     */
    findTypeChanges(oldContent, newContent) {
        const typePattern = /(?:type|interface)\s+(\w+)\s*[={]([^}]+)/g;
        const oldTypes = new Map();
        const newTypes = new Map();
        let match;
        while ((match = typePattern.exec(oldContent)) !== null) {
            oldTypes.set(match[1], match[0]);
        }
        typePattern.lastIndex = 0;
        while ((match = typePattern.exec(newContent)) !== null) {
            newTypes.set(match[1], match[0]);
        }
        const changes = [];
        for (const [name, oldType] of oldTypes) {
            const newType = newTypes.get(name);
            if (newType && newType !== oldType) {
                changes.push({
                    old: oldType,
                    new: newType,
                    isRequired: !newType.includes('?') && oldType.includes('?'),
                });
            }
        }
        return changes;
    }
    /**
     * Evalúa si un cambio de firma es breaking
     */
    isBreakingSignature(change) {
        const oldParams = change.old.match(/\(([^)]*)\)/)?.[1] ?? '';
        const newParams = change.new.match(/\(([^)]*)\)/)?.[1] ?? '';
        const oldCount = oldParams.split(',').filter(p => p.trim() && !p.includes('?')).length;
        const newCount = newParams.split(',').filter(p => p.trim() && !p.includes('?')).length;
        // Breaking si se añaden parámetros requeridos
        return newCount > oldCount;
    }
    /**
     * Evalúa severidad de un cambio
     */
    assessSeverity(change) {
        if (change.old.includes('export default'))
            return 'critical';
        if (this.isBreakingSignature(change))
            return 'high';
        return 'medium';
    }
    /**
     * Evalúa severidad de cambios de tipo
     */
    assessTypeSeverity(change) {
        if (change.isRequired)
            return 'critical';
        return 'medium';
    }
    /**
     * Normaliza tipo de commit
     */
    normalizeCommitType(type) {
        const normalized = type.toLowerCase();
        const validTypes = [
            'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci'
        ];
        return validTypes.includes(normalized) ? normalized : 'other';
    }
    /**
     * Parsea footers de commit (BREAKING CHANGE, Closes, etc)
     */
    parseFooters(message) {
        const footers = {};
        const footerLines = message.split('\n').slice(2);
        for (const line of footerLines) {
            const match = line.match(/^([A-Z-]+):\s(.+)$/);
            if (match) {
                footers[match[1]] = match[2];
            }
        }
        return footers;
    }
}
//# sourceMappingURL=SourceAnalyzer.js.map