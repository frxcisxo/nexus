/**
 * DEBT ANALYZER
 * Detecta code smells, complejidad alta, duplicación
 * Predice problemas futuros y sugiere refactoring
 */
import { TechnicalDebtMetrics, FutureRisks } from '../types.js';
export declare class DebtAnalyzer {
    private repoPath;
    constructor(repoPath: string);
    /**
     * Analiza deuda técnica general del proyecto
     */
    analyzeTechnicalDebt(): Promise<TechnicalDebtMetrics>;
    /**
     * Predice problemas futuros basado en patrones
     */
    predictFutureRisks(debt: TechnicalDebtMetrics): Promise<FutureRisks>;
    /**
     * Calcula complejidad ciclomática de un archivo
     * Cuenta: if, else, case, catch, for, while, && , || , ?:
     */
    private calculateCyclomaticComplexity;
    /**
     * Detecta code smells típicos
     */
    private detectCodeSmells;
    /**
     * Detecta código duplicado simple (líneas idénticas)
     */
    private detectDuplication;
    /**
     * Analiza cobertura de tests (heurística)
     */
    private analyzeTestCoverage;
    /**
     * Encuentra archivos con mayor deuda técnica
     */
    findMostProblemFiles(metrics: TechnicalDebtMetrics): Promise<string[]>;
    /**
     * Encuentra archivos fuente
     */
    private findSourceFiles;
}
//# sourceMappingURL=DebtAnalyzer.d.ts.map