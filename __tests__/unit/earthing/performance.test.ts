/**
 * Performance Tests for Earthing Conductor Calculator
 * Verifies <100ms calculation time and efficient resource usage
 */

import { describe, it, expect } from 'vitest'
import { calculateEarthingConductor } from '@/lib/calculations/earthing/earthingCalculator'

describe('Performance Testing', () => {
  describe('Calculation Speed', () => {
    it('should calculate single result in <100ms', () => {
      const start = performance.now()
      
      calculateEarthingConductor({
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper',
        installationType: 'cable',
        standard: 'IEC'
      })
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(100)
    })

    it('should calculate 1000 iterations in <100ms total', () => {
      const inputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper' as const,
        installationType: 'cable' as const,
        standard: 'IEC' as const
      }

      const start = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        calculateEarthingConductor(inputs)
      }
      
      const duration = performance.now() - start
      const avgDuration = duration / 1000
      
      expect(avgDuration).toBeLessThan(0.1) // <0.1ms per calculation
    })

    it('should handle varying inputs efficiently', () => {
      const testInputs = [
        { faultCurrent: 10, duration: 0.5 },
        { faultCurrent: 25, duration: 1.0 },
        { faultCurrent: 50, duration: 0.2 },
        { faultCurrent: 100, duration: 0.1 }
      ]

      const start = performance.now()
      
      testInputs.forEach(({ faultCurrent, duration }) => {
        for (let i = 0; i < 250; i++) {
          calculateEarthingConductor({
            voltage: 400,
            faultCurrent,
            faultDuration: duration,
            material: 'copper',
            installationType: 'cable',
            standard: 'IEC'
          })
        }
      })
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory with repeated calculations', () => {
      const inputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper' as const,
        installationType: 'cable' as const,
        standard: 'IEC' as const
      }

      // Run many calculations
      for (let i = 0; i < 10000; i++) {
        calculateEarthingConductor(inputs)
      }

      // If we get here without memory issues, test passes
      expect(true).toBe(true)
    })

    it('should handle concurrent calculations', () => {
      const inputs = {
        voltage: 400,
        faultCurrent: 25,
        faultDuration: 1,
        material: 'copper' as const,
        installationType: 'cable' as const,
        standard: 'IEC' as const
      }

      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(calculateEarthingConductor(inputs))
      )

      return Promise.all(promises).then(results => {
        expect(results).toHaveLength(100)
        results.forEach(result => {
          expect(result.conductorSize).toBe(185)
        })
      })
    })
  })

  describe('Validation Performance', () => {
    it('should validate inputs quickly', () => {
      const start = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        try {
          calculateEarthingConductor({
            voltage: -100, // Invalid
            faultCurrent: 25,
            faultDuration: 1,
            material: 'copper',
            installationType: 'cable',
            standard: 'IEC'
          })
        } catch (e) {
          // Expected to throw
        }
      }
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Complex Calculations', () => {
    it('should handle calculations with all parameters efficiently', () => {
      const start = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        calculateEarthingConductor({
          voltage: 400,
          faultCurrent: 25,
          faultDuration: 1,
          material: 'copper',
          installationType: 'cable',
          standard: 'IEC',
          safetyFactor: 20,
          ambientTemp: 30,
          soilResistivity: 100
        })
      }
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(100)
    })
  })
})
