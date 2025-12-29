/**
 * Reflectance Defaults
 *
 * Typical surface reflectance values for different room finishes.
 * Used for default values and guidance in the UI.
 *
 * Reference: IESNA Lighting Handbook, 10th Edition, Chapter 9
 */

export interface ReflectancePreset {
  /** Preset name */
  name: string;
  /** Description of typical application */
  description: string;
  /** Ceiling reflectance (%) */
  ceiling: number;
  /** Wall reflectance (%) */
  wall: number;
  /** Floor reflectance (%) */
  floor: number;
}

/**
 * Standard reflectance presets for common room types
 */
export const REFLECTANCE_PRESETS: ReflectancePreset[] = [
  {
    name: 'Standard Office',
    description: 'White ceiling, light walls, medium carpet',
    ceiling: 80,
    wall: 50,
    floor: 20,
  },
  {
    name: 'Modern Office',
    description: 'White ceiling, light gray walls, dark floor',
    ceiling: 80,
    wall: 40,
    floor: 15,
  },
  {
    name: 'Industrial',
    description: 'Light concrete ceiling, painted block walls, concrete floor',
    ceiling: 50,
    wall: 30,
    floor: 20,
  },
  {
    name: 'Warehouse',
    description: 'Metal deck ceiling, concrete walls, concrete floor',
    ceiling: 30,
    wall: 30,
    floor: 20,
  },
  {
    name: 'Retail',
    description: 'White ceiling, colorful walls, polished floor',
    ceiling: 80,
    wall: 40,
    floor: 30,
  },
  {
    name: 'Healthcare',
    description: 'White ceiling, light walls, vinyl floor',
    ceiling: 80,
    wall: 60,
    floor: 40,
  },
  {
    name: 'Dark Interior',
    description: 'Dark ceiling, dark walls, dark floor',
    ceiling: 30,
    wall: 20,
    floor: 10,
  },
  {
    name: 'Highly Reflective',
    description: 'White ceiling, white walls, light floor',
    ceiling: 90,
    wall: 80,
    floor: 50,
  },
];

/**
 * Individual surface reflectance options
 */
export const SURFACE_REFLECTANCES = {
  ceiling: [
    { value: 90, label: 'White paint (90%)', description: 'Bright white latex paint' },
    { value: 80, label: 'Light ceiling tiles (80%)', description: 'Standard acoustic tiles' },
    { value: 70, label: 'Off-white paint (70%)', description: 'Cream or off-white' },
    { value: 50, label: 'Light concrete (50%)', description: 'Unpainted light concrete' },
    { value: 30, label: 'Metal deck (30%)', description: 'Exposed metal deck' },
    { value: 10, label: 'Dark finish (10%)', description: 'Dark paint or exposed structure' },
  ],
  wall: [
    { value: 80, label: 'White paint (80%)', description: 'White latex paint' },
    { value: 60, label: 'Light colors (60%)', description: 'Light gray, beige, yellow' },
    { value: 50, label: 'Medium colors (50%)', description: 'Medium gray, tan, green' },
    { value: 40, label: 'Medium-dark colors (40%)', description: 'Darker earth tones' },
    { value: 30, label: 'Brick/block (30%)', description: 'Unpainted masonry' },
    { value: 20, label: 'Dark colors (20%)', description: 'Dark paint, wood paneling' },
    { value: 10, label: 'Very dark (10%)', description: 'Black or very dark finish' },
  ],
  floor: [
    { value: 50, label: 'Light wood/vinyl (50%)', description: 'Light-colored hard floors' },
    { value: 40, label: 'Light carpet (40%)', description: 'Light-colored carpet' },
    { value: 30, label: 'Medium carpet (30%)', description: 'Medium-toned carpet' },
    { value: 20, label: 'Concrete/dark carpet (20%)', description: 'Sealed concrete, dark carpet' },
    { value: 10, label: 'Dark floor (10%)', description: 'Dark wood, slate, dark carpet' },
  ],
};

/**
 * Default reflectance combination (standard office)
 */
export const DEFAULT_REFLECTANCES = {
  ceiling: 80,
  wall: 50,
  floor: 20,
};

/**
 * Get reflectance preset by name
 */
export function getReflectancePreset(name: string): ReflectancePreset | undefined {
  return REFLECTANCE_PRESETS.find(
    (preset) => preset.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Calculate effective room reflectance (weighted average)
 * Used for simplified UF estimation
 */
export function calculateEffectiveReflectance(
  ceiling: number,
  wall: number,
  floor: number,
  roomLength: number,
  roomWidth: number,
  roomHeight: number
): number {
  const ceilingArea = roomLength * roomWidth;
  const floorArea = ceilingArea;
  const wallArea = 2 * roomHeight * (roomLength + roomWidth);
  const totalArea = ceilingArea + floorArea + wallArea;

  const effectiveReflectance =
    (ceiling * ceilingArea + wall * wallArea + floor * floorArea) / totalArea;

  return Math.round(effectiveReflectance);
}
