/**
 * Lightning Arrester model representing different lightning protection devices
 */
export interface LightningArrester {
  id: string;
  name: 'conventional' | 'ese' | 'mov';
  material: string; // Construction material
  useCase: string; // Primary application
  characteristics: {
    // Physical and electrical properties
    [key: string]: any;
  };
}

/**
 * Available arrester types
 */
export const ARRESTER_TYPES = {
  CONVENTIONAL: 'conventional',
  ESE: 'ese',
  MOV: 'mov',
} as const;

/**
 * Materials commonly used for lightning arresters
 */
export const ARRESTER_MATERIALS = {
  COPPER: 'copper',
  BRASS: 'brass',
  STEEL: 'steel',
  ALUMINUM: 'aluminum',
} as const;