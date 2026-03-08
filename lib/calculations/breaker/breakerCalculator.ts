/**
 * Breaker Calculator Main Orchestrator
 *
 * Integrates all calculation modules to perform complete breaker sizing analysis.
 * Handles validation, calculation flow, error handling, and logging.
 *
 * @module breakerCalculator
 */

import { calculateLoadCurrent } from './loadCurrent';
import { applySafetyFactor } from './safetyFactors';
import { recommendStandardBreaker } from '@/lib/standards/breakerRatings';
import { recommendTripCurve } from '@/lib/standards/tripCurves';
import { calculateVoltageDrop, assessVoltageDropCompliance, recommendCableSizeForVD } from './voltageDrop';
import { calculateEnhancedVoltageDrop, assessEnhancedVoltageDropCompliance, recommendEnhancedCableSizeForVD } from './enhancedVoltageDrop';
import { calculateCombinedDerating, type IECInstallationMethod, type EnclosureTypeKey } from '@/lib/standards/deratingTables';
import { validateCalculationInput, validateWithWarnings } from '@/lib/validation/breakerValidation';
import { logger } from '@/lib/utils/logger';
import type {
  CircuitConfiguration,
  EnvironmentalConditions,
  CalculationResults,
  LoadAnalysis,
  BreakerSizingResult,
  Recommendations,
  CalculationAlert,
  BreakerSpecification,
  LoadType,
  VoltageDropAnalysis,
  DeratingFactorsResult,
  InstallationMethod,
  EnclosureType,
} from '@/types/breaker-calculator';

/**
 * Complete Calculation Input
 */
export interface BreakerCalculationInput {
  circuit: CircuitConfiguration;
  environment?: EnvironmentalConditions;
  shortCircuitCurrentKA?: number;
  loadType?: LoadType;
}

/**
 * Calculate complete breaker sizing recommendation
 *
 * Main entry point for breaker sizing calculations. Orchestrates:
 * 1. Input validation
 * 2. Load current calculation
 * 3. Safety factor application
 * 4. Standard breaker recommendation
 * 5. Trip curve recommendation
 * 6. Warnings and alerts generation
 *
 * @param input - Complete calculation input with circuit config and optional factors
 * @returns Complete calculation results with recommendations
 *
 * @example
 * ```typescript
 * const input = {
 *   circuit: {
 *     standard: 'NEC',
 *     voltage: 240,
 *     phase: 'single',
 *     loadMode: 'kw',
 *     loadValue: 10,
 *     powerFactor: 0.9,
 *     unitSystem: 'imperial'
 *   }
 * };
 *
 * const results = await calculateBreakerSizing(input);
 * // Returns: Complete CalculationResults with 60A breaker recommendation
 * ```
 */
