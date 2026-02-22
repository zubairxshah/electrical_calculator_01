/**
 * IEC 60364 Diversity Factors for Maximum Demand Calculations
 * 
 * References:
 * - IEC 60364-5-52: Current-carrying capacities
 * - IEC 60364-4-43: Overload protection
 * - IEC 60364-1: Fundamental principles
 */

/**
 * Residential diversity factors per IEC 60364-5-52
 */
export const IEC_RESIDENTIAL_FACTORS = {
  lighting: {
    factor: 1.0,
    clause: 'IEC 60364-5-52',
    notes: 'No diversity applied for lighting circuits',
  },
  socketOutlets: {
    factor: 0.4,
    clause: 'IEC 60364-5-52',
    notes: '60% diversity applied - not all outlets used simultaneously',
  },
  hvac: {
    factor: 0.8,
    clause: 'IEC 60364-5-52',
    notes: '20% diversity for heating/cooling systems',
  },
  cookingAppliances: {
    factor: 0.7,
    clause: 'IEC 60364-5-52',
    notes: '30% diversity for cooking appliances',
  },
  waterHeating: {
    factor: 1.0,
    clause: 'IEC 60364-5-52',
    notes: 'Continuous load - no diversity applied',
  },
  otherAppliances: {
    factor: 0.6,
    clause: 'IEC 60364-5-52',
    notes: '40% diversity for other appliances (washers, dryers, etc.)',
  },
} as const;

/**
 * Commercial diversity factors per IEC guidelines
 */
export const IEC_COMMERCIAL_FACTORS = {
  office: {
    overall: {
      factor: 0.75,
      clause: 'IEC 60364-5-52',
      notes: 'Typical office building overall diversity',
    },
    lighting: {
      factor: 0.9,
      clause: 'IEC 60364-5-52',
      notes: '10% diversity for office lighting',
    },
    receptacles: {
      factor: 0.7,
      clause: 'IEC 60364-5-52',
      notes: '30% diversity for office receptacles',
    },
    hvac: {
      factor: 0.85,
      clause: 'IEC 60364-5-52',
      notes: '15% diversity for HVAC systems',
    },
  },
  retail: {
    overall: {
      factor: 0.85,
      clause: 'IEC 60364-5-52',
      notes: 'Typical retail space overall diversity',
    },
    lighting: {
      factor: 0.95,
      clause: 'IEC 60364-5-52',
      notes: '5% diversity for retail lighting',
    },
    receptacles: {
      factor: 0.8,
      clause: 'IEC 60364-5-52',
      notes: '20% diversity for retail receptacles',
    },
  },
} as const;

/**
 * Get IEC diversity factor for a specific category
 */
export function getIECResidentialFactor(category: string): { factor: number; clause: string; notes: string } {
  const categoryKey = category as keyof typeof IEC_RESIDENTIAL_FACTORS;
  return IEC_RESIDENTIAL_FACTORS[categoryKey] || {
    factor: 0.6,
    clause: 'IEC 60364-5-52',
    notes: 'Default diversity factor',
  };
}

/**
 * Get IEC commercial factor for a specific category
 */
export function getIECCommercialFactor(
  buildingType: 'office' | 'retail',
  category: string
): { factor: number; clause: string; notes: string } {
  const buildingFactors = IEC_COMMERCIAL_FACTORS[buildingType];
  const categoryKey = category as keyof typeof buildingFactors;
  return buildingFactors[categoryKey] || {
    factor: 0.8,
    clause: 'IEC 60364-5-52',
    notes: 'Default commercial diversity factor',
  };
}

/**
 * Calculate overall IEC diversity factor for residential
 */
export function calculateIECOverallDiversity(loads: {
  lighting?: number;
  socketOutlets?: number;
  hvac?: number;
  cookingAppliances?: number;
  waterHeating?: number;
  otherAppliances?: number;
}): { overallFactor: number; totalConnected: number; totalDemand: number } {
  let totalConnected = 0;
  let totalDemand = 0;

  if (loads.lighting && loads.lighting > 0) {
    totalConnected += loads.lighting;
    totalDemand += loads.lighting * IEC_RESIDENTIAL_FACTORS.lighting.factor;
  }
  if (loads.socketOutlets && loads.socketOutlets > 0) {
    totalConnected += loads.socketOutlets;
    totalDemand += loads.socketOutlets * IEC_RESIDENTIAL_FACTORS.socketOutlets.factor;
  }
  if (loads.hvac && loads.hvac > 0) {
    totalConnected += loads.hvac;
    totalDemand += loads.hvac * IEC_RESIDENTIAL_FACTORS.hvac.factor;
  }
  if (loads.cookingAppliances && loads.cookingAppliances > 0) {
    totalConnected += loads.cookingAppliances;
    totalDemand += loads.cookingAppliances * IEC_RESIDENTIAL_FACTORS.cookingAppliances.factor;
  }
  if (loads.waterHeating && loads.waterHeating > 0) {
    totalConnected += loads.waterHeating;
    totalDemand += loads.waterHeating * IEC_RESIDENTIAL_FACTORS.waterHeating.factor;
  }
  if (loads.otherAppliances && loads.otherAppliances > 0) {
    totalConnected += loads.otherAppliances;
    totalDemand += loads.otherAppliances * IEC_RESIDENTIAL_FACTORS.otherAppliances.factor;
  }

  const overallFactor = totalConnected > 0 ? 1 - (totalDemand / totalConnected) : 0;

  return {
    overallFactor,
    totalConnected,
    totalDemand,
  };
}
