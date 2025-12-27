/**
 * Battery Comparison Table Component
 *
 * Displays battery types in a comparison table with key metrics
 *
 * @see specs/001-electromate-engineering-app/spec.md#US6
 */

'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Info, Star, ThermometerSun, Clock, Zap, Battery, Wrench } from 'lucide-react'
import type { BatteryRecommendation, BatteryTypeSpec } from '@/lib/standards/batteryTypes'

interface BatteryComparisonTableProps {
  recommendations: BatteryRecommendation[]
  showScores: boolean
  onSelectBattery: (battery: BatteryTypeSpec) => void
  selectedBatteryId?: string
}

export function BatteryComparisonTable({
  recommendations,
  showScores,
  onSelectBattery,
  selectedBatteryId,
}: BatteryComparisonTableProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Lead-Acid':
        return 'bg-slate-500'
      case 'Lithium-Ion':
        return 'bg-blue-500'
      case 'Nickel-Based':
        return 'bg-green-500'
      case 'Flow':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getMaintenanceColor = (level: string) => {
    switch (level) {
      case 'None':
        return 'text-green-600'
      case 'Low':
        return 'text-blue-600'
      case 'Medium':
        return 'text-amber-600'
      case 'High':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getSafetyIcon = (risk: string) => {
    switch (risk) {
      case 'None':
      case 'Very Low':
        return '🟢'
      case 'Low':
        return '🟡'
      case 'Medium':
        return '🟠'
      case 'High':
        return '🔴'
      default:
        return '⚪'
    }
  }

  const renderScoreStars = (score: number) => {
    const normalizedScore = Math.min(5, Math.max(1, Math.round(score / 20)))
    return (
      <span className="text-amber-500">
        {'★'.repeat(normalizedScore)}
        {'☆'.repeat(5 - normalizedScore)}
      </span>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {showScores && (
              <th className="text-left py-3 px-2 font-medium">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      Score
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Suitability score based on your requirements</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
            )}
            <th className="text-left py-3 px-2 font-medium">
              <div className="flex items-center gap-1">
                <Battery className="h-4 w-4" />
                Type
              </div>
            </th>
            <th className="text-left py-3 px-2 font-medium">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Lifespan
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Design life (years) / Cycle life at rated DoD</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </th>
            <th className="text-left py-3 px-2 font-medium hidden md:table-cell">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <ThermometerSun className="h-4 w-4" />
                    Temp Range
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Operating temperature range (°C)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </th>
            <th className="text-left py-3 px-2 font-medium">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    DoD
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Recommended / Maximum Depth of Discharge (%)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </th>
            <th className="text-left py-3 px-2 font-medium hidden lg:table-cell">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Efficiency
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Round-trip efficiency (%)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </th>
            <th className="text-left py-3 px-2 font-medium hidden lg:table-cell">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    Maint.
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maintenance requirements</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </th>
            <th className="text-left py-3 px-2 font-medium hidden xl:table-cell">
              Cost
            </th>
            <th className="text-left py-3 px-2 font-medium hidden xl:table-cell">
              Safety
            </th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map((rec, index) => (
            <tr
              key={rec.battery.id}
              className={cn(
                'border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50',
                selectedBatteryId === rec.battery.id && 'bg-primary/10',
                showScores && index === 0 && 'bg-green-50 dark:bg-green-950/20'
              )}
              onClick={() => onSelectBattery(rec.battery)}
            >
              {showScores && (
                <td className="py-3 px-2">
                  <div className="flex flex-col gap-1">
                    {renderScoreStars(rec.score)}
                    {index === 0 && (
                      <Badge variant="default" className="text-xs w-fit">
                        Best Match
                      </Badge>
                    )}
                  </div>
                </td>
              )}
              <td className="py-3 px-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{rec.battery.name}</span>
                  <Badge
                    variant="secondary"
                    className={cn('text-xs w-fit text-white', getCategoryColor(rec.battery.category))}
                  >
                    {rec.battery.category}
                  </Badge>
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex flex-col gap-0.5">
                  <span>{rec.battery.lifespan.designLifeYears.typical} years</span>
                  <span className="text-xs text-muted-foreground">
                    {rec.battery.lifespan.cycleLife.typical.toLocaleString()} cycles
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 hidden md:table-cell">
                <span>
                  {rec.battery.temperature.operating.min}°C to{' '}
                  {rec.battery.temperature.operating.max}°C
                </span>
              </td>
              <td className="py-3 px-2">
                <div className="flex flex-col gap-0.5">
                  <span>{rec.battery.depthOfDischarge.recommended}%</span>
                  <span className="text-xs text-muted-foreground">
                    max {rec.battery.depthOfDischarge.maximum}%
                  </span>
                </div>
              </td>
              <td className="py-3 px-2 hidden lg:table-cell">
                {rec.battery.efficiency.roundTrip.typical}%
              </td>
              <td className={cn('py-3 px-2 hidden lg:table-cell', getMaintenanceColor(rec.battery.maintenance.level))}>
                {rec.battery.maintenance.level}
              </td>
              <td className="py-3 px-2 hidden xl:table-cell">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex flex-col gap-0.5">
                        <span>Init: {rec.battery.cost.initialCostIndex}/10</span>
                        <span className="text-xs text-muted-foreground">
                          Life: {rec.battery.cost.lifecycleCostIndex}/10
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Initial cost index / Lifecycle cost index</p>
                      <p className="text-xs">Lower is better. Trend: {rec.battery.cost.trend}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </td>
              <td className="py-3 px-2 hidden xl:table-cell">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span>{getSafetyIcon(rec.battery.safety.fireRisk)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fire risk: {rec.battery.safety.fireRisk}</p>
                      <p>Thermal runaway: {rec.battery.safety.thermalRunawayRisk}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {recommendations.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No battery types match your criteria. Try adjusting the filters.
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Click on a row to view detailed specifications
      </p>
    </div>
  )
}
