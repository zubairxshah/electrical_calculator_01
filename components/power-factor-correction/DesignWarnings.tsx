'use client'

import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { PFCDesignWarning } from '@/types/power-factor-correction'

const STYLE = {
  error: { box: 'bg-destructive/10 border-destructive/50 text-destructive', Icon: AlertCircle, label: 'Error' },
  warning: { box: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-200', Icon: AlertTriangle, label: 'Warning' },
  info: { box: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200', Icon: Info, label: 'Note' },
} as const

export default function DesignWarnings({ warnings }: { warnings: PFCDesignWarning[] }) {
  if (warnings.length === 0) return null
  return (
    <ul className="space-y-2" aria-label="Design warnings">
      {warnings.map((w, i) => {
        const { box, Icon, label } = STYLE[w.severity]
        return (
          <li key={`${w.code}-${w.stepIndex ?? ''}-${i}`} className={`flex items-start gap-2 rounded-md border p-2 text-sm ${box}`}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">{label}: </span>
              {w.message}
              {w.reference && <span className="opacity-75"> ({w.reference})</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
