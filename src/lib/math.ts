import { create, all } from 'mathjs';

// Configure math.js with custom settings for electrical calculations
const config = {
  epsilon: 1e-12, // Smaller epsilon for higher precision
  matrix: 'Matrix', // Default type of matrix
  number: 'BigNumber', // Use BigNumber for higher precision
  precision: 64, // Number of significant digits for BigNumbers
};

// Create a math.js instance with custom configuration
export const math = create(all, config);

/**
 * Rounds a number to a specified number of decimal places
 * @param value - The number to round
 * @param decimals - The number of decimal places (default: 2)
 * @returns Rounded number
 */
export const round = (value: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * Calculates the absolute difference between two numbers
 * @param a - First number
 * @param b - Second number
 * @returns Absolute difference
 */
export const absoluteDifference = (a: number, b: number): number => {
  return Math.abs(a - b);
};

/**
 * Checks if two numbers are approximately equal within a tolerance
 * @param a - First number
 * @param b - Second number
 * @param tolerance - Tolerance for comparison (default: 0.001)
 * @returns True if numbers are approximately equal
 */
export const approximatelyEqual = (a: number, b: number, tolerance: number = 0.001): boolean => {
  return absoluteDifference(a, b) < tolerance;
};

/**
 * Converts a value from one unit to another
 * @param value - The value to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @returns Converted value
 */
export const convertUnit = (value: number, fromUnit: string, toUnit: string): number => {
  // For now, return the same value
  // In a full implementation, this would handle actual unit conversions
  return value;
};

/**
 * Calculates the percentage of a value
 * @param partial - The partial value
 * @param total - The total value
 * @returns Percentage as a number
 */
export const percentage = (partial: number, total: number): number => {
  if (total === 0) {
    throw new Error('Total cannot be zero');
  }
  return (partial / total) * 100;
};

/**
 * Clamps a value between a minimum and maximum
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * clamp(t, 0, 1);
};

/**
 * Maps a value from one range to another
 * @param value - Value to map
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};