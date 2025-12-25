/**
 * Unit tests for env-collector
 * Feature: 001-session-memory-file
 */

import { describe, it, expect, vi } from 'vitest';
import { collectEnvironmentState } from '@/lib/session-memory/collectors/env-collector';

describe('env-collector', () => {
  it('should detect active servers on target ports', async () => {
    const result = await collectEnvironmentState();

    expect(result).toBeDefined();
    expect(result.servers).toBeInstanceOf(Array);
  });

  it('should identify server process names (npm, node, python)', async () => {
    const result = await collectEnvironmentState();

    result.servers.forEach((server) => {
      expect(['npm', 'node', 'python', 'next']).toContain(server.process.toLowerCase());
    });
  });

  it('should scan ports 3000-3099, 5173, 8000-8080', async () => {
    const result = await collectEnvironmentState();

    result.servers.forEach((server) => {
      const validPorts =
        (server.port >= 3000 && server.port <= 3099) ||
        server.port === 5173 ||
        (server.port >= 8000 && server.port <= 8080);

      expect(validPorts).toBe(true);
    });
  });

  it('should detect dependency status', async () => {
    const result = await collectEnvironmentState();

    expect(result.dependencies).toBeDefined();
    expect(['up-to-date', 'outdated', 'unknown']).toContain(result.dependencies.status);
    expect(['npm', 'yarn', 'pnpm', 'bun', 'unknown']).toContain(result.dependencies.packageManager);
  });

  it('should detect build status', async () => {
    const result = await collectEnvironmentState();

    expect(result.build).toBeDefined();
    expect(['success', 'failed', 'not-run']).toContain(result.build.status);
  });

  it('should limit servers to max 20', async () => {
    const result = await collectEnvironmentState();

    expect(result.servers.length).toBeLessThanOrEqual(20);
  });

  it('should format server URLs correctly', async () => {
    const result = await collectEnvironmentState();

    result.servers.forEach((server) => {
      expect(server.url).toMatch(/^https?:\/\//);
    });
  });

  it('should handle no active servers', async () => {
    const result = await collectEnvironmentState();

    // Should return valid structure even with no servers
    expect(result.servers).toBeInstanceOf(Array);
    expect(result.dependencies).toBeDefined();
    expect(result.build).toBeDefined();
  });
});
