/**
 * Lighting Design Calculator Types
 *
 * Type definitions for the lighting design calculator feature.
 * Based on IESNA Lighting Handbook methodology.
 *
 * @see specs/004-lighting-design/data-model.md for entity relationships
 */

// ============================================================================
// Enumerations
// ============================================================================

/**
 * Space type categories with recommended illuminance levels per IESNA
 */
export enum SpaceType {
  OFFICE_GENERAL = 'office_general',
  OFFICE_DETAILED = 'office_detailed',
  CLASSROOM = 'classroom',
  CONFERENCE = 'conference',
  CORRIDOR = 'corridor',
  LOBBY = 'lobby',
  WAREHOUSE = 'warehouse',
  WAREHOUSE_DETAILED = 'warehouse_detailed',
  INDUSTRIAL = 'industrial',
  RETAIL = 'retail',
  HOSPITAL_EXAM = 'hospital_exam',
  PARKING_INDOOR = 'parking_indoor',
  // Residential & Hospitality
  RESIDENTIAL_LIVING = 'residential_living',
  RESIDENTIAL_KITCHEN = 'residential_kitchen',
  RESIDENTIAL_BEDROOM = 'residential_bedroom',
  RESIDENTIAL_BATHROOM = 'residential_bathroom',
  HOTEL_LOBBY = 'hotel_lobby',
  HOTEL_GUEST_ROOM = 'hotel_guest_room',
  RESTAURANT_DINING = 'restaurant_dining',
  RESTAURANT_KITCHEN = 'restaurant_kitchen',
  CAFE_BISTRO = 'cafe_bistro',
  // Commercial & Services
  RETAIL_STORE = 'retail_store',
  RETAIL_DISPLAY = 'retail_display',
  SALON_BEAUTY = 'salon_beauty',
  // Food Processing
  FOOD_PREP = 'food_prep',
  FOOD_STORAGE = 'food_storage',
  FOOD_SERVICE = 'food_service',
  CUSTOM = 'custom',
}

/**
 * Luminaire categories for catalog filtering
 */
export enum LuminaireCategory {
  TROFFER = 'troffer',
  HIGHBAY = 'highbay',
  DOWNLIGHT = 'downlight',
  WALLPACK = 'wallpack',
  STRIP = 'strip',
  PANEL = 'panel',
  BULKHEAD = 'bulkhead',
  TRACK = 'track',
  ROADWAY = 'roadway',
  FLOODLIGHT = 'floodlight',
  DECORATIVE = 'decorative',
  EMERGENCY = 'emergency',
  RESIDENTIAL = 'residential',
  SPOTLIGHT = 'spotlight',
}

/**
 * Light distribution patterns
 */
export enum DistributionType {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
  DIRECT_INDIRECT = 'direct-indirect',
  SYMMETRIC = 'symmetric',
  ASYMMETRIC = 'asymmetric',
}

/**
 * Applicable lighting standards
 */
export enum LightingStandard {
  IESNA = 'IESNA', // IESNA Lighting Handbook (indoor)
  IES_RP8 = 'IES_RP8', // IES RP-8 (American roadway)
  CIE_140 = 'CIE_140', // CIE 140 (International roadway)
  ASHRAE = 'ASHRAE', // ASHRAE 90.1 (Energy)
}

/**
 * Unit system for input/output display
 */
export enum UnitSystem {
  SI = 'SI', // meters, lux, m²
  IMPERIAL = 'Imperial', // feet, footcandles, ft²
}

/**
 * IES RP-8 Road Classifications (American)
 */
export enum RoadClassIES {
  M1 = 'M1', // Freeway A
  M2 = 'M2', // Freeway B
  M3 = 'M3', // Expressway
  M4 = 'M4', // Major
  M5 = 'M5', // Collector
}

/**
 * CIE 140 Road Classifications (International)
 */
export enum RoadClassCIE {
  ME1 = 'ME1', // Highest traffic
  ME2 = 'ME2',
  ME3a = 'ME3a',
  ME3b = 'ME3b',
  ME4a = 'ME4a',
  ME4b = 'ME4b',
  ME5 = 'ME5',
  ME6 = 'ME6', // Lowest traffic
}

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Room definition for lighting calculations
 */
export interface Room {
  /** Room length in meters */
  length: number;
  /** Room width in meters */
  width: number;
  /** Ceiling height in meters */
  height: number;
  /** Work plane height above floor in meters (default 0.75m for desk height) */
  workPlaneHeight: number;
  /** Ceiling reflectance percentage (0-100) */
  ceilingReflectance: number;
  /** Wall reflectance percentage (0-100) */
  wallReflectance: number;
  /** Floor reflectance percentage (0-100) */
  floorReflectance: number;
  /** Space type for preset illuminance recommendations */
  spaceType: SpaceType;
}

