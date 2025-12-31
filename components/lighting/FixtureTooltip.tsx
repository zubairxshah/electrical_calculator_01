/**
 * FixtureTooltip Component
 *
 * Tooltip displaying fixture details on hover.
 * Shows lumens, watts, and position coordinates.
 *
 * @see specs/005-lighting-layout-viz/spec.md User Story 1
 */

'use client';

import { percentToMeters } from '@/lib/calculations/lighting/layoutAlgorithm';

export interface FixtureTooltipProps {
  /** Fixture index (1-based for display) */
  fixtureNumber: number;
  /** Fixture luminous output in lumens */
  lumens: number;
  /** Fixture power in watts */
  watts: number;
  /** Fixture position as percentage */
  position: { x: number; y: number };
  /** Room dimensions in meters */
  roomDimensions: { width: number; length: number };
  /** Tooltip position on screen */
  screenPosition: { x: number; y: number };
  /** Whether tooltip is visible */
  visible: boolean;
  /** Unit system (SI or Imperial) */
  unitSystem?: 'SI' | 'Imperial';
}

/**
 * FixtureTooltip - Hover tooltip for fixture details
 */
export function FixtureTooltip({
  fixtureNumber,
  lumens,
  watts,
  position,
  roomDimensions,
  screenPosition,
  visible,
  unitSystem = 'SI',
}: FixtureTooltipProps) {
  if (!visible) return null;

  // Convert percentage to real-world coordinates
  const realPosition = percentToMeters(
    position.x,
    position.y,
    roomDimensions.width,
    roomDimensions.length
  );

  // Convert to imperial if needed
  const xDisplay = unitSystem === 'Imperial' ? realPosition.x * 3.28084 : realPosition.x;
  const yDisplay = unitSystem === 'Imperial' ? realPosition.y * 3.28084 : realPosition.y;
  const unitLabel = unitSystem === 'Imperial' ? 'ft' : 'm';

  return (
    <div
      className="absolute z-50 bg-slate-900 text-white text-sm rounded-lg shadow-lg px-3 py-2 pointer-events-none"
      style={{
        left: screenPosition.x + 15,
        top: screenPosition.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      {/* Arrow */}
      <div
        className="absolute bottom-0 left-4 w-2 h-2 bg-slate-900 transform rotate-45 translate-y-1"
        style={{ bottom: '-4px' }}
      />

      {/* Content */}
      <div className="relative space-y-1">
        <div className="font-semibold border-b border-slate-700 pb-1 mb-1">
          Fixture #{fixtureNumber}
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Output:</span>
          <span className="font-medium">{lumens.toLocaleString()} lm</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Power:</span>
          <span className="font-medium">{watts} W</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Position:</span>
          <span className="font-medium">
            ({xDisplay.toFixed(1)}, {yDisplay.toFixed(1)}) {unitLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
