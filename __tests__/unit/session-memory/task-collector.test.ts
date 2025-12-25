/**
 * Unit tests for task-collector
 * Feature: 001-session-memory-file
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { collectTaskStatus } from '@/lib/session-memory/collectors/task-collector';
import type { TaskStatus } from '@/lib/session-memory/types';

describe('task-collector', () => {
  const mockTasksMd = `# Tasks: Test Project

## Phase 1: Setup
- [x] T001 Setup project structure
- [x] T002 Install dependencies
- [ ] T003 Configure linting

## Phase 2: Core Features
- [x] T004 Implement feature A
- [x] T005 Implement feature B
- [ ] T006 Implement feature C
- [ ] T007 Implement feature D
- [ ] T008 Implement feature E

## Phase 3: Testing
- [ ] T009 Write unit tests
- [ ] T010 Write integration tests
`;

  it('should parse tasks.md and extract phase completion status', async () => {
    const result = await collectTaskStatus(mockTasksMd, 'specs/test/tasks.md');

    expect(result).toBeDefined();
    expect(result.sourceFile).toBe('specs/test/tasks.md');
    expect(result.phases).toHaveLength(3);
  });

  it('should calculate correct completion counts per phase', async () => {
    const result = await collectTaskStatus(mockTasksMd, 'specs/test/tasks.md');

    // Phase 1: 2/3 complete (66.7%)
    expect(result.phases[0].name).toBe('Setup');
    expect(result.phases[0].completed).toBe(2);
    expect(result.phases[0].total).toBe(3);
    expect(result.phases[0].percentage).toBeCloseTo(66.7, 1);

    // Phase 2: 2/5 complete (40%)
    expect(result.phases[1].name).toBe('Core Features');
    expect(result.phases[1].completed).toBe(2);
    expect(result.phases[1].total).toBe(5);
    expect(result.phases[1].percentage).toBe(40.0);

    // Phase 3: 0/2 complete (0%)
    expect(result.phases[2].name).toBe('Testing');
    expect(result.phases[2].completed).toBe(0);
    expect(result.phases[2].total).toBe(2);
    expect(result.phases[2].percentage).toBe(0.0);
  });

  it('should identify current task (first incomplete)', async () => {
    const result = await collectTaskStatus(mockTasksMd, 'specs/test/tasks.md');

    expect(result.currentTask).toBeDefined();
    expect(result.currentTask?.id).toBe('T003');
    expect(result.currentTask?.title).toContain('Configure linting');
    expect(result.currentTask?.phase).toBe('Setup');
  });

  it('should extract next tasks (max 5)', async () => {
    const result = await collectTaskStatus(mockTasksMd, 'specs/test/tasks.md');

    expect(result.nextTasks).toHaveLength(5);
    expect(result.nextTasks[0].id).toBe('T003');
    expect(result.nextTasks[1].id).toBe('T006');
    expect(result.nextTasks[2].id).toBe('T007');
    expect(result.nextTasks[3].id).toBe('T008');
    expect(result.nextTasks[4].id).toBe('T009');
  });

  it('should handle empty tasks.md', async () => {
    const result = await collectTaskStatus('', 'specs/test/tasks.md');

    expect(result.phases).toHaveLength(0);
    expect(result.currentTask).toBeNull();
    expect(result.nextTasks).toHaveLength(0);
  });

  it('should handle all tasks complete', async () => {
    const allCompleteMd = `## Phase 1: Done
- [x] T001 Task one
- [x] T002 Task two
`;

    const result = await collectTaskStatus(allCompleteMd, 'specs/test/tasks.md');

    expect(result.currentTask).toBeNull();
    expect(result.nextTasks).toHaveLength(0);
    expect(result.phases[0].percentage).toBe(100.0);
  });
});
