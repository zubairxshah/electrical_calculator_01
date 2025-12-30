/**
 * IESNA Lumen Method Calculations (Practical Implementation)
 *
 * Core calculation engine for indoor lighting design using the
 * IESNA Lighting Handbook methodology with practical adjustments
 * for real-world applications.
 *
 * Key Improvements over Standard Method:
 * 1. Small room adjustment (< 10m²) - UF boost for compact spaces
 * 2. Ceiling height factor - Adjusts for standard vs high ceilings
 * 3. Fixture density limits - Prevents impractical fixture counts
 * 4. Room size-appropriate luminaire recommendations
 *
 * Primary Formula: N = (E × A × CF) / (F × UF × MF × HCF)
 * Where:
 *   N = Number of luminaires
 *   E = Required illuminance (lux)
 *   A = Room area (m²)
 *   CF = Ceiling height factor
 *   F = Luminaire flux (lumens)
 *   UF = Utilization Factor (with small room adjustment)
 *   MF = Maintenance Factor (0.8 default for LED)
 *   HCF = Height correction factor
 *
 * Reference: IESNA Lighting Handbook, 10th Edition, Chapter 9
 * Additional Reference: Alcon Lighting Guide, LumenCalculator.com
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
// Constants
// ============================================================================

/** Standard ceiling height in meters (8 feet) */
const STANDARD_CEILING_HEIGHT = 2.75;

/** Maximum recommended fixtures per 10m² to prevent over-lighting */
const MAX_FIXTURES_PER_10SQM = 6;

/** Minimum recommended area per fixture in m² */
const MIN_AREA_PER_FIXTURE = 1.5;

/** Small room threshold in m² */
const SMALL_ROOM_THRESHOLD = 10;

/** Very small room threshold in m² */
const VERY_SMALL_ROOM_THRESHOLD = 5;

/** Default maintenance factor for LED (per IESNA) */
const DEFAULT_MAINTENANCE_FACTOR = 0.8;

/** Default utilization factor when not using tables */
const DEFAULT_UTILIZATION_FACTOR = 0.65;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate the mounting height (ceiling to work plane)
 */
export function calculateMountingHeight(room: Room): number {
  return room.height - room.workPlaneHeight;
}

/**
 * Calculate the Room Index (RI) using IESNA formula
 */
export function calculateRoomIndex(room: Room): RoomIndex {
  const mountingHeight = calculateMountingHeight(room);
  const { length, width } = room;

  const numerator = length * width;
  const denominator = mountingHeight * (length + width);
  const value = Math.max(0.25, numerator / denominator); // Minimum RI = 0.25

  return {
    value: Math.round(value * 100) / 100,
    mountingHeight,
    formula: `RI = (L × W) / (H_m × (L + W)) = (${length} × ${width}) / (${mountingHeight.toFixed(2)} × ${length + width})`,
  };
}

/**
 * Calculate ceiling height adjustment factor
 *
 * Research shows that higher ceilings require more lumens because:
 * - Light spreads over larger area
 * - Inverse square law applies
 * - More light is absorbed by surfaces
 *
 * @param ceilingHeight - Room ceiling height in meters
 * @returns Adjustment factor (1.0 = standard ceiling)
 */
function calculateCeilingHeightFactor(ceilingHeight: number): number {
  if (ceilingHeight <= STANDARD_CEILING_HEIGHT) {
    return 1.0;
  }
  // For each 0.5m above standard, add 5% to compensate
  const excessHeight = ceilingHeight - STANDARD_CEILING_HEIGHT;
  return 1 + (excessHeight / 0.5) * 0.05;
}

/**
 * Calculate small room adjustment factor
 *
 * Small rooms have better light distribution because:
 * - Walls are closer, reflecting more light
 * - Fixtures are relatively closer to work plane
 * - Room index is lower but UF tables don't account for wall proximity
 *
 * @param roomArea - Room area in m²
 * @returns Adjustment factor (1.0 = normal room, >1.0 = small room boost)
 */
function calculateSmallRoomFactor(roomArea: number): number {
  if (roomArea >= SMALL_ROOM_THRESHOLD) {
    return 1.0;
  }
  if (roomArea >= VERY_SMALL_ROOM_THRESHOLD) {
    // Small rooms get a 15% boost
    return 1.15;
  }
  // Very small rooms get a 25% boost
  return 1.25;
}

/**
 * Get recommended minimum luminaire lumens based on room area
 *
 * Practical guideline: Don't use many low-output fixtures.
 * Better to use fewer high-output fixtures for uniformity.
 *
 * @param roomArea - Room area in m²
 * @returns Minimum recommended lumens per fixture
 */
