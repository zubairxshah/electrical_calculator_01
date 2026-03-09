'use client'

import { useVoltageDropStore } from '@/stores/useVoltageDropStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Trash2, Upload } from 'lucide-react'
import type { VoltageDropHistoryEntry } from '@/types/voltage-drop'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function VoltageDropHistorySidebar({ isOpen, onClose }: Props) {
  const store = useVoltageDropStore()
  const history = store.getHistory()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Calculation History</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No history yet.</p>
          ) : (
            history.map((entry: VoltageDropHistoryEntry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {entry.results.result.voltageDropPercent}% @ {entry.input.systemVoltage}V
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {entry.input.current}A | {entry.input.length}{entry.input.lengthUnit === 'meters' ? 'm' : 'ft'} |{' '}
                      {entry.input.conductorType === 'busway'
                        ? `Busway ${entry.input.buswayRating}A`
                        : entry.results.result.conductorDescription}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => { store.loadFromHistory(entry.id); onClose() }}>
                      <Upload className="h-3 w-3 mr-1" /> Load
                    </Button>
                    <Button variant="ghost" size="sm"
                      onClick={() => store.deleteFromHistory(entry.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
