/**
 * IEC Trip Curve Definitions for Circuit Breakers
 *
 * Defines trip characteristics for miniature circuit breakers (MCBs) and molded case circuit breakers (MCCBs)
 * per IEC 60898-1 and IEC 60947-2.
 *
 * Trip curves define the time-current relationship: how long can current stay above rating before breaker trips?
 * This is critical for discriminating between:
 * - Inrush currents (motor starting, transformer energization) - should NOT trip
 * - Overload currents (sustained overload) - should trip after delay
 * - Fault currents (short circuit) - must trip immediately
 *
 * @module tripCurves
 */

/**
 * IEC Trip Curve Types
 *
 * Defined by instantaneous trip threshold as a multiple of rated current (In)
 */
export type TripCurveType = 'B' | 'C' | 'D' | 'K' | 'Z';

/**
 * NEC Trip Mechanism Types
 *
 * NEC doesn't define specific "curve types" but describes trip mechanisms
 */
export type NECTripType = 'thermal-magnetic' | 'electronic' | 'adjustable-magnetic';

/**
 * Load Type Classification
 *
 * Determines appropriate trip curve selection
 */
export type LoadType = 'resistive' | 'inductive' | 'mixed' | 'capacitive';

/**
 * Trip Curve Characteristic Interface
 */
export interface TripCurveCharacteristic {
  /** Trip curve type code */
  type: TripCurveType;

  /** Display name for user interface */
  displayName: string;

  /** Minimum instantaneous trip threshold (× In) */
  tripMin: number;

  /** Maximum instantaneous trip threshold (× In) */
  tripMax: number;

  /** Typical application scenarios */
  applications: string[];

  /** Load types this curve is suitable for */
  suitableLoadTypes: LoadType[];

  /** Inrush tolerance description */
  inrushCapability: string;

  /** Technical notes and considerations */
  notes: string;

  /** Reference standard */
  standard: string;
}

/**
 * IEC Trip Curve Definitions
 *
 * Per IEC 60898-1 for miniature circuit breakers
 *
 * @constant
 */
export const IEC_TRIP_CURVES: Record<TripCurveType, TripCurveCharacteristic> = {
  'B': {
    type: 'B',
    displayName: 'Type B (3-5× In)',
    tripMin: 3.0,
    tripMax: 5.0,
    applications: [
      'Residential lighting circuits',
      'Heating loads',
      'General residential branch circuits',
      'Loads with minimal inrush current'
    ],
    suitableLoadTypes: ['resistive'],
    inrushCapability: 'Low (3-5× rated current)',
    notes: 'Best for wire protection in residential applications. ' +
           'Will trip quickly on overloads. Not suitable for motor circuits.',
    standard: 'IEC 60898-1:2015'
  },

  'C': {
    type: 'C',
    displayName: 'Type C (5-10× In)',
    tripMin: 5.0,
    tripMax: 10.0,
    applications: [
      'General commercial and industrial circuits',
      'Mixed loads (lighting + small motors)',
      'Distribution panels',
      'Typical building installations'
    ],
    suitableLoadTypes: ['mixed', 'resistive', 'inductive'],
    inrushCapability: 'Medium (5-10× rated current)',
    notes: 'Most common type for commercial/industrial use. ' +
           'Balances wire protection with tolerance for moderate inrush. ' +
           'Suitable for most general-purpose applications.',
    standard: 'IEC 60898-1:2015'
  },

  'D': {
    type: 'D',
    displayName: 'Type D (10-20× In)',
    tripMin: 10.0,
    tripMax: 20.0,
    applications: [
      'Motor circuits (especially >3kW)',
      'Transformer primary circuits',
      'Welding equipment',
      'Equipment with high inrush current'
    ],
    suitableLoadTypes: ['inductive'],
    inrushCapability: 'High (10-20× rated current)',
    notes: 'Designed for loads with high starting currents. ' +
           'Motor starting current typically 6-10× rated. ' +
           'Essential for preventing nuisance tripping on motor startup.',
    standard: 'IEC 60898-1:2015'
  },

  'K': {
    type: 'K',
    displayName: 'Type K (8-12× In)',
    tripMin: 8.0,
    tripMax: 12.0,
    applications: [
      'Industrial circuits with high inrush',
      'Offshore installations',
      'Mining equipment',
      'Heavy-duty industrial motors'
    ],
    suitableLoadTypes: ['inductive', 'mixed'],
    inrushCapability: 'Medium-High (8-12× rated current)',
    notes: 'Specialized curve for harsh industrial environments. ' +
           'Provides better discrimination than Type C for industrial loads. ' +
           'Less common than B/C/D; check availability.',
    standard: 'IEC 60947-2'
  },

  'Z': {
    type: 'Z',
    displayName: 'Type Z (2-3× In)',
    tripMin: 2.0,
    tripMax: 3.0,
    applications: [
      'Sensitive electronic equipment',
      'Semiconductor protection circuits',
      'VFD (Variable Frequency Drive) inputs',
      'Control circuits requiring fast protection'
    ],
    suitableLoadTypes: ['resistive'],
    inrushCapability: 'Very Low (2-3× rated current)',
    notes: 'Extremely sensitive to overcurrent. ' +
           'Designed for semiconductor and electronic equipment protection. ' +
           'Will trip on minimal inrush - not suitable for motors or transformers.',
    standard: 'IEC 60947-2'
  }
};

