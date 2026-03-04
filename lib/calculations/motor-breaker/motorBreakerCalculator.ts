/**
 * Motor & HVAC Breaker Sizing Calculator - Main Orchestrator
 *
 * 10-step calculation pipeline:
 * 1. Validate input
 * 2. Calculate FLA (or use direct input)
 * 3. Determine multiplier (based on load type + standard)
 * 4. Calculate minimum protection amps
 * 5. Apply derating factors (if environmental conditions provided)
 * 6. Select standard breaker rating
 * 7. Determine trip curve
 * 8. Build breaker specification
 * 9. Generate alerts
 * 10. Assemble results
 *
 * @module motorBreakerCalculator
 */

import * as math from 'mathjs';
import { recommendStandardBreaker } from '@/lib/standards/breakerRatings';
import { calculateLoadCurrent } from '@/lib/calculations/breaker/loadCurrent';
import { getMotorProtectionData } from './motorSizing';
import { calculateHVACSizing } from './hvacSizing';
import { getUtilizationCategory } from './iecUtilizationCategories';
import type {
  MotorBreakerInput,
  MotorBreakerEnvironment,
  MotorBreakerCalculationResults,
  MotorBreakerLoadAnalysis,
  MotorBreakerProtectionSizing,
  MotorBreakerRecommendation,
  MotorDetails,
  HVACDetails,
  IECCategoryDetails,
  CalculationAlert,
  DeratingFactorsResult,
  BreakerSpecification,
  TripCurveType,
  NECTripType,
} from '@/types/motor-breaker-calculator';

/** HP to kW conversion factor */
const HP_TO_KW = 0.7457;

/** √3 constant for three-phase calculations */
const SQRT3 = '1.7320508075688772935274463415059';

export interface MotorBreakerCalculationInput {
  input: MotorBreakerInput;
  environment?: MotorBreakerEnvironment;
}

/**
 * Main calculation entry point
 */
export async function calculateMotorBreakerSizing(
  calcInput: MotorBreakerCalculationInput
): Promise<MotorBreakerCalculationResults> {
  const { input, environment } = calcInput;
  const alerts: CalculationAlert[] = [];

  // Step 1: Validate
  validateInput(input);

  // Step 2: Calculate FLA
  const loadAnalysis = calculateFLA(input, alerts);

  // Step 3-4: Determine multiplier and minimum protection
  const protectionSizing = calculateProtectionSizing(input, loadAnalysis.calculatedFLA, alerts);

  // Step 5: Apply derating factors
  const deratingFactors = applyDeratingFactors(
    protectionSizing.minimumAmps,
    input.standard,
    environment
  );

  const adjustedMinimumAmps = deratingFactors?.applied
    ? deratingFactors.adjustedBreakerSizeAmps
    : protectionSizing.minimumAmps;

  // Step 6: Select standard breaker rating
  let recommendedBreakerAmps: number;

  if (input.loadType === 'hvac' && input.standard === 'NEC' && input.mop) {
    // HVAC: largest standard rating ≤ MOP
    const hvacResult = calculateHVACSizing(input.mca!, input.mop, input.standard);
    recommendedBreakerAmps = hvacResult.breakerAmps ?? adjustedMinimumAmps;
  } else {
    // General/Motor: next standard rating ≥ minimum
    const standardBreaker = recommendStandardBreaker(adjustedMinimumAmps, input.standard);
    if (standardBreaker === null) {
      alerts.push({
        type: 'error',
        code: 'EXCEEDS_MAX_RATING',
        message: `Calculated minimum (${adjustedMinimumAmps.toFixed(1)}A) exceeds maximum standard breaker rating. Consider parallel breakers.`,
        severity: 'critical',
      });
      recommendedBreakerAmps = adjustedMinimumAmps;
    } else {
      recommendedBreakerAmps = standardBreaker;
    }
  }

  // Step 7: Determine trip curve
  const { tripCurve, tripType } = determineTripCurve(input);

  // Step 8: Build breaker specification
  const breakerSpec = buildBreakerSpec(input, recommendedBreakerAmps, tripCurve, tripType);

  // Step 9: Generate additional alerts
  generateAlerts(input, loadAnalysis, protectionSizing, recommendedBreakerAmps, alerts);

  // Build conditional detail sections
  const motorDetails = buildMotorDetails(input);
  const hvacDetails = buildHVACDetails(input);
  const iecCategoryDetails = buildIECCategoryDetails(input);

  const recommendation: MotorBreakerRecommendation = {
    recommendedBreakerAmps,
    standard: input.standard,
    tripCurve,
    tripType,
    rationale: buildRationale(input, protectionSizing, recommendedBreakerAmps),
    breakerSpec,
  };

  // Step 10: Assemble results
  return {
    loadAnalysis,
    protectionSizing,
    recommendation,
    motorDetails,
    hvacDetails,
    iecCategoryDetails,
    deratingFactors: deratingFactors ?? undefined,
    alerts,
    calculatedAt: new Date().toISOString(),
    calculationVersion: '1.0.0',
  };
}

