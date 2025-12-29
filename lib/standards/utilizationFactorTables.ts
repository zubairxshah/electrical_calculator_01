/**
 * Utilization Factor (UF) Lookup Tables
 *
 * UF tables based on IESNA Lighting Handbook methodology.
 * Tables are indexed by Room Index and reflectance combinations.
 *
 * Reference: IESNA Lighting Handbook, 10th Edition, Chapter 9
 */

/**
 * Reflectance combination key for table lookup
 * Format: C-W-F (Ceiling-Wall-Floor as percentages)
 */
export type ReflectanceCombination =
  | '80-50-20'
  | '80-30-20'
  | '70-50-20'
  | '70-30-20'
  | '50-50-20'
  | '50-30-20'
  | '30-30-20'
  | '00-00-00';

/**
 * Room Index ranges for table lookup
 */
export const ROOM_INDEX_VALUES = [0.6, 0.8, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

/**
 * UF Table entry
 */
export interface UFTable {
  /** Table identifier */
  id: string;
  /** Luminaire type description */
  description: string;
  /** Distribution type */
  distributionType: 'direct' | 'indirect' | 'direct-indirect';
  /** UF values indexed by reflectance combination, then by room index position */
  values: Record<ReflectanceCombination, number[]>;
}

/**
 * Generic LED Troffer UF Table
 * Based on typical 2x4 LED troffer with direct distribution
 */
export const GENERIC_LED_TROFFER: UFTable = {
  id: 'generic-led-troffer',
  description: 'Generic LED Troffer (2x4, direct)',
  distributionType: 'direct',
  values: {
    '80-50-20': [0.47, 0.54, 0.60, 0.65, 0.69, 0.75, 0.79, 0.82, 0.86, 0.89],
    '80-30-20': [0.43, 0.50, 0.55, 0.60, 0.64, 0.70, 0.74, 0.77, 0.81, 0.84],
    '70-50-20': [0.45, 0.52, 0.57, 0.62, 0.66, 0.72, 0.76, 0.79, 0.83, 0.86],
    '70-30-20': [0.41, 0.48, 0.53, 0.58, 0.62, 0.68, 0.72, 0.75, 0.79, 0.82],
    '50-50-20': [0.41, 0.47, 0.52, 0.57, 0.61, 0.67, 0.71, 0.74, 0.78, 0.81],
    '50-30-20': [0.38, 0.44, 0.49, 0.54, 0.58, 0.64, 0.68, 0.71, 0.75, 0.78],
    '30-30-20': [0.35, 0.41, 0.46, 0.50, 0.54, 0.60, 0.64, 0.67, 0.71, 0.74],
    '00-00-00': [0.29, 0.34, 0.38, 0.42, 0.45, 0.50, 0.54, 0.56, 0.60, 0.63],
  },
};

/**
 * LED High Bay UF Table
 * Based on typical industrial high bay with narrow distribution
 */
export const LED_HIGH_BAY: UFTable = {
  id: 'led-high-bay',
  description: 'LED High Bay (Industrial)',
  distributionType: 'direct',
  values: {
    '80-50-20': [0.40, 0.47, 0.53, 0.58, 0.62, 0.69, 0.73, 0.76, 0.81, 0.84],
    '80-30-20': [0.37, 0.44, 0.49, 0.54, 0.58, 0.64, 0.68, 0.72, 0.76, 0.79],
    '70-50-20': [0.38, 0.45, 0.50, 0.55, 0.59, 0.66, 0.70, 0.73, 0.78, 0.81],
    '70-30-20': [0.35, 0.42, 0.47, 0.52, 0.56, 0.62, 0.66, 0.69, 0.74, 0.77],
    '50-50-20': [0.34, 0.41, 0.46, 0.51, 0.55, 0.61, 0.65, 0.68, 0.73, 0.76],
    '50-30-20': [0.32, 0.38, 0.43, 0.48, 0.52, 0.58, 0.62, 0.65, 0.70, 0.73],
    '30-30-20': [0.29, 0.35, 0.40, 0.44, 0.48, 0.54, 0.58, 0.61, 0.66, 0.69],
    '00-00-00': [0.24, 0.29, 0.33, 0.37, 0.40, 0.45, 0.49, 0.52, 0.56, 0.59],
  },
};

/**
 * LED Downlight UF Table
 * Based on typical recessed LED downlight
 */
export const LED_DOWNLIGHT: UFTable = {
  id: 'led-downlight',
  description: 'LED Downlight (Recessed)',
  distributionType: 'direct',
  values: {
    '80-50-20': [0.42, 0.49, 0.55, 0.60, 0.64, 0.70, 0.74, 0.77, 0.81, 0.84],
    '80-30-20': [0.38, 0.45, 0.50, 0.55, 0.59, 0.65, 0.69, 0.72, 0.76, 0.79],
    '70-50-20': [0.40, 0.47, 0.52, 0.57, 0.61, 0.67, 0.71, 0.74, 0.78, 0.81],
    '70-30-20': [0.36, 0.43, 0.48, 0.53, 0.57, 0.63, 0.67, 0.70, 0.74, 0.77],
    '50-50-20': [0.36, 0.42, 0.47, 0.52, 0.56, 0.62, 0.66, 0.69, 0.73, 0.76],
    '50-30-20': [0.33, 0.39, 0.44, 0.49, 0.53, 0.59, 0.63, 0.66, 0.70, 0.73],
    '30-30-20': [0.30, 0.36, 0.41, 0.45, 0.49, 0.55, 0.59, 0.62, 0.66, 0.69],
    '00-00-00': [0.25, 0.30, 0.34, 0.38, 0.41, 0.46, 0.50, 0.53, 0.57, 0.60],
  },
};

/**
 * LED Strip/Linear UF Table
 * Based on typical suspended LED linear fixture
 */
export const LED_STRIP: UFTable = {
  id: 'led-strip',
  description: 'LED Strip/Linear (Suspended)',
  distributionType: 'direct-indirect',
  values: {
    '80-50-20': [0.50, 0.57, 0.63, 0.68, 0.72, 0.78, 0.82, 0.85, 0.89, 0.92],
    '80-30-20': [0.46, 0.53, 0.58, 0.63, 0.67, 0.73, 0.77, 0.80, 0.84, 0.87],
    '70-50-20': [0.48, 0.55, 0.60, 0.65, 0.69, 0.75, 0.79, 0.82, 0.86, 0.89],
    '70-30-20': [0.44, 0.51, 0.56, 0.61, 0.65, 0.71, 0.75, 0.78, 0.82, 0.85],
    '50-50-20': [0.44, 0.50, 0.55, 0.60, 0.64, 0.70, 0.74, 0.77, 0.81, 0.84],
    '50-30-20': [0.40, 0.47, 0.52, 0.57, 0.61, 0.67, 0.71, 0.74, 0.78, 0.81],
    '30-30-20': [0.37, 0.43, 0.48, 0.53, 0.57, 0.63, 0.67, 0.70, 0.74, 0.77],
    '00-00-00': [0.31, 0.36, 0.40, 0.44, 0.47, 0.53, 0.57, 0.60, 0.64, 0.67],
  },
};

/**
 * Indirect Luminaire UF Table
 * Based on typical indirect/uplighting fixture
 */
export const LED_INDIRECT: UFTable = {
  id: 'led-indirect',
  description: 'LED Indirect (Uplighting)',
  distributionType: 'indirect',
  values: {
    '80-50-20': [0.35, 0.42, 0.48, 0.53, 0.57, 0.64, 0.68, 0.71, 0.76, 0.79],
    '80-30-20': [0.30, 0.37, 0.42, 0.47, 0.51, 0.57, 0.61, 0.64, 0.69, 0.72],
    '70-50-20': [0.32, 0.38, 0.44, 0.49, 0.53, 0.59, 0.63, 0.66, 0.71, 0.74],
    '70-30-20': [0.27, 0.33, 0.38, 0.43, 0.47, 0.53, 0.57, 0.60, 0.65, 0.68],
    '50-50-20': [0.26, 0.32, 0.37, 0.42, 0.46, 0.52, 0.56, 0.59, 0.64, 0.67],
    '50-30-20': [0.22, 0.28, 0.32, 0.37, 0.40, 0.46, 0.50, 0.53, 0.58, 0.61],
    '30-30-20': [0.18, 0.23, 0.27, 0.31, 0.34, 0.40, 0.44, 0.47, 0.52, 0.55],
    '00-00-00': [0.12, 0.16, 0.19, 0.22, 0.25, 0.30, 0.33, 0.36, 0.40, 0.43],
  },
};

/**
 * All available UF tables
 */
export const UF_TABLES: Record<string, UFTable> = {
  'generic-led-troffer': GENERIC_LED_TROFFER,
  'led-high-bay': LED_HIGH_BAY,
  'led-downlight': LED_DOWNLIGHT,
  'led-strip': LED_STRIP,
  'led-indirect': LED_INDIRECT,
};

/**
 * Get UF table by ID
 */
export function getUFTable(tableId: string): UFTable | undefined {
  return UF_TABLES[tableId];
}

/**
 * Get the nearest reflectance combination key for given values
 */
export function getNearestReflectanceCombination(
  ceiling: number,
  wall: number,
  floor: number
): ReflectanceCombination {
  // Round to nearest standard value
  const ceilingRounded = ceiling >= 75 ? 80 : ceiling >= 60 ? 70 : ceiling >= 40 ? 50 : ceiling >= 15 ? 30 : 0;
  const wallRounded = wall >= 40 ? 50 : wall >= 15 ? 30 : 0;
  const floorRounded = 20; // Fixed at 20 for all standard tables

  // If ceiling is very low, use 00-00-00 table
  if (ceilingRounded === 0 || wallRounded === 0) {
    return '00-00-00';
  }

  const key = `${ceilingRounded}-${wallRounded}-${floorRounded}` as ReflectanceCombination;

  // Validate the key exists in our combinations
  const validKeys: ReflectanceCombination[] = [
    '80-50-20',
    '80-30-20',
    '70-50-20',
    '70-30-20',
    '50-50-20',
    '50-30-20',
    '30-30-20',
    '00-00-00',
  ];

  if (validKeys.includes(key)) {
    return key;
  }

  // Default fallback
  return '50-30-20';
}

/**
 * Interpolate UF value for a given room index
 * Uses linear interpolation between table values
 */
export function interpolateUF(roomIndex: number, ufValues: number[]): number {
  // Clamp room index to table range
  const clampedRI = Math.max(0.6, Math.min(5.0, roomIndex));

  // Find the two nearest room index values
  let lowerIdx = 0;
  for (let i = 0; i < ROOM_INDEX_VALUES.length - 1; i++) {
    if (clampedRI >= ROOM_INDEX_VALUES[i] && clampedRI <= ROOM_INDEX_VALUES[i + 1]) {
      lowerIdx = i;
      break;
    }
  }

  const upperIdx = lowerIdx + 1;
  const lowerRI = ROOM_INDEX_VALUES[lowerIdx];
  const upperRI = ROOM_INDEX_VALUES[upperIdx];

  // Linear interpolation
  const fraction = (clampedRI - lowerRI) / (upperRI - lowerRI);
  const lowerUF = ufValues[lowerIdx];
  const upperUF = ufValues[upperIdx];

  const interpolatedUF = lowerUF + fraction * (upperUF - lowerUF);

  // Round to 2 decimal places
  return Math.round(interpolatedUF * 100) / 100;
}

/**
 * Look up Utilization Factor for given parameters
 *
 * @param tableId - UF table identifier (luminaire type)
 * @param roomIndex - Calculated room index
 * @param ceilingReflectance - Ceiling reflectance (0-100%)
 * @param wallReflectance - Wall reflectance (0-100%)
 * @param floorReflectance - Floor reflectance (0-100%)
 * @returns Utilization Factor (0.3-0.9 typical)
 */
export function lookupUF(
  tableId: string,
  roomIndex: number,
  ceilingReflectance: number,
  wallReflectance: number,
  floorReflectance: number
): number {
  const table = getUFTable(tableId);
  if (!table) {
    // Default to generic LED troffer if table not found
    return lookupUF('generic-led-troffer', roomIndex, ceilingReflectance, wallReflectance, floorReflectance);
  }

  const reflectanceKey = getNearestReflectanceCombination(
    ceilingReflectance,
    wallReflectance,
    floorReflectance
  );

  const ufValues = table.values[reflectanceKey];
  return interpolateUF(roomIndex, ufValues);
}

/**
 * Get all available UF table options for UI selection
 */
export function getUFTableOptions(): Array<{ id: string; label: string; description: string }> {
  return Object.entries(UF_TABLES).map(([id, table]) => ({
    id,
    label: table.description,
    description: `${table.distributionType} distribution`,
  }));
}
