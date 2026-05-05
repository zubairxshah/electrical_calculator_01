'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'
import type { CableMaterial, ConduitType } from '@/types/motor-starting'

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

const NEC_SIZES = ['12','10','8','6','4','2','1','1/0','2/0','3/0','4/0','250','300','350','500']
const IEC_SIZES = ['2.5','16','25','35','50','70','95','120','150','185','240']

export default function SourceImpedanceForm() {
  const { currentInput, setUtility, setTransformer, setCable } = useMotorStartingStore()
  const isIec = currentInput.standard === 'IEC'
  const sizes = isIec
    ? Array.from(new Set([...IEC_SIZES, '4', '6', '10', '300']))
    : NEC_SIZES
  const u = currentInput.sourceChain.utility
  const t = currentInput.sourceChain.transformer
  const c = currentInput.sourceChain.cable

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">Source Impedance Chain</h3>

      <div>
        <h4 className="text-sm font-medium mb-2">Utility</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Switch checked={u.isInfiniteBus} onCheckedChange={(v) => setUtility({ isInfiniteBus: v })} />
              Infinite bus
            </Label>
          </div>
          {!u.isInfiniteBus && (
            <>
              <div className="space-y-1.5">
                <Label>Primary Voltage (kV)</Label>
                <NumericInput value={u.primaryVoltage} onChange={(v) => setUtility({ primaryVoltage: v })} min={0.1} step={0.1} />
              </div>
              <div className="space-y-1.5">
                <Label>SC MVA at primary</Label>
                <NumericInput value={u.shortCircuitMva ?? 0} onChange={(v) => setUtility({ shortCircuitMva: v })} min={0} step={1} />
              </div>
              <div className="space-y-1.5">
                <Label>X/R</Label>
                <NumericInput value={u.xOverR} onChange={(v) => setUtility({ xOverR: v })} min={0} step={0.5} />
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Transformer</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Rated kVA</Label>
            <NumericInput value={t.ratedKva} onChange={(v) => setTransformer({ ratedKva: v })} min={1} step={50} />
          </div>
          <div className="space-y-1.5">
            <Label>Primary Voltage (kV)</Label>
            <NumericInput value={t.primaryVoltageKv} onChange={(v) => setTransformer({ primaryVoltageKv: v })} min={0.1} step={0.1} />
          </div>
          <div className="space-y-1.5">
            <Label>Secondary Voltage (V)</Label>
            <NumericInput value={t.secondaryVoltageV} onChange={(v) => setTransformer({ secondaryVoltageV: v })} min={1} step={1} />
          </div>
          <div className="space-y-1.5">
            <Label>%Z</Label>
            <NumericInput value={t.percentZ} onChange={(v) => setTransformer({ percentZ: v })} min={0.5} max={20} step={0.05} />
          </div>
          <div className="space-y-1.5">
            <Label>X/R</Label>
            <NumericInput value={t.xOverR} onChange={(v) => setTransformer({ xOverR: v })} min={0} step={0.5} />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Cable</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Size ({isIec ? 'mm²' : 'AWG/kcmil'})</Label>
            <Select value={c.sizeId} onValueChange={(v) => setCable({ sizeId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sizes.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Material</Label>
            <Select value={c.material} onValueChange={(v) => setCable({ material: v as CableMaterial })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cu">Copper</SelectItem>
                <SelectItem value="Al">Aluminum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Length (m)</Label>
            <NumericInput value={c.lengthMeters} onChange={(v) => setCable({ lengthMeters: v })} min={0} step={1} />
          </div>
          <div className="space-y-1.5">
            <Label>Parallel Runs</Label>
            <NumericInput value={c.parallelRuns} onChange={(v) => setCable({ parallelRuns: v })} min={1} max={10} step={1} />
          </div>
          <div className="space-y-1.5">
            <Label>Conduit</Label>
            <Select value={c.conduitType} onValueChange={(v) => setCable({ conduitType: v as ConduitType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Steel">Steel</SelectItem>
                <SelectItem value="PVC">PVC</SelectItem>
                <SelectItem value="Aluminum">Aluminum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
