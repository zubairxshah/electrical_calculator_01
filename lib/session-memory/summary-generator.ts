/**
 * Summary Generator Module
 * Feature: 001-session-memory-file
 *
 * Generates executive summary from session memory data
 * Extracted from generator.ts for better testability (T069)
 */

import type { ExecutiveSummary, BlockerEntry, TaskStatus, NextStep, TestResults } from './types';
import { getProjectDescription } from './project-utils';

/**
 * Generate 5-sentence executive summary for quick scanning (FR-007)
 *
 * Summary structure:
 * 1. projectDescription - What is this project?
 * 2. completionStatus - What's done? (X/Y tasks, percentage)
 * 3. currentPhase - What phase are we in?
 * 4. majorBlocker - What's blocked? (or null)
 * 5. nextAction - What should we do next?
 *
 * @param projectName - Name of the project
 * @param projectDescription - Description from package.json or fallback
 * @param taskStatus - Task completion status
 * @param blockers - List of blockers
 * @returns ExecutiveSummary object
 */
export function generateExecutiveSummary(
  projectName: string,
  projectDescription: string | null,
  taskStatus: TaskStatus,
  blockers: BlockerEntry[]
): ExecutiveSummary {
  return {
    projectDescription: generateProjectDescription(projectName, projectDescription),
    completionStatus: generateCompletionStatus(taskStatus),
    currentPhase: generateCurrentPhase(taskStatus),
    majorBlocker: generateMajorBlocker(blockers),
    nextAction: generateNextAction(taskStatus, blockers),
  };
}

/**
 * Generate project description (T070)
 * Reads from package.json description or uses project name
 */
export function generateProjectDescription(
  projectName: string,
  projectDescription: string | null
): string {
  if (projectDescription && projectDescription.trim().length > 0) {
    return projectDescription;
  }
  return `${projectName} - Software development project`;
}

/**
 * Generate completion status (T071)
 * Calculates X/Y tasks complete with percentage
 */
export function generateCompletionStatus(taskStatus: TaskStatus): string {
  const totalCompleted = taskStatus.phases.reduce((sum, p) => sum + p.completed, 0);
  const totalTasks = taskStatus.phases.reduce((sum, p) => sum + p.total, 0);

  if (totalTasks === 0) {
    return '0/0 tasks complete (0.0%)';
  }

  const completionPercentage = ((totalCompleted / totalTasks) * 100).toFixed(1);
  return `${totalCompleted}/${totalTasks} tasks complete (${completionPercentage}%)`;
}

/**
 * Generate current phase (T072)
 * Identifies phase with most incomplete tasks
 */
export function generateCurrentPhase(taskStatus: TaskStatus): string {
  if (taskStatus.phases.length === 0) {
    return 'Not started';
  }

  // Find first phase that's in progress (some completed but not all)
  const activePhase = taskStatus.phases.find(
    (p) => p.completed > 0 && p.completed < p.total
  );

  if (activePhase) {
    return activePhase.name;
  }

  // Check if all phases are complete
  const lastPhase = taskStatus.phases[taskStatus.phases.length - 1];
  if (lastPhase && lastPhase.completed === lastPhase.total && lastPhase.total > 0) {
    return 'Complete';
  }

  // Find first phase with incomplete tasks
  const firstIncomplete = taskStatus.phases.find((p) => p.completed < p.total);
  if (firstIncomplete) {
    return firstIncomplete.name;
  }

  return taskStatus.phases[0]?.name || 'Unknown';
}

/**
 * Generate major blocker (T073)
 * Selects highest-priority blocker or null if none
 */
export function generateMajorBlocker(blockers: BlockerEntry[]): string | null {
  const highPriorityBlockers = blockers.filter((b) => b.priority === 'high');

  if (highPriorityBlockers.length > 0) {
    return highPriorityBlockers[0].title;
  }

  return null;
}

/**
 * Generate next action (T074)
 * Derives from highest-priority blocker or first incomplete task
 */
export function generateNextAction(
  taskStatus: TaskStatus,
  blockers: BlockerEntry[]
): string {
  // Check for high-priority blockers first
  const highPriorityBlockers = blockers.filter((b) => b.priority === 'high');
  if (highPriorityBlockers.length > 0) {
    return highPriorityBlockers[0].requiredAction;
  }

  // Check for current task
  if (taskStatus.currentTask) {
    return `Work on ${taskStatus.currentTask.id}: ${taskStatus.currentTask.title}`;
  }

  // Check if all tasks complete
  const totalCompleted = taskStatus.phases.reduce((sum, p) => sum + p.completed, 0);
  const totalTasks = taskStatus.phases.reduce((sum, p) => sum + p.total, 0);

  if (totalTasks > 0 && totalCompleted === totalTasks) {
    return 'All tasks complete - ready for review and deployment';
  }

  // Check for next tasks
  if (taskStatus.nextTasks && taskStatus.nextTasks.length > 0) {
    const nextTask = taskStatus.nextTasks[0];
    return `Begin ${nextTask.id}: ${nextTask.title}`;
  }

  return 'Review project status and begin first task';
}

/**
 * Generate prioritized next steps
 * Used by generator.ts but exposed for testing
 */
export function generateNextSteps(
  blockers: BlockerEntry[],
  taskStatus: TaskStatus,
  testResults: TestResults
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
  const activePhase = taskStatus.phases.find((p) => p.completed > 0 && p.completed < p.total);
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
