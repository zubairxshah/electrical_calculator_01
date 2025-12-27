/**
 * Battery Types Reference Data
 *
 * Comprehensive reference data for battery technology comparison:
 * - VRLA (Valve Regulated Lead-Acid)
 * - Lithium-Ion (various chemistries)
 * - NiCd (Nickel-Cadmium)
 * - NiFe (Nickel-Iron)
 * - Flow Batteries
 *
 * Data sourced from:
 * - IEEE 485-2020 (Lead-acid battery sizing)
 * - IEEE 1188-2005 (VRLA batteries)
 * - IEC 62619 (Li-ion safety)
 * - Manufacturer specifications
 *
 * @see specs/001-electromate-engineering-app/spec.md#US6
 */

/**
 * Battery chemistry type identifiers
 */
export type BatteryChemistry =
  | 'VRLA-AGM'
  | 'VRLA-GEL'
  | 'Li-Ion-LFP'
  | 'Li-Ion-NMC'
  | 'Li-Ion-LTO'
  | 'NiCd'
  | 'NiFe'
  | 'Flow-Vanadium'

/**
 * Application context for battery selection
 */
export type ApplicationContext =
  | 'ups-data-center'
  | 'ups-commercial'
  | 'ups-residential'
  | 'solar-off-grid'
  | 'solar-hybrid'
  | 'telecom'
  | 'industrial'
  | 'marine'
  | 'ev-stationary'

/**
 * Battery type specification
 */
export interface BatteryTypeSpec {
  /** Battery chemistry identifier */
  id: BatteryChemistry
  /** Display name */
  name: string
  /** Full chemistry name */
  fullName: string
  /** Technology category */
  category: 'Lead-Acid' | 'Lithium-Ion' | 'Nickel-Based' | 'Flow'

  /** Lifespan characteristics */
  lifespan: {
    /** Design life in years (float service) */
    designLifeYears: { min: number; max: number; typical: number }
    /** Cycle life at rated DoD */
    cycleLife: { min: number; max: number; typical: number }
    /** DoD used for cycle life rating */
    cycleLifeDoD: number
  }

  /** Temperature characteristics */
  temperature: {
    /** Optimal operating range (°C) */
    optimal: { min: number; max: number }
    /** Extended operating range (°C) */
    operating: { min: number; max: number }
    /** Storage temperature range (°C) */
    storage: { min: number; max: number }
    /** Temperature coefficient (%/°C capacity loss above 25°C) */
    tempCoefficient: number
  }

  /** Depth of Discharge characteristics */
  depthOfDischarge: {
    /** Recommended DoD for daily cycling (%) */
    recommended: number
    /** Maximum DoD for emergency (%) */
    maximum: number
    /** DoD impact on cycle life (cycles lost per 10% DoD increase) */
    cycleImpact: number
  }

  /** Efficiency characteristics */
  efficiency: {
    /** Round-trip efficiency (%) */
    roundTrip: { min: number; max: number; typical: number }
    /** Self-discharge rate (%/month at 25°C) */
    selfDischarge: number
    /** Charge efficiency (%) */
    chargeEfficiency: number
  }

  /** Maintenance requirements */
  maintenance: {
    /** Maintenance level */
    level: 'None' | 'Low' | 'Medium' | 'High'
    /** Maintenance description */
    description: string
    /** Typical maintenance interval (months) */
    intervalMonths: number | null
    /** Requires ventilation */
    requiresVentilation: boolean
    /** Requires temperature control */
    requiresTempControl: boolean
  }

  /** Cost characteristics */
  cost: {
    /** Relative initial cost index (1-10, VRLA-AGM = 1) */
    initialCostIndex: number
    /** Relative lifecycle cost index (1-10) */
    lifecycleCostIndex: number
    /** Cost trend */
    trend: 'Decreasing' | 'Stable' | 'Increasing'
  }

  /** Safety characteristics */
  safety: {
    /** Thermal runaway risk */
    thermalRunawayRisk: 'None' | 'Low' | 'Medium' | 'High'
    /** Fire risk rating */
    fireRisk: 'Very Low' | 'Low' | 'Medium' | 'High'
    /** Hydrogen generation during charging */
    hydrogenGeneration: boolean
    /** Transportation classification */
    transportClass: 'Non-hazardous' | 'Class 8' | 'Class 9'
  }

