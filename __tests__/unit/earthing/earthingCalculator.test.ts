/**
 * Unit Tests for Earthing Conductor Calculator
 */

import { describe, it, expect } from 'vitest'
import { calculateEarthingConductor, validateEarthingInputs } from '@/lib/calculations/earthing/earthingCalculator'
import { getKValue } from '@/lib/calculations/earthing/materialConstants'
import { roundToStandardSize } from '@/lib/calculations/earthing/standardSizes'

describe('Earthing Conductor Calculator', () => {
  describe('Material Constants', () => {
    it('should return correct k-value for copper cable IEC', () => {
      expect(getKValue('copper', 'cable', 'IEC')).toBe(143)
    })

    it('should return correct k-value for aluminum bare NEC', () => {
      expect(getKValue('aluminum', 'bare', 'NEC')).toBe(135)
    })

    it('should return correct k-value for copper bare IEC', () => {
      expect(getKValue('copper', 'bare', 'IEC')).toBe(226)
    })
  })

  describe('Standard Size Rounding', () => {
    it('should round up to next standard size', () => {
      expect(roundToStandardSize(173.2)).toBe(185)
    })

    it('should return exact match for standard size', () => {
      expect(roundToStandardSize(150)).toBe(150)
    })

    it('should round small values correctly', () => {
      expect(roundToStandardSize(3.5)).toBe(4)
    })

    it('should handle values below minimum', () => {
      expect(roundToStandardSize(1.0)).toBe(1.5)
    })
  })

  describe('Input Validation', () => {
    it('should pass validation for valid inputs', () => {
      const errors = validateEarthingInputs({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })
      expect(errors).toHaveLength(0)
    })

    it('should fail for voltage out of range', () => {
      const errors = validateEarthingInputs({
        voltage: 2000000,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('voltage')
    })

    it('should fail for fault current out of range', () => {
      const errors = validateEarthingInputs({
        voltage: 400,
        faultCurrent: 300,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('faultCurrent')
    })

    it('should fail for fault duration out of range', () => {
      const errors = validateEarthingInputs({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 10,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('faultDuration')
    })
  })

  describe('Basic Calculations', () => {
    it('should calculate correct conductor size for IEC example', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.kValue).toBe(143)
      expect(result.calculatedSize).toBeCloseTo(174.83, 1)
      expect(result.conductorSize).toBe(185)
      expect(result.compliance).toContain('IEC 60364-5-54')
    })

    it('should calculate correct conductor size for NEC example', () => {
      const result = calculateEarthingConductor({
        voltage: 480,
        faultCurrent: 30,
        faultDuration: 0.5,
        material: 'copper',
        installationType: 'cable',
        standard: 'NEC'
      })

      expect(result.kValue).toBe(143)
      expect(result.calculatedSize).toBeCloseTo(148.25, 1)
      expect(result.conductorSize).toBe(150)
      expect(result.compliance).toContain('NEC 250')
    })

    it('should calculate for aluminum conductor', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 20,
        faultDuration: 1,
        material: 'aluminum',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.kValue).toBe(94)
      expect(result.calculatedSize).toBeCloseTo(212.77, 1)
      expect(result.conductorSize).toBe(240)
    })

    it('should calculate for bare copper conductor', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'bare',
        standard: 'IEC'
      })

      expect(result.kValue).toBe(226)
      expect(result.calculatedSize).toBeCloseTo(110.62, 1)
      expect(result.conductorSize).toBe(120)
    })
  })

  describe('Safety Factor Application', () => {
    it('should apply 20% safety factor correctly', () => {
      const resultWithoutSafety = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      const resultWithSafety = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC',
        safetyFactor: 20
      })

      expect(resultWithSafety.conductorSize).toBeGreaterThanOrEqual(resultWithoutSafety.conductorSize)
    })

    it('should calculate safety margin correctly', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.safetyMargin).toBeGreaterThan(0)
      expect(result.safetyMargin).toBeLessThan(100)
    })
  })

  describe('Calculation Steps', () => {
    it('should provide detailed calculation steps', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.calculationSteps).toContain('Formula: S = I × √t / k')
      expect(result.calculationSteps.length).toBeGreaterThan(3)
    })
  })

  describe('Warnings', () => {
    it('should warn for high fault current', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 150,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes('High fault current'))).toBe(true)
    })

    it('should warn for long fault duration', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 4,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.warnings.some(w => w.includes('Long fault duration'))).toBe(true)
    })
  })

  describe('Alternative Sizes', () => {
    it('should provide alternative conductor sizes', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.alternatives).toBeDefined()
      expect(result.alternatives.smaller).toBeDefined()
      expect(result.alternatives.larger).toBeDefined()
    })
  })

  describe('Standards Comparison', () => {
    it('should produce same results for IEC and NEC with same k-values', () => {
      const iecResult = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      const necResult = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'NEC'
      })

      expect(iecResult.conductorSize).toBe(necResult.conductorSize)
      expect(iecResult.kValue).toBe(necResult.kValue)
    })
  })

  describe('Edge Cases', () => {
    it('should handle minimum fault current', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 0.1,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.conductorSize).toBeGreaterThan(0)
    })

    it('should handle minimum fault duration', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 0.1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.conductorSize).toBeGreaterThan(0)
    })

    it('should throw error for invalid inputs', () => {
      expect(() => {
        calculateEarthingConductor({
          voltage: -100,
          faultCurrent: 25,
          faultDuration: 1,
          material: 'copper',
          installationType: 'cable',
          standard: 'IEC'
        })
      }).toThrow()
    })
  })
})
