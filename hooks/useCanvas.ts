/**
 * useCanvas Hook
 *
 * Custom React hook for HTML5 Canvas rendering utilities
 * for the lighting layout visualization feature.
 *
 * Provides:
 * - Canvas reference management
 * - Drawing utilities for room, grid, and fixtures
 * - Coordinate transformations
 * - Resize handling
 *
 * @see specs/005-lighting-layout-viz/plan.md for feature plan
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { FixturePosition } from '@/lib/types/lighting';
import { percentToPixel } from '@/lib/calculations/lighting/layoutAlgorithm';

export interface UseCanvasOptions {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Room width in meters */
  roomWidth: number;
  /** Room length in meters */
  roomLength: number;
  /** Fixture positions to render */
  fixturePositions: FixturePosition[];
  /** Whether to show grid overlay */
  showGrid?: boolean;
  /** Callback when canvas is ready */
  onReady?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
}

export interface CanvasDrawingUtils {
  /** Reference to canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Drawing context (null if canvas not mounted) */
  ctx: CanvasRenderingContext2D | null;
  /** Draw the room boundary */
  drawRoom: () => void;
  /** Draw the grid overlay */
  drawGrid: (rows: number, columns: number) => void;
  /** Draw fixture markers */
  drawFixtures: (hoveredIndex?: number | null) => void;
  /** Clear the entire canvas */
  clear: () => void;
  /** Redraw all elements */
  redraw: (hoveredIndex?: number | null) => void;
  /** Handle window resize */
  handleResize: () => void;
}

/**
 * Custom hook for canvas rendering utilities
 */
export function useCanvas(options: UseCanvasOptions): CanvasDrawingUtils {
  const {
    width,
    height,
    roomWidth,
    roomLength,
    fixturePositions,
    showGrid = true,
    onReady,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D canvas context');
      return;
    }

    ctxRef.current = ctx;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Notify parent component
    if (onReady) {
      onReady(canvas, ctx);
    }
  }, [width, height, onReady]);

  /**
   * Clear the entire canvas
   */
  const clear = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
  }, [width, height]);

  /**
   * Draw room boundary
   */
  const drawRoom = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const margin = 40; // 40px margin from canvas edges

    // Calculate room rectangle with margin
    const roomX = margin;
    const roomY = margin;
    const roomPixelWidth = width - 2 * margin;
    const roomPixelHeight = height - 2 * margin;

    // Draw room boundary
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 2;
    ctx.strokeRect(roomX, roomY, roomPixelWidth, roomPixelHeight);

    // Draw room dimensions text
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';

    // Width label (top)
    ctx.fillText(
      `${roomWidth.toFixed(1)}m`,
      roomX + roomPixelWidth / 2,
      roomY - 10
    );

    // Length label (left)
    ctx.save();
    ctx.translate(roomX - 10, roomY + roomPixelHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${roomLength.toFixed(1)}m`, 0, 0);
    ctx.restore();
  }, [width, height, roomWidth, roomLength]);

  /**
   * Draw grid overlay
   */
  const drawGrid = useCallback(
    (rows: number, columns: number) => {
      const ctx = ctxRef.current;
      if (!ctx || !showGrid) return;

      const margin = 40;
      const roomPixelWidth = width - 2 * margin;
      const roomPixelHeight = height - 2 * margin;

      ctx.strokeStyle = '#e2e8f0'; // slate-200
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Vertical grid lines
      for (let col = 1; col < columns; col++) {
        const x = margin + (roomPixelWidth * col) / columns;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, margin + roomPixelHeight);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let row = 1; row < rows; row++) {
        const y = margin + (roomPixelHeight * row) / rows;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin + roomPixelWidth, y);
        ctx.stroke();
      }

      // Reset line dash
      ctx.setLineDash([]);
    },
    [width, height, showGrid]
  );

  /**
   * Draw fixture markers
   */
  const drawFixtures = useCallback(
    (hoveredIndex: number | null = null) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      const margin = 40;
      const roomPixelWidth = width - 2 * margin;
      const roomPixelHeight = height - 2 * margin;

      // Draw each fixture
      fixturePositions.forEach((position, index) => {
        // Convert percentage to canvas pixels (within room bounds)
        const canvasX = margin + (roomPixelWidth * position.x) / 100;
        const canvasY = margin + (roomPixelHeight * position.y) / 100;

        const isHovered = index === hoveredIndex;
        const radius = isHovered ? 10 : 8;

        // Draw fixture marker circle
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);

        // Fill
        ctx.fillStyle = position.isManual ? '#f59e0b' : '#3b82f6'; // amber-500 or blue-500
        ctx.fill();

        // Stroke
        ctx.strokeStyle = isHovered ? '#1e40af' : '#1e3a8a'; // blue-800 or blue-900
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();

        // Draw fixture number
        ctx.fillStyle = '#ffffff';
        ctx.font = isHovered ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${index + 1}`, canvasX, canvasY);
      });
    },
    [width, height, fixturePositions]
  );

  /**
   * Redraw all canvas elements
   */
  const redraw = useCallback(
    (hoveredIndex: number | null = null) => {
      clear();
      drawRoom();

      // Calculate grid dimensions based on fixture count
      if (fixturePositions.length > 0) {
        const columns = Math.ceil(Math.sqrt(fixturePositions.length));
        const rows = Math.ceil(fixturePositions.length / columns);
        drawGrid(rows, columns);
      }

      drawFixtures(hoveredIndex);
    },
    [clear, drawRoom, drawGrid, drawFixtures, fixturePositions.length]
  );

  /**
   * Handle canvas resize
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    redraw();
  }, [width, height, redraw]);

  // Redraw on fixture positions change
  useEffect(() => {
    if (fixturePositions.length > 0) {
      redraw();
    }
  }, [fixturePositions, redraw]);

  return {
    canvasRef,
    ctx: ctxRef.current,
    drawRoom,
    drawGrid,
    drawFixtures,
    clear,
    redraw,
    handleResize,
  };
}
