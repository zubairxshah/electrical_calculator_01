/**
 * Unit Tests for IEC Diversity Factors
 * Tests IEC 60364-5-52 diversity factor calculations
 */

import { describe, it, expect } from 'vitest';
import {
  getIECResidentialFactor,
  getIECCommercialFactor,
  calculateIECOverallDiversity,
  IEC_RESIDENTIAL_FACTORS,
  IEC_COMMERCIAL_FACTORS,
} from '../../../src/services/demand-diversity/IECFactors';

describe('IEC Diversity Factors', () => {
  describe('IEC_RESIDENTIAL_FACTORS constants', () => {
    it('should have correct factor for lighting (100%)', () => {
      expect(IEC_RESIDENTIAL_FACTORS.lighting.factor).toBe(1.0);
    });

    it('should have correct factor for socket outlets (40%)', () => {
      expect(IEC_RESIDENTIAL_FACTORS.socketOutlets.factor).toBe(0.4);
    });

    it('should have correct factor for HVAC (80%)', () => {
      expect(IEC_RESIDENTIAL_FACTORS.hvac.factor).toBe(0.8);
    });

    it('should have correct factor for cooking appliances (70%)', () => {
      expect(IEC_RESIDENTIAL_FACTORS.cookingAppliances.factor).toBe(0.7);
    });

    it('should have correct factor for water heating (100%)', () => {
      expect(IEC_RESIDENTIAL_FACTORS.waterHeating.factor).toBe(1.0);
    });

    it('should have correct factor for other appliances (60%)', () => {
      expect(IEC_RESIDENTIAL_FACTORS.otherAppliances.factor).toBe(0.6);
    });

    it('should include clause references for all categories', () => {
      const categories = Object.keys(IEC_RESIDENTIAL_FACTORS);
      categories.forEach((category) => {
        const cat = category as keyof typeof IEC_RESIDENTIAL_FACTORS;
        expect(IEC_RESIDENTIAL_FACTORS[cat].clause).toBe('IEC 60364-5-52');
      });
    });

    it('should include notes for all categories', () => {
      const categories = Object.keys(IEC_RESIDENTIAL_FACTORS);
      categories.forEach((category) => {
        const cat = category as keyof typeof IEC_RESIDENTIAL_FACTORS;
        expect(IEC_RESIDENTIAL_FACTORS[cat].notes).toBeDefined();
        expect(IEC_RESIDENTIAL_FACTORS[cat].notes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getIECResidentialFactor', () => {
    it('should return correct factor for lighting', () => {
      const factor = getIECResidentialFactor('lighting');
      expect(factor.factor).toBe(1.0);
      expect(factor.clause).toBe('IEC 60364-5-52');
    });

    it('should return correct factor for socket outlets', () => {
      const factor = getIECResidentialFactor('socketOutlets');
      expect(factor.factor).toBe(0.4);
    });

    it('should return correct factor for HVAC', () => {
      const factor = getIECResidentialFactor('hvac');
      expect(factor.factor).toBe(0.8);
    });

    it('should return correct factor for cooking appliances', () => {
      const factor = getIECResidentialFactor('cookingAppliances');
      expect(factor.factor).toBe(0.7);
    });

    it('should return correct factor for water heating', () => {
      const factor = getIECResidentialFactor('waterHeating');
      expect(factor.factor).toBe(1.0);
    });

    it('should return correct factor for other appliances', () => {
      const factor = getIECResidentialFactor('otherAppliances');
      expect(factor.factor).toBe(0.6);
    });

    it('should return default factor (0.6) for unknown category', () => {
      const factor = getIECResidentialFactor('unknownCategory');
      expect(factor.factor).toBe(0.6);
      expect(factor.clause).toBe('IEC 60364-5-52');
    });
  });

  describe('IEC_COMMERCIAL_FACTORS constants', () => {
    it('should have office overall factor (75%)', () => {
      expect(IEC_COMMERCIAL_FACTORS.office.overall.factor).toBe(0.75);
    });

    it('should have office lighting factor (90%)', () => {
      expect(IEC_COMMERCIAL_FACTORS.office.lighting.factor).toBe(0.9);
    });

    it('should have office receptacles factor (70%)', () => {
      expect(IEC_COMMERCIAL_FACTORS.office.receptacles.factor).toBe(0.7);
    });

    it('should have office HVAC factor (85%)', () => {
      expect(IEC_COMMERCIAL_FACTORS.office.hvac.factor).toBe(0.85);
    });

    it('should have retail overall factor (85%)', () => {
      expect(IEC_COMMERCIAL_FACTORS.retail.overall.factor).toBe(0.85);
    });

    it('should have retail lighting factor (95%)', () => {
      expect(IEC_COMMERCIAL_FACTORS.retail.lighting.factor).toBe(0.95);
    });

    it('should have retail receptacles factor (80%)', () => {
      expect(IEC_COMMERCIAL_FACTORS.retail.receptacles.factor).toBe(0.8);
    });
  });

  describe('getIECCommercialFactor', () => {
    it('should return correct factor for office overall', () => {
      const factor = getIECCommercialFactor('office', 'overall');
      expect(factor.factor).toBe(0.75);
    });

    it('should return correct factor for office lighting', () => {
      const factor = getIECCommercialFactor('office', 'lighting');
      expect(factor.factor).toBe(0.9);
    });

    it('should return correct factor for retail overall', () => {
      const factor = getIECCommercialFactor('retail', 'overall');
      expect(factor.factor).toBe(0.85);
    });

    it('should return default factor (0.8) for unknown commercial category', () => {
      const factor = getIECCommercialFactor('office', 'unknownCategory');
      expect(factor.factor).toBe(0.8);
    });
  });

  describe('calculateIECOverallDiversity', () => {
    it('should calculate correct diversity for reference case (59kW → 43.6kW, 26.1% diversity)', () => {
      const loads = {
        lighting: 10,
        socketOutlets: 15,
        hvac: 20,
        cookingAppliances: 8,
        waterHeating: 6,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBe(59);
      expect(result.totalDemand).toBeCloseTo(43.6, 1);
      expect(result.overallFactor).toBeCloseTo(0.261, 2);
    });

    it('should calculate correct diversity for lighting only (no diversity)', () => {
      const loads = {
        lighting: 20,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBe(20);
      expect(result.totalDemand).toBe(20);
      expect(result.overallFactor).toBe(0); // No diversity for lighting
    });

    it('should calculate correct diversity for socket outlets only (60% diversity)', () => {
      const loads = {
        socketOutlets: 100,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBe(100);
      expect(result.totalDemand).toBe(40); // 100 × 0.4
      expect(result.overallFactor).toBe(0.6); // 60% diversity
    });

    it('should calculate correct diversity for HVAC only (20% diversity)', () => {
      const loads = {
        hvac: 50,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBe(50);
      expect(result.totalDemand).toBe(40); // 50 × 0.8
      expect(result.overallFactor).toBeCloseTo(0.2, 1); // 20% diversity
    });

    it('should calculate correct diversity for cooking appliances (30% diversity)', () => {
      const loads = {
        cookingAppliances: 30,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBe(30);
      expect(result.totalDemand).toBe(21); // 30 × 0.7
      expect(result.overallFactor).toBeCloseTo(0.3, 1); // 30% diversity
    });

    it('should calculate correct diversity for water heating (no diversity)', () => {
      const loads = {
        waterHeating: 25,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBe(25);
      expect(result.totalDemand).toBe(25);
      expect(result.overallFactor).toBe(0); // No diversity for continuous load
    });

    it('should calculate correct diversity for other appliances (40% diversity)', () => {
      const loads = {
        otherAppliances: 40,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBe(40);
      expect(result.totalDemand).toBe(24); // 40 × 0.6
      expect(result.overallFactor).toBe(0.4); // 40% diversity
    });

    it('should handle all residential load categories', () => {
      const loads = {
        lighting: 15,
        socketOutlets: 25,
        hvac: 30,
        cookingAppliances: 12,
        waterHeating: 10,
        otherAppliances: 8,
      };

      const result = calculateIECOverallDiversity(loads);

      // Manual calculation:
      // 15 × 1.0 = 15
      // 25 × 0.4 = 10
      // 30 × 0.8 = 24
      // 12 × 0.7 = 8.4
      // 10 × 1.0 = 10
      // 8 × 0.6 = 4.8
      // Total connected: 100
      // Total demand: 72.2
      // Diversity: 1 - (72.2/100) = 0.278

      expect(result.totalConnected).toBe(100);
      expect(result.totalDemand).toBeCloseTo(72.2, 1);
      expect(result.overallFactor).toBeCloseTo(0.278, 2);
    });

    it('should handle zero loads (empty result)', () => {
      const loads = {
        lighting: 0,
        socketOutlets: 0,
        hvac: 0,
        cookingAppliances: 0,
        waterHeating: 0,
        otherAppliances: 0,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBe(0);
      expect(result.totalDemand).toBe(0);
      expect(result.overallFactor).toBe(0);
    });

    it('should handle undefined loads gracefully', () => {
      const loads = {
        lighting: undefined,
        socketOutlets: undefined,
      };

      const result = calculateIECOverallDiversity(loads as any);

      expect(result.totalConnected).toBe(0);
      expect(result.totalDemand).toBe(0);
    });

    it('should handle partial loads (only some categories)', () => {
      const loads = {
        lighting: 10,
        hvac: 20,
      };

      const result = calculateIECOverallDiversity(loads);

      // 10 × 1.0 = 10
      // 20 × 0.8 = 16
      // Total: 30 connected, 26 demand
      // Diversity: 1 - (26/30) = 0.133

      expect(result.totalConnected).toBe(30);
      expect(result.totalDemand).toBe(26);
      expect(result.overallFactor).toBeCloseTo(0.133, 2);
    });

    it('should handle very large loads', () => {
      const loads = {
        lighting: 1000,
        socketOutlets: 2000,
        hvac: 3000,
        cookingAppliances: 500,
        waterHeating: 800,
        otherAppliances: 400,
      };

      const result = calculateIECOverallDiversity(loads);

      // 1000 × 1.0 = 1000
      // 2000 × 0.4 = 800
      // 3000 × 0.8 = 2400
      // 500 × 0.7 = 350
      // 800 × 1.0 = 800
      // 400 × 0.6 = 240
      // Total connected: 7700
      // Total demand: 5590
      // Diversity: 1 - (5590/7700) = 0.274

      expect(result.totalConnected).toBe(7700);
      expect(result.totalDemand).toBe(5590);
      expect(result.overallFactor).toBeCloseTo(0.274, 2);
    });

    it('should handle fractional load values', () => {
      const loads = {
        lighting: 5.5,
        socketOutlets: 12.3,
        hvac: 18.7,
      };

      const result = calculateIECOverallDiversity(loads);

      // 5.5 × 1.0 = 5.5
      // 12.3 × 0.4 = 4.92
      // 18.7 × 0.8 = 14.96
      // Total: 36.5 connected, 25.38 demand
      // Diversity: 1 - (25.38/36.5) = 0.305

      expect(result.totalConnected).toBeCloseTo(36.5, 2);
      expect(result.totalDemand).toBeCloseTo(25.38, 2);
      expect(result.overallFactor).toBeCloseTo(0.305, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative loads (treated as zero)', () => {
      const loads = {
        lighting: -10,
        socketOutlets: 20,
      };

      const result = calculateIECOverallDiversity(loads as any);

      // Negative values should be ignored
      expect(result.totalConnected).toBe(20);
      expect(result.totalDemand).toBe(8); // 20 × 0.4
    });

    it('should handle very small loads', () => {
      const loads = {
        lighting: 0.1,
        socketOutlets: 0.5,
      };

      const result = calculateIECOverallDiversity(loads);

      expect(result.totalConnected).toBeCloseTo(0.6, 2);
      expect(result.totalDemand).toBeCloseTo(0.3, 2);
    });
  });

  describe('Diversity Factor Bounds', () => {
    it('should always produce diversity factor between 0 and 1', () => {
      const testCases = [
        { lighting: 100, socketOutlets: 0, hvac: 0, cookingAppliances: 0, waterHeating: 0, otherAppliances: 0 },
        { lighting: 0, socketOutlets: 100, hvac: 0, cookingAppliances: 0, waterHeating: 0, otherAppliances: 0 },
        { lighting: 50, socketOutlets: 50, hvac: 50, cookingAppliances: 50, waterHeating: 50, otherAppliances: 50 },
        { lighting: 1, socketOutlets: 1000, hvac: 1, cookingAppliances: 1, waterHeating: 1, otherAppliances: 1 },
      ];

      testCases.forEach((loads) => {
        const result = calculateIECOverallDiversity(loads);
        expect(result.overallFactor).toBeGreaterThanOrEqual(0);
        expect(result.overallFactor).toBeLessThanOrEqual(1);
      });
    });
  });
});
