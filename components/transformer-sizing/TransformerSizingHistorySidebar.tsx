'use client'

import { useTransformerSizingStore } from '@/stores/useTransformerSizingStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Trash2, Upload } from 'lucide-react'
import type { TransformerHistoryEntry } from '@/types/transformer-sizing'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function TransformerSizingHistorySidebar({ isOpen, onClose }: Props) {
  const store = useTransformerSizingStore()
  const history = store.getHistory()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Sidebar */}
      <div className="relative w-full max-w-md bg-background shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Calculation History</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No history yet. Run a calculation to see it here.</p>
          ) : (
            history.map((entry: TransformerHistoryEntry) => (
              <Card key={entry.id} className="relative">
                <CardContent className="pt-4 pb-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{entry.results.selection.ratedKVA} kVA</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {entry.input.loadKW} kW | {entry.input.primaryVoltage.toLocaleString()}/{entry.input.secondaryVoltage} V |{' '}
                      {entry.input.transformerType} | {entry.input.standard}
                    </div>
                    {entry.project.projectName && (
                      <div className="text-xs text-muted-foreground">{entry.project.projectName}</div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { store.loadFromHistory(entry.id); onClose() }}
                    >
                      <Upload className="h-3 w-3 mr-1" /> Load
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => store.deleteFromHistory(entry.id)}
                    >
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