// ============================================================================
// STEP 2: Calculate FLA
// ============================================================================

function calculateFLA(
  input: MotorBreakerInput,
  alerts: CalculationAlert[]
): MotorBreakerLoadAnalysis {
  // HVAC path: FLA = MCA (wire sizing basis)
  if (input.loadType === 'hvac' && input.standard === 'NEC') {
    return {
      inputFLA: input.mca,
      calculatedFLA: input.mca!,
      formula: 'FLA = MCA (from nameplate)',
      components: {
        systemType: input.systemType,
      },
    };
  }

  // Direct FLA input
  if (input.inputMode === 'fla' && input.fla !== undefined) {
    return {
      inputFLA: input.fla,
      calculatedFLA: input.fla,
      formula: 'FLA = (user input)',
      components: {
        voltage: input.voltage,
        systemType: input.systemType,
      },
    };
  }

  // Calculate from power
  const powerKW = input.powerUnit === 'hp'
    ? input.powerValue! * HP_TO_KW
    : input.powerValue!;

  const powerHP = input.powerUnit === 'hp'
    ? input.powerValue!
    : undefined;

  let currentAmps: number;
  let formula: string;

  if (input.systemType === 'dc') {
    // DC: I = P / V (no PF, no √3)
    const powerWatts = math.bignumber(powerKW * 1000);
    const voltageBN = math.bignumber(input.voltage!);
    currentAmps = math.number(math.divide(powerWatts, voltageBN) as math.BigNumber);
    formula = 'I = P / V (DC)';
  } else if (input.systemType === 'single-phase-ac') {
    // Single-phase AC: I = P / (V × PF)
    const result = calculateLoadCurrent({
      power: powerKW,
      voltage: input.voltage!,
      phase: 'single',
      powerFactor: input.powerFactor,
      standard: input.standard,
    });
    currentAmps = result.currentAmps;
    formula = result.formula;
  } else {
    // Three-phase AC: I = P / (√3 × V × PF)
    const result = calculateLoadCurrent({
      power: powerKW,
      voltage: input.voltage!,
      phase: 'three',
      powerFactor: input.powerFactor,
      standard: input.standard,
    });
    currentAmps = result.currentAmps;
    formula = result.formula;
  }

  return {
    inputPowerKW: powerKW,
    inputPowerHP: powerHP,
    calculatedFLA: currentAmps,
    formula,
    components: {
      voltage: input.voltage,
      systemType: input.systemType,
      power: powerKW,
      powerUnit: input.powerUnit,
      powerFactor: input.systemType !== 'dc' ? input.powerFactor : undefined,
    },
  };
}

// ============================================================================
// STEPS 3-4: Protection Sizing
// ============================================================================

