/**
 * Generic Input Validation Tests
 *
 * Tests shared validation utilities
 * TDD Red Phase: Tests written BEFORE implementation
 */

import { describe, it, expect } from 'vitest'
import { validateRange, validateRequired, validateNumeric } from '@/lib/validation/inputValidation'

describe('Input Validation Utilities', () => {
  describe('validateRange', () => {
    it('should pass for value within range', () => {
      expect(validateRange(50, 1, 100, 'testField')).toBe(true)
    })

    it('should pass for value at minimum', () => {
      expect(validateRange(1, 1, 100, 'testField')).toBe(true)
    })

    it('should pass for value at maximum', () => {
      expect(validateRange(100, 1, 100, 'testField')).toBe(true)
    })

    it('should throw error for value below minimum', () => {
      expect(() => validateRange(0, 1, 100, 'voltage')).toThrow(
        'voltage must be between 1 and 100'
      )
    })

    it('should throw error for value above maximum', () => {
      expect(() => validateRange(101, 1, 100, 'voltage')).toThrow(
        'voltage must be between 1 and 100'
      )
    })

    it('should handle negative ranges', () => {
      expect(validateRange(-10, -20, 0, 'temperature')).toBe(true)
      expect(() => validateRange(-25, -20, 0, 'temperature')).toThrow()
    })
  })

  describe('validateRequired', () => {
    it('should pass for non-empty string', () => {
      expect(validateRequired('test', 'name')).toBe(true)
    })

    it('should pass for number', () => {
      expect(validateRequired(0, 'value')).toBe(true)
      expect(validateRequired(100, 'value')).toBe(true)
    })

    it('should throw error for empty string', () => {
      expect(() => validateRequired('', 'name')).toThrow('name is required')
    })

    it('should throw error for null', () => {
      expect(() => validateRequired(null, 'name')).toThrow('name is required')
    })

    it('should throw error for undefined', () => {
      expect(() => validateRequired(undefined, 'name')).toThrow('name is required')
    })
  })

  describe('validateNumeric', () => {
    it('should pass for valid number', () => {
      expect(validateNumeric(123, 'value')).toBe(true)
    })

    it('should pass for zero', () => {
      expect(validateNumeric(0, 'value')).toBe(true)
    })

    it('should pass for negative number', () => {
      expect(validateNumeric(-10, 'value')).toBe(true)
    })

    it('should pass for decimal', () => {
      expect(validateNumeric(3.14159, 'value')).toBe(true)
    })

    it('should throw error for NaN', () => {
      expect(() => validateNumeric(NaN, 'value')).toThrow('value must be a valid number')
    })

    it('should throw error for Infinity', () => {
      expect(() => validateNumeric(Infinity, 'value')).toThrow('value must be a valid number')
    })

    it('should throw error for -Infinity', () => {
      expect(() => validateNumeric(-Infinity, 'value')).toThrow('value must be a valid number')
    })
  })
})