/**
 * Luminaire specification
 */
export interface Luminaire {
  /** Unique identifier */
  id: string;
  /** Manufacturer name */
  manufacturer: string;
  /** Model number/name */
  model: string;
  /** Luminaire category for filtering */
  category: LuminaireCategory;
  /** Input power in Watts */
  watts: number;
  /** Light output in lumens */
  lumens: number;
  /** Efficacy in lumens per Watt */
  efficacy: number;
  /** Beam angle in degrees */
  beamAngle: number;
  /** Light distribution type */
  distributionType: DistributionType;
  /** Maximum spacing-to-mounting-height ratio */
  maxSHR: number;
  /** Color Rendering Index (0-100) */
  cri?: number;
  /** Correlated Color Temperature in Kelvin */
  cct?: number;
  /** Whether the luminaire is dimmable */
  dimmable?: boolean;
  /** Ingress Protection rating (e.g., "IP65") */
  ipRating?: string;
  /** Reference to UF lookup table */
  ufTableId: string;
  /** Whether this is a user-created custom luminaire */
  isCustom?: boolean;
}

/**
 * Design parameters for calculation
 */
export interface DesignParameters {
  /** Required average illuminance in lux */
  requiredIlluminance: number;
  /** Utilization Factor (0.3-0.9, from tables or manual) */
  utilizationFactor: number;
  /** Maintenance Factor (0.5-1.0, default 0.8 for LED) */
  maintenanceFactor: number;
  /** Operating hours per day for energy calculation */
  operatingHoursPerDay: number;
  /** Applicable lighting standard */
  standard: LightingStandard;
  /** Unit system for display */
  unitSystem: UnitSystem;
}

/**
 * Room Index calculation result
 * Formula: RI = (L × W) / (H_m × (L + W))
 */
export interface RoomIndex {
  /** Calculated Room Index value */
  value: number;
  /** Mounting height (ceiling height - work plane height) in meters */
  mountingHeight: number;
  /** Formula string for display */
  formula: string;
}

/**
 * Calculation formula with variables for display
 */
export interface CalculationFormula {
  /** Name of the calculation (e.g., "Room Index", "Luminaires Required") */
  name: string;
  /** Formula string (e.g., "RI = (L × W) / (H_m × (L + W))") */
  formula: string;
  /** Variables used in calculation */
  variables: Array<{
    symbol: string;
    value: number;
    unit: string;
  }>;
  /** Calculated result */
  result: number;
  /** Result unit */
  unit: string;
}

/**
 * Calculation warning/alert
 */
export interface CalculationWarning {
  /** Severity level */
  severity: 'info' | 'warning' | 'error';
  /** Warning code for programmatic handling */
  code: string;
  /** Human-readable message */
  message: string;
  /** Recommended action */
  recommendation?: string;
}

/**
 * Complete calculation results
 */
export interface CalculationResults {
  /** Room Index calculation */
  roomIndex: RoomIndex;
  /** Utilization Factor (looked up from tables) */
  utilizationFactor: number;
  /** Exact number of luminaires required (decimal) */
  luminairesRequired: number;
  /** Rounded up number of luminaires */
  luminairesRounded: number;
  /** Average illuminance achieved in lux */
  averageIlluminance: number;
  /** Total power consumption in Watts */
  totalWatts: number;
  /** Total light output in lumens */
  totalLumens: number;
  /** Annual energy consumption in kWh */
  energyConsumptionKwhYear: number;
  /** Spacing-to-mounting-height ratio */
  spacingToHeightRatio: number;
  /** Whether SHR is within luminaire's max */
  shrCompliant: boolean;
  /** Calculation formulas for display */
  formulas: CalculationFormula[];
  /** Warnings and alerts */
  warnings: CalculationWarning[];
  /** Optimization recommendations */
  recommendations: string[];
  /** Standard reference string */
  standardReference: string;
  /** Calculation timestamp */
  calculatedAt: string;
}

// ============================================================================
// Visual Input Types (P2)
// ============================================================================

/**
 * File reference for uploaded floor plans
 */
export interface FileReference {
  /** Original filename */
  name: string;
  /** MIME type */
  type: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  lastModified: number;
  /** Data URL for preview */
  dataUrl?: string;
}

/**
 * Extracted room from visual analysis
 */
