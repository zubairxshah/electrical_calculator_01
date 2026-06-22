/**
 * Derating Factors table — shows each factor's datasheet default alongside an
 * editable override, in one place (DoD, temperature correction, efficiency,
 * end-of-life aging, Peukert exponent). Empty override = use the default.
 */

'use client'

import { useState, useEffect } from 'react'
import { useBatteryStore } from '@/stores/useBatteryStore'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import { toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import { derivedTemperatureFactor } from '@/lib/calculations/battery/derating'
import type { BatteryCalculatorInputs } from '@/lib/types'
import { cn } from '@/lib/utils'

type RowKey = 'dodOverride' | 'tempFactorOverride' | 'efficiency' | 'agingFactor' | 'peukertExponentOverride'

interface RowDef {
  key: RowKey
  label: string
  def: number
  override: number | undefined
  /** 'fraction' shows a % hint; 'number' is a bare value (Peukert exponent) */
  kind: 'fraction' | 'number'
  reference: string
  step: string
}

function fmt(value: number, kind: 'fraction' | 'number') {
  return kind === 'fraction' ? `${(value * 100).toFixed(0)}%` : value.toFixed(2)
}

/** Strip floating-point noise (e.g. 0.55 * 100 = 55.00000001) for display. */
function clean(n: number) {
  return parseFloat(n.toFixed(6)).toString()
}

/** One editable override cell with local string state (decimal-friendly). */
function OverrideCell({
  value,
  placeholder,
  step,
  suffix,
  onCommit,
}: {
  value: number | undefined
  placeholder: string
  step: string
  suffix?: string
  onCommit: (v: number | undefined) => void
}) {
  const [local, setLocal] = useState(value == null ? '' : String(value))

  useEffect(() => {
    setLocal(value == null ? '' : String(value))
  }, [value])

  const commit = (raw: string) => {
    setLocal(raw)
    if (raw.trim() === '') {
      onCommit(undefined)
      return
    }
    if (raw.endsWith('.')) return
    const n = parseFloat(raw)
    if (!isNaN(n)) onCommit(n)
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={local}
        placeholder={placeholder}
        step={step}
        onChange={(e) => commit(e.target.value)}
        className={cn(
          'h-9 w-full rounded-md border bg-background px-2 text-right font-mono text-sm',
          suffix ? 'pr-6' : '',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          value != null ? 'border-primary/60' : 'border-input'
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  )
}

export function FactorTable() {
  const { inputs, setInputs } = useBatteryStore()
  const profile = getBatteryTypeById(toCanonicalChemistry(String(inputs.chemistry)))
  if (!profile) return null

  const rows: RowDef[] = [
    {
      key: 'dodOverride',
      label: 'Depth of discharge',
      def: profile.depthOfDischarge.recommended / 100,
      override: inputs.dodOverride,
      kind: 'fraction',
      reference: 'IEEE 485 §5',
      step: '0.05',
    },
    {
      key: 'tempFactorOverride',
      label: 'Temperature correction',
      def: derivedTemperatureFactor(inputs.temperature, profile),
      override: inputs.tempFactorOverride,
      kind: 'fraction',
      reference: 'IEEE 485 §6',
      step: '0.05',
    },
    {
      key: 'efficiency',
      label: 'System efficiency',
      def: profile.efficiency.roundTrip.typical / 100,
      override: inputs.efficiency,
      kind: 'fraction',
      reference: 'IEC 60896 / 62619',
      step: '0.01',
    },
    {
      key: 'agingFactor',
      label: 'End-of-life (aging)',
      def: 0.8,
      override: inputs.agingFactor,
      kind: 'fraction',
      reference: 'IEEE 485 §4.2',
      step: '0.05',
    },
    {
      key: 'peukertExponentOverride',
      label: 'Peukert exponent',
      def: profile.peukertExponent,
      override: inputs.peukertExponentOverride,
      kind: 'number',
      reference: 'Rate derating',
      step: '0.01',
    },
  ]

  const setOverride = (key: RowKey, v: number | undefined) =>
    setInputs({ [key]: v } as Partial<BatteryCalculatorInputs>)

  const anyOverride = rows.some((r) => r.override != null)

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Factor</th>
            <th className="px-3 py-2 text-right font-medium">Datasheet default</th>
            <th className="px-3 py-2 text-right font-medium">Your override</th>
            <th className="px-3 py-2 text-right font-medium">Applied</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const applied = r.override ?? r.def
            const isFraction = r.kind === 'fraction'
            // Edit fraction factors as whole percentages (50, not 0.5); the
            // store still holds 0–1 fractions, so we scale at this boundary.
            const scale = isFraction ? 100 : 1
            return (
              <tr key={r.key} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-[11px] text-muted-foreground">{r.reference}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                  {fmt(r.def, r.kind)}
                </td>
                <td className="px-3 py-2">
                  <OverrideCell
                    value={r.override == null ? undefined : parseFloat((r.override * scale).toFixed(6))}
                    placeholder={isFraction ? clean(r.def * 100) : r.def.toFixed(2)}
                    step={r.step}
                    suffix={isFraction ? '%' : undefined}
                    onCommit={(v) => setOverride(r.key, v == null ? undefined : v / scale)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={cn(
                      'font-mono font-semibold',
                      r.override != null ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {fmt(applied, r.kind)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span>Leave a cell blank to use the datasheet default. Enter whole percentages (e.g. 50 = 50%); Peukert is a bare exponent.</span>
        {anyOverride && (
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() =>
              setInputs({
                dodOverride: undefined,
                tempFactorOverride: undefined,
                efficiency: undefined,
                agingFactor: undefined,
                peukertExponentOverride: undefined,
              })
            }
          >
            Reset to defaults
          </button>
        )}
      </div>
    </div>
  )
}