  /** Best-fit applications */
  bestApplications: ApplicationContext[]

  /** Standard references */
  standardReferences: string[]

  /** Additional notes */
  notes: string[]
}

/**
 * Application context descriptions
 */
export const APPLICATION_CONTEXTS: Record<
  ApplicationContext,
  { name: string; description: string; priorities: string[] }
> = {
  'ups-data-center': {
    name: 'UPS - Data Center',
    description: 'Critical power backup for data centers and IT infrastructure',
    priorities: ['Reliability', 'Fast response', 'High power density', 'Low maintenance'],
  },
  'ups-commercial': {
    name: 'UPS - Commercial',
    description: 'Backup power for commercial buildings and offices',
    priorities: ['Cost-effectiveness', 'Reliability', 'Moderate runtime'],
  },
  'ups-residential': {
    name: 'UPS - Residential',
    description: 'Home backup power and essential loads protection',
    priorities: ['Affordability', 'Safety', 'Low maintenance', 'Compact size'],
  },
  'solar-off-grid': {
    name: 'Solar Off-Grid',
    description: 'Energy storage for off-grid solar installations',
    priorities: ['Deep cycling', 'Long cycle life', 'Temperature tolerance', 'DoD flexibility'],
  },
  'solar-hybrid': {
    name: 'Solar Hybrid/Grid-Tied',
    description: 'Energy storage for grid-tied solar with backup capability',
    priorities: ['Efficiency', 'Cycle life', 'Smart integration', 'Warranty'],
  },
  telecom: {
    name: 'Telecommunications',
    description: 'Backup power for cell towers and telecom equipment',
    priorities: ['Temperature tolerance', 'Reliability', 'Remote monitoring', 'Long standby'],
  },
  industrial: {
    name: 'Industrial',
    description: 'Heavy-duty applications, forklifts, material handling',
    priorities: ['Durability', 'High discharge rates', 'Abuse tolerance'],
  },
  marine: {
    name: 'Marine',
    description: 'Boats, yachts, and marine applications',
    priorities: ['Vibration resistance', 'Sealed design', 'Corrosion resistance'],
  },
  'ev-stationary': {
    name: 'Second-Life EV Batteries',
    description: 'Repurposed electric vehicle batteries for stationary storage',
    priorities: ['Cost savings', 'Sustainability', 'Capacity assessment'],
  },
}

/**
 * VRLA-AGM Battery Specification
 */
export const VRLA_AGM: BatteryTypeSpec = {
  id: 'VRLA-AGM',
  name: 'VRLA (AGM)',
  fullName: 'Valve Regulated Lead-Acid - Absorbed Glass Mat',
  category: 'Lead-Acid',

  lifespan: {
    designLifeYears: { min: 3, max: 12, typical: 5 },
    cycleLife: { min: 200, max: 500, typical: 300 },
    cycleLifeDoD: 50,
  },

  temperature: {
    optimal: { min: 20, max: 25 },
    operating: { min: -20, max: 50 },
    storage: { min: -40, max: 60 },
    tempCoefficient: 2,
  },

  depthOfDischarge: {
    recommended: 50,
    maximum: 80,
    cycleImpact: 50,
  },

  efficiency: {
    roundTrip: { min: 80, max: 90, typical: 85 },
    selfDischarge: 3,
    chargeEfficiency: 90,
  },

  maintenance: {
    level: 'Low',
    description: 'Periodic visual inspection, terminal cleaning, voltage checks',
    intervalMonths: 6,
    requiresVentilation: false,
    requiresTempControl: true,
  },

  cost: {
    initialCostIndex: 1,
    lifecycleCostIndex: 3,
    trend: 'Stable',
  },

  safety: {
    thermalRunawayRisk: 'Low',
    fireRisk: 'Low',
    hydrogenGeneration: false,
    transportClass: 'Non-hazardous',
  },

  bestApplications: ['ups-data-center', 'ups-commercial', 'telecom'],

  standardReferences: ['IEEE 1188-2005', 'IEC 60896-21', 'UL 1989'],

  notes: [
    'Most common UPS battery technology',
    'Spill-proof design suitable for rack mounting',
    'Temperature significantly affects lifespan (halves for every 8-10°C above 25°C)',
    'Float voltage critical for longevity',
  ],
}

