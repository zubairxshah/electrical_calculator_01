/**
 * Unit Tests for Maximum Demand Calculation Engine
 * Tests core calculation engine for IEC and NEC standards
 */

import { describe, it, expect } from 'vitest';
import { DemandCalculationEngine } from '../../../src/services/demand-diversity/calculationEngine';
import { DemandCalculationParameters } from '../../../src/models/DemandCalculationParameters';

describe('DemandCalculationEngine', () => {
  const engine = new DemandCalculationEngine();

  describe('IEC Residential Calculations', () => {
    it('should calculate correctly for reference case (59kW → 43.6kW, 26.1% diversity)', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Test Residence',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
          socketOutlets: 15,
          hvac: 20,
          cookingAppliances: 8,
          waterHeating: 6,
        },
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBe(59);
      expect(result.maximumDemand).toBeCloseTo(43.6, 1);
      expect(result.overallDiversityFactor).toBeCloseTo(0.261, 2);
      expect(result.standardUsed).toBe('IEC 60364-5-52');
    });

    it('should calculate correctly for lighting only (no diversity)', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Lighting Only',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 20,
        },
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBe(20);
      expect(result.maximumDemand).toBe(20);
      expect(result.overallDiversityFactor).toBe(0);
    });

    it('should calculate correctly for socket outlets only (60% diversity)', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Socket Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          socketOutlets: 100,
        },
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBe(100);
      expect(result.maximumDemand).toBe(40);
      expect(result.overallDiversityFactor).toBe(0.6);
    });

    it('should include all load categories in breakdown', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Full Load Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
          socketOutlets: 15,
          hvac: 20,
          cookingAppliances: 8,
          waterHeating: 6,
          otherAppliances: 5,
        },
      };

      const result = engine.calculate(params);

      expect(result.categoryBreakdown.length).toBe(6);
      const categories = result.categoryBreakdown.map((c) => c.category);
      expect(categories).toContain('Lighting');
      expect(categories).toContain('Socket Outlets');
      expect(categories).toContain('HVAC');
      expect(categories).toContain('Cooking Appliances');
      expect(categories).toContain('Water Heating');
      expect(categories).toContain('Other Appliances');
    });

    it('should handle three-phase IEC calculation', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Three Phase Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 400,
        phases: 3,
        frequency: 50,
        loads: {
          lighting: 10,
          socketOutlets: 15,
          hvac: 20,
        },
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBe(45);
      // 10 + 6 + 16 = 32 kW demand
      expect(result.maximumDemand).toBe(32);
    });
  });

  describe('NEC Residential Calculations (Optional Method 220.82)', () => {
    it('should calculate correctly for NEC optional method example', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Smith Residence',
        projectType: 'residential',
        standard: 'NEC',
        voltage: 240,
        phases: 1,
        frequency: 60,
        loads: {
          generalLighting: 15,
          receptacleLoads: 10,
          cookingAppliances: 12,
          hvac: 18,
          waterHeating: 5,
          dryer: 5,
        },
      };

      const result = engine.calculate(params);

      // General: 25 kVA → 10 + (15 × 0.4) = 16
      // Cooking: 12 × 0.75 = 9
      // HVAC: 18 × 1.0 = 18
      // Water: 5 × 1.0 = 5
      // Dryer: 5 × 1.0 = 5
      // Total: 53 kVA

      expect(result.totalConnectedLoad).toBe(65);
      expect(result.maximumDemand).toBe(53);
      expect(result.standardUsed).toBe('NEC Article 220');
    });

    it('should calculate correctly for small load (under 10 kVA)', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Small Load',
        projectType: 'residential',
        standard: 'NEC',
        voltage: 120,
        phases: 1,
        frequency: 60,
        loads: {
          generalLighting: 5,
          receptacleLoads: 3,
        },
      };

      const result = engine.calculate(params);

      // Total 8 kVA @ 100% = 8
      expect(result.maximumDemand).toBe(8);
    });

    it('should apply 5 kW minimum for dryer', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Dryer Test',
        projectType: 'residential',
        standard: 'NEC',
        voltage: 240,
        phases: 1,
        frequency: 60,
        loads: {
          dryer: 3, // Less than 5 kW minimum
        },
      };

      const result = engine.calculate(params);

      expect(result.maximumDemand).toBe(5);
    });

    it('should include correct NEC clause references', () => {
      const params: DemandCalculationParameters = {
        projectName: 'NEC Reference Test',
        projectType: 'residential',
        standard: 'NEC',
        voltage: 240,
        phases: 1,
        frequency: 60,
        loads: {
          generalLighting: 10,
          cookingAppliances: 8,
        },
      };

      const result = engine.calculate(params);

      result.categoryBreakdown.forEach((item) => {
        expect(item.standardReference).toContain('NEC');
      });
    });
  });

  describe('NEC Commercial Calculations', () => {
    it('should calculate commercial lighting with tiered demand (NEC 220.42)', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Office Building',
        projectType: 'commercial',
        standard: 'NEC',
        voltage: 277,
        phases: 3,
        frequency: 60,
        loads: {
          generalLighting: 25,
        },
      };

      const result = engine.calculate(params);

      // First 12.5 kVA @ 100% = 12.5
      // Remainder 12.5 kVA @ 75% = 9.375
      // Total: 21.875 kVA

      expect(result.totalConnectedLoad).toBe(25);
      expect(result.maximumDemand).toBeCloseTo(21.875, 2);
    });

    it('should calculate commercial receptacles with tiered demand (NEC 220.44)', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Retail Store',
        projectType: 'commercial',
        standard: 'NEC',
        voltage: 120,
        phases: 1,
        frequency: 60,
        loads: {
          receptacleLoads: 20,
        },
      };

      const result = engine.calculate(params);

      // First 10 kVA @ 100% = 10
      // Remainder 10 kVA @ 50% = 5
      // Total: 15 kVA

      expect(result.totalConnectedLoad).toBe(20);
      expect(result.maximumDemand).toBe(15);
    });

    it('should calculate commercial HVAC at 100%', () => {
      const params: DemandCalculationParameters = {
        projectName: 'HVAC Test',
        projectType: 'commercial',
        standard: 'NEC',
        voltage: 480,
        phases: 3,
        frequency: 60,
        loads: {
          hvac: 50,
        },
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBe(50);
      expect(result.maximumDemand).toBe(50);
      expect(result.categoryBreakdown[0].notes).toContain('100%');
    });
  });

  describe('NEC Industrial Calculations', () => {
    it('should calculate motor loads with 125% largest + 100% others', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Industrial Motors',
        projectType: 'industrial',
        standard: 'NEC',
        voltage: 480,
        phases: 3,
        frequency: 60,
        loads: {
          motorLoads: [
            { name: 'Motor 1', power: 20, isLargest: true, powerFactor: 0.85, dutyCycle: 'continuous' },
            { name: 'Motor 2', power: 15, isLargest: false, powerFactor: 0.85, dutyCycle: 'continuous' },
            { name: 'Motor 3', power: 10, isLargest: false, powerFactor: 0.85, dutyCycle: 'continuous' },
          ],
        },
      };

      const result = engine.calculate(params);

      // Largest: 20 × 1.25 = 25
      // Others: 15 + 10 = 25
      // Total: 50 kW

      expect(result.totalConnectedLoad).toBe(45);
      expect(result.maximumDemand).toBe(50);
    });

    it('should calculate process equipment with 10% diversity', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Process Equipment',
        projectType: 'industrial',
        standard: 'NEC',
        voltage: 480,
        phases: 3,
        frequency: 60,
        loads: {
          processEquipment: 100,
        },
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBe(100);
      expect(result.maximumDemand).toBe(90); // 100 × 0.9
    });
  });

  describe('Recommended Service Size Calculation', () => {
    it('should calculate correct single-phase service size', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Service Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
        },
      };

      const result = engine.calculate(params);

      // I = P / V = 10000 / 230 = 43.48 A
      // Next standard size: 100 A

      expect(result.recommendedServiceSize).toBeGreaterThanOrEqual(44);
    });

    it('should calculate correct three-phase service size', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Three Phase Service',
        projectType: 'commercial',
        standard: 'NEC',
        voltage: 400,
        phases: 3,
        frequency: 50,
        loads: {
          generalLighting: 50,
        },
      };

      const result = engine.calculate(params);

      // I = P / (√3 × V) = 50000 / (1.732 × 400) = 72.17 A
      // Next standard size: 100 A

      expect(result.recommendedServiceSize).toBeGreaterThanOrEqual(73);
    });

    it('should recommend standard breaker sizes', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Breaker Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          socketOutlets: 20,
        },
      };

      const result = engine.calculate(params);

      // Breaker should be larger than service size
      expect(result.recommendedBreakerSize).toBeGreaterThanOrEqual(result.recommendedServiceSize);
    });
  });

  describe('Future Expansion Factor', () => {
    it('should apply future expansion factor correctly', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Future Expansion Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
        },
        futureExpansion: 0.25, // 25% expansion
      };

      const result = engine.calculate(params);

      // Base demand: 10 kW
      // With 25% expansion: 10 × 1.25 = 12.5 kW

      expect(result.maximumDemand).toBe(12.5);
    });

    it('should handle zero future expansion', () => {
      const params: DemandCalculationParameters = {
        projectName: 'No Expansion',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
        },
        futureExpansion: 0,
      };

      const result = engine.calculate(params);

      expect(result.maximumDemand).toBe(10);
    });
  });

  describe('Compliance Checks', () => {
    it('should generate compliance checks for IEC', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Compliance Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
        },
      };

      const result = engine.calculate(params);

      expect(result.complianceChecks.length).toBeGreaterThan(0);
      const iecCheck = result.complianceChecks.find((c) => c.standard === 'IEC 60364-5-52');
      expect(iecCheck).toBeDefined();
    });

    it('should generate NEC continuous load compliance check', () => {
      const params: DemandCalculationParameters = {
        projectName: 'NEC Compliance',
        projectType: 'residential',
        standard: 'NEC',
        voltage: 240,
        phases: 1,
        frequency: 60,
        loads: {
          waterHeating: 5,
        },
      };

      const result = engine.calculate(params);

      const necCheck = result.complianceChecks.find((c) => c.standard === 'NEC Article 210');
      expect(necCheck).toBeDefined();
      expect(necCheck?.clause).toBe('210.20(A)');
    });

    it('should mark compliance as compliant for valid factors', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Valid Factors',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
        },
      };

      const result = engine.calculate(params);

      const factorCheck = result.complianceChecks.find((c) =>
        c.requirement.includes('factors within valid range')
      );
      expect(factorCheck?.compliant).toBe(true);
    });
  });

  describe('Warnings', () => {
    it('should warn for low diversity factor', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Low Diversity',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 100, // 100% factor
          waterHeating: 50, // 100% factor
        },
      };

      const result = engine.calculate(params);

      expect(result.warnings.some((w) => w.toLowerCase().includes('diversity'))).toBe(true);
    });

    it('should warn for high connected load (>500 kW)', () => {
      const params: DemandCalculationParameters = {
        projectName: 'High Load',
        projectType: 'commercial',
        standard: 'NEC',
        voltage: 480,
        phases: 3,
        frequency: 60,
        loads: {
          generalLighting: 600,
        },
      };

      const result = engine.calculate(params);

      expect(result.warnings.some((w) => w.toLowerCase().includes('high'))).toBe(true);
    });

    it('should warn for three-phase residential service', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Three Phase Residential',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 400,
        phases: 3,
        frequency: 50,
        loads: {
          lighting: 10,
        },
      };

      const result = engine.calculate(params);

      expect(result.warnings.some((w) => w.toLowerCase().includes('three-phase'))).toBe(true);
    });
  });

  describe('Result Metadata', () => {
    it('should include calculation timestamp', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Timestamp Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
        },
      };

      const result = engine.calculate(params);

      expect(result.calculationTimestamp).toBeDefined();
      expect(result.calculationTimestamp).toBeInstanceOf(Date);
    });

    it('should include standard used in result', () => {
      const iecParams: DemandCalculationParameters = {
        projectName: 'IEC Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
        },
      };

      const necParams: DemandCalculationParameters = {
        projectName: 'NEC Test',
        projectType: 'residential',
        standard: 'NEC',
        voltage: 240,
        phases: 1,
        frequency: 60,
        loads: {
          generalLighting: 10,
        },
      };

      const iecResult = engine.calculate(iecParams);
      const necResult = engine.calculate(necParams);

      expect(iecResult.standardUsed).toBe('IEC 60364-5-52');
      expect(necResult.standardUsed).toBe('NEC Article 220');
    });

    it('should round results to 3 decimal places', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Rounding Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          socketOutlets: 33.333,
        },
      };

      const result = engine.calculate(params);

      // Check that results are rounded
      expect(result.totalConnectedLoad).toBe(33.333);
      expect(result.maximumDemand).toBe(13.333); // 33.333 × 0.4
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty loads gracefully', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Empty Load',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {},
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBe(0);
      expect(result.maximumDemand).toBe(0);
      expect(result.overallDiversityFactor).toBe(0);
    });

    it('should handle very small loads', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Small Load',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 0.001,
        },
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBeGreaterThan(0);
      expect(result.maximumDemand).toBeGreaterThan(0);
    });

    it('should handle very large loads', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Large Load',
        projectType: 'commercial',
        standard: 'NEC',
        voltage: 11000,
        phases: 3,
        frequency: 60,
        loads: {
          generalLighting: 10000,
        },
      };

      const result = engine.calculate(params);

      expect(result.totalConnectedLoad).toBe(10000);
      expect(result.maximumDemand).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete calculation in <100ms', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Performance Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
          socketOutlets: 15,
          hvac: 20,
          cookingAppliances: 8,
          waterHeating: 6,
          otherAppliances: 5,
        },
      };

      const start = performance.now();
      engine.calculate(params);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should complete 100 calculations in <1 second', () => {
      const params: DemandCalculationParameters = {
        projectName: 'Batch Test',
        projectType: 'residential',
        standard: 'IEC',
        voltage: 230,
        phases: 1,
        frequency: 50,
        loads: {
          lighting: 10,
          socketOutlets: 15,
          hvac: 20,
        },
      };

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        engine.calculate(params);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
