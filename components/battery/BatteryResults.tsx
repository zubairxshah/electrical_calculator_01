/**
 * Battery Results — hero headline metric, verdict, applied factors, bank
 * configuration, recommendations, and discharge chart (US1, US2, US3, US5).
 */

'use client'

import { toNumber } from '@/lib/mathConfig'
import { useBatteryStore } from '@/stores/useBatteryStore'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { Badge } from '@/components/ui/badge'
import { DischargeChart } from './DischargeChart'
import { OverrideCell } from './OverrideCell'
import { chemistryDisplayLabel, toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import type { BatteryCalculatorInputs, BatteryCalculatorResult, FactorValue } from '@/lib/types'
import { formatTimeDisplay } from '@/lib/utils/formatTime'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

const VERDICT = {
  pass: { label: 'Design sound', cls: 'text-green-600', Icon: CheckCircle2, badge: 'bg-green-50 text-green-700 border-green-200' },
  marginal: { label: 'Workable — review cautions', cls: 'text-yellow-600', Icon: AlertTriangle, badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  fail: { label: 'Not acceptable as specified', cls: 'text-destructive', Icon: XCircle, badge: 'bg-red-50 text-red-700 border-red-200' },
}

/**
 * One editable derating-factor row in the Applied Factors card. The factor is
 * shown with its source + reference, and an inline input lets the user override
 * it. `scale` maps the stored value to the displayed unit (×100 for fractions
 * edited as percentages, ×1 for bare numbers like the Peukert exponent).
 */
function EditableFactorRow({
  label,
  source,
  reference,
  caption,
  override,
  placeholder,
  scale,
  suffix,
  step,
  onCommit,
}: {
  label: string
  source: FactorValue['source']
  reference?: string
  caption?: string
  override: number | undefined
  placeholder: string
  scale: number
  suffix?: string
  step: string
  onCommit: (v: number | undefined) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {source}
          </Badge>
        </div>
        {reference && <div className="text-[11px] text-muted-foreground">{reference}</div>}
        {caption && <div className="text-[11px] text-muted-foreground">{caption}</div>}
      </div>
      <OverrideCell
        className="w-24 shrink-0"
        value={override == null ? undefined : parseFloat((override * scale).toFixed(6))}
        placeholder={placeholder}
        step={step}
        suffix={suffix}
        onCommit={(v) => onCommit(v == null ? undefined : v / scale)}
      />
    </div>
  )
}

export function BatteryResults({ result }: { result: BatteryCalculatorResult }) {
  const { inputs, setInputs } = useBatteryStore()
  const v = VERDICT[result.verdict]
  const isSizing = result.mode === 'sizing'
  const f = result.appliedFactors
  const chem = chemistryDisplayLabel[toCanonicalChemistry(String(result.inputs.chemistry))]
  const profile = getBatteryTypeById(toCanonicalChemistry(String(result.inputs.chemistry)))

  const setOverride = (key: keyof BatteryCalculatorInputs, val: number | undefined) =>
    setInputs({ [key]: val } as Partial<BatteryCalculatorInputs>)

  const anyOverride =
    inputs.dodOverride != null ||
    inputs.tempFactorOverride != null ||
    inputs.efficiency != null ||
    inputs.agingFactor != null ||
    inputs.peukertExponentOverride != null

  const resetOverrides = () =>
    setInputs({
      dodOverride: undefined,
      tempFactorOverride: undefined,
      efficiency: undefined,
      agingFactor: undefined,
      peukertExponentOverride: undefined,
    })

  const headlineValue = isSizing
    ? (result.requiredCapacityAh ? toNumber(result.requiredCapacityAh) : toNumber(result.effectiveCapacityAh)).toFixed(0)
    : toNumber(result.backupTimeHours).toFixed(2)
  const headlineUnit = isSizing ? 'Ah' : 'hours'
  const headlineLabel = isSizing ? 'Required Capacity' : 'Backup Time'
  const subline = isSizing
    ? `${result.bankConfig.cellsInSeries}S × ${result.bankConfig.stringsInParallel}P · ${result.bankConfig.nameplateBankAh} Ah nameplate`
    : formatTimeDisplay(toNumber(result.backupTimeHours)).formatted

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

      {/* Applied factors — editable; leave a field blank to use the default */}
      <CalculationCard
        title="Applied Factors"
        description="Each derating factor and its source — edit any field to override"
        className="p-4 md:p-6"
      >
        <div>
          <EditableFactorRow
            label="Depth of discharge"
            source={f.dod.source}
            reference={f.dod.standardReference}
            override={inputs.dodOverride}
            placeholder={(f.dod.value * 100).toFixed(0)}
            scale={100}
            suffix="%"
            step="1"
            onCommit={(val) => setOverride('dodOverride', val)}
          />
          <EditableFactorRow
            label="Temperature correction"
            source={f.temperature.source}
            reference={f.temperature.standardReference}
            override={inputs.tempFactorOverride}
            placeholder={(f.temperature.value * 100).toFixed(0)}
            scale={100}
            suffix="%"
            step="1"
            onCommit={(val) => setOverride('tempFactorOverride', val)}
          />
          <EditableFactorRow
            label="System efficiency"
            source={f.efficiency.source}
            reference={f.efficiency.standardReference}
            override={inputs.efficiency}
            placeholder={(f.efficiency.value * 100).toFixed(0)}
            scale={100}
            suffix="%"
            step="1"
            onCommit={(val) => setOverride('efficiency', val)}
          />
          <EditableFactorRow
            label="Aging (end-of-life)"
            source={f.aging.source}
            reference={f.aging.standardReference}
            override={inputs.agingFactor}
            placeholder={(f.aging.value * 100).toFixed(0)}
            scale={100}
            suffix="%"
            step="1"
            onCommit={(val) => setOverride('agingFactor', val)}
          />
          <EditableFactorRow
            label="Peukert exponent"
            source={f.peukert.source}
            caption={`→ ${(f.peukert.value * 100).toFixed(1)}% rate derate applied`}
            override={inputs.peukertExponentOverride}
            placeholder={(profile?.peukertExponent ?? 1.1).toFixed(2)}
            scale={1}
            step="0.01"
            onCommit={(val) => setOverride('peukertExponentOverride', val)}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Blank = datasheet/standard default. Percentages are whole numbers (e.g. 50 = 50%).</span>
          {anyOverride && (
            <button type="button" className="font-medium text-primary hover:underline" onClick={resetOverrides}>
              Reset to defaults
            </button>
          )}
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
