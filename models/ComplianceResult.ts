/**
 * Result of compliance validation against standards
 */
export interface ComplianceResult {
  standard: string; // e.g., "IEC 60099-4", "NEC 2020"
  requirement: string; // e.g., "residual voltage", "withstand voltage"
  requiredValue: number; // Required value per standard
  calculatedValue: number; // Calculated value
  unit: string; // Measurement unit (e.g., "kV", "kg")
  compliant: boolean; // Whether requirement is met
  details?: string; // Additional details about the check
}

/**
 * Type for compliance standard identification
 */
export interface ComplianceStandard {
  id: string; // Standard identifier (e.g., 'IEC 60099-4', 'NEC 2020')
  name: string; // Full standard name
  version: string; // Version number
  requirements: {
    [key: string]: any; // Specific requirements for this standard
  };
}

/**
 * Common test parameter types
 */
export type TestParameterType =
  | 'residual_voltage'
  | 'withstand_voltage'
  | 'tov' // Temporary overvoltage
  | 'cantilever_strength';

/**
 * Result of a complete calculation
 */
export interface CalculationResult {
  arresterType: string; // Recommended arrester type
  rating: number; // Recommended rating in kV
  complianceResults: ComplianceResult[]; // Array of compliance checks
  installationRecommendation: string; // Installation location advice
  warnings: string[]; // Any warnings or cautions
  calculationTimestamp: Date; // When calculation was performed
}