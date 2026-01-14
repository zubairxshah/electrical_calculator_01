/**
 * Accuracy Verification Tests for Earthing Conductor Calculator
 * Verifies ±1% accuracy against known calculations
 */

import { describe, it, expect } from 'vitest'
import { calculateEarthingConductor } from '@/lib/calculations/earthing/earthingCalculator'

describe('Accuracy Verification', () => {
  describe('Formula Accuracy: S = I × √t / k', () => {
    it('should calculate exact values per formula', () => {
      // Test: 25kA, 1s, k=143
      // Expected: 25000 × √1 / 143 = 174.825174825...
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      const expected = (25000 * Math.sqrt(1)) / 143
      const accuracy = Math.abs(result.calculatedSize - expected) / expected
      
      expect(accuracy).toBeLessThan(0.0001) // <0.01% error
    })

    it('should maintain accuracy with square root calculations', () => {
      // Test: 30kA, 0.5s, k=143
      // Expected: 30000 × √0.5 / 143 = 148.251748...
      const result = calculateEarthingConductor({
        voltage: 480,
        faultCurrent: 30,
        faultDuration: 0.5,
        material: 'copper',
        installationType: 'cable',
        standard: 'NEC'
      })

      const expected = (30000 * Math.sqrt(0.5)) / 143
      const accuracy = Math.abs(result.calculatedSize - expected) / expected
      
      expect(accuracy).toBeLessThan(0.0001)
    })
  })

  describe('Known Reference Calculations', () => {
    const referenceCalculations = [
      {
        name: 'IEC Example 1',
        inputs: { faultCurrent: 10, duration: 0.5, kValue: 143 },
        expected: 49.48
      },
      {
        name: 'IEC Example 2',
        inputs: { faultCurrent: 25, duration: 1.0, kValue: 143 },
        expected: 174.83
      },
      {
        name: 'IEC Example 3',
        inputs: { faultCurrent: 50, duration: 0.2, kValue: 94 },
        expected: 238.05
      },
      {
        name: 'NEC Example 1',
        inputs: { faultCurrent: 30, duration: 0.5, kValue: 143 },
        expected: 148.25
      },
      {
        name: 'NEC Example 2',
        inputs: { faultCurrent: 15, duration: 1.0, kValue: 143 },
        expected: 104.90
      }
    ]

    referenceCalculations.forEach(({ name, inputs, expected }) => {
      it(`should match ${name} within ±1%`, () => {
        const material = inputs.kValue === 143 ? 'copper' : 'aluminum'
        const installationType = inputs.kValue === 143 ? 'cable' : 'cable'
        
        const result = calculateEarthingConductor({
          voltage: 400,
          faultCurrent: inputs.faultCurrent,
          faultDuration: inputs.duration,
          material,
          installationType,
          standard: 'IEC'
        })

        const accuracy = Math.abs(result.calculatedSize - expected) / expected
        expect(accuracy).toBeLessThan(0.01) // <1% error
      })
    })
  })

  describe('Material Constant Accuracy', () => {
    it('should use correct k-value for copper cable', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.kValue).toBe(143)
    })

    it('should use correct k-value for copper bare', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'bare',
        standard: 'IEC'
      })

      expect(result.kValue).toBe(226)
    })

    it('should use correct k-value for aluminum cable', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'aluminum',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.kValue).toBe(94)
    })

    it('should use correct k-value for aluminum bare', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'aluminum',
        installationType: 'bare',
        standard: 'IEC'
      })

      expect(result.kValue).toBe(135)
    })
  })

  describe('Rounding Accuracy', () => {
    it('should round up to next standard size correctly', () => {
      // 174.83 mm² should round to 185 mm²
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.calculatedSize).toBeCloseTo(174.83, 1)
      expect(result.conductorSize).toBe(185)
    })

    it('should handle exact standard size matches', () => {
      // Calculate to get exactly 150 mm²
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 21.45,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.conductorSize).toBe(150)
    })
  })

  describe('Safety Factor Accuracy', () => {
    it('should apply 20% safety factor correctly', () => {
      const baseResult = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC',
        safetyFactor: 0
      })

      const safetyResult = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC',
        safetyFactor: 20
      })

      // With 20% safety factor: 174.83 × 1.2 = 209.80 → rounds to 240 mm²
      const expectedWithSafety = baseResult.calculatedSize * 1.2
      expect(safetyResult.calculatedSize).toBeCloseTo(expectedWithSafety, 1)
    })

    it('should calculate safety margin accurately', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      // Safety margin = (185 - 174.83) / 174.83 × 100 = 5.82%
      const expectedMargin = ((result.conductorSize - result.calculatedSize) / result.calculatedSize) * 100
      expect(result.safetyMargin).toBeCloseTo(expectedMargin, 1)
    })
  })

  describe('Precision Consistency', () => {
    it('should produce consistent results for same inputs', () => {
      const inputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper' as const,
        installationType: 'cable' as const,
        standard: 'IEC' as const
      }

      const results = Array.from({ length: 100 }, () => 
        calculateEarthingConductor(inputs)
      )

      const firstResult = results[0]
      results.forEach(result => {
        expect(result.calculatedSize).toBe(firstResult.calculatedSize)
        expect(result.conductorSize).toBe(firstResult.conductorSize)
        expect(result.kValue).toBe(firstResult.kValue)
      })
    })

    it('should maintain precision with floating point operations', () => {
      const testCases = [
        { current: 10.5, duration: 0.75 },
        { current: 25.3, duration: 1.25 },
        { current: 33.7, duration: 0.33 }
      ]

      testCases.forEach(({ current, duration }) => {
        const result = calculateEarthingConductor({
          voltage: 400,
          faultCurrent: current,
          faultDuration: duration,
          material: 'copper',
          installationType: 'cable',
          standard: 'IEC'
        })

        const expected = (current * 1000 * Math.sqrt(duration)) / 143
        const accuracy = Math.abs(result.calculatedSize - expected) / expected
        expect(accuracy).toBeLessThan(0.0001)
      })
    })
  })

  describe('Extreme Value Accuracy', () => {
    it('should maintain accuracy at minimum values', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 0.1,
        faultDuration: 0.1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      const expected = (0.1 * 1000 * Math.sqrt(0.1)) / 143
      const accuracy = Math.abs(result.calculatedSize - expected) / expected
      expect(accuracy).toBeLessThan(0.01)
    })

    it('should maintain accuracy at maximum values', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 200,
        faultDuration: 5,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      const expected = (200 * 1000 * Math.sqrt(5)) / 143
      const accuracy = Math.abs(result.calculatedSize - expected) / expected
      expect(accuracy).toBeLessThan(0.01)
    })
  })
})
