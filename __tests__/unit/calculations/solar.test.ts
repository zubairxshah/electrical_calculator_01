/**
 * Solar Array Calculator Tests
 *
 * Tests solar panel array sizing per NREL standards
 * TDD Red Phase: Tests written BEFORE implementation
 *
 * Acceptance Criteria (SC-011): Account for temperature derating and soiling losses
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSolarArraySize,
  calculatePerformanceRatio,
  type SolarCalculatorInputs,
  type SolarCalculatorResult,
} from '@/lib/calculations/solar/arraySize'
import { toNumber, toBigNumber } from '@/lib/mathConfig'

describe('Solar Array Calculator', () => {
  describe('calculateSolarArraySize', () => {
    it('should calculate panel count for 10 kWh/day requirement (NREL example)', () => {
      // NREL example calculation
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.75,
        panelEfficiency: 0.20,
      }

      const result = calculateSolarArraySize(inputs)

      // Formula: Panels = Daily_kWh / (Panel_kW × PSH × PR)
      // = 10 / (0.300 × 5 × 0.75) = 10 / 1.125 = 8.89 → 9 panels (rounded up)
      expect(result.requiredPanels).toBe(9)
    })

    it('should calculate total array power correctly', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.75,
        panelEfficiency: 0.20,
      }

      const result = calculateSolarArraySize(inputs)

      // Total array power = required panels × panel wattage / 1000
      // = 9 × 300W / 1000 = 2.7 kWp
      expect(toNumber(result.totalArrayPowerKWp)).toBeCloseTo(2.7, 1)
    })

    it('should calculate estimated daily generation', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.75,
        panelEfficiency: 0.20,
      }

      const result = calculateSolarArraySize(inputs)

      // Estimated daily gen = Total kWp × PSH × PR
      // = 2.7 × 5 × 0.75 = 10.125 kWh/day
      expect(toNumber(result.estimatedDailyGenKWh)).toBeCloseTo(10.125, 1)
    })

    it('should calculate estimated annual generation', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.75,
        panelEfficiency: 0.20,
      }

      const result = calculateSolarArraySize(inputs)

      // Estimated annual gen = daily gen × 365
      // = 10.125 × 365 = 3695.625 kWh/year
      expect(toNumber(result.estimatedAnnualGenKWh)).toBeCloseTo(3695.625, 0)
    })

    it('should calculate required roof area', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.75,
        panelEfficiency: 0.20, // 20% efficiency
      }

      const result = calculateSolarArraySize(inputs)

      // Panel area = Panel_Watts / (1000 W/m² × efficiency)
      // = 300 / (1000 × 0.20) = 1.5 m² per panel
      // Total area = 9 panels × 1.5 m² = 13.5 m²
      expect(toNumber(result.arrayAreaM2)).toBeCloseTo(13.5, 1)
    })

    it('should handle edge case: minimum values', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 0.1, // 100 Wh/day
        peakSunHours: 1,
        panelWattage: 50,
        performanceRatio: 0.5,
        panelEfficiency: 0.10,
      }

      const result = calculateSolarArraySize(inputs)

      // Panels = 0.1 / (0.050 × 1 × 0.5) = 0.1 / 0.025 = 4 panels
      expect(result.requiredPanels).toBe(4)
    })

    it('should handle edge case: large commercial installation', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 1000, // 1 MWh/day
        peakSunHours: 6,
        panelWattage: 400,
        performanceRatio: 0.80,
        panelEfficiency: 0.22,
      }

      const result = calculateSolarArraySize(inputs)

      // Panels = 1000 / (0.400 × 6 × 0.80) = 1000 / 1.92 = 520.83 → 521 panels
      expect(result.requiredPanels).toBe(521)
      // Total power = 521 × 0.4 = 208.4 kWp
      expect(toNumber(result.totalArrayPowerKWp)).toBeCloseTo(208.4, 0)
    })

    it('should handle high PSH locations (e.g., Arizona)', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 30,
        peakSunHours: 7.5, // High PSH desert location
        panelWattage: 400,
        performanceRatio: 0.78,
        panelEfficiency: 0.21,
      }

      const result = calculateSolarArraySize(inputs)

      // Panels = 30 / (0.400 × 7.5 × 0.78) = 30 / 2.34 = 12.82 → 13 panels
      expect(result.requiredPanels).toBe(13)
    })

    it('should handle low PSH locations (e.g., Seattle)', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 3.0, // Low PSH cloudy location
        panelWattage: 350,
        performanceRatio: 0.72,
        panelEfficiency: 0.19,
      }

      const result = calculateSolarArraySize(inputs)

      // Panels = 10 / (0.350 × 3.0 × 0.72) = 10 / 0.756 = 13.23 → 14 panels
      expect(result.requiredPanels).toBe(14)
    })
  })

  describe('calculatePerformanceRatio', () => {
    it('should calculate PR with all loss factors', () => {
      const losses = {
        temperatureLoss: 0.08, // 8% temperature loss
        soilingLoss: 0.03, // 3% soiling
        shadingLoss: 0.02, // 2% shading
        wiringLoss: 0.02, // 2% DC wiring losses
        inverterEfficiency: 0.96, // 96% inverter efficiency
        mismatchLoss: 0.02, // 2% module mismatch
      }

      const pr = calculatePerformanceRatio(losses)

      // PR = (1 - temp) × (1 - soiling) × (1 - shading) × (1 - wiring) × inverterEff × (1 - mismatch)
      // = 0.92 × 0.97 × 0.98 × 0.98 × 0.96 × 0.98 = 0.8063
      expect(pr).toBeCloseTo(0.806, 2)
    })

    it('should return default PR (0.75) when no losses specified', () => {
      const pr = calculatePerformanceRatio({})

      // Default PR for grid-tied systems is typically 0.75-0.80
      expect(pr).toBeCloseTo(0.75, 2)
    })

    it('should handle optimistic PR (minimal losses)', () => {
      const losses = {
        temperatureLoss: 0.03,
        soilingLoss: 0.01,
        shadingLoss: 0.0,
        wiringLoss: 0.01,
        inverterEfficiency: 0.98,
        mismatchLoss: 0.01,
      }

      const pr = calculatePerformanceRatio(losses)

      // Should be close to 0.92
      expect(pr).toBeGreaterThan(0.90)
      expect(pr).toBeLessThan(0.95)
    })

    it('should handle pessimistic PR (high losses)', () => {
      const losses = {
        temperatureLoss: 0.15,
        soilingLoss: 0.10,
        shadingLoss: 0.05,
        wiringLoss: 0.03,
        inverterEfficiency: 0.93,
        mismatchLoss: 0.03,
      }

      const pr = calculatePerformanceRatio(losses)

      // Should be around 0.60-0.65
      expect(pr).toBeGreaterThan(0.55)
      expect(pr).toBeLessThan(0.70)
    })
  })

  describe('Validation: Performance Ratio Warnings', () => {
    it('should warn when PR is below typical range (<0.6)', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.55, // Too low
        panelEfficiency: 0.20,
      }

      const result = calculateSolarArraySize(inputs)

      expect(result.warnings.some((w) => w.message.includes('performance ratio'))).toBe(true)
      expect(result.warnings.some((w) => w.severity === 'warning')).toBe(true)
    })

    it('should warn when PR is above typical range (>0.9)', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.95, // Too high (unrealistic)
        panelEfficiency: 0.20,
      }

      const result = calculateSolarArraySize(inputs)

      expect(result.warnings.some((w) => w.message.includes('performance ratio'))).toBe(true)
    })

    it('should not warn for typical PR values (0.7-0.85)', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.78, // Normal
        panelEfficiency: 0.20,
      }

      const result = calculateSolarArraySize(inputs)

      // No warnings for normal PR values
      expect(
        result.warnings.filter((w) => w.message.includes('performance ratio')).length
      ).toBe(0)
    })
  })

  describe('Input Validation', () => {
    it('should throw error for invalid daily energy (out of range)', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 0, // Invalid
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.75,
        panelEfficiency: 0.20,
      }

      expect(() => calculateSolarArraySize(inputs)).toThrow(
        'dailyEnergyKWh must be between 0.1 and 100000'
      )
    })

    it('should throw error for invalid peak sun hours', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 0, // Invalid
        panelWattage: 300,
        performanceRatio: 0.75,
        panelEfficiency: 0.20,
      }

      expect(() => calculateSolarArraySize(inputs)).toThrow(
        'peakSunHours must be between 1 and 12'
      )
    })

    it('should throw error for invalid panel wattage', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 1500, // Invalid (too high)
        performanceRatio: 0.75,
        panelEfficiency: 0.20,
      }

      expect(() => calculateSolarArraySize(inputs)).toThrow(
        'panelWattage must be between 50 and 1000'
      )
    })

    it('should throw error for invalid performance ratio', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 1.5, // Invalid (>1.0)
        panelEfficiency: 0.20,
      }

      expect(() => calculateSolarArraySize(inputs)).toThrow(
        'performanceRatio must be between 0.5 and 1.0'
      )
    })
  })

  describe('Standard References', () => {
    it('should include NREL reference in results', () => {
      const inputs: SolarCalculatorInputs = {
        dailyEnergyKWh: 10,
        peakSunHours: 5,
        panelWattage: 300,
        performanceRatio: 0.75,
        panelEfficiency: 0.20,
      }

      const result = calculateSolarArraySize(inputs)

      expect(result.standardsUsed).toContain('NREL')
    })
  })
})
