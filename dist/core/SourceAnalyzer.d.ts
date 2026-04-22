/**
 * SOURCE ANALYZER
 * Lee commits, AST, cambios de tipo y detecta breaking changes
 * Extrae el significado semántico de los cambios en código
 */
import { CodeChange, ConventionalCommit } from '../types.js';
export declare class SourceAnalyzer {
    private git;
    private repoPath;
    constructor(repoPath: string);
    /**
     * Parsea commits convencionales desde git log
     * Extrae tipo, scope, breaking changes
     */
    parseConventionalCommits(fromRef?: string, toRef?: string): Promise<ConventionalCommit[]>;
    /**
     * Analiza cambios entre dos versiones
     * Detecta: signature changes, type changes, removals
     */
    analyzeFileDiff(filePath: string, fromRef: string, toRef: string): Promise<CodeChange[]>;
    /**
     * Detecta exportaciones removidas (breaking change crítico)
     */
    detectRemovedExports(fromRef: string, toRef: string): Promise<string[]>;
    /**
     * Detecta cambios de firma de función
     * old: function foo(a: string): void
     * new: function foo(a: string, b: number): void
     * Detecta si es breaking (params requeridos sin default)
     */
    detectSignatureChanges(fromRef: string, toRef: string): Promise<CodeChange[]>;
    /**
     * Detecta cambios de tipos TypeScript
     * old: type User = { id: string }
     * new: type User = { id: string; email: string }
     */
    detectTypeChanges(fromRef: string, toRef: string): Promise<CodeChange[]>;
    /**
     * Extrae todas las exportaciones de un archivo en un ref específico
     */
    private extractExports;
    /**
     * Obtiene contenido de un archivo en un ref específico
     */
    private getFileContent;
    /**
     * Parsea cambios en un diff de archivo
     */
    private parseFileDiff;
    /**
     * Encuentra cambios de firma entre dos versiones
     */
    private findSignatureChanges;
    /**
     * Encuentra cambios de tipos TypeScript
     */
    private findTypeChanges;
    /**
     * Evalúa si un cambio de firma es breaking
     */
    private isBreakingSignature;
    /**
     * Evalúa severidad de un cambio
     */
    private assessSeverity;
    /**
     * Evalúa severidad de cambios de tipo
     */
    private assessTypeSeverity;
    /**
     * Normaliza tipo de commit
     */
    private normalizeCommitType;
    /**
     * Parsea footers de commit (BREAKING CHANGE, Closes, etc)
     */
    private parseFooters;
}
//# sourceMappingURL=SourceAnalyzer.d.ts.map