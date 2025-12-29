/**
 * Built-in Luminaire Catalog
 *
 * Pre-loaded luminaire database with 50+ fixtures covering common
 * lighting applications. Based on typical manufacturer specifications.
 *
 * Reference: Various manufacturer data and IESNA Lighting Handbook
 */

import {
  type Luminaire,
  LuminaireCategory,
  DistributionType,
} from '@/lib/types/lighting';

/**
 * Generic LED Troffers (2x2, 2x4)
 */
const LED_TROFFERS: Luminaire[] = [
  {
    id: 'troffer-2x2-30w',
    manufacturer: 'Generic',
    model: 'LED Troffer 2x2 30W',
    category: LuminaireCategory.TROFFER,
    watts: 30,
    lumens: 3600,
    efficacy: 120,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.5,
    cri: 80,
    cct: 4000,
    dimmable: true,
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'troffer-2x2-40w',
    manufacturer: 'Generic',
    model: 'LED Troffer 2x2 40W',
    category: LuminaireCategory.TROFFER,
    watts: 40,
    lumens: 4800,
    efficacy: 120,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.5,
    cri: 80,
    cct: 4000,
    dimmable: true,
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'troffer-2x4-32w',
    manufacturer: 'Generic',
    model: 'LED Troffer 2x4 32W',
    category: LuminaireCategory.TROFFER,
    watts: 32,
    lumens: 4000,
    efficacy: 125,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.5,
    cri: 80,
    cct: 4000,
    dimmable: true,
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'troffer-2x4-40w',
    manufacturer: 'Generic',
    model: 'LED Troffer 2x4 40W',
    category: LuminaireCategory.TROFFER,
    watts: 40,
    lumens: 5000,
    efficacy: 125,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.5,
    cri: 80,
    cct: 4000,
    dimmable: true,
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'troffer-2x4-50w',
    manufacturer: 'Generic',
    model: 'LED Troffer 2x4 50W',
    category: LuminaireCategory.TROFFER,
    watts: 50,
    lumens: 6250,
    efficacy: 125,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.5,
    cri: 80,
    cct: 4000,
    dimmable: true,
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'troffer-2x4-60w-premium',
    manufacturer: 'Generic',
    model: 'LED Troffer 2x4 60W Premium',
    category: LuminaireCategory.TROFFER,
    watts: 60,
    lumens: 8100,
    efficacy: 135,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.5,
    cri: 90,
    cct: 4000,
    dimmable: true,
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'troffer-1x4-25w',
    manufacturer: 'Generic',
    model: 'LED Troffer 1x4 25W',
    category: LuminaireCategory.TROFFER,
    watts: 25,
    lumens: 3125,
    efficacy: 125,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.4,
    cri: 80,
    cct: 4000,
    dimmable: true,
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'troffer-1x4-35w',
    manufacturer: 'Generic',
    model: 'LED Troffer 1x4 35W',
    category: LuminaireCategory.TROFFER,
    watts: 35,
    lumens: 4375,
    efficacy: 125,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.4,
    cri: 80,
    cct: 4000,
    dimmable: true,
    ufTableId: 'generic-led-troffer',
  },
];

/**
 * LED High Bays (Industrial/Warehouse)
 */
