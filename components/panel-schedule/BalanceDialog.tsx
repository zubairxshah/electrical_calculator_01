'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { BalanceProposal, Circuit } from '@/types/panel-schedule'

interface Props {
  proposal: BalanceProposal | null
  circuits: Circuit[]
  onAccept: () => void
  onDiscard: () => void
}

const pct = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)} %`)
const va = (v: number) => Math.round(v).toLocaleString()

export default function BalanceDialog({ proposal, circuits, onAccept, onDiscard }: Props) {
  if (!proposal) return null
  const byId = new Map(circuits.map((c) => [c.id, c]))
  const hasChanges = proposal.movedCircuitIds.length > 0

  return (
    <Dialog open onOpenChange={(o) => !o && onDiscard()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Balance proposal</DialogTitle>
          <DialogDescription>{proposal.message}</DialogDescription>
        </DialogHeader>

        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr><th className="text-left py-1">Phase</th><th className="text-right py-1">Before (VA)</th><th className="text-right py-1">After (VA)</th></tr>
          </thead>
          <tbody>
            {proposal.before.perPhase.map((p, i) => (
              <tr key={p.phase} className="border-t">
                <td className="py-1">{p.label}</td>
                <td className="py-1 text-right tabular-nums">{va(p.va)}</td>
                <td className="py-1 text-right tabular-nums font-medium">{va(proposal.after.perPhase[i].va)}</td>
              </tr>
            ))}
            <tr className="border-t font-semibold">
              <td className="py-1">Imbalance</td>
              <td className="py-1 text-right">{pct(proposal.before.imbalancePct)}</td>
              <td className="py-1 text-right">{pct(proposal.after.imbalancePct)}</td>
            </tr>
          </tbody>
        </table>

        {hasChanges && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Circuits to move ({proposal.movedCircuitIds.length})</p>
            <ul className="max-h-48 overflow-y-auto rounded border text-sm divide-y">
              {proposal.movedCircuitIds.map((id) => {
                const c = byId.get(id)
                return (
                  <li key={id} className="flex justify-between px-2 py-1">
                    <span>{c?.description || id}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {c?.startSpace ?? 'unplaced'} → <span className="text-foreground font-medium">{proposal.assignments[id]}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-muted-foreground">Locked circuits, spares and spaces are not moved. Nothing changes until you accept.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDiscard}>{hasChanges ? 'Discard' : 'Close'}</Button>
          {hasChanges && <Button onClick={onAccept}>Accept and renumber</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
