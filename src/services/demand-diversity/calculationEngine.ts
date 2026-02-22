/**
 * Core calculation engine for maximum demand and diversity calculations
 * Supports both IEC 60364 and NEC Article 220 standards
 */

import { DemandCalculationParameters } from '../../models/DemandCalculationParameters';
import { DemandCalculationResult, CategoryResult, ComplianceCheck } from '../../models/DemandCalculationResult';
import { 
  getIECResidentialFactor, 
  calculateIECOverallDiversity,
  IEC_RESIDENTIAL_FACTORS 
} from './IECFactors';
import { 
  calculateNECDwellingOptional,
  getNECKitchenEquipmentFactor,
  calculateNECMotorDemand,
  NEC_DWELLING_OPTIONAL
} from './NECFactors';

/**
 * Main calculation engine for maximum demand and diversity
 */
export class DemandCalculationEngine {

  /**
   * Calculate maximum demand based on input parameters
   */
  public calculate(params: DemandCalculationParameters): DemandCalculationResult {
    const categoryBreakdown: CategoryResult[] = [];
    let totalConnectedLoad = 0;
    let totalDemand = 0;

    // Calculate based on standard and project type
    if (params.standard === 'IEC') {
      const result = this.calculateIEC(params);
      categoryBreakdown.push(...result.breakdown);
      totalConnectedLoad = result.totalConnected;
      totalDemand = result.totalDemand;
    } else {
      const result = this.calculateNEC(params);
      categoryBreakdown.push(...result.breakdown);
      totalConnectedLoad = result.totalConnected;
      totalDemand = result.totalDemand;
    }

    // Apply future expansion if specified
    if (params.futureExpansion && params.futureExpansion > 0) {
      totalDemand = totalDemand * (1 + params.futureExpansion);
    }

    // Calculate overall diversity factor
    const overallDiversityFactor = totalConnectedLoad > 0 
      ? 1 - (totalDemand / totalConnectedLoad) 
      : 0;

    // Generate compliance checks
    const complianceChecks = this.generateComplianceChecks(params, categoryBreakdown);

    // Generate warnings
    const warnings = this.generateWarnings(params, categoryBreakdown);

    // Calculate recommended service size
    const recommendedServiceSize = this.calculateRecommendedServiceSize(
      totalDemand, 
      params.voltage, 
      params.phases
    );

    return {
      totalConnectedLoad: Math.round(totalConnectedLoad * 1000) / 1000,
      maximumDemand: Math.round(totalDemand * 1000) / 1000,
      overallDiversityFactor: Math.round(overallDiversityFactor * 10000) / 10000,
      categoryBreakdown,
      complianceChecks,
      recommendedServiceSize,
      recommendedBreakerSize: Math.ceil(recommendedServiceSize * 1.25), // 125% for breaker sizing
      calculationTimestamp: new Date(),
      standardUsed: params.standard === 'IEC' ? 'IEC 60364-5-52' : 'NEC Article 220',
      warnings,
    };
  }

  /**
   * Calculate using IEC standards
   */
  private calculateIEC(params: DemandCalculationParameters): {
    totalConnected: number;
    totalDemand: number;
    breakdown: CategoryResult[];
  } {
    const breakdown: CategoryResult[] = [];
    let totalConnected = 0;
    let totalDemand = 0;

    if (params.projectType === 'residential') {
      // Residential IEC calculation
      const loads = params.loads;

      if (loads.lighting && loads.lighting > 0) {
        const factor = getIECResidentialFactor('lighting');
        totalConnected += loads.lighting;
        totalDemand += loads.lighting * factor.factor;
        breakdown.push({
          category: 'Lighting',
          connectedLoad: loads.lighting,
          appliedFactor: factor.factor,
          demandLoad: Math.round(loads.lighting * factor.factor * 1000) / 1000,
          standardReference: factor.clause,
          notes: factor.notes,
        });
      }

      if (loads.socketOutlets && loads.socketOutlets > 0) {
        const factor = getIECResidentialFactor('socketOutlets');
        totalConnected += loads.socketOutlets;
        totalDemand += loads.socketOutlets * factor.factor;
        breakdown.push({
          category: 'Socket Outlets',
          connectedLoad: loads.socketOutlets,
          appliedFactor: factor.factor,
          demandLoad: Math.round(loads.socketOutlets * factor.factor * 1000) / 1000,
          standardReference: factor.clause,
          notes: factor.notes,
        });
      }

      if (loads.hvac && loads.hvac > 0) {
        const factor = getIECResidentialFactor('hvac');
        totalConnected += loads.hvac;
        totalDemand += loads.hvac * factor.factor;
        breakdown.push({
          category: 'HVAC',
          connectedLoad: loads.hvac,
          appliedFactor: factor.factor,
          demandLoad: Math.round(loads.hvac * factor.factor * 1000) / 1000,
          standardReference: factor.clause,
          notes: factor.notes,
        });
      }

      if (loads.cookingAppliances && loads.cookingAppliances > 0) {
        const factor = getIECResidentialFactor('cookingAppliances');
        totalConnected += loads.cookingAppliances;
        totalDemand += loads.cookingAppliances * factor.factor;
        breakdown.push({
          category: 'Cooking Appliances',
          connectedLoad: loads.cookingAppliances,
          appliedFactor: factor.factor,
          demandLoad: Math.round(loads.cookingAppliances * factor.factor * 1000) / 1000,
          standardReference: factor.clause,
          notes: factor.notes,
        });
      }

      if (loads.waterHeating && loads.waterHeating > 0) {
        const factor = getIECResidentialFactor('waterHeating');
        totalConnected += loads.waterHeating;
        totalDemand += loads.waterHeating * factor.factor;
        breakdown.push({
          category: 'Water Heating',
          connectedLoad: loads.waterHeating,
          appliedFactor: factor.factor,
          demandLoad: Math.round(loads.waterHeating * factor.factor * 1000) / 1000,
          standardReference: factor.clause,
          notes: factor.notes,
        });
      }

      if (loads.otherAppliances && loads.otherAppliances > 0) {
        const factor = getIECResidentialFactor('otherAppliances');
        totalConnected += loads.otherAppliances;
        totalDemand += loads.otherAppliances * factor.factor;
        breakdown.push({
          category: 'Other Appliances',
          connectedLoad: loads.otherAppliances,
          appliedFactor: factor.factor,
          demandLoad: Math.round(loads.otherAppliances * factor.factor * 1000) / 1000,
          standardReference: factor.clause,
          notes: factor.notes,
        });
      }
    }

    return { totalConnected, totalDemand, breakdown };
  }

