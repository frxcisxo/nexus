/**
 * VERSION ANALYZER
 * Calcula versión semántica automática basada en commits
 * Follows: https://semver.org
 */

import { ConventionalCommit, VersionAnalysis } from '../types.js';

export class VersionAnalyzer {
  /**
   * Sugiere la siguiente versión basada en commits convencionales
   * major.minor.patch
   */
  static suggestVersion(
    currentVersion: string,
    commits: ConventionalCommit[]
  ): VersionAnalysis {
    const [major, minor, patch] = this.parseVersion(currentVersion);
    
    // Analizar commits
    let hasMajor = false;
    let hasMinor = false;
    let hasPatch = false;
    
    const features: string[] = [];
    const fixes: string[] = [];
    const breakingChanges: string[] = [];
    
    for (const commit of commits) {
      if (commit.breaking) {
        hasMajor = true;
        breakingChanges.push(`${commit.type}(${commit.scope}): ${commit.subject}`);
      } else if (commit.type === 'feat') {
        hasMinor = true;
        features.push(commit.subject);
      } else if (commit.type === 'fix') {
        hasPatch = true;
        fixes.push(commit.subject);
      }
    }
    
    // Calcular nueva versión
    let newMajor = major;
    let newMinor = minor;
    let newPatch = patch;
    
    if (hasMajor) {
      newMajor++;
      newMinor = 0;
      newPatch = 0;
    } else if (hasMinor) {
      newMinor++;
      newPatch = 0;
    } else if (hasPatch) {
      newPatch++;
    }
    
    const newVersion = `${newMajor}.${newMinor}.${newPatch}`;
    const bump = hasMajor ? 'major' : hasMinor ? 'minor' : hasPatch ? 'patch' : 'none';
    
    return {
      currentVersion,
      suggestedVersion: newVersion,
      bump,
      reason: this.generateReason(bump, breakingChanges.length, features.length, fixes.length),
      breakingChanges,
      features,
      fixes,
    };
  }

  /**
   * Valida que una versión sea válida según semver
   */
  static isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/.test(version);
  }

  /**
   * Compara dos versiones (retorna -1, 0, 1)
   */
  static compareVersions(v1: string, v2: string): number {
    const [maj1, min1, pat1] = this.parseVersion(v1);
    const [maj2, min2, pat2] = this.parseVersion(v2);
    
    if (maj1 !== maj2) return maj1 - maj2;
    if (min1 !== min2) return min1 - min2;
    if (pat1 !== pat2) return pat1 - pat2;
    return 0;
  }

  /**
   * Calcula si hay breaking changes entre dos versiones
   */
  static isBreakingChange(fromVersion: string, toVersion: string): boolean {
    const [maj1] = this.parseVersion(fromVersion);
    const [maj2] = this.parseVersion(toVersion);
    return maj2 > maj1;
  }

  /**
   * Parsea version string a [major, minor, patch]
   */
  private static parseVersion(version: string): [number, number, number] {
    const cleaned = version.replace(/^v/, '');
    const match = cleaned.match(/(\d+)\.(\d+)\.(\d+)/);
    
    if (!match) {
      return [0, 0, 0];
    }
    
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }

  /**
   * Genera razón legible del bump de versión
   */
  private static generateReason(
    bump: string,
    breakingCount: number,
    featureCount: number,
    fixCount: number
  ): string {
    switch (bump) {
      case 'major':
        return `${breakingCount} breaking change(s) detected`;
      case 'minor':
        return `${featureCount} new feature(s) added`;
      case 'patch':
        return `${fixCount} bug fix(es) included`;
      default:
        return 'No version changes detected';
    }
  }
}
