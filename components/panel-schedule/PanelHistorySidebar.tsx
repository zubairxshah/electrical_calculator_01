'use client'

import { useEffect, useState } from 'react'
import { usePanelScheduleStore } from '@/stores/usePanelScheduleStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Save, Trash2, Upload, X } from 'lucide-react'
import { getSystem } from '@/lib/calculations/panel-schedule/system'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function PanelHistorySidebar({ isOpen, onClose }: Props) {
  const history = usePanelScheduleStore((s) => s.history)
  const currentName = usePanelScheduleStore((s) => s.name)
  const [name, setName] = useState('')

  useEffect(() => {
    if (isOpen) {
      usePanelScheduleStore.getState().refreshHistory()
      setName(usePanelScheduleStore.getState().name)
    }
  }, [isOpen])

  if (!isOpen) return null

  const restore = (id: string) => {
    const entry = usePanelScheduleStore.getState().history.find((e) => e.id === id)
    if (!entry) return
    if (!window.confirm(`Replace the current panel "${currentName}" with "${entry.name}"?`)) return
    usePanelScheduleStore.getState().loadPanel(entry.panel)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Saved panels">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Saved panels</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close saved panels">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          className="flex gap-2 p-4 border-b"
          onSubmit={(e) => {
            e.preventDefault()
            usePanelScheduleStore.getState().saveToHistory(name)
          }}
        >
          <Input aria-label="Name for saved panel" value={name} onChange={(e) => setName(e.target.value)} placeholder="Panel name" />
          <Button type="submit"><Save className="h-4 w-4 mr-2" />Save</Button>
        </form>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No saved panels yet.</p>
          ) : (
            history.map((e) => {
              const loads = e.panel.circuits.filter((c) => c.kind === 'load').length
              return (
                <Card key={e.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getSystem(e.panel).label} · {e.panel.spaces} spaces · {loads} circuit{loads === 1 ? '' : 's'}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(e.savedAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => restore(e.id)} aria-label={`Restore ${e.name}`}>
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => usePanelScheduleStore.getState().deleteFromHistory(e.id)} aria-label={`Delete ${e.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="outline" className="w-full"
              onClick={() => window.confirm('Delete all saved panels?') && usePanelScheduleStore.getState().clearHistory()}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
