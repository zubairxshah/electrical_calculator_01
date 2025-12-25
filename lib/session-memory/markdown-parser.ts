/**
 * Markdown parser for session memory file
 * Feature: 001-session-memory-file
 *
 * Parses .claude/session-memory.md back into SessionMemory structure
 * Implements T045-T052: Parse all sections from markdown format
 */

import type {
  SessionMemory,
  SessionMetadata,
  ExecutiveSummary,
  TaskStatus,
  PhaseStatus,
  TaskReference,
  BlockerEntry,
  TestResults,
  TestSuite,
  TestFailure,
  EnvironmentState,
  ServerInfo,
  DependencyStatus,
  BuildStatus,
  FileReference,
  NextStep,
} from './types';
import { SESSION_MEMORY_VERSION } from './types';

/**
 * Parse markdown content to SessionMemory structure
 * T045-T052: Parse all sections
 */
export function parseMarkdown(content: string): SessionMemory {
  const lines = content.split('\n');

  return {
    metadata: parseMetadata(lines),
    summary: parseExecutiveSummary(lines),
    taskStatus: parseTaskStatus(lines),
    blockers: parseBlockers(lines),
    testResults: parseTestResults(lines),
    environment: parseEnvironmentState(lines),
    filesNeedingAttention: parseFilesNeedingAttention(lines),
    nextSteps: parseNextSteps(lines),
  };
}

/**
 * T045: Parse metadata section (project name, timestamp, branch) from markdown header
 */
function parseMetadata(lines: string[]): SessionMetadata {
  let projectName = 'unknown';
  let generatedAt = new Date().toISOString();
  let branch = 'unknown';
  let sessionDuration: string | undefined;

  for (const line of lines) {
    // Parse title: # Session Memory: projectName
    const titleMatch = line.match(/^#\s+Session Memory:\s*(.+)$/);
    if (titleMatch) {
      projectName = titleMatch[1].trim();
    }

    // Parse generated timestamp
    const generatedMatch = line.match(/^\*\*Generated\*\*:\s*(.+)$/);
    if (generatedMatch) {
      generatedAt = generatedMatch[1].trim();
    }

    // Parse branch
    const branchMatch = line.match(/^\*\*Branch\*\*:\s*(.+)$/);
    if (branchMatch) {
      branch = branchMatch[1].trim();
    }

    // Parse session duration (optional)
    const durationMatch = line.match(/^\*\*Session Duration\*\*:\s*(.+)$/);
    if (durationMatch) {
      sessionDuration = durationMatch[1].trim();
    }
  }

  return {
    projectName,
    generatedAt,
    branch,
    sessionDuration,
    version: SESSION_MEMORY_VERSION,
  };
}

/**
 * T046: Parse executive summary section (5 bullets) into ExecutiveSummary interface
 */
function parseExecutiveSummary(lines: string[]): ExecutiveSummary {
  const sectionLines = extractSection(lines, '## Executive Summary');

  let projectDescription = '';
  let completionStatus = '';
  let currentPhase = '';
  let majorBlocker: string | null = null;
  let nextAction = '';

  for (const line of sectionLines) {
    // Parse numbered list items
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (match) {
      const content = match[1].trim();

      if (!projectDescription) {
        projectDescription = content;
      } else if (!completionStatus) {
        completionStatus = content;
      } else if (content.startsWith('Current phase:')) {
        currentPhase = content.replace('Current phase:', '').trim();
      } else if (content === 'No critical blockers' || content.toLowerCase().includes('no blocker')) {
        majorBlocker = null;
      } else if (content.startsWith('Next action:')) {
        nextAction = content.replace('Next action:', '').trim();
      } else if (!majorBlocker && !content.startsWith('Next action:')) {
        // This is likely the blocker line
        majorBlocker = content;
      }
    }
  }

  return {
    projectDescription,
    completionStatus,
    currentPhase,
    majorBlocker,
    nextAction,
  };
}

/**
 * T047: Parse task status table into PhaseStatus array
 */
function parseTaskStatus(lines: string[]): TaskStatus {
  const sectionLines = extractSection(lines, '## Task Status');

  let sourceFile = '';
  const phases: PhaseStatus[] = [];
  let currentTask: TaskReference | null = null;
  const nextTasks: TaskReference[] = [];

  let inTable = false;

  for (const line of sectionLines) {
    // Parse source file
    const sourceMatch = line.match(/^\*\*Source\*\*:\s*(.+)$/);
    if (sourceMatch) {
      sourceFile = sourceMatch[1].trim();
    }

    // Detect table start
    if (line.includes('| Phase |')) {
      inTable = true;
      continue;
    }

    // Skip table separator
    if (line.match(/^\|[-\s|]+\|$/)) {
      continue;
    }

    // Parse table rows
    if (inTable && line.startsWith('|') && !line.includes('---')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 4) {
        const name = cells[0];
        const completed = parseInt(cells[1], 10) || 0;
        const total = parseInt(cells[2], 10) || 0;
        const percentageStr = cells[3].replace('%', '');
        const percentage = parseFloat(percentageStr) || 0;

        phases.push({ name, completed, total, percentage });
      }
    }

    // Detect table end
    if (inTable && line === '') {
      inTable = false;
    }

    // Parse current task
    const currentMatch = line.match(/^\*\*Current Task\*\*:\s*(.+)$/);
    if (currentMatch) {
      const taskStr = currentMatch[1].trim();
      const taskMatch = taskStr.match(/^(T\d+)\s*-\s*(.+)$/);
      if (taskMatch) {
        currentTask = {
          id: taskMatch[1],
          title: taskMatch[2].trim(),
          phase: '', // Phase not included in current task line
        };
      }
    }

    // Parse next tasks
    const nextMatch = line.match(/^\*\*Next Tasks\*\*:\s*(.+)$/);
    if (nextMatch) {
      const taskIds = nextMatch[1].split(',').map((t) => t.trim());
      for (const id of taskIds) {
        if (id.match(/^T\d+$/)) {
          nextTasks.push({ id, title: '', phase: '' });
        }
      }
    }
  }

  return {
    sourceFile,
    phases,
    currentTask,
    nextTasks,
  };
}

