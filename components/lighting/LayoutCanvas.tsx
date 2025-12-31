/**
 * LayoutCanvas Component
 *
 * Main canvas visualization component for room layout with fixture positions.
 * Renders interactive 2D room plan using HTML5 Canvas API.
 *
 * Features:
 * - Responsive canvas sizing
 * - Room boundary and dimensions
 * - Fixture position markers
 * - Hover effects
 * - Aspect ratio preservation
 *
 * @see specs/005-lighting-layout-viz/spec.md User Story 1
 * @see specs/005-lighting-layout-viz/plan.md Phase 1
 */

'use client';

import { useState, useEffect } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import type { FixturePosition } from '@/lib/types/lighting';

export interface LayoutCanvasProps {
  /** Room width in meters */
  roomWidth: number;
  /** Room length in meters */
  roomLength: number;
  /** Fixture positions to display */
  fixturePositions: FixturePosition[];
  /** Canvas container width (default: 600px) */
  containerWidth?: number;
  /** Whether to show grid overlay (default: true) */
  showGrid?: boolean;
  /** Callback when fixture is hovered */
  onFixtureHover?: (index: number | null) => void;
  /** Callback when fixture is clicked */
  onFixtureClick?: (index: number) => void;
  /** Callback when canvas is ready (for PDF export) */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  /** CSS class name for container */
  className?: string;
}

/**
 * LayoutCanvas - Interactive room layout visualization
 */
export function LayoutCanvas({
  roomWidth,
  roomLength,
  fixturePositions,
  containerWidth = 600,
  showGrid = true,
  onFixtureHover,
  onFixtureClick,
  onCanvasReady,
  className = '',
}: LayoutCanvasProps) {
  const [hoveredFixture, setHoveredFixture] = useState<number | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 450 });

  // Calculate canvas dimensions based on room aspect ratio
  useEffect(() => {
    const aspectRatio = roomWidth / roomLength;
    const margin = 80; // 40px margin on each side

    let canvasWidth = containerWidth;
    let canvasHeight = canvasWidth / aspectRatio;

    // Ensure canvas doesn't get too tall
    const maxHeight = 600;
    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = canvasHeight * aspectRatio;
    }

    // Ensure canvas doesn't get too short
    const minHeight = 300;
    if (canvasHeight < minHeight) {
      canvasHeight = minHeight;
      canvasWidth = canvasHeight * aspectRatio;
    }

    setCanvasDimensions({
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight),
    });
  }, [roomWidth, roomLength, containerWidth]);

  // Initialize canvas rendering
  const { canvasRef, redraw } = useCanvas({
    width: canvasDimensions.width,
    height: canvasDimensions.height,
    roomWidth,
    roomLength,
    fixturePositions,
    showGrid,
    onReady: (canvas) => {
      if (onCanvasReady) {
        onCanvasReady(canvas);
      }
    },
  });

  // Handle mouse move for hover effects
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse is over any fixture
    const margin = 40;
    const roomPixelWidth = canvasDimensions.width - 2 * margin;
    const roomPixelHeight = canvasDimensions.height - 2 * margin;

    let hoveredIndex: number | null = null;

    for (let i = 0; i < fixturePositions.length; i++) {
      const position = fixturePositions[i];
      const canvasX = margin + (roomPixelWidth * position.x) / 100;
      const canvasY = margin + (roomPixelHeight * position.y) / 100;

      const distance = Math.sqrt(
        Math.pow(mouseX - canvasX, 2) + Math.pow(mouseY - canvasY, 2)
      );

      if (distance <= 10) {
        // 10px hover radius
        hoveredIndex = i;
        break;
      }
    }

    if (hoveredIndex !== hoveredFixture) {
      setHoveredFixture(hoveredIndex);
      redraw(hoveredIndex);

      if (onFixtureHover) {
        onFixtureHover(hoveredIndex);
      }
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoveredFixture !== null) {
      setHoveredFixture(null);
      redraw(null);

      if (onFixtureHover) {
        onFixtureHover(null);
      }
    }
  };

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredFixture !== null && onFixtureClick) {
      onFixtureClick(hoveredFixture);
    }
  };

  // Empty state
  if (fixturePositions.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg ${className}`}
        style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
      >
        <div className="text-center text-slate-500 p-6">
          <svg
            className="mx-auto h-12 w-12 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h4a1 1 0 010 2H6v2a1 1 0 01-2 0V5zm16 0a1 1 0 00-1-1h-4a1 1 0 100 2h2v2a1 1 0 102 0V5zM4 19a1 1 0 001 1h4a1 1 0 100-2H6v-2a1 1 0 10-2 0v3zm16 0a1 1 0 01-1 1h-4a1 1 0 110-2h2v-2a1 1 0 112 0v3z"
            />
          </svg>
          <p className="font-medium">No fixtures to display</p>
          <p className="text-sm mt-1">
            Calculate lighting requirements to see fixture layout
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="border border-slate-300 rounded-lg bg-white shadow-sm cursor-pointer"
        style={{
          width: canvasDimensions.width,
          height: canvasDimensions.height,
        }}
      />

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-900"></div>
          <span>Auto-positioned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-blue-900"></div>
          <span>Manually adjusted</span>
        </div>
      </div>
    </div>
  );
}
