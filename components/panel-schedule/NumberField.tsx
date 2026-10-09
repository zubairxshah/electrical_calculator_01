'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NumberFieldProps {
  id: string
  label: string
  unit?: string
  value: number | null
  onChange: (value: number | null) => void
  error?: string
  hint?: string
  step?: number
  /** Allow an empty field (stored as null) */
  nullable?: boolean
  className?: string
}

/** Numeric input with focus/blur local string state, so partial typing never fights the store. */
export default function NumberField({
  id, label, unit, value, onChange, error, hint, step, nullable, className,
}: NumberFieldProps) {
  const [local, setLocal] = useState<string | null>(null)
  const initial = useRef('')
  const display = value !== null && Number.isFinite(value) ? String(Number(value.toFixed(6))) : ''
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <Label htmlFor={id}>
        {label} {unit && <span className="text-muted-foreground font-normal">({unit})</span>}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step ?? 'any'}
        value={local !== null ? local : display}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={error ? 'border-destructive' : undefined}
        onFocus={() => {
          initial.current = display
          setLocal(display)
        }}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== null && local !== initial.current) {
            if (local.trim() === '' && nullable) onChange(null)
            else {
              const parsed = parseFloat(local)
              onChange(Number.isNaN(parsed) ? Number.NaN : parsed)
            }
          }
          setLocal(null)
        }}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
