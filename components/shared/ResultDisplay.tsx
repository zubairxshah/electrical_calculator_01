/**
 * Result Display Component
 *
 * Displays calculation results with:
 * - Formatted values with units
 * - Standard references
 * - Visual hierarchy
 */

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ResultItem {
  label: string
  value: string | number
  unit?: string
  isPrimary?: boolean
  standardReference?: string
  description?: string // Optional human-readable description (e.g., time in hours/minutes format)
}

export interface ResultDisplayProps {
  results: ResultItem[]
  className?: string
}

export function ResultDisplay({ results, className }: ResultDisplayProps) {
  return (
    <Card className={cn('p-6 shadow-sm hover:shadow-md transition-shadow duration-200', className)}>
      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 transition-colors duration-200',
              result.isPrimary && 'border-primary bg-primary/5 -mx-6 px-6 py-4 rounded-lg'
            )}
          >
            <div className="space-y-1">
              <div
                className={cn(
                  'font-medium',
                  result.isPrimary && 'text-lg font-semibold'
                )}
              >
                {result.label}
              </div>
              {result.standardReference && (
                <Badge variant="outline" className="text-xs">
                  {result.standardReference}
                </Badge>
              )}
            </div>
            <div className="text-right space-y-1">
              <div
                className={cn(
                  'font-mono',
                  result.isPrimary ? 'text-2xl md:text-3xl lg:text-4xl font-bold text-primary' : 'text-base md:text-lg'
                )}
              >
                {result.value}
                {result.unit && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {result.unit}
                  </span>
                )}
              </div>
              {result.description && (
                <div className="text-sm text-muted-foreground">
                  {result.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
