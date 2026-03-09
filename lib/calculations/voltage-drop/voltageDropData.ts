// Voltage Drop Calculator - Data & Constants
// Standards: IEC 60364-5-52, NEC Chapter 9, IEC 61439-6 (Busway)

import type { BuswayEntry } from '@/types/voltage-drop'

/**
 * Common system voltages by standard
 */
export const SYSTEM_VOLTAGES = {
  IEC: [110, 220, 230, 240, 380, 400, 415, 440, 690, 1000, 3300, 6600, 11000, 33000],
  NEC: [120, 208, 240, 277, 480, 600, 2400, 4160, 12470, 13200, 13800, 34500],
}

/**
 * Circuit multiplier factors
 * Single-phase: 2 (out and return)
 * Three-phase: sqrt(3) ≈ 1.732
 */
export const CIRCUIT_MULTIPLIERS = {
  'single-phase': 2,
  'three-phase': Math.sqrt(3),
}

/**
 * NEC recommended voltage drop limits
 * - 3% for branch circuits
 * - 5% for combined feeder + branch
 * IEC 60364-5-52 Annex G recommends 3-5% for LV installations
 */
export const VOLTAGE_DROP_LIMITS = {
  branchCircuit: 3,
  combinedFeederBranch: 5,
  dangerous: 10,
}

/**
 * IEC cable sizes in mm²
 */
export const IEC_CABLE_SIZES = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630,
]

/**
 * NEC cable sizes in AWG/kcmil
 */
export const NEC_CABLE_SIZES = [
  '14', '12', '10', '8', '6', '4', '3', '2', '1',
  '1/0', '2/0', '3/0', '4/0',
  '250', '300', '350', '400', '500', '600', '700', '750', '800', '900', '1000',
]

/**
 * Busway / Busbar Trunking System impedance data
 * Based on IEC 61439-6 and manufacturer data (typical values)
 *
 * Values are per-phase impedance in mOhm/m at operating temperature
 * Sandwich type: lower reactance due to interleaved phase arrangement
 * Non-sandwich: conventional arrangement with higher reactance
 *
 * References:
 * - IEC 61439-6:2012 Low-voltage busbar trunking systems
 * - Schneider Electric Canalis technical guide
 * - Siemens Sentron busbar data
 * - Eaton busway engineering data
 */