/**
 * VRLA-GEL Battery Specification
 */
export const VRLA_GEL: BatteryTypeSpec = {
  id: 'VRLA-GEL',
  name: 'VRLA (GEL)',
  fullName: 'Valve Regulated Lead-Acid - Gelled Electrolyte',
  category: 'Lead-Acid',

  lifespan: {
    designLifeYears: { min: 5, max: 15, typical: 8 },
    cycleLife: { min: 400, max: 800, typical: 500 },
    cycleLifeDoD: 50,
  },

  temperature: {
    optimal: { min: 20, max: 25 },
    operating: { min: -30, max: 55 },
    storage: { min: -40, max: 60 },
    tempCoefficient: 1.5,
  },

  depthOfDischarge: {
    recommended: 50,
    maximum: 80,
    cycleImpact: 40,
  },

  efficiency: {
    roundTrip: { min: 80, max: 88, typical: 84 },
    selfDischarge: 2,
    chargeEfficiency: 88,
  },

  maintenance: {
    level: 'Low',
    description: 'Periodic visual inspection, terminal cleaning, voltage checks',
    intervalMonths: 6,
    requiresVentilation: false,
    requiresTempControl: true,
  },

  cost: {
    initialCostIndex: 1.5,
    lifecycleCostIndex: 2.5,
    trend: 'Stable',
  },

  safety: {
    thermalRunawayRisk: 'Low',
    fireRisk: 'Very Low',
    hydrogenGeneration: false,
    transportClass: 'Non-hazardous',
  },

  bestApplications: ['solar-off-grid', 'marine', 'telecom'],

  standardReferences: ['IEEE 1188-2005', 'IEC 60896-22', 'UL 1989'],

  notes: [
    'Better deep-cycle performance than AGM',
    'More tolerant of partial state of charge',
    'Lower charge acceptance rate than AGM',
    'Excellent for slow, deep discharge applications',
  ],
}

/**
 * Lithium Iron Phosphate (LFP) Battery Specification
 */
export const LI_ION_LFP: BatteryTypeSpec = {
  id: 'Li-Ion-LFP',
  name: 'LiFePO4 (LFP)',
  fullName: 'Lithium Iron Phosphate',
  category: 'Lithium-Ion',

  lifespan: {
    designLifeYears: { min: 10, max: 20, typical: 15 },
    cycleLife: { min: 2000, max: 5000, typical: 3500 },
    cycleLifeDoD: 80,
  },

  temperature: {
    optimal: { min: 15, max: 35 },
    operating: { min: -20, max: 60 },
    storage: { min: -30, max: 45 },
    tempCoefficient: 0.5,
  },

  depthOfDischarge: {
    recommended: 80,
    maximum: 100,
    cycleImpact: 10,
  },

  efficiency: {
    roundTrip: { min: 92, max: 98, typical: 95 },
    selfDischarge: 1,
    chargeEfficiency: 98,
  },

  maintenance: {
    level: 'None',
    description: 'No regular maintenance required; BMS handles cell balancing',
    intervalMonths: null,
    requiresVentilation: false,
    requiresTempControl: false,
  },

  cost: {
    initialCostIndex: 3,
    lifecycleCostIndex: 1.5,
    trend: 'Decreasing',
  },

  safety: {
    thermalRunawayRisk: 'Low',
    fireRisk: 'Low',
    hydrogenGeneration: false,
    transportClass: 'Class 9',
  },

  bestApplications: ['solar-off-grid', 'solar-hybrid', 'ups-residential', 'marine'],

  standardReferences: ['IEC 62619', 'UL 1973', 'UN 38.3'],

  notes: [
    'Most thermally stable lithium chemistry',
    'Excellent cycle life and calendar life',
    'Flat discharge curve maintains voltage',
    'Lower energy density than NMC but safer',
    'Recommended for residential and solar applications',
  ],
}

/**
 * Lithium Nickel Manganese Cobalt (NMC) Battery Specification
 */
