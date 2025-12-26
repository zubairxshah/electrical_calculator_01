/**
 * Cable Sizing Calculation Tests
 * Feature: 001-electromate-engineering-app
 * Tasks: T079-T081 - TDD Red Phase for Cable Sizing
 *
 * Validates voltage drop calculations against IEC 60364 and NEC standards.
 * Tests must FAIL before implementation (TDD Red phase).
 *
 * @see specs/001-electromate-engineering-app/spec.md - User Story 3
 * @see IEC 60364-5-52:2009 - Voltage drop calculations
 * @see NEC 2020 Table 310.15(B)(16) - Conductor ampacity
 */

import { describe, it, expect } from 'vitest';

// Import functions to be implemented (will cause test failures until implemented)
// T085-T088: Implementation tasks
import {
  calculateVoltageDrop,
  VoltageDrop,
} from '@/lib/calculations/cables/voltageDrop';
import {
  lookupCableAmpacity,
  CableAmpacity,
} from '@/lib/calculations/cables/ampacity';
import {
  calculateDeratingFactors,
  DeratingResult,
} from '@/lib/calculations/cables/deratingFactors';

/**
 * T079 - Voltage Drop Calculation Tests
 *
 * Tests the formula: V_drop = I × L × (mV/A/m) / 1000
 * or V_drop = I × L × R per IEC 60364/NEC
 *
 * Test cases derived from IEC 60364-5-52 examples and NEC Chapter 9, Table 8
 */