const LED_HIGH_BAYS: Luminaire[] = [
  {
    id: 'highbay-100w',
    manufacturer: 'Generic',
    model: 'LED High Bay 100W',
    category: LuminaireCategory.HIGHBAY,
    watts: 100,
    lumens: 14000,
    efficacy: 140,
    beamAngle: 90,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.2,
    cri: 80,
    cct: 5000,
    dimmable: true,
    ipRating: 'IP65',
    ufTableId: 'led-high-bay',
  },
  {
    id: 'highbay-150w',
    manufacturer: 'Generic',
    model: 'LED High Bay 150W',
    category: LuminaireCategory.HIGHBAY,
    watts: 150,
    lumens: 21000,
    efficacy: 140,
    beamAngle: 90,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.2,
    cri: 80,
    cct: 5000,
    dimmable: true,
    ipRating: 'IP65',
    ufTableId: 'led-high-bay',
  },
  {
    id: 'highbay-200w',
    manufacturer: 'Generic',
    model: 'LED High Bay 200W',
    category: LuminaireCategory.HIGHBAY,
    watts: 200,
    lumens: 28000,
    efficacy: 140,
    beamAngle: 90,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.2,
    cri: 80,
    cct: 5000,
    dimmable: true,
    ipRating: 'IP65',
    ufTableId: 'led-high-bay',
  },
  {
    id: 'highbay-240w',
    manufacturer: 'Generic',
    model: 'LED High Bay 240W',
    category: LuminaireCategory.HIGHBAY,
    watts: 240,
    lumens: 33600,
    efficacy: 140,
    beamAngle: 90,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.2,
    cri: 80,
    cct: 5000,
    dimmable: true,
    ipRating: 'IP65',
    ufTableId: 'led-high-bay',
  },
  {
    id: 'highbay-300w',
    manufacturer: 'Generic',
    model: 'LED High Bay 300W',
    category: LuminaireCategory.HIGHBAY,
    watts: 300,
    lumens: 42000,
    efficacy: 140,
    beamAngle: 90,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.2,
    cri: 80,
    cct: 5000,
    dimmable: true,
    ipRating: 'IP65',
    ufTableId: 'led-high-bay',
  },
  {
    id: 'highbay-linear-160w',
    manufacturer: 'Generic',
    model: 'LED Linear High Bay 160W',
    category: LuminaireCategory.HIGHBAY,
    watts: 160,
    lumens: 22400,
    efficacy: 140,
    beamAngle: 100,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.3,
    cri: 80,
    cct: 5000,
    dimmable: true,
    ipRating: 'IP65',
    ufTableId: 'led-high-bay',
  },
  {
    id: 'highbay-linear-220w',
    manufacturer: 'Generic',
    model: 'LED Linear High Bay 220W',
    category: LuminaireCategory.HIGHBAY,
    watts: 220,
    lumens: 30800,
    efficacy: 140,
    beamAngle: 100,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.3,
    cri: 80,
    cct: 5000,
    dimmable: true,
    ipRating: 'IP65',
    ufTableId: 'led-high-bay',
  },
];

/**
 * LED Downlights (Recessed)
 */
const LED_DOWNLIGHTS: Luminaire[] = [
  {
    id: 'downlight-4in-10w',
    manufacturer: 'Generic',
    model: 'LED Downlight 4" 10W',
    category: LuminaireCategory.DOWNLIGHT,
    watts: 10,
    lumens: 800,
    efficacy: 80,
    beamAngle: 90,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.0,
    cri: 90,
    cct: 3000,
    dimmable: true,
    ufTableId: 'led-downlight',
  },
  {
    id: 'downlight-4in-15w',
    manufacturer: 'Generic',
    model: 'LED Downlight 4" 15W',
    category: LuminaireCategory.DOWNLIGHT,
    watts: 15,
    lumens: 1200,
    efficacy: 80,
    beamAngle: 90,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.0,
    cri: 90,
    cct: 3000,
    dimmable: true,
    ufTableId: 'led-downlight',
  },
  {
    id: 'downlight-6in-12w',
    manufacturer: 'Generic',
    model: 'LED Downlight 6" 12W',
    category: LuminaireCategory.DOWNLIGHT,
    watts: 12,
    lumens: 1000,
    efficacy: 83,
    beamAngle: 100,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.1,
    cri: 90,
    cct: 3000,
    dimmable: true,
    ufTableId: 'led-downlight',
  },
  {
    id: 'downlight-6in-18w',
    manufacturer: 'Generic',
    model: 'LED Downlight 6" 18W',
    category: LuminaireCategory.DOWNLIGHT,
    watts: 18,
    lumens: 1500,
    efficacy: 83,
    beamAngle: 100,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.1,
    cri: 90,
    cct: 3000,
    dimmable: true,
    ufTableId: 'led-downlight',
  },
  {
    id: 'downlight-8in-25w',
    manufacturer: 'Generic',
    model: 'LED Downlight 8" 25W',
    category: LuminaireCategory.DOWNLIGHT,
    watts: 25,
    lumens: 2250,
    efficacy: 90,
    beamAngle: 110,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.2,
    cri: 90,
    cct: 3000,
    dimmable: true,
    ufTableId: 'led-downlight',
  },
  {
    id: 'downlight-8in-35w',
    manufacturer: 'Generic',
    model: 'LED Downlight 8" 35W',
    category: LuminaireCategory.DOWNLIGHT,
    watts: 35,
    lumens: 3150,
    efficacy: 90,
    beamAngle: 110,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.2,
    cri: 90,
    cct: 3000,
    dimmable: true,
    ufTableId: 'led-downlight',
  },
];

