/**
 * NEXUS - Distributed Impact Analysis MCP
 * Main entry point que orquesta todos los componentes
 */
import { SourceAnalyzer } from './core/SourceAnalyzer.js';
import { ImpactCalculator } from './core/ImpactCalculator.js';
import { VersionAnalyzer } from './core/VersionAnalyzer.js';
import { ReleaseNotesGenerator } from './generation/ReleaseNotesGenerator.js';
import { DebtAnalyzer } from './core/DebtAnalyzer.js';
import { NexusConfig, ImpactAnalysis, GeneratedReleaseNotes } from './types.js';
/**
 * NEXUS - Analizador de Impacto Distribuido
 *
 * Uso:
 * ```
 * const nexus = new Nexus({ repositoryPath: '/path/to/repo' });
 * const impact = await nexus.analyzeImpactFromCommits('v1.0.0', 'HEAD');
 * console.log(impact);
 * ```
 */
export declare class Nexus {
    private config;
    private sourceAnalyzer;
    private impactCalculator;
    private debtAnalyzer;
    constructor(config?: Partial<NexusConfig>);
    /**
     * Analiza el impacto completo de cambios entre dos versiones
     * Retorna: cambios detectados, archivos afectados, riesgo, trabajo estimado
     */
    analyzeImpactFromCommits(fromVersion: string, toVersion?: string): Promise<ImpactAnalysis>;
    /**
     * Sugiere versión siguiente y genera release notes
     */
    generateReleaseNotes(fromVersion: string, toVersion?: string): Promise<{
        versionAnalysis: ReturnType<typeof VersionAnalyzer.suggestVersion>;
        releaseNotes: GeneratedReleaseNotes;
        markdown: string;
    }>;
    /**
     * Analiza deuda técnica y predice problemas futuros
     */
    analyzeTechnicalDebt(): Promise<{
        metrics: import("./types.js").TechnicalDebtMetrics;
        risks: import("./types.js").FutureRisks;
        problematicFiles: string[];
        summary: {
            avgComplexity: number;
            duplicationPercentage: number;
            codeSmellCount: number;
            vulnerabilityCount: number;
        };
    }>;
    /**
     * Ejecuta análisis completo (impacto + versión + deuda técnica)
     */
    fullAnalysis(fromVersion: string, toVersion?: string): Promise<{
        impact: ImpactAnalysis;
        release: {
            versionAnalysis: ReturnType<typeof VersionAnalyzer.suggestVersion>;
            releaseNotes: GeneratedReleaseNotes;
            markdown: string;
        };
        debt: {
            metrics: import("./types.js").TechnicalDebtMetrics;
            risks: import("./types.js").FutureRisks;
            problematicFiles: string[];
            summary: {
                avgComplexity: number;
                duplicationPercentage: number;
                codeSmellCount: number;
                vulnerabilityCount: number;
            };
        };
        timestamp: string;
    }>;
}
export * from './types.js';
export { SourceAnalyzer, ImpactCalculator, VersionAnalyzer, ReleaseNotesGenerator, DebtAnalyzer };
//# sourceMappingURL=index.d.ts.map