export const LI_ION_NMC: BatteryTypeSpec = {
  id: 'Li-Ion-NMC',
  name: 'Li-Ion (NMC)',
  fullName: 'Lithium Nickel Manganese Cobalt Oxide',
  category: 'Lithium-Ion',

  lifespan: {
    designLifeYears: { min: 8, max: 15, typical: 10 },
    cycleLife: { min: 1000, max: 3000, typical: 2000 },
    cycleLifeDoD: 80,
  },

  temperature: {
    optimal: { min: 15, max: 35 },
    operating: { min: -20, max: 55 },
    storage: { min: -30, max: 40 },
    tempCoefficient: 0.8,
  },

  depthOfDischarge: {
    recommended: 80,
    maximum: 100,
    cycleImpact: 15,
  },

  efficiency: {
    roundTrip: { min: 90, max: 96, typical: 94 },
    selfDischarge: 2,
    chargeEfficiency: 97,
  },

  maintenance: {
    level: 'None',
    description: 'No regular maintenance required; BMS handles cell balancing',
    intervalMonths: null,
    requiresVentilation: false,
    requiresTempControl: true,
  },

  cost: {
    initialCostIndex: 3.5,
    lifecycleCostIndex: 2,
    trend: 'Decreasing',
  },

  safety: {
    thermalRunawayRisk: 'Medium',
    fireRisk: 'Medium',
    hydrogenGeneration: false,
    transportClass: 'Class 9',
  },

  bestApplications: ['ups-data-center', 'ups-commercial', 'ev-stationary'],

  standardReferences: ['IEC 62619', 'UL 1973', 'UN 38.3'],

  notes: [
    'Higher energy density than LFP',
    'Common in electric vehicles',
    'Requires more sophisticated BMS and thermal management',
    'Best for space-constrained applications',
  ],
}

/**
 * Lithium Titanate (LTO) Battery Specification
 */
export const LI_ION_LTO: BatteryTypeSpec = {
  id: 'Li-Ion-LTO',
  name: 'Li-Ion (LTO)',
  fullName: 'Lithium Titanate Oxide',
  category: 'Lithium-Ion',

  lifespan: {
    designLifeYears: { min: 15, max: 30, typical: 20 },
    cycleLife: { min: 15000, max: 25000, typical: 20000 },
    cycleLifeDoD: 80,
  },

  temperature: {
    optimal: { min: 10, max: 40 },
    operating: { min: -40, max: 65 },
    storage: { min: -50, max: 60 },
    tempCoefficient: 0.3,
  },

  depthOfDischarge: {
    recommended: 90,
    maximum: 100,
    cycleImpact: 5,
  },

  efficiency: {
    roundTrip: { min: 93, max: 98, typical: 96 },
    selfDischarge: 0.5,
    chargeEfficiency: 99,
  },

  maintenance: {
    level: 'None',
    description: 'No regular maintenance required',
    intervalMonths: null,
    requiresVentilation: false,
    requiresTempControl: false,
  },

  cost: {
    initialCostIndex: 6,
    lifecycleCostIndex: 1,
    trend: 'Decreasing',
  },

  safety: {
    thermalRunawayRisk: 'None',
    fireRisk: 'Very Low',
    hydrogenGeneration: false,
    transportClass: 'Class 9',
  },

  bestApplications: ['industrial', 'ups-data-center', 'telecom'],

  standardReferences: ['IEC 62619', 'UL 1973', 'UN 38.3'],

  notes: [
    'Exceptional cycle life (20,000+ cycles)',
    'Very fast charging capability (10-15 minutes)',
    'Widest temperature operating range',
    'Lower energy density - larger footprint',
    'Highest upfront cost but lowest lifecycle cost',
  ],
}

/**
 * Nickel-Cadmium (NiCd) Battery Specification
 */