/**
 * LED Strips/Linear Fixtures
 */
const LED_STRIPS: Luminaire[] = [
  {
    id: 'strip-4ft-20w',
    manufacturer: 'Generic',
    model: 'LED Strip 4ft 20W',
    category: LuminaireCategory.STRIP,
    watts: 20,
    lumens: 2600,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.4,
    cri: 80,
    cct: 4000,
    dimmable: false,
    ipRating: 'IP20',
    ufTableId: 'led-strip',
  },
  {
    id: 'strip-4ft-32w',
    manufacturer: 'Generic',
    model: 'LED Strip 4ft 32W',
    category: LuminaireCategory.STRIP,
    watts: 32,
    lumens: 4160,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.4,
    cri: 80,
    cct: 4000,
    dimmable: false,
    ipRating: 'IP20',
    ufTableId: 'led-strip',
  },
  {
    id: 'strip-4ft-44w',
    manufacturer: 'Generic',
    model: 'LED Strip 4ft 44W',
    category: LuminaireCategory.STRIP,
    watts: 44,
    lumens: 5720,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.4,
    cri: 80,
    cct: 4000,
    dimmable: false,
    ipRating: 'IP20',
    ufTableId: 'led-strip',
  },
  {
    id: 'strip-8ft-65w',
    manufacturer: 'Generic',
    model: 'LED Strip 8ft 65W',
    category: LuminaireCategory.STRIP,
    watts: 65,
    lumens: 8450,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT,
    maxSHR: 1.4,
    cri: 80,
    cct: 4000,
    dimmable: false,
    ipRating: 'IP20',
    ufTableId: 'led-strip',
  },
  {
    id: 'linear-pendant-40w',
    manufacturer: 'Generic',
    model: 'LED Linear Pendant 4ft 40W',
    category: LuminaireCategory.STRIP,
    watts: 40,
    lumens: 4800,
    efficacy: 120,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT_INDIRECT,
    maxSHR: 1.5,
    cri: 90,
    cct: 4000,
    dimmable: true,
    ufTableId: 'led-strip',
  },
  {
    id: 'linear-pendant-50w',
    manufacturer: 'Generic',
    model: 'LED Linear Pendant 4ft 50W',
    category: LuminaireCategory.STRIP,
    watts: 50,
    lumens: 6000,
    efficacy: 120,
    beamAngle: 120,
    distributionType: DistributionType.DIRECT_INDIRECT,
    maxSHR: 1.5,
    cri: 90,
    cct: 4000,
    dimmable: true,
    ufTableId: 'led-strip',
  },
];

/**
 * Wall Packs (Outdoor/Parking)
 */
const LED_WALLPACKS: Luminaire[] = [
  {
    id: 'wallpack-30w',
    manufacturer: 'Generic',
    model: 'LED Wall Pack 30W',
    category: LuminaireCategory.WALLPACK,
    watts: 30,
    lumens: 3900,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.ASYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP65',
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'wallpack-50w',
    manufacturer: 'Generic',
    model: 'LED Wall Pack 50W',
    category: LuminaireCategory.WALLPACK,
    watts: 50,
    lumens: 6500,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.ASYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP65',
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'wallpack-80w',
    manufacturer: 'Generic',
    model: 'LED Wall Pack 80W',
    category: LuminaireCategory.WALLPACK,
    watts: 80,
    lumens: 10400,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.ASYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP65',
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'wallpack-120w',
    manufacturer: 'Generic',
    model: 'LED Wall Pack 120W',
    category: LuminaireCategory.WALLPACK,
    watts: 120,
    lumens: 15600,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.ASYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP65',
    ufTableId: 'generic-led-troffer',
  },
];

/**
 * Decorative/Architectural
 */
