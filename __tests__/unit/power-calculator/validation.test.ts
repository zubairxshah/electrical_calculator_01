/**
 * Unit Tests for Power Calculation Validation
 * Tests input validation per IEC 60038 and NEC standards
 */

import { describe, it, expect } from 'vitest';
import {
  PowerValidationService,
  validatePowerInputs,
} from '../../../services/power-calculator/validation';
import { PowerCalculationParameters } from '../../../models/PowerCalculationParameters';

describe('PowerValidationService', () => {
  const validator = new PowerValidationService();

  describe('System Type Validation', () => {
    it('should accept valid single-phase system type', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(true);
      expect(result.errors.some((e) => e.field === 'systemType')).toBe(false);
    });

    it('should accept valid three-phase system type', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(true);
      expect(result.errors.some((e) => e.field === 'systemType')).toBe(false);
    });

    it('should reject invalid system type', () => {
      const params = {
        systemType: 'invalid' as any,
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'systemType')).toBe(true);
    });

    it('should reject missing system type', () => {
      const params = {
        systemType: undefined,
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      } as any;

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'systemType')).toBe(true);
    });
  });

  describe('Voltage Validation', () => {
    it('should accept valid voltage within range (100V-1000V)', () => {
      const validVoltages = [100, 120, 208, 230, 240, 277, 400, 415, 480, 600, 690, 1000];

      validVoltages.forEach((voltage) => {
        const params: PowerCalculationParameters = {
          systemType: 'single-phase',
          voltage,
          current: 20,
          powerFactor: 0.9,
        };

        const result = validator.validate(params);
        expect(result.errors.some((e) => e.field === 'voltage')).toBe(false);
      });
    });

    it('should reject voltage below minimum (100V)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 50,
        current: 20,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'voltage')).toBe(true);
      expect(result.errors.some((e) => e.message.includes('100'))).toBe(true);
    });

    it('should reject voltage above maximum (1000V)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 1500,
        current: 50,
        powerFactor: 0.85,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'voltage')).toBe(true);
      expect(result.errors.some((e) => e.message.includes('1000'))).toBe(true);
    });

    it('should reject zero voltage', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 0,
        current: 20,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'voltage')).toBe(true);
    });

    it('should reject negative voltage', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: -120,
        current: 20,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'voltage')).toBe(true);
    });

    it('should reject missing voltage', () => {
      const params = {
        systemType: 'single-phase',
        voltage: undefined,
        current: 20,
        powerFactor: 0.9,
      } as any;

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'voltage')).toBe(true);
    });
  });

  describe('Current Validation', () => {
    it('should accept valid current within range (0.1A-10000A)', () => {
      const validCurrents = [0.1, 1, 10, 20, 50, 100, 500, 1000, 5000, 10000];

      validCurrents.forEach((current) => {
        const params: PowerCalculationParameters = {
          systemType: 'single-phase',
          voltage: 230,
          current,
          powerFactor: 0.9,
        };

        const result = validator.validate(params);
        expect(result.errors.some((e) => e.field === 'current')).toBe(false);
      });
    });

    it('should reject current below minimum (0.1A)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 0.01,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'current')).toBe(true);
    });

    it('should reject current above maximum (10000A)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 15000,
        powerFactor: 0.85,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'current')).toBe(true);
    });

    it('should reject zero current', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 0,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'current')).toBe(true);
    });

    it('should reject negative current', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: -10,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'current')).toBe(true);
    });
  });

  describe('Power Factor Validation', () => {
    it('should accept valid power factor within range (0.1-1.0)', () => {
      const validPFs = [0.1, 0.5, 0.7, 0.8, 0.85, 0.9, 0.95, 1.0];

      validPFs.forEach((powerFactor) => {
        const params: PowerCalculationParameters = {
          systemType: 'single-phase',
          voltage: 230,
          current: 20,
          powerFactor,
        };

        const result = validator.validate(params);
        expect(result.errors.some((e) => e.field === 'powerFactor')).toBe(false);
      });
    });

    it('should warn for low power factor (< 0.85)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.7,
      };

      const result = validator.validate(params);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.message.includes('Low power factor'))).toBe(true);
    });

    it('should not warn for acceptable power factor (≥ 0.85)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.warnings.some((w) => w.message.includes('Low power factor'))).toBe(false);
    });

    it('should reject power factor below minimum (0.1)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.05,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'powerFactor')).toBe(true);
    });

    it('should reject power factor above maximum (1.0)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 1.5,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'powerFactor')).toBe(true);
    });

    it('should reject missing power factor', () => {
      const params = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: undefined,
      } as any;

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'powerFactor')).toBe(true);
    });
  });

  describe('Frequency Validation', () => {
    it('should accept 50 Hz', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
        frequency: 50,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(true);
    });

    it('should accept 60 Hz', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 120,
        current: 20,
        powerFactor: 0.9,
        frequency: 60,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid frequency (25 Hz)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
        frequency: 25 as any,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'frequency')).toBe(true);
    });

    it('should accept missing frequency (optional)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Complete Validation Scenarios', () => {
    it('should pass validation for valid single-phase input', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
        frequency: 50,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should pass validation for valid three-phase input', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
        frequency: 50,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail validation with multiple errors', () => {
      const params = {
        systemType: 'invalid' as any,
        voltage: -100,
        current: 0,
        powerFactor: 1.5,
      } as any;

      const result = validator.validate(params);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });

    it('should pass validation but warn for low power factor', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.7,
      };

      const result = validator.validate(params);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Convenience Functions', () => {
    it('should validate using convenience function', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = validatePowerInputs(params);
      expect(result.isValid).toBe(true);
    });

    it('should check validity with isValid method', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      expect(validator.isValid(params)).toBe(true);
    });

    it('should get error messages only', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 50,
        current: 20,
        powerFactor: 0.9,
      };

      const errors = validator.getErrors(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.toLowerCase().includes('100'))).toBe(true);
    });

    it('should get warning messages only', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.7,
      };

      const warnings = validator.getWarnings(params);
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete validation in <10ms', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
        frequency: 50,
      };

      const start = performance.now();
      validator.validate(params);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should complete 1000 validations in <100ms', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        validator.validate(params);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
