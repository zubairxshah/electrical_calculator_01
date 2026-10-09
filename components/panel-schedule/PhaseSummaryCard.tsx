'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { PanelWarning, PhaseSummary, SystemDefinition } from '@/types/panel-schedule'
import { PHASE_STYLES } from './PanelScheduleGrid'

interface Props {
  summary: PhaseSummary
  system: SystemDefinition
  targetPct: number
  warnings: PanelWarning[]
}

const va = (v: number) => `${Math.round(v).toLocaleString()} VA`
const amps = (a: number) => `${a.toFixed(1)} A`

export function WarningList({ warnings }: { warnings: PanelWarning[] }) {
  if (warnings.length === 0) return null
  return (
    <ul className="space-y-2">
      {warnings.map((w, i) => {
        const tone = w.severity === 'error'
          ? 'border-destructive/50 bg-destructive/10 text-destructive'
          : w.severity === 'warning'
            ? 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200'
            : 'border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
        const Icon = w.severity === 'error' ? AlertCircle : w.severity === 'warning' ? AlertTriangle : Info
        return (
          <li key={`${w.code}-${w.circuitId ?? i}`} className={`flex items-start gap-2 rounded-md border p-2 text-sm ${tone}`}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            <span>
              {w.message}
              {w.reference && <span className="opacity-75"> — {w.reference}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default function PhaseSummaryCard({ summary, system, targetPct, warnings }: Props) {
  const max = Math.max(...summary.perPhase.map((p) => p.va), 1)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
        <CardTitle>Phase loading (connected)</CardTitle>
        {summary.imbalancePct === null ? (
          <Badge variant="secondary">Imbalance —</Badge>
        ) : (
          <Badge className={summary.imbalanceOk ? 'bg-green-600 hover:bg-green-600' : 'bg-yellow-600 hover:bg-yellow-600'}>
            Imbalance {summary.imbalancePct.toFixed(1)} % {summary.imbalanceOk ? '≤' : '>'} {targetPct} %
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {summary.perPhase.map((p) => (
            <div key={p.phase} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Phase {p.label}</span>
                <span className="tabular-nums">
                  {va(p.va)} · {amps(p.currentA)}
                  {p.deviationPct !== null && (
                    <span className="text-muted-foreground"> ({p.deviationPct >= 0 ? '+' : ''}{p.deviationPct.toFixed(1)} %)</span>
                  )}
                </span>
              </div>
              <div className="h-2 rounded bg-muted" aria-hidden>
                <div className={`h-2 rounded ${PHASE_STYLES[p.phase].split(' ')[0]}`} style={{ width: `${(p.va / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div><dt className="text-muted-foreground">Total connected</dt><dd className="font-semibold tabular-nums">{va(summary.totalVA)}</dd></div>
          <div><dt className="text-muted-foreground">Total current</dt><dd className="font-semibold tabular-nums">{amps(summary.totalCurrentA)}</dd></div>
          <div>
            <dt className="text-muted-foreground">Neutral (est.)</dt>
            <dd className="font-semibold tabular-nums">{summary.neutralCurrentA === null ? 'No neutral' : amps(summary.neutralCurrentA)}</dd>
          </div>
          <div><dt className="text-muted-foreground">Spaces used</dt><dd className="font-semibold tabular-nums">{summary.usedSpaces} / {summary.usedSpaces + summary.freeSpaces}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Per-phase current = phase VA / {system.vLN ? `${system.vLN} V` : `(${system.vLL} V/√3)`}. Total current =
          {system.threePhase ? ` VA / (√3 × ${system.vLL} V)` : ` VA / ${system.vLL} V`}. Neutral estimate uses line-to-neutral
          loads only, unity PF, no harmonics — use the Harmonic Analysis calculator for triplen loading.
        </p>
        <WarningList warnings={warnings} />
      </CardContent>
    </Card>
  )
}