function calculateProtectionSizing(
  input: MotorBreakerInput,
  fla: number,
  alerts: CalculationAlert[]
): MotorBreakerProtectionSizing {
  // HVAC + NEC: Use MOP directly
  if (input.loadType === 'hvac' && input.standard === 'NEC') {
    return {
      fla,
      multiplier: 1.0,
      multiplierSource: 'NEC 440.22 (MOP from nameplate)',
      minimumAmps: input.mop!,
      codeReference: 'NEC 440.22(a)',
      notes: `Breaker must not exceed MOP (${input.mop}A) from equipment nameplate.`,
    };
  }

  // Motor + NEC: Use NEC 430.52 multiplier table
  if (input.loadType === 'motor' && input.standard === 'NEC') {
    const protectionData = getMotorProtectionData(input.protectionDevice!);
    const minimumAmps = fla * protectionData.multiplier;

    return {
      fla,
      multiplier: protectionData.multiplier,
      multiplierSource: `NEC Table 430.52 (${protectionData.displayName})`,
      minimumAmps,
      codeReference: protectionData.codeReference,
      notes: protectionData.notes,
    };
  }

  // Motor/HVAC + IEC: Use utilization category multiplier
  if ((input.loadType === 'motor' || input.loadType === 'hvac') && input.standard === 'IEC') {
    const catData = getUtilizationCategory(input.utilizationCategory!);
    const minimumAmps = fla * catData.multiplier;

    return {
      fla,
      multiplier: catData.multiplier,
      multiplierSource: `IEC 60947-4-1 Category ${catData.category} (${catData.description})`,
      minimumAmps,
      codeReference: 'IEC 60947-4-1',
      notes: catData.notes,
    };
  }

  // General load
  if (input.standard === 'NEC') {
    // NEC 210.20(A): 125% for continuous loads
    const minimumAmps = fla * 1.25;
    return {
      fla,
      multiplier: 1.25,
      multiplierSource: 'NEC 210.20(A) (125% continuous load)',
      minimumAmps,
      codeReference: 'NEC 210.20(A)',
      notes: 'Continuous load factor of 125% per NEC for general loads.',
    };
  } else {
    // IEC: Direct sizing (1.0×) + derating
    return {
      fla,
      multiplier: 1.0,
      multiplierSource: 'IEC 60364-5-52 (direct sizing with derating)',
      minimumAmps: fla,
      codeReference: 'IEC 60364-5-52',
      notes: 'IEC uses direct sizing with correction/derating factors applied separately.',
    };
  }
}

// ============================================================================
// STEP 5: Derating Factors
// ============================================================================

function applyDeratingFactors(
  minimumAmps: number,
  standard: 'NEC' | 'IEC',
  environment?: MotorBreakerEnvironment
): DeratingFactorsResult | null {
  if (!environment) return null;

  const hasFactors = environment.ambientTemperature !== undefined
    || environment.groupedCables !== undefined
    || (standard === 'IEC' && environment.installationMethod !== undefined);

  if (!hasFactors) return null;

  let combinedFactor = 1.0;
  const result: DeratingFactorsResult = {
    applied: true,
    combinedFactor: 1.0,
    adjustedBreakerSizeAmps: minimumAmps,
  };

  // Temperature derating
  if (environment.ambientTemperature !== undefined) {
    const tempFactor = calculateTemperatureDerating(environment.ambientTemperature, standard);
    result.temperatureFactor = {
      label: 'Ca (Temperature)',
      ambient: environment.ambientTemperature,
      factor: tempFactor,
      codeReference: standard === 'NEC' ? 'NEC Table 310.15(B)(2)(a)' : 'IEC 60364-5-52 Table B.52.14',
    };
    combinedFactor *= tempFactor;
  }

  // Grouping derating
  if (environment.groupedCables !== undefined && environment.groupedCables > 1) {
    const groupFactor = calculateGroupingDerating(environment.groupedCables, standard);
    result.groupingFactor = {
      label: 'Cg (Grouping)',
      cableCount: environment.groupedCables,
      factor: groupFactor,
      codeReference: standard === 'NEC' ? 'NEC Table 310.15(C)(1)' : 'IEC 60364-5-52 Table B.52.17',
    };
    combinedFactor *= groupFactor;
  }

  result.combinedFactor = combinedFactor;
  // Derating increases the required breaker size: minimumAmps / combinedFactor
  result.adjustedBreakerSizeAmps = combinedFactor > 0
    ? minimumAmps / combinedFactor
    : minimumAmps;

  return result;
}

function calculateTemperatureDerating(ambientTemp: number, standard: 'NEC' | 'IEC'): number {
  // Simplified temperature derating factors
  // Based on 30°C reference for NEC, 30°C for IEC
  if (ambientTemp <= 30) return 1.0;
  if (ambientTemp <= 35) return 0.94;
  if (ambientTemp <= 40) return 0.87;
  if (ambientTemp <= 45) return 0.82;
  if (ambientTemp <= 50) return 0.75;
  if (ambientTemp <= 55) return 0.67;
  if (ambientTemp <= 60) return 0.58;
  if (ambientTemp <= 65) return 0.47;
  if (ambientTemp <= 70) return 0.35;
  return 0.20;
}

