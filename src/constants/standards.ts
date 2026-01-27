/**
 * Constants for electrical standards used in lightning arrester calculations
 */

// IEC 60099-4:2018 - Surge arresters for AC systems
export const IEC_60099_4 = {
  STANDARD_NAME: 'IEC 60099-4:2018',
  TITLE: 'Surge arresters - Part 4: Surge arresters for AC systems',
  RESIDUAL_VOLTAGE_FACTOR: 3.3, // Typical ratio of residual voltage to rated voltage
  WITHSTAND_VOLTAGE_RATIO: 2.5, // Ratio for determining withstand voltage
  REFERENCE_TEMPERATURE: 20, // Celsius
  TEMPERATURE_CORRECTION_FACTOR: 0.003, // Per degree Celsius
};

// NEC 2020/2023 - National Electrical Code
export const NEC_STANDARDS = {
  STANDARD_NAME: 'NEC 2020/2023',
  TITLE: 'National Electrical Code',
  SPD_TYPE1_LOCATION: 'line_side_service_disconnect', // Type 1 SPD location
  SPD_TYPE2_LOCATION: 'load_side_service_disconnect', // Type 2 SPD location
  MIN_COPPER_SIZE_GROUNDING_ELECTRODE: 8, // AWG copper wire minimum size
  MIN_ALUMINUM_SIZE_GROUNDING_ELECTRODE: 6, // AWG aluminum wire minimum size
  GROUNDING_ELECTRODE_RESISTANCE_MAX: 25, // Ohms maximum resistance
};

// Common withstand voltage ratios by arrester type
export const WITHSTAND_VOLTAGE_RATIOS = {
  CONVENTIONAL: 2.5,
  ESE: 3.0,
  MOV: 2.2,
};

// Standard voltage classes for arresters
export const ARRESTER_VOLTAGE_CLASSES = [
  3.6, 7.2, 12, 17, 24, 36, 52, 72.5, 96, 126, 145, 169, 200, 242, 300, 362, 420, 550, 800
];

// Common structure type recommendations
export const STRUCTURE_RECOMMENDATIONS = {
  HOME: {
    arresterType: 'conventional',
    spdtype: 'type1',
    material: 'copper',
    primaryUse: 'residential protection',
  },
  TOWER: {
    arresterType: 'ese',
    spdtype: 'type2',
    material: 'copper',
    primaryUse: 'high structure protection',
  },
  INDUSTRY: {
    arresterType: 'mov',
    spdtype: 'type2',
    material: 'copper',
    primaryUse: 'industrial power systems',
  },
  TRACTION: {
    arresterType: 'mov',
    spdtype: 'type2',
    material: 'copper',
    primaryUse: 'transportation systems',
    highCantileverStrength: true,
  },
};

// Pollution levels for environmental conditions
export const POLLUTION_LEVELS = {
  LIGHT: {
    severity: 1,
    creepageDistanceFactor: 1.0,
    description: 'Minimal contamination, dry climate'
  },
  MEDIUM: {
    severity: 2,
    creepageDistanceFactor: 1.5,
    description: 'Moderate contamination, normal climate'
  },
  HEAVY: {
    severity: 3,
    creepageDistanceFactor: 2.0,
    description: 'High contamination, humid climate'
  }
};

// Altitude derating factors
export const ALTITUDE_DERATING = {
  BASE_ALTITUDE: 1000, // meters
  DERATING_PER_100M: 0.01, // 1% per 100m above 1000m
};