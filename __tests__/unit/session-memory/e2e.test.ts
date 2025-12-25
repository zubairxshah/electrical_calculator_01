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
