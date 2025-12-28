/**
 * Safety Factor Application Tests
 *
 * Tests for NEC 125% continuous load safety factor and IEC correction factors.
 *
 * NEC: Per Article 210.20(A), continuous loads require 125% factor
 * IEC: No additional safety factor (correction factors applied separately)
 *
 * Reference: specs/003-circuit-breaker-sizing/research.md Section 1
 */

import { describe, it, expect } from 'vitest';
import { applySafetyFactor } from '@/lib/calculations/breaker/safetyFactors';

describe('Safety Factor Application - NEC', () => {
  it('should apply 125% factor for NEC continuous load: 46.3A × 1.25 = 57.875A', () => {
    // Reference: NEC 210.20(A) requirement
    // Test Case: 10kW @ 240V, PF=0.9 → 46.3A load current
    // Expected minimum breaker: 46.3 × 1.25 = 57.875A
    const result = applySafetyFactor({
      loadCurrent: 46.3,
      standard: 'NEC',
      loadType: 'continuous'
    });

    expect(result.minimumBreakerSize).toBeCloseTo(57.875, 2);
    expect(result.safetyFactor).toBe(1.25);
    expect(result.factorType).toBe('continuous-load');
    expect(result.codeReference).toContain('NEC 210.20(A)');
  });

  it('should apply 125% factor for various NEC loads', () => {
    const testCases = [
      { current: 20, expected: 25 },      // 20A × 1.25 = 25A
      { current: 30, expected: 37.5 },    // 30A × 1.25 = 37.5A
      { current: 50, expected: 62.5 },    // 50A × 1.25 = 62.5A
      { current: 80, expected: 100 },     // 80A × 1.25 = 100A
      { current: 100, expected: 125 },    // 100A × 1.25 = 125A
    ];

    testCases.forEach(({ current, expected }) => {
      const result = applySafetyFactor({
        loadCurrent: current,
        standard: 'NEC',
        loadType: 'continuous'
      });

      expect(result.minimumBreakerSize).toBeCloseTo(expected, 2);
    });
  });

  it('should apply 125% factor for fractional currents', () => {
    // Test with non-integer load currents
    const result = applySafetyFactor({
      loadCurrent: 73.53,  // From test case: 15kW @ 240V, PF=0.85
      standard: 'NEC',
      loadType: 'continuous'
    });

    // Expected: 73.53 × 1.25 = 91.9125A
    expect(result.minimumBreakerSize).toBeCloseTo(91.91, 1);
  });

  it('should maintain high precision for large currents', () => {
    // Test with very large industrial loads
    const result = applySafetyFactor({
      loadCurrent: 1264.9,  // 1000kW @ 480V 3-phase
      standard: 'NEC',
      loadType: 'continuous'
    });

    // Expected: 1264.9 × 1.25 = 1581.125A
    expect(result.minimumBreakerSize).toBeCloseTo(1581.13, 1);
  });

  it('should handle small currents with precision', () => {
    const result = applySafetyFactor({
      loadCurrent: 6.25,  // 3kW @ 480V
      standard: 'NEC',
      loadType: 'continuous'
    });

    // Expected: 6.25 × 1.25 = 7.8125A
    expect(result.minimumBreakerSize).toBeCloseTo(7.8125, 4);
  });
});

describe('Safety Factor Application - IEC', () => {
  it('should apply 1.0 factor (no additional safety factor) for IEC', () => {
    // Reference: IEC 60364-5-52 uses correction factors, not safety multiplier
    const result = applySafetyFactor({
      loadCurrent: 50,
      standard: 'IEC',
      loadType: 'continuous'
    });

    expect(result.minimumBreakerSize).toBe(50);
    expect(result.safetyFactor).toBe(1.0);
    expect(result.factorType).toBe('correction-factor');
    expect(result.codeReference).toContain('IEC 60364-5-52');
  });

  it('should pass through current unchanged for IEC loads', () => {
    const testCases = [16, 32, 50, 80, 100, 125, 160, 200];

    testCases.forEach(current => {
      const result = applySafetyFactor({
        loadCurrent: current,
        standard: 'IEC',
        loadType: 'continuous'
      });

      expect(result.minimumBreakerSize).toBe(current);
      expect(result.safetyFactor).toBe(1.0);
    });
  });

  it('should maintain precision for IEC fractional currents', () => {
    const result = applySafetyFactor({
      loadCurrent: 80.18,  // 50kW @ 400V 3-phase, PF=0.9
      standard: 'IEC',
      loadType: 'continuous'
    });

    expect(result.minimumBreakerSize).toBe(80.18);
  });
});

describe('Safety Factor - Edge Cases', () => {
  it('should handle zero current (edge case)', () => {
    const result = applySafetyFactor({
      loadCurrent: 0,
      standard: 'NEC',
      loadType: 'continuous'
    });

    expect(result.minimumBreakerSize).toBe(0);
  });

  it('should handle very small currents', () => {
    const result = applySafetyFactor({
      loadCurrent: 0.00833,  // 0.001kW @ 120V
      standard: 'NEC',
      loadType: 'continuous'
    });

    // Expected: 0.00833 × 1.25 = 0.0104125A
    expect(result.minimumBreakerSize).toBeCloseTo(0.0104, 4);
  });

  it('should handle maximum expected currents', () => {
    const result = applySafetyFactor({
      loadCurrent: 3200,  // Near maximum standard breaker rating
      standard: 'NEC',
      loadType: 'continuous'
    });

    // Expected: 3200 × 1.25 = 4000A (at maximum standard rating)
    expect(result.minimumBreakerSize).toBe(4000);
  });
});

describe('Safety Factor - Metadata Validation', () => {
  it('should include correct NEC code reference', () => {
    const result = applySafetyFactor({
      loadCurrent: 50,
      standard: 'NEC',
      loadType: 'continuous'
    });

    expect(result.codeReference).toBe('NEC 210.20(A)');
  });

  it('should include correct IEC code reference', () => {
    const result = applySafetyFactor({
      loadCurrent: 50,
      standard: 'IEC',
      loadType: 'continuous'
    });

    expect(result.codeReference).toBe('IEC 60364-5-52');
  });

  it('should identify NEC factor type as continuous-load', () => {
    const result = applySafetyFactor({
      loadCurrent: 50,
      standard: 'NEC',
      loadType: 'continuous'
    });

    expect(result.factorType).toBe('continuous-load');
  });

  it('should identify IEC factor type as correction-factor', () => {
    const result = applySafetyFactor({
      loadCurrent: 50,
      standard: 'IEC',
      loadType: 'continuous'
    });

    expect(result.factorType).toBe('correction-factor');
  });
});

describe('Safety Factor - NEC vs IEC Comparison', () => {
  it('should show difference between NEC and IEC for same load', () => {
    const load = 100;

    const necResult = applySafetyFactor({
      loadCurrent: load,
      standard: 'NEC',
      loadType: 'continuous'
    });

    const iecResult = applySafetyFactor({
      loadCurrent: load,
      standard: 'IEC',
      loadType: 'continuous'
    });

    // NEC requires 25% higher breaker for same load
    expect(necResult.minimumBreakerSize).toBe(125);  // 100 × 1.25
    expect(iecResult.minimumBreakerSize).toBe(100);  // 100 × 1.0
    expect(necResult.minimumBreakerSize).toBeGreaterThan(iecResult.minimumBreakerSize);
  });
});
