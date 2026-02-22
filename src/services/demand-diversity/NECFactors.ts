/**
 * NEC Article 220 Demand Factors for Maximum Demand Calculations
 * 
 * References:
 * - NEC 220.12: General Lighting unit loads
 * - NEC 220.42: Dwelling lighting demand factors
 * - NEC 220.44: Receptacle loads
 * - NEC 220.50: Motor loads
 * - NEC 220.55: Cooking equipment
 * - NEC 220.82: Optional dwelling unit calculation
 * - NEC 220.84: Multi-family dwelling demand factors
 */

import { CategoryResult } from '../../models/DemandCalculationResult';

/**
 * NEC Optional Method for Dwelling Units (220.82)
 */
export const NEC_DWELLING_OPTIONAL = {
  generalLightingReceptacles: {
    firstPortion: { kVA: 10, factor: 1.0 },
    remainder: { factor: 0.4 },
    clause: 'NEC 220.82(B)',
    notes: 'First 10 kVA at 100%, remainder at 40%',
  },
  cookingEquipment: {
    defaultFactor: 0.75,
    clause: 'NEC 220.55',
    notes: 'Cooking appliances demand factor',
  },
  hvac: {
    factor: 1.0,
    clause: 'NEC 220.82(C)(1)',
    notes: '100% of largest heating or cooling system',
  },
  waterHeater: {
    factor: 1.0,
    clause: 'NEC 220.82(B)',
    notes: '100% of water heater load',
  },
  dryer: {
    minimum: 5, // kW
    factor: 1.0,
    clause: 'NEC 220.82(B)',
    notes: '100% of dryer load (5 kW minimum)',
  },
} as const;

/**
 * NEC General Lighting Demand Factors (220.42)
 */
export const NEC_LIGHTING_DEMAND_FACTORS = {
  dwelling: {
    firstPortion: { kVA: 3, factor: 1.0 },
    secondPortion: { kVA: 117, factor: 0.35 }, // 3 to 120 kVA
    remainder: { factor: 0.25 }, // Above 120 kVA
    clause: 'NEC 220.42',
  },
  commercial: {
    firstPortion: { kVA: 12.5, factor: 1.0 },
    remainder: { factor: 0.75 }, // Above 12.5 kVA
    clause: 'NEC 220.42',
  },
} as const;

/**
 * NEC Receptacle Load Demand Factors (220.44)
 */
export const NEC_RECEPTACLE_DEMAND_FACTORS = {
  nonDwelling: {
    firstPortion: { kVA: 10, factor: 1.0 },
    remainder: { factor: 0.5 },
    clause: 'NEC 220.44',
    notes: 'First 10 kVA at 100%, remainder at 50%',
  },
} as const;

/**
 * NEC Motor Load Demand Factors (220.50, 430.24)
 */
export const NEC_MOTOR_DEMAND_FACTORS = {
  singleMotor: {
    factor: 1.25,
    clause: 'NEC 430.22',
    notes: '125% of full-load current for single motor',
  },
  multipleMotors: {
    largestFactor: 1.25,
    othersFactor: 1.0,
    clause: 'NEC 430.24',
    notes: '125% of largest + 100% of others',
  },
  continuousDuty: {
    factor: 1.25,
    clause: 'NEC 430.32',
    notes: '125% for continuous duty motors',
  },
} as const;

/**
 * NEC Kitchen Equipment Demand Factors (220.56)
 */
export const NEC_KITCHEN_EQUIPMENT_FACTORS = {
  byQuantity: [
    { minUnits: 1, maxUnits: 1, factor: 1.0 },
    { minUnits: 2, maxUnits: 2, factor: 0.8 },
    { minUnits: 3, maxUnits: 3, factor: 0.75 },
    { minUnits: 4, maxUnits: 5, factor: 0.7 },
    { minUnits: 6, maxUnits: 100, factor: 0.65 },
  ],
  clause: 'NEC 220.56',
  notes: 'Demand factors based on number of kitchen equipment units',
} as const;

/**
 * Calculate NEC dwelling optional method demand
 */
