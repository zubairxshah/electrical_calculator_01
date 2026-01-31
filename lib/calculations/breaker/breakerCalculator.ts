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
import { calculateCombinedDerating, getNECGroupingFactor, getIECTemperatureFactor, type IECInstallationMethod } from '@/lib/standards/deratingTables';
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

  const loadAnalysis: LoadAnalysis = {
    inputPower: input.circuit.loadMode === 'kw' ? input.circuit.loadValue : undefined,
    inputCurrent: input.circuit.loadMode === 'amps' ? input.circuit.loadValue : undefined,
    calculatedCurrentAmps: loadCurrentResult.currentAmps,
    formula: loadCurrentResult.formula,
    components: loadCurrentResult.components,
    continuousLoadFactor:
      input.circuit.standard === 'NEC' ? 1.25 : 1.0,
  };

  logger.debug('BreakerCalculator', 'Load current calculated', {
    currentAmps: loadCurrentResult.currentAmps,
    formula: loadCurrentResult.formula,
  });

  // ============================================================================
  // STEP 3: SAFETY FACTOR APPLICATION
  // ============================================================================

  logger.debug('BreakerCalculator', 'Applying safety factor');

  const safetyFactorResult = applySafetyFactor({
    loadCurrent: loadCurrentResult.currentAmps,
    standard: input.circuit.standard,
    loadType: 'continuous', // Default to continuous for safety
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

  if (input.environment?.ambientTemperature || input.environment?.groupedCables) {
    logger.debug('BreakerCalculator', 'Applying derating factors');

    try {
      const ambientTemp = input.environment.ambientTemperature ?? 30; // Default to 30°C
      const numConductors = input.environment.groupedCables ?? 1;
      const installationMethod = input.environment.installationMethod as IECInstallationMethod | undefined;

      // Calculate derating factors
      const derating = calculateCombinedDerating({
        ambientTemp,
        insulationRating: 90, // Use 90°C for modern cables
        numberOfConductors: numConductors,
        installationMethod,
        standard: input.circuit.standard,
      });

      // Calculate adjusted breaker size due to derating
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
        combinedFactor: derating.totalFactor,
        adjustedBreakerSizeAmps: adjustedBreakerSize,
      };

      // Add warning for significant derating
      if (derating.totalFactor < 0.7) {
        alerts.push({
          type: 'warning',
          code: 'SIGNIFICANT_DERATING',
          message: `Combined derating factors (${(derating.totalFactor * 100).toFixed(0)}%) require ${adjustedBreakerSize.toFixed(1)}A breaker. Verify cable ampacity allows this size.`,
          severity: 'major',
          codeReference: derating.standardReference,
        });
      }

      logger.debug('BreakerCalculator', 'Derating factors applied', {
        tempFactor: derating.temperatureFactor,
        groupingFactor: derating.groupingFactor,
        combinedFactor: derating.totalFactor,
        adjustedBreakerSize: adjustedBreakerSize,
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