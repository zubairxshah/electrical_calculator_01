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
    illuminance: 750,
    description: 'Detailed drafting, CAD work, accounting',
    minIlluminance: 500,
    maxIlluminance: 1000,
    uniformityRequirement: 0.6,
  },
  {
    type: SpaceType.CLASSROOM,
    name: 'Classroom',
    illuminance: 500,
    description: 'Educational classrooms, lecture halls',
    minIlluminance: 300,
    maxIlluminance: 500,
    uniformityRequirement: 0.6,
  },
  {
    type: SpaceType.CONFERENCE,
    name: 'Conference Room',
    illuminance: 300,
    description: 'Conference and meeting rooms',
    minIlluminance: 200,
    maxIlluminance: 500,
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
  {
    type: SpaceType.WAREHOUSE,
    name: 'General Warehouse',
    illuminance: 200,
    description: 'Bulk storage, inactive storage',
    minIlluminance: 100,
    maxIlluminance: 300,
    uniformityRequirement: 0.3,
  },
  {
    type: SpaceType.WAREHOUSE_DETAILED,
    name: 'Warehouse (Detail Work)',
    illuminance: 500,
    description: 'Warehouse with picking, packing, detailed work',
    minIlluminance: 300,
    maxIlluminance: 500,
    uniformityRequirement: 0.4,
  },
  {
    type: SpaceType.INDUSTRIAL,
    name: 'Industrial Manufacturing',
    illuminance: 500,
    description: 'Manufacturing, assembly, machine shops',
    minIlluminance: 300,
    maxIlluminance: 750,
    uniformityRequirement: 0.4,
  },
  {
    type: SpaceType.RETAIL,
    name: 'Retail Sales Floor',
    illuminance: 500,
    description: 'Retail stores, showrooms',
    minIlluminance: 300,
    maxIlluminance: 1000,
    uniformityRequirement: 0.5,
  },
  {
    type: SpaceType.HOSPITAL_EXAM,
    name: 'Hospital Examination',
    illuminance: 1000,
    description: 'Medical examination rooms',
    minIlluminance: 500,
    maxIlluminance: 1500,
    uniformityRequirement: 0.6,
  },
  {
    type: SpaceType.PARKING_INDOOR,
    name: 'Indoor Parking',
    illuminance: 50,
    description: 'Enclosed parking structures',
    minIlluminance: 30,
    maxIlluminance: 100,
    uniformityRequirement: 0.25,
  },
  {
    type: SpaceType.CUSTOM,
    name: 'Custom',
    illuminance: 500,
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
