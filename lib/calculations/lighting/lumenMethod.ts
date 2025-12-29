/**
 * IESNA Lumen Method Calculations
 *
 * Core calculation engine for indoor lighting design using the
 * IESNA Lighting Handbook methodology.
 *
 * Primary Formula: N = (E × A) / (F × UF × MF)
 * Where:
 *   N = Number of luminaires
 *   E = Required illuminance (lux)
 *   A = Room area (m²)
 *   F = Luminaire flux (lumens)
 *   UF = Utilization Factor
 *   MF = Maintenance Factor
 *
 * Reference: IESNA Lighting Handbook, 10th Edition, Chapter 9
 *
 * @module lumenMethod
 */

import type {
  Room,
  Luminaire,
  DesignParameters,
  CalculationResults,
  RoomIndex,
  CalculationFormula,
  CalculationWarning,
} from '@/lib/types/lighting';
import { LightingStandard } from '@/lib/types/lighting';
import { lookupUF } from '@/lib/standards/utilizationFactorTables';

// ============================================================================
// Room Index Calculation
// ============================================================================

/**
 * Calculate the mounting height (ceiling to work plane)
 *
 * @param room - Room configuration
 * @returns Mounting height in meters
 */
export function calculateMountingHeight(room: Room): number {
  return room.height - room.workPlaneHeight;
}

/**
 * Calculate the Room Index (RI) using IESNA formula
 *
 * Formula: RI = (L × W) / (H_m × (L + W))
 * Where:
 *   L = Room length (m)
 *   W = Room width (m)
 *   H_m = Mounting height (m) = ceiling height - work plane height
 *
 * @param room - Room configuration
 * @returns Room Index calculation result
 */
export function calculateRoomIndex(room: Room): RoomIndex {
  const mountingHeight = calculateMountingHeight(room);
  const { length, width } = room;

  const numerator = length * width;
  const denominator = mountingHeight * (length + width);
  const value = numerator / denominator;

  return {
    value: Math.round(value * 100) / 100,
    mountingHeight,
    formula: `RI = (L × W) / (H_m × (L + W)) = (${length} × ${width}) / (${mountingHeight.toFixed(2)} × ${length + width})`,
  };
}

// ============================================================================
// Luminaires Required Calculation
// ============================================================================

/**
 * Calculate the number of luminaires required
 *
 * Formula: N = (E × A) / (F × UF × MF)
 *
 * @param room - Room configuration
 * @param luminaire - Selected luminaire
 * @param params - Design parameters including UF and MF
 * @returns Object with exact and rounded luminaire counts
 */
export function calculateLuminairesRequired(
  room: Room,
  luminaire: Luminaire,
  params: DesignParameters
): { exact: number; rounded: number } {
  const area = room.length * room.width;
  const { requiredIlluminance, utilizationFactor, maintenanceFactor } = params;
  const { lumens } = luminaire;

  const numerator = requiredIlluminance * area;
  const denominator = lumens * utilizationFactor * maintenanceFactor;

  const exact = numerator / denominator;
  const rounded = Math.ceil(exact);

  return { exact, rounded };
}

// ============================================================================
// Average Illuminance Calculation
// ============================================================================

/**
 * Calculate the average illuminance achieved with given luminaire count
 *
 * Formula: E = (N × F × UF × MF) / A
 *
 * @param luminaireCount - Number of luminaires (can be decimal for exact calc)
 * @param luminaire - Selected luminaire
 * @param params - Design parameters
 * @param area - Room area in m²
 * @returns Average illuminance in lux
 */
export function calculateAverageIlluminance(
  luminaireCount: number,
  luminaire: Luminaire,
  params: DesignParameters,
  area: number
): number {
  const { utilizationFactor, maintenanceFactor } = params;
  const { lumens } = luminaire;

  const illuminance = (luminaireCount * lumens * utilizationFactor * maintenanceFactor) / area;

  return Math.round(illuminance * 10) / 10;
}

// ============================================================================
// Energy Calculation
// ============================================================================

/**
 * Calculate annual energy consumption in kWh
 *
 * @param luminaireCount - Number of luminaires
 * @param wattsPerLuminaire - Power per luminaire in Watts
 * @param operatingHoursPerDay - Daily operating hours
 * @returns Annual energy consumption in kWh
 */
