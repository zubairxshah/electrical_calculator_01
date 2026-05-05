'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'

export default function HistorySidebar() {
  const { history, loadFromHistory, clearHistory } = useMotorStartingStore()

  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3">
        No saved analyses yet. Click <strong>Save to History</strong> after running an analysis.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="font-semibold text-sm">History ({history.length})</div>
        <Button variant="ghost" size="sm" onClick={clearHistory}>Clear</Button>
      </div>
      <ScrollArea className="flex-1">
        <ul className="divide-y">
          {history.map((entry) => (
            <li key={entry.id}>
              <button
                className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                onClick={() => loadFromHistory(entry.id)}
              >
                <div className="text-sm font-medium">{entry.label}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Recommended: {entry.result.comparison.recommendedMethod}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