function calculateGroupingDerating(cableCount: number, standard: 'NEC' | 'IEC'): number {
  if (cableCount <= 1) return 1.0;
  if (cableCount <= 3) return 0.80;
  if (cableCount <= 6) return 0.70;
  if (cableCount <= 9) return 0.50;
  return 0.45;
}

// ============================================================================
// STEP 7: Trip Curve
// ============================================================================

function determineTripCurve(
  input: MotorBreakerInput
): { tripCurve?: TripCurveType; tripType?: NECTripType } {
  if (input.standard === 'IEC') {
    // IEC: Use utilization category recommendation if motor/hvac
    if ((input.loadType === 'motor' || input.loadType === 'hvac') && input.utilizationCategory) {
      const catData = getUtilizationCategory(input.utilizationCategory);
      return { tripCurve: catData.recommendedTripCurve };
    }
    // General: Type C (most versatile)
    return { tripCurve: 'C' };
  }

  // NEC
  if (input.loadType === 'motor') {
    // Map NEC protection device to trip type
    switch (input.protectionDevice) {
      case 'magnetic-only':
      case 'instantaneous-trip':
        return { tripType: 'adjustable-magnetic' };
      default:
        return { tripType: 'thermal-magnetic' };
    }
  }

  return { tripType: 'thermal-magnetic' };
}

// ============================================================================
// STEP 8: Build Breaker Spec
// ============================================================================

function buildBreakerSpec(
  input: MotorBreakerInput,
  ratingAmps: number,
  tripCurve?: TripCurveType,
  tripType?: NECTripType
): BreakerSpecification {
  let codeSection: string;
  if (input.loadType === 'hvac' && input.standard === 'NEC') {
    codeSection = 'NEC 440.22';
  } else if (input.loadType === 'motor' && input.standard === 'NEC') {
    codeSection = 'NEC 430.52';
  } else if (input.standard === 'NEC') {
    codeSection = 'NEC 210.20(A)';
  } else {
    codeSection = 'IEC 60364-5-52';
  }

  return {
    ratingAmps,
    breakingCapacityKA: 10, // Default; would be configurable in production
    tripCurve,
    tripType,
    loadType: input.loadType === 'motor' ? 'inductive' : 'mixed',
    standard: input.standard,
    codeSection,
    isSafe: true,
    warnings: [],
  };
}

// ============================================================================
// STEP 9: Alerts
// ============================================================================