export function calculateEnergyConsumption(
  luminaireCount: number,
  wattsPerLuminaire: number,
  operatingHoursPerDay: number
): number {
  const totalWatts = luminaireCount * wattsPerLuminaire;
  const dailyKwh = (totalWatts * operatingHoursPerDay) / 1000;
  const annualKwh = dailyKwh * 365;

  return Math.round(annualKwh);
}

/**
 * Calculate total power consumption
 *
 * @param luminaireCount - Number of luminaires
 * @param wattsPerLuminaire - Power per luminaire in Watts
 * @returns Total power in Watts
 */
export function calculateTotalPower(
  luminaireCount: number,
  wattsPerLuminaire: number
): number {
  return luminaireCount * wattsPerLuminaire;
}

// ============================================================================
// Spacing to Height Ratio Calculation
// ============================================================================

/**
 * Calculate the Spacing-to-Height Ratio (SHR)
 *
 * Assumes a uniform grid layout and calculates the equivalent
 * spacing based on area per luminaire.
 *
 * @param luminaireCount - Number of luminaires
 * @param area - Room area in m²
 * @param mountingHeight - Mounting height in meters
 * @returns Spacing to Height Ratio
 */
export function calculateSpacingToHeightRatio(
  luminaireCount: number,
  area: number,
  mountingHeight: number
): number {
  const areaPerLuminaire = area / luminaireCount;
  const equivalentSpacing = Math.sqrt(areaPerLuminaire);
  const shr = equivalentSpacing / mountingHeight;

  return Math.round(shr * 100) / 100;
}

// ============================================================================
// Warning Generation
// ============================================================================

/**
 * Generate calculation warnings based on inputs and results
 */
function generateWarnings(
  room: Room,
  luminaire: Luminaire,
  params: DesignParameters,
  results: {
    luminairesRounded: number;
    spacingToHeightRatio: number;
    averageIlluminance: number;
  }
): CalculationWarning[] {
  const warnings: CalculationWarning[] = [];

  // High ceiling warning
  if (room.height > 6) {
    warnings.push({
      severity: 'warning',
      code: 'HIGH_CEILING',
      message: `Ceiling height of ${room.height}m is high. Consider high-bay fixtures for better efficiency.`,
      recommendation: 'Select luminaires designed for high mounting heights.',
    });
  }

  // Very high ceiling warning
  if (room.height > 10) {
    warnings.push({
      severity: 'warning',
      code: 'VERY_HIGH_CEILING',
      message: `Ceiling height of ${room.height}m is very high. Industrial high-bay fixtures recommended.`,
      recommendation: 'Use industrial high-bay luminaires with narrow beam distribution.',
    });
  }

  // Low reflectance warning
  if (room.ceilingReflectance < 50 || room.wallReflectance < 30) {
    warnings.push({
      severity: 'info',
      code: 'LOW_REFLECTANCE',
      message: 'Low surface reflectances reduce light utilization efficiency.',
      recommendation: 'Consider lighter surface finishes to improve efficiency.',
    });
  }

  // Large room warning
  if (room.length * room.width > 500) {
    warnings.push({
      severity: 'info',
      code: 'LARGE_ROOM',
      message: 'Large room area may require zone-based lighting design.',
      recommendation: 'Consider dividing into calculation zones for better uniformity.',
    });
  }

  // SHR compliance warning
  if (results.spacingToHeightRatio > luminaire.maxSHR) {
    warnings.push({
      severity: 'warning',
      code: 'SHR_EXCEEDED',
      message: `Spacing-to-Height Ratio (${results.spacingToHeightRatio}) exceeds luminaire maximum (${luminaire.maxSHR}).`,
      recommendation: 'Add more luminaires or select fixtures with higher SHR rating.',
    });
  }

  // Over-lit warning
  if (results.averageIlluminance > params.requiredIlluminance * 1.3) {
    warnings.push({
      severity: 'info',
      code: 'OVER_ILLUMINATED',
      message: `Achieved illuminance (${results.averageIlluminance} lux) is ${Math.round((results.averageIlluminance / params.requiredIlluminance - 1) * 100)}% over target.`,
      recommendation: 'Consider using dimmable fixtures or lower output luminaires.',
    });
  }

  // Low efficacy warning
  if (luminaire.efficacy < 80) {
    warnings.push({
      severity: 'warning',
      code: 'LOW_EFFICACY',
      message: `Luminaire efficacy (${luminaire.efficacy} lm/W) is below modern LED standards.`,
      recommendation: 'Consider higher efficacy luminaires (>100 lm/W) for energy savings.',
    });
  }

  // High wattage warning
  if (luminaire.watts > 200) {
    warnings.push({
      severity: 'info',
      code: 'HIGH_WATTAGE',
      message: `High wattage fixture (${luminaire.watts}W) may have significant energy costs.`,
    });
  }

  return warnings;
}

