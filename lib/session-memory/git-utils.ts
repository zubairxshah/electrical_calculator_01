/**
 * Git utilities for session memory file generation
 * Feature: 001-session-memory-file
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Detect current git branch
 * @returns Current branch name or "unknown" if not in a git repo
 */
export async function getCurrentBranch(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('git rev-parse --abbrev-ref HEAD');

    if (stderr) {
      console.warn('[git-utils] Warning:', stderr.trim());
    }

    return stdout.trim() || 'unknown';
  } catch (error) {
    // Not in a git repository or git command failed
    console.warn('[git-utils] Failed to detect git branch:', (error as Error).message);
    return 'unknown';
  }
}

/**
 * Check if the current directory is a git repository
 * @returns true if in a git repository
 */
export async function isGitRepository(): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}
