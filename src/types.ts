/**
 * NEXUS Type Definitions
 * Core data structures for impact analysis and code intelligence
 */

/** Representa un cambio en el código */
export interface CodeChange {
  file: string;
  type: ChangeType;
  oldContent?: string;
  newContent?: string;
  breakingChange?: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type ChangeType =
  | 'signature-change'
  | 'type-change'
  | 'deprecation'
  | 'removal'
  | 'api-change'
  | 'dependency-update'
  | 'config-change';

/** Resultado del análisis de impacto */
export interface ImpactAnalysis {
  changes: CodeChange[];
  directlyAffected: string[];
  indirectlyAffected: string[];
  consumers: {
    internal: string[];
    external: string[];
  };
  breakingChanges: boolean;
  riskScore: number; // 0-1
  cascadeChain: Record<string, string[]>;
  estimatedWorkDays: number;
  affectedTypes: string[];
  affectedFunctions: string[];
}

/** Información de commit convencional */
export interface ConventionalCommit {
  hash: string;
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'chore' | 'ci' | 'other';
  scope?: string;
  subject: string;
  body?: string;
  breaking: boolean;
  footers: Record<string, string>;
  date: Date;
  author: string;
}

/** Resultado del análisis de versión semántica */
export interface VersionAnalysis {
  currentVersion: string;
  suggestedVersion: string;
  bump: 'major' | 'minor' | 'patch' | 'none';
  reason: string;
  breakingChanges: string[];
  features: string[];
  fixes: string[];
}

/** Grafo de dependencias */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: Map<string, string[]>;
}

export interface DependencyNode {
  name: string;
  type: 'internal' | 'external';
  version?: string;
  lastModified?: Date;
  consumers: string[];
}

/** Métricas de deuda técnica */
export interface TechnicalDebtMetrics {
  cyclomaticComplexity: Record<string, number>;
  duplicationPercentage: number;
  testCoverage: Record<string, number>;
  outdatedDependencies: string[];
  securityVulnerabilities: Vulnerability[];
  codeSmells: CodeSmell[];
}

export interface Vulnerability {
  package: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fixedVersion?: string;
}

export interface CodeSmell {
  file: string;
  type: string;
  line: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

/** Predicción de problemas futuros */
export interface FutureRisks {
  likelyToBreak: string[];
  performanceBottlenecks: string[];
  securityConcerns: string[];
  suggestions: string[];
}

/** Release notes generadas */
export interface GeneratedReleaseNotes {
  version: string;
  date: Date;
  breakingChanges: BreakingChange[];
  newFeatures: Feature[];
  bugFixes: BugFix[];
  migrationGuide?: string;
  contributors: string[];
}

export interface BreakingChange {
  what: string;
  why: string;
  oldWay: string;
  newWay: string;
  migrationTime: string;
  affectedConsumers: number;
}

export interface Feature {
  title: string;
  description: string;
  example?: string;
}

export interface BugFix {
  title: string;
  description: string;
  issueNumber?: string;
}

/** Cambios sincronizables entre repos */
export interface SyncableChange {
  id: string;
  type: 'version' | 'dependency' | 'documentation' | 'test';
  source: string;
  targets: string[];
  payload: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
  conflicts?: string[];
}

/** Configuración de NEXUS */
export interface NexusConfig {
  repositoryPath: string;
  languages: string[];
  ignorePatterns: string[];
  enableMLAnalysis: boolean;
  enableAutoSync: boolean;
  semverStrategy: 'conventional' | 'custom';
}
