/**
 * Validator for session memory data
 * Feature: 001-session-memory-file
 * Tasks: T055-T056
 */

import type { SessionMemory, ValidationResult } from './types';

/**
 * Validate ISO 8601 timestamp format
 */
export function isValidISO8601(timestamp: string): boolean {
  if (!timestamp) return false;

  // ISO 8601 format: YYYY-MM-DDTHH:mm:ss or with timezone
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/;
  if (!iso8601Regex.test(timestamp)) return false;

  // Also verify it's a valid date
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Validate percentage is in 0-100 range
 */
export function isValidPercentage(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * Validate path is relative (not absolute)
 */
export function isRelativePath(path: string): boolean {
  if (!path) return true; // Empty is OK

  // Windows absolute path
  if (/^[A-Za-z]:[\\/]/.test(path)) return false;

  // Unix absolute path
  if (path.startsWith('/')) return false;

  return true;
}

/**
 * Check for sensitive data patterns
 * T056: Check for sensitive data in parsed content
 */
export function containsSensitiveData(content: string): boolean {
  const sensitivePatterns = [
    // API keys and tokens
    /API[_-]?KEY\s*[=:]\s*["']?[A-Za-z0-9_-]{20,}/i,
    /TOKEN\s*[=:]\s*["']?[A-Za-z0-9_-]{20,}/i,
    /SECRET\s*[=:]\s*["']?[A-Za-z0-9_-]{10,}/i,

    // Passwords
    /PASSWORD\s*[=:]\s*["']?[^\s"']{4,}/i,
    /PASSWD\s*[=:]\s*["']?[^\s"']{4,}/i,

    // Database URLs with credentials
    /[a-z]+:\/\/[^:@\s]+:[^@\s]+@[^/\s]+/i,

    // AWS credentials
    /AKIA[0-9A-Z]{16}/,
    /aws_secret_access_key\s*[=:]/i,

    // Private keys
    /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,

    // Connection strings with passwords
    /Server=.*Password=/i,
    /Data Source=.*Password=/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate complete SessionMemory structure
 * T055: Validate ISO 8601 timestamps, percentages 0-100, relative paths
 */
export function validateSessionMemory(memory: SessionMemory): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate metadata
  if (!memory.metadata.projectName) {
    errors.push('metadata.projectName is required');
  }

  if (memory.metadata.generatedAt && !isValidISO8601(memory.metadata.generatedAt)) {
    warnings.push(`metadata.generatedAt is not valid ISO 8601: ${memory.metadata.generatedAt}`);
  }

  // Validate task status
  if (memory.taskStatus.sourceFile && !isRelativePath(memory.taskStatus.sourceFile)) {
    errors.push('taskStatus.sourceFile must be a relative path');
  }

  for (const phase of memory.taskStatus.phases) {
    if (!isValidPercentage(phase.percentage)) {
      errors.push(`Phase "${phase.name}" has invalid percentage: ${phase.percentage}`);
    }
    if (phase.completed > phase.total) {
      warnings.push(`Phase "${phase.name}" has completed (${phase.completed}) > total (${phase.total})`);
    }
  }

  // Validate test results
  if (memory.testResults.lastRun && !isValidISO8601(memory.testResults.lastRun)) {
    warnings.push(`testResults.lastRun is not valid ISO 8601: ${memory.testResults.lastRun}`);
  }

  if (!isValidPercentage(memory.testResults.unit.percentage)) {
    errors.push(`Unit test percentage is invalid: ${memory.testResults.unit.percentage}`);
  }

  if (!isValidPercentage(memory.testResults.e2e.percentage)) {
    errors.push(`E2E test percentage is invalid: ${memory.testResults.e2e.percentage}`);
  }

  // Validate environment
  if (memory.environment.dependencies.lastInstall &&
      !isValidISO8601(memory.environment.dependencies.lastInstall)) {
    warnings.push(`dependencies.lastInstall is not valid ISO 8601`);
  }

  if (memory.environment.build.lastBuild &&
      !isValidISO8601(memory.environment.build.lastBuild)) {
    warnings.push(`build.lastBuild is not valid ISO 8601`);
  }

  // Validate files needing attention paths
  for (const file of memory.filesNeedingAttention) {
    if (!isRelativePath(file.path)) {
      errors.push(`File path must be relative: ${file.path}`);
    }
  }

  // Validate array limits (from types.ts constants)
  if (memory.blockers.length > 50) {
    warnings.push(`Blockers array exceeds recommended limit: ${memory.blockers.length}/50`);
  }

  if (memory.filesNeedingAttention.length > 50) {
    warnings.push(`Files needing attention exceeds limit: ${memory.filesNeedingAttention.length}/50`);
  }

  if (memory.nextSteps.length > 10) {
    warnings.push(`Next steps exceeds limit: ${memory.nextSteps.length}/10`);
  }

  // T056: Check for sensitive data
  const serializedContent = JSON.stringify(memory);
  if (containsSensitiveData(serializedContent)) {
    errors.push('Sensitive data detected in session memory content');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize potentially invalid timestamp
 */
export function sanitizeTimestamp(timestamp: string | undefined | null): string {
  if (!timestamp) return 'unknown';
  if (isValidISO8601(timestamp)) return timestamp;
  return 'unknown';
}
