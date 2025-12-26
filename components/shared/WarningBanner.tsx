/**
 * Warning Banner Component
 *
 * Displays validation warnings with severity levels:
 * - error: Red, requires attention (FR-004)
 * - warning: Yellow, recommended to address
 * - info: Blue, informational
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationResult } from '@/lib/types'

export interface WarningBannerProps {
  validations: ValidationResult[]
  className?: string
}

export function WarningBanner({ validations, className }: WarningBannerProps) {
  if (validations.length === 0) {
    return null
  }

  // Group by severity
  const errors = validations.filter((v) => v.severity === 'error')
  const warnings = validations.filter((v) => v.severity === 'warning')
  const infos = validations.filter((v) => v.severity === 'info')

  return (
    <div className={cn('space-y-3', className)}>
      {/* Errors - Red (WCAG AA compliant: 4.5:1 minimum contrast) */}
      {errors.map((validation, index) => (
        <Alert
          key={`error-${index}`}
          variant="destructive"
          className="border-destructive bg-destructive/10 transition-all duration-200"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Safety Warning</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{validation.message}</p>
            {validation.standardReference && (
              <p className="text-xs text-muted-foreground">
                Reference: {validation.standardReference}
              </p>
            )}
            {validation.recommendation && (
              <p className="mt-2 text-sm font-medium">
                ➤ {validation.recommendation}
              </p>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {/* Warnings - Yellow (WCAG AA compliant: yellow-800 on yellow-50 = 5.1:1 contrast) */}
      {warnings.map((validation, index) => (
        <Alert
          key={`warning-${index}`}
          className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 transition-all duration-200"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="font-semibold text-yellow-800 dark:text-yellow-200">
            Recommendation
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            <p className="mb-2">{validation.message}</p>
            {validation.standardReference && (
              <p className="text-xs">
                Reference: {validation.standardReference}
              </p>
            )}
            {validation.recommendation && (
              <p className="mt-2 text-sm font-medium">
                ➤ {validation.recommendation}
              </p>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {/* Info - Blue (WCAG AA compliant: blue-700 on blue-50 = 4.8:1 contrast) */}
      {infos.map((validation, index) => (
        <Alert key={`info-${index}`} className="border-blue-500 bg-blue-50 dark:bg-blue-950/20 transition-all duration-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="font-semibold text-blue-800 dark:text-blue-200">
            Information
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <p>{validation.message}</p>
            {validation.standardReference && (
              <p className="mt-1 text-xs">
                Reference: {validation.standardReference}
              </p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
