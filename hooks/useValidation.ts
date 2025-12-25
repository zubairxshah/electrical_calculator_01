/**
 * Real-Time Validation Hook
 *
 * Provides debounced validation with <100ms target per Constitution Principle II
 * Uses 300ms debounce to balance responsiveness with performance
 *
 * @see specs/001-electromate-engineering-app/spec.md#SC-002
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import type { ValidationResults, ValidationRule } from '@/lib/types'

export interface UseValidationOptions<T> {
  /** Input values to validate */
  inputs: T
  /** Validation rules to apply */
  rules: ValidationRule[]
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number
  /** Enable validation */
  enabled?: boolean
}

export interface UseValidationReturn {
  /** Validation results */
  results: ValidationResults | null
  /** Is validation currently running */
  isValidating: boolean
  /** Validation errors (severity: error) */
  errors: ValidationResults['fields']
  /** Validation warnings (severity: warning) */
  warnings: ValidationResults['fields']
  /** Has any errors */
  hasErrors: boolean
  /** Has any warnings */
  hasWarnings: boolean
  /** Manual validation trigger */
  validate: () => void
}

/**
 * Real-time validation hook with debouncing
 *
 * @example
 * const { results, hasErrors, errors } = useValidation({
 *   inputs: { voltage: 48, ampHours: 200 },
 *   rules: batteryValidationRules,
 * })
 */
export function useValidation<T extends Record<string, unknown>>(
  options: UseValidationOptions<T>
): UseValidationReturn {
  const { inputs, rules, debounceMs = 300, enabled = true } = options

  const [results, setResults] = useState<ValidationResults | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Debounce inputs to avoid excessive validation
  const debouncedInputs = useDebounce(inputs, debounceMs)

  /**
   * Execute validation
   */
  const executeValidation = useCallback(() => {
    if (!enabled || !rules || rules.length === 0) {
      setResults(null)
      return
    }

    setIsValidating(true)
    const startTime = performance.now()

    const fields: ValidationResults['fields'] = {}
    let errorCount = 0
    let warningCount = 0
    let infoCount = 0

    // Run each validation rule
    for (const rule of rules) {
      try {
        const isValid = rule.validate(debouncedInputs)

        if (!isValid) {
          // Find which field failed
          const field = findFailedField(rule, debouncedInputs)

          fields[field] = {
            field,
            isValid: false,
            rule,
            message: formatMessage(rule.messageTemplate, debouncedInputs),
            severity: rule.severity,
            standardReference: rule.standardReference,
            recommendation: rule.recommendation,
          }

          // Count by severity
          if (rule.severity === 'error') errorCount++
          else if (rule.severity === 'warning') warningCount++
          else if (rule.severity === 'info') infoCount++
        }
      } catch (error) {
        console.error(`Validation rule ${rule.id} failed:`, error)
      }
    }

    const endTime = performance.now()
    const executionTimeMs = endTime - startTime

    // Log performance warning if exceeds target
    if (executionTimeMs > 100) {
      console.warn(
        `Validation exceeded 100ms target: ${executionTimeMs.toFixed(0)}ms (SC-002 violation)`
      )
    }

    setResults({
      isValid: errorCount === 0,
      hasErrors: errorCount > 0,
      hasWarnings: warningCount > 0,
      fields,
      summary: {
        errorCount,
        warningCount,
        infoCount,
      },
      executionTimeMs,
    })

    setIsValidating(false)
  }, [debouncedInputs, rules, enabled])

  // Auto-validate when debounced inputs change
  useEffect(() => {
    executeValidation()
  }, [executeValidation])

  // Extract errors and warnings
  const errors = results
    ? Object.fromEntries(
        Object.entries(results.fields).filter(([_, v]) => v.severity === 'error')
      )
    : {}

  const warnings = results
    ? Object.fromEntries(
        Object.entries(results.fields).filter(([_, v]) => v.severity === 'warning')
      )
    : {}

  return {
    results,
    isValidating,
    errors,
    warnings,
    hasErrors: results?.hasErrors ?? false,
    hasWarnings: results?.hasWarnings ?? false,
    validate: executeValidation,
  }
}

/**
 * Find which field caused validation to fail
 */
function findFailedField(rule: ValidationRule, inputs: Record<string, unknown>): string {
  // Extract field name from rule ID or validation logic
  // For now, return the first field mentioned in inputs
  return Object.keys(inputs)[0] || 'unknown'
}

/**
 * Format message template with input values
 */
function formatMessage(template: string, inputs: Record<string, unknown>): string {
  let message = template

  // Replace {field} placeholders with actual values
  for (const [key, value] of Object.entries(inputs)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  }

  return message
}