export const NICD: BatteryTypeSpec = {
  id: 'NiCd',
  name: 'NiCd',
  fullName: 'Nickel-Cadmium',
  category: 'Nickel-Based',

  lifespan: {
    designLifeYears: { min: 15, max: 25, typical: 20 },
    cycleLife: { min: 1500, max: 3000, typical: 2000 },
    cycleLifeDoD: 80,
  },

  temperature: {
    optimal: { min: 15, max: 30 },
    operating: { min: -40, max: 60 },
    storage: { min: -50, max: 50 },
    tempCoefficient: 0.2,
  },

  depthOfDischarge: {
    recommended: 80,
    maximum: 100,
    cycleImpact: 8,
  },

  efficiency: {
    roundTrip: { min: 70, max: 80, typical: 75 },
    selfDischarge: 10,
    chargeEfficiency: 85,
  },

  maintenance: {
    level: 'Medium',
    description: 'Periodic electrolyte level checks, equalization charges, terminal cleaning',
    intervalMonths: 3,
    requiresVentilation: true,
    requiresTempControl: false,
  },

  cost: {
    initialCostIndex: 4,
    lifecycleCostIndex: 2,
    trend: 'Stable',
  },

  safety: {
    thermalRunawayRisk: 'None',
    fireRisk: 'Very Low',
    hydrogenGeneration: true,
    transportClass: 'Class 8',
  },

  bestApplications: ['industrial', 'telecom', 'ups-data-center'],

  standardReferences: ['IEEE 1106-2015', 'IEC 60623', 'IEC 62259'],

  notes: [
    'Extremely robust and abuse-tolerant',
    'Works in extreme temperature conditions',
    'Contains toxic cadmium - disposal restrictions',
    'Memory effect requires occasional full discharge',
    'Legacy technology being phased out in some regions',
  ],
}

/**
 * Nickel-Iron (NiFe) Battery Specification
 */
export const NIFE: BatteryTypeSpec = {
  id: 'NiFe',
  name: 'NiFe (Edison)',
  fullName: 'Nickel-Iron (Edison Battery)',
  category: 'Nickel-Based',

  lifespan: {
    designLifeYears: { min: 20, max: 50, typical: 30 },
    cycleLife: { min: 3000, max: 11000, typical: 5000 },
    cycleLifeDoD: 80,
  },

  temperature: {
    optimal: { min: 15, max: 40 },
    operating: { min: -30, max: 60 },
    storage: { min: -40, max: 50 },
    tempCoefficient: 0.1,
  },

  depthOfDischarge: {
    recommended: 80,
    maximum: 100,
    cycleImpact: 3,
  },

  efficiency: {
    roundTrip: { min: 60, max: 70, typical: 65 },
    selfDischarge: 15,
    chargeEfficiency: 75,
  },

  maintenance: {
    level: 'High',
    description: 'Regular water addition, electrolyte replacement every 5-10 years',
    intervalMonths: 1,
    requiresVentilation: true,
    requiresTempControl: false,
  },

  cost: {
    initialCostIndex: 5,
    lifecycleCostIndex: 1.5,
    trend: 'Stable',
  },

  safety: {
    thermalRunawayRisk: 'None',
    fireRisk: 'Very Low',
    hydrogenGeneration: true,
    transportClass: 'Class 8',
  },

  bestApplications: ['solar-off-grid', 'industrial'],

  standardReferences: ['IEC 60623', 'IEC 62259'],

  notes: [
    'Extremely long lifespan (30-50+ years)',
    'Nearly indestructible - tolerates abuse, overcharge, deep discharge',
    'No toxic materials - environmentally friendly',
    'Low efficiency (65%) increases system sizing requirements',
    'High maintenance with regular watering',
    'Niche application in remote off-grid systems',
  ],
}

/**
 * Vanadium Redox Flow Battery Specification
 */
