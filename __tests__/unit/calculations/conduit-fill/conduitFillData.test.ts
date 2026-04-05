import { describe, it, expect } from 'vitest';
import {
  getConduitArea,
  getConductorArea,
  getAvailableTradeSizes,
  getFillLimit,
  CONDUIT_TYPES,
  INSULATION_TYPES,
  WIRE_SIZES,
} from '@/lib/calculations/conduit-fill/conduitFillData';

describe('NEC Chapter 9 Table Data', () => {
  describe('getConduitArea — NEC Table 4', () => {
    it('should return correct internal area for EMT 1/2"', () => {
      expect(getConduitArea('EMT', '1/2')).toBeCloseTo(0.304, 3);
    });

    it('should return correct internal area for EMT 3/4"', () => {
      expect(getConduitArea('EMT', '3/4')).toBeCloseTo(0.533, 3);
    });

    it('should return correct internal area for EMT 1"', () => {
      expect(getConduitArea('EMT', '1')).toBeCloseTo(0.864, 3);
    });

    it('should return correct internal area for EMT 1-1/4"', () => {
      expect(getConduitArea('EMT', '1-1/4')).toBeCloseTo(1.496, 3);
    });

    it('should return correct internal area for EMT 2"', () => {
      expect(getConduitArea('EMT', '2')).toBeCloseTo(3.356, 3);
    });

    it('should return correct internal area for EMT 4"', () => {
      expect(getConduitArea('EMT', '4')).toBeCloseTo(12.723, 3);
    });

    it('should return correct internal area for RMC 1"', () => {
      expect(getConduitArea('RMC', '1')).toBeCloseTo(0.916, 3);
    });

    it('should return correct internal area for IMC 1"', () => {
      expect(getConduitArea('IMC', '1')).toBeCloseTo(1.0, 3);
    });

    it('should return correct internal area for PVC40 1"', () => {
      expect(getConduitArea('PVC40', '1')).toBeCloseTo(0.916, 3);
    });

    it('should return correct internal area for PVC80 1"', () => {
      expect(getConduitArea('PVC80', '1')).toBeCloseTo(0.778, 3);
    });

    it('should return correct internal area for FMC 1"', () => {
      expect(getConduitArea('FMC', '1')).toBeCloseTo(0.817, 3);
    });

    it('should return correct internal area for LFMC 1"', () => {
      expect(getConduitArea('LFMC', '1')).toBeCloseTo(0.614, 3);
    });

    it('should throw for invalid conduit type/size combination', () => {
      expect(() => getConduitArea('EMT', '3/8')).toThrow();
    });

    it('should throw for invalid conduit type', () => {
      expect(() => getConduitArea('INVALID' as any, '1')).toThrow();
    });
  });

  describe('getConductorArea — NEC Table 5 / Table 8', () => {
    it('should return correct area for #14 THHN', () => {
      expect(getConductorArea('14', 'THHN', false)).toBeCloseTo(0.0097, 4);
    });

    it('should return correct area for #12 THHN', () => {
      expect(getConductorArea('12', 'THHN', false)).toBeCloseTo(0.0133, 4);
    });

    it('should return correct area for #10 THHN', () => {
      expect(getConductorArea('10', 'THHN', false)).toBeCloseTo(0.0211, 4);
    });

    it('should return correct area for #8 THHN', () => {
      expect(getConductorArea('8', 'THHN', false)).toBeCloseTo(0.0366, 4);
    });

    it('should return correct area for #6 THHN', () => {
      expect(getConductorArea('6', 'THHN', false)).toBeCloseTo(0.0507, 4);
    });

    it('should return correct area for #4 THHN', () => {
      expect(getConductorArea('4', 'THHN', false)).toBeCloseTo(0.0824, 4);
    });

    it('should return correct area for #2 THHN', () => {
      expect(getConductorArea('2', 'THHN', false)).toBeCloseTo(0.1158, 4);
    });

    it('should return correct area for #1 THHN', () => {
      expect(getConductorArea('1', 'THHN', false)).toBeCloseTo(0.1562, 4);
    });

    it('should return correct area for 1/0 THHN', () => {
      expect(getConductorArea('1/0', 'THHN', false)).toBeCloseTo(0.1855, 4);
    });

    it('should return correct area for 250 THHN', () => {
      expect(getConductorArea('250', 'THHN', false)).toBeCloseTo(0.3970, 4);
    });

    it('should return correct area for 500 THHN', () => {
      expect(getConductorArea('500', 'THHN', false)).toBeCloseTo(0.7073, 4);
    });

    it('should return correct area for #12 XHHW', () => {
      expect(getConductorArea('12', 'XHHW', false)).toBeCloseTo(0.0133, 4);
    });

    it('should return correct area for #6 THW', () => {
      expect(getConductorArea('6', 'THW', false)).toBeCloseTo(0.0726, 4);
    });

    it('should return correct area for #6 RHH_RHW', () => {
      expect(getConductorArea('6', 'RHH_RHW', false)).toBeCloseTo(0.0726, 4);
    });

    it('should return correct area for bare #6 conductor', () => {
      expect(getConductorArea('6', 'BARE', false)).toBeCloseTo(0.0270, 4);
    });

    it('should return correct area for bare #4 conductor', () => {
      expect(getConductorArea('4', 'BARE', false)).toBeCloseTo(0.0424, 4);
    });

    it('should throw for invalid wire size', () => {
      expect(() => getConductorArea('99', 'THHN', false)).toThrow();
    });

    it('should throw for invalid insulation type', () => {
      expect(() => getConductorArea('12', 'INVALID' as any, false)).toThrow();
    });
  });

  describe('getAvailableTradeSizes', () => {
    it('should return valid trade sizes for EMT (starts at 1/2")', () => {
      const sizes = getAvailableTradeSizes('EMT');
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes[0].imperial).toBe('1/2');
      expect(sizes[sizes.length - 1].imperial).toBe('4');
    });

    it('should return valid trade sizes for RMC (starts at 1/2")', () => {
      const sizes = getAvailableTradeSizes('RMC');
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes[0].imperial).toBe('1/2');
    });

    it('should return valid trade sizes for FMC (starts at 3/8")', () => {
      const sizes = getAvailableTradeSizes('FMC');
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes[0].imperial).toBe('3/8');
    });

    it('should return sizes in ascending order', () => {
      const sizes = getAvailableTradeSizes('EMT');
      for (let i = 1; i < sizes.length; i++) {
        expect(sizes[i].internalAreaSqIn).toBeGreaterThan(sizes[i - 1].internalAreaSqIn);
      }
    });

    it('should throw for invalid conduit type', () => {
      expect(() => getAvailableTradeSizes('INVALID' as any)).toThrow();
    });
  });

  describe('getFillLimit — NEC Table 1', () => {
    it('should return 53% for 1 conductor', () => {
      expect(getFillLimit(1, false)).toBe(53);
    });

    it('should return 31% for 2 conductors', () => {
      expect(getFillLimit(2, false)).toBe(31);
    });

    it('should return 40% for 3 conductors', () => {
      expect(getFillLimit(3, false)).toBe(40);
    });

    it('should return 40% for 10 conductors', () => {
      expect(getFillLimit(10, false)).toBe(40);
    });

    it('should return 60% for nipple mode regardless of count', () => {
      expect(getFillLimit(1, true)).toBe(60);
      expect(getFillLimit(2, true)).toBe(60);
      expect(getFillLimit(3, true)).toBe(60);
      expect(getFillLimit(10, true)).toBe(60);
    });
  });

  describe('Metadata arrays', () => {
    it('should export conduit types with id and label', () => {
      expect(CONDUIT_TYPES.length).toBe(12); // 7 NEC + 5 IEC
      const emt = CONDUIT_TYPES.find(t => t.id === 'EMT');
      expect(emt).toBeDefined();
      expect(emt!.label).toContain('EMT');
    });

    it('should export insulation types with id and label', () => {
      expect(INSULATION_TYPES.length).toBeGreaterThanOrEqual(9);
      const thhn = INSULATION_TYPES.find(t => t.id === 'THHN');
      expect(thhn).toBeDefined();
    });

    it('should export wire sizes in order', () => {
      expect(WIRE_SIZES.length).toBeGreaterThan(0);
      for (let i = 1; i < WIRE_SIZES.length; i++) {
        expect(WIRE_SIZES[i].sortOrder).toBeGreaterThan(WIRE_SIZES[i - 1].sortOrder);
      }
    });
  });
});
