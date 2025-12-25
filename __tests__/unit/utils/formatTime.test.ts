import { describe, it, expect } from 'vitest';
import { formatTimeDisplay } from '@/lib/utils/formatTime';
import type { TimeFormatResult } from '@/specs/002-mobile-battery-ui/contracts/time-format.types';

describe('formatTimeDisplay', () => {
  describe('Edge case: < 1 minute', () => {
    it('should display "< 1 minute" for times under 0.0167 hours', () => {
      const result = formatTimeDisplay(0.0083);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.formatted).toBe('< 1 minute');
      expect(result.short).toBe('< 1m');
      expect(result.decimalHours).toBe(0.0083);
    });

    it('should display "< 1 minute" for 0 hours', () => {
      const result = formatTimeDisplay(0);
      expect(result.formatted).toBe('< 1 minute');
    });

    it('should display "< 1 minute" for exactly 0.0167 hours (boundary)', () => {
      const result = formatTimeDisplay(0.0166);
      expect(result.formatted).toBe('< 1 minute');
    });
  });

  describe('Standard conversion: 0.75 hours → 45 minutes', () => {
    it('should convert 0.75 hours to "45 minutes"', () => {
      const result = formatTimeDisplay(0.75);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(45);
      expect(result.formatted).toBe('45 minutes');
      expect(result.short).toBe('45m');
      expect(result.decimalHours).toBe(0.75);
    });

    it('should handle 0.5 hours (30 minutes)', () => {
      const result = formatTimeDisplay(0.5);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(30);
      expect(result.formatted).toBe('30 minutes');
      expect(result.short).toBe('30m');
    });

    it('should handle 0.25 hours (15 minutes)', () => {
      const result = formatTimeDisplay(0.25);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(15);
      expect(result.formatted).toBe('15 minutes');
      expect(result.short).toBe('15m');
    });
  });

  describe('Standard conversion: 3.456 hours → 3 hours 27 minutes', () => {
    it('should convert 3.456 hours to "3 hours 27 minutes"', () => {
      const result = formatTimeDisplay(3.456);
      expect(result.hours).toBe(3);
      expect(result.minutes).toBe(27);
      expect(result.formatted).toBe('3 hours 27 minutes');
      expect(result.short).toBe('3h 27m');
      expect(result.decimalHours).toBe(3.456);
    });

    it('should handle 2.5 hours', () => {
      const result = formatTimeDisplay(2.5);
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(30);
      expect(result.formatted).toBe('2 hours 30 minutes');
      expect(result.short).toBe('2h 30m');
    });

    it('should handle 1.5 hours', () => {
      const result = formatTimeDisplay(1.5);
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(30);
      expect(result.formatted).toBe('1 hour 30 minutes');
      expect(result.short).toBe('1h 30m');
    });
  });

  describe('Edge case: > 100 hours', () => {
    it('should handle 127.567 hours (127 hours 34 minutes)', () => {
      const result = formatTimeDisplay(127.567);
      expect(result.hours).toBe(127);
      expect(result.minutes).toBe(34);
      expect(result.formatted).toBe('127 hours 34 minutes');
      expect(result.short).toBe('127h 34m');
      expect(result.decimalHours).toBe(127.567);
    });

    it('should handle exactly 100 hours', () => {
      const result = formatTimeDisplay(100);
      expect(result.hours).toBe(100);
      expect(result.minutes).toBe(0);
      expect(result.formatted).toBe('100 hours');
      expect(result.short).toBe('100h');
    });

    it('should handle 200.5 hours', () => {
      const result = formatTimeDisplay(200.5);
      expect(result.hours).toBe(200);
      expect(result.minutes).toBe(30);
      expect(result.formatted).toBe('200 hours 30 minutes');
      expect(result.short).toBe('200h 30m');
    });
  });

  describe('Grammar handling: singular vs plural', () => {
    it('should use "1 hour" (singular) for exactly 1 hour', () => {
      const result = formatTimeDisplay(1.0);
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(0);
      expect(result.formatted).toBe('1 hour');
      expect(result.short).toBe('1h');
    });

    it('should use "2 hours" (plural) for 2 hours', () => {
      const result = formatTimeDisplay(2.0);
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(0);
      expect(result.formatted).toBe('2 hours');
      expect(result.short).toBe('2h');
    });

    it('should use "1 minute" (singular) for times that round to 1 minute', () => {
      const result = formatTimeDisplay(0.0167); // Just over threshold
      expect(result.minutes).toBe(1);
      expect(result.formatted).toBe('1 minute');
      expect(result.short).toBe('1m');
    });

    it('should use "2 minutes" (plural) for 2 minutes', () => {
      const result = formatTimeDisplay(0.0333); // ~2 minutes
      expect(result.minutes).toBe(2);
      expect(result.formatted).toBe('2 minutes');
      expect(result.short).toBe('2m');
    });

    it('should use singular "1 hour" and plural "30 minutes"', () => {
      const result = formatTimeDisplay(1.5);
      expect(result.formatted).toBe('1 hour 30 minutes');
      expect(result.short).toBe('1h 30m');
    });

    it('should use plural "2 hours" and singular "1 minute"', () => {
      const result = formatTimeDisplay(2.0167); // ~2 hours 1 minute
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(1);
      expect(result.formatted).toBe('2 hours 1 minute');
      expect(result.short).toBe('2h 1m');
    });
  });

  describe('Rounding behavior', () => {
    it('should round 3.499 hours to 3 hours 30 minutes (rounds minutes)', () => {
      const result = formatTimeDisplay(3.499);
      // 3.499 * 60 = 209.94 minutes → rounds to 210 minutes = 3 hours 30 minutes
      expect(result.hours).toBe(3);
      expect(result.minutes).toBe(30);
    });

    it('should round 3.501 hours to 3 hours 30 minutes', () => {
      const result = formatTimeDisplay(3.501);
      // 3.501 * 60 = 210.06 minutes → rounds to 210 minutes = 3 hours 30 minutes
      expect(result.hours).toBe(3);
      expect(result.minutes).toBe(30);
    });
  });

  describe('Exact hour boundaries', () => {
    it('should handle exactly 24 hours', () => {
      const result = formatTimeDisplay(24);
      expect(result.hours).toBe(24);
      expect(result.minutes).toBe(0);
      expect(result.formatted).toBe('24 hours');
      expect(result.short).toBe('24h');
    });

    it('should handle exactly 0.5 hours (30 minutes, no hours)', () => {
      const result = formatTimeDisplay(0.5);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(30);
      expect(result.formatted).toBe('30 minutes');
      expect(result.short).toBe('30m');
    });
  });

  describe('Type safety and interface compliance', () => {
    it('should return all required TimeFormatResult properties', () => {
      const result: TimeFormatResult = formatTimeDisplay(3.456);
      expect(result).toHaveProperty('decimalHours');
      expect(result).toHaveProperty('hours');
      expect(result).toHaveProperty('minutes');
      expect(result).toHaveProperty('formatted');
      expect(result).toHaveProperty('short');
    });

    it('should have non-negative hours and minutes', () => {
      const result = formatTimeDisplay(5.5);
      expect(result.hours).toBeGreaterThanOrEqual(0);
      expect(result.minutes).toBeGreaterThanOrEqual(0);
    });

    it('should have minutes in 0-59 range', () => {
      const result = formatTimeDisplay(3.999);
      expect(result.minutes).toBeGreaterThanOrEqual(0);
      expect(result.minutes).toBeLessThan(60);
    });
  });
});