/**
 * T048: Parse blockers section by priority (High/Medium/Low) into BlockerEntry array
 */
function parseBlockers(lines: string[]): BlockerEntry[] {
  const sectionLines = extractSection(lines, '## Blockers');
  const blockers: BlockerEntry[] = [];

  if (sectionLines.some((l) => l.includes('No blockers identified'))) {
    return blockers;
  }

  let currentPriority: 'high' | 'medium' | 'low' = 'medium';
  let currentBlocker: Partial<BlockerEntry> | null = null;

  for (const line of sectionLines) {
    // Detect priority headers
    if (line.includes('### High Priority')) {
      currentPriority = 'high';
      continue;
    }
    if (line.includes('### Medium Priority')) {
      currentPriority = 'medium';
      continue;
    }
    if (line.includes('### Low Priority')) {
      currentPriority = 'low';
      continue;
    }

    // Parse blocker title line: - **T032**: Title or - Title
    const blockerMatch = line.match(/^-\s+(?:\*\*([^*]+)\*\*:\s*)?(.+)$/);
    if (blockerMatch && !line.includes('**Description**') && !line.includes('**Action**')) {
      // Save previous blocker if exists
      if (currentBlocker && currentBlocker.title) {
        blockers.push({
          priority: currentBlocker.priority || currentPriority,
          taskId: currentBlocker.taskId || null,
          title: currentBlocker.title,
          description: currentBlocker.description || '',
          requiredAction: currentBlocker.requiredAction || '',
        });
      }

      currentBlocker = {
        priority: currentPriority,
        taskId: blockerMatch[1] || null,
        title: blockerMatch[2].trim(),
        description: '',
        requiredAction: '',
      };
    }

    // Parse description
    const descMatch = line.match(/^\s+-\s+\*\*Description\*\*:\s*(.+)$/);
    if (descMatch && currentBlocker) {
      currentBlocker.description = descMatch[1].trim();
    }

    // Parse action
    const actionMatch = line.match(/^\s+-\s+\*\*Action\*\*:\s*(.+)$/);
    if (actionMatch && currentBlocker) {
      currentBlocker.requiredAction = actionMatch[1].trim();
    }
  }

  // Don't forget last blocker
  if (currentBlocker && currentBlocker.title) {
    blockers.push({
      priority: currentBlocker.priority || currentPriority,
      taskId: currentBlocker.taskId || null,
      title: currentBlocker.title,
      description: currentBlocker.description || '',
      requiredAction: currentBlocker.requiredAction || '',
    });
  }

  return blockers;
}