const LED_DECORATIVE: Luminaire[] = [
  {
    id: 'pendant-globe-12w',
    manufacturer: 'Generic',
    model: 'Pendant Globe 12W',
    category: LuminaireCategory.DECORATIVE,
    watts: 12,
    lumens: 960,
    efficacy: 80,
    beamAngle: 360,
    distributionType: DistributionType.SYMMETRIC,
    maxSHR: 1.0,
    cri: 90,
    cct: 2700,
    dimmable: true,
    ufTableId: 'led-indirect',
  },
  {
    id: 'pendant-cylinder-15w',
    manufacturer: 'Generic',
    model: 'Pendant Cylinder 15W',
    category: LuminaireCategory.DECORATIVE,
    watts: 15,
    lumens: 1350,
    efficacy: 90,
    beamAngle: 60,
    distributionType: DistributionType.DIRECT,
    maxSHR: 0.8,
    cri: 90,
    cct: 3000,
    dimmable: true,
    ufTableId: 'led-downlight',
  },
  {
    id: 'wall-sconce-8w',
    manufacturer: 'Generic',
    model: 'Wall Sconce 8W',
    category: LuminaireCategory.DECORATIVE,
    watts: 8,
    lumens: 640,
    efficacy: 80,
    beamAngle: 180,
    distributionType: DistributionType.INDIRECT,
    maxSHR: 1.0,
    cri: 90,
    cct: 2700,
    dimmable: true,
    ufTableId: 'led-indirect',
  },
  {
    id: 'cove-lighting-10w-m',
    manufacturer: 'Generic',
    model: 'Cove Lighting 10W/m',
    category: LuminaireCategory.DECORATIVE,
    watts: 10,
    lumens: 800,
    efficacy: 80,
    beamAngle: 120,
    distributionType: DistributionType.INDIRECT,
    maxSHR: 1.0,
    cri: 90,
    cct: 3000,
    dimmable: true,
    ufTableId: 'led-indirect',
  },
];

/**
 * Floodlights (Outdoor)
 */
const LED_FLOODLIGHTS: Luminaire[] = [
  {
    id: 'flood-50w',
    manufacturer: 'Generic',
    model: 'LED Floodlight 50W',
    category: LuminaireCategory.FLOODLIGHT,
    watts: 50,
    lumens: 6500,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.SYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP66',
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'flood-100w',
    manufacturer: 'Generic',
    model: 'LED Floodlight 100W',
    category: LuminaireCategory.FLOODLIGHT,
    watts: 100,
    lumens: 13000,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.SYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP66',
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'flood-150w',
    manufacturer: 'Generic',
    model: 'LED Floodlight 150W',
    category: LuminaireCategory.FLOODLIGHT,
    watts: 150,
    lumens: 19500,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.SYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP66',
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'flood-200w',
    manufacturer: 'Generic',
    model: 'LED Floodlight 200W',
    category: LuminaireCategory.FLOODLIGHT,
    watts: 200,
    lumens: 26000,
    efficacy: 130,
    beamAngle: 120,
    distributionType: DistributionType.SYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP66',
    ufTableId: 'generic-led-troffer',
  },
];

/**
 * Emergency Lighting
 */
const LED_EMERGENCY: Luminaire[] = [
  {
    id: 'emergency-twin-spot',
    manufacturer: 'Generic',
    model: 'Emergency Twin Spot 6W',
    category: LuminaireCategory.EMERGENCY,
    watts: 6,
    lumens: 400,
    efficacy: 67,
    beamAngle: 60,
    distributionType: DistributionType.DIRECT,
    maxSHR: 0.8,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP20',
    ufTableId: 'led-downlight',
  },
  {
    id: 'emergency-bulkhead',
    manufacturer: 'Generic',
    model: 'Emergency Bulkhead 8W',
    category: LuminaireCategory.EMERGENCY,
    watts: 8,
    lumens: 600,
    efficacy: 75,
    beamAngle: 120,
    distributionType: DistributionType.SYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 4000,
    dimmable: false,
    ipRating: 'IP65',
    ufTableId: 'generic-led-troffer',
  },
  {
    id: 'emergency-exit-sign',
    manufacturer: 'Generic',
    model: 'LED Exit Sign 2W',
    category: LuminaireCategory.EMERGENCY,
    watts: 2,
    lumens: 100,
    efficacy: 50,
    beamAngle: 180,
    distributionType: DistributionType.SYMMETRIC,
    maxSHR: 1.0,
    cri: 70,
    cct: 5000,
    dimmable: false,
    ipRating: 'IP20',
    ufTableId: 'generic-led-troffer',
  },
];

/**
 * Complete luminaire catalog
 */
