/**
 * Battery Validation Tests
 *
 * Tests real-time validation with <100ms target (SC-002)
 * TDD Red Phase: Tests written BEFORE implementation
 */

import { describe, it, expect } from 'vitest'
import { validateBatteryInputs, type BatteryValidationResult } from '@/lib/validation/batteryValidation'
import type { BatteryCalculatorInputs } from '@/lib/types'

describe('Battery Input Validation', () => {
  describe('Input Range Validation', () => {
    it('should pass validation for valid inputs', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should reject voltage below minimum (1V)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 0,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'voltage')).toBe(true)
    })

    it('should reject voltage above maximum (2000V)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 2500,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'voltage')).toBe(true)
    })

    it('should reject amp-hours below minimum (1Ah)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 0,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'ampHours')).toBe(true)
    })

    it('should reject load watts below minimum (1W)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 0,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'loadWatts')).toBe(true)
    })

    it('should reject efficiency below 0.1', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.05,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'efficiency')).toBe(true)
    })

    it('should reject efficiency above 1.0', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 1.2,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'efficiency')).toBe(true)
    })
  })

  describe('Dangerous Condition Detection (FR-004)', () => {
    it('should warn for high discharge rate (>C/5)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 24,
        ampHours: 100,
        loadWatts: 1000, // 1000W / (24V × 100Ah) = 0.417 C-rate
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.warnings.some((w) => w.message.includes('discharge rate'))).toBe(true)
      expect(result.warnings.some((w) => w.standardReference?.includes('IEEE 485'))).toBe(true)
    })

    it('should warn for battery end-of-life (aging factor <0.8)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.7,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.warnings.some((w) => w.message.includes('end-of-life'))).toBe(true)
    })

    it('should warn for unrealistic efficiency (<0.7 or >0.98)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.99,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)

      expect(result.warnings.some((w) => w.message.includes('efficiency'))).toBe(true)
    })
  })

  describe('Performance (SC-002: <100ms validation)', () => {
    it('should complete validation within 100ms', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const startTime = performance.now()
      const result = validateBatteryInputs(inputs)
      const endTime = performance.now()

      const executionTime = endTime - startTime

      expect(executionTime).toBeLessThan(100)
      expect(result).toBeDefined()
    })

    it('should handle batch validation efficiently', () => {
      const testCases: BatteryCalculatorInputs[] = Array.from({ length: 10 }, (_, i) => ({
        voltage: 48 + i,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }))

      const startTime = performance.now()

      for (const inputs of testCases) {
        validateBatteryInputs(inputs)
      }

      const endTime = performance.now()
      const avgTime = (endTime - startTime) / testCases.length

      // Average should be well under 100ms
      expect(avgTime).toBeLessThan(100)
    })
  })

  describe('Standard References', () => {
    it('should include IEEE 485-2020 reference for discharge rate warnings', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 12,
        ampHours: 50,
        loadWatts: 300,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = validateBatteryInputs(inputs)
      const dischargeWarning = result.warnings.find((w) => w.message.includes('discharge'))

      expect(dischargeWarning?.standardReference).toContain('IEEE 485')
    })
  })
})