/**
 * T049: Parse test results sections (unit and E2E) into TestResults interface
 */
function parseTestResults(lines: string[]): TestResults {
  const sectionLines = extractSection(lines, '## Test Results');

  let lastRun: string | null = null;

  // Parse last run timestamp
  for (const line of sectionLines) {
    const lastRunMatch = line.match(/^\*\*Last Run\*\*:\s*(.+)$/);
    if (lastRunMatch) {
      lastRun = lastRunMatch[1].trim();
      break;
    }
  }

  // Extract unit and e2e subsections
  const unitLines = extractSubsection(sectionLines, '### Unit Tests');
  const e2eLines = extractSubsection(sectionLines, '### E2E Tests');

  return {
    lastRun,
    unit: parseTestSuite(unitLines, 'Vitest', 'npm test'),
    e2e: parseTestSuite(e2eLines, 'Playwright', 'npm run test:e2e'),
  };
}

/**
 * Parse individual test suite from lines
 */
function parseTestSuite(lines: string[], defaultFramework: string, defaultCommand: string): TestSuite {
  let framework = defaultFramework;
  let status: 'passed' | 'failed' | 'not-run' = 'not-run';
  let passed = 0;
  let failed = 0;
  let total = 0;
  let percentage = 0;
  const failures: TestFailure[] = [];
  let command = defaultCommand;

  // Extract framework from header if present
  const headerLine = lines.find((l) => l.includes('### '));
  if (headerLine) {
    const frameworkMatch = headerLine.match(/\(([^)]+)\)/);
    if (frameworkMatch) {
      framework = frameworkMatch[1];
    }
  }

  for (const line of lines) {
    // Parse status line: - **Status**: ✅ 10/10 passing (100.0%) or - **Status**: Not run
    const statusMatch = line.match(/^\s*-\s+\*\*Status\*\*:\s*(.+)$/);
    if (statusMatch) {
      const statusContent = statusMatch[1].trim();
      if (statusContent.toLowerCase().includes('not run')) {
        status = 'not-run';
      } else if (statusContent.includes('✅')) {
        status = 'passed';
        const numbersMatch = statusContent.match(/(\d+)\/(\d+)\s+passing\s+\((\d+\.?\d*)%\)/);
        if (numbersMatch) {
          passed = parseInt(numbersMatch[1], 10);
          total = parseInt(numbersMatch[2], 10);
          percentage = parseFloat(numbersMatch[3]);
          failed = total - passed;
        }
      } else if (statusContent.includes('❌')) {
        status = 'failed';
        const numbersMatch = statusContent.match(/(\d+)\/(\d+)\s+passing\s+\((\d+\.?\d*)%\)/);
        if (numbersMatch) {
          passed = parseInt(numbersMatch[1], 10);
          total = parseInt(numbersMatch[2], 10);
          percentage = parseFloat(numbersMatch[3]);
          failed = total - passed;
        }
      }
    }

    // Parse command
    const commandMatch = line.match(/^\s*-\s+\*\*Command\*\*:\s*`([^`]+)`/);
    if (commandMatch) {
      command = commandMatch[1];
    }

    // Parse failures: - `file:line` - testName
    const failureMatch = line.match(/^\s+-\s+`([^`]+)`\s+-\s+(.+)$/);
    if (failureMatch) {
      const filePath = failureMatch[1];
      const testName = failureMatch[2].trim();
      const lineMatch = filePath.match(/^(.+):(\d+)$/);

      failures.push({
        file: lineMatch ? lineMatch[1] : filePath,
        line: lineMatch ? parseInt(lineMatch[2], 10) : undefined,
        testName,
      });
    }
  }

  return {
    framework,
    status,
    passed,
    failed,
    total,
    percentage,
    failures,
    command,
  };
}

