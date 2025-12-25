/**
 * Integration test for end-to-end memory file generation
 * Feature: 001-session-memory-file
 */

import { describe, it, expect } from 'vitest';
import { generateSessionMemory } from '@/lib/session-memory/generator';
import { serializeToMarkdown } from '@/lib/session-memory/markdown-serializer';

describe('e2e-generation (integration)', () => {
  it('should generate complete memory file from start to finish', async () => {
    // Generate SessionMemory structure
    const sessionMemory = await generateSessionMemory();

    // Serialize to markdown
    const markdown = serializeToMarkdown(sessionMemory);

    // Verify output
    expect(markdown).toBeDefined();
    expect(markdown.length).toBeGreaterThan(0);
    expect(markdown.length).toBeLessThan(50 * 1024); // <50KB
  });

  it('should produce valid markdown structure', async () => {
    const sessionMemory = await generateSessionMemory();
    const markdown = serializeToMarkdown(sessionMemory);

    // All required sections present
    expect(markdown).toContain('# Session Memory:');
    expect(markdown).toContain('## Executive Summary');
    expect(markdown).toContain('## Task Status');
    expect(markdown).toContain('## Blockers');
    expect(markdown).toContain('## Test Results');
    expect(markdown).toContain('## Environment State');
    expect(markdown).toContain('## Next Steps');
  });

  it('should contain no sensitive data after filtering', async () => {
    const sessionMemory = await generateSessionMemory();
    const markdown = serializeToMarkdown(sessionMemory);

    // Should not contain common sensitive patterns
    expect(markdown).not.toMatch(/API_KEY\s*=/i);
    expect(markdown).not.toMatch(/PASSWORD\s*=/i);
    expect(markdown).not.toMatch(/[a-z]+:\/\/[^@]*:[^@]*@/); // credentials in URLs
  });

  it('should complete generation in under 10 seconds', async () => {
    const start = Date.now();

    const sessionMemory = await generateSessionMemory();
    const markdown = serializeToMarkdown(sessionMemory);

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000); // SC-001: <10 seconds
  });
});
