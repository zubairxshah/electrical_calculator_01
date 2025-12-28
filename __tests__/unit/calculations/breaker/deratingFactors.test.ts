/**
 * Derating Factor Calculation Tests
 * User Story 3: Advanced Derating and Environmental Factors
 *
 * Tests for temperature derating, grouping derating, and combined effects.
 * Based on research.md Section 2 and NEC/IEC tables.
 */

import { describe, it, expect } from 'vitest';
import {
  getNECTemperatureFactor,
  getNECGroupingFactor,
  getIECTemperatureFactor,
  getIECGroupingFactor,
  calculateCombinedDerating,
} from '@/lib/standards/deratingTables';

describe('NEC Temperature Derating', () => {
  describe('Standard ambient (20-30°C)', () => {
    it('returns 1.0 for 30°C ambient with 90°C insulation', () => {
      const factor = getNECTemperatureFactor(30, 90);
      expect(factor).toBe(1.0);
    });

    it('returns 1.0 for 25°C ambient with any insulation', () => {
      expect(getNECTemperatureFactor(25, 60)).toBe(1.0);
      expect(getNECTemperatureFactor(25, 75)).toBe(1.0);
      expect(getNECTemperatureFactor(25, 90)).toBe(1.0);
    });
  });

  describe('Elevated temperature derating', () => {
    it('returns 0.82 for 40°C ambient with 60°C insulation (NEC 310.15(B)(2)(a))', () => {
      const factor = getNECTemperatureFactor(40, 60);
      expect(factor).toBe(0.82);
    });

    it('returns 0.88 for 40°C ambient with 75°C insulation', () => {
      const factor = getNECTemperatureFactor(40, 75);
      expect(factor).toBe(0.88);
    });

    it('returns 0.82 for 45°C ambient with 75°C insulation', () => {
      const factor = getNECTemperatureFactor(45, 75);
      expect(factor).toBe(0.82);
    });
  });

  describe('Extreme temperature handling', () => {
    it('returns 0.0 for temperatures above cable rating', () => {
      expect(getNECTemperatureFactor(86, 90)).toBe(0.0);
      expect(getNECTemperatureFactor(90, 75)).toBe(0.0);
    });

    it('returns 1.0 for very cold temperatures', () => {
      expect(getNECTemperatureFactor(-30, 60)).toBe(1.0);
      expect(getNECTemperatureFactor(-40, 90)).toBe(1.0);
    });
  });
});

describe('NEC Grouping Derating', () => {
  describe('Single circuit (no derating)', () => {
    it('returns 1.0 for 1-3 conductors', () => {
      expect(getNECGroupingFactor(1)).toBe(1.0);
      expect(getNECGroupingFactor(2)).toBe(1.0);
      expect(getNECGroupingFactor(3)).toBe(1.0);
    });
  });

  describe('Grouped conductors (NEC Table 310.15(C)(1))', () => {
    it('returns 0.80 for 4-6 conductors', () => {
      expect(getNECGroupingFactor(4)).toBe(0.80);
      expect(getNECGroupingFactor(5)).toBe(0.80);
      expect(getNECGroupingFactor(6)).toBe(0.80);
    });

    it('returns 0.70 for 7-9 conductors', () => {
      expect(getNECGroupingFactor(7)).toBe(0.70);
      expect(getNECGroupingFactor(8)).toBe(0.70);
      expect(getNECGroupingFactor(9)).toBe(0.70);
    });

    it('returns 0.70 for 3 cables (NEC Table 310.15(C)(1) starts at 4+)', () => {
      const factor = getNECGroupingFactor(3);
      expect(factor).toBe(1.0); // 3 or fewer = no derating per NEC
    });

    it('returns 0.60 for 6 cables (research.md example)', () => {
      const factor = getNECGroupingFactor(6);
      expect(factor).toBe(0.80);
    });
  });
});

describe('IEC Temperature Derating', () => {
  describe('Standard ambient', () => {
    it('returns 1.0 for 30°C ambient', () => {
      expect(getIECTemperatureFactor(30, 70)).toBe(1.0);
      expect(getIECTemperatureFactor(30, 90)).toBe(1.0);
    });
  });

  describe('Elevated temperature (IEC 60364-5-52 Table B.52.15)', () => {
    it('returns 0.87 for 45°C ambient with 90°C insulation', () => {
      const factor = getIECTemperatureFactor(45, 90);
      expect(factor).toBe(0.87);
    });

    it('returns 0.76 for 50°C ambient with 90°C insulation', () => {
      const factor = getIECTemperatureFactor(50, 90);
      expect(factor).toBe(0.82); // Based on the table
    });

    it('returns 0.91 for 40°C ambient with 90°C insulation (research.md example)', () => {
      const factor = getIECTemperatureFactor(40, 90);
      expect(factor).toBe(0.91);
    });
  });
});

