'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Trash2, Clock } from 'lucide-react'
import type { HarmonicHistoryEntry } from '@/types/harmonic-analysis'

interface HarmonicHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  history: HarmonicHistoryEntry[]
  onLoadFromHistory: (id: string) => void
  onDeleteFromHistory: (id: string) => void
}

export default function HarmonicHistorySidebar({
  isOpen,
  onClose,
  history,
  onLoadFromHistory,
  onDeleteFromHistory,
}: HarmonicHistorySidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-[380px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Calculation History
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No calculations saved yet.</p>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => { onLoadFromHistory(entry.id); onClose() }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">
                      THDi: {entry.results.currentThd.thd}%
                      {entry.results.voltageThd ? ` | THDv: ${entry.results.voltageThd.thd}%` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.input.loadProfile !== 'custom' ? entry.input.loadProfile.replace(/-/g, ' ').toUpperCase() : 'Custom'} — {entry.input.fundamentalCurrent} A @ {entry.input.systemVoltage} V
                    </p>
                    <p className="text-xs text-muted-foreground">
                      K-Factor: {entry.results.currentThd.kFactor} | {entry.results.compliance.standard}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); onDeleteFromHistory(entry.id) }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
