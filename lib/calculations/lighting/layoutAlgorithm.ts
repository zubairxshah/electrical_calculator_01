/**
 * Dynamic Layout Algorithm for Lighting Fixture Positioning
 *
 * Implements adaptive grid-based fixture layout algorithm that adjusts
 * to fixture count and room aspect ratio.
 *
 * Algorithm patterns:
 * - 1 fixture: Center positioning (50%, 50%)
 * - 2 fixtures: Linear along longer axis
 * - 3-4 fixtures: 2x2 rectangular grid
 * - 5+ fixtures: Multi-row grid (optimized for near-square arrangement)
 *
 * @see specs/005-lighting-layout-viz/plan.md for algorithm specification
 * @see specs/005-lighting-layout-viz/spec.md for user stories
 */

import type {
  FixturePosition,
  LayoutConfiguration,
} from '@/lib/types/lighting';
import type {
  LayoutGrid,
  LayoutAlgorithmInput,
  LayoutAlgorithmOutput,
} from '@/types/layout';

// ============================================================================
// Core Layout Algorithm
// ============================================================================

/**
 * Calculate fixture positions based on count and room dimensions
 *
 * @param input - Room dimensions and fixture count
 * @returns Layout configuration with fixture positions
 */
export function calculateFixtureLayout(
  input: LayoutAlgorithmInput
): LayoutAlgorithmOutput {
  const { roomWidth, roomLength, fixtureCount, mountingHeight } = input;

  // Validate inputs
  if (fixtureCount <= 0) {
    return {
      positions: [],
      grid: { rows: 0, columns: 0, horizontalSpacing: 0, verticalSpacing: 0 },
      algorithm: 'grid',
    };
  }

  // Determine algorithm based on fixture count
  if (fixtureCount === 1) {
    return calculateCenterLayout(roomWidth, roomLength, mountingHeight);
  } else if (fixtureCount === 2) {
    return calculateLinearLayout(roomWidth, roomLength, mountingHeight);
  } else {
    return calculateGridLayout(
      roomWidth,
      roomLength,
      fixtureCount,
      mountingHeight
    );
  }
}

// ============================================================================
// Single Fixture: Center Positioning
// ============================================================================

/**
 * Position single fixture at room center
 *
 * @param roomWidth - Room width in meters
 * @param roomLength - Room length in meters
 * @param mountingHeight - Optional mounting height for SHR calculation
 * @returns Layout with single centered fixture
 */
function calculateCenterLayout(
  roomWidth: number,
  roomLength: number,
  mountingHeight?: number
): LayoutAlgorithmOutput {
  const positions: FixturePosition[] = [
    {
      x: 50,
      y: 50,
      index: 0,
      isManual: false,
    },
  ];

  const grid: LayoutGrid = {
    rows: 1,
    columns: 1,
    horizontalSpacing: 50,
    verticalSpacing: 50,
  };

  return {
    positions,
    grid,
    algorithm: 'center',
    spacingToHeightRatio: mountingHeight
      ? calculateSHR(roomWidth, roomLength, 1, 1, mountingHeight)
      : undefined,
  };
}

// ============================================================================
// Two Fixtures: Linear Layout
// ============================================================================

/**
 * Position two fixtures linearly along longer axis
 *
 * @param roomWidth - Room width in meters
 * @param roomLength - Room length in meters
 * @param mountingHeight - Optional mounting height for SHR calculation
 * @returns Layout with two fixtures along longer axis
 */
function calculateLinearLayout(
  roomWidth: number,
  roomLength: number,
  mountingHeight?: number
): LayoutAlgorithmOutput {
  const isWidthLonger = roomWidth >= roomLength;
  const spacing = 100 / 3; // 33.33% spacing (divide axis into thirds)

  const positions: FixturePosition[] = [
    {
      x: isWidthLonger ? spacing : 50,
      y: isWidthLonger ? 50 : spacing,
      index: 0,
      isManual: false,
    },
    {
      x: isWidthLonger ? spacing * 2 : 50,
      y: isWidthLonger ? 50 : spacing * 2,
      index: 1,
      isManual: false,
    },
  ];

  const grid: LayoutGrid = {
    rows: isWidthLonger ? 1 : 2,
    columns: isWidthLonger ? 2 : 1,
    horizontalSpacing: spacing,
    verticalSpacing: spacing,
  };

  return {
    positions,
    grid,
    algorithm: 'linear',
    spacingToHeightRatio: mountingHeight
      ? calculateSHR(
          roomWidth,
          roomLength,
          grid.columns,
          grid.rows,
          mountingHeight
        )
      : undefined,
  };
}

// ============================================================================
// Multiple Fixtures: Grid Layout
// ============================================================================

/**
 * Position multiple fixtures in optimized grid pattern
 *
 * Grid dimensions calculated to maintain near-square arrangement:
 * - columns = ceil(sqrt(fixtureCount))
 * - rows = ceil(fixtureCount / columns)
 *
 * Spacing uses percentage-based positioning:
 * - horizontalSpacing = 100 / (columns + 1)
 * - verticalSpacing = 100 / (rows + 1)
 *
 * @param roomWidth - Room width in meters
 * @param roomLength - Room length in meters
 * @param fixtureCount - Number of fixtures to place
 * @param mountingHeight - Optional mounting height for SHR calculation
 * @returns Layout with fixtures in grid pattern
 */