/**
 * NEC Trip Type Characteristics
 *
 * NEC describes trip mechanisms rather than curves
 * Per UL 489 and NEC Article 240
 */
export interface NECTripCharacteristic {
  type: NECTripType;
  displayName: string;
  applications: string[];
  suitableLoadTypes: LoadType[];
  inrushCapability: string;
  notes: string;
  iecEquivalent: TripCurveType | null;
}

export const NEC_TRIP_TYPES: Record<NECTripType, NECTripCharacteristic> = {
  'thermal-magnetic': {
    type: 'thermal-magnetic',
    displayName: 'Thermal-Magnetic (Standard)',
    applications: [
      'General residential circuits',
      'Standard commercial circuits',
      'Distribution panels',
      'Most general-purpose applications'
    ],
    suitableLoadTypes: ['mixed', 'resistive', 'inductive'],
    inrushCapability: 'Medium (similar to IEC Type C)',
    notes: 'Bi-metallic thermal element for overload protection (slow response). ' +
           'Magnetic coil for short-circuit protection (fast response). ' +
           'Most common breaker type in North America. Fixed characteristics.',
    iecEquivalent: 'C'
  },

  'electronic': {
    type: 'electronic',
    displayName: 'Electronic Trip (Programmable)',
    applications: [
      'Critical industrial circuits',
      'Selective coordination requirements',
      'Load shedding applications',
      'Systems requiring remote monitoring'
    ],
    suitableLoadTypes: ['mixed', 'resistive', 'inductive', 'capacitive'],
    inrushCapability: 'Adjustable (configurable thresholds)',
    notes: 'Microprocessor-based trip unit with adjustable settings. ' +
           'Provides long-time, short-time, instantaneous, and ground fault protection. ' +
           'Allows custom trip curves and coordination. More expensive than thermal-magnetic.',
    iecEquivalent: null
  },

  'adjustable-magnetic': {
    type: 'adjustable-magnetic',
    displayName: 'Adjustable Magnetic Trip',
    applications: [
      'Large motor circuits',
      'Transformer primary protection',
      'Equipment with variable inrush',
      'Industrial feeder circuits'
    ],
    suitableLoadTypes: ['inductive'],
    inrushCapability: 'High (adjustable, typically 5-15× In)',
    notes: 'Fixed thermal element with adjustable magnetic trip point. ' +
           'Allows tuning for specific motor characteristics. ' +
           'Similar function to IEC Type D but with adjustment capability.',
    iecEquivalent: 'D'
  }
};

/**
 * Recommend trip curve/type based on load characteristics
 *
 * @param loadType - Type of electrical load
 * @param standard - Electrical standard ('NEC' or 'IEC')
 * @param notes - Optional additional considerations
 * @returns Recommended trip curve/type with justification
 *
 * @example
 * ```typescript
 * // IEC: Motor load
 * const rec1 = recommendTripCurve('inductive', 'IEC');
 * // Returns: { type: 'D', rationale: '...', ... }
 *
 * // NEC: Residential lighting
 * const rec2 = recommendTripCurve('resistive', 'NEC');
 * // Returns: { type: 'thermal-magnetic', rationale: '...', ... }
 * ```
 */