describe('Voltage Drop Calculations', () => {
  describe('Basic Voltage Drop Formula', () => {
    it('should calculate voltage drop for single-phase copper circuit (IEC example)', () => {
      // IEC 60364-5-52 typical example:
      // 30A single-phase, 50m copper 6mm², mV/A/m = 3.08 (from IEC table)
      // Expected: V_drop = 30 × 50 × 2 × 3.08 / 1000 = 9.24V (factor of 2 for single-phase)
      const result = calculateVoltageDrop({
        current: 30,
        length: 50,
        cableSizeMm2: 6,
        conductorMaterial: 'copper',
        circuitType: 'single-phase',
        standard: 'IEC',
      });

      // Using actual IEC 6mm² resistance of 3.08 mV/A/m
      expect(result.voltageDrop).toBeCloseTo(9.24, 1);
    });

    it('should calculate voltage drop for three-phase copper circuit', () => {
      // Three-phase: V_drop = √3 × I × L × R
      // 50A three-phase, 100m copper 16mm², mV/A/m = 1.15
      // Expected: V_drop = 1.732 × 50 × 100 × 1.15 / 1000 = 9.96V
      const result = calculateVoltageDrop({
        current: 50,
        length: 100,
        cableSizeMm2: 16,
        conductorMaterial: 'copper',
        circuitType: 'three-phase',
        standard: 'IEC',
      });

      expect(result.voltageDrop).toBeCloseTo(9.96, 1);
    });

    it('should calculate voltage drop percentage correctly', () => {
      // 9.24V drop on 230V system = 4.02%
      const result = calculateVoltageDrop({
        current: 30,
        length: 50,
        cableSizeMm2: 6,
        conductorMaterial: 'copper',
        circuitType: 'single-phase',
        systemVoltage: 230,
        standard: 'IEC',
      });

      // Using actual IEC 6mm² resistance: 9.24V / 230V = 4.02%
      expect(result.voltageDropPercent).toBeCloseTo(4.02, 1);
    });

    it('should flag voltage drop >3% as violation (FR-009)', () => {
      // 5% voltage drop should be flagged
      const result = calculateVoltageDrop({
        current: 40,
        length: 80,
        cableSizeMm2: 4,
        conductorMaterial: 'copper',
        circuitType: 'single-phase',
        systemVoltage: 230,
        standard: 'IEC',
      });

      expect(result.isViolation).toBe(true);
      expect(result.voltageDropPercent).toBeGreaterThan(3);
    });

    it('should not flag voltage drop <=3% as violation', () => {
      // Large cable size, short run = low voltage drop
      const result = calculateVoltageDrop({
        current: 20,
        length: 20,
        cableSizeMm2: 10,
        conductorMaterial: 'copper',
        circuitType: 'single-phase',
        systemVoltage: 230,
        standard: 'IEC',
      });

      expect(result.isViolation).toBe(false);
      expect(result.voltageDropPercent).toBeLessThanOrEqual(3);
    });
  });

  describe('Aluminum Conductor Calculations', () => {
    it('should calculate higher voltage drop for aluminum vs copper', () => {
      const copperResult = calculateVoltageDrop({
        current: 30,
        length: 50,
        cableSizeMm2: 6,
        conductorMaterial: 'copper',
        circuitType: 'single-phase',
        standard: 'IEC',
      });

      const aluminumResult = calculateVoltageDrop({
        current: 30,
        length: 50,
        cableSizeMm2: 6,
        conductorMaterial: 'aluminum',
        circuitType: 'single-phase',
        standard: 'IEC',
      });

      // Aluminum has ~1.6x higher resistance than copper
      expect(aluminumResult.voltageDrop).toBeGreaterThan(copperResult.voltageDrop * 1.5);
    });
  });

  describe('NEC Standard Calculations', () => {
    it('should calculate voltage drop using NEC resistance values (Chapter 9 Table 8)', () => {
      // NEC example: 10 AWG copper, 100ft, 30A
      // Resistance: 1.24 ohms/1000ft for 10 AWG copper
      // V_drop = 2 × I × L × R / 1000 (single-phase)
      const result = calculateVoltageDrop({
        current: 30,
        length: 100, // feet
        cableSizeAWG: '10',
        conductorMaterial: 'copper',
        circuitType: 'single-phase',
        systemVoltage: 120,
        standard: 'NEC',
      });

      // Expected: 2 × 30 × 100 × 1.24 / 1000 = 7.44V
      expect(result.voltageDrop).toBeCloseTo(7.44, 1);
    });
  });

  describe('SC-004 Accuracy Requirement', () => {
    it('should match IEC 60364 published examples within calculation accuracy', () => {
      // Reference case calculated from IEC 60364-5-52 data
      // 20A, 30m, 2.5mm² copper (7.41 mV/A/m), single-phase 230V
      // V_drop = 20 × 30 × 2 × 7.41 / 1000 = 8.89V
      // Percentage = 8.89 / 230 × 100 = 3.87%
      const result = calculateVoltageDrop({
        current: 20,
        length: 30,
        cableSizeMm2: 2.5,
        conductorMaterial: 'copper',
        circuitType: 'single-phase',
        systemVoltage: 230,
        standard: 'IEC',
      });

      // Verify calculation is mathematically correct
      // V_drop = I × L × 2 × R / 1000 = 20 × 30 × 2 × 7.41 / 1000 = 8.892V
      expect(result.voltageDrop).toBeCloseTo(8.89, 1);
      // 8.89 / 230 × 100 = 3.87%
      expect(result.voltageDropPercent).toBeCloseTo(3.87, 1);
    });
  });
});

/**
 * T080 - Cable Ampacity Lookup Tests
 *
 * Verifies NEC Table 310.15(B)(16) data accuracy (SC-009: 100% compliance)
 */
