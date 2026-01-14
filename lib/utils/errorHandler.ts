/**
 * Secure Error Handling Utilities
 * 
 * Prevents information disclosure while providing useful user feedback
 * Implements safe error logging for debugging
 */

export interface SafeError {
  message: string
  code: string
  field?: string
}

export interface ErrorHandlerResult {
  success: false
  error: SafeError
  timestamp: string
}

/**
 * Safe error messages that don't expose internal details
 */
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  // Validation errors
  REQUIRED: 'This field is required',
  INVALID_TYPE: 'Invalid input format',
  NAN: 'Please enter a valid number',
  INFINITE: 'Number is too large',
  NEGATIVE_VOLTAGE: 'Voltage must be positive',
  NEGATIVE_CURRENT: 'Current must be positive', 
  NEGATIVE_POWER: 'Power must be positive',
  ZERO_CURRENT: 'Current must be greater than zero',
  VOLTAGE_TOO_HIGH: 'Voltage exceeds safe limits',
  CURRENT_TOO_HIGH: 'Current exceeds safe limits',
  POWER_TOO_HIGH: 'Power exceeds safe limits',
  EFFICIENCY_TOO_HIGH: 'Efficiency cannot exceed 100%',
  
  // Calculation errors
  CALC_ERROR: 'Calculation temporarily unavailable',
  MATH_ERROR: 'Mathematical error in calculation',
  OVERFLOW: 'Result is too large to display',
  UNDERFLOW: 'Result is too small to display',
  
  // System errors
  NETWORK_ERROR: 'Network connection issue',
  TIMEOUT: 'Request timed out',
  UNKNOWN: 'An unexpected error occurred'
}

/**
 * Handle calculation errors safely
 */
export function handleCalculationError(error: unknown): ErrorHandlerResult {
  const timestamp = new Date().toISOString()
  
  // Log full error details for debugging (server-side only)
  if (typeof window === 'undefined') {
    console.error('[CALC_ERROR]', {
      timestamp,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })
  }
  
  // Return safe error for client
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        message: SAFE_ERROR_MESSAGES[error.code] || error.message,
        code: error.code,
        field: error.field
      },
      timestamp
    }
  }
  
  if (error instanceof Error) {
    // Map common error types to safe messages
    if (error.message.includes('overflow')) {
      return {
        success: false,
        error: {
          message: SAFE_ERROR_MESSAGES.OVERFLOW,
          code: 'OVERFLOW'
        },
        timestamp
      }
    }
    
    if (error.message.includes('underflow')) {
      return {
        success: false,
        error: {
          message: SAFE_ERROR_MESSAGES.UNDERFLOW,
          code: 'UNDERFLOW'
        },
        timestamp
      }
    }
    
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return {
        success: false,
        error: {
          message: SAFE_ERROR_MESSAGES.CALC_ERROR,
          code: 'CALC_ERROR'
        },
        timestamp
      }
    }
  }
  
  // Default safe error for unknown issues
  return {
    success: false,
    error: {
      message: SAFE_ERROR_MESSAGES.UNKNOWN,
      code: 'UNKNOWN'
    },
    timestamp
  }
}

/**
 * Handle validation errors safely
 */
export function handleValidationError(error: unknown): ErrorHandlerResult {
  const timestamp = new Date().toISOString()
  
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        message: SAFE_ERROR_MESSAGES[error.code] || error.message,
        code: error.code,
        field: error.field
      },
      timestamp
    }
  }
  
  return handleCalculationError(error)
}

/**
 * Wrapper for safe calculation execution
 */
export function safeCalculate<T>(
  calculation: () => T,
  fallbackValue?: T
): { success: true; result: T } | ErrorHandlerResult {
  try {
    const result = calculation()
    return { success: true, result }
  } catch (error) {
    if (fallbackValue !== undefined) {
      return { success: true, result: fallbackValue }
    }
    return handleCalculationError(error)
  }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Re-export for use in validation functions
export { ValidationError }