export function recommendTripCurve(
  loadType: LoadType,
  standard: 'NEC' | 'IEC',
  notes?: string
): TripCurveRecommendation {
  if (standard === 'IEC') {
    // IEC trip curve recommendation
    let curveType: TripCurveType;
    let rationale: string;

    switch (loadType) {
      case 'resistive':
        curveType = 'B';
        rationale = 'Resistive loads (heating, lighting) have minimal inrush current. ' +
                    'Type B provides excellent wire protection with fast overload response.';
        break;

      case 'inductive':
        curveType = 'D';
        rationale = 'Inductive loads (motors, transformers) have high starting currents ' +
                    '(typically 6-10× rated). Type D tolerates 10-20× inrush, preventing ' +
                    'nuisance tripping during motor startup while still protecting against faults.';
        break;

      case 'mixed':
        curveType = 'C';
        rationale = 'Mixed loads benefit from Type C\'s balanced characteristics. ' +
                    '5-10× inrush tolerance accommodates moderate motor starting while ' +
                    'providing adequate protection for resistive components.';
        break;

      case 'capacitive':
        curveType = 'C';
        rationale = 'Capacitive loads may have brief inrush during charging. ' +
                    'Type C provides sufficient margin for capacitor charging while ' +
                    'protecting against sustained overload. For very sensitive loads, consider Type Z.';
        break;

      default:
        curveType = 'C';
        rationale = 'Type C is the most versatile choice for general applications, ' +
                    'providing good balance between protection and inrush tolerance.';
    }

    const curve = IEC_TRIP_CURVES[curveType];

    return {
      standard: 'IEC',
      recommendation: curveType,
      displayName: curve.displayName,
      inrushCapability: curve.inrushCapability,
      rationale,
      applications: curve.applications,
      notes: notes ? `${curve.notes} Additional considerations: ${notes}` : curve.notes
    };
  } else {
    // NEC trip type recommendation
    let tripType: NECTripType;
    let rationale: string;

    switch (loadType) {
      case 'resistive':
        tripType = 'thermal-magnetic';
        rationale = 'Standard thermal-magnetic breakers are ideal for resistive loads. ' +
                    'Thermal element provides overload protection, magnetic element handles faults. ' +
                    'Most cost-effective and widely available option.';
        break;

      case 'inductive':
        tripType = 'adjustable-magnetic';
        rationale = 'Adjustable magnetic trip allows tuning for specific motor characteristics. ' +
                    'Prevents nuisance tripping during motor starting (typically 6-10× rated). ' +
                    'Essential for motors >5HP or circuits with multiple motors.';
        break;

      case 'mixed':
        tripType = 'thermal-magnetic';
        rationale = 'Standard thermal-magnetic breakers handle most mixed-load applications. ' +
                    'For critical circuits requiring selective coordination, consider electronic trip.';
        break;

      case 'capacitive':
        tripType = 'thermal-magnetic';
        rationale = 'Standard thermal-magnetic adequate for most capacitive loads. ' +
                    'For power factor correction capacitor banks, verify manufacturer ' +
                    'recommendations for inrush current handling.';
        break;

      default:
        tripType = 'thermal-magnetic';
        rationale = 'Standard thermal-magnetic breakers are suitable for general applications. ' +
                    'Proven reliability, wide availability, and cost-effective.';
    }

    const tripChar = NEC_TRIP_TYPES[tripType];

    return {
      standard: 'NEC',
      recommendation: tripType,
      displayName: tripChar.displayName,
      inrushCapability: tripChar.inrushCapability,
      rationale,
      applications: tripChar.applications,
      notes: notes ? `${tripChar.notes} Additional considerations: ${notes}` : tripChar.notes
    };
  }
}

/**
 * Trip Curve Recommendation Result
 */
export interface TripCurveRecommendation {
  standard: 'NEC' | 'IEC';
  recommendation: TripCurveType | NECTripType;
  displayName: string;
  inrushCapability: string;
  rationale: string;
  applications: string[];
  notes: string;
}

/**
 * Get all available trip curves/types for a standard
 *
 * @param standard - Electrical standard
 * @returns Array of available trip curve/type names
 */
export function getAvailableTripCurves(standard: 'NEC' | 'IEC'): string[] {
  if (standard === 'IEC') {
    return Object.keys(IEC_TRIP_CURVES);
  } else {
    return Object.keys(NEC_TRIP_TYPES);
  }
}

/**
 * Get detailed information about a specific trip curve/type
 *
 * @param curveType - Trip curve type code
 * @param standard - Electrical standard
 * @returns Trip curve characteristics or null if not found
 */
export function getTripCurveDetails(
  curveType: string,
  standard: 'NEC' | 'IEC'
): TripCurveCharacteristic | NECTripCharacteristic | null {
  if (standard === 'IEC') {
    return IEC_TRIP_CURVES[curveType as TripCurveType] || null;
  } else {
    return NEC_TRIP_TYPES[curveType as NECTripType] || null;
  }
}
