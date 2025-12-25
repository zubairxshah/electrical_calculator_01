/**
 * Input Field Component
 *
 * Enhanced input with:
 * - Real-time validation feedback
 * - Unit display
 * - Error/warning messages
 * - Decimal input support
 */

'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { FieldValidation } from '@/lib/types'

export interface InputFieldProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number'
  unit?: string
  placeholder?: string
  step?: string
  validation?: FieldValidation
  required?: boolean
  disabled?: boolean
  className?: string
}

export function InputField({
  label,
  value,
  onChange,
  type = 'number',
  unit,
  placeholder,
  step,
  validation,
  required,
  disabled,
  className,
}: InputFieldProps) {
  const hasError = validation && validation.severity === 'error'
  const hasWarning = validation && validation.severity === 'warning'

  // Local state to handle decimal input (e.g., "0." while typing "0.9")
  const [localValue, setLocalValue] = useState<string>(String(value))

  // Sync local state when external value changes (but not while user is typing)
  useEffect(() => {
    const externalStr = String(value)
    // Don't override if user is in the middle of typing:
    // - partial decimal (ends with .)
    // - empty field (user clearing to retype)
    // - just "0" (user about to type 0.x)
    const isTyping = localValue === '' || localValue === '0' || localValue.endsWith('.')
    if (!isTyping) {
      setLocalValue(externalStr)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Only propagate to parent when we have a valid complete number
    // Don't propagate incomplete input that would fail validation:
    // - empty string
    // - ends with decimal point (user is typing)
    // - just "0" followed by nothing (user might be typing "0.x")
    if (newValue === '' || newValue.endsWith('.')) {
      return
    }

    // Check if it looks like user is starting to type a decimal (e.g., "0" before "0.8")
    if (newValue === '0') {
      return
    }

    const num = parseFloat(newValue)
    if (!isNaN(num)) {
      onChange(newValue)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          type="text"
          inputMode={type === 'number' ? 'decimal' : 'text'}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          step={step}
          disabled={disabled}
          className={cn(
            'h-12', // Mobile-optimized height (48px) for better touch targets
            hasError && 'border-destructive focus-visible:ring-destructive',
            hasWarning && 'border-yellow-500 focus-visible:ring-yellow-500'
          )}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {validation && (
        <div
          className={cn(
            'text-sm',
            hasError && 'text-destructive',
            hasWarning && 'text-yellow-600',
            validation.severity === 'info' && 'text-muted-foreground'
          )}
        >
          {validation.message}
          {validation.recommendation && (
            <div className="mt-1 text-xs italic">
              Recommendation: {validation.recommendation}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
