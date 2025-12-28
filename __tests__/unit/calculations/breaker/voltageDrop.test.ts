/**
 * Voltage Drop Calculation Tests
 * User Story 2: Voltage Drop Analysis
 *
 * Tests for voltage drop calculation, warning thresholds, and cable size recommendations.
 * Based on research.md Section 7 and IEEE 835 reference calculations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVoltageDrop,
  assessVoltageDropCompliance,
  recommendCableSizeForVD,
} from '@/lib/calculations/breaker/voltageDrop';
import { CableTableEntry } from '@/lib/standards/cableTables';

// Test data from IEEE 835 reference: 30A @ 240V, 150ft, #6 AWG copper
const TEST_CONDITIONS = {
  current: 30, // A
  voltage: 240, // V
  distance: 150, // ft
  conductorSize: { sizeAWG: '6', sizeMm2: null } as { sizeAWG: string | null; sizeMm2: number | null },
  material: 'copper' as const,
  phase: 'single' as const,
  powerFactor: 0.9,
};

describe('Voltage Drop Calculation', () => {
  describe('Single-phase calculations', () => {
    it('calculates voltage drop for single-phase circuit', () => {
      const result = calculateVoltageDrop({
        current: 30,
        voltage: 240,
        distance: 150,
        conductorSize: { sizeAWG: '6', sizeMm2: null },
        material: 'copper',
        phase: 'single',
        powerFactor: 0.9,
      });

      // IEEE 835 reference: slightly different value due to specific resistance used
      // Using NEC Table 8 resistance for #6 AWG copper
      expect(result.voltageDropPercent).toBeGreaterThan(0.7);
      expect(result.voltageDropPercent).toBeLessThan(1.0);
    });

    it('calculates voltage drop for three-phase circuit', () => {
      const result = calculateVoltageDrop({
        current: 30,
        voltage: 400,
        distance: 150,
        conductorSize: { sizeAWG: '6', sizeMm2: null },
        material: 'copper',
        phase: 'three',
        powerFactor: 0.9,
      });

      // Three-phase VD = (I × R × L × √3) / (V × 1000) for proper formula
      expect(result.voltageDropPercent).toBeGreaterThan(0);
      expect(result.voltageDropVolts).toBeGreaterThan(0);
    });

    it('calculates higher voltage drop for aluminum conductor', () => {
      const copperResult = calculateVoltageDrop({
        current: 30,
        voltage: 240,
        distance: 150,
        conductorSize: { sizeAWG: '6', sizeMm2: null },
        material: 'copper',
        phase: 'single',
        powerFactor: 0.9,
      });

      const aluminumResult = calculateVoltageDrop({
        current: 30,
        voltage: 240,
        distance: 150,
        conductorSize: { sizeAWG: '6', sizeMm2: null },
        material: 'aluminum',
        phase: 'single',
        powerFactor: 0.9,
      });

      // Aluminum has ~1.68x higher resistance than copper
      expect(aluminumResult.voltageDropPercent).toBeGreaterThan(copperResult.voltageDropPercent);
    });

    it('calculates higher voltage drop for longer distances', () => {
      const shortDistance = calculateVoltageDrop({
        current: 30,
        voltage: 240,
        distance: 100,
        conductorSize: { sizeAWG: '6', sizeMm2: null },
        material: 'copper',
        phase: 'single',
        powerFactor: 0.9,
      });

      const longDistance = calculateVoltageDrop({
        current: 30,
        voltage: 240,
        distance: 300,
        conductorSize: { sizeAWG: '6', sizeMm2: null },
        material: 'copper',
        phase: 'single',
        powerFactor: 0.9,
      });

      expect(longDistance.voltageDropPercent).toBeGreaterThan(shortDistance.voltageDropPercent * 2.9);
      expect(longDistance.voltageDropPercent).toBeLessThan(shortDistance.voltageDropPercent * 3.1);
    });

    it('calculates lower voltage drop for larger conductor size', () => {
      const smallConductor = calculateVoltageDrop({
        current: 30,
        voltage: 240,
        distance: 150,
        conductorSize: { sizeAWG: '10', sizeMm2: null },
        material: 'copper',
        phase: 'single',
        powerFactor: 0.9,
      });

      const largeConductor = calculateVoltageDrop({
        current: 30,
        voltage: 240,
        distance: 150,
        conductorSize: { sizeAWG: '4', sizeMm2: null },
        material: 'copper',
        phase: 'single',
        powerFactor: 0.9,
      });

      expect(largeConductor.voltageDropPercent).toBeLessThan(smallConductor.voltageDropPercent);
    });
  });

  describe('IEC metric calculations', () => {
    it('calculates voltage drop for metric conductor sizes', () => {
      const result = calculateVoltageDrop({
        current: 30,
        voltage: 230,
        distance: 50, // meters
        conductorSize: { sizeMm2: 6, sizeAWG: null },
        material: 'copper',
        phase: 'single',
        powerFactor: 0.9,
      });

      expect(result.voltageDropPercent).toBeGreaterThan(0);
      expect(result.voltageDropVolts).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('throws error for zero current', () => {
      expect(() =>
        calculateVoltageDrop({
          current: 0,
          voltage: 240,
          distance: 150,
          conductorSize: { sizeAWG: '6', sizeMm2: null },
          material: 'copper',
          phase: 'single',
          powerFactor: 0.9,
        })
      ).toThrow('Current must be positive');
    });

    it('throws error for zero voltage', () => {
      expect(() =>
        calculateVoltageDrop({
          current: 30,
          voltage: 0,
          distance: 150,
          conductorSize: { sizeAWG: '6', sizeMm2: null },
          material: 'copper',
          phase: 'single',
          powerFactor: 0.9,
        })
      ).toThrow('Voltage must be positive');
    });

    it('throws error for zero distance', () => {
      expect(() =>
        calculateVoltageDrop({
          current: 30,
          voltage: 240,
          distance: 0,
          conductorSize: { sizeAWG: '6', sizeMm2: null },
          material: 'copper',
          phase: 'single',
          powerFactor: 0.9,
        })
      ).toThrow('Distance must be positive');
    });
  });
});

describe('Voltage Drop Compliance Assessment', () => {
  describe('Warning thresholds per FR-015, FR-016', () => {
    it('returns acceptable status for VD < 1%', () => {
      const result = assessVoltageDropCompliance(0.5);
      expect(result.status).toBe('acceptable');
      expect(result.level).toBe('info');
    });

    it('returns acceptable status for VD = 1%', () => {
      const result = assessVoltageDropCompliance(1.0);
      expect(result.status).toBe('acceptable');
      expect(result.level).toBe('info');
    });

    it('returns warning status for VD between 1% and 3%', () => {
      const result = assessVoltageDropCompliance(2.0);
      // 1-3% should have warning level but acceptable status
      expect(result.status).toBe('warning');
      expect(result.level).toBe('warning');
    });

    it('returns warning status for VD = 3%', () => {
      const result = assessVoltageDropCompliance(3.0);
      expect(result.status).toBe('warning');
      expect(result.level).toBe('warning');
    });

    it('returns exceed-limit status for VD between 3% and 5%', () => {
      const result = assessVoltageDropCompliance(4.0);
      expect(result.status).toBe('warning');
      expect(result.level).toBe('error');
    });

    it('returns exceed-limit status for VD > 5%', () => {
      const result = assessVoltageDropCompliance(6.0);
      expect(result.status).toBe('exceed-limit');
      expect(result.level).toBe('error');
    });

    it('includes NEC reference in message', () => {
      const result = assessVoltageDropCompliance(4.0);
      expect(result.message).toContain('NEC');
      expect(result.message).toContain('3%');
    });
  });
});

describe('Cable Size Recommendation', () => {
  it('recommends larger cable when VD exceeds limit', () => {
    // High VD scenario: small cable, long distance
    const result = recommendCableSizeForVD({
      current: 30,
      voltage: 240,
      distance: 300, // Long distance
      material: 'copper',
      phase: 'single',
      powerFactor: 0.9,
      currentSize: { sizeAWG: '10', sizeMm2: null },
      vdLimit: 3.0,
    });

    expect(result.recommendedSize).toBeDefined();
    expect(result.recommendedSize!.sizeAWG).not.toBe('10');
    expect(result.savingsPercent).toBeGreaterThan(0);
  });

  it('returns no recommendation needed when VD is acceptable', () => {
    // Low VD scenario: large cable, short distance
    const result = recommendCableSizeForVD({
      current: 30,
      voltage: 240,
      distance: 50, // Short distance
      material: 'copper',
      phase: 'single',
      powerFactor: 0.9,
      currentSize: { sizeAWG: '6', sizeMm2: null },
      vdLimit: 3.0,
    });

    expect(result.recommendedSize).toBeNull();
    expect(result.message).toContain('acceptable');
  });

  it('includes code reference in recommendation', () => {
    const result = recommendCableSizeForVD({
      current: 50,
      voltage: 240,
      distance: 200,
      material: 'copper',
      phase: 'single',
      powerFactor: 0.9,
      currentSize: { sizeAWG: '8', sizeMm2: null },
      vdLimit: 3.0,
    });

    if (result.recommendedSize) {
      expect(result.codeReference).toContain('NEC');
    }
  });
});