/**
 * T050: Parse environment state sections into EnvironmentState interface
 */
function parseEnvironmentState(lines: string[]): EnvironmentState {
  const sectionLines = extractSection(lines, '## Environment State');

  return {
    servers: parseServers(sectionLines),
    dependencies: parseDependencies(sectionLines),
    build: parseBuildStatus(sectionLines),
  };
}

/**
 * Parse servers subsection
 */
function parseServers(lines: string[]): ServerInfo[] {
  const serverLines = extractSubsection(lines, '### Development Servers');
  const servers: ServerInfo[] = [];

  if (serverLines.some((l) => l.includes('No active development servers'))) {
    return servers;
  }

  for (const line of serverLines) {
    // Parse: - ✅ **node**: running on port 3000
    const serverMatch = line.match(/^-\s+[✅❌]\s+\*\*([^*]+)\*\*:\s*(running|stopped)\s+on\s+port\s+(\d+)/);
    if (serverMatch) {
      servers.push({
        process: serverMatch[1],
        status: serverMatch[2] as 'running' | 'stopped',
        port: parseInt(serverMatch[3], 10),
        url: `http://localhost:${serverMatch[3]}`,
      });
    }
  }

  return servers;
}

/**
 * Parse dependencies subsection
 */
function parseDependencies(lines: string[]): DependencyStatus {
  const depLines = extractSubsection(lines, '### Dependencies');

  let status: 'up-to-date' | 'outdated' | 'unknown' = 'unknown';
  let lastInstall: string | null = null;
  let packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown' = 'unknown';
  let outdatedCount: number | undefined;

  for (const line of depLines) {
    const statusMatch = line.match(/^\s*-\s+\*\*Status\*\*:\s*(.+)$/);
    if (statusMatch) {
      const val = statusMatch[1].trim().toLowerCase();
      if (val === 'up-to-date') status = 'up-to-date';
      else if (val === 'outdated') status = 'outdated';
      else status = 'unknown';
    }

    const installMatch = line.match(/^\s*-\s+\*\*Last Install\*\*:\s*(.+)$/);
    if (installMatch) {
      lastInstall = installMatch[1].trim();
    }

    const pmMatch = line.match(/^\s*-\s+\*\*Package Manager\*\*:\s*(.+)$/);
    if (pmMatch) {
      const pm = pmMatch[1].trim().toLowerCase();
      if (['npm', 'yarn', 'pnpm', 'bun'].includes(pm)) {
        packageManager = pm as 'npm' | 'yarn' | 'pnpm' | 'bun';
      }
    }

    const outdatedMatch = line.match(/^\s*-\s+\*\*Outdated\*\*:\s*(\d+)/);
    if (outdatedMatch) {
      outdatedCount = parseInt(outdatedMatch[1], 10);
    }
  }

  return { status, lastInstall, packageManager, outdatedCount };
}

/**
 * Parse build status subsection
 */