// ============================================================================
// Recommendation Generation
// ============================================================================

/**
 * Generate optimization recommendations
 */
function generateRecommendations(
  room: Room,
  luminaire: Luminaire,
  results: {
    luminairesRounded: number;
    spacingToHeightRatio: number;
    totalWatts: number;
    averageIlluminance: number;
  }
): string[] {
  const recommendations: string[] = [];
  const area = room.length * room.width;

  // Grid layout suggestion
  const sqrtCount = Math.sqrt(results.luminairesRounded);
  const rows = Math.round(sqrtCount * (room.width / room.length));
  const cols = Math.ceil(results.luminairesRounded / rows);

  if (rows * cols === results.luminairesRounded) {
    recommendations.push(
      `Suggested layout: ${rows} rows × ${cols} columns for uniform distribution.`
    );
  } else {
    recommendations.push(
      `Consider a ${rows} × ${cols} layout (${rows * cols} fixtures) for uniform spacing.`
    );
  }

  // Power density
  const powerDensity = results.totalWatts / area;
  if (powerDensity > 15) {
    recommendations.push(
      `Power density (${powerDensity.toFixed(1)} W/m²) is high. Consider higher efficacy luminaires.`
    );
  } else if (powerDensity < 5) {
    recommendations.push(
      `Excellent power density (${powerDensity.toFixed(1)} W/m²) indicates energy-efficient design.`
    );
  }

  // Dimming recommendation
  if (luminaire.dimmable) {
    recommendations.push(
      'Dimmable fixtures installed. Consider daylight harvesting for additional energy savings.'
    );
  }

  return recommendations;
}

// ============================================================================
// Formula Documentation
// ============================================================================

/**
 * Generate formula breakdowns for display
 */
function generateFormulas(
  room: Room,
  luminaire: Luminaire,
  params: DesignParameters,
  results: {
    roomIndex: RoomIndex;
    luminairesRequired: number;
    luminairesRounded: number;
    averageIlluminance: number;
    energyConsumptionKwhYear: number;
  }
): CalculationFormula[] {
  const area = room.length * room.width;
  const mountingHeight = calculateMountingHeight(room);

  return [
    {
      name: 'Room Index',
      formula: 'RI = (L × W) / (H_m × (L + W))',
      variables: [
        { symbol: 'L', value: room.length, unit: 'm' },
        { symbol: 'W', value: room.width, unit: 'm' },
        { symbol: 'H_m', value: mountingHeight, unit: 'm' },
      ],
      result: results.roomIndex.value,
      unit: '',
    },
    {
      name: 'Luminaires Required',
      formula: 'N = (E × A) / (F × UF × MF)',
      variables: [
        { symbol: 'E', value: params.requiredIlluminance, unit: 'lux' },
        { symbol: 'A', value: area, unit: 'm²' },
        { symbol: 'F', value: luminaire.lumens, unit: 'lm' },
        { symbol: 'UF', value: params.utilizationFactor, unit: '' },
        { symbol: 'MF', value: params.maintenanceFactor, unit: '' },
      ],
      result: results.luminairesRounded,
      unit: 'luminaires',
    },
    {
      name: 'Average Illuminance',
      formula: 'E_avg = (N × F × UF × MF) / A',
      variables: [
        { symbol: 'N', value: results.luminairesRounded, unit: '' },
        { symbol: 'F', value: luminaire.lumens, unit: 'lm' },
        { symbol: 'UF', value: params.utilizationFactor, unit: '' },
        { symbol: 'MF', value: params.maintenanceFactor, unit: '' },
        { symbol: 'A', value: area, unit: 'm²' },
      ],
      result: results.averageIlluminance,
      unit: 'lux',
    },
    {
      name: 'Annual Energy',
      formula: 'E_annual = (N × W × H × 365) / 1000',
      variables: [
        { symbol: 'N', value: results.luminairesRounded, unit: '' },
        { symbol: 'W', value: luminaire.watts, unit: 'W' },
        { symbol: 'H', value: params.operatingHoursPerDay, unit: 'h/day' },
      ],
      result: results.energyConsumptionKwhYear,
      unit: 'kWh/year',
    },
  ];
}

