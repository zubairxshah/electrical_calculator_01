/**
 * Summary Generator Tests
 * Feature: 001-session-memory-file
 *
 * Tests for executive summary generation (T065-T068)
 */

import { describe, it, expect } from 'vitest';
import {
  generateExecutiveSummary,
  generateProjectDescription,
  generateCompletionStatus,
  generateCurrentPhase,
  generateMajorBlocker,
  generateNextAction,
  generateNextSteps,
} from '@/lib/session-memory/summary-generator';
import type { TaskStatus, BlockerEntry, TestResults } from '@/lib/session-memory/types';

describe('summary-generator', () => {
  // T065: Test for 5 sentences covering project, completion, phase, blocker, next action
  describe('generateExecutiveSummary', () => {
    it('should generate all 5 summary fields', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'specs/001-feature/tasks.md',
        phases: [
          { name: 'Setup', completed: 5, total: 5, percentage: 100 },
          { name: 'Core', completed: 3, total: 10, percentage: 30 },
        ],
        currentTask: { id: 'T008', title: 'Implement core logic', phase: 'Core' },
        nextTasks: [],
      };

      const blockers: BlockerEntry[] = [
        {
          priority: 'high',
          taskId: 'T008',
          title: 'Missing configuration',
          description: 'Need to configure database',
          requiredAction: 'Create .env file',
        },
      ];

      const summary = generateExecutiveSummary(
        'TestProject',
        'A test project description',
        taskStatus,
        blockers
      );

      expect(summary.projectDescription).toBe('A test project description');
      expect(summary.completionStatus).toBe('8/15 tasks complete (53.3%)');
      expect(summary.currentPhase).toBe('Core');
      expect(summary.majorBlocker).toBe('Missing configuration');
      expect(summary.nextAction).toBe('Create .env file');
    });

    // T066: Test with no blockers (majorBlocker = null)
    it('should handle no blockers case', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [
          { name: 'Setup', completed: 3, total: 5, percentage: 60 },
        ],
        currentTask: { id: 'T004', title: 'Continue setup', phase: 'Setup' },
        nextTasks: [],
      };

      const summary = generateExecutiveSummary(
        'TestProject',
        null,
        taskStatus,
        []
      );

      expect(summary.majorBlocker).toBeNull();
      expect(summary.nextAction).toBe('Work on T004: Continue setup');
    });

    // T067: Test with 100% complete project
    it('should handle 100% complete project', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [
          { name: 'Setup', completed: 5, total: 5, percentage: 100 },
          { name: 'Core', completed: 10, total: 10, percentage: 100 },
          { name: 'Polish', completed: 5, total: 5, percentage: 100 },
        ],
        currentTask: null,
        nextTasks: [],
      };

      const summary = generateExecutiveSummary(
        'TestProject',
        'Complete project',
        taskStatus,
        []
      );

      expect(summary.completionStatus).toBe('20/20 tasks complete (100.0%)');
      expect(summary.currentPhase).toBe('Complete');
      expect(summary.nextAction).toBe('All tasks complete - ready for review and deployment');
    });
  });

  describe('generateProjectDescription', () => {
    it('should return package.json description when available', () => {
      const result = generateProjectDescription('MyProject', 'Custom description from package.json');
      expect(result).toBe('Custom description from package.json');
    });

    it('should fallback to project name when no description', () => {
      const result = generateProjectDescription('MyProject', null);
      expect(result).toBe('MyProject - Software development project');
    });

    it('should fallback when description is empty string', () => {
      const result = generateProjectDescription('MyProject', '   ');
      expect(result).toBe('MyProject - Software development project');
    });
  });

  describe('generateCompletionStatus', () => {
    it('should calculate correct completion with percentage', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [
          { name: 'Phase 1', completed: 5, total: 10, percentage: 50 },
          { name: 'Phase 2', completed: 3, total: 10, percentage: 30 },
        ],
        currentTask: null,
        nextTasks: [],
      };

      const result = generateCompletionStatus(taskStatus);
      expect(result).toBe('8/20 tasks complete (40.0%)');
    });

    it('should handle zero tasks', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [],
        currentTask: null,
        nextTasks: [],
      };

      const result = generateCompletionStatus(taskStatus);
      expect(result).toBe('0/0 tasks complete (0.0%)');
    });
  });

  describe('generateCurrentPhase', () => {
    it('should identify active phase', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [
          { name: 'Setup', completed: 5, total: 5, percentage: 100 },
          { name: 'Core', completed: 3, total: 10, percentage: 30 },
          { name: 'Polish', completed: 0, total: 5, percentage: 0 },
        ],
        currentTask: null,
        nextTasks: [],
      };

      const result = generateCurrentPhase(taskStatus);
      expect(result).toBe('Core');
    });

    it('should return Complete when all phases done', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [
          { name: 'Setup', completed: 5, total: 5, percentage: 100 },
          { name: 'Core', completed: 10, total: 10, percentage: 100 },
        ],
        currentTask: null,
        nextTasks: [],
      };

      const result = generateCurrentPhase(taskStatus);
      expect(result).toBe('Complete');
    });

    it('should return Not started for empty phases', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [],
        currentTask: null,
        nextTasks: [],
      };

      const result = generateCurrentPhase(taskStatus);
      expect(result).toBe('Not started');
    });
  });

  describe('generateMajorBlocker', () => {
    it('should return highest priority blocker title', () => {
      const blockers: BlockerEntry[] = [
        { priority: 'low', taskId: null, title: 'Low issue', description: '', requiredAction: 'Fix' },
        { priority: 'high', taskId: 'T001', title: 'Critical issue', description: '', requiredAction: 'Fix now' },
        { priority: 'medium', taskId: null, title: 'Medium issue', description: '', requiredAction: 'Fix soon' },
      ];

      const result = generateMajorBlocker(blockers);
      expect(result).toBe('Critical issue');
    });

    it('should return null when no blockers', () => {
      const result = generateMajorBlocker([]);
      expect(result).toBeNull();
    });

    it('should return null when no high priority blockers', () => {
      const blockers: BlockerEntry[] = [
        { priority: 'low', taskId: null, title: 'Low issue', description: '', requiredAction: 'Fix' },
        { priority: 'medium', taskId: null, title: 'Medium issue', description: '', requiredAction: 'Fix soon' },
      ];

      const result = generateMajorBlocker(blockers);
      expect(result).toBeNull();
    });
  });

  describe('generateNextAction', () => {
    it('should prioritize high priority blocker action', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [{ name: 'Setup', completed: 0, total: 5, percentage: 0 }],
        currentTask: { id: 'T001', title: 'First task', phase: 'Setup' },
        nextTasks: [],
      };

      const blockers: BlockerEntry[] = [
        { priority: 'high', taskId: 'T001', title: 'Blocker', description: '', requiredAction: 'Fix the blocker first' },
      ];

      const result = generateNextAction(taskStatus, blockers);
      expect(result).toBe('Fix the blocker first');
    });

    it('should use current task when no high blockers', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [{ name: 'Setup', completed: 2, total: 5, percentage: 40 }],
        currentTask: { id: 'T003', title: 'Current work', phase: 'Setup' },
        nextTasks: [],
      };

      const result = generateNextAction(taskStatus, []);
      expect(result).toBe('Work on T003: Current work');
    });
  });

  // T068: Integration test - verify executive summary appears first in markdown
  describe('generateNextSteps', () => {
    it('should generate steps in priority order', () => {
      const blockers: BlockerEntry[] = [
        { priority: 'high', taskId: 'T001', title: 'High', description: '', requiredAction: 'Fix high' },
        { priority: 'medium', taskId: 'T002', title: 'Medium', description: '', requiredAction: 'Fix medium' },
      ];

      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [{ name: 'Setup', completed: 2, total: 5, percentage: 40 }],
        currentTask: { id: 'T003', title: 'Current', phase: 'Setup' },
        nextTasks: [],
      };

      const testResults: TestResults = {
        lastRun: null,
        unit: { framework: 'Vitest', status: 'passed', passed: 10, failed: 0, total: 10, percentage: 100, failures: [], command: 'npm test' },
        e2e: { framework: 'Playwright', status: 'passed', passed: 5, failed: 0, total: 5, percentage: 100, failures: [], command: 'npm run e2e' },
      };

      const steps = generateNextSteps(blockers, taskStatus, testResults);

      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].priority).toBe('immediate');
      expect(steps[0].action).toBe('Fix high');
    });

    it('should include failing tests as immediate priority', () => {
      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [],
        currentTask: null,
        nextTasks: [],
      };

      const testResults: TestResults = {
        lastRun: '2025-12-25T10:00:00Z',
        unit: { framework: 'Vitest', status: 'failed', passed: 8, failed: 2, total: 10, percentage: 80, failures: [], command: 'npm test' },
        e2e: { framework: 'Playwright', status: 'passed', passed: 5, failed: 0, total: 5, percentage: 100, failures: [], command: 'npm run e2e' },
      };

      const steps = generateNextSteps([], taskStatus, testResults);

      const testStep = steps.find((s) => s.action.includes('failing test'));
      expect(testStep).toBeDefined();
      expect(testStep?.priority).toBe('immediate');
    });

    it('should limit to 10 steps', () => {
      const blockers: BlockerEntry[] = Array(20).fill(null).map((_, i) => ({
        priority: 'high' as const,
        taskId: `T${i}`,
        title: `Blocker ${i}`,
        description: '',
        requiredAction: `Fix blocker ${i}`,
      }));

      const taskStatus: TaskStatus = {
        sourceFile: 'tasks.md',
        phases: [],
        currentTask: null,
        nextTasks: [],
      };

      const testResults: TestResults = {
        lastRun: null,
        unit: { framework: 'Vitest', status: 'not-run', passed: 0, failed: 0, total: 0, percentage: 0, failures: [], command: 'npm test' },
        e2e: { framework: 'Playwright', status: 'not-run', passed: 0, failed: 0, total: 0, percentage: 0, failures: [], command: 'npm run e2e' },
      };

      const steps = generateNextSteps(blockers, taskStatus, testResults);

      expect(steps.length).toBeLessThanOrEqual(10);
    });
  });
});