export const FLOW_VANADIUM: BatteryTypeSpec = {
  id: 'Flow-Vanadium',
  name: 'Vanadium Flow',
  fullName: 'Vanadium Redox Flow Battery (VRFB)',
  category: 'Flow',

  lifespan: {
    designLifeYears: { min: 20, max: 30, typical: 25 },
    cycleLife: { min: 10000, max: 20000, typical: 15000 },
    cycleLifeDoD: 100,
  },

  temperature: {
    optimal: { min: 10, max: 35 },
    operating: { min: 5, max: 45 },
    storage: { min: 0, max: 40 },
    tempCoefficient: 0.5,
  },

  depthOfDischarge: {
    recommended: 100,
    maximum: 100,
    cycleImpact: 0,
  },

  efficiency: {
    roundTrip: { min: 65, max: 80, typical: 75 },
    selfDischarge: 0,
    chargeEfficiency: 85,
  },

  maintenance: {
    level: 'Medium',
    description: 'Pump and membrane maintenance, electrolyte monitoring',
    intervalMonths: 12,
    requiresVentilation: true,
    requiresTempControl: true,
  },

  cost: {
    initialCostIndex: 8,
    lifecycleCostIndex: 1,
    trend: 'Decreasing',
  },

  safety: {
    thermalRunawayRisk: 'None',
    fireRisk: 'Very Low',
    hydrogenGeneration: false,
    transportClass: 'Non-hazardous',
  },

  bestApplications: ['solar-hybrid', 'industrial'],

  standardReferences: ['IEC 62932-2-1', 'UL 1973'],

  notes: [
    'Capacity and power are independently scalable',
    'No capacity degradation over time - electrolyte lasts indefinitely',
    '100% DoD with no impact on cycle life',
    'Large footprint - not suitable for residential',
    'Best for utility-scale and long-duration storage (4+ hours)',
    'Non-flammable aqueous electrolyte',
  ],
}

/**
 * All battery types registry
 */
export const ALL_BATTERY_TYPES: BatteryTypeSpec[] = [
  VRLA_AGM,
  VRLA_GEL,
  LI_ION_LFP,
  LI_ION_NMC,
  LI_ION_LTO,
  NICD,
  NIFE,
  FLOW_VANADIUM,
]

/**
 * Get battery type by ID
 */
export function getBatteryTypeById(id: BatteryChemistry): BatteryTypeSpec | undefined {
  return ALL_BATTERY_TYPES.find((bt) => bt.id === id)
}

/**
 * Get battery types by category
 */
export function getBatteryTypesByCategory(
  category: BatteryTypeSpec['category']
): BatteryTypeSpec[] {
  return ALL_BATTERY_TYPES.filter((bt) => bt.category === category)
}

/**
 * Get battery types suitable for application
 */
export function getBatteryTypesForApplication(
  application: ApplicationContext
): BatteryTypeSpec[] {
  return ALL_BATTERY_TYPES.filter((bt) => bt.bestApplications.includes(application))
}

/**
 * Filter battery types by temperature range
 */
export function filterByTemperatureRange(
  minTemp: number,
  maxTemp: number
): BatteryTypeSpec[] {
  return ALL_BATTERY_TYPES.filter(
    (bt) => bt.temperature.operating.min <= minTemp && bt.temperature.operating.max >= maxTemp
  )
}

/**
 * Filter battery types by minimum DoD requirement
 */
export function filterByMinimumDoD(minDoD: number): BatteryTypeSpec[] {
  return ALL_BATTERY_TYPES.filter((bt) => bt.depthOfDischarge.recommended >= minDoD)
}

/**
 * Sort battery types by lifecycle cost (best first)
 */
export function sortByLifecycleCost(types: BatteryTypeSpec[]): BatteryTypeSpec[] {
  return [...types].sort((a, b) => a.cost.lifecycleCostIndex - b.cost.lifecycleCostIndex)
}

/**
 * Sort battery types by cycle life (best first)
 */
export function sortByCycleLife(types: BatteryTypeSpec[]): BatteryTypeSpec[] {
  return [...types].sort((a, b) => b.lifespan.cycleLife.typical - a.lifespan.cycleLife.typical)
}

/**
 * Get recommended battery types for application with scoring
 */
export interface BatteryRecommendation {
  battery: BatteryTypeSpec
  score: number
  reasons: string[]
}

