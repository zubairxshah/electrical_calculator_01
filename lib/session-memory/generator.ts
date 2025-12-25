/**
 * Session memory generator
 * Feature: 001-session-memory-file
 *
 * Orchestrates all collectors to build SessionMemory structure
 */

import type { SessionMemory, ExecutiveSummary, NextStep, BlockerEntry } from './types';
import { SESSION_MEMORY_VERSION, MAX_FILE_SIZE_BYTES } from './types';
import { generateTimestamp } from './utils';
import { getCurrentBranch } from './git-utils';
import { getProjectName, getProjectDescription } from './project-utils';
import { collectTaskStatus } from './collectors/task-collector';
import { collectTestResults } from './collectors/test-collector';
import { collectEnvironmentState } from './collectors/env-collector';
import { collectBlockers } from './collectors/blocker-collector';
import { filterSensitiveData } from './filters/sensitive-data-filter';
import { serializeToMarkdown } from './markdown-serializer';

/**
 * Generate complete session memory structure
 * @param projectRoot - Project root directory (defaults to cwd)
 * @returns SessionMemory structure
 */
export async function generateSessionMemory(projectRoot?: string): Promise<SessionMemory> {
  const root = projectRoot || process.cwd();

  console.log('[generator] Collecting project state...');

  // Collect data from all sources (can run in parallel)
  const [taskStatus, testResults, environment, blockers, branch, projectName, projectDescription] =
    await Promise.all([
      collectTaskStatus(),
      collectTestResults(),
      collectEnvironmentState(),
      collectBlockers(),
      getCurrentBranch(),
      Promise.resolve(getProjectName(root)),
      Promise.resolve(getProjectDescription(root)),
    ]);

  console.log('[generator] Generating metadata and summary...');

  // Generate metadata
  const metadata = {
    projectName,
    generatedAt: generateTimestamp(),
    branch,
    version: SESSION_MEMORY_VERSION,
  };

  // Generate executive summary
  const summary = generateExecutiveSummary(
    projectName,
    projectDescription,
    taskStatus,
    blockers
  );

  // Generate next steps
  const nextSteps = generateNextSteps(blockers, taskStatus, testResults);

  // Extract files needing attention from test failures
  const filesNeedingAttention = extractFilesNeedingAttention(testResults, blockers);

  // Build SessionMemory structure
  let sessionMemory: SessionMemory = {
    metadata,
    summary,
    taskStatus,
    blockers,
    testResults,
    environment,
    filesNeedingAttention,
    nextSteps,
  };

  // Apply sensitive data filtering
  console.log('[generator] Applying sensitive data filtering...');
  sessionMemory = applySensitiveDataFilter(sessionMemory);

  // Validate file size
  console.log('[generator] Validating file size...');
  sessionMemory = validateAndTruncateSize(sessionMemory);

  console.log('[generator] Session memory generation complete');

  return sessionMemory;
}

/**
 * Generate executive summary from collected data
 */
function generateExecutiveSummary(
  projectName: string,
  projectDescription: string,
  taskStatus: any,
  blockers: BlockerEntry[]
): ExecutiveSummary {
  // 1. Project description
  const description = projectDescription || `${projectName} - Software development project`;

  // 2. Completion status
  const totalCompleted = taskStatus.phases.reduce((sum: number, p: any) => sum + p.completed, 0);
  const totalTasks = taskStatus.phases.reduce((sum: number, p: any) => sum + p.total, 0);
  const completionPercentage =
    totalTasks > 0 ? ((totalCompleted / totalTasks) * 100).toFixed(1) : '0.0';
  const completionStatus = `${totalCompleted}/${totalTasks} tasks complete (${completionPercentage}%)`;

  // 3. Current phase (phase with most incomplete tasks)
  let currentPhase = 'Not started';
  if (taskStatus.phases.length > 0) {
    const activePhase = taskStatus.phases.find(
      (p: any) => p.completed > 0 && p.completed < p.total
    );
    if (activePhase) {
      currentPhase = activePhase.name;
    } else if (taskStatus.phases[taskStatus.phases.length - 1].completed === taskStatus.phases[taskStatus.phases.length - 1].total) {
      currentPhase = 'Complete';
    } else {
      currentPhase = taskStatus.phases[0]?.name || 'Unknown';
    }
  }

  // 4. Major blocker (highest priority)
  const highPriorityBlockers = blockers.filter((b) => b.priority === 'high');
  const majorBlocker = highPriorityBlockers.length > 0 ? highPriorityBlockers[0].title : null;

  // 5. Next action
  let nextAction = 'Review project status and begin first task';
  if (taskStatus.currentTask) {
    nextAction = `Work on ${taskStatus.currentTask.id}: ${taskStatus.currentTask.title}`;
  } else if (highPriorityBlockers.length > 0) {
    nextAction = highPriorityBlockers[0].requiredAction;
  } else if (totalTasks > 0 && totalCompleted === totalTasks) {
    nextAction = 'All tasks complete - ready for review and deployment';
  }

  return {
    projectDescription: description,
    completionStatus,
    currentPhase,
    majorBlocker,
    nextAction,
  };
}

/**
 * Generate prioritized next steps
 */
