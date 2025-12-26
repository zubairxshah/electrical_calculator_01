/**
 * Cable Calculations Module
 * Feature: 001-electromate-engineering-app
 *
 * Exports all cable sizing and voltage drop calculation functions.
 *
 * @see User Story 3 - Voltage Drop Calculator with Cable Sizing
 */

// Voltage drop calculations
export {
  calculateVoltageDrop,
  findCableSizesForTargetDrop,
  type VoltageDropInput,
  type VoltageDrop,
} from './voltageDrop';

// Ampacity lookup
export {
  lookupCableAmpacity,
  findMinimumCableForCurrent,
  getAvailableSizes,
  isOverloaded,
  type AmpacityLookupInput,
  type CableAmpacity,
} from './ampacity';

// Derating factors
export {
  calculateDeratingFactors,
  calculateDeratedAmpacity,
  checkAmpacityCompliance,
  type DeratingInput,
  type DeratingResult,
} from './deratingFactors';

// Cable sizing recommendation
export {
  recommendCableSize,
  type CableSizingInput,
  type CableSizingResult,
} from './cableSizing';
