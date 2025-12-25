/**
 * Unit tests for markdown-serializer
 * Feature: 001-session-memory-file
 */

import { describe, it, expect } from 'vitest';
import { serializeToMarkdown } from '@/lib/session-memory/markdown-serializer';
import type { SessionMemory } from '@/lib/session-memory/types';

describe('markdown-serializer', () => {
  const mockSessionMemory: SessionMemory = {
    metadata: {
      projectName: 'TestProject',
      generatedAt: '2025-12-25T14:30:00Z',
      branch: 'main',
      version: '1.0',
    },
    summary: {
      projectDescription: 'A test project for validation',
      completionStatus: '10/20 tasks complete (50.0%)',
      currentPhase: 'Core Development',
      majorBlocker: 'Missing .env file',
      nextAction: 'Create .env file',
    },
    taskStatus: {
      sourceFile: 'specs/test/tasks.md',
      phases: [
        { name: 'Setup', completed: 5, total: 5, percentage: 100.0 },
        { name: 'Core', completed: 5, total: 15, percentage: 33.3 },
      ],
      currentTask: { id: 'T011', title: 'Implement feature X', phase: 'Core' },
      nextTasks: [
        { id: 'T011', title: 'Implement feature X', phase: 'Core' },
        { id: 'T012', title: 'Implement feature Y', phase: 'Core' },
      ],
    },
    blockers: [
      {
        priority: 'high',
        taskId: 'T010',
        title: 'Missing .env file',
        description: 'Database connection requires .env',
        requiredAction: 'Create .env file from template',
      },
    ],
    testResults: {
      lastRun: '2025-12-25T14:00:00Z',
      unit: {
        framework: 'Vitest',
        status: 'failed',
        passed: 47,
        failed: 3,
        total: 50,
        percentage: 94.0,
        failures: [
          {
            file: '__tests__/lib/utils.test.ts',
            line: 42,
            testName: 'should handle edge case',
            message: 'Expected 10, received 9',
          },
        ],
        command: 'npm test',
      },
      e2e: {
        framework: 'Playwright',
        status: 'not-run',
        passed: 0,
        failed: 0,
        total: 0,
        percentage: 0,
        failures: [],
        command: 'npm run test:e2e',
      },
    },
    environment: {
      servers: [
        {
          process: 'node',
          port: 3001,
          url: 'http://localhost:3001',
          pid: 12345,
          status: 'running',
        },
      ],
      dependencies: {
        status: 'up-to-date',
        lastInstall: '2025-12-24T10:00:00Z',
        packageManager: 'npm',
      },
      build: {
        status: 'success',
        lastBuild: '2025-12-25T13:00:00Z',
        outputDir: '.next/',
      },
    },
    filesNeedingAttention: [
      {
        path: '__tests__/lib/utils.test.ts',
        line: 42,
        reason: 'Failing test',
        priority: 'high',
      },
    ],
    nextSteps: [
      {
        priority: 'immediate',
        action: 'Fix failing test in utils.test.ts',
        reference: '__tests__/lib/utils.test.ts:42',
      },
      {
        priority: 'short-term',
        action: 'Complete Core phase tasks',
      },
    ],
  };

  it('should convert SessionMemory to markdown string', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should include all required sections', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('# Session Memory: TestProject');
    expect(result).toContain('## Executive Summary');
    expect(result).toContain('## Task Status');
    expect(result).toContain('## Blockers');
    expect(result).toContain('## Test Results');
    expect(result).toContain('## Environment State');
    expect(result).toContain('## Files Needing Attention');
    expect(result).toContain('## Next Steps');
  });

  it('should format metadata correctly', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('**Generated**: 2025-12-25T14:30:00Z');
    expect(result).toContain('**Branch**: main');
  });

  it('should format executive summary as 5 bullets', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    const summaryMatch = result.match(/## Executive Summary\n\n(1\..*\n2\..*\n3\..*\n4\..*\n5\..*)/);
    expect(summaryMatch).toBeTruthy();
  });

  it('should format task status as table', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('| Phase | Completed | Total | Percentage |');
    expect(result).toContain('| Setup | 5 | 5 | 100.0% |');
    expect(result).toContain('| Core | 5 | 15 | 33.3% |');
  });

  it('should group blockers by priority', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('### High Priority');
    expect(result).toContain('**T010**: Missing .env file');
  });

  it('should format test results with status icons', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('### Unit Tests (Vitest)');
    expect(result).toContain('47/50 passing (94.0%)');
    expect(result).toContain('`__tests__/lib/utils.test.ts:42`');
  });

  it('should format environment state with server details', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('### Development Servers');
    expect(result).toContain('**node**: running on port 3001');
    expect(result).toContain('http://localhost:3001');
  });

  it('should format files needing attention as numbered list', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('1. `__tests__/lib/utils.test.ts:42` - Failing test');
  });

  it('should format next steps with priority labels', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('1. **Immediate**: Fix failing test');
    expect(result).toContain('2. **Short-term**: Complete Core phase');
  });

  it('should include footer with version', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    expect(result).toContain('Generated by Claude Code Session Memory v1.0');
  });

  it('should handle empty arrays gracefully', () => {
    const emptyMemory: SessionMemory = {
      ...mockSessionMemory,
      blockers: [],
      filesNeedingAttention: [],
      nextSteps: [],
    };

    const result = serializeToMarkdown(emptyMemory);

    expect(result).toContain('No blockers identified');
    expect(result).toContain('No files requiring attention');
  });

  it('should produce valid markdown', () => {
    const result = serializeToMarkdown(mockSessionMemory);

    // Check for common markdown syntax
    expect(result).toMatch(/^# /m); // Header
    expect(result).toMatch(/\*\*.*\*\*/); // Bold
    expect(result).toMatch(/\| .* \|/); // Table
    expect(result).toMatch(/- /); // List
  });
});
