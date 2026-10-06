'use client'

import { useArcFlashStore } from '@/stores/useArcFlashStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Trash2, Upload } from 'lucide-react'
import type { ArcFlashHistoryEntry, PpeOutcome } from '@/types/arc-flash'

interface Props {
  isOpen: boolean
  onClose: () => void
}

function outcomeBadge(outcome: PpeOutcome) {
  if (outcome === 'danger') return <Badge className="bg-red-700 hover:bg-red-700">DANGER</Badge>
  if (outcome === 'below-threshold') return <Badge variant="secondary">&lt; 1.2 cal/cm²</Badge>
  return <Badge className="bg-orange-600 hover:bg-orange-600">Cat {outcome}</Badge>
}

export default function ArcFlashHistorySidebar({ isOpen, onClose }: Props) {
  const store = useArcFlashStore()
  const history = store.history

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Arc flash calculation history">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Calculation History</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close history">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No history yet.</p>
          ) : (
            history.map((entry: ArcFlashHistoryEntry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{entry.title}</span>
                      {outcomeBadge(entry.outcome)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()} · {entry.governingEnergyCalcm2.toFixed(2)} cal/cm²
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          store.loadFromHistory(entry.id)
                          onClose()
                        }}
                      >
                        <Upload className="h-3 w-3 mr-1" /> Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive"
                        onClick={() => store.removeFromHistory(entry.id)}
                        aria-label={`Delete ${entry.title}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                if (window.confirm('Delete all arc flash history entries?')) store.clearHistory()
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Clear All History
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
