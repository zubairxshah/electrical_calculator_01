/**
 * Input parameters for maximum demand and diversity calculations
 */
export interface DemandCalculationParameters {
  projectName: string;
  projectType: 'residential' | 'commercial' | 'industrial';
  standard: 'IEC' | 'NEC';
  
  // System configuration
  voltage: number; // System voltage (V)
  phases: 1 | 3; // Single or three-phase
  frequency: 50 | 60; // Hz
  
  // Load categories (all in kW)
  loads: LoadInputs;
  
  // Optional custom factors
  customFactors?: {
    [category: string]: number; // Override default diversity/demand factor
  };
  
  // Optional future expansion allowance
  futureExpansion?: number; // Percentage (e.g., 0.2 for 20%)
}

/**
 * Load inputs by project type
 */
export interface LoadInputs {
  // Residential loads
  lighting?: number;
  socketOutlets?: number;
  hvac?: number;
  cookingAppliances?: number;
  waterHeating?: number;
  otherAppliances?: number;
  dryer?: number;
  
  // Commercial loads
  generalLighting?: number;
  receptacleLoads?: number;
  elevators?: number;
  kitchenEquipment?: number;
  specialEquipment?: number;
  
  // Industrial loads
  motorLoads?: MotorLoad[];
  processEquipment?: number;
  weldingEquipment?: number;
  controlSystems?: number;
}

/**
 * Motor load definition for industrial calculations
 */
export interface MotorLoad {
  id: string;
  name: string;
  power: number; // kW
  powerFactor: number; // 0-1
  dutyCycle: 'continuous' | 'intermittent' | 'short-time';
  isLargest: boolean;
}

/**
 * Validation rules for calculation parameters
 */
export const DEMAND_VALIDATION_RULES = {
  MIN_VOLTAGE: 120, // V
  MAX_VOLTAGE: 690, // V
  MIN_LOAD: 0, // kW
  MAX_LOAD_PER_CATEGORY: 10000, // kW
  MIN_POWER_FACTOR: 0.1,
  MAX_POWER_FACTOR: 1.0,
  PROJECT_TYPES: ['residential', 'commercial', 'industrial'] as const,
  STANDARDS: ['IEC', 'NEC'] as const,
  FREQUENCIES: [50, 60] as const,
};