function generateNextSteps(
  blockers: BlockerEntry[],
  taskStatus: any,
  testResults: any
): NextStep[] {
  const steps: NextStep[] = [];

  // Immediate: High priority blockers
  const highBlockers = blockers.filter((b) => b.priority === 'high').slice(0, 3);
  for (const blocker of highBlockers) {
    steps.push({
      priority: 'immediate',
      action: blocker.requiredAction,
      reference: blocker.taskId || undefined,
    });
  }

  // Immediate: Failing tests
  if (testResults.unit.status === 'failed' || testResults.e2e.status === 'failed') {
    const failedCount = testResults.unit.failed + testResults.e2e.failed;
    steps.push({
      priority: 'immediate',
      action: `Fix ${failedCount} failing test${failedCount > 1 ? 's' : ''}`,
    });
  }

  // Short-term: Current and next tasks
  if (taskStatus.currentTask) {
    steps.push({
      priority: 'short-term',
      action: `Complete ${taskStatus.currentTask.id}: ${taskStatus.currentTask.title}`,
      reference: taskStatus.currentTask.id,
    });
  }

  // Short-term: Next phase if current phase near completion
  const activePhase = taskStatus.phases.find((p: any) => p.completed > 0 && p.completed < p.total);
  if (activePhase && activePhase.percentage > 80) {
    const nextPhaseIndex = taskStatus.phases.indexOf(activePhase) + 1;
    if (nextPhaseIndex < taskStatus.phases.length) {
      const nextPhase = taskStatus.phases[nextPhaseIndex];
      steps.push({
        priority: 'short-term',
        action: `Begin ${nextPhase.name} phase`,
      });
    }
  }

  // Medium-term: Medium priority blockers
  const mediumBlockers = blockers.filter((b) => b.priority === 'medium').slice(0, 2);
  for (const blocker of mediumBlockers) {
    steps.push({
      priority: 'medium-term',
      action: blocker.requiredAction,
      reference: blocker.taskId || undefined,
    });
  }

  // Limit to 10 steps
  return steps.slice(0, 10);
}

/**
 * Extract files needing attention from test failures and blockers
 */
function extractFilesNeedingAttention(testResults: any, blockers: BlockerEntry[]): any[] {
  const files: any[] = [];

  // Add failing test files
  for (const failure of testResults.unit.failures) {
    files.push({
      path: failure.file,
      line: failure.line,
      reason: `Failing test: ${failure.testName}`,
      priority: 'high' as const,
    });
  }

  for (const failure of testResults.e2e.failures) {
    files.push({
      path: failure.file,
      line: failure.line,
      reason: `Failing E2E test: ${failure.testName}`,
      priority: 'high' as const,
    });
  }

  // Add files mentioned in high-priority blockers
  for (const blocker of blockers.filter((b) => b.priority === 'high')) {
    // Extract file path from blocker description if present
    const fileMatch = blocker.description.match(/([^\/\s]+\/[^:]+\.[a-z]+)/i);
    if (fileMatch) {
      files.push({
        path: fileMatch[1],
        reason: blocker.title,
        priority: 'high' as const,
      });
    }
  }

  // Remove duplicates and limit to 50
  const uniqueFiles = Array.from(new Map(files.map((f) => [f.path, f])).values());
  return uniqueFiles.slice(0, 50);
}

/**
 * Apply sensitive data filtering to entire SessionMemory structure
 */
function applySensitiveDataFilter(sessionMemory: SessionMemory): SessionMemory {
  // Serialize to string, filter, then we'll use the filtered version
  // For now, we apply filtering at the string level in serialization
  // This function is a placeholder for any object-level filtering needed

  // Filter blocker descriptions and actions
  sessionMemory.blockers = sessionMemory.blockers.map((blocker) => ({
    ...blocker,
    description: filterSensitiveData(blocker.description),
    requiredAction: filterSensitiveData(blocker.requiredAction),
  }));

  // Filter test failure messages
  sessionMemory.testResults.unit.failures = sessionMemory.testResults.unit.failures.map((f) => ({
    ...f,
    message: f.message ? filterSensitiveData(f.message) : undefined,
  }));

  sessionMemory.testResults.e2e.failures = sessionMemory.testResults.e2e.failures.map((f) => ({
    ...f,
    message: f.message ? filterSensitiveData(f.message) : undefined,
  }));

  return sessionMemory;
}

/**
 * Validate file size and truncate if necessary
 */
function validateAndTruncateSize(sessionMemory: SessionMemory): SessionMemory {
  // Serialize to check size
  const markdown = serializeToMarkdown(sessionMemory);
  const size = Buffer.byteLength(markdown, 'utf-8');

  if (size <= MAX_FILE_SIZE_BYTES) {
    return sessionMemory; // Size OK
  }

  console.warn(`[generator] File size ${size} exceeds ${MAX_FILE_SIZE_BYTES}, truncating...`);

  // Progressive truncation strategy
  let truncated = { ...sessionMemory };

  // 1. Reduce files needing attention to top 10
  if (truncated.filesNeedingAttention.length > 10) {
    truncated.filesNeedingAttention = truncated.filesNeedingAttention.slice(0, 10);
  }

  // 2. Reduce blockers to high priority only
  if (truncated.blockers.length > 20) {
    truncated.blockers = truncated.blockers.filter((b) => b.priority === 'high').slice(0, 20);
  }

  // 3. Reduce next steps to top 3
  if (truncated.nextSteps.length > 3) {
    truncated.nextSteps = truncated.nextSteps.slice(0, 3);
  }

  // 4. Reduce test failures to 5 each
  if (truncated.testResults.unit.failures.length > 5) {
    truncated.testResults.unit.failures = truncated.testResults.unit.failures.slice(0, 5);
  }
  if (truncated.testResults.e2e.failures.length > 5) {
    truncated.testResults.e2e.failures = truncated.testResults.e2e.failures.slice(0, 5);
  }

  return truncated;
}
