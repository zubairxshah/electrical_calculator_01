/**
 * LayoutToolbar Component
 *
 * Toolbar with controls for layout customization and reset.
 * Provides reset to auto-layout functionality.
 *
 * @see specs/005-lighting-layout-viz/spec.md User Story 7
 */

'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw, Grid3x3, Move } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface LayoutToolbarProps {
  /** Whether layout is currently manual */
  isManual: boolean;
  /** Number of fixtures in layout */
  fixtureCount: number;
  /** Callback to reset to auto-layout */
  onReset: () => void;
  /** Whether drag-and-drop is enabled */
  enableDragDrop?: boolean;
  /** Callback to toggle drag-and-drop */
  onToggleDragDrop?: () => void;
  /** CSS class name */
  className?: string;
}

/**
 * LayoutToolbar - Controls for layout customization
 */
export function LayoutToolbar({
  isManual,
  fixtureCount,
  onReset,
  enableDragDrop = false,
  onToggleDragDrop,
  className = '',
}: LayoutToolbarProps) {
  return (
    <div className={`flex items-center justify-between p-3 bg-muted rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <Grid3x3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {fixtureCount} fixture{fixtureCount !== 1 ? 's' : ''}
        </span>
        {isManual && (
          <Badge variant="secondary" className="text-xs">
            <Move className="h-3 w-3 mr-1" />
            Custom Layout
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onToggleDragDrop && (
          <Button
            variant={enableDragDrop ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleDragDrop}
          >
            <Move className="h-4 w-4 mr-1" />
            {enableDragDrop ? 'Drag Mode' : 'Enable Drag'}
          </Button>
        )}

        {isManual && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Layout
          </Button>
        )}
      </div>
    </div>
  );
}