  /**
   * Calculate using NEC standards
   */
  private calculateNEC(params: DemandCalculationParameters): {
    totalConnected: number;
    totalDemand: number;
    breakdown: CategoryResult[];
  } {
    const breakdown: CategoryResult[] = [];
    let totalConnected = 0;
    let totalDemand = 0;

    if (params.projectType === 'residential') {
      // NEC Optional Method for Dwelling Units (220.82)
      const { totalDemand: necDemand, breakdown: necBreakdown } = calculateNECDwellingOptional(params.loads);
      
      // Calculate total connected for NEC
      const loads = params.loads;
      if (loads.generalLighting) totalConnected += loads.generalLighting;
      if (loads.receptacleLoads) totalConnected += loads.receptacleLoads;
      if (loads.cookingAppliances) totalConnected += loads.cookingAppliances;
      if (loads.hvac) totalConnected += loads.hvac;
      if (loads.waterHeating) totalConnected += loads.waterHeating;
      if (loads.dryer) totalConnected += loads.dryer;

      totalDemand = necDemand;
      breakdown.push(...necBreakdown);
    } else if (params.projectType === 'commercial') {
      // Commercial NEC calculation
      const loads = params.loads;

      if (loads.generalLighting && loads.generalLighting > 0) {
        // NEC 220.42 commercial lighting demand
        const firstPortion = Math.min(loads.generalLighting, 12.5);
        const remainder = Math.max(0, loads.generalLighting - 12.5);
        const demand = (firstPortion * 1.0) + (remainder * 0.75);
        
        totalConnected += loads.generalLighting;
        totalDemand += demand;
        breakdown.push({
          category: 'General Lighting',
          connectedLoad: loads.generalLighting,
          appliedFactor: demand / loads.generalLighting,
          demandLoad: Math.round(demand * 1000) / 1000,
          standardReference: 'NEC 220.42',
          notes: 'First 12.5 kVA @ 100%, remainder @ 75%',
        });
      }

      if (loads.receptacleLoads && loads.receptacleLoads > 0) {
        // NEC 220.44 receptacle demand
        const firstPortion = Math.min(loads.receptacleLoads, 10);
        const remainder = Math.max(0, loads.receptacleLoads - 10);
        const demand = (firstPortion * 1.0) + (remainder * 0.5);
        
        totalConnected += loads.receptacleLoads;
        totalDemand += demand;
        breakdown.push({
          category: 'Receptacle Loads',
          connectedLoad: loads.receptacleLoads,
          appliedFactor: demand / loads.receptacleLoads,
          demandLoad: Math.round(demand * 1000) / 1000,
          standardReference: 'NEC 220.44',
          notes: 'First 10 kVA @ 100%, remainder @ 50%',
        });
      }

      if (loads.hvac && loads.hvac > 0) {
        totalConnected += loads.hvac;
        totalDemand += loads.hvac; // 100% for largest HVAC system
        breakdown.push({
          category: 'HVAC',
          connectedLoad: loads.hvac,
          appliedFactor: 1.0,
          demandLoad: loads.hvac,
          standardReference: 'NEC 220.50',
          notes: '100% of largest HVAC system',
        });
      }

      if (loads.kitchenEquipment && loads.kitchenEquipment > 0) {
        const factorInfo = getNECKitchenEquipmentFactor(4); // Assume 4 units default
        const demand = loads.kitchenEquipment * factorInfo.factor;
        
        totalConnected += loads.kitchenEquipment;
        totalDemand += demand;
        breakdown.push({
          category: 'Kitchen Equipment',
          connectedLoad: loads.kitchenEquipment,
          appliedFactor: factorInfo.factor,
          demandLoad: Math.round(demand * 1000) / 1000,
          standardReference: factorInfo.clause,
          notes: factorInfo.notes,
        });
      }
    } else if (params.projectType === 'industrial') {
      // Industrial NEC calculation
      const loads = params.loads;

      if (loads.motorLoads && loads.motorLoads.length > 0) {
        const { totalDemand: motorDemand, clause } = calculateNECMotorDemand(
          loads.motorLoads.map(m => ({ power: m.power, isLargest: m.isLargest }))
        );
        
        const motorTotal = loads.motorLoads.reduce((sum, m) => sum + m.power, 0);
        totalConnected += motorTotal;
        totalDemand += motorDemand;
        breakdown.push({
          category: 'Motor Loads',
          connectedLoad: motorTotal,
          appliedFactor: motorDemand / motorTotal,
          demandLoad: Math.round(motorDemand * 1000) / 1000,
          standardReference: clause,
          notes: '125% of largest + 100% of others',
        });
      }

      if (loads.processEquipment && loads.processEquipment > 0) {
        totalConnected += loads.processEquipment;
        totalDemand += loads.processEquipment * 0.9; // 10% diversity for process equipment
        breakdown.push({
          category: 'Process Equipment',
          connectedLoad: loads.processEquipment,
          appliedFactor: 0.9,
          demandLoad: Math.round(loads.processEquipment * 0.9 * 1000) / 1000,
          standardReference: 'NEC Article 220',
          notes: '10% diversity applied',
        });
      }

      if (loads.lighting && loads.lighting > 0) {
        totalConnected += loads.lighting;
        totalDemand += loads.lighting; // 100% for industrial lighting
        breakdown.push({
          category: 'Lighting',
          connectedLoad: loads.lighting,
          appliedFactor: 1.0,
          demandLoad: loads.lighting,
          standardReference: 'NEC 220.12',
          notes: '100% for industrial lighting',
        });
      }
    }

    return { totalConnected, totalDemand, breakdown };
  }

