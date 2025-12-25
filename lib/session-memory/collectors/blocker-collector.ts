/**
 * Blocker collector for session memory file
 * Feature: 001-session-memory-file
 *
 * Extracts blockers from TODO/FIXME comments and test failures
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BlockerEntry } from '../types';
import { generateTimestamp } from '../utils';

/**
 * Collect blockers from project files
 * @returns Array of blocker entries (max 50)
 */
export async function collectBlockers(): Promise<BlockerEntry[]> {
  const blockers: BlockerEntry[] = [];

  // Collect from TODO/FIXME comments
  const commentBlockers = await scanForCommentBlockers();
  blockers.push(...commentBlockers);

  // TODO: Collect from test failures (would integrate with test-collector)
  // This would be implemented by checking test results for failures

  // Sort by priority (high first) and limit to 50
  blockers.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return blockers.slice(0, 50);
}

/**
 * Scan project files for TODO/FIXME/BLOCKED comments
 */
async function scanForCommentBlockers(): Promise<BlockerEntry[]> {
  const blockers: BlockerEntry[] = [];
  const patterns = [
    { keyword: 'BLOCKED', priority: 'high' as const },
    { keyword: 'FIXME', priority: 'high' as const },
    { keyword: 'TODO', priority: 'medium' as const },
    { keyword: 'HACK', priority: 'low' as const },
  ];

  try {
    // Scan common source directories
    const dirsToScan = ['lib', 'src', 'app', 'components', 'pages', 'api'];
    const existingDirs = dirsToScan.filter((dir) => fs.existsSync(dir));

    for (const dir of existingDirs) {
      const files = walkDirectory(dir, ['.ts', '.tsx', '.js', '.jsx']);

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (const { keyword, priority } of patterns) {
              if (line.includes(keyword)) {
                // Extract comment text
                const commentMatch = line.match(/\/\/\s*(.+)|\/\*\s*(.+)\s*\*\//);
                if (commentMatch) {
                  const commentText = (commentMatch[1] || commentMatch[2]).trim();

                  // Extract task ID if present
                  const taskIdMatch = commentText.match(/T(\d+)/);
                  const taskId = taskIdMatch ? `T${taskIdMatch[1]}` : null;

                  blockers.push({
                    priority,
                    taskId,
                    title: commentText.substring(0, 100),
                    description: `Found in ${file}:${i + 1}`,
                    requiredAction: generateActionFromComment(commentText, keyword),
                    detectedAt: generateTimestamp(),
                  });

                  if (blockers.length >= 50) return blockers;
                }
              }
            }
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    }
  } catch (error) {
    console.warn('[blocker-collector] Failed to scan for blockers:', (error as Error).message);
  }

  return blockers;
}

/**
 * Walk directory recursively and collect files with specific extensions
 */
function walkDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules and other common ignore directories
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...walkDirectory(fullPath, extensions));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Generate actionable required action from comment text
 */
function generateActionFromComment(comment: string, keyword: string): string {
  // Remove the keyword itself
  const cleanComment = comment.replace(new RegExp(`${keyword}:?\\s*`, 'i'), '').trim();

  // Generate action based on keyword
  switch (keyword.toUpperCase()) {
    case 'BLOCKED':
      return `Resolve blocker: ${cleanComment}`;
    case 'FIXME':
      return `Fix issue: ${cleanComment}`;
    case 'TODO':
      return `Complete task: ${cleanComment}`;
    case 'HACK':
      return `Refactor workaround: ${cleanComment}`;
    default:
      return `Address: ${cleanComment}`;
  }
}
