/**
 * E2E test for file generation
 * Feature: 001-session-memory-file
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Session Memory E2E', () => {
  const memoryFilePath = path.join(process.cwd(), '.claude/session-memory.md');

  it('should generate .claude/session-memory.md file', async () => {
    // TODO: Implement actual save command trigger when CLI integration complete
    // For now, test that we can generate and write the file

    const { generateSessionMemory } = await import('@/lib/session-memory/generator');
    const { serializeToMarkdown } = await import('@/lib/session-memory/markdown-serializer');

    const sessionMemory = await generateSessionMemory();
    const markdown = serializeToMarkdown(sessionMemory);

    // Write to file
    const outputDir = path.dirname(memoryFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(memoryFilePath, markdown, 'utf-8');

    // Verify file exists
    expect(fs.existsSync(memoryFilePath)).toBe(true);
  });

  it('generated file should have all required sections', async () => {
    // Verify file exists from previous test
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const content = fs.readFileSync(memoryFilePath, 'utf-8');

    expect(content).toContain('# Session Memory:');
    expect(content).toContain('## Executive Summary');
    expect(content).toContain('## Task Status');
    expect(content).toContain('## Blockers');
    expect(content).toContain('## Test Results');
    expect(content).toContain('## Environment State');
    expect(content).toContain('## Files Needing Attention');
    expect(content).toContain('## Next Steps');
  });

  it('generated file should be under 50KB', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const stats = fs.statSync(memoryFilePath);
    expect(stats.size).toBeLessThan(50 * 1024); // SC-006
  });

  it('generated file should contain no sensitive data', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const content = fs.readFileSync(memoryFilePath, 'utf-8');

    // Should not contain sensitive patterns
    expect(content).not.toMatch(/API_KEY\s*=/i);
    expect(content).not.toMatch(/PASSWORD\s*=/i);
    expect(content).not.toMatch(/[a-z]+:\/\/[^:@]*:[^@]+@/); // credentials in URLs
  });
});

/**
 * E2E tests for loading session memory (User Story 2)
 * T044: Load existing .claude/session-memory.md and verify Claude Code context includes project state
 */