export const LUMINAIRE_CATALOG: Luminaire[] = [
  ...LED_TROFFERS,
  ...LED_HIGH_BAYS,
  ...LED_DOWNLIGHTS,
  ...LED_STRIPS,
  ...LED_WALLPACKS,
  ...LED_DECORATIVE,
  ...LED_FLOODLIGHTS,
  ...LED_EMERGENCY,
];

/**
 * Get all luminaires in catalog
 */
export function getAllLuminaires(): Luminaire[] {
  return LUMINAIRE_CATALOG;
}

/**
 * Get luminaire by ID
 */
export function getLuminaireById(id: string): Luminaire | undefined {
  return LUMINAIRE_CATALOG.find((l) => l.id === id);
}

/**
 * Get luminaires by category
 */
export function getLuminairesByCategory(category: LuminaireCategory): Luminaire[] {
  return LUMINAIRE_CATALOG.filter((l) => l.category === category);
}

/**
 * Search luminaires by manufacturer or model
 */
export function searchLuminaires(query: string): Luminaire[] {
  const lowerQuery = query.toLowerCase();
  return LUMINAIRE_CATALOG.filter(
    (l) =>
      l.manufacturer.toLowerCase().includes(lowerQuery) ||
      l.model.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter luminaires by criteria
 */
export function filterLuminaires(criteria: {
  category?: LuminaireCategory;
  minWatts?: number;
  maxWatts?: number;
  minLumens?: number;
  maxLumens?: number;
  minEfficacy?: number;
  dimmable?: boolean;
  minCRI?: number;
}): Luminaire[] {
  return LUMINAIRE_CATALOG.filter((l) => {
    if (criteria.category && l.category !== criteria.category) return false;
    if (criteria.minWatts && l.watts < criteria.minWatts) return false;
    if (criteria.maxWatts && l.watts > criteria.maxWatts) return false;
    if (criteria.minLumens && l.lumens < criteria.minLumens) return false;
    if (criteria.maxLumens && l.lumens > criteria.maxLumens) return false;
    if (criteria.minEfficacy && l.efficacy < criteria.minEfficacy) return false;
    if (criteria.dimmable !== undefined && l.dimmable !== criteria.dimmable) return false;
    if (criteria.minCRI && (l.cri ?? 0) < criteria.minCRI) return false;
    return true;
  });
}

/**
 * Get luminaire categories with counts
 */
export function getCategoryCounts(): Record<LuminaireCategory, number> {
  const counts = {} as Record<LuminaireCategory, number>;
  for (const category of Object.values(LuminaireCategory)) {
    counts[category] = getLuminairesByCategory(category).length;
  }
  return counts;
}

/**
 * Get recommended luminaires for a space type
 */
export function getRecommendedLuminaires(
  spaceType: string,
  ceilingHeight: number
): Luminaire[] {
  // High ceiling (>5m) - recommend high bays
  if (ceilingHeight > 5) {
    return getLuminairesByCategory(LuminaireCategory.HIGHBAY);
  }

  // Map space types to recommended categories
  const recommendations: Record<string, LuminaireCategory[]> = {
    office_general: [LuminaireCategory.TROFFER, LuminaireCategory.STRIP],
    office_detailed: [LuminaireCategory.TROFFER, LuminaireCategory.STRIP],
    classroom: [LuminaireCategory.TROFFER, LuminaireCategory.STRIP],
    conference: [LuminaireCategory.DOWNLIGHT, LuminaireCategory.STRIP],
    corridor: [LuminaireCategory.DOWNLIGHT, LuminaireCategory.STRIP],
    lobby: [LuminaireCategory.DOWNLIGHT, LuminaireCategory.DECORATIVE],
    warehouse: [LuminaireCategory.HIGHBAY, LuminaireCategory.STRIP],
    warehouse_detailed: [LuminaireCategory.HIGHBAY],
    industrial: [LuminaireCategory.HIGHBAY],
    retail: [LuminaireCategory.DOWNLIGHT, LuminaireCategory.TROFFER],
    hospital_exam: [LuminaireCategory.TROFFER],
    parking_indoor: [LuminaireCategory.STRIP, LuminaireCategory.WALLPACK],
    custom: [LuminaireCategory.TROFFER, LuminaireCategory.DOWNLIGHT],
  };

  const categories = recommendations[spaceType] ?? [LuminaireCategory.TROFFER];
  return categories.flatMap((cat) => getLuminairesByCategory(cat));
}
