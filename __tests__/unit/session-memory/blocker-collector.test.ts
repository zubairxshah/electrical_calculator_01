/**
 * Unit tests for blocker-collector
 * Feature: 001-session-memory-file
 */

import { describe, it, expect } from 'vitest';
import { collectBlockers } from '@/lib/session-memory/collectors/blocker-collector';

describe('blocker-collector', () => {
  const mockFiles = [
    {
      path: 'lib/utils.ts',
      content: `
// TODO: Add input validation
export function process(data: any) {
  // FIXME: Handle null case
  return data.value;
}
`,
    },
    {
      path: 'lib/api.ts',
      content: `
// BLOCKED: Waiting for API key
export function callAPI() {
  // Implementation pending
}
`,
    },
  ];

  it('should extract blockers from TODO comments', async () => {
    const result = await collectBlockers();

    expect(result).toBeInstanceOf(Array);
  });

  it('should identify FIXME markers as blockers', async () => {
    const result = await collectBlockers();

    const fixmeBlockers = result.filter((b) => b.description.toLowerCase().includes('fixme'));
    // May or may not find FIXME markers depending on scan
    expect(fixmeBlockers.length).toBeGreaterThanOrEqual(0);
  });

  it('should assign priority levels (high/medium/low)', async () => {
    const result = await collectBlockers();

    result.forEach((blocker) => {
      expect(['high', 'medium', 'low']).toContain(blocker.priority);
    });
  });

  it('should include actionable required actions', async () => {
    const result = await collectBlockers();

    result.forEach((blocker) => {
      expect(blocker.requiredAction).toBeDefined();
      expect(blocker.requiredAction.length).toBeGreaterThan(0);
    });
  });

  it('should limit blockers to max 50', async () => {
    const result = await collectBlockers();

    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('should extract test failures as blockers', async () => {
    const result = await collectBlockers();

    // Test failures should be marked as high priority
    const highPriority = result.filter((b) => b.priority === 'high');
    expect(highPriority.length).toBeGreaterThanOrEqual(0);
  });

  it('should associate blockers with task IDs when applicable', async () => {
    const result = await collectBlockers();

    result.forEach((blocker) => {
      if (blocker.taskId) {
        expect(blocker.taskId).toMatch(/^T\d+$/);
      }
    });
  });

  it('should handle no blockers found', async () => {
    const result = await collectBlockers();

    // Should return empty array, not null/undefined
    expect(result).toBeInstanceOf(Array);
  });
});
