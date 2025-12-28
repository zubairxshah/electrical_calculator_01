/**
 * Load Current Calculation Tests
 *
 * Tests for NEC and IEC load current calculations using Math.js BigNumber precision.
 * Validates single-phase and three-phase formulas against reference calculations.
 *
 * Reference:
 * - Single-phase: I = P / (V × PF)
 * - Three-phase: I = P / (√3 × V × PF)
 *
 * Accuracy requirement: ±0.5A per SC-002
 */

import { describe, it, expect } from 'vitest';
import { calculateLoadCurrent } from '@/lib/calculations/breaker/loadCurrent';

describe('Load Current Calculation - Single-Phase', () => {
  it('should calculate correct current for NEC reference case: 10kW @ 240V, PF=0.9', () => {
    // Reference: specs/003-circuit-breaker-sizing/research.md Category 1, Test Case 3
    // Expected: I = 10000 / (240 × 0.9) = 46.296... ≈ 46.3A
    const result = calculateLoadCurrent({
      power: 10,        // kW
      voltage: 240,     // V
      phase: 'single',
      powerFactor: 0.9,
      standard: 'NEC'
    });

    expect(result.currentAmps).toBeCloseTo(46.3, 1);  // ±0.5A tolerance
    expect(result.formula).toContain('I = P / (V × PF)');
  });

  it('should calculate current for 2kW @ 120V, PF=1.0 (purely resistive)', () => {
    // Reference: Category 1, Test Case 1
    // Expected: I = 2000 / (120 × 1.0) = 16.67A
    const result = calculateLoadCurrent({
      power: 2,
      voltage: 120,
      phase: 'single',
      powerFactor: 1.0,
      standard: 'NEC'
    });

    expect(result.currentAmps).toBeCloseTo(16.67, 1);
  });

  it('should calculate current for 5kW @ 208V, PF=0.9', () => {
    // Reference: Category 1, Test Case 5
    // Expected: I = 5000 / (208 × 0.9) = 26.74A
    const result = calculateLoadCurrent({
      power: 5,
      voltage: 208,
      phase: 'single',
      powerFactor: 0.9,
      standard: 'NEC'
    });

    expect(result.currentAmps).toBeCloseTo(26.74, 1);
  });

  it('should calculate current for high voltage: 3kW @ 480V, PF=1.0', () => {
    // Reference: Category 1, Test Case 7
    // Expected: I = 3000 / (480 × 1.0) = 6.25A
    const result = calculateLoadCurrent({
      power: 3,
      voltage: 480,
      phase: 'single',
      powerFactor: 1.0,
      standard: 'NEC'
    });

    expect(result.currentAmps).toBeCloseTo(6.25, 1);
  });

  it('should handle low power factor (0.85)', () => {
    // Reference: Category 1, Test Case 4
    // Expected: I = 15000 / (240 × 0.85) = 73.53A
    const result = calculateLoadCurrent({
      power: 15,
      voltage: 240,
      phase: 'single',
      powerFactor: 0.85,
      standard: 'NEC'
    });

    expect(result.currentAmps).toBeCloseTo(73.53, 1);
  });
});

describe('Load Current Calculation - Three-Phase', () => {
  it('should calculate correct current for three-phase: 50kW @ 400V, PF=0.9', () => {
    // Reference: Category 2, Test Case 10
    // Expected: I = 50000 / (√3 × 400 × 0.9) = 50000 / 623.54 = 80.18A
    const result = calculateLoadCurrent({
      power: 50,
      voltage: 400,
      phase: 'three',
      powerFactor: 0.9,
      standard: 'IEC'
    });

    expect(result.currentAmps).toBeCloseTo(80.18, 1);  // ±0.5A tolerance
    expect(result.formula).toContain('√3');
  });

  it('should calculate current for 10kW @ 208V 3-phase, PF=0.9', () => {
    // Reference: Category 2, Test Case 8
    // Expected: I = 10000 / (√3 × 208 × 0.9) = 30.85A
    const result = calculateLoadCurrent({
      power: 10,
      voltage: 208,
      phase: 'three',
      powerFactor: 0.9,
      standard: 'NEC'
    });

    expect(result.currentAmps).toBeCloseTo(30.85, 1);
  });

  it('should calculate current for 25kW @ 208V 3-phase, PF=0.85', () => {
    // Reference: Category 2, Test Case 9
    // Expected: I = 25000 / (√3 × 208 × 0.85) = 81.64A
    const result = calculateLoadCurrent({
      power: 25,
      voltage: 208,
      phase: 'three',
      powerFactor: 0.85,
      standard: 'NEC'
    });

    expect(result.currentAmps).toBeCloseTo(81.64, 1);
  });

  it('should calculate current for 100kW @ 480V 3-phase, PF=0.9', () => {
    // Reference: Category 2, Test Case 12
    // Expected: I = 100000 / (√3 × 480 × 0.9) = 133.65A
    const result = calculateLoadCurrent({
      power: 100,
      voltage: 480,
      phase: 'three',
      powerFactor: 0.9,
      standard: 'NEC'
    });

    expect(result.currentAmps).toBeCloseTo(133.65, 1);
  });
});

