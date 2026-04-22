/**
 * VERSION ANALYZER
 * Calcula versión semántica automática basada en commits
 * Follows: https://semver.org
 */
import { ConventionalCommit, VersionAnalysis } from '../types.js';
export declare class VersionAnalyzer {
    /**
     * Sugiere la siguiente versión basada en commits convencionales
     * major.minor.patch
     */
    static suggestVersion(currentVersion: string, commits: ConventionalCommit[]): VersionAnalysis;
    /**
     * Valida que una versión sea válida según semver
     */
    static isValidVersion(version: string): boolean;
    /**
     * Compara dos versiones (retorna -1, 0, 1)
     */
    static compareVersions(v1: string, v2: string): number;
    /**
     * Calcula si hay breaking changes entre dos versiones
     */
    static isBreakingChange(fromVersion: string, toVersion: string): boolean;
    /**
     * Parsea version string a [major, minor, patch]
     */
    private static parseVersion;
    /**
     * Genera razón legible del bump de versión
     */
    private static generateReason;
}
//# sourceMappingURL=VersionAnalyzer.d.ts.map