function calculateGridLayout(
  roomWidth: number,
  roomLength: number,
  fixtureCount: number,
  mountingHeight?: number
): LayoutAlgorithmOutput {
  // Calculate grid dimensions (near-square arrangement)
  const columns = Math.ceil(Math.sqrt(fixtureCount));
  const rows = Math.ceil(fixtureCount / columns);

  // Calculate spacing as percentage
  const horizontalSpacing = 100 / (columns + 1);
  const verticalSpacing = 100 / (rows + 1);

  // Generate fixture positions
  const positions: FixturePosition[] = [];
  let fixtureIndex = 0;

  for (let row = 0; row < rows && fixtureIndex < fixtureCount; row++) {
    // Calculate fixtures in this row (handles asymmetric grids)
    const fixturesInRow =
      row === rows - 1
        ? fixtureCount - fixtureIndex // Last row: remaining fixtures
        : Math.min(columns, fixtureCount - fixtureIndex);

    // Center offset for asymmetric rows
    const rowOffset =
      fixturesInRow < columns ? ((columns - fixturesInRow) * horizontalSpacing) / 2 : 0;

    for (let col = 0; col < fixturesInRow; col++) {
      positions.push({
        x: horizontalSpacing * (col + 1) + rowOffset,
        y: verticalSpacing * (row + 1),
        index: fixtureIndex,
        isManual: false,
      });
      fixtureIndex++;
    }
  }

  const grid: LayoutGrid = {
    rows,
    columns,
    horizontalSpacing,
    verticalSpacing,
    centerOffset:
      positions.some((p) => p.x !== horizontalSpacing * (p.index % columns + 1))
        ? { x: 0, y: 0 }
        : undefined,
  };

  return {
    positions,
    grid,
    algorithm: 'grid',
    spacingToHeightRatio: mountingHeight
      ? calculateSHR(roomWidth, roomLength, columns, rows, mountingHeight)
      : undefined,
  };
}

// ============================================================================
// Spacing-to-Mounting-Height Ratio (SHR)
// ============================================================================

/**
 * Calculate spacing-to-mounting-height ratio
 *
 * SHR = average spacing / mounting height
 * Used to validate against luminaire max SHR per IESNA guidelines
 *
 * @param roomWidth - Room width in meters
 * @param roomLength - Room length in meters
 * @param columns - Grid columns
 * @param rows - Grid rows
 * @param mountingHeight - Mounting height in meters
 * @returns Spacing-to-height ratio
 */
function calculateSHR(
  roomWidth: number,
  roomLength: number,
  columns: number,
  rows: number,
  mountingHeight: number
): number {
  // Average spacing in each direction
  const horizontalSpacing = roomWidth / (columns + 1);
  const verticalSpacing = roomLength / (rows + 1);

  // Average of both directions
  const averageSpacing = (horizontalSpacing + verticalSpacing) / 2;

  return averageSpacing / mountingHeight;
}

// ============================================================================
// Coordinate Conversion Utilities
// ============================================================================

/**
 * Convert percentage coordinates to pixel coordinates
 *
 * @param percentX - X position as percentage (0-100)
 * @param percentY - Y position as percentage (0-100)
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @returns Pixel coordinates
 */
export function percentToPixel(
  percentX: number,
  percentY: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: (canvasWidth * percentX) / 100,
    y: (canvasHeight * percentY) / 100,
  };
}

/**
 * Convert pixel coordinates to percentage coordinates
 *
 * @param pixelX - X position in pixels
 * @param pixelY - Y position in pixels
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @returns Percentage coordinates (0-100)
 */
export function pixelToPercent(
  pixelX: number,
  pixelY: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: (pixelX / canvasWidth) * 100,
    y: (pixelY / canvasHeight) * 100,
  };
}

/**
 * Convert percentage coordinates to real-world meters
 *
 * @param percentX - X position as percentage (0-100)
 * @param percentY - Y position as percentage (0-100)
 * @param roomWidth - Room width in meters
 * @param roomLength - Room length in meters
 * @returns Real-world coordinates in meters
 */
export function percentToMeters(
  percentX: number,
  percentY: number,
  roomWidth: number,
  roomLength: number
): { x: number; y: number } {
  return {
    x: (roomWidth * percentX) / 100,
    y: (roomLength * percentY) / 100,
  };
}

/**
 * Convert real-world meters to percentage coordinates
 *
 * @param metersX - X position in meters
 * @param metersY - Y position in meters
 * @param roomWidth - Room width in meters
 * @param roomLength - Room length in meters
 * @returns Percentage coordinates (0-100)
 */
export function metersToPercent(
  metersX: number,
  metersY: number,
  roomWidth: number,
  roomLength: number
): { x: number; y: number } {
  return {
    x: (metersX / roomWidth) * 100,
    y: (metersY / roomLength) * 100,
  };
}

// ============================================================================
// Boundary Validation
// ============================================================================

/**
 * Constrain fixture position within room boundaries
 *
 * Applies 5% margin from edges to prevent fixtures touching walls
 *
 * @param percentX - X position as percentage
 * @param percentY - Y position as percentage
 * @returns Constrained coordinates within boundaries
 */
export function constrainToBoundaries(
  percentX: number,
  percentY: number
): { x: number; y: number } {
  const margin = 5; // 5% margin from edges
  return {
    x: Math.max(margin, Math.min(100 - margin, percentX)),
    y: Math.max(margin, Math.min(100 - margin, percentY)),
  };
}

/**
 * Check if position is within room boundaries
 *
 * @param percentX - X position as percentage
 * @param percentY - Y position as percentage
 * @param margin - Margin from edges (default 5%)
 * @returns True if position is within boundaries
 */
export function isWithinBoundaries(
  percentX: number,
  percentY: number,
  margin: number = 5
): boolean {
  return (
    percentX >= margin &&
    percentX <= 100 - margin &&
    percentY >= margin &&
    percentY <= 100 - margin
  );
}