describe('Load Current Calculation - Direct Amperage Input', () => {
  it('should pass through current when input mode is amps', () => {
    // When user enters amperage directly, no calculation needed
    const result = calculateLoadCurrent({
      current: 50,      // A (direct input)
      voltage: 240,
      phase: 'single',
      standard: 'NEC'
    });

    expect(result.currentAmps).toBe(50);
    expect(result.formula).toContain('I = (user input)');
  });

  it('should handle fractional amperage input', () => {
    const result = calculateLoadCurrent({
      current: 46.5,
      voltage: 400,
      phase: 'three',
      standard: 'IEC'
    });

    expect(result.currentAmps).toBe(46.5);
  });
});

describe('Load Current Calculation - Edge Cases', () => {
  it('should handle unusual voltage: 380V (common in some countries)', () => {
    // Reference: Category 10, Test Case 42
    const result = calculateLoadCurrent({
      power: 30,
      voltage: 380,
      phase: 'three',
      powerFactor: 0.9,
      standard: 'IEC'
    });

    // Expected: I = 30000 / (√3 × 380 × 0.9) = 50.64A
    expect(result.currentAmps).toBeCloseTo(50.64, 1);
  });

  it('should handle unusual voltage: 415V (Australia/UK)', () => {
    // Reference: Category 10, Test Case 43
    const result = calculateLoadCurrent({
      power: 30,
      voltage: 415,
      phase: 'three',
      powerFactor: 0.9,
      standard: 'IEC'
    });

    // Expected: I = 30000 / (√3 × 415 × 0.9) = 46.42A
    expect(result.currentAmps).toBeCloseTo(46.42, 1);
  });

  it('should handle very small loads: 0.001 kW', () => {
    // Reference: Category 10, Test Case 52
    const result = calculateLoadCurrent({
      power: 0.001,
      voltage: 120,
      phase: 'single',
      powerFactor: 1.0,
      standard: 'NEC'
    });

    // Expected: I = 1 / (120 × 1.0) = 0.00833A
    expect(result.currentAmps).toBeCloseTo(0.00833, 4);
  });

  it('should handle very large loads: 1000 kW', () => {
    // Reference: Category 10, Test Case 53 (adjusted)
    const result = calculateLoadCurrent({
      power: 1000,
      voltage: 480,
      phase: 'three',
      powerFactor: 0.95,
      standard: 'NEC'
    });

    // Expected: I = 1000000 / (√3 × 480 × 0.95) = 1266.12A
    expect(result.currentAmps).toBeCloseTo(1266.12, 1);
  });
});

describe('Load Current Calculation - IEC Standard', () => {
  it('should calculate correctly for IEC 230V single-phase', () => {
    // Reference: Category 3, Test Case 13
    const result = calculateLoadCurrent({
      current: 16,
      voltage: 230,
      phase: 'single',
      standard: 'IEC'
    });

    expect(result.currentAmps).toBe(16);
  });

  it('should calculate correctly for IEC 400V three-phase', () => {
    // Reference: Category 3, Test Case 15
    const result = calculateLoadCurrent({
      current: 50,
      voltage: 400,
      phase: 'three',
      standard: 'IEC'
    });

    expect(result.currentAmps).toBe(50);
  });
});

describe('Load Current Calculation - Metadata', () => {
  it('should include correct formula in result', () => {
    const result = calculateLoadCurrent({
      power: 10,
      voltage: 240,
      phase: 'single',
      powerFactor: 0.9,
      standard: 'NEC'
    });

    expect(result.formula).toBe('I = P / (V × PF)');
  });

  it('should include correct three-phase formula in result', () => {
    const result = calculateLoadCurrent({
      power: 50,
      voltage: 400,
      phase: 'three',
      powerFactor: 0.9,
      standard: 'IEC'
    });

    expect(result.formula).toBe('I = P / (√3 × V × PF)');
  });

  it('should include component values in result', () => {
    const result = calculateLoadCurrent({
      power: 10,
      voltage: 240,
      phase: 'single',
      powerFactor: 0.9,
      standard: 'NEC'
    });

    expect(result.components).toEqual({
      voltage: 240,
      phase: 'single',
      power: 10,
      powerFactor: 0.9
    });
  });
});
