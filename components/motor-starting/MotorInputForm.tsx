'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'
import { hpToKw, kwToHp } from '@/lib/calculations/motor-starting/unitConversions'
import type { CodeLetter, MotorDesignClass, PowerUnit } from '@/types/motor-starting'

function NumericInput({
  id, value, onChange, min, max, step,
}: {
  id?: string; value: number | undefined; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  const [local, setLocal] = useState<string | null>(null)
  return (
    <Input
      id={id}
      type="number"
      min={min} max={max} step={step}
      value={local !== null ? local : value ?? ''}
      onFocus={() => setLocal(value === undefined || value === 0 ? '' : String(value))}
      onBlur={() => {
        const p = parseFloat(local ?? '')
        if (!isNaN(p)) onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, p)))
        setLocal(null)
      }}
      onChange={(e) => (local !== null ? setLocal(e.target.value) : onChange(Number(e.target.value)))}
    />
  )
}

const NEMA_LETTERS: CodeLetter[] = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','U','V']

export default function MotorInputForm() {
  const { currentInput, setMotor } = useMotorStartingStore()
  const motor = currentInput.motor
  const isIec = currentInput.standard === 'IEC'

  const handlePowerUnitChange = (u: PowerUnit) => {
    if (u === motor.powerUnit) return
    const newRated = u === 'kW' ? hpToKw(motor.ratedPower) : kwToHp(motor.ratedPower)
    setMotor({ powerUnit: u, ratedPower: Number(newRated.toFixed(2)) })
  }

  const designOptions = isIec
    ? (['N', 'H'] as const)
    : (['A', 'B', 'C', 'D'] as const)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-base">Motor Nameplate</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ratedPower">Rated Power ({motor.powerUnit})</Label>
          <div className="flex gap-2">
            <NumericInput id="ratedPower" value={motor.ratedPower} onChange={(v) => setMotor({ ratedPower: v })} min={0.1} step={1} />
            <Select value={motor.powerUnit} onValueChange={(v) => handlePowerUnitChange(v as PowerUnit)}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HP">HP</SelectItem>
                <SelectItem value="kW">kW</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ratedVoltage">Rated Voltage (V)</Label>
          <NumericInput id="ratedVoltage" value={motor.ratedVoltage} onChange={(v) => setMotor({ ratedVoltage: v })} min={1} step={1} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ratedCurrent">Full-Load Amps (A)</Label>
          <NumericInput id="ratedCurrent" value={motor.ratedCurrent} onChange={(v) => setMotor({ ratedCurrent: v })} min={0.1} step={0.1} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="poles">Poles</Label>
          <Select value={String(motor.poles)} onValueChange={(v) => setMotor({ poles: Number(v) })}>
            <SelectTrigger id="poles"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2,4,6,8,10,12].map((p) => (<SelectItem key={p} value={String(p)}>{p}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="efficiency">Efficiency (0–1)</Label>
          <NumericInput id="efficiency" value={motor.efficiency} onChange={(v) => setMotor({ efficiency: v })} min={0.01} max={1} step={0.01} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="powerFactor">Power Factor (0–1)</Label>
          <NumericInput id="powerFactor" value={motor.powerFactor} onChange={(v) => setMotor({ powerFactor: v })} min={0.01} max={1} step={0.01} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="serviceFactor">Service Factor</Label>
          <NumericInput id="serviceFactor" value={motor.serviceFactor} onChange={(v) => setMotor({ serviceFactor: v })} min={1} max={2} step={0.05} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="designClass">Design Class ({isIec ? 'IEC' : 'NEMA'})</Label>
          <Select value={motor.designClass} onValueChange={(v) => setMotor({ designClass: v as MotorDesignClass })}>
            <SelectTrigger id="designClass"><SelectValue /></SelectTrigger>
            <SelectContent>
              {designOptions.map((d) => (<SelectItem key={d} value={d}>{`Design ${d}`}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {!isIec && (
          <div className="space-y-1.5">
            <Label htmlFor="codeLetter">NEMA Code Letter</Label>
            <Select value={motor.codeLetter ?? 'G'} onValueChange={(v) => setMotor({ codeLetter: v as CodeLetter })}>
              <SelectTrigger id="codeLetter"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NEMA_LETTERS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="lockedRotorAmps">LRA Override (A, optional)</Label>
          <NumericInput id="lockedRotorAmps" value={motor.lockedRotorAmps} onChange={(v) => setMotor({ lockedRotorAmps: v })} min={0} step={1} />
        </div>
      </div>
    </div>
  )
}
