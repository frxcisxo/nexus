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
export class Nexus {
  private config: NexusConfig;
  private sourceAnalyzer: SourceAnalyzer;
  private impactCalculator: ImpactCalculator;
  private debtAnalyzer: DebtAnalyzer;

  constructor(config: Partial<NexusConfig> = {}) {
    const repoPath = config.repositoryPath || process.cwd();
    
    this.config = {
      repositoryPath: repoPath,
      languages: config.languages || ['ts', 'js', 'tsx', 'jsx', 'py', 'java'],
      ignorePatterns: config.ignorePatterns || ['node_modules', '.git', 'dist'],
      enableMLAnalysis: config.enableMLAnalysis ?? true,
      enableAutoSync: config.enableAutoSync ?? false,
      semverStrategy: config.semverStrategy || 'conventional',
    };

    this.sourceAnalyzer = new SourceAnalyzer(repoPath);
    this.impactCalculator = new ImpactCalculator(repoPath);
    this.debtAnalyzer = new DebtAnalyzer(repoPath);
  }

  /**
   * Analiza el impacto completo de cambios entre dos versiones
   * Retorna: cambios detectados, archivos afectados, riesgo, trabajo estimado
   */
  async analyzeImpactFromCommits(fromVersion: string, toVersion: string = 'HEAD'): Promise<ImpactAnalysis> {
    console.log(`[NEXUS] Analyzing impact from ${fromVersion} to ${toVersion}...`);

    // 1. Parsear commits convencionales
    const commits = await this.sourceAnalyzer.parseConventionalCommits(fromVersion, toVersion);
    console.log(`[NEXUS] Found ${commits.length} commits`);

    // 2. Detectar cambios de código
    const sigChanges = await this.sourceAnalyzer.detectSignatureChanges(fromVersion, toVersion);
    const typeChanges = await this.sourceAnalyzer.detectTypeChanges(fromVersion, toVersion);
    const removedExports = await this.sourceAnalyzer.detectRemovedExports(fromVersion, toVersion);

    const allChanges = [
      ...sigChanges,
      ...typeChanges,
      ...removedExports.map(exp => ({
        file: exp,
        type: 'removal' as const,
        severity: 'critical' as const,
        breakingChange: true,
      })),
    ];

    console.log(`[NEXUS] Detected ${allChanges.length} code changes`);

    // 3. Construir grafo de dependencias
    await this.impactCalculator.buildDependencyGraph();
    console.log(`[NEXUS] Dependency graph built`);

    // 4. Calcular impacto
    const impact = await this.impactCalculator.calculateImpact(allChanges);
    console.log(`[NEXUS] Impact calculated: ${impact.directlyAffected.length} directly affected`);

    return impact;
  }

  /**
   * Sugiere versión siguiente y genera release notes
   */
  async generateReleaseNotes(fromVersion: string, toVersion: string = 'HEAD'): Promise<{
    versionAnalysis: ReturnType<typeof VersionAnalyzer.suggestVersion>;
    releaseNotes: GeneratedReleaseNotes;
    markdown: string;
  }> {
    console.log(`[NEXUS] Generating release notes from ${fromVersion}...`);

    // Obtener commits
    const commits = await this.sourceAnalyzer.parseConventionalCommits(fromVersion, toVersion);

    // Análisis de versión
    const versionAnalysis = VersionAnalyzer.suggestVersion(fromVersion, commits);
    console.log(`[NEXUS] Suggested version: ${versionAnalysis.suggestedVersion}`);

    // Análisis de impacto (para breaking changes info)
    const impact = await this.analyzeImpactFromCommits(fromVersion, toVersion);

    // Generar release notes
    const releaseNotes = ReleaseNotesGenerator.generateReleaseNotes(
      versionAnalysis,
      impact,
      commits
    );

    const markdown = ReleaseNotesGenerator.toMarkdown(releaseNotes);

    return { versionAnalysis, releaseNotes, markdown };
  }

  /**
   * Analiza deuda técnica y predice problemas futuros
   */
  async analyzeTechnicalDebt() {
    console.log(`[NEXUS] Analyzing technical debt...`);

    const debt = await this.debtAnalyzer.analyzeTechnicalDebt();
    const risks = await this.debtAnalyzer.predictFutureRisks(debt);
    const problematicFiles = await this.debtAnalyzer.findMostProblemFiles(debt);

    return {
      metrics: debt,
      risks,
      problematicFiles,
      summary: {
        avgComplexity: Object.values(debt.cyclomaticComplexity).reduce((a, b) => a + b, 0) /
          Object.keys(debt.cyclomaticComplexity).length,
        duplicationPercentage: debt.duplicationPercentage,
        codeSmellCount: debt.codeSmells.length,
        vulnerabilityCount: debt.securityVulnerabilities.length,
      },
    };
  }

  /**
   * Ejecuta análisis completo (impacto + versión + deuda técnica)
   */
  async fullAnalysis(fromVersion: string, toVersion: string = 'HEAD') {
    console.log(`[NEXUS] Starting full analysis...`);

    const [impact, release, debt] = await Promise.all([
      this.analyzeImpactFromCommits(fromVersion, toVersion),
      this.generateReleaseNotes(fromVersion, toVersion),
      this.analyzeTechnicalDebt(),
    ]);

    return {
      impact,
      release,
      debt,
      timestamp: new Date().toISOString(),
    };
  }
}

// Exportar tipos
export * from './types.js';
export { SourceAnalyzer, ImpactCalculator, VersionAnalyzer, ReleaseNotesGenerator, DebtAnalyzer };
