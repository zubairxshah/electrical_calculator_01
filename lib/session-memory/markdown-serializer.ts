/**
 * Markdown serializer for session memory file
 * Feature: 001-session-memory-file
 *
 * Converts SessionMemory structure to human-readable markdown format
 */

import type {
  SessionMemory,
  PhaseStatus,
  BlockerEntry,
  TestSuite,
  ServerInfo,
  FileReference,
  NextStep,
} from './types';

/**
 * Serialize SessionMemory to markdown format
 * @param memory - SessionMemory structure
 * @returns Markdown string
 */
export function serializeToMarkdown(memory: SessionMemory): string {
  const sections = [
    renderHeader(memory),
    renderExecutiveSummary(memory),
    renderTaskStatus(memory),
    renderBlockers(memory),
    renderTestResults(memory),
    renderEnvironmentState(memory),
    renderFilesNeedingAttention(memory),
    renderNextSteps(memory),
    renderFooter(memory),
  ];

  return sections.filter(Boolean).join('\n\n');
}

/**
 * Render markdown header with metadata
 */
function renderHeader(memory: SessionMemory): string {
  const lines = [
    `# Session Memory: ${memory.metadata.projectName}`,
    '',
    `**Generated**: ${memory.metadata.generatedAt}`,
    `**Branch**: ${memory.metadata.branch}`,
  ];

  if (memory.metadata.sessionDuration) {
    lines.push(`**Session Duration**: ${memory.metadata.sessionDuration}`);
  }

  return lines.join('\n');
}

/**
 * Render executive summary section
 */
function renderExecutiveSummary(memory: SessionMemory): string {
  return `## Executive Summary

1. ${memory.summary.projectDescription}
2. ${memory.summary.completionStatus}
3. Current phase: ${memory.summary.currentPhase}
4. ${memory.summary.majorBlocker || 'No critical blockers'}
5. Next action: ${memory.summary.nextAction}`;
}

/**
 * Render task status section with phase table
 */
function renderTaskStatus(memory: SessionMemory): string {
  const lines = [
    '## Task Status',
    '',
    `**Source**: ${memory.taskStatus.sourceFile}`,
    '',
  ];

  // Phase completion table
  if (memory.taskStatus.phases.length > 0) {
    lines.push('| Phase | Completed | Total | Percentage |');
    lines.push('|-------|-----------|-------|------------|');

    for (const phase of memory.taskStatus.phases) {
      lines.push(
        `| ${phase.name} | ${phase.completed} | ${phase.total} | ${phase.percentage.toFixed(1)}% |`
      );
    }

    lines.push('');
  }

  // Current task
  if (memory.taskStatus.currentTask) {
    lines.push(
      `**Current Task**: ${memory.taskStatus.currentTask.id} - ${memory.taskStatus.currentTask.title}`
    );
    lines.push('');
  }

  // Next tasks
  if (memory.taskStatus.nextTasks.length > 0) {
    const nextTaskIds = memory.taskStatus.nextTasks.map((t) => t.id).join(', ');
    lines.push(`**Next Tasks**: ${nextTaskIds}`);
  }

  return lines.join('\n');
}

/**
 * Render blockers section by priority
 */
function renderBlockers(memory: SessionMemory): string {
  if (memory.blockers.length === 0) {
    return '## Blockers\n\nNo blockers identified.';
  }

  const lines = ['## Blockers', ''];

  // Group by priority
  const highPriority = memory.blockers.filter((b) => b.priority === 'high');
  const mediumPriority = memory.blockers.filter((b) => b.priority === 'medium');
  const lowPriority = memory.blockers.filter((b) => b.priority === 'low');

  if (highPriority.length > 0) {
    lines.push('### High Priority', '');
    highPriority.forEach((blocker) => {
      lines.push(renderBlocker(blocker));
    });
  }

  if (mediumPriority.length > 0) {
    lines.push('### Medium Priority', '');
    mediumPriority.forEach((blocker) => {
      lines.push(renderBlocker(blocker));
    });
  }

  if (lowPriority.length > 0) {
    lines.push('### Low Priority', '');
    lowPriority.forEach((blocker) => {
      lines.push(renderBlocker(blocker));
    });
  }

  return lines.join('\n');
}

/**
 * Render individual blocker
 */
function renderBlocker(blocker: BlockerEntry): string {
  const taskPrefix = blocker.taskId ? `**${blocker.taskId}**: ` : '';

  return `- ${taskPrefix}${blocker.title}
  - **Description**: ${blocker.description}
  - **Action**: ${blocker.requiredAction}
`;
}

/**
 * Render test results section
 */
function renderTestResults(memory: SessionMemory): string {
  const lines = ['## Test Results', ''];

  if (memory.testResults.lastRun) {
    lines.push(`**Last Run**: ${memory.testResults.lastRun}`, '');
  }

  // Unit tests
  lines.push('### Unit Tests (' + memory.testResults.unit.framework + ')', '');
  lines.push(...renderTestSuite(memory.testResults.unit));

  // E2E tests
  lines.push('', '### E2E Tests (' + memory.testResults.e2e.framework + ')', '');
  lines.push(...renderTestSuite(memory.testResults.e2e));

  return lines.join('\n');
}

/**
 * Render individual test suite
 */
