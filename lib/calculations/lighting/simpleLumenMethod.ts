/**
 * Simplified Lumen Method Calculator
 *
 * A practical, simplified approach to lighting calculations that produces
 * realistic fixture counts similar to ToolsRail.com methodology.
 *
 * Core Formula:
 * - Required Lumens = Room Area × Desired Lux Level
 * - Number of Fixtures = Required Lumens ÷ Lumens per Fixture
 *
 * This approach is more straightforward and produces practical results
 * for typical residential and commercial applications.
 *
 * @module simpleLumenMethod
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

// ============================================================================
// Core Calculation
// ============================================================================

/**
 * Calculate required number of fixtures using simplified lumen method
 *
 * @param room - Room dimensions and properties
 * @param luminaire - Selected fixture with lumen output
 * @param designParameters - Design requirements (illuminance, etc.)
 * @returns Complete calculation results
 */
export function calculateSimpleLighting(
  room: Room,
  luminaire: Luminaire,
  designParameters: DesignParameters
): CalculationResults {
  // Calculate room area
  const roomArea = room.length * room.width;

  // Calculate total required lumens
  const requiredLumens = roomArea * designParameters.requiredIlluminance;

  // Calculate number of fixtures needed (rounded up)
  const fixturesRequired = requiredLumens / luminaire.lumens;
  const fixturesRounded = Math.max(1, Math.ceil(fixturesRequired));

  // Apply practical limits based on room size
  const fixturesPractical = applyPracticalLimits(
    fixturesRounded,
    roomArea,
    luminaire.lumens
  );

  // Calculate actual illuminance achieved
  const totalLumens = fixturesPractical * luminaire.lumens;
  const averageIlluminance = totalLumens / roomArea;

  // Calculate power consumption
  const totalWatts = fixturesPractical * luminaire.watts;
  const energyConsumptionKwhYear =
    (totalWatts * designParameters.operatingHoursPerDay * 365) / 1000;

  // Calculate mounting height and spacing
  const mountingHeight = room.height - room.workPlaneHeight;
  const spacingToHeightRatio = calculateSpacingRatio(
    room.length,
    room.width,
    fixturesPractical,
    mountingHeight
  );

  // Generate formulas for display
  const formulas = generateFormulas(
    room,
    luminaire,
    designParameters,
    requiredLumens,
    fixturesRequired
  );

  // Generate warnings
  const warnings = generateWarnings(
    roomArea,
    fixturesPractical,
    averageIlluminance,
    designParameters.requiredIlluminance,
    spacingToHeightRatio,
    luminaire.maxSHR
  );

  // Generate recommendations
  const recommendations = generateRecommendations(
    roomArea,
    fixturesPractical,
    luminaire,
    averageIlluminance,
    designParameters.requiredIlluminance
  );

  // Calculate Room Index for reference (not used in calculation)
  const roomIndex = {
    value: (room.length * room.width) / (mountingHeight * (room.length + room.width)),
    mountingHeight,
    formula: `RI = (L × W) / (H × (L + W))`,
  };

  return {
    roomIndex,
    utilizationFactor: 1.0, // Not used in simple method
    luminairesRequired: fixturesRequired,
    luminairesRounded: fixturesRounded,
    luminairesPractical: fixturesPractical,
    averageIlluminance: Math.round(averageIlluminance),
    totalWatts,
    totalLumens,
    energyConsumptionKwhYear: Math.round(energyConsumptionKwhYear),
    spacingToHeightRatio,
    shrCompliant: spacingToHeightRatio <= luminaire.maxSHR,
    formulas,
    warnings,
    recommendations,
    standardReference: 'Simplified Lumen Method',
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Apply practical limits to fixture count
 */
function applyPracticalLimits(
  fixturesRounded: number,
  roomArea: number,
  lumensPerFixture: number
): number {
  // Maximum fixtures based on room size
  // Rule: No more than 1 fixture per 2m² for typical fixtures (>500 lumens)
  // No more than 1 fixture per 1.5m² for small fixtures (<500 lumens)
  const minAreaPerFixture = lumensPerFixture < 500 ? 1.5 : 2.0;
  const maxFixtures = Math.ceil(roomArea / minAreaPerFixture);

  // Minimum fixtures: at least 1
  const minFixtures = 1;

  // Apply limits
  return Math.max(minFixtures, Math.min(fixturesRounded, maxFixtures));
}

/**
 * Calculate average spacing-to-height ratio
 */
function calculateSpacingRatio(
  length: number,
  width: number,
  fixtureCount: number,
  mountingHeight: number
): number {
  if (fixtureCount === 1) {
    return 0; // Single centered fixture
  }

  // Calculate grid dimensions
  const columns = Math.ceil(Math.sqrt(fixtureCount));
  const rows = Math.ceil(fixtureCount / columns);

  // Calculate spacing
  const horizontalSpacing = width / (columns + 1);
  const verticalSpacing = length / (rows + 1);
  const averageSpacing = (horizontalSpacing + verticalSpacing) / 2;

  return averageSpacing / mountingHeight;
}

/**
 * Generate calculation formulas for display
 */
function generateFormulas(
  room: Room,
  luminaire: Luminaire,
  params: DesignParameters,
  requiredLumens: number,
  fixturesRequired: number
): CalculationFormula[] {
  const roomArea = room.length * room.width;

  return [
    {
      name: 'Room Area',
      formula: 'A = L × W',
      variables: [
        { symbol: 'L', value: room.length, unit: 'm' },
        { symbol: 'W', value: room.width, unit: 'm' },
      ],
      result: roomArea,
      unit: 'm²',
    },
    {
      name: 'Required Lumens',
      formula: 'Total Lumens = Area × Illuminance',
      variables: [
        { symbol: 'Area', value: roomArea, unit: 'm²' },
        { symbol: 'Illuminance', value: params.requiredIlluminance, unit: 'lux' },
      ],
      result: requiredLumens,
      unit: 'lm',
    },
    {
      name: 'Fixtures Required',
      formula: 'N = Required Lumens ÷ Lumens per Fixture',
      variables: [
        { symbol: 'Required Lumens', value: requiredLumens, unit: 'lm' },
        { symbol: 'Lumens per Fixture', value: luminaire.lumens, unit: 'lm' },
      ],
      result: fixturesRequired,
      unit: 'fixtures',
    },
  ];
}

/**
 * Generate warnings based on results
 */
function generateWarnings(
  roomArea: number,
  fixtureCount: number,
  achievedLux: number,
  requiredLux: number,
  shrRatio: number,
  maxSHR: number
): CalculationWarning[] {
  const warnings: CalculationWarning[] = [];

  // Check if over-lit
  if (achievedLux > requiredLux * 1.5) {
    warnings.push({
      severity: 'warning',
      code: 'OVER_LIT',
      message: `Achieved illuminance (${Math.round(achievedLux)} lux) is significantly higher than required (${requiredLux} lux)`,
      recommendation: 'Consider using fixtures with lower lumen output or reducing fixture count',
    });
  }

  // Check if under-lit
  if (achievedLux < requiredLux * 0.8) {
    warnings.push({
      severity: 'warning',
      code: 'UNDER_LIT',
      message: `Achieved illuminance (${Math.round(achievedLux)} lux) is lower than required (${requiredLux} lux)`,
      recommendation: 'Consider using fixtures with higher lumen output or increasing fixture count',
    });
  }

  // Check fixture density
  const areaPerFixture = roomArea / fixtureCount;
  if (areaPerFixture < 1.5) {
    warnings.push({
      severity: 'info',
      code: 'HIGH_DENSITY',
      message: `High fixture density: ${areaPerFixture.toFixed(1)} m² per fixture`,
      recommendation: 'Consider using fewer, more powerful fixtures to reduce installation costs',
    });
  }

  // Check spacing ratio
  if (shrRatio > maxSHR) {
    warnings.push({
      severity: 'warning',
      code: 'SHR_EXCEEDED',
      message: `Spacing-to-Height Ratio (${shrRatio.toFixed(2)}) exceeds maximum (${maxSHR})`,
      recommendation: 'Increase fixture count or reduce mounting height for better uniformity',
    });
  }

  return warnings;
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  roomArea: number,
  fixtureCount: number,
  luminaire: Luminaire,
  achievedLux: number,
  requiredLux: number
): string[] {
  const recommendations: string[] = [];

  // Efficiency recommendation
  const efficacy = luminaire.efficacy;
  if (efficacy < 80) {
    recommendations.push(
      `Consider upgrading to LED fixtures (>80 lm/W) for better energy efficiency. Current: ${efficacy} lm/W`
    );
  } else if (efficacy > 100) {
    recommendations.push(
      `Excellent fixture efficiency: ${efficacy} lm/W will minimize operating costs`
    );
  }

  // Layout recommendation
  if (fixtureCount === 1) {
    recommendations.push('Single centered fixture provides basic illumination. Consider adding more fixtures for better uniformity.');
  } else if (fixtureCount >= 2 && fixtureCount <= 4) {
    recommendations.push(`${fixtureCount} fixtures provide good coverage for this room size.`);
  }

  // Dimming recommendation for over-lit spaces
  if (achievedLux > requiredLux * 1.3 && luminaire.dimmable) {
    recommendations.push('Consider using dimming controls to adjust light levels and save energy');
  }

  return recommendations;
}