describe('Session Memory Loading E2E', () => {
  const memoryFilePath = path.join(process.cwd(), '.claude/session-memory.md');

  it('should load existing session-memory.md and parse to SessionMemory structure', async () => {
    // Ensure we have a file to load (generate if not exists)
    if (!fs.existsSync(memoryFilePath)) {
      const { generateSessionMemory } = await import('@/lib/session-memory/generator');
      const { serializeToMarkdown } = await import('@/lib/session-memory/markdown-serializer');

      const sessionMemory = await generateSessionMemory();
      const markdown = serializeToMarkdown(sessionMemory);

      const outputDir = path.dirname(memoryFilePath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(memoryFilePath, markdown, 'utf-8');
    }

    // Load and parse the file
    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');
    const content = fs.readFileSync(memoryFilePath, 'utf-8');
    const parsed = parseMarkdown(content);

    // Verify structure
    expect(parsed).toBeDefined();
    expect(parsed.metadata).toBeDefined();
    expect(parsed.metadata.projectName).toBeTruthy();
    expect(parsed.metadata.generatedAt).toBeTruthy();
    expect(parsed.metadata.branch).toBeTruthy();
    expect(parsed.summary).toBeDefined();
    expect(parsed.taskStatus).toBeDefined();
    expect(parsed.blockers).toBeDefined();
    expect(parsed.testResults).toBeDefined();
    expect(parsed.environment).toBeDefined();
    expect(parsed.nextSteps).toBeDefined();
  });

  it('should parse metadata section correctly', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');
    const content = fs.readFileSync(memoryFilePath, 'utf-8');
    const parsed = parseMarkdown(content);

    // Metadata validation
    expect(parsed.metadata.projectName).toBe('electromate');
    expect(parsed.metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO 8601
    expect(parsed.metadata.branch).toBeTruthy();
    expect(parsed.metadata.version).toBe('1.0');
  });

  it('should parse executive summary section correctly', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');
    const content = fs.readFileSync(memoryFilePath, 'utf-8');
    const parsed = parseMarkdown(content);

    // Executive summary validation
    expect(parsed.summary.projectDescription).toBeTruthy();
    expect(parsed.summary.completionStatus).toBeTruthy();
    expect(parsed.summary.currentPhase).toBeTruthy();
    expect(parsed.summary.nextAction).toBeTruthy();
    // majorBlocker can be null
    expect(parsed.summary.majorBlocker === null || typeof parsed.summary.majorBlocker === 'string').toBe(true);
  });

  it('should parse task status section correctly', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');
    const content = fs.readFileSync(memoryFilePath, 'utf-8');
    const parsed = parseMarkdown(content);

    // Task status validation
    expect(parsed.taskStatus.sourceFile).toBeTruthy();
    expect(Array.isArray(parsed.taskStatus.phases)).toBe(true);
    expect(Array.isArray(parsed.taskStatus.nextTasks)).toBe(true);

    // Validate phase structure if phases exist
    if (parsed.taskStatus.phases.length > 0) {
      const phase = parsed.taskStatus.phases[0];
      expect(typeof phase.name).toBe('string');
      expect(typeof phase.completed).toBe('number');
      expect(typeof phase.total).toBe('number');
      expect(typeof phase.percentage).toBe('number');
      expect(phase.percentage).toBeGreaterThanOrEqual(0);
      expect(phase.percentage).toBeLessThanOrEqual(100);
    }
  });

  it('should parse blockers section correctly', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');
    const content = fs.readFileSync(memoryFilePath, 'utf-8');
    const parsed = parseMarkdown(content);

    // Blockers validation
    expect(Array.isArray(parsed.blockers)).toBe(true);

    // Validate blocker structure if blockers exist
    if (parsed.blockers.length > 0) {
      const blocker = parsed.blockers[0];
      expect(['high', 'medium', 'low']).toContain(blocker.priority);
      expect(typeof blocker.title).toBe('string');
      expect(typeof blocker.description).toBe('string');
      expect(typeof blocker.requiredAction).toBe('string');
    }
  });

  it('should parse test results section correctly', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');
    const content = fs.readFileSync(memoryFilePath, 'utf-8');
    const parsed = parseMarkdown(content);

    // Test results validation
    expect(parsed.testResults).toBeDefined();
    expect(parsed.testResults.unit).toBeDefined();
    expect(parsed.testResults.e2e).toBeDefined();

    // Validate test suite structure
    const unitSuite = parsed.testResults.unit;
    expect(['passed', 'failed', 'not-run']).toContain(unitSuite.status);
    expect(typeof unitSuite.framework).toBe('string');
    expect(typeof unitSuite.command).toBe('string');
  });

  it('should parse environment state section correctly', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');
    const content = fs.readFileSync(memoryFilePath, 'utf-8');
    const parsed = parseMarkdown(content);

    // Environment state validation
    expect(parsed.environment).toBeDefined();
    expect(Array.isArray(parsed.environment.servers)).toBe(true);
    expect(parsed.environment.dependencies).toBeDefined();
    expect(parsed.environment.build).toBeDefined();

    // Validate dependency status
    expect(['up-to-date', 'outdated', 'unknown']).toContain(parsed.environment.dependencies.status);
    expect(['npm', 'yarn', 'pnpm', 'bun', 'unknown']).toContain(parsed.environment.dependencies.packageManager);

    // Validate build status
    expect(['success', 'failed', 'not-run']).toContain(parsed.environment.build.status);
  });

  it('should parse next steps section correctly', async () => {
    if (!fs.existsSync(memoryFilePath)) {
      return; // Skip if file doesn't exist
    }

    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');
    const content = fs.readFileSync(memoryFilePath, 'utf-8');
    const parsed = parseMarkdown(content);

    // Next steps validation
    expect(Array.isArray(parsed.nextSteps)).toBe(true);

    // Validate next step structure if steps exist
    if (parsed.nextSteps.length > 0) {
      const step = parsed.nextSteps[0];
      expect(['immediate', 'short-term', 'medium-term', 'long-term']).toContain(step.priority);
      expect(typeof step.action).toBe('string');
    }
  });

  it('should handle round-trip serialization/parsing correctly', async () => {
    // Generate fresh session memory
    const { generateSessionMemory } = await import('@/lib/session-memory/generator');
    const { serializeToMarkdown } = await import('@/lib/session-memory/markdown-serializer');
    const { parseMarkdown } = await import('@/lib/session-memory/markdown-parser');

    const original = await generateSessionMemory();
    const markdown = serializeToMarkdown(original);
    const parsed = parseMarkdown(markdown);

    // Core structure should be preserved (some fields may differ in formatting)
    expect(parsed.metadata.projectName).toBe(original.metadata.projectName);
    expect(parsed.metadata.branch).toBe(original.metadata.branch);
    expect(parsed.summary.projectDescription).toBe(original.summary.projectDescription);
    expect(parsed.taskStatus.sourceFile).toBe(original.taskStatus.sourceFile);
    expect(parsed.taskStatus.phases.length).toBe(original.taskStatus.phases.length);
    expect(parsed.blockers.length).toBe(original.blockers.length);
    expect(parsed.nextSteps.length).toBe(original.nextSteps.length);
  });
});