  /**
   * Generate compliance checks
   */
  private generateComplianceChecks(
    params: DemandCalculationParameters,
    breakdown: CategoryResult[]
  ): ComplianceCheck[] {
    const checks: ComplianceCheck[] = [];

    // Check if all categories have valid factors
    const allCategoriesValid = breakdown.every(cat => cat.appliedFactor >= 0 && cat.appliedFactor <= 1);
    checks.push({
      standard: params.standard === 'IEC' ? 'IEC 60364-5-52' : 'NEC Article 220',
      clause: params.standard === 'IEC' ? '524' : '220',
      requirement: 'All demand/diversity factors within valid range (0-1)',
      compliant: allCategoriesValid,
      details: allCategoriesValid 
        ? 'All factors applied correctly' 
        : 'Invalid factors detected',
    });

    // Check for continuous loads (NEC 125% rule)
    if (params.standard === 'NEC') {
      const hasContinuousLoad = breakdown.some(cat => 
        cat.category.includes('Water') || cat.category.includes('HVAC')
      );
      checks.push({
        standard: 'NEC Article 210',
        clause: '210.20(A)',
        requirement: 'Continuous loads multiplied by 125% for breaker sizing',
        compliant: hasContinuousLoad,
        details: hasContinuousLoad 
          ? 'Continuous loads detected - breaker sized at 125%' 
          : 'No continuous loads detected',
      });
    }

    return checks;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    params: DemandCalculationParameters,
    breakdown: CategoryResult[]
  ): string[] {
    const warnings: string[] = [];

    // Check for very low diversity factor
    const totalConnected = breakdown.reduce((sum, cat) => sum + cat.connectedLoad, 0);
    const totalDemand = breakdown.reduce((sum, cat) => sum + cat.demandLoad, 0);
    const diversity = totalConnected > 0 ? 1 - (totalDemand / totalConnected) : 0;

    if (diversity < 0.1) {
      warnings.push('Low diversity factor detected - verify if all loads operate simultaneously');
    }

    // Check for very high connected load
    if (totalConnected > 500) {
      warnings.push(`High connected load (${totalConnected.toFixed(1)} kW) - consider service entrance upgrade`);
    }

    // Check for unbalanced three-phase
    if (params.phases === 3 && params.projectType === 'residential') {
      warnings.push('Three-phase service for residential - verify load balancing');
    }

    return warnings;
  }

  /**
   * Calculate recommended service size in amperes
   */
  private calculateRecommendedServiceSize(
    demandKW: number,
    voltage: number,
    phases: 1 | 3
  ): number {
    let current: number;

    if (phases === 1) {
      // Single-phase: I = P / V
      current = (demandKW * 1000) / voltage;
    } else {
      // Three-phase: I = P / (√3 × V)
      current = (demandKW * 1000) / (Math.sqrt(3) * voltage);
    }

    // Round up to standard breaker size
    const standardSizes = [100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 500, 600, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];
    
    for (const size of standardSizes) {
      if (size >= current) {
        return size;
      }
    }

    return Math.ceil(current);
  }
}
