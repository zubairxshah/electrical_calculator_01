/**
 * Standards Compliance Tests for Earthing Conductor Calculator
 * Verifies calculations against IEC 60364-5-54 and NEC 250 examples
 */

import { describe, it, expect } from 'vitest'
import { calculateEarthingConductor } from '@/lib/calculations/earthing/earthingCalculator'

describe('Standards Compliance Testing', () => {
  describe('IEC 60364-5-54 Examples', () => {
    it('should calculate correctly for 10kA, 0.5s, copper cable', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 10,
        faultDuration: 0.5,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      // S = 10000 × √0.5 / 143 = 49.48 mm² → rounds to 50 mm²
      expect(result.calculatedSize).toBeCloseTo(49.48, 1)
      expect(result.conductorSize).toBe(50)
      expect(result.compliance).toContain('IEC 60364-5-54')
    })

    it('should calculate correctly for 25kA, 1s, copper cable', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      // S = 25000 × √1 / 143 = 174.83 mm² → rounds to 185 mm²
      expect(result.calculatedSize).toBeCloseTo(174.83, 1)
      expect(result.conductorSize).toBe(185)
      expect(result.kValue).toBe(143)
    })

    it('should calculate correctly for 50kA, 0.2s, aluminum cable', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 50,
        faultDuration: 0.2,
        material: 'aluminum',
        installationType: 'cable',
        standard: 'IEC'
      })

      // S = 50000 × √0.2 / 94 = 238.05 mm² → rounds to 240 mm²
      expect(result.calculatedSize).toBeCloseTo(238.05, 1)
      expect(result.conductorSize).toBe(240)
      expect(result.kValue).toBe(94)
    })

    it('should calculate correctly for bare copper conductor', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 20,
        faultDuration: 1,
        material: 'copper',
        installationType: 'bare',
        standard: 'IEC'
      })

      // S = 20000 × √1 / 226 = 88.50 mm² → rounds to 95 mm²
      expect(result.calculatedSize).toBeCloseTo(88.50, 1)
      expect(result.conductorSize).toBe(95)
      expect(result.kValue).toBe(226)
    })

    it('should calculate correctly for low fault current', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 5,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      // S = 5000 × √1 / 143 = 34.97 mm² → rounds to 35 mm²
      expect(result.calculatedSize).toBeCloseTo(34.97, 1)
      expect(result.conductorSize).toBe(35)
    })
  })

  describe('NEC 250 Examples', () => {
    it('should calculate correctly for 30kA, 0.5s, copper cable', () => {
      const result = calculateEarthingConductor({
        voltage: 480,
        faultCurrent: 30,
        faultDuration: 0.5,
        material: 'copper',
        installationType: 'cable',
        standard: 'NEC'
      })

      // S = 30000 × √0.5 / 143 = 148.25 mm² → rounds to 150 mm²
      expect(result.calculatedSize).toBeCloseTo(148.25, 1)
      expect(result.conductorSize).toBe(150)
      expect(result.compliance).toContain('NEC 250')
    })

    it('should calculate correctly for 15kA, 1s, copper cable', () => {
      const result = calculateEarthingConductor({
        voltage: 208,
        faultCurrent: 15,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'NEC'
      })

      // S = 15000 × √1 / 143 = 104.90 mm² → rounds to 120 mm²
      expect(result.calculatedSize).toBeCloseTo(104.90, 1)
      expect(result.conductorSize).toBe(120)
    })

    it('should calculate correctly for aluminum conductor', () => {
      const result = calculateEarthingConductor({
        voltage: 480,
        faultCurrent: 20,
        faultDuration: 0.5,
        material: 'aluminum',
        installationType: 'cable',
        standard: 'NEC'
      })

      // S = 20000 × √0.5 / 94 = 150.59 mm² → rounds to 185 mm²
      expect(result.calculatedSize).toBeCloseTo(150.59, 1)
      expect(result.conductorSize).toBe(185)
      expect(result.kValue).toBe(94)
    })
  })

  describe('IEC vs NEC Comparison', () => {
    it('should produce identical results for same k-values', () => {
      const inputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper' as const,
        installationType: 'cable' as const
      }

      const iecResult = calculateEarthingConductor({ ...inputs, standard: 'IEC' })
      const necResult = calculateEarthingConductor({ ...inputs, standard: 'NEC' })

      expect(iecResult.calculatedSize).toBe(necResult.calculatedSize)
      expect(iecResult.conductorSize).toBe(necResult.conductorSize)
      expect(iecResult.kValue).toBe(necResult.kValue)
    })

    it('should reference correct standard in compliance', () => {
      const inputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper' as const,
        installationType: 'cable' as const
      }

      const iecResult = calculateEarthingConductor({ ...inputs, standard: 'IEC' })
      const necResult = calculateEarthingConductor({ ...inputs, standard: 'NEC' })

      expect(iecResult.compliance).toContain('IEC')
      expect(necResult.compliance).toContain('NEC')
    })
  })

  describe('Material Comparison', () => {
    it('should require larger conductor for aluminum vs copper', () => {
      const baseInputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        installationType: 'cable' as const,
        standard: 'IEC' as const
      }

      const copperResult = calculateEarthingConductor({ ...baseInputs, material: 'copper' })
      const aluminumResult = calculateEarthingConductor({ ...baseInputs, material: 'aluminum' })

      expect(aluminumResult.conductorSize).toBeGreaterThan(copperResult.conductorSize)
    })

    it('should require smaller conductor for bare vs cable', () => {
      const baseInputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper' as const,
        standard: 'IEC' as const
      }

      const cableResult = calculateEarthingConductor({ ...baseInputs, installationType: 'cable' })
      const bareResult = calculateEarthingConductor({ ...baseInputs, installationType: 'bare' })

      expect(bareResult.conductorSize).toBeLessThan(cableResult.conductorSize)
    })
  })

  describe('Safety Factor Application', () => {
    it('should increase conductor size with safety factor', () => {
      const baseInputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper' as const,
        installationType: 'cable' as const,
        standard: 'IEC' as const
      }

      const noSafetyResult = calculateEarthingConductor({ ...baseInputs, safetyFactor: 0 })
      const withSafetyResult = calculateEarthingConductor({ ...baseInputs, safetyFactor: 20 })

      expect(withSafetyResult.conductorSize).toBeGreaterThanOrEqual(noSafetyResult.conductorSize)
    })

    it('should calculate correct safety margin', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      // Safety margin = (185 - 174.83) / 174.83 * 100 = 5.8%
      expect(result.safetyMargin).toBeGreaterThan(5)
      expect(result.safetyMargin).toBeLessThan(6)
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
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
      expect(result.conductorSize).toBe(1.5) // Minimum standard size
    })

    it('should handle maximum fault current', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 200,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      expect(result.conductorSize).toBeGreaterThan(1000)
      expect(result.warnings.length).toBeGreaterThan(0)
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

      // S = 25000 × √0.1 / 143 = 55.28 mm² → rounds to 70 mm²
      expect(result.calculatedSize).toBeCloseTo(55.28, 1)
      expect(result.conductorSize).toBe(70)
    })

    it('should handle maximum fault duration', () => {
      const result = calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 5,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })

      // S = 25000 × √5 / 143 = 390.91 mm² → rounds to 400 mm²
      expect(result.calculatedSize).toBeCloseTo(390.91, 1)
      expect(result.conductorSize).toBe(400)
      expect(result.warnings.some(w => w.includes('Long fault duration'))).toBe(true)
    })
  })

  describe('Calculation Accuracy', () => {
    const testCases = [
      { faultCurrent: 10, duration: 0.5, expected: 49.48 },
      { faultCurrent: 15, duration: 1.0, expected: 104.90 },
      { faultCurrent: 20, duration: 0.8, expected: 125.35 },
      { faultCurrent: 25, duration: 1.0, expected: 174.83 },
      { faultCurrent: 30, duration: 0.5, expected: 148.25 },
      { faultCurrent: 40, duration: 0.3, expected: 153.50 },
      { faultCurrent: 50, duration: 0.2, expected: 156.13 }
    ]

    testCases.forEach(({ faultCurrent, duration, expected }) => {
      it(`should calculate ${faultCurrent}kA, ${duration}s within ±1% accuracy`, () => {
        const result = calculateEarthingConductor({
          voltage: 400,
          faultCurrent,
          faultDuration: duration,
          material: 'copper',
          installationType: 'cable',
          standard: 'IEC'
        })

        const accuracy = Math.abs(result.calculatedSize - expected) / expected
        expect(accuracy).toBeLessThan(0.01) // <1% error
      })
    })
  })
})
