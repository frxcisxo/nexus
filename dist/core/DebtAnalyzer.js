/**
 * DEBT ANALYZER
 * Detecta code smells, complejidad alta, duplicación
 * Predice problemas futuros y sugiere refactoring
 */
import { promises as fs } from 'fs';
import { join } from 'path';
export class DebtAnalyzer {
    constructor(repoPath) {
        this.repoPath = repoPath;
    }
    /**
     * Analiza deuda técnica general del proyecto
     */
    async analyzeTechnicalDebt() {
        const files = await this.findSourceFiles();
        const metrics = {
            cyclomaticComplexity: {},
            duplicationPercentage: 0,
            testCoverage: {},
            outdatedDependencies: [],
            securityVulnerabilities: [],
            codeSmells: [],
        };
        // Analizar complejidad ciclomática
        for (const file of files) {
            const content = await fs.readFile(join(this.repoPath, file), 'utf-8');
            metrics.cyclomaticComplexity[file] = this.calculateCyclomaticComplexity(content);
            // Detectar code smells
            metrics.codeSmells.push(...this.detectCodeSmells(content, file));
        }
        // Detectar duplicación
        metrics.duplicationPercentage = await this.detectDuplication(files);
        // Detectar test coverage (básico)
        metrics.testCoverage = await this.analyzeTestCoverage(files);
        return metrics;
    }
    /**
     * Predice problemas futuros basado en patrones
     */
    async predictFutureRisks(debt) {
        const risks = {
            likelyToBreak: [],
            performanceBottlenecks: [],
            securityConcerns: [],
            suggestions: [],
        };
        // Archivos con complejidad alta probable que se rompan
        for (const [file, complexity] of Object.entries(debt.cyclomaticComplexity)) {
            if (complexity > 20) {
                risks.likelyToBreak.push(`${file} has complexity ${complexity} (high = hard to maintain)`);
            }
        }
        // Duplicación indica problemas futuros
        if (debt.duplicationPercentage > 0.3) {
            risks.suggestions.push(`${(debt.duplicationPercentage * 100).toFixed(1)}% code duplication detected - extract common utilities`);
        }
        // Test coverage bajo
        for (const [file, coverage] of Object.entries(debt.testCoverage)) {
            if (coverage < 0.5) {
                risks.suggestions.push(`${file} has only ${(coverage * 100).toFixed(0)}% test coverage - add more tests`);
            }
        }
        // Vulnerabilidades de seguridad
        if (debt.securityVulnerabilities.length > 0) {
            risks.securityConcerns = debt.securityVulnerabilities.map(v => `${v.package}: ${v.description} [${v.severity}]`);
        }
        return risks;
    }
    /**
     * Calcula complejidad ciclomática de un archivo
     * Cuenta: if, else, case, catch, for, while, && , || , ?:
     */
    calculateCyclomaticComplexity(content) {
        let complexity = 1; // Base complexity
        // Contar decisiones
        const patterns = [
            /\bif\s*\(/g,
            /\belse\s*(?:if\s*\()?/g,
            /\bcase\s+/g,
            /\bcatch\s*\(/g,
            /\bfor\s*\(/g,
            /\bwhile\s*\(/g,
            /\?\s*:/g,
            /\|\|/g,
            /&&/g,
        ];
        for (const pattern of patterns) {
            const matches = content.match(pattern) || [];
            complexity += matches.length;
        }
        return complexity;
    }
    /**
     * Detecta code smells típicos
     */
    detectCodeSmells(content, file) {
        const smells = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Función muy larga (>50 líneas)
            const functionMatch = line.match(/(?:function|const|async)\s+(\w+)/);
            if (functionMatch) {
                let braceCount = 0;
                let functionLength = 0;
                for (let j = i; j < Math.min(i + 100, lines.length); j++) {
                    braceCount += (lines[j].match(/\{/g) || []).length;
                    braceCount -= (lines[j].match(/\}/g) || []).length;
                    functionLength++;
                    if (braceCount === 0 && j > i)
                        break;
                }
                if (functionLength > 50) {
                    smells.push({
                        file,
                        type: 'long-function',
                        line: i + 1,
                        description: `Function '${functionMatch[1]}' is ${functionLength} lines (should be <50)`,
                        severity: 'medium',
                    });
                }
            }
            // Parámetro demasiados (>5 parámetros)
            const paramMatch = line.match(/\(([^)]+)\)\s*[:{]/);
            if (paramMatch) {
                const params = paramMatch[1].split(',').filter(p => p.trim());
                if (params.length > 5) {
                    smells.push({
                        file,
                        type: 'too-many-parameters',
                        line: i + 1,
                        description: `Function has ${params.length} parameters (should be <5)`,
                        severity: 'low',
                    });
                }
            }
            // Comentarios todo/fixme
            if (/TODO|FIXME|HACK|XXX/.test(line)) {
                smells.push({
                    file,
                    type: 'unresolved-todo',
                    line: i + 1,
                    description: line.trim().substring(0, 80),
                    severity: 'low',
                });
            }
            // Variable sin usar (básico)
            const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
            if (varMatch) {
                const varName = varMatch[1];
                if (!content.includes(varName) || content.indexOf(varName) === content.lastIndexOf(varName)) {
                    smells.push({
                        file,
                        type: 'unused-variable',
                        line: i + 1,
                        description: `Variable '${varName}' may be unused`,
                        severity: 'low',
                    });
                }
            }
        }
        return smells;
    }
    /**
     * Detecta código duplicado simple (líneas idénticas)
     */
    async detectDuplication(files) {
        const allLines = new Map();
        let totalLines = 0;
        let duplicatedLines = 0;
        for (const file of files) {
            const content = await fs.readFile(join(this.repoPath, file), 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            totalLines += lines.length;
            for (const line of lines) {
                // Ignorar líneas cortas
                if (line.length < 20)
                    continue;
                const count = allLines.get(line) || 0;
                if (count > 0)
                    duplicatedLines++;
                allLines.set(line, count + 1);
            }
        }
        return totalLines > 0 ? duplicatedLines / totalLines : 0;
    }
    /**
     * Analiza cobertura de tests (heurística)
     */
    async analyzeTestCoverage(files) {
        const coverage = {};
        for (const file of files) {
            const testFile = file.replace(/\.ts$/, '.test.ts').replace(/\.js$/, '.test.js');
            try {
                await fs.access(join(this.repoPath, testFile));
                coverage[file] = 0.8; // Si existe test file, asumir 80%
            }
            catch {
                coverage[file] = 0; // Sin test file
            }
        }
        return coverage;
    }
    /**
     * Encuentra archivos con mayor deuda técnica
     */
    async findMostProblemFiles(metrics) {
        const fileScores = [];
        // Score basado en complejidad
        for (const [file, complexity] of Object.entries(metrics.cyclomaticComplexity)) {
            let score = complexity;
            // Penalizar por test coverage bajo
            if (metrics.testCoverage[file] < 0.5) {
                score *= 1.5;
            }
            fileScores.push([file, score]);
        }
        return fileScores
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([file]) => file);
    }
    /**
     * Encuentra archivos fuente
     */
    async findSourceFiles() {
        const files = [];
        async function walk(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    if (!['node_modules', '.git', 'dist', 'build', 'test'].includes(entry.name)) {
                        await walk(join(dir, entry.name));
                    }
                }
                else if (/\.(ts|js|tsx|jsx)$/.test(entry.name) && !entry.name.includes('.test')) {
                    files.push(join(dir, entry.name));
                }
            }
        }
        await walk(this.repoPath);
        return files;
    }
}
//# sourceMappingURL=DebtAnalyzer.js.map