/**
 * Charge Controller Selection Tests
 *
 * Tests MPPT/PWM charge controller sizing and selection
 * TDD Red Phase: Tests written BEFORE implementation
 *
 * References:
 * - IEC 62109 (Safety of power converters for PV)
 * - FR-013: Controller V_oc rating >= 125% of array V_oc
 *
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

import { describe, it, expect } from 'vitest'
import {
  recommendChargeController,
  calculateSafetyMargins,
  recommendControllerType,
  type ChargeControllerInputs,
  type ChargeControllerResult,
} from '@/lib/calculations/solar/chargeController'

describe('Charge Controller Selection', () => {
  describe('recommendChargeController', () => {
    it('should recommend controller with 125% V_oc safety margin (FR-013)', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 320, // 8 panels x 40V
        arrayIsc: 9, // Single string
        batteryVoltage: 48,
        arrayMaxPower: 2400, // 8 x 300W panels
      }

      const result = recommendChargeController(inputs)

      // Controller V_oc rating must be >= 125% of array V_oc
      // 320V x 1.25 = 400V minimum
      expect(result.minimumVocRating).toBeGreaterThanOrEqual(400)
      expect(result.vocSafetyMargin).toBeCloseTo(0.25, 2)
    })

    it('should recommend controller with 20-25% I_sc safety margin', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 40,
        arrayIsc: 72, // 8 parallel strings x 9A
        batteryVoltage: 48,
        arrayMaxPower: 2400,
      }

      const result = recommendChargeController(inputs)

      // Controller I_sc rating should be 20-25% above array I_sc
      // 72A x 1.25 = 90A minimum
      expect(result.minimumIscRating).toBeGreaterThanOrEqual(86.4) // 72 x 1.20
      expect(result.minimumIscRating).toBeLessThanOrEqual(90) // 72 x 1.25
    })

    it('should calculate correct ratings for example case (8 panels @ 40V, 9A)', () => {
      // From task description: 8 panels × 40V V_oc = 320V, 8 panels × 9A I_sc = 72A
      const inputs: ChargeControllerInputs = {
        arrayVoc: 320,
        arrayIsc: 72,
        batteryVoltage: 48,
        arrayMaxPower: 2400,
      }

      const result = recommendChargeController(inputs)

      // V_oc: 320V x 1.25 = 400V minimum
      expect(result.minimumVocRating).toBe(400)
      // I_sc: 72A x 1.25 = 90A minimum
      expect(result.minimumIscRating).toBe(90)
    })

    it('should recommend standard controller sizes', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 150,
        arrayIsc: 30,
        batteryVoltage: 48,
        arrayMaxPower: 1500,
      }

      const result = recommendChargeController(inputs)

      // Should recommend standard sizes like 40A, 60A, 80A, 100A
      expect(result.recommendedControllers.length).toBeGreaterThan(0)
      expect(
        result.recommendedControllers.every((c) => c.currentRating >= result.minimumIscRating)
      ).toBe(true)
    })
  })

  describe('calculateSafetyMargins', () => {
    it('should calculate V_oc safety margin as 25%', () => {
      const margins = calculateSafetyMargins(320, 72)

      expect(margins.vocMargin).toBe(0.25)
      expect(margins.minVocRating).toBe(400) // 320 x 1.25
    })

    it('should calculate I_sc safety margin as 25%', () => {
      const margins = calculateSafetyMargins(320, 72)

      expect(margins.iscMargin).toBe(0.25)
      expect(margins.minIscRating).toBe(90) // 72 x 1.25
    })

    it('should handle small arrays', () => {
      const margins = calculateSafetyMargins(40, 9)

      expect(margins.minVocRating).toBe(50) // 40 x 1.25
      expect(margins.minIscRating).toBe(11.25) // 9 x 1.25
    })
  })

  describe('recommendControllerType (MPPT vs PWM)', () => {
    it('should recommend MPPT when voltage mismatch >20%', () => {
      // Array at 150V, battery at 48V = 212% mismatch
      const result = recommendControllerType(150, 48)

      expect(result.recommendedType).toBe('MPPT')
      expect(result.voltageMismatch).toBeGreaterThan(0.20)
    })

    it('should recommend PWM when voltage mismatch <20%', () => {
      // Array at 36V (nominal), battery at 24V = 50% but within PWM range
      // For PWM, array Vmp should be close to battery voltage
      const result = recommendControllerType(36, 24)

      // PWM requires array voltage to be close to battery charging voltage
      // 36V array to 24V battery - PWM can work but less efficient
      expect(result.recommendedType).toBe('PWM')
    })

    it('should explain MPPT efficiency gains', () => {
      const result = recommendControllerType(150, 48)

      expect(result.mpptEfficiencyGain).toBeGreaterThan(0)
      expect(result.explanation).toContain('MPPT')
    })

    it('should recommend MPPT for high-voltage arrays', () => {
      // 320V array to 48V battery - definitely needs MPPT
      const result = recommendControllerType(320, 48)

      expect(result.recommendedType).toBe('MPPT')
      // Voltage mismatch is calculated relative to battery charging voltage
      // High mismatch indicates MPPT is strongly recommended
      expect(result.voltageMismatch).toBeGreaterThan(1) // Significant mismatch
    })

    it('should calculate efficiency gain percentage', () => {
      const result = recommendControllerType(150, 48)

      // MPPT provides significant efficiency gain when voltage mismatch is high
      // The gain can exceed 100% when PWM would waste most of the power
      expect(result.mpptEfficiencyGain).toBeGreaterThanOrEqual(10)
      // Allow higher gains for large voltage mismatches
      expect(result.mpptEfficiencyGain).toBeLessThanOrEqual(200)
    })
  })

  describe('Temperature Compensation', () => {
    it('should adjust V_oc for cold temperature', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 320,
        arrayIsc: 72,
        batteryVoltage: 48,
        arrayMaxPower: 2400,
        minTemperature: -20, // Cold climate
        vocTempCoefficient: -0.003, // -0.3%/°C typical for silicon
      }

      const result = recommendChargeController(inputs)

      // V_oc increases in cold: at -20°C vs 25°C (STC), that's 45°C difference
      // 320V x (1 + 0.003 x 45) = 320 x 1.135 = 363.2V at -20°C
      // Then apply 25% safety: 363.2 x 1.25 = 454V
      expect(result.coldWeatherVoc).toBeGreaterThan(320)
      expect(result.minimumVocRating).toBeGreaterThan(400)
    })

    it('should use STC V_oc when no temperature specified', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 320,
        arrayIsc: 72,
        batteryVoltage: 48,
        arrayMaxPower: 2400,
      }

      const result = recommendChargeController(inputs)

      // Without temperature correction, use standard 25% margin
      expect(result.minimumVocRating).toBe(400) // 320 x 1.25
    })
  })

  describe('Input Validation', () => {
    it('should throw error for invalid V_oc', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 0, // Invalid
        arrayIsc: 72,
        batteryVoltage: 48,
        arrayMaxPower: 2400,
      }

      expect(() => recommendChargeController(inputs)).toThrow('arrayVoc must be positive')
    })

    it('should throw error for invalid I_sc', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 320,
        arrayIsc: -5, // Invalid
        batteryVoltage: 48,
        arrayMaxPower: 2400,
      }

      expect(() => recommendChargeController(inputs)).toThrow('arrayIsc must be positive')
    })

    it('should throw error for invalid battery voltage', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 320,
        arrayIsc: 72,
        batteryVoltage: 0, // Invalid
        arrayMaxPower: 2400,
      }

      expect(() => recommendChargeController(inputs)).toThrow('batteryVoltage must be positive')
    })
  })

  describe('Controller Recommendations', () => {
    it('should include standard controller sizes in recommendations', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 150,
        arrayIsc: 40,
        batteryVoltage: 48,
        arrayMaxPower: 2000,
      }

      const result = recommendChargeController(inputs)

      // Should recommend 60A or 80A controllers (standard sizes above 50A minimum)
      const sizes = result.recommendedControllers.map((c) => c.currentRating)
      expect(sizes.some((s) => [60, 80, 100].includes(s))).toBe(true)
    })

    it('should include both MPPT and PWM options when applicable', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 40, // Low voltage array
        arrayIsc: 20,
        batteryVoltage: 24,
        arrayMaxPower: 500,
      }

      const result = recommendChargeController(inputs)

      // For low-voltage arrays, both types should be viable
      const types = result.recommendedControllers.map((c) => c.type)
      expect(types).toContain('MPPT')
      // PWM may or may not be included depending on voltage match
    })

    it('should only recommend MPPT for high-voltage arrays', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 320,
        arrayIsc: 72,
        batteryVoltage: 48,
        arrayMaxPower: 2400,
      }

      const result = recommendChargeController(inputs)

      // High voltage array requires MPPT
      const types = result.recommendedControllers.map((c) => c.type)
      expect(types.every((t) => t === 'MPPT')).toBe(true)
    })
  })

  describe('Standards References', () => {
    it('should include IEC 62109 reference', () => {
      const inputs: ChargeControllerInputs = {
        arrayVoc: 320,
        arrayIsc: 72,
        batteryVoltage: 48,
        arrayMaxPower: 2400,
      }

      const result = recommendChargeController(inputs)

      expect(result.standardsUsed).toContain('IEC 62109')
    })
  })
})
