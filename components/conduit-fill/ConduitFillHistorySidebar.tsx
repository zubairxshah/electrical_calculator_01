'use client'

import { useConduitFillStore } from '@/stores/useConduitFillStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Trash2, Upload } from 'lucide-react'
import type { ConduitFillHistoryEntry } from '@/types/conduit-fill'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ConduitFillHistorySidebar({ isOpen, onClose }: Props) {
  const store = useConduitFillStore()
  const history = store.history

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
            history.map((entry: ConduitFillHistoryEntry) => (
              <Card key={entry.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{entry.label}</span>
                      <span className={`text-xs font-bold ${entry.result.pass ? 'text-green-600' : 'text-destructive'}`}>
                        {entry.result.pass ? 'PASS' : 'FAIL'} {entry.result.fillPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
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
              onClick={store.clearHistory}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Clear All History
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