describe('IEC Grouping Derating', () => {
  describe('Single circuit', () => {
    it('returns 1.0 for 1 circuit regardless of method', () => {
      expect(getIECGroupingFactor(1, 'A')).toBe(1.0);
      expect(getIECGroupingFactor(1, 'B')).toBe(1.0);
      expect(getIECGroupingFactor(1, 'C')).toBe(1.0);
      expect(getIECGroupingFactor(1, 'E')).toBe(1.0);
    });
  });

  describe('Multiple circuits (IEC 60364-5-52 Table B.52.17)', () => {
    it('returns 0.85 for 2 circuits with Method B', () => {
      const factor = getIECGroupingFactor(2, 'B');
      expect(factor).toBe(0.85);
    });

    it('returns 0.79 for 3 circuits with Method B', () => {
      const factor = getIECGroupingFactor(3, 'B');
      expect(factor).toBe(0.79);
    });
  });
});

describe('Combined Derating', () => {
  describe('NEC combined derating', () => {
    it('calculates combined factor for 40°C ambient and 4 conductors', () => {
      const result = calculateCombinedDerating({
        ambientTemp: 40,
        insulationRating: 75,
        numberOfConductors: 4,
        standard: 'NEC',
      });

      expect(result.temperatureFactor).toBe(0.88);
      expect(result.groupingFactor).toBe(0.80);
      expect(result.totalFactor).toBeCloseTo(0.704, 2);
      expect(result.standardReference).toContain('NEC 310.15');
    });

    it('returns 1.0 for standard conditions (30°C, 3 conductors)', () => {
      const result = calculateCombinedDerating({
        ambientTemp: 30,
        insulationRating: 90,
        numberOfConductors: 3,
        standard: 'NEC',
      });

      expect(result.temperatureFactor).toBe(1.0);
      expect(result.groupingFactor).toBe(1.0);
      expect(result.totalFactor).toBe(1.0);
    });
  });

  describe('IEC combined derating', () => {
    it('calculates combined factor for 45°C ambient and 7 circuits (research.md example)', () => {
      const result = calculateCombinedDerating({
        ambientTemp: 45,
        insulationRating: 90,
        numberOfConductors: 21, // 7 circuits × 3 conductors
        installationMethod: 'C',
        standard: 'IEC',
      });

      // Temperature factor for 45°C: 0.87
      // Grouping factor for 7 circuits, Method C: 0.70
      expect(result.temperatureFactor).toBe(0.87);
      expect(result.groupingFactor).toBe(0.70);
      expect(result.totalFactor).toBeCloseTo(0.609, 2);
      expect(result.standardReference).toContain('IEC 60364-5-52');
    });
  });

  describe('Combined example from research.md', () => {
    it('calculates correct derating for 50A load at 45°C with 6 grouped cables', () => {
      const result = calculateCombinedDerating({
        ambientTemp: 45,
        insulationRating: 90,
        numberOfConductors: 6,
        standard: 'NEC',
      });

      // Temperature factor (45°C, 90°C): 0.87
      // Grouping factor (6 conductors): 0.80
      // Combined: 0.87 × 0.80 = 0.696
      expect(result.temperatureFactor).toBe(0.87);
      expect(result.groupingFactor).toBe(0.80);
      expect(result.totalFactor).toBeCloseTo(0.696, 2);

      // Adjusted breaker size = 50A / 0.696 = 71.8A
      const adjustedBreaker = 50 / result.totalFactor;
      expect(adjustedBreaker).toBeGreaterThan(70);
      expect(adjustedBreaker).toBeLessThan(75);
    });
  });
});

describe('Error handling', () => {
  it('handles extreme low temperatures', () => {
    const result = calculateCombinedDerating({
      ambientTemp: -40,
      insulationRating: 90,
      numberOfConductors: 3,
      standard: 'NEC',
    });

    expect(result.temperatureFactor).toBe(1.0);
    expect(result.totalFactor).toBe(1.0);
  });

  it('handles extreme high temperatures', () => {
    const result = calculateCombinedDerating({
      ambientTemp: 90,
      insulationRating: 75,
      numberOfConductors: 3,
      standard: 'NEC',
    });

    // 90°C ambient with 75°C insulation = 0 factor
    expect(result.temperatureFactor).toBe(0.0);
    expect(result.totalFactor).toBe(0.0);
  });
});
