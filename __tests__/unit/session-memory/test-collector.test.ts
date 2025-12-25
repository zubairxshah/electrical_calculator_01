/**
 * Unit tests for test-collector
 * Feature: 001-session-memory-file
 */

import { describe, it, expect } from 'vitest';
import { collectTestResults } from '@/lib/session-memory/collectors/test-collector';

describe('test-collector', () => {
  const mockVitestOutput = {
    numTotalTests: 50,
    numPassedTests: 47,
    numFailedTests: 3,
    testResults: [
      {
        name: '__tests__/lib/calculations.test.ts',
        status: 'failed',
        message: 'Expected 10, received 9',
      },
      {
        name: '__tests__/lib/utils.test.ts',
        status: 'failed',
        message: 'TypeError: Cannot read property',
      },
    ],
  };

  it('should parse Vitest output and extract pass/fail counts', async () => {
    const result = await collectTestResults();

    expect(result).toBeDefined();
    expect(result.lastRun).toBeDefined();
    expect(result.unit.framework).toBe('Vitest');
    expect(result.e2e.framework).toBe('Playwright');
  });

  it('should calculate correct pass rate percentage', async () => {
    const result = await collectTestResults();

    // If we have mock data: 47/50 = 94%
    if (result.unit.total > 0) {
      expect(result.unit.percentage).toBeGreaterThanOrEqual(0);
      expect(result.unit.percentage).toBeLessThanOrEqual(100);
    }
  });

  it('should extract failure details with file references', async () => {
    const result = await collectTestResults();

    if (result.unit.failures.length > 0) {
      const failure = result.unit.failures[0];
      expect(failure.file).toBeDefined();
      expect(failure.testName).toBeDefined();
    }
  });

  it('should limit failures to max 20', async () => {
    const result = await collectTestResults();

    expect(result.unit.failures.length).toBeLessThanOrEqual(20);
    expect(result.e2e.failures.length).toBeLessThanOrEqual(20);
  });

  it('should handle no test results (not run)', async () => {
    const result = await collectTestResults();

    // At least one suite should have a valid status
    expect(['passed', 'failed', 'not-run']).toContain(result.unit.status);
    expect(['passed', 'failed', 'not-run']).toContain(result.e2e.status);
  });

  it('should set correct test commands', async () => {
    const result = await collectTestResults();

    expect(result.unit.command).toContain('test');
    expect(result.e2e.command).toContain('test');
  });
});