// ============================================================================
// Standard Reference
// ============================================================================

/**
 * Get standard reference string
 */
function getStandardReference(standard: LightingStandard): string {
  switch (standard) {
    case LightingStandard.IESNA:
      return 'IESNA Lighting Handbook, 10th Edition';
    case LightingStandard.IES_RP8:
      return 'IES RP-8 American National Standard Practice for Roadway Lighting';
    case LightingStandard.CIE_140:
      return 'CIE 140 Road Lighting Calculations';
    case LightingStandard.ASHRAE:
      return 'ASHRAE Standard 90.1 Energy Standard';
    default:
      return 'IESNA Lighting Handbook, 10th Edition';
  }
}

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Perform complete lighting calculation
 *
 * @param room - Room configuration
 * @param luminaire - Selected luminaire
 * @param params - Design parameters
 * @returns Complete calculation results
 */
export function performLightingCalculation(
  room: Room,
  luminaire: Luminaire,
  params: DesignParameters
): CalculationResults {
  // Calculate room index
  const roomIndex = calculateRoomIndex(room);

  // Look up or use provided UF
  let utilizationFactor = params.utilizationFactor;

  // If not manually overridden, look up UF from tables
  if (luminaire.ufTableId) {
    const lookedUpUF = lookupUF(
      luminaire.ufTableId,
      roomIndex.value,
      room.ceilingReflectance,
      room.wallReflectance,
      room.floorReflectance
    );

    // Only use looked-up value if the params UF is the default
    if (params.utilizationFactor === 0.6) {
      utilizationFactor = lookedUpUF;
    }
  }

  // Create params with potentially updated UF
  const effectiveParams: DesignParameters = {
    ...params,
    utilizationFactor,
  };

  // Calculate luminaires required
  const luminaires = calculateLuminairesRequired(room, luminaire, effectiveParams);
  const area = room.length * room.width;

  // Calculate average illuminance with rounded count
  const averageIlluminance = calculateAverageIlluminance(
    luminaires.rounded,
    luminaire,
    effectiveParams,
    area
  );

  // Calculate power and energy
  const totalWatts = calculateTotalPower(luminaires.rounded, luminaire.watts);
  const totalLumens = luminaires.rounded * luminaire.lumens;
  const energyConsumptionKwhYear = calculateEnergyConsumption(
    luminaires.rounded,
    luminaire.watts,
    params.operatingHoursPerDay
  );

  // Calculate spacing to height ratio
  const mountingHeight = calculateMountingHeight(room);
  const spacingToHeightRatio = calculateSpacingToHeightRatio(
    luminaires.rounded,
    area,
    mountingHeight
  );
  const shrCompliant = spacingToHeightRatio <= luminaire.maxSHR;

  // Prepare intermediate results for warnings/recommendations
  const intermediateResults = {
    luminairesRounded: luminaires.rounded,
    spacingToHeightRatio,
    averageIlluminance,
    totalWatts,
  };

  // Generate warnings and recommendations
  const warnings = generateWarnings(room, luminaire, effectiveParams, intermediateResults);
  const recommendations = generateRecommendations(room, luminaire, intermediateResults);

  // Generate formula documentation
  const formulas = generateFormulas(room, luminaire, effectiveParams, {
    roomIndex,
    luminairesRequired: luminaires.exact,
    luminairesRounded: luminaires.rounded,
    averageIlluminance,
    energyConsumptionKwhYear,
  });

  return {
    roomIndex,
    utilizationFactor,
    luminairesRequired: luminaires.exact,
    luminairesRounded: luminaires.rounded,
    averageIlluminance,
    totalWatts,
    totalLumens,
    energyConsumptionKwhYear,
    spacingToHeightRatio,
    shrCompliant,
    formulas,
    warnings,
    recommendations,
    standardReference: getStandardReference(params.standard),
    calculatedAt: new Date().toISOString(),
  };
}
