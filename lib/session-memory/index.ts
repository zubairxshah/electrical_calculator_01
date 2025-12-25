/**
 * Session Memory File - Main Entry Point
 * Feature: 001-session-memory-file
 *
 * Public API for generating and saving session memory files
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateSessionMemory } from './generator';
import { serializeToMarkdown } from './markdown-serializer';
import { SESSION_MEMORY_PATH } from './types';

/**
 * Generate and save session memory file
 * @param projectRoot - Project root directory (defaults to cwd)
 * @returns Path to generated file
 */
export async function saveSessionMemory(projectRoot?: string): Promise<string> {
  const root = projectRoot || process.cwd();
  const outputPath = path.join(root, SESSION_MEMORY_PATH);

  try {
    console.log('[session-memory] Generating session memory...');

    // Generate SessionMemory structure
    const sessionMemory = await generateSessionMemory(root);

    // Serialize to markdown
    const markdown = serializeToMarkdown(sessionMemory);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file (overwrite if exists)
    fs.writeFileSync(outputPath, markdown, 'utf-8');

    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);

    console.log(`[session-memory] ✅ Session memory saved to ${SESSION_MEMORY_PATH}`);
    console.log(`[session-memory] 📊 File size: ${sizeKB}KB`);
    console.log(
      `[session-memory] 📊 Captured: ${sessionMemory.taskStatus.phases.reduce((sum, p) => sum + p.completed, 0)}/${sessionMemory.taskStatus.phases.reduce((sum, p) => sum + p.total, 0)} tasks, ${sessionMemory.blockers.length} blockers, ${sessionMemory.testResults.unit.total + sessionMemory.testResults.e2e.total} tests`
    );

    return outputPath;
  } catch (error) {
    // Handle file system errors
    const err = error as NodeJS.ErrnoException;

    if (err.code === 'EACCES') {
      throw new Error(
        `Permission denied: Cannot write to ${outputPath}. Check file permissions.`
      );
    } else if (err.code === 'ENOSPC') {
      throw new Error(`Disk full: Cannot write to ${outputPath}. Free up disk space.`);
    } else {
      throw new Error(`Failed to save session memory: ${err.message}`);
    }
  }
}

/**
 * Check if session memory file exists
 * @param projectRoot - Project root directory (defaults to cwd)
 * @returns true if file exists
 */
export function sessionMemoryExists(projectRoot?: string): boolean {
  const root = projectRoot || process.cwd();
  const filePath = path.join(root, SESSION_MEMORY_PATH);
  return fs.existsSync(filePath);
}

// Re-export types for external use
export * from './types';

// Re-export parser for loading
export { parseMarkdown } from './markdown-parser';

// Re-export validator
export { validateSessionMemory, containsSensitiveData } from './validator';

// Re-export loader
export { loadSessionMemory, quickLoad, checkStaleness } from './loader';
