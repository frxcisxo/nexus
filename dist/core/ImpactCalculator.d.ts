/**
 * IMPACT CALCULATOR
 * Construye grafo de dependencias y calcula impacto en cascada
 * Determina qué se ve afectado por cada cambio
 */
import { ImpactAnalysis, CodeChange } from '../types.js';
export declare class ImpactCalculator {
    private graph;
    private repoPath;
    constructor(repoPath: string);
    /**
     * Construye el grafo de dependencias analizando imports/requires
     * Soporta TypeScript, JavaScript, Python, Java
     */
    buildDependencyGraph(): Promise<void>;
    /**
     * Calcula el impacto completo de un conjunto de cambios
     * Incluye: affected files, risk score, work estimation
     */
    calculateImpact(changes: CodeChange[]): Promise<ImpactAnalysis>;
    /**
     * Encuentra archivos directa e indirectamente afectados
     */
    private findAffectedFiles;
    /**
     * Calcula la cadena de cascada de dependencias
     */
    private calculateCascade;
    /**
     * Clasifica consumidores en internos y externos
     */
    private categorizeConsumers;
    /**
     * Calcula riesgo de un cambio (0-1)
     * Considera: breaking change, tipo, número de consumidores
     */
    private calculateRisk;
    /**
     * Estima días de trabajo para actualizar consumidores
     */
    private estimateWorkload;
    /**
     * Encuentra tipos TypeScript afectados
     */
    private findAffectedTypes;
    /**
     * Encuentra funciones/métodos afectados
     */
    private findAffectedFunctions;
    /**
     * Extrae imports/requires de un archivo
     */
    private extractImports;
    /**
     * Extrae exports de un archivo
     */
    private extractExports;
    /**
     * Resuelve rutas de import relativas
     */
    private resolveImportPath;
    /**
     * Encuentra todos los archivos fuente en el repo
     */
    private findSourceFiles;
}
//# sourceMappingURL=ImpactCalculator.d.ts.map