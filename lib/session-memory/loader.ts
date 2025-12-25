/**
 * Loader module for session memory file
 * Feature: 001-session-memory-file
 * Tasks: T057-T059
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseMarkdown } from './markdown-parser';
import { validateSessionMemory } from './validator';
import type { SessionMemory, ValidationResult } from './types';
import { SESSION_MEMORY_PATH } from './types';

export interface LoadResult {
  success: boolean;
  memory: SessionMemory | null;
  validation: ValidationResult | null;
  warnings: string[];
  error?: string;
}

/**
 * T057: Load session memory from .claude/session-memory.md
 * Check if file exists, read, parse, and validate
 */
export function loadSessionMemory(projectRoot?: string): LoadResult {
  const root = projectRoot || process.cwd();
  const filePath = path.join(root, SESSION_MEMORY_PATH);
  const warnings: string[] = [];

  // T059: Handle missing file
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      memory: null,
      validation: null,
      warnings: [],
      error: 'Session memory file not found',
    };
  }

  try {
    // Read file
    const content = fs.readFileSync(filePath, 'utf-8');

    // Handle empty file
    if (!content.trim()) {
      return {
        success: false,
        memory: null,
        validation: null,
        warnings: ['Session memory file is empty'],
        error: 'Empty session memory file',
      };
    }

    // Parse markdown
    const memory = parseMarkdown(content);

    // Validate structure
    const validation = validateSessionMemory(memory);

    // T058: Check staleness (>3 days old)
    const stalenessWarning = checkStaleness(memory.metadata.generatedAt);
    if (stalenessWarning) {
      warnings.push(stalenessWarning);
    }

    // Add validation warnings
    if (validation.warnings) {
      warnings.push(...validation.warnings);
    }

    return {
      success: validation.valid,
      memory,
      validation,
      warnings,
      error: validation.valid ? undefined : 'Validation failed: ' + validation.errors.join('; '),
    };
  } catch (err) {
    // T059: Handle file system errors
    const errorMessage = err instanceof Error ? err.message : 'Unknown error reading file';

    return {
      success: false,
      memory: null,
      validation: null,
      warnings: [],
      error: `Failed to load session memory: ${errorMessage}`,
    };
  }
}

/**
 * T058: Check if session memory is stale (>3 days old)
 */
export function checkStaleness(generatedAt: string): string | null {
  try {
    const generated = new Date(generatedAt);
    const now = new Date();
    const diffMs = now.getTime() - generated.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 3) {
      const daysAgo = Math.floor(diffDays);
      return `Session memory is ${daysAgo} days old. Consider regenerating for up-to-date project state.`;
    }

    return null;
  } catch {
    return 'Unable to determine session memory age - timestamp may be invalid';
  }
}

/**
 * Check if session memory file exists
 */
export function sessionMemoryExists(projectRoot?: string): boolean {
  const root = projectRoot || process.cwd();
  const filePath = path.join(root, SESSION_MEMORY_PATH);
  return fs.existsSync(filePath);
}

/**
 * Get session memory file path
 */
export function getSessionMemoryPath(projectRoot?: string): string {
  const root = projectRoot || process.cwd();
  return path.join(root, SESSION_MEMORY_PATH);
}

/**
 * Quick load for context restoration - returns memory or null
 */
export async function quickLoad(projectRoot?: string): Promise<SessionMemory | null> {
  const result = loadSessionMemory(projectRoot);

  if (!result.success || !result.memory) {
    // Log warnings but don't throw
    if (result.warnings.length > 0) {
      console.warn('[Session Memory]', result.warnings.join('; '));
    }
    if (result.error) {
      console.warn('[Session Memory]', result.error);
    }
    return null;
  }

  // Log staleness warning if present
  const stalenessWarnings = result.warnings.filter((w) => w.includes('days old'));
  if (stalenessWarnings.length > 0) {
    console.warn('[Session Memory]', stalenessWarnings[0]);
  }

  return result.memory;
}
