/**
 * Standard Breaker Rating Lookup Tests
 *
 * Tests for finding the smallest standard breaker rating ≥ calculated minimum.
 * Validates NEC and IEC standard ratings with binary search optimization.
 *
 * NEC Ratings: 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, ...4000A
 * IEC Ratings: 6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, ...4000A
 *
 * Reference: specs/003-circuit-breaker-sizing/research.md Section 3
 */

import { describe, it, expect } from 'vitest';
import { recommendStandardBreaker } from '@/lib/standards/breakerRatings';

describe('Standard Breaker Rating Lookup - NEC', () => {
  it('should recommend 60A for 57.9A minimum (reference case)', () => {
    // Reference: 10kW @ 240V, PF=0.9 → 46.3A × 1.25 = 57.9A
    // Next standard NEC rating ≥ 57.9A is 60A
    const recommended = recommendStandardBreaker(57.9, 'NEC');

    expect(recommended).toBe(60);
  });

  it('should recommend exact rating when minimum matches standard', () => {
    // Test when calculated minimum is exactly a standard rating
    const testCases = [
      { minimum: 20, expected: 20 },
      { minimum: 30, expected: 30 },
      { minimum: 50, expected: 50 },
      { minimum: 100, expected: 100 },
      { minimum: 200, expected: 200 },
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'NEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should round up to next standard rating for in-between values', () => {
    const testCases = [
      { minimum: 16, expected: 20 },     // Between 15 and 20
      { minimum: 22, expected: 25 },     // Between 20 and 25
      { minimum: 47, expected: 50 },     // Between 45 and 50
      { minimum: 55, expected: 60 },     // Between 50 and 60
      { minimum: 75, expected: 80 },     // Between 70 and 80
      { minimum: 95, expected: 100 },    // Between 90 and 100
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'NEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should handle boundary cases at rating gaps', () => {
    // Test right at the edge of rating boundaries
    const testCases = [
      { minimum: 20.01, expected: 25 },
      { minimum: 49.99, expected: 50 },
      { minimum: 60.01, expected: 70 },
      { minimum: 99.99, expected: 100 },
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'NEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should handle large industrial currents', () => {
    const testCases = [
      { minimum: 150, expected: 150 },
      { minimum: 158, expected: 175 },
      { minimum: 225, expected: 225 },
      { minimum: 275, expected: 300 },
      { minimum: 500, expected: 500 },
      { minimum: 650, expected: 700 },
      { minimum: 1500, expected: 1600 },
      { minimum: 2200, expected: 2500 },
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'NEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should handle maximum rating: 4000A', () => {
    const recommended = recommendStandardBreaker(4000, 'NEC');
    expect(recommended).toBe(4000);
  });

  it('should return null when exceeding maximum available rating', () => {
    // When calculated minimum exceeds largest standard breaker
    const recommended = recommendStandardBreaker(4500, 'NEC');
    expect(recommended).toBeNull();

    const recommended2 = recommendStandardBreaker(5000, 'NEC');
    expect(recommended2).toBeNull();
  });

  it('should handle very small currents', () => {
    const testCases = [
      { minimum: 0.1, expected: 15 },    // Minimum NEC rating is 15A
      { minimum: 7.5, expected: 15 },
      { minimum: 14.9, expected: 15 },
      { minimum: 15.0, expected: 15 },
      { minimum: 15.1, expected: 20 },
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'NEC');
      expect(recommended).toBe(expected);
    });
  });
});

describe('Standard Breaker Rating Lookup - IEC', () => {
  it('should recommend 63A for 52.1A minimum (IEC reference)', () => {
    // Reference: Similar load as NEC but IEC standards
    // IEC: 50A load × 1.0 (no safety factor) = 50A
    // But with slightly higher current: 52.1A
    // Next standard IEC rating ≥ 52.1A is 63A
    const recommended = recommendStandardBreaker(52.1, 'IEC');

    expect(recommended).toBe(63);
  });

  it('should recommend exact rating when minimum matches standard', () => {
    const testCases = [
      { minimum: 16, expected: 16 },
      { minimum: 32, expected: 32 },
      { minimum: 50, expected: 50 },
      { minimum: 63, expected: 63 },
      { minimum: 100, expected: 100 },
      { minimum: 160, expected: 160 },
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'IEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should round up to next standard rating for in-between values', () => {
    const testCases = [
      { minimum: 7, expected: 10 },      // Between 6 and 10
      { minimum: 12, expected: 13 },     // Between 10 and 13
      { minimum: 18, expected: 20 },     // Between 16 and 20
      { minimum: 28, expected: 32 },     // Between 25 and 32
      { minimum: 45, expected: 50 },     // Between 40 and 50
      { minimum: 55, expected: 63 },     // Between 50 and 63
      { minimum: 75, expected: 80 },     // Between 63 and 80
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'IEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should handle IEC-specific ratings not in NEC', () => {
    // IEC has ratings like 13A, 32A, 63A, 315A that NEC doesn't
    const testCases = [
      { minimum: 13, expected: 13 },     // IEC-specific
      { minimum: 31, expected: 32 },     // IEC-specific
      { minimum: 62, expected: 63 },     // IEC-specific
      { minimum: 310, expected: 315 },   // IEC-specific
      { minimum: 630, expected: 630 },   // IEC-specific
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'IEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should handle large industrial IEC currents', () => {
    const testCases = [
      { minimum: 200, expected: 200 },
      { minimum: 280, expected: 315 },
      { minimum: 500, expected: 500 },
      { minimum: 700, expected: 800 },
      { minimum: 1100, expected: 1250 },
      { minimum: 1800, expected: 2000 },
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'IEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should handle minimum IEC rating: 6A', () => {
    const testCases = [
      { minimum: 0.5, expected: 6 },
      { minimum: 5, expected: 6 },
      { minimum: 6, expected: 6 },
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'IEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should return null when exceeding maximum IEC rating', () => {
    const recommended = recommendStandardBreaker(4500, 'IEC');
    expect(recommended).toBeNull();
  });
});

describe('Standard Breaker Rating Lookup - NEC vs IEC Comparison', () => {
  it('should show different recommendations for same minimum between NEC and IEC', () => {
    // Due to different rating steps, same minimum may yield different breakers
    const minimum = 55;

    const necRecommendation = recommendStandardBreaker(minimum, 'NEC');
    const iecRecommendation = recommendStandardBreaker(minimum, 'IEC');

    expect(necRecommendation).toBe(60);  // NEC: 50 → 60 (gap)
    expect(iecRecommendation).toBe(63);  // IEC: 50 → 63 (gap)
  });

  it('should show finer resolution in IEC for low currents', () => {
    // IEC has more intermediate ratings in lower range
    const testCases = [
      { minimum: 12, nec: 15, iec: 13 },  // IEC has 13A, NEC jumps to 15A
      { minimum: 31, nec: 35, iec: 32 },  // IEC has 32A, NEC jumps to 35A
    ];

    testCases.forEach(({ minimum, nec, iec }) => {
      expect(recommendStandardBreaker(minimum, 'NEC')).toBe(nec);
      expect(recommendStandardBreaker(minimum, 'IEC')).toBe(iec);
    });
  });
});

describe('Standard Breaker Rating Lookup - Performance', () => {
  it('should perform lookup in <50ms (binary search optimization)', () => {
    // Performance requirement from tasks.md T100
    const start = performance.now();

    // Run 1000 lookups
    for (let i = 0; i < 1000; i++) {
      recommendStandardBreaker(Math.random() * 4000, 'NEC');
    }

    const duration = performance.now() - start;
    const avgPerLookup = duration / 1000;

    expect(avgPerLookup).toBeLessThan(50);  // <50ms per lookup
  });
});

describe('Standard Breaker Rating Lookup - Edge Cases from Research', () => {
  it('should handle Category 1 test cases (NEC single-phase)', () => {
    // Reference: research.md Category 1
    const testCases = [
      { minimum: 20.8, expected: 25 },   // TC1: 2kW @ 120V
      { minimum: 69.1, expected: 70 },   // TC2: 5kW @ 120V
      { minimum: 57.9, expected: 60 },   // TC3: 10kW @ 240V (reference)
      { minimum: 91.9, expected: 100 },  // TC4: 15kW @ 240V
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'NEC');
      expect(recommended).toBe(expected);
    });
  });

  it('should handle Category 2 test cases (NEC three-phase)', () => {
    // Reference: research.md Category 2
    const testCases = [
      { minimum: 42.0, expected: 45 },   // TC8: 10kW @ 208V 3-phase
      { minimum: 100.4, expected: 110 }, // TC9: 25kW @ 208V 3-phase
      { minimum: 167.3, expected: 175 }, // TC12: 100kW @ 480V 3-phase
    ];

    testCases.forEach(({ minimum, expected }) => {
      const recommended = recommendStandardBreaker(minimum, 'NEC');
      expect(recommended).toBe(expected);
    });
  });
});
