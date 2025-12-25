/**
 * Input Field Component
 *
 * Enhanced input with:
 * - Real-time validation feedback
 * - Unit display
 * - Error/warning messages
 */

'use client'

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
  validation,
  required,
  disabled,
  className,
}: InputFieldProps) {
  const hasError = validation && validation.severity === 'error'
  const hasWarning = validation && validation.severity === 'warning'

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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
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
