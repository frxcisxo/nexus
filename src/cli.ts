#!/usr/bin/env node

/**
 * NEXUS CLI
 * Command-line interface para usar NEXUS desde terminal
 */

import { Nexus } from './index.js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const repoPath = process.cwd();
  const nexus = new Nexus({ repositoryPath: repoPath });

  switch (command) {
    case 'impact':
      await handleImpact(args);
      break;
    case 'release':
      await handleRelease(args);
      break;
    case 'debt':
      await handleDebt();
      break;
    case 'full':
      await handleFull(args);
      break;
    default:
      printHelp();
  }
}

async function handleImpact(args: string[]) {
  const from = args[1] || 'HEAD~1';
  const to = args[2] || 'HEAD';

  console.log(`\n📊 NEXUS - Impact Analysis\n`);
  
  const nexus = new Nexus();
  const impact = await nexus.analyzeImpactFromCommits(from, to);

  console.log(`\n✅ Analysis Complete\n`);
  console.log(`Breaking Changes: ${impact.breakingChanges ? 'YES' : 'NO'}`);
  console.log(`Risk Score: ${(impact.riskScore * 100).toFixed(1)}%`);
  console.log(`Estimated Work: ${impact.estimatedWorkDays} days\n`);
  console.log(`Directly Affected: ${impact.directlyAffected.length} files`);
  console.log(`Indirectly Affected: ${impact.indirectlyAffected.length} files\n`);

  // Save detailed report
  const reportPath = resolve('nexus-impact-report.json');
  writeFileSync(reportPath, JSON.stringify(impact, null, 2));
  console.log(`📄 Report saved: ${reportPath}\n`);
}

async function handleRelease(args: string[]) {
  const from = args[1] || 'HEAD~1';
  const to = args[2] || 'HEAD';

  console.log(`\n🚀 NEXUS - Release Notes Generator\n`);

  const nexus = new Nexus();
  const { versionAnalysis, markdown } = await nexus.generateReleaseNotes(from, to);

  console.log(`Current Version: ${versionAnalysis.currentVersion}`);
  console.log(`Suggested Version: ${versionAnalysis.suggestedVersion}`);
  console.log(`Bump: ${versionAnalysis.bump.toUpperCase()}`);
  console.log(`Reason: ${versionAnalysis.reason}\n`);

  // Save markdown
  const mdPath = resolve('RELEASE_NOTES.md');
  writeFileSync(mdPath, markdown);
  console.log(`📝 Release notes saved: ${mdPath}\n`);
  console.log(markdown);
}

async function handleDebt() {
  console.log(`\n🔍 NEXUS - Technical Debt Analysis\n`);

  const nexus = new Nexus();
  const analysis = await nexus.analyzeTechnicalDebt();

  console.log(`📈 Technical Debt Metrics\n`);
  console.log(`Average Complexity: ${analysis.summary.avgComplexity.toFixed(1)}`);
  console.log(`Code Duplication: ${(analysis.summary.duplicationPercentage * 100).toFixed(1)}%`);
  console.log(`Code Smells Found: ${analysis.summary.codeSmellCount}`);
  console.log(`Security Issues: ${analysis.summary.vulnerabilityCount}\n`);

  if (analysis.risks.suggestions.length > 0) {
    console.log(`💡 Suggestions:\n`);
    for (const suggestion of analysis.risks.suggestions.slice(0, 5)) {
      console.log(`- ${suggestion}`);
    }
    console.log();
  }

  // Save detailed analysis
  const reportPath = resolve('nexus-debt-report.json');
  writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`📄 Full report saved: ${reportPath}\n`);
}

async function handleFull(args: string[]) {
  const from = args[1] || 'HEAD~1';
  const to = args[2] || 'HEAD';

  console.log(`\n🎯 NEXUS - Full Analysis\n`);

  const nexus = new Nexus();
  const fullAnalysis = await nexus.fullAnalysis(from, to);

  console.log(`📊 IMPACT ANALYSIS`);
  console.log(`- Risk Score: ${(fullAnalysis.impact.riskScore * 100).toFixed(1)}%`);
  console.log(`- Affected Files: ${fullAnalysis.impact.directlyAffected.length}\n`);

  console.log(`🚀 RELEASE INFORMATION`);
  console.log(`- Current: ${fullAnalysis.release.versionAnalysis.currentVersion}`);
  console.log(`- Suggested: ${fullAnalysis.release.versionAnalysis.suggestedVersion}`);
  console.log(`- Bump: ${fullAnalysis.release.versionAnalysis.bump.toUpperCase()}\n`);

  console.log(`🔍 TECHNICAL DEBT`);
  console.log(`- Code Smells: ${fullAnalysis.debt.summary.codeSmellCount}`);
  console.log(`- Duplication: ${(fullAnalysis.debt.summary.duplicationPercentage * 100).toFixed(1)}%\n`);

  // Save full report
  const reportPath = resolve('nexus-full-report.json');
  writeFileSync(reportPath, JSON.stringify(fullAnalysis, null, 2));
  console.log(`📄 Full report saved: ${reportPath}\n`);
}

function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 NEXUS - Impact Analysis MCP                   ║
║            Distributed code intelligence system               ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
  nexus <command> [options]

Commands:
  impact [from] [to]      Analyze impact of changes
  release [from] [to]     Generate release notes
  debt                    Analyze technical debt
  full [from] [to]        Complete analysis
  help                    Show this help

Examples:
  nexus impact v1.0.0 HEAD
  nexus release v1.0.0 HEAD
  nexus debt
  nexus full v1.0.0 HEAD

  `);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