function renderTestSuite(suite: TestSuite): string[] {
  const lines = [];

  if (suite.status === 'not-run') {
    lines.push('- **Status**: Not run');
    lines.push(`- **Command**: \`${suite.command}\``);
    return lines;
  }

  const statusIcon = suite.status === 'passed' ? '✅' : '❌';
  lines.push(
    `- **Status**: ${statusIcon} ${suite.passed}/${suite.total} passing (${suite.percentage.toFixed(1)}%)`
  );

  if (suite.failures.length > 0) {
    lines.push('- **Failed**:');
    suite.failures.forEach((failure) => {
      const location = failure.line ? `:${failure.line}` : '';
      lines.push(`  - \`${failure.file}${location}\` - ${failure.testName}`);
      if (failure.message) {
        lines.push(`    ${failure.message}`);
      }
    });
  }

  lines.push(`- **Command**: \`${suite.command}\``);

  return lines;
}

/**
 * Render environment state section
 */
function renderEnvironmentState(memory: SessionMemory): string {
  const lines = ['## Environment State', ''];

  // Servers
  lines.push('### Development Servers', '');
  if (memory.environment.servers.length === 0) {
    lines.push('No active development servers detected.');
  } else {
    memory.environment.servers.forEach((server) => {
      const statusIcon = server.status === 'running' ? '✅' : '❌';
      lines.push(`- ${statusIcon} **${server.process}**: ${server.status} on port ${server.port}`);
      lines.push(`  - **URL**: ${server.url}`);
      if (server.pid) {
        lines.push(`  - **Process**: ${server.process} (PID ${server.pid})`);
      }
    });
  }

  // Dependencies
  lines.push('', '### Dependencies', '');
  lines.push(`- **Status**: ${memory.environment.dependencies.status}`);
  if (memory.environment.dependencies.lastInstall) {
    lines.push(`- **Last Install**: ${memory.environment.dependencies.lastInstall}`);
  }
  lines.push(`- **Package Manager**: ${memory.environment.dependencies.packageManager}`);
  if (memory.environment.dependencies.outdatedCount) {
    lines.push(`- **Outdated**: ${memory.environment.dependencies.outdatedCount} packages`);
  }

  // Build status
  lines.push('', '### Build Status', '');
  lines.push(`- **Status**: ${memory.environment.build.status}`);
  if (memory.environment.build.lastBuild) {
    lines.push(`- **Last Build**: ${memory.environment.build.lastBuild}`);
  }
  if (memory.environment.build.outputDir) {
    lines.push(`- **Output**: ${memory.environment.build.outputDir}`);
  }
  if (memory.environment.build.errors && memory.environment.build.errors.length > 0) {
    lines.push('- **Errors**:');
    memory.environment.build.errors.forEach((error) => {
      lines.push(`  - ${error}`);
    });
  }

  return lines.join('\n');
}

/**
 * Render files needing attention section
 */
function renderFilesNeedingAttention(memory: SessionMemory): string {
  if (memory.filesNeedingAttention.length === 0) {
    return '## Files Needing Attention\n\nNo files requiring attention.';
  }

  const lines = ['## Files Needing Attention', ''];

  memory.filesNeedingAttention.forEach((file, index) => {
    const location = file.line ? `:${file.line}` : '';
    lines.push(`${index + 1}. \`${file.path}${location}\` - ${file.reason}`);
  });

  return lines.join('\n');
}

/**
 * Render next steps section
 */
function renderNextSteps(memory: SessionMemory): string {
  if (memory.nextSteps.length === 0) {
    return '## Next Steps\n\nNo recommended actions at this time.';
  }

  const lines = ['## Next Steps', ''];

  // Group by priority
  const immediate = memory.nextSteps.filter((s) => s.priority === 'immediate');
  const shortTerm = memory.nextSteps.filter((s) => s.priority === 'short-term');
  const mediumTerm = memory.nextSteps.filter((s) => s.priority === 'medium-term');
  const longTerm = memory.nextSteps.filter((s) => s.priority === 'long-term');

  let counter = 1;

  if (immediate.length > 0) {
    immediate.forEach((step) => {
      const ref = step.reference ? ` (${step.reference})` : '';
      lines.push(`${counter}. **Immediate**: ${step.action}${ref}`);
      counter++;
    });
  }

  if (shortTerm.length > 0) {
    shortTerm.forEach((step) => {
      const ref = step.reference ? ` (${step.reference})` : '';
      lines.push(`${counter}. **Short-term**: ${step.action}${ref}`);
      counter++;
    });
  }

  if (mediumTerm.length > 0) {
    mediumTerm.forEach((step) => {
      const ref = step.reference ? ` (${step.reference})` : '';
      lines.push(`${counter}. **Medium-term**: ${step.action}${ref}`);
      counter++;
    });
  }

  if (longTerm.length > 0) {
    longTerm.forEach((step) => {
      const ref = step.reference ? ` (${step.reference})` : '';
      lines.push(`${counter}. **Long-term**: ${step.action}${ref}`);
      counter++;
    });
  }

  return lines.join('\n');
}

/**
 * Render footer
 */
function renderFooter(memory: SessionMemory): string {
  return `---

*Generated by Claude Code Session Memory v${memory.metadata.version}*`;
}
