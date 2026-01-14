/**
 * Warning Banner Component
 *
 * Consolidates validation messages by severity and presents them as grouped lists
 * with improved spacing and clearer visual hierarchy.
 */

import { Alert, AlertDescription, AlertTitle, IconShell } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
    <div className={cn('space-y-4', className)}>
      {/* Errors - grouped */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="animate-in fade-in">
          <IconShell>
            <AlertCircle className="h-5 w-5" />
          </IconShell>
          <div>
            <div className="flex items-center gap-3">
              <AlertTitle>Safety Warning</AlertTitle>
              <Badge variant="destructive" className="text-xs">{errors.length} issue{errors.length>1?'s':''}</Badge>
            </div>
            <AlertDescription>
              <ul className="mt-2 space-y-2">
                {errors.map((err, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{err.field}:</span> {err.message}
                    {err.standardReference && (
                      <div className="text-xs text-muted-foreground">Reference: {err.standardReference}</div>
                    )}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Warnings - grouped */}
      {warnings.length > 0 && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <IconShell>
            <AlertTriangle className="h-5 w-5 text-yellow-700" />
          </IconShell>
          <div>
            <div className="flex items-center gap-3">
              <AlertTitle className="text-yellow-800">Recommendation{warnings.length>1?'s':''}</AlertTitle>
              <Badge className="text-xs" variant="outline">{warnings.length}</Badge>
            </div>
            <AlertDescription className="text-yellow-700 mt-1">
              <ul className="mt-2 space-y-1">
                {warnings.map((w, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{w.field}:</span> {w.message}
                    {w.recommendation && <div className="text-xs text-muted-foreground">➤ {w.recommendation}</div>}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Infos - grouped */}
      {infos.length > 0 && (
        <Alert className="border-blue-300 bg-blue-50">
          <IconShell>
            <Info className="h-5 w-5 text-blue-700" />
          </IconShell>
          <div>
            <div className="flex items-center gap-3">
              <AlertTitle className="text-blue-800">Information</AlertTitle>
              <Badge className="text-xs" variant="secondary">{infos.length}</Badge>
            </div>
            <AlertDescription className="text-blue-700 mt-1">
              <ul className="mt-2 space-y-1">
                {infos.map((info, i) => (
                  <li key={i} className="text-sm">{info.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  )
}
