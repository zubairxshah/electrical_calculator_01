/**
 * Utility functions for session memory file generation
 * Feature: 001-session-memory-file
 */

/**
 * Generate ISO 8601 timestamp for current time
 * @returns ISO 8601 formatted timestamp (e.g., "2025-12-25T14:30:00Z")
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validate if a string is a valid ISO 8601 timestamp
 * @param timestamp - String to validate
 * @returns true if valid ISO 8601 format
 */
export function isValidISO8601(timestamp: string): boolean {
  if (!timestamp) return false;

  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.toISOString() === timestamp;
}

/**
 * Calculate session duration between two timestamps
 * @param startTime - ISO 8601 start timestamp
 * @param endTime - ISO 8601 end timestamp (defaults to now)
 * @returns Human-readable duration string (e.g., "2h 15m")
 */
export function calculateDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'unknown';
  }

  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) return 'unknown';
  if (diffMs < 60000) return '< 1m'; // Less than 1 minute

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