function getRecommendedMinLumens(roomArea: number): number {
  if (roomArea < 5) {
    return 800; // Very small rooms: at least 800lm fixture
  }
  if (roomArea < 10) {
    return 1500; // Small rooms: at least 1500lm fixture
  }
  if (roomArea < 20) {
    return 2000; // Medium rooms: at least 2000lm fixture
  }
  return 2500; // Large rooms: at least 2500lm fixture
}

/**
 * Get maximum recommended fixtures for room area
 *
 * Practical guideline: No more than ~1 fixture per 1.5-2m²
 * This prevents over-lighting and high fixture density
 *
 * @param roomArea - Room area in m²
 * @returns Maximum recommended fixtures
 */
function getMaxFixtures(roomArea: number): number {
  return Math.ceil(roomArea / MIN_AREA_PER_FIXTURE);
}

/**
 * Get typical fixture count range for reference
 *
 * @param roomArea - Room area in m²
 * @param illuminance - Required illuminance in lux
 * @returns { min, max } typical fixture range
 */
function getTypicalFixtureRange(roomArea: number, illuminance: number): { min: number; max: number } {
  // Assuming typical fixture output of 2500-4000 lumens
  const minLumens = 2500;
  const maxLumens = 4000;
  const uf = 0.65;
  const mf = 0.8;
  const smallRoomFactor = calculateSmallRoomFactor(roomArea);

  const maxFixtures = getMaxFixtures(roomArea);

  // Using 300 lux as reference (typical office)
  const minRequired = (300 * roomArea * smallRoomFactor) / (maxLumens * uf * mf);
  const maxRequired = (300 * roomArea * smallRoomFactor) / (minLumens * uf * mf);

  return {
    min: Math.max(1, Math.round(minRequired)),
    max: Math.min(maxFixtures, Math.round(maxRequired)),
  };
}

// ============================================================================
// Luminaires Required Calculation
// ============================================================================

/**
 * Calculate the number of luminaires required
 *
 * Formula: N = (E × A × CF × SRF) / (F × UF × MF × HCF)
 *
 * @param room - Room configuration
 * @param luminaire - Selected luminaire
 * @param params - Design parameters
 * @returns Object with exact, rounded, and practical luminaire counts
 */
export function calculateLuminairesRequired(
  room: Room,
  luminaire: Luminaire,
  params: DesignParameters
): { exact: number; rounded: number; practical: number; warning?: string } {
  const area = room.length * room.width;
  const { requiredIlluminance, utilizationFactor, maintenanceFactor } = params;
  const { lumens } = luminaire;

  // Calculate adjustment factors
  const ceilingHeightFactor = calculateCeilingHeightFactor(room.height);
  const smallRoomFactor = calculateSmallRoomFactor(area);

  // Effective UF with small room adjustment
  const effectiveUF = utilizationFactor * smallRoomFactor;

  // Base calculation
  const numerator = requiredIlluminance * area * ceilingHeightFactor;
  const denominator = lumens * effectiveUF * maintenanceFactor;

  const exact = numerator / denominator;
  const rounded = Math.ceil(exact);

  // Practical calculation with density limits
  const maxFixtures = getMaxFixtures(area);
  const minLumensRecommended = getRecommendedMinLumens(area);

  let practical = rounded;
  let warning: string | undefined;

  // Check if fixture output is too low for room size
  if (lumens < minLumensRecommended) {
    warning = `Fixture output (${lumens} lm) may be low for ${area.toFixed(1)}m² room. Consider fixtures with at least ${minLumensRecommended} lm.`;
  }

  // Cap at maximum practical fixtures
  if (rounded > maxFixtures) {
    practical = maxFixtures;
    warning = `Fixture count limited to ${maxFixtures} (max density of ${MIN_AREA_PER_FIXTURE}m²/fixture). Consider higher output luminaires.`;
  }

  // Warn if only 1 fixture for larger rooms (uneven lighting)
  if (rounded === 1 && area > 8) {
    warning = 'Single fixture may cause uneven lighting. Consider multiple fixtures or higher output option.';
  }

  return { exact, rounded, practical, warning };
}

