/**
 * Battery Results — hero headline metric, verdict, applied factors, bank
 * configuration, recommendations, and discharge chart (US1, US2, US3, US5).
 */

'use client'

import { toNumber } from '@/lib/mathConfig'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { Badge } from '@/components/ui/badge'
import { DischargeChart } from './DischargeChart'
import { chemistryDisplayLabel, toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import type { BatteryCalculatorResult, FactorValue } from '@/lib/types'
import { formatTimeDisplay } from '@/lib/utils/formatTime'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

const VERDICT = {
  pass: { label: 'Design sound', cls: 'text-green-600', Icon: CheckCircle2, badge: 'bg-green-50 text-green-700 border-green-200' },
  marginal: { label: 'Workable — review cautions', cls: 'text-yellow-600', Icon: AlertTriangle, badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  fail: { label: 'Not acceptable as specified', cls: 'text-destructive', Icon: XCircle, badge: 'bg-red-50 text-red-700 border-red-200' },
}

function FactorRow({ label, factor, render }: { label: string; factor: FactorValue; render: (v: number) => string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {factor.source}
        </Badge>
      </div>
      <div className="text-right">
        <span className="font-mono text-sm">{render(factor.value)}</span>
        {factor.standardReference && (
          <div className="text-[11px] text-muted-foreground">{factor.standardReference}</div>
        )}
      </div>
    </div>
  )
}

export function BatteryResults({ result }: { result: BatteryCalculatorResult }) {
  const v = VERDICT[result.verdict]
  const isSizing = result.mode === 'sizing'
  const f = result.appliedFactors
  const chem = chemistryDisplayLabel[toCanonicalChemistry(String(result.inputs.chemistry))]

  const headlineValue = isSizing
    ? (result.requiredCapacityAh ? toNumber(result.requiredCapacityAh) : toNumber(result.effectiveCapacityAh)).toFixed(0)
    : toNumber(result.backupTimeHours).toFixed(2)
  const headlineUnit = isSizing ? 'Ah' : 'hours'
  const headlineLabel = isSizing ? 'Required Capacity' : 'Backup Time'
  const subline = isSizing
    ? `${result.bankConfig.cellsInSeries}S × ${result.bankConfig.stringsInParallel}P · ${result.bankConfig.nameplateBankAh} Ah nameplate`
    : formatTimeDisplay(toNumber(result.backupTimeHours)).formatted

  const pct = (x: number) => `${(x * 100).toFixed(0)}%`

  return (
    <div className="space-y-4">
      {/* Hero */}
      <CalculationCard title="Result" standardsUsed={result.standardsApplied.slice(0, 2)} className="p-4 md:p-6">
        <div className="rounded-lg border border-primary bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">{headlineLabel}</div>
              <div className="mt-1 font-mono text-4xl font-bold text-primary md:text-5xl">
                {headlineValue}
                <span className="ml-2 text-base font-normal text-muted-foreground">{headlineUnit}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{subline}</div>
            </div>
            <Badge variant="outline" className={`gap-1 ${v.badge}`}>
              <v.Icon className="h-3.5 w-3.5" />
              {result.verdict.toUpperCase()}
            </Badge>
          </div>
          <div className={`mt-3 flex items-center gap-2 text-sm ${v.cls}`}>
            <v.Icon className="h-4 w-4" />
            {v.label}
          </div>
        </div>

        {/* secondary metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Effective capacity" value={`${toNumber(result.effectiveCapacityAh).toFixed(1)} Ah`} />
          <Metric label="Discharge rate" value={`C/${(1 / toNumber(result.dischargeRate)).toFixed(1)}`} />
          {isSizing && <Metric label="Over-capacity" value={`${result.bankConfig.overCapacityPct.toFixed(0)}%`} />}
          {!isSizing && <Metric label="Delivered backup" value={`${toNumber(result.backupTimeHours).toFixed(2)} h`} />}
        </div>
      </CalculationCard>

      {/* Discharge chart */}
      <CalculationCard title="State of Charge over Backup Period" className="p-4 md:p-6">
        <DischargeChart data={result.dischargeCurve} />
      </CalculationCard>

      {/* Applied factors */}
      <CalculationCard title="Applied Factors" description="Every derating factor and its source" className="p-4 md:p-6">
        <div>
          <FactorRow label="Depth of discharge" factor={f.dod} render={pct} />
          <FactorRow label="Temperature correction" factor={f.temperature} render={pct} />
          <FactorRow label="System efficiency" factor={f.efficiency} render={pct} />
          <FactorRow label="Aging (end-of-life)" factor={f.aging} render={pct} />
          <FactorRow label="Peukert rate derate" factor={f.peukert} render={(x) => `${(x * 100).toFixed(1)}%`} />
        </div>
      </CalculationCard>

      {/* Bank configuration (sizing) */}
      {isSizing && (
        <CalculationCard title="Recommended Bank Configuration" className="p-4 md:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Cells/blocks in series" value={`${result.bankConfig.cellsInSeries}`} />
            <Metric label="Strings in parallel" value={`${result.bankConfig.stringsInParallel}`} />
            <Metric label="Nameplate" value={`${result.bankConfig.nameplateBankAh} Ah`} />
            <Metric label="Bank voltage" value={`${result.bankConfig.nominalBankVoltage} V`} />
          </div>
        </CalculationCard>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <CalculationCard title="Recommendations" className="p-4 md:p-6">
          <ul className="space-y-1.5 text-sm">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </CalculationCard>
      )}

      {/* System info */}
      <CalculationCard title="System Information" className="p-4 md:p-6">
        <div className="space-y-2 text-sm">
          <InfoRow k="Battery chemistry" v={chem} />
          <InfoRow k="System voltage" v={`${result.inputs.voltage} V DC`} />
          <InfoRow k="Load power" v={`${result.inputs.loadWatts} W`} />
          <InfoRow k="Operating temperature" v={`${result.inputs.temperature ?? 25} °C`} />
        </div>
      </CalculationCard>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-semibold">{value}</div>
    </div>
  )
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}:</span>
      <span className="font-medium">{v}</span>
    </div>
  )
}