describe('Cable Ampacity Lookup', () => {
  describe('NEC Table 310.15(B)(16) Copper Conductors', () => {
    it('should return correct ampacity for 14 AWG copper at 60°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '14',
        conductorMaterial: 'copper',
        insulationRating: 60,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(15);
    });

    it('should return correct ampacity for 12 AWG copper at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '12',
        conductorMaterial: 'copper',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(25);
    });

    it('should return correct ampacity for 10 AWG copper at 90°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '10',
        conductorMaterial: 'copper',
        insulationRating: 90,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(40);
    });

    it('should return correct ampacity for 6 AWG copper at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '6',
        conductorMaterial: 'copper',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(65);
    });

    it('should return correct ampacity for 4 AWG copper at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '4',
        conductorMaterial: 'copper',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(85);
    });

    it('should return correct ampacity for 2 AWG copper at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '2',
        conductorMaterial: 'copper',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(115);
    });

    it('should return correct ampacity for 1/0 AWG copper at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '1/0',
        conductorMaterial: 'copper',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(150);
    });

    it('should return correct ampacity for 250 kcmil copper at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '250',
        conductorMaterial: 'copper',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(255);
    });
  });

  describe('NEC Table 310.15(B)(16) Aluminum Conductors', () => {
    it('should return correct ampacity for 12 AWG aluminum at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '12',
        conductorMaterial: 'aluminum',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(20);
    });

    it('should return correct ampacity for 4 AWG aluminum at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '4',
        conductorMaterial: 'aluminum',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(65);
    });

    it('should return correct ampacity for 1/0 AWG aluminum at 75°C', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '1/0',
        conductorMaterial: 'aluminum',
        insulationRating: 75,
        standard: 'NEC',
      });

      expect(result.ampacity).toBe(120);
    });
  });

  describe('IEC Cable Sizes (mm²)', () => {
    it('should return correct ampacity for 2.5mm² copper at 70°C (IEC)', () => {
      const result = lookupCableAmpacity({
        cableSizeMm2: 2.5,
        conductorMaterial: 'copper',
        insulationRating: 70,
        standard: 'IEC',
        installationMethod: 'conduit',
      });

      // IEC 60364-5-52 Table B.52.4: 2.5mm² copper in conduit ~23A
      expect(result.ampacity).toBeCloseTo(23, 0);
    });

    it('should return correct ampacity for 16mm² copper at 70°C (IEC)', () => {
      const result = lookupCableAmpacity({
        cableSizeMm2: 16,
        conductorMaterial: 'copper',
        insulationRating: 70,
        standard: 'IEC',
        installationMethod: 'conduit',
      });

      // IEC 60364-5-52: 16mm² copper in conduit ~68A
      expect(result.ampacity).toBeCloseTo(68, 2);
    });
  });

  describe('Resistance Values', () => {
    it('should include resistance value (mV/A/m) for IEC calculations', () => {
      const result = lookupCableAmpacity({
        cableSizeMm2: 6,
        conductorMaterial: 'copper',
        insulationRating: 70,
        standard: 'IEC',
      });

      // 6mm² copper: ~3.08 mV/A/m
      expect(result.resistanceMvAm).toBeCloseTo(3.08, 1);
    });

    it('should include resistance value (ohms/1000ft) for NEC calculations', () => {
      const result = lookupCableAmpacity({
        cableSizeAWG: '10',
        conductorMaterial: 'copper',
        insulationRating: 75,
        standard: 'NEC',
      });

      // 10 AWG copper: 1.24 ohms/1000ft (NEC Chapter 9 Table 8)
      expect(result.resistanceOhmPer1000ft).toBeCloseTo(1.24, 2);
    });
  });
});

/**
 * T081 - Derating Factor Tests
 *
 * Tests temperature and grouping corrections per NEC 310.15(B)(2)(a)
 */
