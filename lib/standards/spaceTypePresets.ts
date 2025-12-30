/**
 * Space Type Presets
 *
 * Recommended illuminance levels per IESNA Lighting Handbook.
 * These are target values for common space types.
 *
 * Reference: IESNA Lighting Handbook, 10th Edition, Chapter 10
 */

import { SpaceType } from '@/lib/types/lighting';

export interface SpaceTypePreset {
  /** Space type enum value */
  type: SpaceType;
  /** Display name */
  name: string;
  /** Recommended illuminance in lux */
  illuminance: number;
  /** Brief description */
  description: string;
  /** Minimum acceptable illuminance */
  minIlluminance: number;
  /** Maximum recommended illuminance */
  maxIlluminance: number;
  /** Recommended uniformity ratio (Emin/Eavg) */
  uniformityRequirement: number;
}

/**
 * Space type presets with IESNA-recommended illuminance levels
 */
export const SPACE_TYPE_PRESETS: SpaceTypePreset[] = [
  // Commercial Office Spaces
  {
    type: SpaceType.OFFICE_GENERAL,
    name: 'General Office',
    illuminance: 500,
    description: 'General office work, reading, writing',
    minIlluminance: 300,
    maxIlluminance: 500,
    uniformityRequirement: 0.6,
  },
  {
    type: SpaceType.OFFICE_DETAILED,
    name: 'Detailed Office Work',
    illuminance: 500,
    description: 'Detailed drafting, CAD work, accounting',
    minIlluminance: 300,
    maxIlluminance: 750,
    uniformityRequirement: 0.6,
  },
  {
    type: SpaceType.CLASSROOM,
    name: 'Classroom',
    illuminance: 300,
    description: 'Educational classrooms, lecture halls',
    minIlluminance: 200,
    maxIlluminance: 400,
    uniformityRequirement: 0.6,
  },
  {
    type: SpaceType.CONFERENCE,
    name: 'Conference Room',
    illuminance: 300,
    description: 'Conference and meeting rooms',
    minIlluminance: 200,
    maxIlluminance: 400,
    uniformityRequirement: 0.5,
  },
  {
    type: SpaceType.CORRIDOR,
    name: 'Corridor',
    illuminance: 100,
    description: 'Corridors and hallways',
    minIlluminance: 50,
    maxIlluminance: 150,
    uniformityRequirement: 0.4,
  },
  {
    type: SpaceType.LOBBY,
    name: 'Lobby/Reception',
    illuminance: 200,
    description: 'Reception areas, lobbies, waiting rooms',
    minIlluminance: 100,
    maxIlluminance: 300,
    uniformityRequirement: 0.5,
  },
  // Industrial & Warehouse
  {
    type: SpaceType.WAREHOUSE,
    name: 'General Warehouse',
    illuminance: 150,
    description: 'Bulk storage, inactive storage',
    minIlluminance: 100,
    maxIlluminance: 200,
    uniformityRequirement: 0.3,
  },
  {
    type: SpaceType.WAREHOUSE_DETAILED,
    name: 'Warehouse (Detail Work)',
    illuminance: 300,
    description: 'Warehouse with picking, packing, detailed work',
    minIlluminance: 200,
    maxIlluminance: 400,
    uniformityRequirement: 0.4,
  },
  {
    type: SpaceType.INDUSTRIAL,
    name: 'Industrial Manufacturing',
    illuminance: 300,
    description: 'Manufacturing, assembly, machine shops',
    minIlluminance: 200,
    maxIlluminance: 500,
    uniformityRequirement: 0.4,
  },
  // Commercial Retail
  {
    type: SpaceType.RETAIL,
    name: 'Retail Sales Floor',
    illuminance: 500,
    description: 'General retail stores, showrooms',
    minIlluminance: 300,
    maxIlluminance: 750,
    uniformityRequirement: 0.5,
  },
  {
    type: SpaceType.RETAIL_STORE,
    name: 'Boutique/Store',
    illuminance: 300,
    description: 'Small retail stores, boutiques',
    minIlluminance: 200,
    maxIlluminance: 500,
    uniformityRequirement: 0.5,
  },
  {
    type: SpaceType.RETAIL_DISPLAY,
    name: 'Retail Display',
    illuminance: 500,
    description: 'Product display areas, feature lighting',
    minIlluminance: 300,
    maxIlluminance: 1000,
    uniformityRequirement: 0.4,
  },
  // Healthcare
  {
    type: SpaceType.HOSPITAL_EXAM,
    name: 'Hospital Examination',
    illuminance: 500,
    description: 'Medical examination rooms',
    minIlluminance: 300,
    maxIlluminance: 750,
    uniformityRequirement: 0.6,
  },
  // Parking
  {
    type: SpaceType.PARKING_INDOOR,
    name: 'Indoor Parking',
    illuminance: 50,
    description: 'Enclosed parking structures',
    minIlluminance: 30,
    maxIlluminance: 75,
    uniformityRequirement: 0.25,
  },
  // ============================================================================
  // Residential Spaces (lower illuminance for residential comfort)
  // ============================================================================
  {
    type: SpaceType.RESIDENTIAL_LIVING,
    name: 'Living Room',
    illuminance: 150,
    description: 'General living spaces, relaxation areas',
    minIlluminance: 100,
    maxIlluminance: 200,
    uniformityRequirement: 0.4,
  },
  {
    type: SpaceType.RESIDENTIAL_KITCHEN,
    name: 'Kitchen (Residential)',
    illuminance: 300,
    description: 'Residential kitchen, food preparation',
    minIlluminance: 200,
    maxIlluminance: 400,
    uniformityRequirement: 0.5,
  },
  {
    type: SpaceType.RESIDENTIAL_BEDROOM,
    name: 'Bedroom',
    illuminance: 100,
    description: 'Bedrooms, general illumination',
    minIlluminance: 50,
    maxIlluminance: 150,
    uniformityRequirement: 0.4,
  },
  {
    type: SpaceType.RESIDENTIAL_BATHROOM,
    name: 'Bathroom',
    illuminance: 200,
    description: 'Bathrooms, grooming areas',
    minIlluminance: 150,
    maxIlluminance: 300,
    uniformityRequirement: 0.5,
  },
  // ============================================================================
  // Hospitality (Hotels, Restaurants, Cafes)
  // ============================================================================
  {
    type: SpaceType.HOTEL_LOBBY,
    name: 'Hotel Lobby',
    illuminance: 200,
    description: 'Hotel reception and lobby areas',
    minIlluminance: 100,
    maxIlluminance: 300,
    uniformityRequirement: 0.5,
  },
  {
    type: SpaceType.HOTEL_GUEST_ROOM,
    name: 'Hotel Guest Room',
    illuminance: 150,
    description: 'Hotel room general lighting',
    minIlluminance: 100,
    maxIlluminance: 200,
    uniformityRequirement: 0.4,
  },
  {
    type: SpaceType.RESTAURANT_DINING,
    name: 'Restaurant Dining',
    illuminance: 150,
    description: 'Restaurant dining areas, ambient lighting',
    minIlluminance: 100,
    maxIlluminance: 200,
    uniformityRequirement: 0.4,
  },
  {
    type: SpaceType.RESTAURANT_KITCHEN,
    name: 'Commercial Kitchen',
    illuminance: 500,
    description: 'Commercial kitchen, food preparation areas',
    minIlluminance: 300,
    maxIlluminance: 750,
    uniformityRequirement: 0.5,
  },
  {
    type: SpaceType.CAFE_BISTRO,
    name: 'Cafe/Bistro',
    illuminance: 200,
    description: 'Cafe and bistro seating areas',
    minIlluminance: 100,
    maxIlluminance: 300,
    uniformityRequirement: 0.4,
  },
  // ============================================================================
  // Commercial Services
  // ============================================================================
  {
    type: SpaceType.SALON_BEAUTY,
    name: 'Salon/Beauty',
    illuminance: 500,
    description: 'Beauty salons, makeup stations',
    minIlluminance: 300,
    maxIlluminance: 750,
    uniformityRequirement: 0.6,
  },
  // ============================================================================
  // Food Processing (HACCP/FSMA compliant)
  // ============================================================================
  {
    type: SpaceType.FOOD_PREP,
    name: 'Food Preparation Area',
    illuminance: 500,
    description: 'Commercial food preparation (HACCP compliant)',
    minIlluminance: 300,
    maxIlluminance: 750,
    uniformityRequirement: 0.6,
  },
  {
    type: SpaceType.FOOD_STORAGE,
    name: 'Dry/Cold Storage',
    illuminance: 100,
    description: 'Food storage areas',
    minIlluminance: 50,
    maxIlluminance: 150,
    uniformityRequirement: 0.3,
  },
  {
    type: SpaceType.FOOD_SERVICE,
    name: 'Food Service Area',
    illuminance: 300,
    description: 'Cafeteria, buffet areas, serving lines',
    minIlluminance: 200,
    maxIlluminance: 400,
    uniformityRequirement: 0.5,
  },
  // Custom
  {
    type: SpaceType.CUSTOM,
    name: 'Custom',
    illuminance: 300,
    description: 'User-defined illuminance requirement',
    minIlluminance: 50,
    maxIlluminance: 5000,
    uniformityRequirement: 0.5,
  },
];