function parseBuildStatus(lines: string[]): BuildStatus {
  const buildLines = extractSubsection(lines, '### Build Status');

  let status: 'success' | 'failed' | 'not-run' = 'not-run';
  let lastBuild: string | null = null;
  let outputDir: string | undefined;
  const errors: string[] = [];

  for (const line of buildLines) {
    const statusMatch = line.match(/^\s*-\s+\*\*Status\*\*:\s*(.+)$/);
    if (statusMatch) {
      const val = statusMatch[1].trim().toLowerCase();
      if (val === 'success') status = 'success';
      else if (val === 'failed') status = 'failed';
      else status = 'not-run';
    }

    const buildMatch = line.match(/^\s*-\s+\*\*Last Build\*\*:\s*(.+)$/);
    if (buildMatch) {
      lastBuild = buildMatch[1].trim();
    }

    const outputMatch = line.match(/^\s*-\s+\*\*Output\*\*:\s*(.+)$/);
    if (outputMatch) {
      outputDir = outputMatch[1].trim();
    }

    // Parse error list items
    const errorMatch = line.match(/^\s+-\s+(?!.*\*\*)(.+)$/);
    if (errorMatch && !line.includes('**')) {
      errors.push(errorMatch[1].trim());
    }
  }

  return {
    status,
    lastBuild,
    outputDir,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * T051: Parse files needing attention list into FileReference array
 */
function parseFilesNeedingAttention(lines: string[]): FileReference[] {
  const sectionLines = extractSection(lines, '## Files Needing Attention');
  const files: FileReference[] = [];

  if (sectionLines.some((l) => l.includes('No files requiring attention'))) {
    return files;
  }

  for (const line of sectionLines) {
    // Parse: 1. `path:line` - reason
    const fileMatch = line.match(/^\d+\.\s+`([^`]+)`\s+-\s+(.+)$/);
    if (fileMatch) {
      const pathStr = fileMatch[1];
      const reason = fileMatch[2].trim();
      const lineMatch = pathStr.match(/^(.+):(\d+)$/);

      files.push({
        path: lineMatch ? lineMatch[1] : pathStr,
        line: lineMatch ? parseInt(lineMatch[2], 10) : undefined,
        reason,
        priority: 'medium', // Default priority (not encoded in markdown format)
      });
    }
  }

  return files;
}

/**
 * T052: Parse next steps list into NextStep array
 */
function parseNextSteps(lines: string[]): NextStep[] {
  const sectionLines = extractSection(lines, '## Next Steps');
  const steps: NextStep[] = [];

  if (sectionLines.some((l) => l.includes('No recommended actions'))) {
    return steps;
  }

  for (const line of sectionLines) {
    // Parse: 1. **Immediate**: action (reference)
    const stepMatch = line.match(/^\d+\.\s+\*\*([^*]+)\*\*:\s*(.+)$/);
    if (stepMatch) {
      const priorityStr = stepMatch[1].trim().toLowerCase();
      let action = stepMatch[2].trim();
      let reference: string | undefined;

      // Extract reference if present
      const refMatch = action.match(/^(.+)\s+\(([^)]+)\)$/);
      if (refMatch) {
        action = refMatch[1].trim();
        reference = refMatch[2];
      }

      let priority: 'immediate' | 'short-term' | 'medium-term' | 'long-term' = 'medium-term';
      if (priorityStr === 'immediate') priority = 'immediate';
      else if (priorityStr === 'short-term') priority = 'short-term';
      else if (priorityStr === 'medium-term') priority = 'medium-term';
      else if (priorityStr === 'long-term') priority = 'long-term';

      steps.push({ priority, action, reference });
    }
  }

  return steps;
}

/**
 * Extract lines between a section header and the next section or end
 */
function extractSection(lines: string[], sectionHeader: string): string[] {
  const result: string[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.startsWith(sectionHeader)) {
      inSection = true;
      continue;
    }

    if (inSection) {
      // Stop at next section (## header) or end marker
      if (line.match(/^##\s+/) || line.startsWith('---')) {
        break;
      }
      result.push(line);
    }
  }

  return result;
}

/**
 * Extract lines between a subsection header and the next subsection or section end
 */
function extractSubsection(lines: string[], subsectionHeader: string): string[] {
  const result: string[] = [];
  let inSubsection = false;

  for (const line of lines) {
    if (line.includes(subsectionHeader)) {
      inSubsection = true;
      result.push(line); // Include header for framework extraction
      continue;
    }

    if (inSubsection) {
      // Stop at next subsection (### header) or section (## header)
      if ((line.match(/^###\s+/) && !line.includes(subsectionHeader)) || line.match(/^##\s+/)) {
        break;
      }
      result.push(line);
    }
  }

  return result;
}