describe('Derating Factor Calculations', () => {
  describe('Temperature Derating - NEC 310.15(B)(2)(a)', () => {
    it('should return 1.0 for ambient temperature of 30°C (base reference)', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 30,
        insulationRating: 75,
        numberOfConductors: 3,
        standard: 'NEC',
      });

      expect(result.temperatureFactor).toBe(1.0);
    });

    it('should apply temperature derating for 40°C ambient (NEC 75°C insulation)', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 40,
        insulationRating: 75,
        numberOfConductors: 3,
        standard: 'NEC',
      });

      // NEC Table 310.15(B)(2)(a): 40°C ambient, 75°C insulation = 0.88
      expect(result.temperatureFactor).toBeCloseTo(0.88, 2);
    });

    it('should apply temperature derating for 45°C ambient (NEC 75°C insulation)', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 45,
        insulationRating: 75,
        numberOfConductors: 3,
        standard: 'NEC',
      });

      // NEC Table 310.15(B)(2)(a): 45°C ambient, 75°C insulation = 0.82
      expect(result.temperatureFactor).toBeCloseTo(0.82, 2);
    });

    it('should apply temperature derating for 50°C ambient (NEC 90°C insulation)', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 50,
        insulationRating: 90,
        numberOfConductors: 3,
        standard: 'NEC',
      });

      // NEC Table 310.15(B)(2)(a): 50°C ambient, 90°C insulation = 0.82
      expect(result.temperatureFactor).toBeCloseTo(0.82, 2);
    });
  });

  describe('Grouping/Bundling Derating - NEC 310.15(C)(1)', () => {
    it('should return 1.0 for 3 or fewer conductors', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 30,
        insulationRating: 75,
        numberOfConductors: 3,
        standard: 'NEC',
      });

      expect(result.groupingFactor).toBe(1.0);
    });

    it('should apply 0.80 factor for 4-6 conductors', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 30,
        insulationRating: 75,
        numberOfConductors: 5,
        standard: 'NEC',
      });

      // NEC 310.15(C)(1): 4-6 conductors = 0.80
      expect(result.groupingFactor).toBeCloseTo(0.80, 2);
    });

    it('should apply 0.70 factor for 7-9 conductors', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 30,
        insulationRating: 75,
        numberOfConductors: 8,
        standard: 'NEC',
      });

      // NEC 310.15(C)(1): 7-9 conductors = 0.70
      expect(result.groupingFactor).toBeCloseTo(0.70, 2);
    });

    it('should apply 0.50 factor for 10-20 conductors', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 30,
        insulationRating: 75,
        numberOfConductors: 15,
        standard: 'NEC',
      });

      // NEC 310.15(C)(1): 10-20 conductors = 0.50
      expect(result.groupingFactor).toBeCloseTo(0.50, 2);
    });

    it('should apply 0.45 factor for 21-30 conductors', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 30,
        insulationRating: 75,
        numberOfConductors: 25,
        standard: 'NEC',
      });

      // NEC 310.15(C)(1): 21-30 conductors = 0.45
      expect(result.groupingFactor).toBeCloseTo(0.45, 2);
    });

    it('should apply 0.40 factor for 31-40 conductors', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 30,
        insulationRating: 75,
        numberOfConductors: 35,
        standard: 'NEC',
      });

      // NEC 310.15(C)(1): 31-40 conductors = 0.40
      expect(result.groupingFactor).toBeCloseTo(0.40, 2);
    });
  });

  describe('Combined Derating', () => {
    it('should multiply temperature and grouping factors', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 40,
        insulationRating: 75,
        numberOfConductors: 6,
        standard: 'NEC',
      });

      // Temperature: 0.88, Grouping: 0.80
      // Total: 0.88 × 0.80 = 0.704
      expect(result.totalFactor).toBeCloseTo(0.704, 2);
    });

    it('should include standard reference in result', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 40,
        insulationRating: 75,
        numberOfConductors: 6,
        standard: 'NEC',
      });

      expect(result.standardReference).toContain('NEC');
      expect(result.standardReference).toContain('310.15');
    });
  });

  describe('IEC Derating - IEC 60364-5-52', () => {
    it('should apply IEC temperature correction for 40°C ambient', () => {
      const result = calculateDeratingFactors({
        ambientTemp: 40,
        insulationRating: 70,
        numberOfConductors: 3,
        standard: 'IEC',
      });

      // IEC 60364-5-52 Table B.52.14: 40°C, PVC (70°C) = 0.87
      expect(result.temperatureFactor).toBeCloseTo(0.87, 2);
    });

    it('should apply IEC grouping factors (Table B.52.17)', () => {
      // 6 conductors = 2 three-phase circuits
      const result = calculateDeratingFactors({
        ambientTemp: 30,
        insulationRating: 70,
        numberOfConductors: 6,
        installationMethod: 'conduit',
        standard: 'IEC',
      });

      // IEC Table B.52.17: 2 circuits in method A (conduit) = 0.80
      // (6 conductors / 3 per circuit = 2 circuits)
      expect(result.groupingFactor).toBeCloseTo(0.80, 2);
    });
  });
});