export interface ExtractedRoom {
  /** Bounding box in image coordinates */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Extracted length in meters */
  extractedLength: number;
  /** Extracted width in meters */
  extractedWidth: number;
  /** Extracted height in meters (if found) */
  extractedHeight?: number;
  /** Confidence for length extraction (0-100) */
  lengthConfidence: number;
  /** Confidence for width extraction (0-100) */
  widthConfidence: number;
  /** Confidence for height extraction (0-100) */
  heightConfidence?: number;
  /** Room label if detected */
  label?: string;
  /** Whether user confirmation is needed */
  requiresConfirmation: boolean;
}

/**
 * Uncertainty flagged during visual analysis
 */
export interface Uncertainty {
  /** Field with uncertainty */
  field: string;
  /** Extracted value */
  extractedValue: number | string;
  /** Confidence level (0-100) */
  confidence: number;
  /** Reason for uncertainty */
  reason: string;
  /** Suggested action */
  suggestedAction: string;
}

/**
 * Visual input analysis result
 */
export interface VisualInputAnalysis {
  /** Source file reference */
  sourceFile: FileReference;
  /** Source type */
  sourceType: 'pdf' | 'image';
  /** Extracted rooms */
  extractedRooms: ExtractedRoom[];
  /** Overall confidence (0-100) */
  overallConfidence: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Flagged uncertainties */
  uncertainties: Uncertainty[];
  /** Analysis timestamp */
  analyzedAt: string;
}

// ============================================================================
// Uniformity Analysis Types (P2)
// ============================================================================

/**
 * Problem area identified in uniformity analysis
 */
export interface ProblemArea {
  /** X position in room (meters) */
  x: number;
  /** Y position in room (meters) */
  y: number;
  /** Illuminance at this point (lux) */
  illuminance: number;
  /** Type of problem */
  issue: 'under-lit' | 'over-lit';
  /** Deviation from average (%) */
  deviation: number;
}

/**
 * Optimization suggestion for uniformity improvement
 */
export interface OptimizationSuggestion {
  /** Type of suggestion */
  type: 'add_luminaire' | 'remove_luminaire' | 'reposition' | 'change_luminaire';
  /** Description of the suggestion */
  description: string;
  /** Expected improvement in uniformity (%) */
  expectedImprovement: number;
}

/**
 * Uniformity analysis result
 */
export interface UniformityAnalysis {
  /** Grid resolution (points per meter) */
  gridResolution: number;
  /** 2D array of illuminance values (lux) */
  illuminanceGrid: number[][];
  /** Minimum illuminance in grid (lux) */
  eMin: number;
  /** Maximum illuminance in grid (lux) */
  eMax: number;
  /** Average illuminance in grid (lux) */
  eAvg: number;
  /** Uniformity ratio (Emin/Eavg) */
  uniformityRatio: number;
  /** Whether uniformity meets requirement */
  uniformityCompliant: boolean;
  /** Required uniformity for space type */
  requiredUniformity: number;
  /** Identified problem areas */
  problemAreas: ProblemArea[];
  /** Optimization suggestions */
  optimizationSuggestions: OptimizationSuggestion[];
}

// ============================================================================
// Roadway Lighting Types (P3)
// ============================================================================

/**
 * Roadway design parameters
 */
export interface RoadwayDesign {
  /** Road width in meters */
  roadWidth: number;
  /** Road length in meters */
  roadLength: number;
  /** Pole spacing in meters */
  poleSpacing: number;
  /** Mounting height in meters */
  mountingHeight: number;
  /** Overhang in meters */
  overhang: number;
  /** Tilt angle in degrees */
  tiltAngle: number;
  /** Pole arrangement */
  arrangement: 'single-side' | 'staggered' | 'opposite';
  /** Road class (IES RP-8 or CIE 140 depending on standard) */
  roadClass: RoadClassIES | RoadClassCIE;
  /** Applicable standard */
  standard: 'IES_RP8' | 'CIE_140';
}

// ============================================================================
// Luminaire Catalog Types (P3)
// ============================================================================

/**
 * User-saved luminaire in database
 */
export interface LuminaireCatalogEntry {
  /** Database ID */
  id: string;
  /** User ID (owner) */
  userId: string;
  /** Luminaire specification */
  luminaire: Luminaire;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

// ============================================================================
// Store Types
// ============================================================================

/**
 * Calculation history entry
 */
export interface HistoryEntry {
  /** Unique ID */
  id: string;
  /** Timestamp */
  timestamp: string;
  /** Room configuration */
  room: Room;
  /** Luminaire used */
  luminaire: Luminaire;
  /** Calculation results */
  results: CalculationResults;
  /** Optional thumbnail preview */
  thumbnail?: string;
}

/**
 * Lighting calculator input for calculations
 */
export interface LightingCalculationInput {
  room: Room;
  luminaire: Luminaire;
  designParameters: DesignParameters;
}