export function getRecommendations(
  application: ApplicationContext,
  requirements?: {
    minTemp?: number
    maxTemp?: number
    minDoD?: number
    maxInitialCost?: number
    prioritizeCycleLife?: boolean
    prioritizeEfficiency?: boolean
  }
): BatteryRecommendation[] {
  const recommendations: BatteryRecommendation[] = []

  for (const battery of ALL_BATTERY_TYPES) {
    let score = 0
    const reasons: string[] = []

    // Base score for application match
    if (battery.bestApplications.includes(application)) {
      score += 30
      reasons.push('Recommended for ' + APPLICATION_CONTEXTS[application].name)
    }

    // Temperature requirements
    if (requirements?.minTemp !== undefined || requirements?.maxTemp !== undefined) {
      const minT = requirements.minTemp ?? -20
      const maxT = requirements.maxTemp ?? 50
      if (battery.temperature.operating.min <= minT && battery.temperature.operating.max >= maxT) {
        score += 15
        reasons.push('Meets temperature requirements')
      } else {
        score -= 20
      }
    }

    // DoD requirements
    if (requirements?.minDoD !== undefined) {
      if (battery.depthOfDischarge.recommended >= requirements.minDoD) {
        score += 10
        reasons.push(`Supports ${requirements.minDoD}%+ DoD`)
      } else {
        score -= 15
      }
    }

    // Cost consideration
    if (requirements?.maxInitialCost !== undefined) {
      if (battery.cost.initialCostIndex <= requirements.maxInitialCost) {
        score += 10
        reasons.push('Within budget')
      } else {
        score -= 10
      }
    }

    // Cycle life priority
    if (requirements?.prioritizeCycleLife) {
      score += Math.min(20, battery.lifespan.cycleLife.typical / 500)
      if (battery.lifespan.cycleLife.typical >= 3000) {
        reasons.push('Excellent cycle life')
      }
    }

    // Efficiency priority
    if (requirements?.prioritizeEfficiency) {
      score += (battery.efficiency.roundTrip.typical - 60) / 2
      if (battery.efficiency.roundTrip.typical >= 90) {
        reasons.push('High efficiency')
      }
    }

    // Lifecycle cost bonus
    score += (10 - battery.cost.lifecycleCostIndex) * 2

    // Safety bonus for residential
    if (application === 'ups-residential' || application === 'solar-off-grid') {
      if (battery.safety.fireRisk === 'Very Low' || battery.safety.fireRisk === 'Low') {
        score += 5
        reasons.push('Good safety profile')
      }
    }

    // Maintenance bonus
    if (battery.maintenance.level === 'None') {
      score += 5
      reasons.push('Maintenance-free')
    }

    recommendations.push({ battery, score, reasons })
  }

  // Sort by score (highest first)
  return recommendations.sort((a, b) => b.score - a.score)
}

/**
 * Glossary of battery terms
 */
export const BATTERY_GLOSSARY: Record<string, string> = {
  DoD: 'Depth of Discharge - The percentage of battery capacity that has been discharged relative to the total capacity. Higher DoD means deeper discharge.',
  'Cycle Life':
    'The number of complete charge/discharge cycles a battery can perform before its capacity drops to 80% of original.',
  'Round-Trip Efficiency':
    'The ratio of energy output to energy input, accounting for losses during charging and discharging.',
  'Self-Discharge':
    'The rate at which a battery loses charge when not in use, typically expressed as percentage per month.',
  'Temperature Coefficient':
    'The percentage of capacity lost for each degree Celsius above the optimal operating temperature.',
  'Thermal Runaway':
    'A dangerous condition where increasing temperature causes reactions that further increase temperature, potentially leading to fire or explosion.',
  BMS: 'Battery Management System - Electronic system that monitors and protects battery cells, managing charging, discharging, and cell balancing.',
  'Float Service':
    'Batteries kept at full charge with a constant voltage, typical for UPS and backup applications.',
  'Cycle Service':
    'Batteries regularly discharged and recharged, typical for solar and off-grid applications.',
  VRLA: 'Valve Regulated Lead-Acid - A type of lead-acid battery that is sealed and maintenance-free.',
  AGM: 'Absorbed Glass Mat - A VRLA technology where electrolyte is held in fiberglass mats.',
  GEL: 'Gelled Electrolyte - A VRLA technology where electrolyte is immobilized in silica gel.',
  LFP: 'Lithium Iron Phosphate (LiFePO4) - A lithium-ion chemistry known for safety and longevity.',
  NMC: 'Nickel Manganese Cobalt - A lithium-ion chemistry with high energy density.',
  LTO: 'Lithium Titanate Oxide - A lithium-ion chemistry with exceptional cycle life and fast charging.',
}
