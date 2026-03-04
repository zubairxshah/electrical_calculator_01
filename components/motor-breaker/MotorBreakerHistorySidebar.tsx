/**
 * Motor Breaker History Sidebar
 *
 * Fixed right-side overlay showing calculation history.
 *
 * @module MotorBreakerHistorySidebar
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useMotorBreakerStore } from '@/stores/useMotorBreakerStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Trash2, Upload } from 'lucide-react';
import type { MotorBreakerHistoryEntry } from '@/types/motor-breaker-calculator';

interface MotorBreakerHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MotorBreakerHistorySidebar({ isOpen, onClose }: MotorBreakerHistorySidebarProps) {
  const { getHistory, loadFromHistory, deleteFromHistory } = useMotorBreakerStore();
  const [history, setHistory] = useState<MotorBreakerHistoryEntry[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory(getHistory());
    }
  }, [isOpen, getHistory]);

  if (!isOpen) return null;

  const handleLoad = async (id: string) => {
    await loadFromHistory(id);
    onClose();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteFromHistory(id);
    setHistory(getHistory());
    setDeletingId(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Calculation History</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* History count */}
        <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
          {history.length} of 50 calculations
          {history.length >= 50 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              Full
            </Badge>
          )}
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No calculations saved yet.
            </p>
          )}

          {history.map((entry) => (
            <Card key={entry.id} className="p-3">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {entry.input.standard}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {entry.input.loadType}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {entry.results.recommendation.recommendedBreakerAmps}A
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  {entry.input.voltage}V | {entry.input.systemType}
                  {entry.results.loadAnalysis.calculatedFLA > 0 && (
                    <> | FLA: {entry.results.loadAnalysis.calculatedFLA.toFixed(1)}A</>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleLoad(entry.id)}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-xs text-muted-foreground text-center">
          Stored in browser localStorage
        </div>
      </div>
    </>
  );
}
