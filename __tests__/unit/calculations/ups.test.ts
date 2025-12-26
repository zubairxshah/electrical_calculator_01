/**
 * UPS Sizing Calculator Tests
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Tests for IEEE 1100 diversity factor calculations and UPS sizing
 * TDD Red Phase: Write tests FIRST, ensure they FAIL before implementation
 */

import { describe, it, expect } from 'vitest';

// T063: Test IEEE 1100 diversity factor formula
describe('UPS Diversity Factor (IEEE 1100)', () => {
  // Import will fail initially (Red phase)
  // import { calculateDiversityFactor } from '@/lib/calculations/ups/diversityFactor';

  it('should return 1.0 for 3 or fewer loads (N≤3)', async () => {
    const { calculateDiversityFactor } = await import('@/lib/calculations/ups/diversityFactor');

    expect(calculateDiversityFactor(1)).toBe(1.0);
    expect(calculateDiversityFactor(2)).toBe(1.0);
    expect(calculateDiversityFactor(3)).toBe(1.0);
  });

  it('should apply formula 0.9 + 0.1/N for loads between 3 and 10 (3<N≤10)', async () => {
    const { calculateDiversityFactor } = await import('@/lib/calculations/ups/diversityFactor');

    // N=4: 0.9 + 0.1/4 = 0.925
    expect(calculateDiversityFactor(4)).toBeCloseTo(0.925, 3);

    // N=5: 0.9 + 0.1/5 = 0.92
    expect(calculateDiversityFactor(5)).toBeCloseTo(0.920, 3);

    // N=10: 0.9 + 0.1/10 = 0.91
    expect(calculateDiversityFactor(10)).toBeCloseTo(0.910, 3);
  });

  it('should return 0.85 for more than 10 loads (N>10)', async () => {
    const { calculateDiversityFactor } = await import('@/lib/calculations/ups/diversityFactor');

    expect(calculateDiversityFactor(11)).toBe(0.85);
    expect(calculateDiversityFactor(50)).toBe(0.85);
    expect(calculateDiversityFactor(100)).toBe(0.85);
  });

  it('should handle edge case of 0 loads', async () => {
    const { calculateDiversityFactor } = await import('@/lib/calculations/ups/diversityFactor');

    // 0 loads should return 1.0 (no diversity needed)
    expect(calculateDiversityFactor(0)).toBe(1.0);
  });
});

// T064: Test power factor conversion (VA ↔ W)
describe('Power Factor Conversion', () => {
  it('should convert Watts to VA with default 0.8 power factor', async () => {
    const { convertWattsToVA } = await import('@/lib/calculations/ups/powerFactor');

    // 1000W at 0.8 PF = 1250 VA
    expect(convertWattsToVA(1000)).toBe(1250);

    // 500W at 0.8 PF = 625 VA
    expect(convertWattsToVA(500)).toBe(625);
  });

  it('should convert Watts to VA with custom power factor', async () => {
    const { convertWattsToVA } = await import('@/lib/calculations/ups/powerFactor');

    // 1000W at 0.9 PF = 1111.11 VA
    expect(convertWattsToVA(1000, 0.9)).toBeCloseTo(1111.11, 1);

    // 1000W at 1.0 PF = 1000 VA
    expect(convertWattsToVA(1000, 1.0)).toBe(1000);
  });

  it('should convert VA to Watts', async () => {
    const { convertVAToWatts } = await import('@/lib/calculations/ups/powerFactor');

    // 1000 VA at 0.8 PF = 800W
    expect(convertVAToWatts(1000, 0.8)).toBe(800);

    // 1250 VA at 0.8 PF = 1000W
    expect(convertVAToWatts(1250, 0.8)).toBe(1000);
  });

  it('should handle edge case of 0 power', async () => {
    const { convertWattsToVA, convertVAToWatts } = await import('@/lib/calculations/ups/powerFactor');

    expect(convertWattsToVA(0)).toBe(0);
    expect(convertVAToWatts(0, 0.8)).toBe(0);
  });
});

// T065: Test UPS sizing with 25% growth margin
describe('UPS Sizing', () => {
  it('should calculate total load from load list', async () => {
    const { calculateTotalLoad } = await import('@/lib/calculations/ups/sizing');

    const loads = [
      { name: 'Servers', powerVA: 2500, quantity: 5 },      // 12,500 VA
      { name: 'Switches', powerVA: 100, quantity: 10 },     // 1,000 VA
    ];

    // Total: 13,500 VA
    expect(calculateTotalLoad(loads)).toBe(13500);
  });

  it('should apply diversity factor to total load', async () => {
    const { calculateEffectiveLoad } = await import('@/lib/calculations/ups/sizing');

    // 15 loads, diversity = 0.85
    // 10,000 VA * 0.85 = 8,500 VA
    expect(calculateEffectiveLoad(10000, 15)).toBe(8500);
  });

  it('should apply 25% growth margin', async () => {
    const { applyGrowthMargin } = await import('@/lib/calculations/ups/sizing');

    // 8,500 VA * 1.25 = 10,625 VA
    expect(applyGrowthMargin(8500, 0.25)).toBe(10625);
  });

  it('should recommend standard UPS size that exceeds required kVA', async () => {
    const { recommendUPSSize } = await import('@/lib/calculations/ups/sizing');

    // Standard sizes: [10, 20, 30, 40, 60, 80, 100, 120, 160, 200] kVA

    // 25 kVA required → recommend 30 kVA
    expect(recommendUPSSize(25)).toBe(30);

    // 10 kVA required → recommend 10 kVA (exact match)
    expect(recommendUPSSize(10)).toBe(10);

    // 75 kVA required → recommend 80 kVA
    expect(recommendUPSSize(75)).toBe(80);

    // 5 kVA required → recommend 10 kVA (minimum size)
    expect(recommendUPSSize(5)).toBe(10);
  });

  it('should handle edge case of load exceeding maximum standard size', async () => {
    const { recommendUPSSize } = await import('@/lib/calculations/ups/sizing');

    // 250 kVA exceeds max 200 kVA - should return null or indicate parallel units needed
    const result = recommendUPSSize(250);
    expect(result).toBeNull();
  });

  it('should perform complete UPS sizing calculation', async () => {
    const { calculateUPSSizing } = await import('@/lib/calculations/ups/sizing');

    const loads = [
      { name: 'Servers', powerVA: 500, quantity: 5 },       // 2,500 VA
      { name: 'Switches', powerVA: 100, quantity: 10 },     // 1,000 VA
    ];

    const result = calculateUPSSizing(loads, 0.25);

    // Total: 3,500 VA
    expect(result.totalLoadVA).toBe(3500);

    // 15 items, diversity = 0.85
    expect(result.diversityFactor).toBe(0.85);

    // Effective: 3,500 * 0.85 = 2,975 VA
    expect(result.effectiveLoadVA).toBe(2975);

    // With growth: 2,975 * 1.25 = 3,718.75 VA = 3.72 kVA
    expect(result.loadWithGrowthVA).toBeCloseTo(3718.75, 1);
    expect(result.loadWithGrowthKVA).toBeCloseTo(3.72, 1);

    // Recommended: 10 kVA (smallest standard size that fits)
    expect(result.recommendedUPSKVA).toBe(10);
  });
});
