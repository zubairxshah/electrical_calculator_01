/**
 * Sensitive data filter for session memory file
 * Feature: 001-session-memory-file
 * SECURITY CRITICAL: SC-007 requires zero credential leakage
 *
 * Implements allowlist approach with pattern matching per research.md
 */

/**
 * Sensitive data patterns to detect and remove
 */
const SENSITIVE_PATTERNS = [
  // API Keys
  /API[_-]?KEY\s*[=:]\s*[^\s\n]+/gi,
  /APIKEY\s*[=:]\s*[^\s\n]+/gi,
  /api[_-]key["\s]*[:=]["\s]*[^\s"'\n]+/gi,

  // Stripe keys (variable assignments)
  /STRIPE[_-]?KEY\s*[=:]\s*[^\s\n]+/gi,
  /STRIPE[_-]?SECRET\s*[=:]\s*[^\s\n]+/gi,
  /STRIPE[_-]?API[_-]?KEY\s*[=:]\s*[^\s\n]+/gi,

  // Stripe API keys (standalone patterns)
  /sk_(live|test)_[a-zA-Z0-9]+/g,
  /pk_(live|test)_[a-zA-Z0-9]+/g,
  /rk_(live|test)_[a-zA-Z0-9]+/g,

  // Passwords
  /PASSWORD\s*[=:]\s*[^\s\n]+/gi,
  /PASSWD\s*[=:]\s*[^\s\n]+/gi,
  /PWD\s*[=:]\s*[^\s\n]+/gi,
  /password["\s]*[:=]["\s]*[^\s"'\n]+/gi,

  // Tokens
  /TOKEN\s*[=:]\s*[^\s\n]+/gi,
  /JWT[_-]?TOKEN\s*[=:]\s*[^\s\n]+/gi,
  /BEARER[_-]?TOKEN\s*[=:]\s*[^\s\n]+/gi,
  /auth[_-]?token["\s]*[:=]["\s]*[^\s"'\n]+/gi,
  /jwt["\s]*[:=]["\s]*[^\s"'\n]+/gi,

  // GitHub tokens
  /ghp_[a-zA-Z0-9]{36}/g,
  /gho_[a-zA-Z0-9]{36}/g,
  /ghu_[a-zA-Z0-9]{36}/g,
  /ghs_[a-zA-Z0-9]{36}/g,
  /ghr_[a-zA-Z0-9]{36}/g,

  // Database URLs with credentials
  /(postgresql|mysql|mongodb|mariadb):\/\/[^:@\s]+:[^@\s]+@[^\s]+/gi,

  // AWS Credentials
  /AWS[_-]?ACCESS[_-]?KEY[_-]?ID\s*[=:]\s*[^\s\n]+/gi,
  /AWS[_-]?SECRET[_-]?ACCESS[_-]?KEY\s*[=:]\s*[^\s\n]+/gi,
  /AKIA[0-9A-Z]{16}/g,

  // OAuth Secrets
  /CLIENT[_-]?SECRET\s*[=:]\s*[^\s\n]+/gi,
  /SECRET[_-]?KEY\s*[=:]\s*[^\s\n]+/gi,

  // Private Keys (PEM format)
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
  /-----BEGIN\s+ENCRYPTED\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+ENCRYPTED\s+PRIVATE\s+KEY-----/gi,

  // Generic long alphanumeric strings that might be keys
  /[a-zA-Z0-9]{40,}/g, // 40+ char strings (likely keys)
];

/**
 * Allowed data patterns (allowlist approach)
 * These are safe to include in the memory file
 */
const ALLOWED_PATTERNS = [
  // Task completion metrics
  /\d+\/\d+/,  // e.g., "60/155"
  /\d+\.\d+%/, // e.g., "38.7%"

  // Port numbers
  /port\s+\d+/i,
  /:\d{4,5}\b/, // Port in URL

  // Test results
  /\d+\/\d+\s+tests?\s+(passing|failing)/i,
  /\d+\s+passed?/i,
  /\d+\s+failed?/i,

  // File paths
  /[\w-]+\/[\w-]+\.[\w]+/,  // Basic file paths
  /__tests__\/[\w/-]+/,

  // Package names with versions
  /[\w-]+@\d+\.\d+\.\d+/,

  // Task IDs
  /T\d+/,

  // Timestamps (ISO 8601)
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,

  // Safe URLs (localhost without credentials)
  /https?:\/\/localhost:\d+/,
  /https?:\/\/127\.0\.0\.1:\d+/,
];

/**
 * Filter sensitive data from content
 * @param content - Content to filter
 * @returns Filtered content with sensitive data removed
 */
export function filterSensitiveData(content: string): string {
  if (!content) return content;

  let filtered = content;

  // First pass: Remove multi-line patterns (PEM keys) before splitting
  const multiLinePatterns = [
    /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
    /-----BEGIN\s+ENCRYPTED\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+ENCRYPTED\s+PRIVATE\s+KEY-----/gi,
  ];

  for (const pattern of multiLinePatterns) {
    filtered = filtered.replace(pattern, '[PRIVATE KEY REDACTED]');
  }

  // Second pass: Remove entire lines containing sensitive patterns
  const lines = filtered.split('\n');
  const safeLines: string[] = [];

  for (const line of lines) {
    let isSafe = true;

    // Check if line contains sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(line)) {
        // Check if the sensitive match is part of allowed context
        const isAllowed = ALLOWED_PATTERNS.some((allowed) => {
          const sensitiveMatch = line.match(pattern);
          if (!sensitiveMatch) return false;

          // If the sensitive part is just a port number or test result, allow it
          return allowed.test(line) && !containsActualSecret(line);
        });

        if (!isAllowed) {
          isSafe = false;
          break;
        }
      }
    }

    if (isSafe) {
      safeLines.push(line);
    } else {
      // Line contains sensitive data - skip it
      console.warn('[sensitive-data-filter] Filtered line containing sensitive data');
    }
  }

  filtered = safeLines.join('\n');

  // Additional pass: redact any remaining credential-like patterns
  filtered = redactCredentialsInUrls(filtered);

  return filtered;
}

/**
 * Check if line contains actual secret (not just matching pattern)
 */
function containsActualSecret(line: string): boolean {
  // Check for common secret indicators
  const secretIndicators = [
    /[a-zA-Z0-9]{20,}/, // Long alphanumeric strings
    /sk_live/, // Stripe live keys
    /sk_test/, // Stripe test keys
    /[A-Z0-9]{20,}/, // All-caps long strings
  ];

  return secretIndicators.some((indicator) => indicator.test(line));
}

/**
 * Redact credentials from database URLs
 * Converts: postgresql://user:password@host/db
 * To: postgresql://***@host/db
 */
function redactCredentialsInUrls(content: string): string {
  // Match database URLs with credentials
  const dbUrlPattern = /(postgresql|mysql|mongodb|mariadb):\/\/([^:@\s]+):([^@\s]+)@/gi;

  return content.replace(dbUrlPattern, '$1://***@');
}

/**
 * Validate that content contains no sensitive data
 * Used for testing and validation
 * @param content - Content to check
 * @returns true if no sensitive data detected
 */
export function validateNoSensitiveData(content: string): boolean {
  for (const pattern of SENSITIVE_PATTERNS) {
    // Reset pattern (some have 'g' flag)
    pattern.lastIndex = 0;

    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Check if matches are false positives (part of allowed patterns)
      const isFalsePositive = matches.every((match) => {
        return ALLOWED_PATTERNS.some((allowed) => allowed.test(match));
      });

      if (!isFalsePositive) {
        console.warn('[sensitive-data-filter] Sensitive data detected:', pattern);
        return false;
      }
    }
  }

  return true;
}
