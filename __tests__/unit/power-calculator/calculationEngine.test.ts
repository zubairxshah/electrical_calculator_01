/**
 * Unit Tests for Power Calculation Engine
 * Tests Active, Reactive, and Apparent Power calculations
 * per IEC 60364 and NEC standards
 */

import { describe, it, expect } from 'vitest';
import {
  PowerCalculationEngine,
  calculatePower,
} from '../../../services/power-calculator/calculationEngine';
import { PowerCalculationParameters } from '../../../models/PowerCalculationParameters';

describe('PowerCalculationEngine', () => {
  const engine = new PowerCalculationEngine();

  describe('Single-Phase Calculations', () => {
    it('should calculate correctly for reference case (230V, 20A, PF=0.9)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      // P = V × I × cosφ = 230 × 20 × 0.9 = 4140 W = 4.14 kW
      expect(result.activePower).toBe(4.14);
      // Q = V × I × sinφ = 230 × 20 × sin(arccos(0.9)) = 2004 VAR ≈ 2.00 kVAR
      expect(result.reactivePower).toBeCloseTo(2.00, 1);
      // S = V × I = 230 × 20 = 4600 VA = 4.60 kVA
      expect(result.apparentPower).toBe(4.60);
    });

    it('should calculate correctly for unity power factor (PF=1.0)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 120,
        current: 10,
        powerFactor: 1.0,
      };

      const result = engine.calculate(params);

      // P = 120 × 10 × 1.0 = 1200 W = 1.20 kW
      expect(result.activePower).toBe(1.20);
      // Q = 120 × 10 × 0 = 0 kVAR (no reactive power at unity PF)
      expect(result.reactivePower).toBe(0);
      // S = 120 × 10 = 1200 VA = 1.20 kVA
      expect(result.apparentPower).toBe(1.20);
    });

    it('should calculate correctly for low power factor (PF=0.7)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 30,
        powerFactor: 0.7,
      };

      const result = engine.calculate(params);

      // P = 230 × 30 × 0.7 = 4830 W = 4.83 kW
      expect(result.activePower).toBe(4.83);
      // S = 230 × 30 = 6900 VA = 6.90 kVA
      expect(result.apparentPower).toBe(6.90);
      // Q = √(S² - P²) = √(6.9² - 4.83²) ≈ 4.93 kVAR
      expect(result.reactivePower).toBeCloseTo(4.93, 1);
    });

    it('should use correct formula string for single-phase', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      expect(result.formula).toBe('P = V × I × cosφ');
    });
  });

  describe('Three-Phase Calculations', () => {
    it('should calculate correctly for reference case (400V, 50A, PF=0.85)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = engine.calculate(params);

      // P = √3 × V × I × cosφ = 1.732 × 400 × 50 × 0.85 = 29444 W ≈ 29.44 kW
      expect(result.activePower).toBe(29.44);
      // S = √3 × V × I = 1.732 × 400 × 50 = 34641 VA ≈ 34.64 kVA
      expect(result.apparentPower).toBe(34.64);
      // Q = √(S² - P²) ≈ 18.26 kVAR
      expect(result.reactivePower).toBeCloseTo(18.26, 1);
    });

    it('should calculate correctly for unity power factor', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 480,
        current: 100,
        powerFactor: 1.0,
      };

      const result = engine.calculate(params);

      // P = √3 × 480 × 100 × 1.0 = 83138 W ≈ 83.14 kW
      expect(result.activePower).toBe(83.14);
      // Q = 0 kVAR at unity PF
      expect(result.reactivePower).toBe(0);
      // S = √3 × 480 × 100 = 83138 VA ≈ 83.14 kVA
      expect(result.apparentPower).toBe(83.14);
    });

    it('should use correct formula string for three-phase', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = engine.calculate(params);

      expect(result.formula).toBe('P = √3 × V × I × cosφ');
    });

    it('should calculate phase angle correctly', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = engine.calculate(params);

      // φ = arccos(0.85) ≈ 31.79°
      expect(result.phaseAngle).toBeCloseTo(31.79, 1);
    });
  });

  describe('Power Triangle Relationship', () => {
    it('should satisfy S² = P² + Q² for single-phase', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      const calculatedS = Math.sqrt(
        result.activePower ** 2 + result.reactivePower ** 2
      );
      expect(calculatedS).toBeCloseTo(result.apparentPower, 2);
    });

    it('should satisfy S² = P² + Q² for three-phase', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = engine.calculate(params);

      const calculatedS = Math.sqrt(
        result.activePower ** 2 + result.reactivePower ** 2
      );
      expect(calculatedS).toBeCloseTo(result.apparentPower, 2);
    });
  });

  describe('Power Factor and Phase Angle', () => {
    it('should calculate correct phase angle for PF=0.9', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      // φ = arccos(0.9) ≈ 25.84°
      expect(result.phaseAngle).toBeCloseTo(25.84, 1);
    });

    it('should calculate correct phase angle for PF=0.85', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = engine.calculate(params);

      // φ = arccos(0.85) ≈ 31.79°
      expect(result.phaseAngle).toBeCloseTo(31.79, 1);
    });

    it('should have phase angle of 0° for unity power factor', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 120,
        current: 10,
        powerFactor: 1.0,
      };

      const result = engine.calculate(params);

      expect(result.phaseAngle).toBe(0);
    });
  });

  describe('Standard References', () => {
    it('should include IEC references for single-phase', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      expect(result.standardReferences).toContain('IEC 60364-5-52');
      expect(result.standardReferences).toContain('IEC 60038');
    });

    it('should include NEC references for three-phase', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = engine.calculate(params);

      expect(result.standardReferences).toContain('NEC Article 430');
      expect(result.standardReferences).toContain('NEC Article 220');
    });
  });

  describe('Compliance Checks', () => {
    it('should mark power factor ≥ 0.85 as compliant', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      const pfCheck = result.complianceChecks.find((c) =>
        c.requirement.includes('Power factor')
      );
      expect(pfCheck?.compliant).toBe(true);
    });

    it('should mark power factor < 0.85 as non-compliant', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.7,
      };

      const result = engine.calculate(params);

      const pfCheck = result.complianceChecks.find((c) =>
        c.requirement.includes('Power factor')
      );
      expect(pfCheck?.compliant).toBe(false);
    });

    it('should verify power triangle relationship', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = engine.calculate(params);

      const triangleCheck = result.complianceChecks.find((c) =>
        c.requirement.includes('Power triangle')
      );
      expect(triangleCheck?.compliant).toBe(true);
    });
  });

  describe('Warnings', () => {
    it('should warn for low power factor (< 0.85)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.7,
      };

      const result = engine.calculate(params);

      expect(result.warnings.some((w) => w.includes('Low power factor'))).toBe(true);
    });

    it('should warn for very low power factor (< 0.7)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.6,
      };

      const result = engine.calculate(params);

      expect(result.warnings.some((w) => w.includes('Very low power factor'))).toBe(true);
    });

    it('should warn for high current (> 1000A)', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 1500,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      expect(result.warnings.some((w) => w.includes('High current'))).toBe(true);
    });

    it('should warn for three-phase load balancing', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      expect(result.warnings.some((w) => w.includes('balanced'))).toBe(true);
    });

    it('should not warn for good power factor', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.95,
      };

      const result = engine.calculate(params);

      expect(result.warnings.some((w) => w.includes('power factor'))).toBe(false);
    });
  });

  describe('kVA to kW Conversion', () => {
    it('should convert kVA to kW correctly', () => {
      const result = engine.convertKVAtokW(100, 0.8);

      // kW = kVA × cosφ = 100 × 0.8 = 80 kW
      expect(result.kw).toBe(80);
      expect(result.formula).toBe('kW = kVA × cosφ');
    });

    it('should handle unity power factor conversion', () => {
      const result = engine.convertKVAtokW(50, 1.0);

      expect(result.kw).toBe(50);
    });
  });

  describe('kW to kVA Conversion', () => {
    it('should convert kW to kVA correctly', () => {
      const result = engine.convertkWtokVA(80, 0.8);

      // kVA = kW / cosφ = 80 / 0.8 = 100 kVA
      expect(result.kva).toBe(100);
      expect(result.formula).toBe('kVA = kW / cosφ');
    });
  });

  describe('Power Factor Correction', () => {
    it('should calculate required capacitor kVAR', () => {
      const result = engine.calculatePowerFactorCorrection(100, 0.7, 0.95);

      // Current: tan(arccos(0.7)) ≈ 1.02, Q = 100 × 1.02 = 102 kVAR
      // Target: tan(arccos(0.95)) ≈ 0.33, Q = 100 × 0.33 = 33 kVAR
      // Required: 102 - 33 = 69 kVAR
      expect(result.requiredCapacitorKVAR).toBeGreaterThan(60);
      expect(result.requiredCapacitorKVAR).toBeLessThan(80);
    });

    it('should show efficiency improvement', () => {
      const result = engine.calculatePowerFactorCorrection(100, 0.7, 0.95);

      expect(result.efficiencyImprovement).toBeGreaterThan(0);
    });
  });

  describe('Convenience Function', () => {
    it('should calculate power using convenience function', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = calculatePower(params);

      expect(result.activePower).toBe(4.14);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum valid values', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 100,
        current: 0.1,
        powerFactor: 0.1,
      };

      const result = engine.calculate(params);

      expect(result.activePower).toBeGreaterThanOrEqual(0);
      expect(result.apparentPower).toBeGreaterThanOrEqual(0);
    });

    it('should handle maximum valid values', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 1000,
        current: 10000,
        powerFactor: 1.0,
      };

      const result = engine.calculate(params);

      expect(result.activePower).toBeGreaterThan(0);
      // P = √3 × 1000 × 10000 × 1.0 = 17,320,508 W ≈ 17,320.51 kW
      expect(result.activePower).toBeCloseTo(17320.51, 1);
    });

    it('should handle very small power factor', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 10,
        powerFactor: 0.1,
      };

      const result = engine.calculate(params);

      // Most power is reactive at low PF
      expect(result.reactivePower).toBeGreaterThan(result.activePower);
    });
  });

  describe('Performance', () => {
    it('should complete calculation in <50ms', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const start = performance.now();
      engine.calculate(params);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('should complete 1000 calculations in <1 second', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        engine.calculate(params);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Result Metadata', () => {
    it('should include calculation timestamp', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      expect(result.calculationTimestamp).toBeInstanceOf(Date);
    });

    it('should include system type in result', () => {
      const params: PowerCalculationParameters = {
        systemType: 'three-phase',
        voltage: 400,
        current: 50,
        powerFactor: 0.85,
      };

      const result = engine.calculate(params);

      expect(result.systemType).toBe('three-phase');
    });

    it('should include power factor in result', () => {
      const params: PowerCalculationParameters = {
        systemType: 'single-phase',
        voltage: 230,
        current: 20,
        powerFactor: 0.9,
      };

      const result = engine.calculate(params);

      expect(result.powerFactor).toBe(0.9);
    });
  });
});