export function calculateNECDwellingOptional(loads: {
  generalLighting?: number;
  receptacleLoads?: number;
  cookingAppliances?: number;
  hvac?: number;
  waterHeating?: number;
  dryer?: number;
}): { totalDemand: number; breakdown: CategoryResult[] } {
  const breakdown: CategoryResult[] = [];
  let totalDemand = 0;

  // General lighting and receptacles combined
  const generalLoad = (loads.generalLighting || 0) + (loads.receptacleLoads || 0);
  if (generalLoad > 0) {
    const firstPortion = Math.min(generalLoad, NEC_DWELLING_OPTIONAL.generalLightingReceptacles.firstPortion.kVA);
    const remainder = Math.max(0, generalLoad - firstPortion);
    const demand = (firstPortion * NEC_DWELLING_OPTIONAL.generalLightingReceptacles.firstPortion.factor) +
                   (remainder * NEC_DWELLING_OPTIONAL.generalLightingReceptacles.remainder.factor);
    
    totalDemand += demand;
    breakdown.push({
      category: 'generalLightingReceptacles',
      connectedLoad: generalLoad,
      appliedFactor: demand / generalLoad,
      demandLoad: demand,
      standardReference: NEC_DWELLING_OPTIONAL.generalLightingReceptacles.clause,
      notes: NEC_DWELLING_OPTIONAL.generalLightingReceptacles.notes,
    });
  }

  // Cooking equipment
  if (loads.cookingAppliances && loads.cookingAppliances > 0) {
    const demand = loads.cookingAppliances * NEC_DWELLING_OPTIONAL.cookingEquipment.defaultFactor;
    totalDemand += demand;
    breakdown.push({
      category: 'cookingAppliances',
      connectedLoad: loads.cookingAppliances,
      appliedFactor: NEC_DWELLING_OPTIONAL.cookingEquipment.defaultFactor,
      demandLoad: demand,
      standardReference: NEC_DWELLING_OPTIONAL.cookingEquipment.clause,
      notes: NEC_DWELLING_OPTIONAL.cookingEquipment.notes,
    });
  }

  // HVAC (largest of heating or cooling)
  if (loads.hvac && loads.hvac > 0) {
    const demand = loads.hvac * NEC_DWELLING_OPTIONAL.hvac.factor;
    totalDemand += demand;
    breakdown.push({
      category: 'hvac',
      connectedLoad: loads.hvac,
      appliedFactor: NEC_DWELLING_OPTIONAL.hvac.factor,
      demandLoad: demand,
      standardReference: NEC_DWELLING_OPTIONAL.hvac.clause,
      notes: NEC_DWELLING_OPTIONAL.hvac.notes,
    });
  }

  // Water heater
  if (loads.waterHeating && loads.waterHeating > 0) {
    const demand = loads.waterHeating * NEC_DWELLING_OPTIONAL.waterHeater.factor;
    totalDemand += demand;
    breakdown.push({
      category: 'waterHeating',
      connectedLoad: loads.waterHeating,
      appliedFactor: NEC_DWELLING_OPTIONAL.waterHeater.factor,
      demandLoad: demand,
      standardReference: NEC_DWELLING_OPTIONAL.waterHeater.clause,
      notes: NEC_DWELLING_OPTIONAL.waterHeater.notes,
    });
  }

  // Dryer
  if (loads.dryer && loads.dryer > 0) {
    const dryerLoad = Math.max(loads.dryer, NEC_DWELLING_OPTIONAL.dryer.minimum);
    const demand = dryerLoad * NEC_DWELLING_OPTIONAL.dryer.factor;
    totalDemand += demand;
    breakdown.push({
      category: 'dryer',
      connectedLoad: loads.dryer,
      appliedFactor: NEC_DWELLING_OPTIONAL.dryer.factor,
      demandLoad: demand,
      standardReference: NEC_DWELLING_OPTIONAL.dryer.clause,
      notes: `${NEC_DWELLING_OPTIONAL.dryer.notes} (${NEC_DWELLING_OPTIONAL.dryer.minimum} kW minimum)`,
    });
  }

  return { totalDemand, breakdown };
}

/**
 * Get NEC kitchen equipment factor based on quantity
 */
export function getNECKitchenEquipmentFactor(quantity: number): { factor: number; clause: string; notes: string } {
  const tier = NEC_KITCHEN_EQUIPMENT_FACTORS.byQuantity.find(
    t => quantity >= t.minUnits && quantity <= t.maxUnits
  );
  
  if (tier) {
    return {
      factor: tier.factor,
      clause: NEC_KITCHEN_EQUIPMENT_FACTORS.clause,
      notes: `${NEC_KITCHEN_EQUIPMENT_FACTORS.notes} (${quantity} units)`,
    };
  }
  
  // Default to 65% for large quantities
  return {
    factor: 0.65,
    clause: NEC_KITCHEN_EQUIPMENT_FACTORS.clause,
    notes: NEC_KITCHEN_EQUIPMENT_FACTORS.notes,
  };
}

/**
 * Calculate motor load demand per NEC 430.24
 */
export function calculateNECMotorDemand(motors: { power: number; isLargest: boolean }[]): {
  totalDemand: number;
  clause: string;
} {
  if (motors.length === 0) {
    return { totalDemand: 0, clause: 'NEC 430.24' };
  }

  let totalDemand = 0;
  
  for (const motor of motors) {
    if (motor.isLargest) {
      totalDemand += motor.power * NEC_MOTOR_DEMAND_FACTORS.multipleMotors.largestFactor;
    } else {
      totalDemand += motor.power * NEC_MOTOR_DEMAND_FACTORS.multipleMotors.othersFactor;
    }
  }

  return {
    totalDemand,
    clause: NEC_MOTOR_DEMAND_FACTORS.multipleMotors.clause,
  };
}