function generateAlerts(
  input: MotorBreakerInput,
  loadAnalysis: MotorBreakerLoadAnalysis,
  protectionSizing: MotorBreakerProtectionSizing,
  recommendedBreaker: number,
  alerts: CalculationAlert[]
): void {
  // High current warning
  if (loadAnalysis.calculatedFLA > 400) {
    alerts.push({
      type: 'warning',
      code: 'HIGH_CURRENT',
      message: `High load current (${loadAnalysis.calculatedFLA.toFixed(1)}A). Verify conductor sizing and breaker availability.`,
      severity: 'major',
    });
  }

  // Motor instantaneous trip warning
  if (input.protectionDevice === 'instantaneous-trip') {
    alerts.push({
      type: 'info',
      code: 'MCP_REQUIREMENT',
      message: 'Instantaneous-trip CB (MCP) must be used with a listed combination motor controller per NEC 430.52(C)(3).',
      codeReference: 'NEC 430.52(C)(3)',
      severity: 'minor',
    });
  }

  // HVAC: breaker matches MOP exactly
  if (input.loadType === 'hvac' && input.standard === 'NEC' && input.mop) {
    if (recommendedBreaker < input.mop) {
      alerts.push({
        type: 'info',
        code: 'HVAC_BREAKER_BELOW_MOP',
        message: `Selected breaker (${recommendedBreaker}A) is below MOP (${input.mop}A). This is the largest standard size not exceeding MOP.`,
        codeReference: 'NEC 440.22(a)',
        severity: 'minor',
      });
    }
  }

  // DC system info
  if (input.systemType === 'dc') {
    alerts.push({
      type: 'info',
      code: 'DC_SYSTEM',
      message: 'DC circuit breakers must be rated for DC voltage and current. Verify DC rating of selected breaker.',
      severity: 'minor',
    });
  }

  // Low power factor warning
  if (input.powerFactor !== undefined && input.powerFactor < 0.7 && input.systemType !== 'dc') {
    alerts.push({
      type: 'warning',
      code: 'LOW_POWER_FACTOR',
      message: `Low power factor (${input.powerFactor}). Consider power factor correction to reduce current draw.`,
      severity: 'major',
    });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function validateInput(input: MotorBreakerInput): void {
  if (input.loadType === 'hvac' && input.standard === 'NEC') {
    if (!input.mca || input.mca <= 0) throw new Error('MCA must be positive for HVAC loads');
    if (!input.mop || input.mop <= 0) throw new Error('MOP must be positive for HVAC loads');
    if (input.mop < input.mca) {
      // This is actually valid per some equipment, but warn
    }
    return;
  }

  if (input.inputMode === 'fla') {
    if (!input.fla || input.fla <= 0) throw new Error('FLA must be positive');
  } else {
    if (!input.powerValue || input.powerValue <= 0) throw new Error('Power value must be positive');
  }

  if (!input.voltage || input.voltage <= 0) throw new Error('Voltage must be positive');

  if (input.systemType !== 'dc' && input.inputMode !== 'fla') {
    if (!input.powerFactor || input.powerFactor < 0.5 || input.powerFactor > 1.0) {
      throw new Error('Power factor must be between 0.5 and 1.0');
    }
  }

  if (input.loadType === 'motor' && input.standard === 'NEC' && !input.protectionDevice) {
    throw new Error('Protection device type is required for NEC motor sizing');
  }

  if ((input.loadType === 'motor' || input.loadType === 'hvac') && input.standard === 'IEC' && !input.utilizationCategory) {
    throw new Error('Utilization category is required for IEC motor/HVAC sizing');
  }
}

function buildMotorDetails(input: MotorBreakerInput): MotorDetails | undefined {
  if (input.loadType !== 'motor') return undefined;

  if (input.standard === 'NEC') {
    const protData = getMotorProtectionData(input.protectionDevice!);
    return {
      protectionDevice: input.protectionDevice,
      protectionDeviceName: protData.displayName,
      multiplier: protData.multiplier,
      codeReference: protData.codeReference,
    };
  }

  // IEC motor
  const catData = getUtilizationCategory(input.utilizationCategory!);
  return {
    multiplier: catData.multiplier,
    codeReference: 'IEC 60947-4-1',
  };
}

function buildHVACDetails(input: MotorBreakerInput): HVACDetails | undefined {
  if (input.loadType !== 'hvac' || input.standard !== 'NEC') return undefined;

  return {
    mca: input.mca!,
    mop: input.mop!,
    wireSizingBasis: `MCA = ${input.mca}A`,
    breakerSizingBasis: `Largest standard rating ≤ MOP (${input.mop}A)`,
    codeReference: 'NEC 440.22(a)',
  };
}

function buildIECCategoryDetails(input: MotorBreakerInput): IECCategoryDetails | undefined {
  if (input.standard !== 'IEC' || !input.utilizationCategory) return undefined;
  if (input.loadType !== 'motor' && input.loadType !== 'hvac') return undefined;

  const catData = getUtilizationCategory(input.utilizationCategory);
  return {
    category: catData.category,
    description: catData.description,
    multiplier: catData.multiplier,
    recommendedTripCurve: catData.recommendedTripCurve,
    applications: catData.applications,
  };
}

function buildRationale(
  input: MotorBreakerInput,
  protectionSizing: MotorBreakerProtectionSizing,
  recommendedBreaker: number
): string {
  if (input.loadType === 'hvac' && input.standard === 'NEC') {
    return `HVAC equipment per NEC 440: Wire sized for MCA (${input.mca}A), ` +
           `breaker selected as largest standard rating (${recommendedBreaker}A) ≤ MOP (${input.mop}A).`;
  }

  const multiplierStr = protectionSizing.multiplier !== 1.0
    ? ` × ${(protectionSizing.multiplier * 100).toFixed(0)}% = ${protectionSizing.minimumAmps.toFixed(1)}A`
    : '';

  return `FLA ${protectionSizing.fla.toFixed(1)}A${multiplierStr}. ` +
         `Selected ${recommendedBreaker}A breaker per ${protectionSizing.codeReference}.`;
}
