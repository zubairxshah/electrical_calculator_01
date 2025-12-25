/**
 * Project utilities for session memory file generation
 * Feature: 001-session-memory-file
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Detect project name from package.json or directory name
 * @param projectRoot - Project root directory (defaults to cwd)
 * @returns Project name
 */
export function getProjectName(projectRoot: string = process.cwd()): string {
  try {
    // Try to read package.json
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (packageJson.name) {
        return packageJson.name;
      }
    }
  } catch (error) {
    console.warn('[project-utils] Failed to read package.json:', (error as Error).message);
  }

  // Fallback to directory name
  return path.basename(projectRoot);
}

/**
 * Get project description from package.json
 * @param projectRoot - Project root directory (defaults to cwd)
 * @returns Project description or empty string
 */
export function getProjectDescription(projectRoot: string = process.cwd()): string {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (packageJson.description) {
        return packageJson.description;
      }
    }
  } catch (error) {
    console.warn('[project-utils] Failed to read package.json description:', (error as Error).message);
  }

  return '';
}
