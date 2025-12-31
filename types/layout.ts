/**
 * Interactive Room Layout Visualization Types
 *
 * Type definitions for 2D room layout visualization feature.
 * Supports fixture positioning, manual repositioning, and layout algorithms.
 *
 * @see specs/005-lighting-layout-viz/spec.md for feature specification
 * @see specs/005-lighting-layout-viz/plan.md for implementation plan
 */

// ============================================================================
// Core Layout Types
// ============================================================================

/**
 * Fixture position in room layout
 * Coordinates are stored as percentages (0-100) for resolution-independence
 */
export interface FixturePosition {
  /** Horizontal position as percentage of room width (0-100) */
  x: number;
  /** Vertical position as percentage of room length (0-100) */
  y: number;
  /** Position index for tracking (0-based) */
  index: number;
  /** Whether this position was manually adjusted */
  isManual?: boolean;
}

/**
 * Room layout configuration
 */
export interface RoomLayout {
  /** Room width in meters */
  width: number;
  /** Room length in meters */
  length: number;
  /** Fixture positions in the room */
  positions: FixturePosition[];
  /** Total fixture count */
  fixtureCount: number;
  /** Whether layout was manually customized */
  isManual: boolean;
  /** Layout algorithm used */
  algorithm: 'center' | 'linear' | 'grid';
}

/**
 * Layout grid configuration for visualization
 */
export interface LayoutGrid {
  /** Number of rows in grid */
  rows: number;
  /** Number of columns in grid */
  columns: number;
  /** Horizontal spacing as percentage */
  horizontalSpacing: number;
  /** Vertical spacing as percentage */
  verticalSpacing: number;
  /** Center offset for asymmetric grids */
  centerOffset?: { x: number; y: number };
}

/**
 * Fixture suggestion based on room type and illuminance
 */
export interface FixtureSuggestion {
  /** Luminaire category */
  category: string;
  /** Model/product name */
  model: string;
  /** Manufacturer name */
  manufacturer: string;
  /** Light output in lumens */
  lumens: number;
  /** Power consumption in watts */
  watts: number;
  /** Efficacy in lumens per watt */
  efficacy: number;
  /** Recommended applications */
  applications: string[];
  /** Why this fixture is suggested */
  reason: string;
}

// ============================================================================
// Layout Configuration Types
// ============================================================================

/**
 * Configuration for layout calculation and rendering
 */
export interface LayoutConfiguration {
  /** Canvas width in pixels */
  canvasWidth: number;
  /** Canvas height in pixels */
  canvasHeight: number;
  /** Room aspect ratio (width/length) */
  aspectRatio: number;
  /** Scale factor for canvas rendering */
  scaleFactor: number;
  /** Grid resolution for boundaries */
  gridResolution: number;
  /** Whether to show grid overlay */
  showGrid: boolean;
  /** Whether to show fixture tooltips */
  showTooltips: boolean;
  /** Whether drag-and-drop is enabled */
  enableDragDrop: boolean;
}

// ============================================================================
// Canvas Rendering Types
// ============================================================================

/**
 * Canvas rendering context
 */
export interface CanvasRenderContext {
  /** HTML5 Canvas element */
  canvas: HTMLCanvasElement;
  /** 2D rendering context */
  ctx: CanvasRenderingContext2D;
  /** Current room layout */
  layout: RoomLayout;
  /** Configuration */
  config: LayoutConfiguration;
}

/**
 * Fixture marker style configuration
 */
export interface FixtureMarkerStyle {
  /** Marker radius in pixels */
  radius: number;
  /** Fill color */
  fillColor: string;
  /** Stroke color */
  strokeColor: string;
  /** Stroke width */
  strokeWidth: number;
  /** Hover fill color */
  hoverFillColor: string;
  /** Hover stroke color */
  hoverStrokeColor: string;
  /** Selected fill color */
  selectedFillColor: string;
}

/**
 * Grid style configuration
 */
export interface GridStyle {
  /** Room boundary color */
  boundaryColor: string;
  /** Room boundary width */
  boundaryWidth: number;
  /** Grid line color */
  gridLineColor: string;
  /** Grid line width */
  gridLineWidth: number;
  /** Background color */
  backgroundColor: string;
}

// ============================================================================
// Interaction Types
// ============================================================================

/**
 * Drag state for fixture repositioning
 */
export interface DragState {
  /** Whether dragging is active */
  isDragging: boolean;
  /** Index of fixture being dragged */
  fixtureIndex: number | null;
  /** Drag start position */
  startPosition: { x: number; y: number } | null;
  /** Current drag position */
  currentPosition: { x: number; y: number } | null;
}

/**
 * Tooltip data for fixture hover
 */
export interface TooltipData {
  /** Whether tooltip is visible */
  visible: boolean;
  /** Tooltip position in canvas coordinates */
  position: { x: number; y: number };
  /** Fixture index */
  fixtureIndex: number;
  /** Fixture details */
  details: {
    lumens: number;
    watts: number;
    position: { x: number; y: number }; // Real-world coordinates in meters
  };
}

// ============================================================================
// Layout Algorithm Types
// ============================================================================

/**
 * Layout algorithm input parameters
 */
export interface LayoutAlgorithmInput {
  /** Room width in meters */
  roomWidth: number;
  /** Room length in meters */
  roomLength: number;
  /** Number of fixtures to place */
  fixtureCount: number;
  /** Mounting height in meters (optional, for SHR validation) */
  mountingHeight?: number;
}

/**
 * Layout algorithm output
 */
export interface LayoutAlgorithmOutput {
  /** Calculated fixture positions */
  positions: FixturePosition[];
  /** Grid configuration used */
  grid: LayoutGrid;
  /** Algorithm used */
  algorithm: 'center' | 'linear' | 'grid';
  /** Spacing-to-mounting-height ratio (if mountingHeight provided) */
  spacingToHeightRatio?: number;
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Layout export configuration for PDF
 */
export interface LayoutExportConfig {
  /** Include layout visualization */
  includeLayout: boolean;
  /** Include position coordinates table */
  includePositionTable: boolean;
  /** High-resolution scale factor (e.g., 2x for export) */
  exportScaleFactor: number;
  /** Image format for snapshot */
  imageFormat: 'png' | 'jpeg';
  /** Image quality (0-1 for JPEG) */
  imageQuality: number;
}

/**
 * Position table entry for PDF export
 */
export interface PositionTableEntry {
  /** Fixture number */
  fixtureNumber: number;
  /** X position in meters */
  xMeters: number;
  /** Y position in meters */
  yMeters: number;
  /** X position in feet (if imperial units) */
  xFeet?: number;
  /** Y position in feet (if imperial units) */
  yFeet?: number;
}
