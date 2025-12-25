/**
 * Task collector for session memory file
 * Feature: 001-session-memory-file
 *
 * Parses tasks.md to extract task completion status
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TaskStatus, PhaseStatus, TaskReference } from '../types';

/**
 * Collect task status from tasks.md file
 * @param tasksContent - Content of tasks.md (for testing) or undefined to read from file
 * @param tasksPath - Path to tasks.md file
 * @returns TaskStatus structure with phase completion and next tasks
 */
export async function collectTaskStatus(
  tasksContent?: string,
  tasksPath?: string
): Promise<TaskStatus> {
  // Default path if not provided
  const defaultPath = findTasksFile();
  const filePath = tasksPath || defaultPath;

  // Read content from file if not provided
  let content = tasksContent;
  if (!content) {
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.warn('[task-collector] Failed to read tasks.md:', (error as Error).message);
      return createEmptyTaskStatus(filePath);
    }
  }

  // Parse the markdown content
  const phases = parsePhases(content);
  const allTasks = extractAllTasks(content);
  const incompleteTasks = allTasks.filter((t) => !t.completed);

  return {
    sourceFile: filePath,
    phases,
    currentTask: incompleteTasks.length > 0 ? incompleteTasks[0] : null,
    nextTasks: incompleteTasks.slice(0, 5), // Max 5 next tasks
  };
}

/**
 * Find tasks.md file in project
 */
function findTasksFile(): string {
  const possiblePaths = [
    'tasks.md',
    'specs/tasks.md',
    path.join(process.cwd(), 'tasks.md'),
  ];

  // Check for feature-specific tasks.md
  const specsDirs = fs.existsSync('specs') ? fs.readdirSync('specs') : [];
  for (const dir of specsDirs) {
    const featureTasksPath = path.join('specs', dir, 'tasks.md');
    if (fs.existsSync(featureTasksPath)) {
      possiblePaths.unshift(featureTasksPath);
    }
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return 'tasks.md'; // Default
}

/**
 * Parse phases from tasks.md content
 */
function parsePhases(content: string): PhaseStatus[] {
  const phases: PhaseStatus[] = [];
  const lines = content.split('\n');
  let currentPhase: { name: string; completed: number; total: number } | null = null;

  for (const line of lines) {
    // Detect phase headers: ## Phase N: Name or ## Phase: Name
    const phaseMatch = line.match(/^##\s+Phase\s*\d*:?\s*(.+)/i);
    if (phaseMatch) {
      // Save previous phase
      if (currentPhase) {
        phases.push({
          ...currentPhase,
          percentage: currentPhase.total > 0
            ? Math.round((currentPhase.completed / currentPhase.total) * 1000) / 10
            : 0,
        });
      }

      // Start new phase
      currentPhase = {
        name: phaseMatch[1].trim(),
        completed: 0,
        total: 0,
      };
      continue;
    }

    // Count tasks in current phase
    if (currentPhase) {
      // Task line: - [ ] or - [x] or - [X]
      const taskMatch = line.match(/^-\s+\[([ xX])\]/);
      if (taskMatch) {
        currentPhase.total++;
        if (taskMatch[1].toLowerCase() === 'x') {
          currentPhase.completed++;
        }
      }
    }
  }

  // Save last phase
  if (currentPhase) {
    phases.push({
      ...currentPhase,
      percentage: currentPhase.total > 0
        ? Math.round((currentPhase.completed / currentPhase.total) * 1000) / 10
        : 0,
    });
  }

  return phases;
}

/**
 * Extract all tasks from content
 */
function extractAllTasks(content: string): Array<TaskReference & { completed: boolean }> {
  const tasks: Array<TaskReference & { completed: boolean }> = [];
  const lines = content.split('\n');
  let currentPhase = 'Unknown';

  for (const line of lines) {
    // Update current phase
    const phaseMatch = line.match(/^##\s+Phase\s*\d*:?\s*(.+)/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim();
      continue;
    }

    // Extract task
    const taskMatch = line.match(/^-\s+\[([ xX])\]\s+(T\d+)\s+(?:\[P\]\s+)?(?:\[US\d+\]\s+)?(.+)/);
    if (taskMatch) {
      const completed = taskMatch[1].toLowerCase() === 'x';
      const id = taskMatch[2];
      const title = taskMatch[3].trim();

      tasks.push({
        id,
        title,
        phase: currentPhase,
        completed,
      });
    }
  }

  return tasks;
}

/**
 * Create empty task status structure
 */
function createEmptyTaskStatus(filePath: string): TaskStatus {
  return {
    sourceFile: filePath,
    phases: [],
    currentTask: null,
    nextTasks: [],
  };
}
