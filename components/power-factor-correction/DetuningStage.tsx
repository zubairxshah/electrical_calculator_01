'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type {
  PFCDesignInput,
  PFCDetuningChoice,
  PFCDetuningDesign,
  PFCInput,
} from '@/types/power-factor-correction'

interface Props {
  input: Pick<PFCInput, 'voltage' | 'frequency' | 'harmonicDistortion'>
  design: PFCDesignInput
  detuning: PFCDetuningDesign
  onDesignChange: (patch: Partial<PFCDesignInput>) => void
}

const fmt = (n: number, d = 2) => Number(n.toFixed(d)).toLocaleString(undefined, { maximumFractionDigits: d })

const CHOICES: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto (recommended)' },
  { value: 'none', label: 'None — plain capacitors' },
  { value: '5.67', label: '5.67 %' },
  { value: '7', label: '7 %' },
  { value: '14', label: '14 %' },
]

function parseChoice(v: string): PFCDetuningChoice {
  if (v === 'auto' || v === 'none') return v
  return Number(v) as 5.67 | 7 | 14
}

export default function DetuningStage({ input, design, detuning, onDesignChange }: Props) {
  const p = detuning.applied
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Detuning inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">THD (from stage 1)</span>
              <span className="font-semibold">{input.harmonicDistortion} %</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recommendation</span>
              <span className="font-semibold">{detuning.recommended !== null ? `${detuning.recommended} %` : 'No detuning'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rule: THD ≤ 10 % → none; THD &gt; 10 % → 7 %; significant 3rd harmonic → 14 %.</p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="pfc-third-harmonic"
              checked={design.thirdHarmonic}
              onCheckedChange={(c) => onDesignChange({ thirdHarmonic: c === true })}
            />
            <div className="space-y-0.5">
              <Label htmlFor="pfc-third-harmonic">Significant 3rd harmonic</Label>
              <p className="text-xs text-muted-foreground">Unbalanced single-phase loads, LED/IT loads on the neutral</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pfc-detuning">Detuning factor p</Label>
            <Select value={String(design.detuning)} onValueChange={(v) => onDesignChange({ detuning: parseChoice(v) })}>
              <SelectTrigger id="pfc-detuning"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHOICES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{p !== null ? `Detuned at ${p} %` : 'No detuning applied'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Tuning frequency</dt>
              <dd className="font-semibold">{detuning.tuningFrequencyHz !== null ? `${fmt(detuning.tuningFrequencyHz, 1)} Hz` : '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Capacitor voltage</dt>
              <dd className="font-semibold">{fmt(detuning.capacitorVoltageV, 1)} V</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Capacitor rated voltage</dt>
              <dd className="font-semibold">{detuning.capacitorRatedVoltageV} V</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total rated kVAR</dt>
              <dd className="font-semibold">{fmt(detuning.totalRatedKVAR, 1)} kVAR</dd>
            </div>
          </dl>

          {detuning.steps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Per-step capacitor and reactor values</caption>
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th scope="col" className="py-1 pr-2 font-medium">Step</th>
                    <th scope="col" className="py-1 pr-2 font-medium text-right">Effective kVAR</th>
                    <th scope="col" className="py-1 pr-2 font-medium text-right">Rated kVAR @ {detuning.capacitorRatedVoltageV} V</th>
                    <th scope="col" className="py-1 pr-2 font-medium text-right">L (mH/ph)</th>
                    <th scope="col" className="py-1 font-medium text-right">I (A)</th>
                  </tr>
                </thead>
                <tbody>
                  {detuning.steps.map(s => (
                    <tr key={s.index} className="border-b last:border-0">
                      <td className="py-1 pr-2">C{s.index}</td>
                      <td className="py-1 pr-2 text-right font-mono">{fmt(s.effectiveKVAR)}</td>
                      <td className="py-1 pr-2 text-right font-mono">{fmt(s.ratedKVAR)}</td>
                      <td className="py-1 pr-2 text-right font-mono">{s.reactorInductanceMH !== null ? fmt(s.reactorInductanceMH, 3) : '—'}</td>
                      <td className="py-1 text-right font-mono">{fmt(s.currentA, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>fr = f / √p · Uc = U / (1 − p) · Ur ≥ 1.1 × Uc (IEC 60831-1)</p>
            <p>Xc = U² / (Qeff · (1 − p)) · L = p · Xc / (2πf) · Qr = Ur² / Xc — effective kVAR is delivered at {input.voltage} V, {input.frequency} Hz</p>
          </div>

          {detuning.notes.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {detuning.notes.map(n => <li key={n}>{n}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
