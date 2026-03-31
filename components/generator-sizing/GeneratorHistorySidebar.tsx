'use client'

import { useState } from 'react'
import { useGeneratorSizingStore } from '@/stores/useGeneratorSizingStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Save, RotateCcw } from 'lucide-react'

export default function GeneratorHistorySidebar() {
  const store = useGeneratorSizingStore()
  const [saveLabel, setSaveLabel] = useState('')

  const handleSave = () => {
    if (!store.result) return
    const label = saveLabel.trim() || `Calc ${new Date().toLocaleString()}`
    store.saveToHistory(label)
    setSaveLabel('')
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-sm">Calculation History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Save current */}
        {store.result && (
          <div className="flex gap-1">
            <Input
              placeholder="Label..."
              value={saveLabel}
              onChange={(e) => setSaveLabel(e.target.value)}
              className="text-xs h-8"
            />
            <Button size="sm" variant="outline" onClick={handleSave} className="h-8">
              <Save className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* History list */}
        {store.history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved calculations</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {store.history.map((entry) => (
              <div
                key={entry.id}
                className="border rounded p-2 text-xs space-y-1"
              >
                <p className="font-medium truncate">{entry.label}</p>
                <p className="text-muted-foreground">
                  {entry.result.recommendedGeneratorKva} kVA · {entry.result.totalRunningKw} kW
                </p>
                <p className="text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => store.loadFromHistory(entry.id)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-red-500"
                    onClick={() => store.removeFromHistory(entry.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {store.history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-red-500"
            onClick={() => store.clearHistory()}
          >
            Clear All History
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
