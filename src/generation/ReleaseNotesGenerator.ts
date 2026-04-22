/**
 * RELEASE NOTES GENERATOR
 * Genera release notes profesionales, changelogs y migration guides
 * Entiende el contexto y escribe como humano
 */

import { ConventionalCommit, GeneratedReleaseNotes, VersionAnalysis, ImpactAnalysis } from '../types.js';

export class ReleaseNotesGenerator {
  /**
   * Genera release notes completas para una versión
   */
  static generateReleaseNotes(
    versionAnalysis: VersionAnalysis,
    impactAnalysis: ImpactAnalysis,
    commits: ConventionalCommit[]
  ): GeneratedReleaseNotes {
    const date = new Date();
    const contributors = [...new Set(commits.map(c => c.author))];
    
    return {
      version: versionAnalysis.suggestedVersion,
      date,
      breakingChanges: this.extractBreakingChanges(impactAnalysis, commits),
      newFeatures: this.extractFeatures(commits),
      bugFixes: this.extractBugFixes(commits),
      migrationGuide: versionAnalysis.breakingChanges.length > 0
        ? this.generateMigrationGuide(versionAnalysis, impactAnalysis)
        : undefined,
      contributors,
    };
  }

  /**
   * Genera markdown formateado de release notes
   */
  static toMarkdown(notes: GeneratedReleaseNotes): string {
    let md = '';
    
    // Header
    md += `# ${notes.version} - ${notes.date.toISOString().split('T')[0]}\n\n`;
    
    // Breaking Changes
    if (notes.breakingChanges.length > 0) {
      md += '## ⚠️ Breaking Changes\n\n';
      for (const change of notes.breakingChanges) {
        md += `### ${change.what}\n\n`;
        md += `**Why**: ${change.why}\n\n`;
        md += `**Migration time**: ~${change.migrationTime}\n\n`;
        md += `**Affected consumers**: ${change.affectedConsumers}\n\n`;
        md += '**Before**:\n```typescript\n';
        md += change.oldWay;
        md += '\n```\n\n';
        md += '**After**:\n```typescript\n';
        md += change.newWay;
        md += '\n```\n\n';
      }
    }
    
    // Features
    if (notes.newFeatures.length > 0) {
      md += '## 🎉 New Features\n\n';
      for (const feature of notes.newFeatures) {
        md += `- **${feature.title}**: ${feature.description}\n`;
        if (feature.example) {
          md += `\n  Example:\n  \`\`\`typescript\n  ${feature.example}\n  \`\`\`\n\n`;
        }
      }
    }
    
    // Bug Fixes
    if (notes.bugFixes.length > 0) {
      md += '## 🐛 Bug Fixes\n\n';
      for (const fix of notes.bugFixes) {
        md += `- **${fix.title}**: ${fix.description}\n`;
        if (fix.issueNumber) {
          md += `  [#${fix.issueNumber}]\n`;
        }
      }
    }
    
    // Contributors
    if (notes.contributors.length > 0) {
      md += `\n## Contributors\n\n`;
      md += notes.contributors.map(c => `- ${c}`).join('\n');
      md += '\n';
    }
    
    return md;
  }

  /**
   * Extrae breaking changes con detalles
   */
  private static extractBreakingChanges(
    impact: ImpactAnalysis,
    commits: ConventionalCommit[]
  ) {
    return impact.changes
      .filter(c => c.breakingChange)
      .map((change, idx) => {
        const commit = commits.find(c => c.subject.includes(change.file));
        
        return {
          what: `${change.file} - ${change.type}`,
          why: commit?.body || 'Improved API design and consistency',
          oldWay: change.oldContent || 'Previous implementation',
          newWay: change.newContent || 'New implementation',
          migrationTime: '5-10 minutes',
          affectedConsumers: impact.directlyAffected.length,
        };
      });
  }

  /**
   * Extrae features de commits
   */
  private static extractFeatures(commits: ConventionalCommit[]) {
    return commits
      .filter(c => c.type === 'feat' && !c.breaking)
      .map(c => ({
        title: c.subject,
        description: c.body?.split('\n')[0] || 'New functionality added',
        example: this.generateExample(c),
      }));
  }

  /**
   * Extrae bug fixes de commits
   */
  private static extractBugFixes(commits: ConventionalCommit[]) {
    return commits
      .filter(c => c.type === 'fix')
      .map(c => ({
        title: c.subject,
        description: c.body?.split('\n')[0] || 'Bug fixed',
        issueNumber: c.footers['Fixes'] || c.footers['Closes']?.match(/\d+/)?.[0],
      }));
  }

  /**
   * Genera ejemplo de código basado en commit
   */
  private static generateExample(commit: ConventionalCommit): string | undefined {
    if (commit.scope === 'auth') {
      return 'const user = await auth.verify(token);';
    }
    if (commit.scope === 'api') {
      return 'const response = await client.request(endpoint);';
    }
    return undefined;
  }

  /**
   * Genera migration guide para breaking changes
   */
  private static generateMigrationGuide(
    version: VersionAnalysis,
    impact: ImpactAnalysis
  ): string {
    let guide = '# Migration Guide\n\n';
    guide += `This is a **major version** change. `;
    guide += `Please review the changes below and update your code accordingly.\n\n`;
    
    guide += `## Affected Files (${impact.directlyAffected.length})\n\n`;
    for (const file of impact.directlyAffected.slice(0, 10)) {
      guide += `- \`${file}\`\n`;
    }
    if (impact.directlyAffected.length > 10) {
      guide += `- ... and ${impact.directlyAffected.length - 10} more\n`;
    }
    
    guide += `\n## Steps\n\n`;
    guide += `1. Update imports if paths changed\n`;
    guide += `2. Update function signatures\n`;
    guide += `3. Review type changes\n`;
    guide += `4. Run tests to ensure compatibility\n`;
    guide += `5. Check the examples below for patterns\n`;
    
    return guide;
  }

  /**
   * Genera changelog completo (todas las versiones)
   */
  static generateChangelog(
    releases: GeneratedReleaseNotes[]
  ): string {
    let changelog = '# Changelog\n\n';
    changelog += 'All notable changes to this project will be documented in this file.\n\n';
    
    for (const release of releases.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )) {
      changelog += `## [${release.version}] - ${release.date.toISOString().split('T')[0]}\n\n`;
      
      if (release.breakingChanges.length > 0) {
        changelog += '### Breaking Changes\n';
        for (const change of release.breakingChanges) {
          changelog += `- ${change.what}\n`;
        }
        changelog += '\n';
      }
      
      if (release.newFeatures.length > 0) {
        changelog += '### Added\n';
        for (const feature of release.newFeatures) {
          changelog += `- ${feature.title}\n`;
        }
        changelog += '\n';
      }
      
      if (release.bugFixes.length > 0) {
        changelog += '### Fixed\n';
        for (const fix of release.bugFixes) {
          changelog += `- ${fix.title}\n`;
        }
        changelog += '\n';
      }
    }
    
    return changelog;
  }
}