export async function calculateBreakerSizing(
  input: BreakerCalculationInput
): Promise<CalculationResults> {
  const startTime = performance.now();

  // ============================================================================
  // STEP 1: VALIDATION
  // ============================================================================

  logger.info('BreakerCalculator', 'Starting calculation', {
    standard: input.circuit.standard,
    voltage: input.circuit.voltage,
    phase: input.circuit.phase,
    loadMode: input.circuit.loadMode,
    loadValue: input.circuit.loadValue,
  });

  const validationResult = validateWithWarnings(input);

  if (!validationResult.isValid) {
    logger.error('BreakerCalculator', 'Validation failed', {
      errors: validationResult.errors,
    });
    throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
  }

  const alerts: CalculationAlert[] = [];

  // Add warnings as info-level alerts
  validationResult.warnings.forEach((warning) => {
    alerts.push({
      type: 'info',
      code: 'INPUT_WARNING',
      message: warning,
      severity: 'minor',
    });
  });

  // ============================================================================
  // STEP 2: LOAD CURRENT CALCULATION
  // ============================================================================

  logger.debug('BreakerCalculator', 'Calculating load current');

  const loadCurrentResult = calculateLoadCurrent({
    power: input.circuit.loadMode === 'kw' ? input.circuit.loadValue : undefined,
    current: input.circuit.loadMode === 'amps' ? input.circuit.loadValue : undefined,
    voltage: input.circuit.voltage,
    phase: input.circuit.phase,
    powerFactor: input.circuit.loadMode === 'kw' ? input.circuit.powerFactor : undefined,
    standard: input.circuit.standard,
  });

  const loadDuty = input.circuit.loadDuty ?? 'continuous';
  const continuousLoadFactor =
    input.circuit.standard === 'NEC' && loadDuty === 'continuous' ? 1.25 : 1.0;

  const loadAnalysis: LoadAnalysis = {
    inputPower: input.circuit.loadMode === 'kw' ? input.circuit.loadValue : undefined,
    inputCurrent: input.circuit.loadMode === 'amps' ? input.circuit.loadValue : undefined,
    calculatedCurrentAmps: loadCurrentResult.currentAmps,
    formula: loadCurrentResult.formula,
    components: loadCurrentResult.components,
    continuousLoadFactor,
  };

  logger.debug('BreakerCalculator', 'Load current calculated', {
    currentAmps: loadCurrentResult.currentAmps,
    formula: loadCurrentResult.formula,
  });

  // ============================================================================
  // STEP 3: SAFETY FACTOR APPLICATION
  // ============================================================================

  logger.debug('BreakerCalculator', 'Applying safety factor');

  // Apply growth factor to load current
  const growthFactor = input.circuit.growthFactor ?? 1.0;
  const effectiveLoadCurrent = loadCurrentResult.currentAmps * growthFactor;

  if (growthFactor > 1.0) {
    alerts.push({
      type: 'info',
      code: 'GROWTH_FACTOR_APPLIED',
      message: `Future load growth factor of ${(growthFactor * 100).toFixed(0)}% applied. Effective load: ${effectiveLoadCurrent.toFixed(1)}A (base: ${loadCurrentResult.currentAmps.toFixed(1)}A).`,
      severity: 'minor',
    });
  }

  const loadDutyMapped = (input.circuit.loadDuty ?? 'continuous') === 'non-continuous' ? 'intermittent' : 'continuous';

  const safetyFactorResult = applySafetyFactor({
    loadCurrent: effectiveLoadCurrent,
    standard: input.circuit.standard,
    loadType: loadDutyMapped,
  });

  logger.debug('BreakerCalculator', 'Safety factor applied', {
    safetyFactor: safetyFactorResult.safetyFactor,
    minimumBreakerSize: safetyFactorResult.minimumBreakerSize,
    codeReference: safetyFactorResult.codeReference,
  });

  // ============================================================================
  // STEP 3.5: DERATING FACTORS (Optional)
  // ============================================================================

  let deratingFactorsResult: DeratingFactorsResult | undefined;

  const hasDerating = input.environment?.ambientTemperature || input.environment?.groupedCables
    || input.environment?.altitude || input.environment?.harmonicDistortion
    || input.environment?.enclosureType;

  if (hasDerating) {
    logger.debug('BreakerCalculator', 'Applying derating factors');

    try {
      const ambientTemp = input.environment!.ambientTemperature ?? 30;
      const numConductors = input.environment!.groupedCables ?? 1;
      const installationMethod = input.environment!.installationMethod as IECInstallationMethod | undefined;
      const insulationRating = input.environment!.insulationRating ?? 90;
      const enclosureType = input.environment!.enclosureType as EnclosureTypeKey | undefined;

      const derating = calculateCombinedDerating({
        ambientTemp,
        insulationRating,
        numberOfConductors: numConductors,
        installationMethod,
        standard: input.circuit.standard,
        altitude: input.environment!.altitude,
        harmonicTHD: input.environment!.harmonicDistortion,
        enclosureType,
      });

      const adjustedBreakerSize = safetyFactorResult.minimumBreakerSize / derating.totalFactor;

      deratingFactorsResult = {
        applied: true,
        temperatureFactor: {
          label: 'Ca (Temperature)',
          ambient: ambientTemp,
          factor: derating.temperatureFactor,
          codeReference: derating.standardReference.split(',')[0].trim() || 'NEC Table 310.15(B)(2)(a)',
        },
        groupingFactor: {
          label: 'Cg (Grouping)',
          cableCount: numConductors,
          factor: derating.groupingFactor,
          codeReference: derating.standardReference.split(',')[1]?.trim() || derating.standardReference,
        },
        installationMethodFactor: installationMethod
          ? {
              label: 'Cc (Installation Method)',
              method: installationMethod as InstallationMethod,
              factor: 1.0,
              codeReference: 'IEC 60364-5-52 Table B.52.5',
            }
          : undefined,
        altitudeFactor: derating.altitudeFactor < 1.0
          ? {
              label: 'Ca (Altitude)',
              altitude: input.environment!.altitude,
              factor: derating.altitudeFactor,
              codeReference: input.circuit.standard === 'NEC' ? 'NEC 110.40' : 'IEC 60947-1 Annex B',
            }
          : undefined,
        harmonicFactor: derating.harmonicFactor < 1.0
          ? {
              label: 'Ch (Harmonics)',
              thdPercent: input.environment!.harmonicDistortion,
              factor: derating.harmonicFactor,
              codeReference: 'IEEE 519, NEC 210.4(D)',
            }
          : undefined,
        enclosureFactor: derating.enclosureTempRise > 0
          ? {
              label: 'Ce (Enclosure)',
              enclosureType: input.environment!.enclosureType as EnclosureType,
              tempRise: derating.enclosureTempRise,
              factor: derating.temperatureFactor, // Already factored into temp
              codeReference: 'NEMA / IEC 61439',
            }
          : undefined,
        combinedFactor: derating.totalFactor,
        adjustedBreakerSizeAmps: adjustedBreakerSize,
      };

      if (derating.totalFactor < 0.7) {
        alerts.push({
          type: 'warning',
          code: 'SIGNIFICANT_DERATING',
          message: `Combined derating factors (${(derating.totalFactor * 100).toFixed(0)}%) require ${adjustedBreakerSize.toFixed(1)}A breaker. Verify cable ampacity allows this size.`,
          severity: 'major',
          codeReference: derating.standardReference,
        });
      }

      // Altitude warning
      if (derating.altitudeFactor < 1.0) {
        alerts.push({
          type: 'info',
          code: 'ALTITUDE_DERATING',
          message: `Altitude ${input.environment!.altitude}m: breaker and cable derated to ${(derating.altitudeFactor * 100).toFixed(0)}%. Verify equipment altitude rating.`,
          severity: 'minor',
          codeReference: input.circuit.standard === 'NEC' ? 'NEC 110.40' : 'IEC 60947-1',
        });
      }

      // Enclosure warning
      if (derating.enclosureTempRise > 0) {
        alerts.push({
          type: 'info',
          code: 'ENCLOSURE_TEMP_RISE',
          message: `Enclosed panel (${input.environment!.enclosureType}): +${derating.enclosureTempRise}°C internal rise. Effective ambient: ${ambientTemp + derating.enclosureTempRise}°C.`,
          severity: 'minor',
        });
      }

      // Harmonic / neutral sizing warning
      if (derating.neutralSizingFactor > 1.0) {
        alerts.push({
          type: 'warning',
          code: 'NEUTRAL_OVERSIZING_REQUIRED',
          message: `THD of ${input.environment!.harmonicDistortion}%: neutral conductor must be sized at ${(derating.neutralSizingFactor * 100).toFixed(0)}% of phase conductor. Triplen harmonics add in neutral.`,
          severity: 'major',
          codeReference: 'NEC 210.4(D), IEEE 519',
        });
      }

      logger.debug('BreakerCalculator', 'Derating factors applied', {
        tempFactor: derating.temperatureFactor,
        groupingFactor: derating.groupingFactor,
        altitudeFactor: derating.altitudeFactor,
        harmonicFactor: derating.harmonicFactor,
        combinedFactor: derating.totalFactor,
        adjustedBreakerSize,
      });
    } catch (deratingError) {
      logger.warn('BreakerCalculator', 'Derating calculation failed', {
        error: deratingError instanceof Error ? deratingError.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // STEP 4: STANDARD BREAKER RECOMMENDATION
  // ============================================================================

  logger.debug('BreakerCalculator', 'Finding standard breaker rating');

  // Use derated breaker size if derating was applied
  const baseBreakerSize = deratingFactorsResult
    ? deratingFactorsResult.adjustedBreakerSizeAmps
    : safetyFactorResult.minimumBreakerSize;

  const recommendedBreaker = recommendStandardBreaker(
    baseBreakerSize,
    input.circuit.standard
  );

  if (recommendedBreaker === null) {
    // Exceeds maximum standard rating
    alerts.push({
      type: 'error',
      code: 'BREAKER_SIZE_EXCEEDED',
      message: `Calculated minimum breaker size (${safetyFactorResult.minimumBreakerSize.toFixed(1)}A) exceeds maximum standard rating (4000A). Consider parallel breakers or higher voltage.`,
      severity: 'critical',
      codeReference: input.circuit.standard === 'NEC' ? 'NEC 240.6(A)' : 'IEC 60898-1',
    });

    throw new Error('Calculated breaker size exceeds maximum standard rating');
  }

  logger.info('BreakerCalculator', 'Recommended breaker', {
    recommendedBreaker,
    standard: input.circuit.standard,
  });

  // ============================================================================
  // STEP 5: TRIP CURVE RECOMMENDATION
  // ============================================================================

  const loadTypeForTrip = input.loadType || 'mixed'; // Default to mixed if not specified

  const tripCurveRecommendation = recommendTripCurve(
    loadTypeForTrip,
    input.circuit.standard
  );

  logger.debug('BreakerCalculator', 'Trip curve recommendation', {
    loadType: loadTypeForTrip,
    recommendation: tripCurveRecommendation.recommendation,
  });

  // ============================================================================
  // STEP 6: BUILD BREAKER SPECIFICATION
  // ============================================================================

  const primaryBreaker: BreakerSpecification = {
    ratingAmps: recommendedBreaker,
    breakingCapacityKA: input.shortCircuitCurrentKA || 10, // Default 10 kA if not specified
    tripCurve: input.circuit.standard === 'IEC' ? (tripCurveRecommendation.recommendation as any) : undefined,
    tripType: input.circuit.standard === 'NEC' ? (tripCurveRecommendation.recommendation as any) : undefined,
    loadType: loadTypeForTrip,
    standard: input.circuit.standard,
    codeSection: safetyFactorResult.codeReference,
    isSafe: true,
    warnings: [],
  };

  // Check if short circuit current specified and verify breaking capacity
  if (input.shortCircuitCurrentKA) {
    if (input.shortCircuitCurrentKA > primaryBreaker.breakingCapacityKA) {
      alerts.push({
        type: 'warning',
        code: 'SHORT_CIRCUIT_CAPACITY_LOW',
        message: `Fault current (${input.shortCircuitCurrentKA}kA) exceeds breaker breaking capacity (${primaryBreaker.breakingCapacityKA}kA). Specify higher breaking capacity breaker.`,
        severity: 'major',
        codeReference: input.circuit.standard === 'NEC' ? 'NEC 110.9' : 'IEC 60898-1',
      });

      primaryBreaker.isSafe = false;
      primaryBreaker.warnings.push({
        level: 'error',
        code: 'INSUFFICIENT_BREAKING_CAPACITY',
        message: `Breaking capacity insufficient for fault current`,
        recommendation: `Use breaker with ≥${input.shortCircuitCurrentKA}kA breaking capacity`,
      });
    }
  } else {
    // Warn that breaking capacity not verified
    alerts.push({
      type: 'info',
      code: 'BREAKING_CAPACITY_NOT_VERIFIED',
      message: 'Breaking capacity not verified. Consult site-specific fault current calculations.',
      severity: 'minor',
    });
  }

  // ============================================================================
  // STEP 7: BUILD BREAKER SIZING RESULT
  // ============================================================================

  const breakerSizing: BreakerSizingResult = {
    minimumBreakerSizeAmps: safetyFactorResult.minimumBreakerSize,
    safetyFactor: safetyFactorResult.safetyFactor,
    safetyFactorType: safetyFactorResult.factorType,
    recommendedBreakerAmps: recommendedBreaker,
    recommendedStandard: input.circuit.standard,
    candidateBreakers: [primaryBreaker],
  };

  // ============================================================================
  // STEP 8: BUILD RECOMMENDATIONS
  // ============================================================================

  const recommendations: Recommendations = {
    primaryBreaker,
    breakerTypeGuidance: {
      recommendedType: tripCurveRecommendation.displayName,
      rationale: tripCurveRecommendation.rationale,
      inrushCapability: tripCurveRecommendation.inrushCapability,
    },
    generalNotes: [
      `Calculation per ${input.circuit.standard} ${new Date().getFullYear()} edition`,
      tripCurveRecommendation.notes,
    ],
  };

  // Add note about continuous load factor
  if (input.circuit.standard === 'NEC') {
    recommendations.generalNotes.push(
      'NEC 125% continuous load factor applied per Article 210.20(A)'
    );
  }

  // ============================================================================
  // STEP 9: ENHANCED VOLTAGE DROP ANALYSIS (Optional)
  // ============================================================================

  let voltageDropAnalysis: VoltageDropAnalysis | undefined;

  if (input.environment?.circuitDistance && input.environment?.conductorMaterial) {
    logger.debug('BreakerCalculator', 'Calculating enhanced voltage drop');

    try {
      const vdInput = {
        current: loadCurrentResult.currentAmps,
        voltage: input.circuit.voltage,
        distance: input.environment.circuitDistance,
        conductorSize: {
          sizeAWG: input.environment.conductorSize?.unit === 'AWG' ? String(input.environment.conductorSize.value) : null,
          sizeMm2: input.environment.conductorSize?.unit === 'mm²' ? input.environment.conductorSize.value : null,
        },
        material: input.environment.conductorMaterial,
        phase: input.circuit.phase,
        powerFactor: input.circuit.powerFactor,
        temperature: input.environment.ambientTemperature || 75, // Default to 75°C
      };

      // Use enhanced voltage drop calculation
      const vdResult = calculateEnhancedVoltageDrop(vdInput);
      const compliance = assessEnhancedVoltageDropCompliance(vdResult.voltageDropPercent, vdInput.current, vdInput.voltage);

      let cableRecommendation = null;
      let recommendedVDPercent: number | undefined;
      let costImpact: 'low' | 'medium' | 'high' | undefined = undefined;
      let installationDifficulty: 'easy' | 'moderate' | 'difficult' | undefined = undefined;

      if (vdResult.voltageDropPercent > 3.0) {
        cableRecommendation = recommendEnhancedCableSizeForVD({
          ...vdInput,
          currentSize: vdInput.conductorSize,
          vdLimit: 3.0,
        });

        recommendedVDPercent = cableRecommendation.predictedVoltageDropPercent ?? undefined;
        costImpact = cableRecommendation.costImpact;
        installationDifficulty = cableRecommendation.installationDifficulty;
      }

      // Format conductor size string
      const conductorSizeStr = vdInput.conductorSize.sizeAWG
        ? `#${vdInput.conductorSize.sizeAWG} AWG`
        : vdInput.conductorSize.sizeMm2
          ? `${vdInput.conductorSize.sizeMm2}mm²`
          : undefined;

      voltageDropAnalysis = {
        performed: true,
        loadCurrentAmps: vdResult.components.current,
        circuitDistance: vdResult.components.distance,
        conductorSize: conductorSizeStr,
        conductorResistance: vdResult.tempAdjustedResistance, // Use temperature-adjusted resistance
        voltageDrop: vdResult.voltageDropVolts,
        voltageDropPercent: vdResult.voltageDropPercent,
        voltageAtLoad: vdResult.voltageAtLoad,
        powerLossWatts: vdResult.powerLossWatts,
        limitBranchCircuit: 3.0,
        limitCombined: 5.0,
        status: compliance.status,
        assessment: compliance.message,
        recommendedCableSize: cableRecommendation?.recommendedSize
          ? cableRecommendation.recommendedSize.sizeAWG
            ? `#${cableRecommendation.recommendedSize.sizeAWG} AWG`
            : `${cableRecommendation.recommendedSize.sizeMetric}mm²`
          : undefined,
        recommendedVDPercent,
        costImpact,
        installationDifficulty,
        recommendedAction: compliance.recommendedAction,
      };

      // Add alerts based on enhanced VD status
      if (compliance.status === 'warning' || compliance.status === 'exceed-limit') {
        alerts.push({
          type: compliance.level,
          code: 'VOLTAGE_DROP_ISSUE',
          message: compliance.message,
          severity: compliance.level === 'error' ? 'critical' : 'major',
          codeReference: compliance.codeReference,
        });
      }

      logger.debug('BreakerCalculator', 'Enhanced voltage drop calculated', {
        vdPercent: vdResult.voltageDropPercent,
        status: compliance.status,
        compliancePercentage: compliance.compliancePercentage,
      });
    } catch (vdError) {
      logger.warn('BreakerCalculator', 'Enhanced voltage drop calculation failed', {
        error: vdError instanceof Error ? vdError.message : 'Unknown error',
      });
    }
  }

  // ============================================================================
  // STEP 9.5: ADDITIONAL SAFETY CHECKS & RECOMMENDATIONS
  // ============================================================================

  // GFCI / RCD Recommendation based on circuit application
  if (input.environment?.circuitApplication) {
    const app = input.environment.circuitApplication;
    const gfciRequired = ['kitchen', 'bathroom', 'outdoor', 'garage', 'basement', 'pool-spa'];
    if (gfciRequired.includes(app)) {
      const sensitivity = app === 'pool-spa' ? '5mA' : '30mA';
      alerts.push({
        type: 'warning',
        code: 'GFCI_RCD_REQUIRED',
        message: `${app.charAt(0).toUpperCase() + app.slice(1)} circuit: GFCI/RCD protection required (${sensitivity} sensitivity). ${input.circuit.standard === 'NEC' ? 'Per NEC 210.8.' : 'Per IEC 60364-4-41.'}`,
        severity: 'major',
        codeReference: input.circuit.standard === 'NEC' ? 'NEC 210.8' : 'IEC 60364-4-41',
      });
    }
    if (app === 'data-center') {
      alerts.push({
        type: 'warning',
        code: 'DATA_CENTER_HARMONICS',
        message: 'Data center circuit: high harmonic content expected from IT loads. Ensure neutral is oversized and consider detuned filters.',
        severity: 'major',
        codeReference: 'NEC 210.4(D)',
      });
    }
  }

  // Cable coordination check — breaker should not exceed cable ampacity
  // (informational since we don't know exact cable ampacity without full cable calc)
  if (recommendedBreaker > 200) {
    alerts.push({
      type: 'info',
      code: 'CABLE_COORDINATION_CHECK',
      message: `Breaker rated ${recommendedBreaker}A — verify cable ampacity ≥ ${recommendedBreaker}A after all derating factors. Cable must be protected by the breaker (${input.circuit.standard === 'NEC' ? 'NEC 240.4' : 'IEC 60364-4-43'}).`,
      severity: 'minor',
      codeReference: input.circuit.standard === 'NEC' ? 'NEC 240.4' : 'IEC 60364-4-43',
    });
  }

  // Motor inrush / inductive load warning
  if (input.loadType === 'inductive') {
    alerts.push({
      type: 'info',
      code: 'MOTOR_INRUSH_WARNING',
      message: 'Inductive load detected. Motor starting current (typically 6-8× FLA) may cause nuisance tripping. For dedicated motor circuits, use the Motor & HVAC Breaker calculator for NEC 430 compliance.',
      severity: 'minor',
      codeReference: input.circuit.standard === 'NEC' ? 'NEC 430.52' : 'IEC 60947-4-1',
    });
  }

  // Arc flash awareness for higher voltage/current
  if (input.circuit.voltage >= 208 && recommendedBreaker >= 100) {
    alerts.push({
      type: 'info',
      code: 'ARC_FLASH_AWARENESS',
      message: `System ≥208V at ${recommendedBreaker}A: arc flash hazard may exist. Perform incident energy analysis per NFPA 70E and label equipment with PPE requirements.`,
      severity: 'minor',
      codeReference: 'NFPA 70E',
    });
  }

  // Parallel conductor guidance for very high current
  if (recommendedBreaker > 500) {
    alerts.push({
      type: 'info',
      code: 'PARALLEL_CONDUCTOR_GUIDANCE',
      message: `High current (${recommendedBreaker}A): consider parallel conductors per phase. Each set must be same length, material, and size (${input.circuit.standard === 'NEC' ? 'NEC 310.10(G)' : 'IEC 60364-5-52'}).`,
      severity: 'minor',
      codeReference: input.circuit.standard === 'NEC' ? 'NEC 310.10(G)' : 'IEC 60364-5-52',
    });
  }

  // Selectivity/discrimination note
  alerts.push({
    type: 'info',
    code: 'SELECTIVITY_NOTE',
    message: `Verify selectivity with upstream breaker. The upstream device should have a higher rating and slower trip curve to ensure only the faulted circuit trips.`,
    severity: 'minor',
    codeReference: input.circuit.standard === 'NEC' ? 'NEC 240.12' : 'IEC 60364-4-43',
  });

  // ============================================================================
  // STEP 10: BUILD FINAL RESULTS
  // ============================================================================

  const endTime = performance.now();
  const calculationTime = endTime - startTime;

  logger.info('BreakerCalculator', 'Calculation complete', {
    calculationTime: `${calculationTime.toFixed(2)}ms`,
    recommendedBreaker: `${recommendedBreaker}A`,
    alerts: alerts.length,
  });

  const results: CalculationResults = {
    loadAnalysis,
    breakerSizing,
    recommendations,
    calculatedAt: new Date().toISOString(),
    calculationVersion: '1.0.0',
    alerts,
    voltageDropAnalysis,
    deratingFactors: deratingFactorsResult,
  };

  return results;
}

/**
 * Quick breaker size lookup (no full calculation)
 *
 * Useful for getting a quick estimate without full validation and recommendations
 *
 * @param loadCurrent - Load current in amperes
 * @param standard - Electrical standard
 * @returns Recommended breaker size
 */
export function quickBreakerLookup(loadCurrent: number, standard: 'NEC' | 'IEC'): number | null {
  const safetyFactorResult = applySafetyFactor({
    loadCurrent,
    standard,
    loadType: 'continuous',
  });

  return recommendStandardBreaker(safetyFactorResult.minimumBreakerSize, standard);
}

/**
 * Recalculate with different standard (for standard toggle)
 *
 * @param previousResults - Previous calculation results
 * @param newStandard - New electrical standard
 * @returns New calculation results with same inputs but different standard
 */
export async function recalculateWithStandard(
  input: BreakerCalculationInput,
  newStandard: 'NEC' | 'IEC'
): Promise<CalculationResults> {
  logger.info('BreakerCalculator', `Recalculating with ${newStandard} standard`);

  const newInput: BreakerCalculationInput = {
    ...input,
    circuit: {
      ...input.circuit,
      standard: newStandard,
    },
  };

  return calculateBreakerSizing(newInput);
}