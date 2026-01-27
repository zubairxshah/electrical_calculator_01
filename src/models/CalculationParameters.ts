/**
 * Input parameters for lightning arrester calculation
 */
export interface CalculationParameters {
  systemVoltage: number; // Input voltage in kV
  structureType: 'home' | 'tower' | 'industry' | 'traction';
  environmentalConditions: {
    humidity: number; // Percentage 0-100%
    pollutionLevel: 'light' | 'medium' | 'heavy'; // IEC classifications
    altitude: number; // Meters above sea level
  };
  complianceRequirement: 'type1' | 'type2'; // For SPD classification
  arresterRating?: number; // Rated voltage in kV (optional, may be calculated)
  installationLocation?: string; // Location description
}

/**
 * Validation rules for calculation parameters
 */
export const VALIDATION_RULES = {
  MIN_VOLTAGE: 0.23, // kV
  MAX_VOLTAGE: 36, // kV
  MIN_HUMIDITY: 0, // %
  MAX_HUMIDITY: 100, // %
  MIN_ALTITUDE: 0, // meters
  MAX_ALTITUDE: 2000, // meters
  POLLUTION_LEVELS: ['light', 'medium', 'heavy'] as const,
  STRUCTURE_TYPES: ['home', 'tower', 'industry', 'traction'] as const,
  COMPLIANCE_REQUIREMENTS: ['type1', 'type2'] as const,
};