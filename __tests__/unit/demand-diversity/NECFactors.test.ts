/**
 * Unit Tests for NEC Demand Factors
 * Tests NEC Article 220 demand factor calculations
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNECDwellingOptional,
  getNECKitchenEquipmentFactor,
  calculateNECMotorDemand,
  NEC_DWELLING_OPTIONAL,
  NEC_LIGHTING_DEMAND_FACTORS,
  NEC_RECEPTACLE_DEMAND_FACTORS,
  NEC_MOTOR_DEMAND_FACTORS,
  NEC_KITCHEN_EQUIPMENT_FACTORS,
} from '../../../src/services/demand-diversity/NECFactors';

describe('NEC Demand Factors', () => {
  describe('NEC_DWELLING_OPTIONAL constants', () => {
    it('should have correct general lighting/receptacles tiers (10 kVA @ 100%, remainder @ 40%)', () => {
      expect(NEC_DWELLING_OPTIONAL.generalLightingReceptacles.firstPortion.kVA).toBe(10);
      expect(NEC_DWELLING_OPTIONAL.generalLightingReceptacles.firstPortion.factor).toBe(1.0);
      expect(NEC_DWELLING_OPTIONAL.generalLightingReceptacles.remainder.factor).toBe(0.4);
    });

    it('should have correct cooking equipment factor (75%)', () => {
      expect(NEC_DWELLING_OPTIONAL.cookingEquipment.defaultFactor).toBe(0.75);
    });

    it('should have correct HVAC factor (100%)', () => {
      expect(NEC_DWELLING_OPTIONAL.hvac.factor).toBe(1.0);
    });

    it('should have correct water heater factor (100%)', () => {
      expect(NEC_DWELLING_OPTIONAL.waterHeater.factor).toBe(1.0);
    });

    it('should have correct dryer minimum (5 kW)', () => {
      expect(NEC_DWELLING_OPTIONAL.dryer.minimum).toBe(5);
      expect(NEC_DWELLING_OPTIONAL.dryer.factor).toBe(1.0);
    });

    it('should include clause references for all categories', () => {
      expect(NEC_DWELLING_OPTIONAL.generalLightingReceptacles.clause).toBe('NEC 220.82(B)');
      expect(NEC_DWELLING_OPTIONAL.cookingEquipment.clause).toBe('NEC 220.55');
      expect(NEC_DWELLING_OPTIONAL.hvac.clause).toBe('NEC 220.82(C)(1)');
      expect(NEC_DWELLING_OPTIONAL.waterHeater.clause).toBe('NEC 220.82(B)');
      expect(NEC_DWELLING_OPTIONAL.dryer.clause).toBe('NEC 220.82(B)');
    });
  });

  describe('NEC_LIGHTING_DEMAND_FACTORS', () => {
    it('should have correct dwelling lighting tiers', () => {
      expect(NEC_LIGHTING_DEMAND_FACTORS.dwelling.firstPortion.kVA).toBe(3);
      expect(NEC_LIGHTING_DEMAND_FACTORS.dwelling.firstPortion.factor).toBe(1.0);
      expect(NEC_LIGHTING_DEMAND_FACTORS.dwelling.secondPortion.kVA).toBe(117);
      expect(NEC_LIGHTING_DEMAND_FACTORS.dwelling.secondPortion.factor).toBe(0.35);
      expect(NEC_LIGHTING_DEMAND_FACTORS.dwelling.remainder.factor).toBe(0.25);
    });

    it('should have correct commercial lighting tiers (12.5 kVA @ 100%, remainder @ 75%)', () => {
      expect(NEC_LIGHTING_DEMAND_FACTORS.commercial.firstPortion.kVA).toBe(12.5);
      expect(NEC_LIGHTING_DEMAND_FACTORS.commercial.firstPortion.factor).toBe(1.0);
      expect(NEC_LIGHTING_DEMAND_FACTORS.commercial.remainder.factor).toBe(0.75);
    });
  });

  describe('NEC_RECEPTACLE_DEMAND_FACTORS', () => {
    it('should have correct receptacle tiers (10 kVA @ 100%, remainder @ 50%)', () => {
      expect(NEC_RECEPTACLE_DEMAND_FACTORS.nonDwelling.firstPortion.kVA).toBe(10);
      expect(NEC_RECEPTACLE_DEMAND_FACTORS.nonDwelling.firstPortion.factor).toBe(1.0);
      expect(NEC_RECEPTACLE_DEMAND_FACTORS.nonDwelling.remainder.factor).toBe(0.5);
    });
  });

  describe('NEC_MOTOR_DEMAND_FACTORS', () => {
    it('should have correct single motor factor (125%)', () => {
      expect(NEC_MOTOR_DEMAND_FACTORS.singleMotor.factor).toBe(1.25);
    });

    it('should have correct multiple motor factors (125% largest + 100% others)', () => {
      expect(NEC_MOTOR_DEMAND_FACTORS.multipleMotors.largestFactor).toBe(1.25);
      expect(NEC_MOTOR_DEMAND_FACTORS.multipleMotors.othersFactor).toBe(1.0);
    });
  });

  describe('calculateNECDwellingOptional', () => {
    it('should calculate correctly for small load (under 10 kVA)', () => {
      const loads = {
        generalLighting: 5,
        receptacleLoads: 3,
      };

      const result = calculateNECDwellingOptional(loads);

      // Total general load: 8 kVA (all under 10 kVA threshold)
      // Demand: 8 × 1.0 = 8 kVA
      expect(result.totalDemand).toBe(8);
      expect(result.breakdown.length).toBe(1);
    });

    it('should calculate correctly for reference case with tiered calculation', () => {
      const loads = {
        generalLighting: 15,
        receptacleLoads: 10,
      };

      const result = calculateNECDwellingOptional(loads);

      // Total general load: 25 kVA
      // First 10 kVA @ 100% = 10
      // Remainder 15 kVA @ 40% = 6
      // Total demand: 16 kVA
      expect(result.totalDemand).toBe(16);
      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].category).toBe('generalLightingReceptacles');
    });

    it('should calculate correctly for cooking equipment (75% factor)', () => {
      const loads = {
        cookingAppliances: 12,
      };

      const result = calculateNECDwellingOptional(loads);

      // 12 × 0.75 = 9 kVA
      expect(result.totalDemand).toBe(9);
      expect(result.breakdown[0].appliedFactor).toBe(0.75);
    });

    it('should calculate correctly for HVAC (100% factor)', () => {
      const loads = {
        hvac: 18,
      };

      const result = calculateNECDwellingOptional(loads);

      // 18 × 1.0 = 18 kVA
      expect(result.totalDemand).toBe(18);
      expect(result.breakdown[0].appliedFactor).toBe(1.0);
    });

    it('should calculate correctly for water heater (100% factor)', () => {
      const loads = {
        waterHeating: 5,
      };

      const result = calculateNECDwellingOptional(loads);

      // 5 × 1.0 = 5 kVA
      expect(result.totalDemand).toBe(5);
      expect(result.breakdown[0].appliedFactor).toBe(1.0);
    });

    it('should calculate correctly for dryer with 5 kW minimum', () => {
      const loads = {
        dryer: 3, // Less than 5 kW minimum
      };

      const result = calculateNECDwellingOptional(loads);

      // Should use 5 kW minimum
      expect(result.totalDemand).toBe(5);
      expect(result.breakdown[0].connectedLoad).toBe(3);
      expect(result.breakdown[0].demandLoad).toBe(5);
    });

    it('should calculate correctly for dryer above 5 kW', () => {
      const loads = {
        dryer: 8,
      };

      const result = calculateNECDwellingOptional(loads);

      // 8 × 1.0 = 8 kVA
      expect(result.totalDemand).toBe(8);
    });

    it('should calculate complete NEC optional method example', () => {
      const loads = {
        generalLighting: 15,
        receptacleLoads: 10,
        cookingAppliances: 12,
        hvac: 18,
        waterHeating: 5,
        dryer: 5,
      };

      const result = calculateNECDwellingOptional(loads);

      // General: 25 kVA → 10 + (15 × 0.4) = 16
      // Cooking: 12 × 0.75 = 9
      // HVAC: 18 × 1.0 = 18
      // Water: 5 × 1.0 = 5
      // Dryer: 5 × 1.0 = 5
      // Total: 16 + 9 + 18 + 5 + 5 = 53 kVA

      expect(result.totalDemand).toBe(53);
      expect(result.breakdown.length).toBe(5);
    });

    it('should handle empty loads', () => {
      const loads = {};

      const result = calculateNECDwellingOptional(loads);

      expect(result.totalDemand).toBe(0);
      expect(result.breakdown.length).toBe(0);
    });

    it('should handle zero loads', () => {
      const loads = {
        generalLighting: 0,
        receptacleLoads: 0,
        cookingAppliances: 0,
        hvac: 0,
        waterHeating: 0,
        dryer: 0,
      };

      const result = calculateNECDwellingOptional(loads);

      expect(result.totalDemand).toBe(0);
      expect(result.breakdown.length).toBe(0);
    });

    it('should include standard references in breakdown', () => {
      const loads = {
        generalLighting: 10,
        cookingAppliances: 8,
        hvac: 15,
      };

      const result = calculateNECDwellingOptional(loads);

      result.breakdown.forEach((item) => {
        expect(item.standardReference).toBeDefined();
        expect(item.standardReference.length).toBeGreaterThan(0);
      });
    });

    it('should include notes in breakdown', () => {
      const loads = {
        dryer: 5,
      };

      const result = calculateNECDwellingOptional(loads);

      expect(result.breakdown[0].notes).toContain('5 kW minimum');
    });
  });

  describe('getNECKitchenEquipmentFactor', () => {
    it('should return 100% factor for 1 unit', () => {
      const factor = getNECKitchenEquipmentFactor(1);
      expect(factor.factor).toBe(1.0);
    });

    it('should return 80% factor for 2 units', () => {
      const factor = getNECKitchenEquipmentFactor(2);
      expect(factor.factor).toBe(0.8);
    });

    it('should return 75% factor for 3 units', () => {
      const factor = getNECKitchenEquipmentFactor(3);
      expect(factor.factor).toBe(0.75);
    });

    it('should return 70% factor for 4-5 units', () => {
      expect(getNECKitchenEquipmentFactor(4).factor).toBe(0.7);
      expect(getNECKitchenEquipmentFactor(5).factor).toBe(0.7);
    });

    it('should return 65% factor for 6+ units', () => {
      expect(getNECKitchenEquipmentFactor(6).factor).toBe(0.65);
      expect(getNECKitchenEquipmentFactor(10).factor).toBe(0.65);
      expect(getNECKitchenEquipmentFactor(100).factor).toBe(0.65);
    });

    it('should include NEC 220.56 clause reference', () => {
      const factor = getNECKitchenEquipmentFactor(4);
      expect(factor.clause).toBe('NEC 220.56');
    });

    it('should include quantity in notes', () => {
      const factor = getNECKitchenEquipmentFactor(4);
      expect(factor.notes).toContain('4 units');
    });
  });

  describe('calculateNECMotorDemand', () => {
    it('should calculate correctly for single motor (125% factor)', () => {
      const motors = [{ power: 10, isLargest: true }];

      const result = calculateNECMotorDemand(motors);

      // 10 × 1.25 = 12.5 kW
      expect(result.totalDemand).toBe(12.5);
      expect(result.clause).toBe('NEC 430.24');
    });

    it('should calculate correctly for multiple motors (125% largest + 100% others)', () => {
      const motors = [
        { power: 20, isLargest: true },
        { power: 15, isLargest: false },
        { power: 10, isLargest: false },
      ];

      const result = calculateNECMotorDemand(motors);

      // Largest: 20 × 1.25 = 25
      // Others: 15 × 1.0 = 15, 10 × 1.0 = 10
      // Total: 25 + 15 + 10 = 50 kW
      expect(result.totalDemand).toBe(50);
    });

    it('should handle empty motor array', () => {
      const motors: { power: number; isLargest: boolean }[] = [];

      const result = calculateNECMotorDemand(motors);

      expect(result.totalDemand).toBe(0);
    });

    it('should handle multiple motors with same power (first marked as largest)', () => {
      const motors = [
        { power: 10, isLargest: true },
        { power: 10, isLargest: false },
        { power: 10, isLargest: false },
      ];

      const result = calculateNECMotorDemand(motors);

      // Largest: 10 × 1.25 = 12.5
      // Others: 10 × 1.0 = 10, 10 × 1.0 = 10
      // Total: 12.5 + 10 + 10 = 32.5 kW
      expect(result.totalDemand).toBe(32.5);
    });

    it('should include correct clause reference', () => {
      const motors = [{ power: 15, isLargest: true }];

      const result = calculateNECMotorDemand(motors);

      expect(result.clause).toBe('NEC 430.24');
    });
  });

  describe('Edge Cases', () => {
    it('should handle fractional kVA values', () => {
      const loads = {
        generalLighting: 12.5,
        receptacleLoads: 7.5,
      };

      const result = calculateNECDwellingOptional(loads);

      // Total: 20 kVA
      // First 10 @ 100% = 10
      // Remainder 10 @ 40% = 4
      // Total: 14 kVA
      expect(result.totalDemand).toBe(14);
    });

    it('should handle very large loads', () => {
      const loads = {
        generalLighting: 500,
        receptacleLoads: 300,
        cookingAppliances: 100,
        hvac: 200,
        waterHeating: 50,
        dryer: 10,
      };

      const result = calculateNECDwellingOptional(loads);

      // General: 800 → 10 + (790 × 0.4) = 326
      // Cooking: 100 × 0.75 = 75
      // HVAC: 200 × 1.0 = 200
      // Water: 50 × 1.0 = 50
      // Dryer: 10 × 1.0 = 10
      // Total: 326 + 75 + 200 + 50 + 10 = 661 kVA

      expect(result.totalDemand).toBe(661);
    });

    it('should handle boundary at exactly 10 kVA', () => {
      const loads = {
        generalLighting: 10,
      };

      const result = calculateNECDwellingOptional(loads);

      // Exactly 10 kVA @ 100% = 10
      expect(result.totalDemand).toBe(10);
    });
  });

  describe('Breakdown Structure', () => {
    it('should include all required fields in breakdown items', () => {
      const loads = {
        generalLighting: 15,
        cookingAppliances: 10,
      };

      const result = calculateNECDwellingOptional(loads);

      result.breakdown.forEach((item) => {
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('connectedLoad');
        expect(item).toHaveProperty('appliedFactor');
        expect(item).toHaveProperty('demandLoad');
        expect(item).toHaveProperty('standardReference');
        expect(item).toHaveProperty('notes');
      });
    });

    it('should have correct category names in breakdown', () => {
      const loads = {
        generalLighting: 10,
        cookingAppliances: 8,
        hvac: 15,
        waterHeating: 5,
        dryer: 5,
      };

      const result = calculateNECDwellingOptional(loads);

      const categories = result.breakdown.map((b) => b.category);
      expect(categories).toContain('generalLightingReceptacles');
      expect(categories).toContain('cookingAppliances');
      expect(categories).toContain('hvac');
      expect(categories).toContain('waterHeating');
      expect(categories).toContain('dryer');
    });
  });
});
