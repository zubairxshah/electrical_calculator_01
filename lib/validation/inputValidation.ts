/**
 * Generic Input Validation Utilities
 *
 * Shared validation functions for all calculators
 */

/**
 * Validate that a value is within range
 *
 * @param value Value to validate
 * @param min Minimum allowed value (inclusive)
 * @param max Maximum allowed value (inclusive)
 * @param fieldName Field name for error message
 * @returns true if valid
 * @throws Error if out of range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): boolean {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}. Got: ${value}`)
  }
  return true
}

/**
 * Validate that a value is required (not null/undefined/empty)
 *
 * @param value Value to validate
 * @param fieldName Field name for error message
 * @returns true if valid
 * @throws Error if empty
 */
export function validateRequired(value: unknown, fieldName: string): boolean {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`)
  }
  return true
}

/**
 * Validate that a value is a valid number (not NaN or Infinity)
 *
 * @param value Value to validate
 * @param fieldName Field name for error message
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateNumeric(value: number, fieldName: string): boolean {
  if (isNaN(value) || !isFinite(value)) {
    throw new Error(`${fieldName} must be a valid number. Got: ${value}`)
  }
  return true
}
