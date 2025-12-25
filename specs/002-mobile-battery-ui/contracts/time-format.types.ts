/**
 * TypeScript type definitions for time formatting
 * Feature: 002-mobile-battery-ui
 */

/**
 * Result of time formatting conversion
 */
export interface TimeFormatResult {
  /** Original decimal hours value from calculation */
  decimalHours: number;

  /** Whole hours component (e.g., 3 from 3.456 hours) */
  hours: number;

  /** Minutes component (e.g., 27 from 3.456 hours) */
  minutes: number;

  /** Human-readable format (e.g., "3 hours 27 minutes") */
  formatted: string;

  /** Compact format for space-constrained displays (e.g., "3h 27m") */
  short: string;
}

/**
 * Standard responsive breakpoints (px values)
 */
export enum ResponsiveBreakpoint {
  Mobile = 320,
  MobileLarge = 428,
  Tablet = 768,
  Laptop = 1024,
  Desktop = 1280,
  DesktopLarge = 1536,
}

/**
 * Touch target sizing standards for WCAG 2.1 compliance
 */
export interface TouchTarget {
  /** Minimum width in CSS pixels */
  minWidth: number;

  /** Minimum height in CSS pixels */
  minHeight: number;

  /** Minimum spacing between adjacent targets in CSS pixels */
  spacing: number;
}

/**
 * WCAG 2.1 Level AAA touch target standards
 */
export const TOUCH_TARGET_STANDARDS: TouchTarget = {
  minWidth: 44,
  minHeight: 44,
  spacing: 8,
};

/**
 * Options for formatTimeDisplay utility
 */
export interface TimeFormatOptions {
  /** Show compact format instead of full (e.g., "3h 27m" vs "3 hours 27 minutes") */
  compact?: boolean;

  /** Threshold for showing "< 1 minute" (default: 0.0167 hours) */
  minimumDisplayThreshold?: number;
}
