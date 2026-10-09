'use client'

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Lock, LockOpen, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Circuit, CircuitLoad, Phase, SystemDefinition } from '@/types/panel-schedule'
import { phaseLabel, phaseOfSpace } from '@/lib/calculations/panel-schedule/system'
import { occupancyMap } from '@/lib/calculations/panel-schedule/placement'

interface Props {
  circuits: Circuit[]
  loads: CircuitLoad[]
  system: SystemDefinition
  spaces: number
  invalidIds: Set<string>
  /** Circuits highlighted (e.g. moved by a balance proposal) */
  highlightIds?: Set<string>
  onEdit: (id: string) => void
  onAddAt: (space: number) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onToggleLock: (id: string) => void
}

export const PHASE_STYLES: Record<Phase, string> = {
  A: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900',
  B: 'bg-red-600 text-white',
  C: 'bg-blue-600 text-white',
}

export function PhaseBadge({ phase, system }: { phase: Phase; system: SystemDefinition }) {
  return (
    <span className={`inline-flex min-w-[1.75rem] justify-center rounded px-1.5 py-0.5 text-xs font-semibold ${PHASE_STYLES[phase]}`}>
      {phaseLabel(phase, system)}
    </span>
  )
}

const fmtVA = (v: number) => (v > 0 ? Math.round(v).toLocaleString() : '')

interface CellProps extends Omit<Props, 'circuits' | 'loads' | 'spaces'> {
  space: number
  side: 'left' | 'right'
  circuit: Circuit | undefined
  poleIndex: number
  load: CircuitLoad | undefined
}

function SpaceCells({ space, side, circuit, poleIndex, load, system, invalidIds, highlightIds, onEdit, onAddAt, onDuplicate, onDelete, onToggleLock }: CellProps) {
  const phase = phaseOfSpace(space, system)
  const share = load ? (load.vaPerPhase[phase] ?? 0) / load.phases.filter((p) => p === phase).length : 0
  const first = poleIndex === 0
  const invalid = circuit && invalidIds.has(circuit.id)
  const highlight = circuit && highlightIds?.has(circuit.id)

  let desc: ReactNode
  if (!circuit) {
    desc = (
      <button type="button" onClick={() => onAddAt(space)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" aria-label={`Add circuit at space ${space}`}>
        <Plus className="h-3 w-3" /> add
      </button>
    )
  } else if (!first) {
    desc = <span className="text-xs text-muted-foreground" aria-label={`${circuit.description || 'circuit'} pole ${poleIndex + 1}`}>┃</span>
  } else {
    const label = circuit.kind === 'spare' ? (circuit.description || 'SPARE') : circuit.kind === 'space' ? (circuit.description || 'SPACE') : circuit.description || '(no description)'
    desc = (
      <span className="inline-flex items-center gap-1">
        {circuit.locked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" aria-label="locked" />}
        <button type="button" onClick={() => onEdit(circuit.id)} className={`text-left hover:underline ${circuit.kind !== 'load' ? 'italic text-muted-foreground uppercase text-xs' : ''}`}>
          {label}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label={`Actions for ${label}`}>
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={side === 'left' ? 'start' : 'end'}>
            <DropdownMenuItem onClick={() => onEdit(circuit.id)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(circuit.id)}><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleLock(circuit.id)}>
              {circuit.locked ? <LockOpen className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              {circuit.locked ? 'Unlock' : 'Lock position'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(circuit.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    )
  }

  const bkr = circuit && first && circuit.kind !== 'space' ? `${circuit.breakerA ?? '—'}/${circuit.poles}P` : ''
  const rowTone = invalid ? 'bg-destructive/10' : highlight ? 'bg-amber-50 dark:bg-amber-950/30' : ''
  const cells = [
    <td key="desc" className={`px-2 py-1 ${rowTone} ${side === 'left' ? '' : 'text-right'}`}>{desc}</td>,
    <td key="va" className={`px-2 py-1 tabular-nums text-right ${rowTone}`}>{fmtVA(share)}</td>,
    <td key="bkr" className={`px-2 py-1 text-center text-xs whitespace-nowrap ${rowTone}`}>{bkr}</td>,
    <td key="no" className={`px-2 py-1 text-center font-mono text-xs font-semibold ${rowTone}`}>{space}</td>,
  ]
  return <>{side === 'left' ? cells : cells.reverse()}</>
}

export default function PanelScheduleGrid(props: Props) {
  const { circuits, loads, system, spaces } = props
  const occ = occupancyMap(circuits)
  const byId = new Map(circuits.map((c) => [c.id, c]))
  const loadById = new Map(loads.map((l) => [l.circuitId, l]))
  const rows = Array.from({ length: Math.ceil(spaces / 2) }, (_, i) => i + 1)

  const cellProps = (space: number, side: 'left' | 'right'): CellProps => {
    const o = occ.get(space)
    const circuit = o ? byId.get(o.circuitId) : undefined
    return {
      ...props, space, side, circuit, poleIndex: o?.poleIndex ?? 0,
      load: circuit ? loadById.get(circuit.id) : undefined,
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="sr-only">Panel schedule — odd circuits left, even circuits right</caption>
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-2 py-2 text-left">Description</th>
            <th className="px-2 py-2 text-right">VA</th>
            <th className="px-2 py-2">Bkr</th>
            <th className="px-2 py-2">Ckt</th>
            <th className="px-2 py-2">Phase</th>
            <th className="px-2 py-2">Ckt</th>
            <th className="px-2 py-2">Bkr</th>
            <th className="px-2 py-2 text-right">VA</th>
            <th className="px-2 py-2 text-right">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const left = 2 * r - 1
            const right = 2 * r
            return (
              <tr key={r} className="border-t">
                <SpaceCells {...cellProps(left, 'left')} />
                <td className="px-2 py-1 text-center"><PhaseBadge phase={phaseOfSpace(left, system)} system={system} /></td>
                {right <= spaces ? <SpaceCells {...cellProps(right, 'right')} /> : <td colSpan={4} />}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