/**
 * Get preset for a space type
 */
export function getSpaceTypePreset(spaceType: SpaceType): SpaceTypePreset | undefined {
  return SPACE_TYPE_PRESETS.find((preset) => preset.type === spaceType);
}

/**
 * Get recommended illuminance for a space type
 */
export function getRecommendedIlluminance(spaceType: SpaceType): number {
  const preset = getSpaceTypePreset(spaceType);
  return preset?.illuminance ?? 500;
}

/**
 * Get uniformity requirement for a space type
 */
export function getUniformityRequirement(spaceType: SpaceType): number {
  const preset = getSpaceTypePreset(spaceType);
  return preset?.uniformityRequirement ?? 0.5;
}

/**
 * Check if illuminance is within recommended range
 */
export function isIlluminanceInRange(
  illuminance: number,
  spaceType: SpaceType
): { inRange: boolean; message?: string } {
  const preset = getSpaceTypePreset(spaceType);
  if (!preset) {
    return { inRange: true };
  }

  if (illuminance < preset.minIlluminance) {
    return {
      inRange: false,
      message: `Illuminance below minimum (${preset.minIlluminance} lux) for ${preset.name}`,
    };
  }

  if (illuminance > preset.maxIlluminance) {
    return {
      inRange: false,
      message: `Illuminance above maximum (${preset.maxIlluminance} lux) for ${preset.name}`,
    };
  }

  return { inRange: true };
}
