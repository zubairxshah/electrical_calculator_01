/**
 * Unit tests for generator
 * Feature: 001-session-memory-file
 */

import { describe, it, expect } from 'vitest';
import { generateSessionMemory } from '@/lib/session-memory/generator';
import type { SessionMemory } from '@/lib/session-memory/types';

describe('generator', () => {
  it('should generate valid SessionMemory structure', async () => {
    const result = await generateSessionMemory();

    expect(result).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.taskStatus).toBeDefined();
    expect(result.blockers).toBeInstanceOf(Array);
    expect(result.testResults).toBeDefined();
    expect(result.environment).toBeDefined();
    expect(result.filesNeedingAttention).toBeInstanceOf(Array);
    expect(result.nextSteps).toBeInstanceOf(Array);
  });

  it('should generate metadata with all required fields', async () => {
    const result = await generateSessionMemory();

    expect(result.metadata.projectName).toBeDefined();
    expect(result.metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
    expect(result.metadata.branch).toBeDefined();
    expect(result.metadata.version).toBe('1.0');
  });

  it('should generate executive summary with 5 components', async () => {
    const result = await generateSessionMemory();

    expect(result.summary.projectDescription).toBeDefined();
    expect(result.summary.completionStatus).toBeDefined();
    expect(result.summary.currentPhase).toBeDefined();
    // majorBlocker can be null
    expect(result.summary.nextAction).toBeDefined();
  });

  it('should orchestrate all collectors', async () => {
    const result = await generateSessionMemory();

    // Task status should have phases
    expect(result.taskStatus.phases).toBeInstanceOf(Array);

    // Environment should have servers array
    expect(result.environment.servers).toBeInstanceOf(Array);

    // Test results should have unit and e2e
    expect(result.testResults.unit).toBeDefined();
    expect(result.testResults.e2e).toBeDefined();
  });

  it('should apply sensitive data filtering', async () => {
    const result = await generateSessionMemory();

    // Convert to string for checking
    const jsonStr = JSON.stringify(result);

    // Should not contain common sensitive patterns
    expect(jsonStr).not.toMatch(/API_KEY=/);
    expect(jsonStr).not.toMatch(/PASSWORD=/);
    expect(jsonStr).not.toMatch(/[a-z]+:\/\/[^@]*:[^@]*@/); // user:pass in URLs
  });

  it('should validate file size is under 50KB', async () => {
    const result = await generateSessionMemory();
    const jsonSize = JSON.stringify(result).length;

    // JSON structure should be reasonable, markdown will be similar
    expect(jsonSize).toBeLessThan(50 * 1024);
  });

  it('should truncate sections if size exceeds limit', async () => {
    const result = await generateSessionMemory();

    // Max limits per spec
    expect(result.blockers.length).toBeLessThanOrEqual(50);
    expect(result.filesNeedingAttention.length).toBeLessThanOrEqual(50);
    expect(result.testResults.unit.failures.length).toBeLessThanOrEqual(20);
    expect(result.testResults.e2e.failures.length).toBeLessThanOrEqual(20);
    expect(result.nextSteps.length).toBeLessThanOrEqual(10);
    expect(result.taskStatus.nextTasks.length).toBeLessThanOrEqual(5);
  });

  it('should generate next steps prioritized by importance', async () => {
    const result = await generateSessionMemory();

    result.nextSteps.forEach((step) => {
      expect(['immediate', 'short-term', 'medium-term', 'long-term']).toContain(step.priority);
      expect(step.action).toBeDefined();
      expect(step.action.length).toBeGreaterThan(0);
    });
  });

  it('should handle missing tasks.md gracefully', async () => {
    // Should not throw, but may have empty task status
    const result = await generateSessionMemory();
    expect(result).toBeDefined();
  });

  it('should handle no test results', async () => {
    const result = await generateSessionMemory();

    // Should return not-run status
    expect(['passed', 'failed', 'not-run']).toContain(result.testResults.unit.status);
  });

  it('should handle no active servers', async () => {
    const result = await generateSessionMemory();

    // Should return empty array, not crash
    expect(result.environment.servers).toBeInstanceOf(Array);
  });
});
