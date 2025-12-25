/**
 * Environment collector for session memory file
 * Feature: 001-session-memory-file
 *
 * Detects active servers, dependencies, and build status
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { EnvironmentState, ServerInfo, DependencyStatus, BuildStatus } from '../types';
import { generateTimestamp } from '../utils';

const execAsync = promisify(exec);

/**
 * Collect environment state (servers, dependencies, build)
 * @returns EnvironmentState structure
 */
export async function collectEnvironmentState(): Promise<EnvironmentState> {
  const servers = await detectServers();
  const dependencies = await detectDependencies();
  const build = await detectBuildStatus();

  return {
    servers,
    dependencies,
    build,
  };
}

/**
 * Detect active development servers on target ports
 */
async function detectServers(): Promise<ServerInfo[]> {
  const servers: ServerInfo[] = [];
  const targetPorts = [
    ...Array.from({ length: 100 }, (_, i) => 3000 + i), // 3000-3099
    5173, // Vite default
    ...Array.from({ length: 81 }, (_, i) => 8000 + i), // 8000-8080
  ];

  const platform = process.platform;

  try {
    let command: string;
    if (platform === 'win32') {
      // Windows: use netstat
      command = 'netstat -ano | findstr LISTENING';
    } else {
      // macOS/Linux: use lsof (faster than netstat)
      command = 'lsof -iTCP -sTCP:LISTEN -n -P 2>/dev/null || netstat -tuln 2>/dev/null';
    }

    const { stdout } = await execAsync(command, { timeout: 5000 });

    for (const port of targetPorts) {
      if (stdout.includes(`:${port}`)) {
        const processName = extractProcessName(stdout, port, platform);
        if (processName && ['npm', 'node', 'python', 'next'].some((p) => processName.toLowerCase().includes(p))) {
          servers.push({
            process: processName,
            port,
            url: `http://localhost:${port}`,
            status: 'running',
          });

          if (servers.length >= 20) break; // Max 20 servers
        }
      }
    }
  } catch (error) {
    console.warn('[env-collector] Failed to detect servers:', (error as Error).message);
  }

  return servers;
}

/**
 * Extract process name from netstat/lsof output
 */
function extractProcessName(output: string, port: number, platform: string): string {
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes(`:${port}`)) {
      if (platform === 'win32') {
        // Windows netstat format: extract PID, then lookup process
        const pidMatch = line.match(/\s+(\d+)$/);
        if (pidMatch) {
          // For now, return 'node' as common case
          return 'node';
        }
      } else {
        // Unix lsof format: process name is first column
        const parts = line.trim().split(/\s+/);
        if (parts.length > 0) {
          return parts[0];
        }
      }
    }
  }

  return 'node'; // Default
}

/**
 * Detect dependency status
 */
async function detectDependencies(): Promise<DependencyStatus> {
  const defaultStatus: DependencyStatus = {
    status: 'unknown',
    lastInstall: null,
    packageManager: 'unknown',
  };

  try {
    // Detect package manager
    let packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown' = 'unknown';
    if (fs.existsSync('package-lock.json')) {
      packageManager = 'npm';
    } else if (fs.existsSync('yarn.lock')) {
      packageManager = 'yarn';
    } else if (fs.existsSync('pnpm-lock.yaml')) {
      packageManager = 'pnpm';
    } else if (fs.existsSync('bun.lockb')) {
      packageManager = 'bun';
    }

    // Check last install time
    let lastInstall: string | null = null;
    if (fs.existsSync('node_modules')) {
      const stats = fs.statSync('node_modules');
      lastInstall = stats.mtime.toISOString();
    }

    // Check if dependencies are up to date
    let status: 'up-to-date' | 'outdated' | 'unknown' = 'unknown';
    if (packageManager !== 'unknown') {
      try {
        // Quick check: compare package.json mtime with lock file mtime
        const packageJsonStats = fs.statSync('package.json');
        const lockFiles = {
          npm: 'package-lock.json',
          yarn: 'yarn.lock',
          pnpm: 'pnpm-lock.yaml',
          bun: 'bun.lockb',
        };

        const lockFile = lockFiles[packageManager];
        if (lockFile && fs.existsSync(lockFile)) {
          const lockStats = fs.statSync(lockFile);
          // If package.json is newer than lock file, dependencies may be outdated
          status = packageJsonStats.mtime > lockStats.mtime ? 'outdated' : 'up-to-date';
        }
      } catch {
        status = 'unknown';
      }
    }

    return {
      status,
      lastInstall,
      packageManager,
    };
  } catch (error) {
    console.warn('[env-collector] Failed to detect dependencies:', (error as Error).message);
    return defaultStatus;
  }
}

/**
 * Detect build status
 */
async function detectBuildStatus(): Promise<BuildStatus> {
  const defaultStatus: BuildStatus = {
    status: 'not-run',
    lastBuild: null,
  };

  try {
    // Check for common build output directories
    const buildDirs = ['.next', 'dist', 'build', 'out', '.output'];
    let outputDir: string | undefined;
    let lastBuild: string | null = null;

    for (const dir of buildDirs) {
      if (fs.existsSync(dir)) {
        const stats = fs.statSync(dir);
        if (stats.isDirectory()) {
          outputDir = dir + '/';
          lastBuild = stats.mtime.toISOString();
          break;
        }
      }
    }

    if (outputDir) {
      // Build exists
      return {
        status: 'success',
        lastBuild,
        outputDir,
      };
    }

    return defaultStatus;
  } catch (error) {
    console.warn('[env-collector] Failed to detect build status:', (error as Error).message);
    return defaultStatus;
  }
}
