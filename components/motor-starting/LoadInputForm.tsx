'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'
import type { InertiaUnit, TorqueProfile } from '@/types/motor-starting'

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

export default function LoadInputForm() {
  const { currentInput, setLoad } = useMotorStartingStore()
  const load = currentInput.load
  const isIec = currentInput.standard === 'IEC'

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">Connected Load</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="torqueProfile">Torque Profile</Label>
          <Select value={load.torqueProfile} onValueChange={(v) => setLoad({ torqueProfile: v as TorqueProfile })}>
            <SelectTrigger id="torqueProfile"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="constant">Constant (compressor, conveyor)</SelectItem>
              <SelectItem value="quadratic_fan_pump">Quadratic (fan/pump)</SelectItem>
              <SelectItem value="linear">Linear</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="breakawayTorque">Break-away Torque (× T_rated)</Label>
          <NumericInput id="breakawayTorque" value={load.breakawayTorquePerRated} onChange={(v) => setLoad({ breakawayTorquePerRated: v })} min={0} max={2} step={0.05} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inertia">Inertia ({isIec ? 'kg·m²' : 'lb·ft²'})</Label>
          <div className="flex gap-2">
            <NumericInput id="inertia" value={load.inertia} onChange={(v) => setLoad({ inertia: v })} min={0} step={0.5} />
            <Select value={load.inertiaUnit} onValueChange={(v) => setLoad({ inertiaUnit: v as InertiaUnit })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lb_ft2">lb·ft²</SelectItem>
                <SelectItem value="kg_m2">kg·m²</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
