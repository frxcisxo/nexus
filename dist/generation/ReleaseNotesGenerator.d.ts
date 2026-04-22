/**
 * RELEASE NOTES GENERATOR
 * Genera release notes profesionales, changelogs y migration guides
 * Entiende el contexto y escribe como humano
 */
import { ConventionalCommit, GeneratedReleaseNotes, VersionAnalysis, ImpactAnalysis } from '../types.js';
export declare class ReleaseNotesGenerator {
    /**
     * Genera release notes completas para una versión
     */
    static generateReleaseNotes(versionAnalysis: VersionAnalysis, impactAnalysis: ImpactAnalysis, commits: ConventionalCommit[]): GeneratedReleaseNotes;
    /**
     * Genera markdown formateado de release notes
     */
    static toMarkdown(notes: GeneratedReleaseNotes): string;
    /**
     * Extrae breaking changes con detalles
     */
    private static extractBreakingChanges;
    /**
     * Extrae features de commits
     */
    private static extractFeatures;
    /**
     * Extrae bug fixes de commits
     */
    private static extractBugFixes;
    /**
     * Genera ejemplo de código basado en commit
     */
    private static generateExample;
    /**
     * Genera migration guide para breaking changes
     */
    private static generateMigrationGuide;
    /**
     * Genera changelog completo (todas las versiones)
     */
    static generateChangelog(releases: GeneratedReleaseNotes[]): string;
}
//# sourceMappingURL=ReleaseNotesGenerator.d.ts.map