/**
 * Generic Input Validation Utilities
 *
 * Security-focused validation for all calculators
 * Prevents injection attacks and ensures data integrity
 */

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export interface ValidationErrorInterface {
  field: string
  message: string
  code: string
}

/**
 * Sanitize string input to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, '') // Remove dangerous characters
    .trim()
    .slice(0, 1000) // Limit length
}

/**
 * Parse and validate numerical input with security checks
 */
export function parseNumber(input: unknown, fieldName: string): number {
  // Type safety check
  if (input === null || input === undefined) {
    throw new ValidationError(fieldName, `${fieldName} is required`, 'REQUIRED')
  }

  let numValue: number
  
  if (typeof input === 'string') {
    // Sanitize string input
    const sanitized = sanitizeInput(input)
    if (sanitized === '') {
      throw new ValidationError(fieldName, `${fieldName} cannot be empty`, 'EMPTY')
    }
    
    numValue = parseFloat(sanitized)
  } else if (typeof input === 'number') {
    numValue = input
  } else {
    throw new ValidationError(fieldName, `${fieldName} must be a number`, 'INVALID_TYPE')
  }

  // Validate numeric properties
  if (isNaN(numValue)) {
    throw new ValidationError(fieldName, `${fieldName} must be a valid number`, 'NAN')
  }
  
  if (!isFinite(numValue)) {
    throw new ValidationError(fieldName, `${fieldName} must be finite`, 'INFINITE')
  }

  return numValue
}

/**
 * Validate electrical voltage with safety bounds
 */
export function validateVoltage(input: unknown): number {
  const voltage = parseNumber(input, 'Voltage')
  
  if (voltage <= 0) {
    throw new ValidationError('voltage', 'Voltage must be positive', 'NEGATIVE_VOLTAGE')
  }
  
  if (voltage > 1000000) {
    throw new ValidationError('voltage', 'Voltage exceeds maximum limit (1MV)', 'VOLTAGE_TOO_HIGH')
  }
  
  return voltage
}

/**
 * Validate electrical current with safety bounds
 */
export function validateCurrent(input: unknown): number {
  const current = parseNumber(input, 'Current')
  
  if (current <= 0) {
    throw new ValidationError('current', 'Current must be greater than zero', 'ZERO_CURRENT')
  }
  
  if (current > 100000) {
    throw new ValidationError('current', 'Current exceeds maximum limit (100kA)', 'CURRENT_TOO_HIGH')
  }
  
  return current
}

/**
 * Validate power with safety bounds
 */
export function validatePower(input: unknown): number {
  const power = parseNumber(input, 'Power')
  
  if (power <= 0) {
    throw new ValidationError('power', 'Power must be positive', 'NEGATIVE_POWER')
  }
  
  if (power > 10000000) {
    throw new ValidationError('power', 'Power exceeds maximum limit (10MW)', 'POWER_TOO_HIGH')
  }
  
  return power
}

/**
 * Validate efficiency percentage (0-1 range)
 */
export function validateEfficiency(input: unknown): number {
  const efficiency = parseNumber(input, 'Efficiency')
  
  if (efficiency <= 0) {
    throw new ValidationError('efficiency', 'Efficiency must be positive', 'NEGATIVE_EFFICIENCY')
  }
  
  if (efficiency > 1) {
    throw new ValidationError('efficiency', 'Efficiency cannot exceed 100% (1.0)', 'EFFICIENCY_TOO_HIGH')
  }
  
  return efficiency
}

/**
 * Legacy functions for backward compatibility
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

export function validateRequired(value: unknown, fieldName: string): boolean {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`)
  }
  return true
}

export function validateNumeric(value: number, fieldName: string): boolean {
  if (isNaN(value) || !isFinite(value)) {
    throw new Error(`${fieldName} must be a valid number. Got: ${value}`)
  }
  return true
}
