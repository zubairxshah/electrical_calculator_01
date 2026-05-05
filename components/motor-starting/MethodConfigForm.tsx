'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'
import type {
  AutotransformerConfig, AutotransformerTap, MethodConfig, SoftStarterConfig, StarDeltaConfig, StarDeltaTransition, VfdConfig,
} from '@/types/motor-starting'

function NumericInput({
  id, value, onChange, min, max, step,
}: {
  id?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  const [local, setLocal] = useState<string | null>(null)
  return (
    <Input
      id={id}
      type="number"
      min={min} max={max} step={step}
      value={local !== null ? local : value}
      onFocus={() => setLocal(value === 0 ? '' : String(value))}
      onBlur={() => {
        const p = parseFloat(local ?? '')
        if (!isNaN(p)) onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, p)))
        setLocal(null)
      }}
      onChange={(e) => (local !== null ? setLocal(e.target.value) : onChange(Number(e.target.value)))}
    />
  )
}

export default function MethodConfigForm() {
  const { currentInput, setMethodConfig } = useMotorStartingStore()
  const find = (m: MethodConfig['method']) => currentInput.methodConfigs.find((c) => c.method === m)
  const yd = find('STAR_DELTA') as StarDeltaConfig | undefined
  const at = find('AUTOTRANSFORMER') as AutotransformerConfig | undefined
  const ss = find('SOFT_STARTER') as SoftStarterConfig | undefined
  const vfd = find('VFD') as VfdConfig | undefined

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">Method Configuration</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {yd && (
          <div className="space-y-1.5">
            <Label>Y-Δ Transition</Label>
            <Select value={yd.starDeltaTransition} onValueChange={(v) => setMethodConfig('STAR_DELTA', { starDeltaTransition: v as StarDeltaTransition })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="closed">Closed (smoother)</SelectItem>
                <SelectItem value="open">Open (transient)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {at && (
          <div className="space-y-1.5">
            <Label>Autotransformer Tap</Label>
            <Select value={String(at.autotransformerTap)} onValueChange={(v) => setMethodConfig('AUTOTRANSFORMER', { autotransformerTap: Number(v) as AutotransformerTap })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">50%</SelectItem>
                <SelectItem value="0.65">65%</SelectItem>
                <SelectItem value="0.8">80%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {ss && (
          <>
            <div className="space-y-1.5">
              <Label>Soft Starter Ramp (s)</Label>
              <NumericInput value={ss.softStarterRampSec} onChange={(v) => setMethodConfig('SOFT_STARTER', { softStarterRampSec: v })} min={0.5} max={60} step={0.5} />
            </div>
            <div className="space-y-1.5">
              <Label>Initial Voltage (%)</Label>
              <NumericInput value={ss.softStarterInitialVoltagePct} onChange={(v) => setMethodConfig('SOFT_STARTER', { softStarterInitialVoltagePct: v })} min={10} max={80} step={5} />
            </div>
            <div className="space-y-1.5">
              <Label>Current Limit (% FLA)</Label>
              <NumericInput value={ss.softStarterCurrentLimitPctFla} onChange={(v) => setMethodConfig('SOFT_STARTER', { softStarterCurrentLimitPctFla: v })} min={100} max={700} step={10} />
            </div>
          </>
        )}

        {vfd && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Switch
                checked={vfd.vfdHasBypass}
                onCheckedChange={(v) => setMethodConfig('VFD', { vfdHasBypass: v })}
              />
              VFD has bypass mode
            </Label>
          </div>
        )}
      </div>
    </div>
  )
}
