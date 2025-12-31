/**
 * FixtureMarker Component
 *
 * Individual fixture position marker for canvas rendering.
 * Displays fixture number with hover and manual adjustment states.
 *
 * Note: This component is designed for future React-based rendering.
 * Current implementation uses direct canvas drawing for performance.
 *
 * @see specs/005-lighting-layout-viz/spec.md User Story 1
 */

'use client';

export interface FixtureMarkerProps {
  /** Fixture index (0-based) */
  index: number;
  /** X position in pixels */
  x: number;
  /** Y position in pixels */
  y: number;
  /** Whether this fixture was manually positioned */
  isManual: boolean;
  /** Whether this fixture is currently hovered */
  isHovered: boolean;
  /** Whether this fixture is selected */
  isSelected?: boolean;
  /** Callback when marker is clicked */
  onClick?: () => void;
  /** Callback when marker is hovered */
  onHover?: (hovered: boolean) => void;
}

/**
 * FixtureMarker - Visual marker for fixture position
 *
 * This component can be used for SVG-based rendering as an alternative
 * to canvas rendering. Currently, the canvas approach is used for performance.
 */
export function FixtureMarker({
  index,
  x,
  y,
  isManual,
  isHovered,
  isSelected = false,
  onClick,
  onHover,
}: FixtureMarkerProps) {
  const radius = isHovered || isSelected ? 10 : 8;
  const fillColor = isManual ? '#f59e0b' : '#3b82f6'; // amber-500 or blue-500
  const strokeColor = isHovered ? '#1e40af' : '#1e3a8a'; // blue-800 or blue-900
  const strokeWidth = isHovered || isSelected ? 3 : 2;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Marker circle */}
      <circle
        r={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Fixture number */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={isHovered ? 11 : 10}
        fontWeight={isHovered ? 'bold' : 'normal'}
      >
        {index + 1}
      </text>
    </g>
  );
}