export const BUSWAY_COPPER_DATA: BuswayEntry[] = [
  // Sandwich type (compact, interleaved) - lower impedance
  { ratingA: 225, material: 'copper', impedanceMOhmPerM: 0.340, resistanceMOhmPerM: 0.300, reactanceMOhmPerM: 0.160, powerFactor: 0.88, type: 'sandwich', description: '225A Copper Sandwich Busway' },
  { ratingA: 400, material: 'copper', impedanceMOhmPerM: 0.190, resistanceMOhmPerM: 0.155, reactanceMOhmPerM: 0.110, powerFactor: 0.82, type: 'sandwich', description: '400A Copper Sandwich Busway' },
  { ratingA: 630, material: 'copper', impedanceMOhmPerM: 0.120, resistanceMOhmPerM: 0.094, reactanceMOhmPerM: 0.075, powerFactor: 0.78, type: 'sandwich', description: '630A Copper Sandwich Busway' },
  { ratingA: 800, material: 'copper', impedanceMOhmPerM: 0.094, resistanceMOhmPerM: 0.072, reactanceMOhmPerM: 0.060, powerFactor: 0.77, type: 'sandwich', description: '800A Copper Sandwich Busway' },
  { ratingA: 1000, material: 'copper', impedanceMOhmPerM: 0.075, resistanceMOhmPerM: 0.056, reactanceMOhmPerM: 0.050, powerFactor: 0.75, type: 'sandwich', description: '1000A Copper Sandwich Busway' },
  { ratingA: 1250, material: 'copper', impedanceMOhmPerM: 0.060, resistanceMOhmPerM: 0.043, reactanceMOhmPerM: 0.042, powerFactor: 0.72, type: 'sandwich', description: '1250A Copper Sandwich Busway' },
  { ratingA: 1600, material: 'copper', impedanceMOhmPerM: 0.047, resistanceMOhmPerM: 0.033, reactanceMOhmPerM: 0.034, powerFactor: 0.70, type: 'sandwich', description: '1600A Copper Sandwich Busway' },
  { ratingA: 2000, material: 'copper', impedanceMOhmPerM: 0.037, resistanceMOhmPerM: 0.025, reactanceMOhmPerM: 0.027, powerFactor: 0.68, type: 'sandwich', description: '2000A Copper Sandwich Busway' },
  { ratingA: 2500, material: 'copper', impedanceMOhmPerM: 0.030, resistanceMOhmPerM: 0.019, reactanceMOhmPerM: 0.023, powerFactor: 0.64, type: 'sandwich', description: '2500A Copper Sandwich Busway' },
  { ratingA: 3200, material: 'copper', impedanceMOhmPerM: 0.023, resistanceMOhmPerM: 0.014, reactanceMOhmPerM: 0.018, powerFactor: 0.61, type: 'sandwich', description: '3200A Copper Sandwich Busway' },
  { ratingA: 4000, material: 'copper', impedanceMOhmPerM: 0.019, resistanceMOhmPerM: 0.011, reactanceMOhmPerM: 0.015, powerFactor: 0.58, type: 'sandwich', description: '4000A Copper Sandwich Busway' },
  { ratingA: 5000, material: 'copper', impedanceMOhmPerM: 0.015, resistanceMOhmPerM: 0.008, reactanceMOhmPerM: 0.013, powerFactor: 0.53, type: 'sandwich', description: '5000A Copper Sandwich Busway' },
  { ratingA: 6300, material: 'copper', impedanceMOhmPerM: 0.012, resistanceMOhmPerM: 0.006, reactanceMOhmPerM: 0.010, powerFactor: 0.50, type: 'sandwich', description: '6300A Copper Sandwich Busway' },

  // Non-sandwich type (conventional) - higher reactance
  { ratingA: 225, material: 'copper', impedanceMOhmPerM: 0.420, resistanceMOhmPerM: 0.300, reactanceMOhmPerM: 0.294, powerFactor: 0.71, type: 'non-sandwich', description: '225A Copper Non-Sandwich Busway' },
  { ratingA: 400, material: 'copper', impedanceMOhmPerM: 0.250, resistanceMOhmPerM: 0.155, reactanceMOhmPerM: 0.197, powerFactor: 0.62, type: 'non-sandwich', description: '400A Copper Non-Sandwich Busway' },
  { ratingA: 630, material: 'copper', impedanceMOhmPerM: 0.160, resistanceMOhmPerM: 0.094, reactanceMOhmPerM: 0.129, powerFactor: 0.59, type: 'non-sandwich', description: '630A Copper Non-Sandwich Busway' },
  { ratingA: 800, material: 'copper', impedanceMOhmPerM: 0.130, resistanceMOhmPerM: 0.072, reactanceMOhmPerM: 0.108, powerFactor: 0.55, type: 'non-sandwich', description: '800A Copper Non-Sandwich Busway' },
  { ratingA: 1000, material: 'copper', impedanceMOhmPerM: 0.110, resistanceMOhmPerM: 0.056, reactanceMOhmPerM: 0.095, powerFactor: 0.51, type: 'non-sandwich', description: '1000A Copper Non-Sandwich Busway' },
  { ratingA: 1250, material: 'copper', impedanceMOhmPerM: 0.092, resistanceMOhmPerM: 0.043, reactanceMOhmPerM: 0.081, powerFactor: 0.47, type: 'non-sandwich', description: '1250A Copper Non-Sandwich Busway' },
  { ratingA: 1600, material: 'copper', impedanceMOhmPerM: 0.075, resistanceMOhmPerM: 0.033, reactanceMOhmPerM: 0.068, powerFactor: 0.44, type: 'non-sandwich', description: '1600A Copper Non-Sandwich Busway' },
  { ratingA: 2000, material: 'copper', impedanceMOhmPerM: 0.063, resistanceMOhmPerM: 0.025, reactanceMOhmPerM: 0.058, powerFactor: 0.40, type: 'non-sandwich', description: '2000A Copper Non-Sandwich Busway' },
  { ratingA: 2500, material: 'copper', impedanceMOhmPerM: 0.052, resistanceMOhmPerM: 0.019, reactanceMOhmPerM: 0.049, powerFactor: 0.37, type: 'non-sandwich', description: '2500A Copper Non-Sandwich Busway' },
  { ratingA: 3200, material: 'copper', impedanceMOhmPerM: 0.043, resistanceMOhmPerM: 0.014, reactanceMOhmPerM: 0.041, powerFactor: 0.33, type: 'non-sandwich', description: '3200A Copper Non-Sandwich Busway' },
  { ratingA: 4000, material: 'copper', impedanceMOhmPerM: 0.037, resistanceMOhmPerM: 0.011, reactanceMOhmPerM: 0.035, powerFactor: 0.30, type: 'non-sandwich', description: '4000A Copper Non-Sandwich Busway' },
  { ratingA: 5000, material: 'copper', impedanceMOhmPerM: 0.031, resistanceMOhmPerM: 0.008, reactanceMOhmPerM: 0.030, powerFactor: 0.26, type: 'non-sandwich', description: '5000A Copper Non-Sandwich Busway' },
]

