/**
 * History Sidebar Component
 *
 * Displays calculation history with:
 * - Chronological list of past calculations (newest first)
 * - Key parameters (voltage, load, standard, breaker recommendation)
 * - "Load" button to restore a historical calculation
 * - "Delete" button to remove an entry
 * - FIFO limit indicator (50 calculations max)
 *
 * @module HistorySidebar
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useBreakerStore } from '@/stores/useBreakerStore';
import type { CalculationHistoryEntry } from '@/types/breaker-calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  X,
  History,
  Trash2,
  RotateCcw,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';

/**
 * HistorySidebar Props
 */
export interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get summary of a historical calculation
 */
function getCalculationSummary(entry: CalculationHistoryEntry): {
  voltage: string;
  load: string;
  breaker: string;
  standard: string;
} {
  const circuit = entry.circuit;
  const results = entry.results;

  const voltage = `${circuit.voltage}V ${circuit.phase === 'three' ? '3φ' : '1φ'}`;
  const load = circuit.loadMode === 'kw'
    ? `${circuit.loadValue} kW`
    : `${circuit.loadValue} A`;
  const breaker = results?.breakerSizing
    ? `${results.breakerSizing.recommendedBreakerAmps}A`
    : 'N/A';

  return {
    voltage,
    load,
    breaker,
    standard: circuit.standard,
  };
}

/**
 * HistorySidebar Component
 *
 * Slide-out panel showing calculation history
 */
export function HistorySidebar({ isOpen, onClose }: HistorySidebarProps) {
  const [history, setHistory] = useState<CalculationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { getHistory, loadFromHistory, deleteFromHistory } = useBreakerStore();

  // Load history on mount or when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadHistoryData();
    }
  }, [isOpen]);

  async function loadHistoryData() {
    setIsLoading(true);
    try {
      const entries = getHistory();
      setHistory(entries);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoadEntry(id: string) {
    try {
      await loadFromHistory(id);
      onClose();
    } catch (error) {
      console.error('Failed to load entry:', error);
    }
  }

  async function handleDeleteEntry(id: string) {
    setDeletingId(id);
    try {
      await deleteFromHistory(id);
      await loadHistoryData();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setDeletingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h2 className="font-semibold">Calculation History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* History Count */}
        <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {history.length} of 50 calculations
          </span>
          {history.length >= 50 && (
            <Badge variant="warning" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Full
            </Badge>
          )}
        </div>

        <Separator />

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No calculations yet</p>
              <p className="text-sm mt-1">
                Complete a calculation to see it here
              </p>
            </div>
          ) : (
            history.map((entry) => {
              const summary = getCalculationSummary(entry);
              const isDeleting = deletingId === entry.id;

              return (
                <Card
                  key={entry.id}
                  className={`transition-opacity ${
                    isDeleting ? 'opacity-50' : ''
                  }`}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Timestamp */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {summary.standard}
                      </Badge>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span>{summary.voltage}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Load:</span>
                        <span>{summary.load}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Breaker:</span>
                        <Badge variant="secondary" className="text-xs">
                          {summary.breaker}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLoadEntry(entry.id)}
                        disabled={isDeleting}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <div className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Calculations are stored locally in your browser.
            They will persist across sessions but may be cleared if you clear browser data.
          </p>
        </div>
      </div>
    </>
  );
}
