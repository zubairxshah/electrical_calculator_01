'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import NumberField from '@/components/panel-schedule/NumberField'
import DesignWarnings from './DesignWarnings'
import type {
  PFCControllerOutputs,
  PFCDesignInput,
  PFCInput,
  PFCSequenceMode,
  PFCStepBankDesign,
} from '@/types/power-factor-correction'

interface Props {
  input: Pick<PFCInput, 'voltage' | 'systemType' | 'correctionType'>
  design: PFCDesignInput
  bank: PFCStepBankDesign
  onDesignChange: (patch: Partial<PFCDesignInput>) => void
}

const SEQUENCE_LABELS: Record<PFCSequenceMode, string> = {
  auto: 'Auto (recommended)',
  '1:1:1': '1:1:1… (equal)',
  '1:2:2': '1:2:2…',
  '1:2:4': '1:2:4… (binary)',
  '1:1:2:2': '1:1:2:2…',
  custom: 'Custom steps',
}

const fmt = (n: number, d = 1) => Number(n.toFixed(d)).toLocaleString(undefined, { maximumFractionDigits: d })

/** Comma-separated kVAR list with focus/blur local state */
function CustomStepsField({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const [local, setLocal] = useState<string | null>(null)
  const display = value.join(', ')
  return (
    <div className="space-y-1">
      <Label htmlFor="pfc-custom-steps">Custom steps <span className="text-muted-foreground font-normal">(kVAR, comma-separated)</span></Label>
      <Input
        id="pfc-custom-steps"
        placeholder="e.g. 10, 20, 40, 40"
        value={local ?? display}
        aria-describedby="pfc-custom-steps-hint"
        onFocus={() => setLocal(display)}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== null && local !== display) {
            onChange(local.split(/[,;\s]+/).filter(Boolean).map(Number).filter(n => Number.isFinite(n)))
          }
          setLocal(null)
        }}
      />
      <p id="pfc-custom-steps-hint" className="text-xs text-muted-foreground">1–12 steps, each at system voltage (effective kVAR)</p>
    </div>
  )
}

export default function StepBankStage({ input, design, bank, onDesignChange }: Props) {
  const fixed = input.correctionType === 'fixed'
  const threePhase = input.systemType === 'three-phase-ac'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Step bank inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fixed ? (
            <p className="text-sm text-muted-foreground">
              Fixed correction is selected in stage 1, so the bank is a single step with no controller.
              Choose automatic correction in stage 1 to design switched steps.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="pfc-sequence">Step sequence</Label>
                  <Select value={design.sequenceMode} onValueChange={(v) => onDesignChange({ sequenceMode: v as PFCSequenceMode })}>
                    <SelectTrigger id="pfc-sequence"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SEQUENCE_LABELS) as PFCSequenceMode[]).map(m => (
                        <SelectItem key={m} value={m}>{SEQUENCE_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">The last ratio repeats until the target is reached</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pfc-outputs">Controller outputs (max)</Label>
                  <Select value={String(design.maxOutputs)} onValueChange={(v) => onDesignChange({ maxOutputs: Number(v) as PFCControllerOutputs })}>
                    <SelectTrigger id="pfc-outputs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[6, 8, 12].map(n => <SelectItem key={n} value={String(n)}>{n} outputs</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {design.sequenceMode === 'custom' && (
                <CustomStepsField value={design.customStepsKVAR} onChange={(v) => onDesignChange({ customStepsKVAR: v })} />
              )}

              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  id="pfc-ct-primary" label="CT primary" unit="A" value={design.ctPrimaryA}
                  onChange={(v) => onDesignChange({ ctPrimaryA: v ?? 0 })}
                />
                <div className="space-y-1">
                  <Label htmlFor="pfc-ct-secondary">CT secondary <span className="text-muted-foreground font-normal">(A)</span></Label>
                  <Select value={String(design.ctSecondaryA)} onValueChange={(v) => onDesignChange({ ctSecondaryA: Number(v) as 1 | 5 })}>
                    <SelectTrigger id="pfc-ct-secondary"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 A</SelectItem>
                      <SelectItem value="1">1 A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <NumberField
                id="pfc-min-variation" label="Minimum load variation" unit="kVAR" nullable
                value={design.minLoadVariationKVAR}
                onChange={(v) => onDesignChange({ minLoadVariationKVAR: v !== null && v > 0 ? v : null })}
                hint="Smallest reactive load change to follow. Blank = 10 % of the bank total"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step bank</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Target (derated)</dt><dd className="font-semibold">{fmt(bank.targetKVAR, 2)} kVAR</dd></div>
            <div><dt className="text-muted-foreground">Installed</dt><dd className="font-semibold">{fmt(bank.totalKVAR, 2)} kVAR</dd></div>
            <div><dt className="text-muted-foreground">Sequence</dt><dd className="font-semibold">{bank.preset ?? (fixed ? 'Fixed' : 'Custom')}</dd></div>
            <div><dt className="text-muted-foreground">Resolution</dt><dd className="font-semibold">{fmt(bank.resolutionKVAR, 2)} kVAR</dd></div>
            <div><dt className="text-muted-foreground">Switching levels</dt><dd className="font-semibold">{bank.switchingLevels}</dd></div>
            {bank.controller && (
              <div><dt className="text-muted-foreground">Controller</dt><dd className="font-semibold">{bank.controller.outputs}-output ({bank.outputsUsed} used)</dd></div>
            )}
          </dl>

          {bank.steps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Capacitor steps</caption>
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th scope="col" className="py-1 pr-2 font-medium">Step</th>
                    <th scope="col" className="py-1 pr-2 font-medium">Ratio</th>
                    <th scope="col" className="py-1 pr-2 font-medium text-right">kVAR</th>
                    <th scope="col" className="py-1 font-medium text-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {bank.steps.map(s => (
                    <tr key={s.index} className="border-b last:border-0">
                      <td className="py-1 pr-2">C{s.index}</td>
                      <td className="py-1 pr-2">{s.ratio ?? '—'}</td>
                      <td className="py-1 pr-2 text-right font-mono">{fmt(s.effectiveKVAR, 2)}</td>
                      <td className="py-1 text-right font-mono">{fmt(s.cumulativeKVAR, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bank.controller && (
            <div className="rounded-md bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">C/k setting</span>
                <span className="font-semibold">{bank.controller.ck !== null ? `${bank.controller.ck.toFixed(3)} A` : 'enter CT ratio'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                C/k = Q₁ / ({threePhase ? '√3 · ' : ''}U · k) = {fmt(bank.resolutionKVAR * 1000, 0)} var / ({threePhase ? '√3 × ' : ''}{input.voltage} V × {fmt(bank.controller.ctRatio, 1)}) — reactive current of the smallest step at the CT secondary (IEC 61921). Some controllers recommend setting 0.6–0.7 × this value.
              </p>
            </div>
          )}

          <DesignWarnings warnings={bank.warnings} />
        </CardContent>
      </Card>
    </div>
  )
}
