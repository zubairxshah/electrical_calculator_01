/**
 * Battery Backup Calculator Tests
 *
 * Tests backup time calculations per IEEE 485-2020 standards
 * TDD Red Phase: Tests written BEFORE implementation
 *
 * Acceptance Criteria (SC-005): ±2% accuracy for battery calculations
 *
 * @see specs/001-electromate-engineering-app/spec.md#US1
 */

import { describe, it, expect } from 'vitest'
import { calculateBackupTime, calculateDischargeRate } from '@/lib/calculations/battery'
import type { BatteryCalculatorInputs } from '@/lib/types/calculations'
import { toBigNumber, toNumber } from '@/lib/mathConfig'

describe('Battery Backup Calculator', () => {
  describe('calculateBackupTime', () => {
    it('should calculate backup time for 48V/200Ah battery with 2000W load (IEEE 485 example)', () => {
      // IEEE 485-2020 example calculation
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateBackupTime(inputs)

      // Expected: (48V × 200Ah × 0.8 × 0.9) / 2000W = 3.456 hours
      const expectedHours = 3.456
      const actualHours = toNumber(result.backupTimeHours)

      // SC-005: Within ±2% accuracy
      expect(actualHours).toBeCloseTo(expectedHours, 2)
      expect(Math.abs(actualHours - expectedHours) / expectedHours).toBeLessThan(0.02)
    })

    it('should calculate backup time for 12V/100Ah battery with 500W load', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 12,
        ampHours: 100,
        loadWatts: 500,
        efficiency: 0.85,
        agingFactor: 0.9,
        chemistry: 'FLA',
      }

      const result = calculateBackupTime(inputs)

      // Expected: (12V × 100Ah × 0.9 × 0.85) / 500W = 1.836 hours
      const expectedHours = 1.836
      const actualHours = toNumber(result.backupTimeHours)

      expect(actualHours).toBeCloseTo(expectedHours, 2)
      expect(Math.abs(actualHours - expectedHours) / expectedHours).toBeLessThan(0.02)
    })

    it('should handle high-voltage DC systems (110V telecom)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 110,
        ampHours: 500,
        loadWatts: 5000,
        efficiency: 0.92,
        agingFactor: 0.85,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateBackupTime(inputs)

      // Expected: (110V × 500Ah × 0.85 × 0.92) / 5000W = 8.602 hours
      const expectedHours = 8.602
      const actualHours = toNumber(result.backupTimeHours)

      expect(actualHours).toBeCloseTo(expectedHours, 2)
    })

    it('should return effective capacity after efficiency and aging', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateBackupTime(inputs)

      // Effective capacity = 200Ah × 0.8 = 160Ah
      expect(toNumber(result.effectiveCapacityAh)).toBeCloseTo(160, 1)
    })

    it('should handle edge case: minimum values', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 12,
        ampHours: 10,
        loadWatts: 100,
        efficiency: 0.7,
        agingFactor: 0.5,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateBackupTime(inputs)

      // Expected: (12V × 10Ah × 0.5 × 0.7) / 100W = 0.42 hours
      expect(toNumber(result.backupTimeHours)).toBeCloseTo(0.42, 2)
    })

    it('should handle edge case: large battery bank', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 480,
        ampHours: 5000,
        loadWatts: 100000,
        efficiency: 0.95,
        agingFactor: 1.0,
        chemistry: 'Li-ion',
      }

      const result = calculateBackupTime(inputs)

      // Expected: (480V × 5000Ah × 1.0 × 0.95) / 100000W = 22.8 hours
      expect(toNumber(result.backupTimeHours)).toBeCloseTo(22.8, 1)
    })
  })

  describe('calculateDischargeRate', () => {
    it('should calculate C-rate for discharge rate (IEEE 485 Section 5.3)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateDischargeRate(inputs)

      // Discharge rate = Load / (Voltage × Capacity) = 2000W / (48V × 200Ah) = 0.208 C-rate (C/4.8)
      expect(toNumber(result)).toBeCloseTo(0.208, 3)
    })

    it('should detect high discharge rate (>C/5 = 0.2)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 12,
        ampHours: 50,
        loadWatts: 200, // High load
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateDischargeRate(inputs)

      // Discharge rate = 200W / (12V × 50Ah) = 0.333 C-rate (>C/5, should trigger warning)
      expect(toNumber(result)).toBeGreaterThan(0.2)
    })

    it('should handle low discharge rate (<C/20 = 0.05)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 400,
        loadWatts: 500,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'FLA',
      }

      const result = calculateDischargeRate(inputs)

      // Discharge rate = 500W / (48V × 400Ah) = 0.026 C-rate (C/38)
      expect(toNumber(result)).toBeLessThan(0.05)
    })
  })

  describe('Validation: Dangerous Conditions (FR-004)', () => {
    it('should warn when discharge rate exceeds C/5 (0.2)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 24,
        ampHours: 100,
        loadWatts: 1000, // High discharge rate
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateBackupTime(inputs)

      // Discharge rate = 1000W / (24V × 100Ah) = 0.417 (>C/5)
      const dischargeRate = toNumber(calculateDischargeRate(inputs))
      expect(dischargeRate).toBeGreaterThan(0.2)

      // Should have warning in results
      expect(result.warnings).toBeDefined()
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some((w) => w.type === 'high-discharge-rate')).toBe(true)
    })

    it('should warn when aging factor indicates end-of-life (<0.8)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.7, // Below recommended threshold
        chemistry: 'VRLA-AGM',
      }

      const result = calculateBackupTime(inputs)

      expect(result.warnings.some((w) => w.type === 'end-of-life')).toBe(true)
    })

    it('should warn when efficiency is unrealistically low (<0.7)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.6, // Too low
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateBackupTime(inputs)

      expect(result.warnings.some((w) => w.type === 'unrealistic-efficiency')).toBe(true)
    })

    it('should not warn for normal operating conditions', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 1500, // Moderate load
        efficiency: 0.9,
        agingFactor: 0.85,
        chemistry: 'VRLA-AGM',
      }

      const result = calculateBackupTime(inputs)

      // No warnings for normal conditions
      expect(result.warnings.length).toBe(0)
    })
  })

  describe('Input Validation', () => {
    it('should throw error for invalid voltage (out of range)', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 0, // Invalid
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      expect(() => calculateBackupTime(inputs)).toThrow('voltage must be between 1 and 2000')
    })

    it('should throw error for invalid amp-hours', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: -10, // Invalid
        loadWatts: 2000,
        efficiency: 0.9,
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      expect(() => calculateBackupTime(inputs)).toThrow('ampHours must be between 1 and 10000')
    })

    it('should throw error for invalid efficiency', () => {
      const inputs: BatteryCalculatorInputs = {
        voltage: 48,
        ampHours: 200,
        loadWatts: 2000,
        efficiency: 1.5, // Invalid (>1.0)
        agingFactor: 0.8,
        chemistry: 'VRLA-AGM',
      }

      expect(() => calculateBackupTime(inputs)).toThrow(/efficiency must be between 0.1 and 1/)
    })
  })
})
