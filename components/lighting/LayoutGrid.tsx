/**
 * LayoutGrid Component
 *
 * SVG overlay component for displaying room boundaries and grid lines.
 * Provides visual structure for the room layout visualization.
 *
 * Note: This component is currently not used as grid rendering is handled
 * directly in the Canvas for performance reasons. Kept for potential future
 * use as an alternative SVG-based rendering approach.
 *
 * @see specs/005-lighting-layout-viz/plan.md Phase 2
 */

'use client';

export interface LayoutGridProps {
  /** Room width in meters */
  roomWidth: number;
  /** Room length in meters */
  roomLength: number;
  /** Number of grid rows */
  rows: number;
  /** Number of grid columns */
  columns: number;
  /** SVG width in pixels */
  width: number;
  /** SVG height in pixels */
  height: number;
  /** Whether to show grid lines (default: true) */
  showGrid?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * LayoutGrid - SVG-based room grid overlay
 *
 * Provides an alternative to canvas-based grid rendering using SVG.
 * Useful for accessibility and styling flexibility.
 */
export function LayoutGrid({
  roomWidth,
  roomLength,
  rows,
  columns,
  width,
  height,
  showGrid = true,
  className = '',
}: LayoutGridProps) {
  const margin = 40; // Match canvas margin
  const roomPixelWidth = width - 2 * margin;
  const roomPixelHeight = height - 2 * margin;

  // Calculate grid line positions
  const verticalLines: number[] = [];
  for (let col = 1; col < columns; col++) {
    verticalLines.push(margin + (roomPixelWidth * col) / columns);
  }

  const horizontalLines: number[] = [];
  for (let row = 1; row < rows; row++) {
    horizontalLines.push(margin + (roomPixelHeight * row) / rows);
  }

  return (
    <svg
      width={width}
      height={height}
      className={`absolute top-0 left-0 pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    >
      {/* Room boundary */}
      <rect
        x={margin}
        y={margin}
        width={roomPixelWidth}
        height={roomPixelHeight}
        fill="none"
        stroke="#334155"
        strokeWidth={2}
      />

      {/* Grid lines */}
      {showGrid && (
        <>
          {/* Vertical grid lines */}
          {verticalLines.map((x, index) => (
            <line
              key={`v-${index}`}
              x1={x}
              y1={margin}
              x2={x}
              y2={margin + roomPixelHeight}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="5,5"
            />
          ))}

          {/* Horizontal grid lines */}
          {horizontalLines.map((y, index) => (
            <line
              key={`h-${index}`}
              x1={margin}
              y1={y}
              x2={margin + roomPixelWidth}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="5,5"
            />
          ))}
        </>
      )}

      {/* Room dimension labels */}
      <text
        x={margin + roomPixelWidth / 2}
        y={margin - 10}
        textAnchor="middle"
        fill="#64748b"
        fontSize="12"
        fontFamily="sans-serif"
      >
        {roomWidth.toFixed(1)}m
      </text>

      <text
        x={margin - 10}
        y={margin + roomPixelHeight / 2}
        textAnchor="middle"
        fill="#64748b"
        fontSize="12"
        fontFamily="sans-serif"
        transform={`rotate(-90, ${margin - 10}, ${margin + roomPixelHeight / 2})`}
      >
        {roomLength.toFixed(1)}m
      </text>
    </svg>
  );
}
