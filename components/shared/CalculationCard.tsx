/**
 * Calculation Card Component
 *
 * Wrapper component for calculator UI with consistent styling
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface CalculationCardProps {
  title: string
  description?: string
  standardsUsed?: string[]
  children: React.ReactNode
  className?: string
}

export function CalculationCard({
  title,
  description,
  standardsUsed,
  children,
  className,
}: CalculationCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {standardsUsed && standardsUsed.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {standardsUsed.map((standard) => (
                <Badge key={standard} variant="outline" className="text-xs">
                  {standard}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
