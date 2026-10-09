'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DesignWarnings from './DesignWarnings'
import { cableOptions } from '@/lib/calculations/power-factor-correction/switchgear'
import type {
  PFCProtectionType,
  PFCStandard,
  PFCStepOverride,
  PFCSwitchgearDesign,
  PFCSwitchgearStep,
} from '@/types/power-factor-correction'

interface Props {
  standard: PFCStandard
  switchgear: PFCSwitchgearDesign
  onProtectionTypeChange: (t: PFCProtectionType) => void
  onOverride: (index: number, patch: PFCStepOverride | null) => void
}

const fmt = (n: number, d = 1) => Number(n.toFixed(d)).toLocaleString(undefined, { maximumFractionDigits: d })

/** Inline amps override: shows the recommendation as placeholder; blank restores it */
function AmpsOverride({
  id, label, value, overridden, ok, onChange,
}: { id: string; label: string; value: number | null; overridden: boolean; ok: boolean; onChange: (v: number | undefined) => void }) {
  const [local, setLocal] = useState<string | null>(null)
  const display = overridden && value !== null ? String(value) : ''
  return (
    <Input
      id={id}
      aria-label={label}
      aria-invalid={!ok}
      type="number"
      inputMode="decimal"
      placeholder={value !== null ? String(value) : 'n/a'}
      className={`h-8 w-20 text-right font-mono ${!ok ? 'border-destructive text-destructive' : overridden ? 'border-primary' : ''}`}
      value={local ?? display}
      onFocus={() => setLocal(display)}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== null && local !== display) {
          const n = parseFloat(local)
          onChange(local.trim() === '' || !(n > 0) ? undefined : n)
        }
        setLocal(null)
      }}
    />
  )
}

function StepRow({ s, standard, onOverride }: { s: PFCSwitchgearStep; standard: PFCStandard; onOverride: Props['onOverride'] }) {
  const cables = cableOptions(standard)
  const anyOverride = s.contactor.overridden || s.protection.overridden || s.cable.overridden
  return (
    <tr className="border-b last:border-0 align-middle">
      <th scope="row" className="py-2 pr-2 font-medium text-left">C{s.index}</th>
      <td className="py-2 pr-2 text-right font-mono">{fmt(s.ratedCurrentA)}</td>
      <td className="py-2 pr-2 text-right font-mono">{fmt(s.designCurrentA)}</td>
      <td className="py-2 pr-2">
        <AmpsOverride
          id={`pfc-ct-${s.index}`} label={`Step ${s.index} contactor rating (A)`}
          value={s.contactor.value} overridden={s.contactor.overridden} ok={s.contactor.ok}
          onChange={(v) => onOverride(s.index, { contactorA: v })}
        />
      </td>
      <td className="py-2 pr-2">
        <AmpsOverride
          id={`pfc-pr-${s.index}`} label={`Step ${s.index} ${s.protection.type === 'fuse' ? 'fuse' : 'breaker'} rating (A)`}
          value={s.protection.value} overridden={s.protection.overridden} ok={s.protection.ok}
          onChange={(v) => onOverride(s.index, { protectionA: v })}
        />
      </td>
      <td className="py-2 pr-2">
        <Select
          value={s.cable.overridden ? (s.cable.value ?? '') : 'auto'}
          onValueChange={(v) => onOverride(s.index, { cableSize: v === 'auto' ? undefined : v })}
        >
          <SelectTrigger
            aria-label={`Step ${s.index} cable size`}
            aria-invalid={!s.cable.ok}
            className={`h-8 w-32 ${!s.cable.ok ? 'border-destructive text-destructive' : s.cable.overridden ? 'border-primary' : ''}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">{s.cable.overridden ? 'Auto' : `${s.cable.label ?? 'n/a'} (auto)`}</SelectItem>
            {cables.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label} — {c.ampacityA} A</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-2">
        {anyOverride && (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">override</Badge>
            <Button
              type="button" variant="ghost" size="icon" className="h-7 w-7"
              aria-label={`Reset step ${s.index} to recommended ratings`}
              onClick={() => onOverride(s.index, null)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default function SwitchgearStage({ standard, switchgear, onProtectionTypeChange, onOverride }: Props) {
  const iec = standard === 'IEC'
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
          <CardTitle>Per-step switchgear</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Protection</Label>
            <Tabs value={switchgear.protectionType} onValueChange={(v) => onProtectionTypeChange(v as PFCProtectionType)}>
              <TabsList>
                <TabsTrigger value="fuse">{iec ? 'gG fuse' : 'Fuse'}</TabsTrigger>
                <TabsTrigger value="mccb">{iec ? 'MCCB' : 'Circuit breaker'}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Design current = {iec ? '1.3 × 1.1 × In ≈ 1.43 × In (IEC 60831-1 overcurrent × capacitance tolerance, IEC 61921)' : '1.35 × In (NEC 460.8(A))'}.
            Contactors are AC-6b capacitor-duty (IEC 60947-4-1); cables are copper, {iec ? 'PVC 70 °C, IEC 60364-5-52 method B1' : '75 °C column, NEC Table 310.16'}.
            Type a value to override a recommendation; leave blank to restore it.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Switchgear schedule per capacitor step</caption>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="py-1 pr-2 font-medium">Step</th>
                  <th scope="col" className="py-1 pr-2 font-medium text-right">In (A)</th>
                  <th scope="col" className="py-1 pr-2 font-medium text-right">Design (A)</th>
                  <th scope="col" className="py-1 pr-2 font-medium">Contactor (A)</th>
                  <th scope="col" className="py-1 pr-2 font-medium">{switchgear.protectionType === 'fuse' ? 'Fuse (A)' : 'Breaker (A)'}</th>
                  <th scope="col" className="py-1 pr-2 font-medium">Cable</th>
                  <th scope="col" className="py-1 font-medium"><span className="sr-only">Override status</span></th>
                </tr>
              </thead>
              <tbody>
                {switchgear.steps.map(s => <StepRow key={s.index} s={s} standard={standard} onOverride={onOverride} />)}
              </tbody>
            </table>
          </div>
          {switchgear.steps[0] && (
            <p className="text-xs text-muted-foreground">Contactor type: {switchgear.steps[0].contactor.type}.</p>
          )}
          <DesignWarnings warnings={switchgear.warnings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Panel incomer &amp; busbar</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Σ step current</dt><dd className="font-semibold">{fmt(switchgear.totalRatedCurrentA)} A</dd></div>
            <div><dt className="text-muted-foreground">Design current</dt><dd className="font-semibold">{fmt(switchgear.totalDesignCurrentA)} A</dd></div>
            <div><dt className="text-muted-foreground">Main incomer</dt><dd className="font-semibold">{switchgear.incomerA ? `${switchgear.incomerA} A` : '—'}</dd></div>
            <div><dt className="text-muted-foreground">Busbar</dt><dd className="font-semibold">{switchgear.busbarA ? `${switchgear.busbarA} A` : '—'}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground mt-2">
            {iec ? 'Incomer from the IEC preferred breaker series' : 'Incomer from NEC 240.6(A) standard ratings; disconnect ≥ 135 % of rated current (NEC 460.8(C))'}.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
