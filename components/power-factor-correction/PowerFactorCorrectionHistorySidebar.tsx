'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Trash2, RotateCcw } from 'lucide-react'
import { usePowerFactorCorrectionStore } from '@/stores/usePowerFactorCorrectionStore'
import type { PFCHistoryEntry } from '@/types/power-factor-correction'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function PowerFactorCorrectionHistorySidebar({ isOpen, onClose }: Props) {
  const { getHistory, loadFromHistory, deleteFromHistory } = usePowerFactorCorrectionStore()
  const [history, setHistory] = useState<PFCHistoryEntry[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setHistory(getHistory())
    }
  }, [isOpen, getHistory])

  if (!isOpen) return null

  const handleLoad = (id: string) => {
    loadFromHistory(id)
    onClose()
  }

  const handleDelete = (id: string) => {
    if (deletingId === id) {
      deleteFromHistory(id)
      setHistory(prev => prev.filter(h => h.id !== id))
      setDeletingId(null)
    } else {
      setDeletingId(id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">Calculation History</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No calculations saved yet.</p>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span className="text-xs font-medium">{entry.input.standard}</span>
                </div>
                <div className="text-sm space-y-0.5">
                  <p>
                    <span className="text-muted-foreground">Load:</span>{' '}
                    {entry.input.activePower} kW at PF {entry.input.currentPowerFactor}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Target PF:</span>{' '}
                    {entry.input.targetPowerFactor} → <span className="font-semibold text-green-600 dark:text-green-400">
                      {entry.results.correctionSizing.correctedPowerFactor}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Bank:</span>{' '}
                    <span className="font-semibold">{entry.results.capacitorBank.totalKVAR} kVAR</span>
                    {' '}({entry.results.capacitorBank.numberOfSteps} steps)
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleLoad(entry.id)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Load
                  </Button>
                  <Button
                    variant={deletingId === entry.id ? 'destructive' : 'ghost'}
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingId === entry.id && <span className="ml-1">Confirm</span>}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
