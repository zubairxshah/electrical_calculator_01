/**
 * IEC Utilization Categories for Motor & DC Breaker Sizing
 *
 * Defines AC-1 through AC-4 and DC-1 through DC-5 categories
 * per IEC 60947-4-1 (contactors and motor-starters).
 *
 * Each category specifies a current multiplier and recommended trip curve
 * for breaker selection based on load duty cycle.
 *
 * @module iecUtilizationCategories
 */

import type { IECUtilizationCategory, IECUtilizationCategoryData } from '@/types/motor-breaker-calculator';

/**
 * IEC Utilization Category definitions
 */
export const IEC_UTILIZATION_CATEGORIES: Record<IECUtilizationCategory, IECUtilizationCategoryData> = {
  'AC-1': {
    category: 'AC-1',
    description: 'Resistive or slightly inductive loads',
    multiplier: 1.0,
    recommendedTripCurve: 'B',
    systemType: 'ac',
    applications: [
      'Resistive heating elements',
      'Non-inductive or slightly inductive loads',
      'Distribution circuits',
    ],
    notes: 'cos φ ≥ 0.95. Minimal inrush current. Standard sizing applies.',
  },
  'AC-2': {
    category: 'AC-2',
    description: 'Slip-ring motors: starting and stopping',
    multiplier: 1.5,
    recommendedTripCurve: 'C',
    systemType: 'ac',
    applications: [
      'Slip-ring (wound-rotor) induction motors',
      'Crane hoists',
      'Conveyors with controlled start',
    ],
    notes: 'Moderate starting current (2.5× FLA typical). 1.5× multiplier accounts for starting duty.',
  },
  'AC-3': {
    category: 'AC-3',
    description: 'Squirrel-cage motors: normal start and stop',
    multiplier: 1.0,
    recommendedTripCurve: 'D',
    systemType: 'ac',
    applications: [
      'Pumps and fans (normal duty)',
      'Compressors',
      'Standard industrial motors',
    ],
    notes: 'High starting current (6-8× FLA) but infrequent starts. Trip curve D handles inrush; 1.0× sizing sufficient for continuous duty.',
  },
  'AC-4': {
    category: 'AC-4',
    description: 'Squirrel-cage motors: jogging, plugging, reversing',
    multiplier: 1.2,
    recommendedTripCurve: 'D',
    systemType: 'ac',
    applications: [
      'Crane motors (frequent reversing)',
      'Machine tools (jogging)',
      'Positioning drives',
    ],
    notes: 'Severe duty with frequent starts at locked-rotor current. 1.2× multiplier for thermal stress from repeated inrush.',
  },
  'DC-1': {
    category: 'DC-1',
    description: 'Non-inductive or slightly inductive DC loads',
    multiplier: 1.0,
    recommendedTripCurve: 'B',
    systemType: 'dc',
    applications: [
      'DC resistive heating',
      'Battery charging (constant voltage)',
      'DC distribution',
    ],
    notes: 'Minimal inrush. Standard DC sizing applies.',
  },
  'DC-2': {
    category: 'DC-2',
    description: 'DC shunt motors: starting and stopping',
    multiplier: 1.5,
    recommendedTripCurve: 'C',
    systemType: 'dc',
    applications: [
      'DC shunt motors (normal start/stop)',
      'Constant-speed DC drives',
    ],
    notes: 'Shunt motor starting current typically 1.5-2× FLA. 1.5× multiplier covers starting transient.',
  },
  'DC-3': {
    category: 'DC-3',
    description: 'DC shunt motors: jogging and reversing',
    multiplier: 2.5,
    recommendedTripCurve: 'D',
    systemType: 'dc',
    applications: [
      'DC shunt motors with frequent reversing',
      'Positioning systems (DC)',
      'Machine tool spindle drives',
    ],
    notes: 'Severe duty. 2.5× multiplier for repeated starting at high current during jog/reverse cycles.',
  },
  'DC-4': {
    category: 'DC-4',
    description: 'DC series motors: starting and stopping',
    multiplier: 1.5,
    recommendedTripCurve: 'C',
    systemType: 'dc',
    applications: [
      'DC series motors (traction)',
      'Hoists and winches (DC)',
    ],
    notes: 'Series motor starting current depends on load. 1.5× multiplier for normal start/stop duty.',
  },
  'DC-5': {
    category: 'DC-5',
    description: 'DC series motors: jogging and reversing',
    multiplier: 2.5,
    recommendedTripCurve: 'D',
    systemType: 'dc',
    applications: [
      'DC series motors with frequent reversing',
      'Crane travel drives (DC)',
    ],
    notes: 'Severe duty. 2.5× multiplier for thermal stress from repeated starts under load.',
  },
};

/**
 * Get utilization categories filtered by system type
 */
export function getUtilizationCategoriesBySystem(
  systemType: 'ac' | 'dc'
): IECUtilizationCategoryData[] {
  return Object.values(IEC_UTILIZATION_CATEGORIES).filter(
    (cat) => cat.systemType === systemType
  );
}

/**
 * Get a specific utilization category
 */
export function getUtilizationCategory(
  category: IECUtilizationCategory
): IECUtilizationCategoryData {
  return IEC_UTILIZATION_CATEGORIES[category];
}