export const BUSWAY_ALUMINUM_DATA: BuswayEntry[] = [
  // Sandwich type - aluminum (higher resistance than copper, ~1.6x)
  { ratingA: 225, material: 'aluminum', impedanceMOhmPerM: 0.510, resistanceMOhmPerM: 0.480, reactanceMOhmPerM: 0.170, powerFactor: 0.94, type: 'sandwich', description: '225A Aluminum Sandwich Busway' },
  { ratingA: 400, material: 'aluminum', impedanceMOhmPerM: 0.290, resistanceMOhmPerM: 0.248, reactanceMOhmPerM: 0.150, powerFactor: 0.86, type: 'sandwich', description: '400A Aluminum Sandwich Busway' },
  { ratingA: 630, material: 'aluminum', impedanceMOhmPerM: 0.185, resistanceMOhmPerM: 0.150, reactanceMOhmPerM: 0.108, powerFactor: 0.81, type: 'sandwich', description: '630A Aluminum Sandwich Busway' },
  { ratingA: 800, material: 'aluminum', impedanceMOhmPerM: 0.145, resistanceMOhmPerM: 0.115, reactanceMOhmPerM: 0.088, powerFactor: 0.79, type: 'sandwich', description: '800A Aluminum Sandwich Busway' },
  { ratingA: 1000, material: 'aluminum', impedanceMOhmPerM: 0.116, resistanceMOhmPerM: 0.090, reactanceMOhmPerM: 0.073, powerFactor: 0.78, type: 'sandwich', description: '1000A Aluminum Sandwich Busway' },
  { ratingA: 1250, material: 'aluminum', impedanceMOhmPerM: 0.093, resistanceMOhmPerM: 0.069, reactanceMOhmPerM: 0.062, powerFactor: 0.74, type: 'sandwich', description: '1250A Aluminum Sandwich Busway' },
  { ratingA: 1600, material: 'aluminum', impedanceMOhmPerM: 0.073, resistanceMOhmPerM: 0.053, reactanceMOhmPerM: 0.050, powerFactor: 0.73, type: 'sandwich', description: '1600A Aluminum Sandwich Busway' },
  { ratingA: 2000, material: 'aluminum', impedanceMOhmPerM: 0.058, resistanceMOhmPerM: 0.040, reactanceMOhmPerM: 0.042, powerFactor: 0.69, type: 'sandwich', description: '2000A Aluminum Sandwich Busway' },
  { ratingA: 2500, material: 'aluminum', impedanceMOhmPerM: 0.047, resistanceMOhmPerM: 0.030, reactanceMOhmPerM: 0.036, powerFactor: 0.64, type: 'sandwich', description: '2500A Aluminum Sandwich Busway' },
  { ratingA: 3200, material: 'aluminum', impedanceMOhmPerM: 0.038, resistanceMOhmPerM: 0.023, reactanceMOhmPerM: 0.030, powerFactor: 0.61, type: 'sandwich', description: '3200A Aluminum Sandwich Busway' },
  { ratingA: 4000, material: 'aluminum', impedanceMOhmPerM: 0.031, resistanceMOhmPerM: 0.018, reactanceMOhmPerM: 0.025, powerFactor: 0.58, type: 'sandwich', description: '4000A Aluminum Sandwich Busway' },

  // Non-sandwich type - aluminum
  { ratingA: 225, material: 'aluminum', impedanceMOhmPerM: 0.620, resistanceMOhmPerM: 0.480, reactanceMOhmPerM: 0.394, powerFactor: 0.77, type: 'non-sandwich', description: '225A Aluminum Non-Sandwich Busway' },
  { ratingA: 400, material: 'aluminum', impedanceMOhmPerM: 0.370, resistanceMOhmPerM: 0.248, reactanceMOhmPerM: 0.275, powerFactor: 0.67, type: 'non-sandwich', description: '400A Aluminum Non-Sandwich Busway' },
  { ratingA: 630, material: 'aluminum', impedanceMOhmPerM: 0.240, resistanceMOhmPerM: 0.150, reactanceMOhmPerM: 0.187, powerFactor: 0.63, type: 'non-sandwich', description: '630A Aluminum Non-Sandwich Busway' },
  { ratingA: 800, material: 'aluminum', impedanceMOhmPerM: 0.195, resistanceMOhmPerM: 0.115, reactanceMOhmPerM: 0.157, powerFactor: 0.59, type: 'non-sandwich', description: '800A Aluminum Non-Sandwich Busway' },
  { ratingA: 1000, material: 'aluminum', impedanceMOhmPerM: 0.165, resistanceMOhmPerM: 0.090, reactanceMOhmPerM: 0.139, powerFactor: 0.55, type: 'non-sandwich', description: '1000A Aluminum Non-Sandwich Busway' },
  { ratingA: 1250, material: 'aluminum', impedanceMOhmPerM: 0.138, resistanceMOhmPerM: 0.069, reactanceMOhmPerM: 0.120, powerFactor: 0.50, type: 'non-sandwich', description: '1250A Aluminum Non-Sandwich Busway' },
  { ratingA: 1600, material: 'aluminum', impedanceMOhmPerM: 0.116, resistanceMOhmPerM: 0.053, reactanceMOhmPerM: 0.103, powerFactor: 0.46, type: 'non-sandwich', description: '1600A Aluminum Non-Sandwich Busway' },
  { ratingA: 2000, material: 'aluminum', impedanceMOhmPerM: 0.098, resistanceMOhmPerM: 0.040, reactanceMOhmPerM: 0.090, powerFactor: 0.41, type: 'non-sandwich', description: '2000A Aluminum Non-Sandwich Busway' },
  { ratingA: 2500, material: 'aluminum', impedanceMOhmPerM: 0.083, resistanceMOhmPerM: 0.030, reactanceMOhmPerM: 0.077, powerFactor: 0.36, type: 'non-sandwich', description: '2500A Aluminum Non-Sandwich Busway' },
]

/**
 * Look up busway entry by rating, material, and type
 */
export function lookupBusway(
  rating: number,
  material: 'copper' | 'aluminum',
  type: 'sandwich' | 'non-sandwich'
): BuswayEntry | undefined {
  const table = material === 'copper' ? BUSWAY_COPPER_DATA : BUSWAY_ALUMINUM_DATA
  return table.find(e => e.ratingA === rating && e.type === type)
}

/**
 * Get available busway ratings for a given material and type
 */
export function getAvailableBuswayRatings(
  material: 'copper' | 'aluminum',
  type: 'sandwich' | 'non-sandwich'
): number[] {
  const table = material === 'copper' ? BUSWAY_COPPER_DATA : BUSWAY_ALUMINUM_DATA
  return table.filter(e => e.type === type).map(e => e.ratingA)
}

/**
 * Round to specified decimal places
 */
export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
