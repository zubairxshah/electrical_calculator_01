/**
 * Editable override input with local string state (decimal-friendly) and an
 * optional in-field suffix (e.g. "%"). Empty = no override (use the default).
 * Shared by the inline Applied-Factors editors.
 */

'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function OverrideCell({
  value,
  placeholder,
  step,
  suffix,
  className,
  onCommit,
}: {
  value: number | undefined
  placeholder: string
  step: string
  suffix?: string
  className?: string
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
    <div className={cn('relative', className)}>
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

/** Strip floating-point noise (e.g. 0.55 * 100 = 55.00000001) for display. */
export function cleanNum(n: number) {
  return parseFloat(n.toFixed(6)).toString()
}
