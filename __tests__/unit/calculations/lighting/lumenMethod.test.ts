/**
 * IESNA Lumen Method Calculation Tests
 *
 * TDD tests for the indoor lighting calculation engine.
 * Tests cover Room Index, Luminaire Count, and Energy calculations.
 *
 * Reference: IESNA Lighting Handbook, 10th Edition
 *
 * @see specs/004-lighting-design/spec.md US1: Basic Indoor Lighting Calculation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateRoomIndex,
  calculateMountingHeight,
  calculateLuminairesRequired,
  calculateAverageIlluminance,
  calculateEnergyConsumption,
  calculateSpacingToHeightRatio,
  calculateTotalPower,
  performLightingCalculation,
} from '@/lib/calculations/lighting/lumenMethod';
import type {
  Room,
  Luminaire,
  DesignParameters,
  CalculationResults,
} from '@/lib/types/lighting';
import { SpaceType, LuminaireCategory, DistributionType, LightingStandard, UnitSystem } from '@/lib/types/lighting';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestRoom = (overrides?: Partial<Room>): Room => ({
  length: 10,
  width: 8,
  height: 3,
  workPlaneHeight: 0.75,
  ceilingReflectance: 80,
  wallReflectance: 50,
  floorReflectance: 20,
  spaceType: SpaceType.OFFICE_GENERAL,
  ...overrides,
});

const createTestLuminaire = (overrides?: Partial<Luminaire>): Luminaire => ({
  id: 'test-troffer-40w',
  manufacturer: 'Generic',
  model: 'LED Troffer 2x4 40W',
  category: LuminaireCategory.TROFFER,
  watts: 40,
  lumens: 5000,
  efficacy: 125,
  beamAngle: 120,
  distributionType: DistributionType.DIRECT,
  maxSHR: 1.5,
  cri: 80,
  cct: 4000,
  dimmable: true,
  ufTableId: 'generic-led-troffer',
  ...overrides,
});

const createTestDesignParams = (overrides?: Partial<DesignParameters>): DesignParameters => ({
  requiredIlluminance: 500,
  utilizationFactor: 0.6,
  maintenanceFactor: 0.8,
  operatingHoursPerDay: 10,
  standard: LightingStandard.IESNA,
  unitSystem: UnitSystem.SI,
  ...overrides,
});

// ============================================================================
// Room Index Tests
// ============================================================================

describe('calculateRoomIndex', () => {
  it('calculates room index correctly for standard office', () => {
    const room = createTestRoom();
    const mountingHeight = room.height - room.workPlaneHeight;

    // RI = (L × W) / (H_m × (L + W))
    // RI = (10 × 8) / (2.25 × (10 + 8))
    // RI = 80 / (2.25 × 18)
    // RI = 80 / 40.5 = 1.975...
    const result = calculateRoomIndex(room);

    expect(result.value).toBeCloseTo(1.98, 1);
    expect(result.mountingHeight).toBeCloseTo(2.25, 2);
  });

  it('calculates room index for small room', () => {
    const room = createTestRoom({ length: 4, width: 3, height: 2.5 });
    const result = calculateRoomIndex(room);

    // RI = (4 × 3) / (1.75 × (4 + 3))
    // RI = 12 / (1.75 × 7) = 12 / 12.25 = 0.98
    expect(result.value).toBeCloseTo(0.98, 1);
  });

  it('calculates room index for large warehouse', () => {
    const room = createTestRoom({ length: 50, width: 30, height: 10, workPlaneHeight: 0 });
    const result = calculateRoomIndex(room);

    // RI = (50 × 30) / (10 × (50 + 30))
    // RI = 1500 / (10 × 80) = 1500 / 800 = 1.875
    expect(result.value).toBeCloseTo(1.875, 2);
    expect(result.mountingHeight).toBe(10);
  });

  it('includes formula string for display', () => {
    const room = createTestRoom();
    const result = calculateRoomIndex(room);

    expect(result.formula).toContain('RI');
    expect(result.formula).toContain('L');
    expect(result.formula).toContain('W');
    expect(result.formula).toContain('H');
  });
});

// ============================================================================
// Mounting Height Tests
// ============================================================================

describe('calculateMountingHeight', () => {
  it('calculates mounting height correctly', () => {
    const room = createTestRoom();
    const result = calculateMountingHeight(room);

    // Mounting height = Ceiling height - Work plane height
    // 3 - 0.75 = 2.25
    expect(result).toBeCloseTo(2.25, 2);
  });

  it('handles zero work plane height (floor)', () => {
    const room = createTestRoom({ workPlaneHeight: 0 });
    const result = calculateMountingHeight(room);

    expect(result).toBe(3);
  });

  it('handles custom work plane height', () => {
    const room = createTestRoom({ workPlaneHeight: 1.2 });
    const result = calculateMountingHeight(room);

    expect(result).toBeCloseTo(1.8, 2);
  });
});

// ============================================================================
// Luminaires Required Tests
// ============================================================================

describe('calculateLuminairesRequired', () => {
  it('calculates luminaires required for standard office', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();

    // N = (E × A) / (F × UF × MF)
    // N = (500 × 80) / (5000 × 0.6 × 0.8)
    // N = 40000 / 2400 = 16.67
    const result = calculateLuminairesRequired(room, luminaire, params);

    expect(result.exact).toBeCloseTo(16.67, 1);
    expect(result.rounded).toBe(17); // Round up
  });

  it('rounds up fractional luminaire count', () => {
    const room = createTestRoom({ length: 5, width: 4 }); // 20m² area
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();

    // N = (500 × 20) / (5000 × 0.6 × 0.8)
    // N = 10000 / 2400 = 4.17
    const result = calculateLuminairesRequired(room, luminaire, params);

    expect(result.exact).toBeCloseTo(4.17, 1);
    expect(result.rounded).toBe(5); // Must round up
  });

  it('handles high illuminance requirement', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams({ requiredIlluminance: 1000 });

    // N = (1000 × 80) / (5000 × 0.6 × 0.8)
    // N = 80000 / 2400 = 33.33
    const result = calculateLuminairesRequired(room, luminaire, params);

    expect(result.exact).toBeCloseTo(33.33, 1);
    expect(result.rounded).toBe(34);
  });

  it('handles lower maintenance factor', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams({ maintenanceFactor: 0.65 });

    // N = (500 × 80) / (5000 × 0.6 × 0.65)
    // N = 40000 / 1950 = 20.51
    const result = calculateLuminairesRequired(room, luminaire, params);

    expect(result.exact).toBeCloseTo(20.51, 1);
    expect(result.rounded).toBe(21);
  });
});

// ============================================================================
// Average Illuminance Tests
// ============================================================================

describe('calculateAverageIlluminance', () => {
  it('calculates achieved illuminance for rounded count', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();
    const luminaireCount = 17;

    // E = (N × F × UF × MF) / A
    // E = (17 × 5000 × 0.6 × 0.8) / 80
    // E = 40800 / 80 = 510 lux
    const result = calculateAverageIlluminance(
      luminaireCount,
      luminaire,
      params,
      room.length * room.width
    );

    expect(result).toBeCloseTo(510, 0);
  });

  it('calculates exact illuminance when count matches', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();
    const luminaireCount = 16.67;

    // E = (16.67 × 5000 × 0.6 × 0.8) / 80
    // E = 40008 / 80 = 500.1 lux
    const result = calculateAverageIlluminance(
      luminaireCount,
      luminaire,
      params,
      room.length * room.width
    );

    expect(result).toBeCloseTo(500.1, 0);
  });
});

// ============================================================================
// Energy Consumption Tests
// ============================================================================

describe('calculateEnergyConsumption', () => {
  it('calculates annual energy consumption', () => {
    const luminaire = createTestLuminaire(); // 40W
    const luminaireCount = 17;
    const operatingHoursPerDay = 10;

    // Total watts = 17 × 40 = 680W
    // Daily kWh = 680W × 10h / 1000 = 6.8 kWh
    // Annual kWh = 6.8 × 365 = 2482 kWh
    const result = calculateEnergyConsumption(
      luminaireCount,
      luminaire.watts,
      operatingHoursPerDay
    );

    expect(result).toBeCloseTo(2482, 0);
  });

  it('handles 24/7 operation', () => {
    const luminaire = createTestLuminaire();
    const luminaireCount = 10;
    const operatingHoursPerDay = 24;

    // Total watts = 10 × 40 = 400W
    // Daily kWh = 400W × 24h / 1000 = 9.6 kWh
    // Annual kWh = 9.6 × 365 = 3504 kWh
    const result = calculateEnergyConsumption(
      luminaireCount,
      luminaire.watts,
      operatingHoursPerDay
    );

    expect(result).toBeCloseTo(3504, 0);
  });

  it('handles minimal operation (1 hour)', () => {
    const luminaire = createTestLuminaire();
    const luminaireCount = 5;
    const operatingHoursPerDay = 1;

    // Total watts = 5 × 40 = 200W
    // Annual kWh = 200W × 1h × 365 / 1000 = 73 kWh
    const result = calculateEnergyConsumption(
      luminaireCount,
      luminaire.watts,
      operatingHoursPerDay
    );

    expect(result).toBeCloseTo(73, 0);
  });
});

// ============================================================================
// Spacing to Height Ratio Tests
// ============================================================================

describe('calculateSpacingToHeightRatio', () => {
  it('calculates SHR for square layout', () => {
    const room = createTestRoom();
    const mountingHeight = 2.25;
    const luminaireCount = 16; // 4×4 grid

    // Area per luminaire = 80 / 16 = 5m²
    // Equivalent spacing = √5 = 2.236m
    // SHR = 2.236 / 2.25 = 0.99
    const result = calculateSpacingToHeightRatio(
      luminaireCount,
      room.length * room.width,
      mountingHeight
    );

    expect(result).toBeCloseTo(0.99, 1);
  });

  it('detects SHR exceeding maximum', () => {
    const room = createTestRoom();
    const mountingHeight = 2.25;
    const luminaireCount = 4; // Only 4 fixtures

    // Area per luminaire = 80 / 4 = 20m²
    // Equivalent spacing = √20 = 4.47m
    // SHR = 4.47 / 2.25 = 1.99
    const result = calculateSpacingToHeightRatio(
      luminaireCount,
      room.length * room.width,
      mountingHeight
    );

    expect(result).toBeGreaterThan(1.5);
  });

  it('handles high bay application', () => {
    const room = createTestRoom({ length: 30, width: 20, height: 8, workPlaneHeight: 0 });
    const mountingHeight = 8;
    const luminaireCount = 12; // 4×3 grid

    // Area per luminaire = 600 / 12 = 50m²
    // Equivalent spacing = √50 = 7.07m
    // SHR = 7.07 / 8 = 0.88
    const result = calculateSpacingToHeightRatio(
      luminaireCount,
      room.length * room.width,
      mountingHeight
    );

    expect(result).toBeCloseTo(0.88, 1);
  });
});

// ============================================================================
// Total Power Tests
// ============================================================================

describe('calculateTotalPower', () => {
  it('calculates total power correctly', () => {
    const luminaire = createTestLuminaire(); // 40W
    const luminaireCount = 17;

    const result = calculateTotalPower(luminaireCount, luminaire.watts);

    expect(result).toBe(680);
  });

  it('calculates total lumens correctly', () => {
    const luminaire = createTestLuminaire(); // 5000 lumens
    const luminaireCount = 17;

    // Total lumens = 17 × 5000 = 85000
    const totalLumens = luminaireCount * luminaire.lumens;

    expect(totalLumens).toBe(85000);
  });
});

// ============================================================================
// Full Calculation Integration Tests
// ============================================================================

describe('performLightingCalculation', () => {
  it('performs complete calculation for standard office', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();

    const result = performLightingCalculation(room, luminaire, params);

    // Verify all expected properties
    expect(result).toHaveProperty('roomIndex');
    expect(result).toHaveProperty('utilizationFactor');
    expect(result).toHaveProperty('luminairesRequired');
    expect(result).toHaveProperty('luminairesRounded');
    expect(result).toHaveProperty('averageIlluminance');
    expect(result).toHaveProperty('totalWatts');
    expect(result).toHaveProperty('totalLumens');
    expect(result).toHaveProperty('energyConsumptionKwhYear');
    expect(result).toHaveProperty('spacingToHeightRatio');
    expect(result).toHaveProperty('shrCompliant');
    expect(result).toHaveProperty('formulas');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('standardReference');
    expect(result).toHaveProperty('calculatedAt');
  });

  it('produces results matching manual calculation', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    // Use explicit UF to test manual calculation (not table lookup)
    const params = createTestDesignParams({ utilizationFactor: 0.75 });

    const result = performLightingCalculation(room, luminaire, params);

    // Room Index ≈ 1.98
    expect(result.roomIndex.value).toBeCloseTo(1.98, 1);

    // With UF=0.75: N = (500 × 80) / (5000 × 0.75 × 0.8)
    // N = 40000 / 3000 = 13.33 → 14
    expect(result.luminairesRequired).toBeCloseTo(13.33, 0);
    expect(result.luminairesRounded).toBe(14);

    // Average illuminance with 14 fixtures: E = (14 × 5000 × 0.75 × 0.8) / 80
    // E = 42000 / 80 = 525 lux
    expect(result.averageIlluminance).toBeCloseTo(525, -1);

    // Total power = 14 × 40 = 560W
    expect(result.totalWatts).toBe(560);

    // Total lumens = 14 × 5000 = 70000
    expect(result.totalLumens).toBe(70000);
  });

  it('includes formula breakdown for transparency', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();

    const result = performLightingCalculation(room, luminaire, params);

    expect(result.formulas.length).toBeGreaterThan(0);

    // Check for required formula types
    const formulaNames = result.formulas.map((f) => f.name);
    expect(formulaNames).toContain('Room Index');
    expect(formulaNames).toContain('Luminaires Required');
    expect(formulaNames).toContain('Average Illuminance');
  });

  it('generates warnings for edge cases', () => {
    const room = createTestRoom({ height: 12 }); // Very high ceiling
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();

    const result = performLightingCalculation(room, luminaire, params);

    // Should have high ceiling warning
    const hasCeilingWarning = result.warnings.some(
      (w) => w.code === 'HIGH_CEILING' || w.message.toLowerCase().includes('ceiling')
    );
    expect(hasCeilingWarning).toBe(true);
  });

  it('flags SHR non-compliance', () => {
    const room = createTestRoom({ length: 20, width: 20 }); // Large room
    const luminaire = createTestLuminaire({ maxSHR: 1.0 }); // Strict SHR limit
    const params = createTestDesignParams({
      requiredIlluminance: 100,  // Low requirement = few fixtures
      utilizationFactor: 0.9,
      maintenanceFactor: 0.95,
    });

    const result = performLightingCalculation(room, luminaire, params);

    // With very few fixtures, SHR should exceed max
    if (result.spacingToHeightRatio > luminaire.maxSHR) {
      expect(result.shrCompliant).toBe(false);
    }
  });

  it('calculates energy consumption for full year', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams({ operatingHoursPerDay: 12 });

    const result = performLightingCalculation(room, luminaire, params);

    // Verify annual calculation
    const expectedDailyKwh = (result.totalWatts * 12) / 1000;
    const expectedAnnualKwh = expectedDailyKwh * 365;

    expect(result.energyConsumptionKwhYear).toBeCloseTo(expectedAnnualKwh, 0);
  });

  it('includes IESNA standard reference', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams({ standard: LightingStandard.IESNA });

    const result = performLightingCalculation(room, luminaire, params);

    expect(result.standardReference).toContain('IESNA');
  });

  it('timestamps calculation results', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();

    const before = new Date().toISOString();
    const result = performLightingCalculation(room, luminaire, params);
    const after = new Date().toISOString();

    expect(result.calculatedAt >= before).toBe(true);
    expect(result.calculatedAt <= after).toBe(true);
  });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe('Edge Cases', () => {
  it('handles minimum valid room dimensions', () => {
    const room = createTestRoom({ length: 1, width: 1, height: 2 });
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();

    const result = performLightingCalculation(room, luminaire, params);

    expect(result.luminairesRounded).toBeGreaterThanOrEqual(1);
    expect(result.averageIlluminance).toBeGreaterThan(0);
  });

  it('handles maximum valid room dimensions', () => {
    const room = createTestRoom({ length: 100, width: 100, height: 20 });
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams();

    const result = performLightingCalculation(room, luminaire, params);

    expect(result.luminairesRounded).toBeGreaterThan(0);
    expect(Number.isFinite(result.averageIlluminance)).toBe(true);
  });

  it('handles high-efficacy luminaire', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire({ watts: 30, lumens: 6000, efficacy: 200 });
    const params = createTestDesignParams();

    const result = performLightingCalculation(room, luminaire, params);

    // High efficacy should require fewer fixtures
    const normalResult = performLightingCalculation(
      room,
      createTestLuminaire(),
      params
    );

    expect(result.luminairesRounded).toBeLessThanOrEqual(normalResult.luminairesRounded);
  });

  it('handles low maintenance factor (dirty environment)', () => {
    const room = createTestRoom();
    const luminaire = createTestLuminaire();
    const params = createTestDesignParams({ maintenanceFactor: 0.5 });

    const result = performLightingCalculation(room, luminaire, params);

    // Low MF should require more fixtures
    const normalResult = performLightingCalculation(
      room,
      luminaire,
      createTestDesignParams()
    );

    expect(result.luminairesRounded).toBeGreaterThan(normalResult.luminairesRounded);
  });
});
