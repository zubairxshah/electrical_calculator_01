import { describe, it, expect } from 'vitest';
import { calculateConduitFill, findMinimumConduitSize } from '@/lib/calculations/conduit-fill/conduitFillCalculator';
import type { ConduitFillInput, ConductorEntry } from '@/types/conduit-fill';

function makeConductor(wireSize: string, insulationType: string, quantity: number, areaSqIn: number): ConductorEntry {
  return {
    id: `test-${wireSize}-${insulationType}`,
    wireSize,
    insulationType: insulationType as any,
    quantity,
    isCompact: false,
    areaSqIn,
    areaMm2: areaSqIn * 645.16,
  };
}

function makeInput(overrides: Partial<ConduitFillInput> = {}): ConduitFillInput {
  return {
    standard: 'NEC',
    conduitType: 'EMT',
    tradeSize: '3/4',
    conductors: [],
    isNipple: false,
    unitSystem: 'imperial',
    projectName: '',
    projectRef: '',
    ...overrides,
  };
}

describe('Conduit Fill Calculator', () => {
  describe('calculateConduitFill', () => {
    it('should calculate fill for single conductor (53% limit)', () => {
      // 1x #4 THHN in EMT 1/2" — area 0.0824 in², conduit 0.304 in²
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '1/2',
        conductors: [makeConductor('4', 'THHN', 1, 0.0824)],
      });
      const result = calculateConduitFill(input);
      expect(result.fillLimit).toBe(53);
      expect(result.totalConductorCount).toBe(1);
      expect(result.totalConductorArea).toBeCloseTo(0.0824, 4);
      expect(result.fillPercentage).toBeCloseTo((0.0824 / 0.304) * 100, 1);
      expect(result.pass).toBe(true);
    });

    it('should calculate fill for two conductors (31% limit)', () => {
      // 2x #12 THHN in EMT 1/2" — area 0.0133 each, conduit 0.304 in²
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '1/2',
        conductors: [makeConductor('12', 'THHN', 2, 0.0133)],
      });
      const result = calculateConduitFill(input);
      expect(result.fillLimit).toBe(31);
      expect(result.totalConductorCount).toBe(2);
      expect(result.totalConductorArea).toBeCloseTo(0.0266, 4);
      expect(result.pass).toBe(true);
    });

    it('should calculate fill for 3+ conductors (40% limit)', () => {
      // 3x #12 THHN in EMT 3/4" — area 0.0133 each, conduit 0.533 in²
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '3/4',
        conductors: [makeConductor('12', 'THHN', 3, 0.0133)],
      });
      const result = calculateConduitFill(input);
      expect(result.fillLimit).toBe(40);
      expect(result.totalConductorCount).toBe(3);
      expect(result.totalConductorArea).toBeCloseTo(0.0399, 4);
      // Fill: 0.0399 / 0.533 * 100 ≈ 7.49% — well under 40%
      expect(result.pass).toBe(true);
    });

    it('should correctly identify overfill (FAIL)', () => {
      // 4x #10 THWN in EMT 1/2" — area 0.0243 each = 0.0972 total, conduit 0.304
      // Fill: 0.0972 / 0.304 * 100 ≈ 31.97% — limit is 40%, should pass
      // Let's use bigger wires: 6x #6 THHN = 0.0507 * 6 = 0.3042, conduit 0.304
      // Fill: 0.3042 / 0.304 * 100 ≈ 100.07% — FAIL
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '1/2',
        conductors: [makeConductor('6', 'THHN', 6, 0.0507)],
      });
      const result = calculateConduitFill(input);
      expect(result.pass).toBe(false);
      expect(result.fillPercentage).toBeGreaterThan(40);
    });

    it('should handle mixed conductor types and sizes', () => {
      // 3x #10 THHN (0.0211 each) + 1x #12 THHN ground (0.0133)
      // Total: 0.0633 + 0.0133 = 0.0766, conduit EMT 3/4" = 0.533
      // Count: 4 total, limit 40%
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '3/4',
        conductors: [
          makeConductor('10', 'THHN', 3, 0.0211),
          makeConductor('12', 'THHN', 1, 0.0133),
        ],
      });
      const result = calculateConduitFill(input);
      expect(result.totalConductorCount).toBe(4);
      expect(result.fillLimit).toBe(40);
      expect(result.totalConductorArea).toBeCloseTo(0.0766, 4);
      expect(result.fillPercentage).toBeCloseTo((0.0766 / 0.533) * 100, 1);
      expect(result.pass).toBe(true);
      expect(result.conductorDetails).toHaveLength(2);
    });

    it('should calculate remaining area correctly', () => {
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '3/4',
        conductors: [makeConductor('12', 'THHN', 3, 0.0133)],
      });
      const result = calculateConduitFill(input);
      const allowable = 0.533 * (40 / 100);
      expect(result.remainingArea).toBeCloseTo(allowable - 0.0399, 4);
    });

    it('should calculate utilization ratio correctly', () => {
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '3/4',
        conductors: [makeConductor('12', 'THHN', 3, 0.0133)],
      });
      const result = calculateConduitFill(input);
      expect(result.utilizationRatio).toBeCloseTo(result.fillPercentage / result.fillLimit, 2);
    });

    it('should include NEC references in result', () => {
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '3/4',
        conductors: [makeConductor('12', 'THHN', 3, 0.0133)],
      });
      const result = calculateConduitFill(input);
      expect(result.necReferences).toContain('NEC Table 1');
      expect(result.necReferences).toContain('NEC Chapter 9 Table 4');
    });

    it('should provide per-conductor detail breakdown', () => {
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '3/4',
        conductors: [
          makeConductor('10', 'THHN', 3, 0.0211),
          makeConductor('12', 'THHN', 1, 0.0133),
        ],
      });
      const result = calculateConduitFill(input);
      expect(result.conductorDetails).toHaveLength(2);

      const detail0 = result.conductorDetails[0];
      expect(detail0.wireSize).toBe('10');
      expect(detail0.quantity).toBe(3);
      expect(detail0.areaPerConductor).toBeCloseTo(0.0211, 4);
      expect(detail0.totalArea).toBeCloseTo(0.0633, 4);
    });

    it('should throw for empty conductor list', () => {
      const input = makeInput({ conductors: [] });
      expect(() => calculateConduitFill(input)).toThrow();
    });

    // NEC Annex C cross-reference: EMT 3/4" with THHN
    // Annex C Table C.1: EMT 3/4" can hold 16x #12 THHN
    it('should match NEC Annex C — EMT 3/4" holds 16x #12 THHN at 40% fill', () => {
      // 16x #12 THHN = 16 * 0.0133 = 0.2128 in²
      // EMT 3/4" = 0.533 in��, 40% fill = 0.2132 in²
      // 0.2128 ≤ 0.2132 → PASS (just barely)
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '3/4',
        conductors: [makeConductor('12', 'THHN', 16, 0.0133)],
      });
      const result = calculateConduitFill(input);
      expect(result.pass).toBe(true);
    });

    it('should match NEC Annex C — EMT 3/4" cannot hold 17x #12 THHN', () => {
      // 17x #12 THHN = 17 * 0.0133 = 0.2261 in²
      // EMT 3/4" 40% fill = 0.2132 in²
      // 0.2261 > 0.2132 → FAIL
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '3/4',
        conductors: [makeConductor('12', 'THHN', 17, 0.0133)],
      });
      const result = calculateConduitFill(input);
      expect(result.pass).toBe(false);
    });

    // Annex C Table C.1: EMT 1" can hold 9x #10 THHN
    it('should match NEC Annex C — EMT 1" holds 9x #10 THHN', () => {
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '1',
        conductors: [makeConductor('10', 'THHN', 9, 0.0211)],
      });
      const result = calculateConduitFill(input);
      // 9 * 0.0211 = 0.1899, EMT 1" = 0.864, 40% = 0.3456
      expect(result.pass).toBe(true);
    });

    // Nipple mode tests
    it('should apply 60% fill limit in nipple mode', () => {
      const input = makeInput({
        conduitType: 'EMT',
        tradeSize: '1/2',
        conductors: [makeConductor('12', 'THHN', 5, 0.0133)],
        isNipple: true,
      });
      const result = calculateConduitFill(input);
      expect(result.fillLimit).toBe(60);
    });
  });

  describe('findMinimumConduitSize', () => {
    it('should find minimum EMT size for 4x #8 THHN', () => {
      const conductors = [makeConductor('8', 'THHN', 4, 0.0366)];
      const result = findMinimumConduitSize('EMT', conductors, false);
      // 4 * 0.0366 = 0.1464, need conduit with 40% area ≥ 0.1464
      // EMT 3/4" = 0.533, 40% = 0.2132 → PASS
      expect(result).not.toBeNull();
      expect(result!.imperial).toBe('3/4');
    });

    it('should find minimum EMT size for 3x #6 THHN', () => {
      const conductors = [makeConductor('6', 'THHN', 3, 0.0507)];
      const result = findMinimumConduitSize('EMT', conductors, false);
      // 3 * 0.0507 = 0.1521, need 40% area ≥ 0.1521
      // EMT 3/4" = 0.533, 40% = 0.2132 → PASS
      expect(result).not.toBeNull();
      expect(result!.imperial).toBe('3/4');
    });

    it('should return null when no conduit fits', () => {
      // Extreme case: 100x 500kcmil THHN = 100 * 0.7073 = 70.73 in²
      const conductors = [makeConductor('500', 'THHN', 100, 0.7073)];
      const result = findMinimumConduitSize('EMT', conductors, false);
      expect(result).toBeNull();
    });

    it('should use 60% limit in nipple mode', () => {
      const conductors = [makeConductor('8', 'THHN', 4, 0.0366)];
      const normalResult = findMinimumConduitSize('EMT', conductors, false);
      const nippleResult = findMinimumConduitSize('EMT', conductors, true);
      // Nipple mode allows more fill, so minimum size may be smaller or equal
      expect(nippleResult).not.toBeNull();
      if (normalResult && nippleResult) {
        expect(nippleResult.internalAreaSqIn).toBeLessThanOrEqual(normalResult.internalAreaSqIn);
      }
    });
  });
});