/**
 * Calculate the average illuminance achieved with given luminaire count
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

export function calculateTotalPower(
  luminaireCount: number,
  wattsPerLuminaire: number
): number {
  return luminaireCount * wattsPerLuminaire;
}

// ============================================================================
// Spacing to Height Ratio Calculation
// ============================================================================

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

function generateWarnings(
  room: Room,
  luminaire: Luminaire,
  params: DesignParameters,
  results: {
    luminairesRounded: number;
    luminairesPractical: number;
    spacingToHeightRatio: number;
    averageIlluminance: number;
    area: number;
  },
  calculationWarning?: string
): CalculationWarning[] {
  const warnings: CalculationWarning[] = [];
  const { area } = results;

  // Add calculation-specific warning
  if (calculationWarning) {
    warnings.push({
      severity: 'warning',
      code: 'FIXTURE_DENSITY',
      message: calculationWarning,
      recommendation: 'Select higher output luminaires or adjust room parameters.',
    });
  }

  // High ceiling warning
  if (room.height > 3.5) {
    warnings.push({
      severity: 'warning',
      code: 'HIGH_CEILING',
      message: `Ceiling height of ${room.height}m exceeds standard (2.75m). Extra luminaires may be needed.`,
      recommendation: 'Consider high-lumen fixtures or additional task lighting.',
    });
  }

  // Very high ceiling warning
  if (room.height > 5) {
    warnings.push({
      severity: 'warning',
      code: 'VERY_HIGH_CEILING',
      message: `Ceiling height of ${room.height}m is very high. High-bay fixtures recommended.`,
      recommendation: 'Use industrial high-bay luminaires with narrow beam distribution.',
    });
  }

  // Low reflectance warning
  if (room.ceilingReflectance < 50 || room.wallReflectance < 30) {
    warnings.push({
      severity: 'info',
      code: 'LOW_REFLECTANCE',
      message: 'Dark surfaces reduce light utilization. More luminaires may be needed.',
      recommendation: 'Consider lighter wall/ceiling finishes for better efficiency.',
    });
  }

  // Large room warning
  if (area > 100) {
    warnings.push({
      severity: 'info',
      code: 'LARGE_ROOM',
      message: `Room area (${area.toFixed(1)}m²) is large. Consider zoned lighting design.`,
      recommendation: 'Divide into calculation zones for better uniformity.',
    });
  }

  // SHR compliance warning
  if (results.spacingToHeightRatio > luminaire.maxSHR) {
    warnings.push({
      severity: 'warning',
      code: 'SHR_EXCEEDED',
      message: `Spacing-to-Height Ratio (${results.spacingToHeightRatio}) exceeds luminaire maximum (${luminaire.maxSHR}).`,
      recommendation: 'Add more luminaires for uniform coverage.',
    });
  }

  // Over-lit warning
  if (results.averageIlluminance > params.requiredIlluminance * 1.5) {
    warnings.push({
      severity: 'info',
      code: 'OVER_ILLUMINATED',
      message: `Achieved illuminance (${results.averageIlluminance} lux) is ${Math.round((results.averageIlluminance / params.requiredIlluminance - 1) * 100)}% over target.`,
      recommendation: 'Consider dimmable fixtures or lower output luminaires.',
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
  if (luminaire.watts > 100) {
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

function generateRecommendations(
  room: Room,
  luminaire: Luminaire,
  results: {
    luminairesRounded: number;
    luminairesPractical: number;
    spacingToHeightRatio: number;
    totalWatts: number;
    averageIlluminance: number;
    area: number;
  }
): string[] {
  const recommendations: string[] = [];
  const { area } = results;

  // Grid layout suggestion
  const sqrtCount = Math.sqrt(results.luminairesPractical);
  const rows = Math.round(sqrtCount * (room.width / room.length));
  const cols = Math.ceil(results.luminairesPractical / rows);

  if (rows * cols === results.luminairesPractical) {
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
  if (powerDensity > 12) {
    recommendations.push(
      `Power density (${powerDensity.toFixed(1)} W/m²) is relatively high. Consider higher efficacy luminaires.`
    );
  } else if (powerDensity < 4) {
    recommendations.push(
      `Excellent power density (${powerDensity.toFixed(1)} W/m²) indicates energy-efficient design.`
    );
  }

  // Small room specific
  if (area < 10) {
    recommendations.push(
      'Small room: Consider single central fixture or 2-3 fixtures for balanced lighting.'
    );
  }

  // Dimming recommendation
  if (luminaire.dimmable) {
    recommendations.push(
      'Dimmable fixtures installed. Consider adding occupancy sensors for additional energy savings.'
    );
  }

  // Ceiling height adjustment
  if (room.height > 3) {
    recommendations.push(
      'Higher ceiling: Ensure fixtures are properly suspended or selected for high-ceiling applications.'
    );
  }

  return recommendations;
}

// ============================================================================
// Formula Documentation
// ============================================================================

function generateFormulas(
  room: Room,
  luminaire: Luminaire,
  params: DesignParameters,
  results: {
    roomIndex: RoomIndex;
    luminairesRequired: number;
    luminairesRounded: number;
    luminairesPractical: number;
    averageIlluminance: number;
    energyConsumptionKwhYear: number;
    ceilingHeightFactor: number;
    smallRoomFactor: number;
    effectiveUF: number;
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
      name: 'Adjustment Factors',
      formula: 'CF × SRF',
      variables: [
        { symbol: 'CF', value: results.ceilingHeightFactor, unit: '(ceiling height factor)' },
        { symbol: 'SRF', value: results.smallRoomFactor, unit: '(small room factor)' },
      ],
      result: results.ceilingHeightFactor * results.smallRoomFactor,
      unit: '',
    },
    {
      name: 'Luminaires Required',
      formula: 'N = (E × A × CF × SRF) / (F × UF × MF)',
      variables: [
        { symbol: 'E', value: params.requiredIlluminance, unit: 'lux' },
        { symbol: 'A', value: area, unit: 'm²' },
        { symbol: 'F', value: luminaire.lumens, unit: 'lm' },
        { symbol: 'UF', value: results.effectiveUF, unit: '' },
        { symbol: 'MF', value: params.maintenanceFactor, unit: '' },
        { symbol: 'CF', value: results.ceilingHeightFactor, unit: '' },
        { symbol: 'SRF', value: results.smallRoomFactor, unit: '' },
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
 * Perform complete lighting calculation with practical adjustments
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
  const area = room.length * room.width;

  // Calculate room index
  const roomIndex = calculateRoomIndex(room);

  // Calculate adjustment factors
  const ceilingHeightFactor = calculateCeilingHeightFactor(room.height);
  const smallRoomFactor = calculateSmallRoomFactor(area);

  // Look up or use provided UF
  let utilizationFactor = params.utilizationFactor;

  // If using default UF, look up from tables
  if (params.utilizationFactor === DEFAULT_UTILIZATION_FACTOR && luminaire.ufTableId) {
    const lookedUpUF = lookupUF(
      luminaire.ufTableId,
      roomIndex.value,
      room.ceilingReflectance,
      room.wallReflectance,
      room.floorReflectance
    );
    utilizationFactor = lookedUpUF;
  }

  // Effective UF with small room adjustment
  const effectiveUF = utilizationFactor * smallRoomFactor;

  // Create effective params
  const effectiveParams: DesignParameters = {
    ...params,
    utilizationFactor: effectiveUF,
  };

  // Calculate luminaires required
  const luminaires = calculateLuminairesRequired(room, luminaire, effectiveParams);

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

  // Prepare intermediate results
  const intermediateResults = {
    luminairesRounded: luminaires.rounded,
    luminairesPractical: luminaires.practical,
    spacingToHeightRatio,
    averageIlluminance,
    totalWatts,
    area,
  };

  // Generate warnings and recommendations
  const warnings = generateWarnings(room, luminaire, effectiveParams, intermediateResults, luminaires.warning);
  const recommendations = generateRecommendations(room, luminaire, intermediateResults);

  // Generate formula documentation
  const formulas = generateFormulas(room, luminaire, effectiveParams, {
    roomIndex,
    luminairesRequired: luminaires.exact,
    luminairesRounded: luminaires.rounded,
    luminairesPractical: luminaires.practical,
    averageIlluminance,
    energyConsumptionKwhYear,
    ceilingHeightFactor,
    smallRoomFactor,
    effectiveUF,
  });

  return {
    roomIndex,
    utilizationFactor: effectiveUF,
    luminairesRequired: luminaires.exact,
    luminairesRounded: luminaires.rounded,
    luminairesPractical: luminaires.practical,
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

// ============================================================================
// Export utilities for reference
// ============================================================================

export {
  calculateCeilingHeightFactor,
  calculateSmallRoomFactor,
  getRecommendedMinLumens,
  getMaxFixtures,
  getTypicalFixtureRange,
  STANDARD_CEILING_HEIGHT,
  MAX_FIXTURES_PER_10SQM,
  MIN_AREA_PER_FIXTURE,
  SMALL_ROOM_THRESHOLD,
  VERY_SMALL_ROOM_THRESHOLD,
  DEFAULT_MAINTENANCE_FACTOR,
};
