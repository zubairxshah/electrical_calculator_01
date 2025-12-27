/**
 * Battery Detail Card Component
 *
 * Shows detailed specifications for a selected battery type
 *
 * @see specs/001-electromate-engineering-app/spec.md#US6
 */

'use client'

import { CalculationCard } from '@/components/shared/CalculationCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'

interface BatteryDetailCardProps {
  battery: BatteryTypeSpec
  onClose: () => void
}

export function BatteryDetailCard({ battery, onClose }: BatteryDetailCardProps) {
  return (
    <CalculationCard
      title={battery.fullName}
      description={battery.name}
      className="p-4 md:p-6 relative"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {/* Lifespan Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Lifespan
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Design Life:</span>
              <span className="font-medium">
                {battery.lifespan.designLifeYears.min}-{battery.lifespan.designLifeYears.max} years
              </span>
            </div>
            <div className="flex justify-between">
              <span>Typical:</span>
              <span className="font-medium">{battery.lifespan.designLifeYears.typical} years</span>
            </div>
            <div className="flex justify-between">
              <span>Cycle Life:</span>
              <span className="font-medium">
                {battery.lifespan.cycleLife.typical.toLocaleString()} cycles
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>At DoD:</span>
              <span>{battery.lifespan.cycleLifeDoD}%</span>
            </div>
          </div>
        </div>

        {/* Temperature Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Temperature
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Optimal:</span>
              <span className="font-medium">
                {battery.temperature.optimal.min}°C to {battery.temperature.optimal.max}°C
              </span>
            </div>
            <div className="flex justify-between">
              <span>Operating:</span>
              <span className="font-medium">
                {battery.temperature.operating.min}°C to {battery.temperature.operating.max}°C
              </span>
            </div>
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className="font-medium">
                {battery.temperature.storage.min}°C to {battery.temperature.storage.max}°C
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Temp Coeff:</span>
              <span>{battery.temperature.tempCoefficient}%/°C</span>
            </div>
          </div>
        </div>

        {/* Depth of Discharge Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Depth of Discharge
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Recommended:</span>
              <span className="font-medium">{battery.depthOfDischarge.recommended}%</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum:</span>
              <span className="font-medium">{battery.depthOfDischarge.maximum}%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cycle Impact:</span>
              <span>{battery.depthOfDischarge.cycleImpact} cycles/10% DoD</span>
            </div>
          </div>
        </div>

        {/* Efficiency Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Efficiency
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Round-Trip:</span>
              <span className="font-medium">{battery.efficiency.roundTrip.typical}%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Range:</span>
              <span>
                {battery.efficiency.roundTrip.min}-{battery.efficiency.roundTrip.max}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Charge Efficiency:</span>
              <span className="font-medium">{battery.efficiency.chargeEfficiency}%</span>
            </div>
            <div className="flex justify-between">
              <span>Self-Discharge:</span>
              <span className="font-medium">{battery.efficiency.selfDischarge}%/month</span>
            </div>
          </div>
        </div>

        {/* Maintenance Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Maintenance
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Level:</span>
              <Badge
                variant={battery.maintenance.level === 'None' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {battery.maintenance.level}
              </Badge>
            </div>
            <p className="text-muted-foreground">{battery.maintenance.description}</p>
            {battery.maintenance.intervalMonths && (
              <div className="flex justify-between">
                <span>Interval:</span>
                <span>{battery.maintenance.intervalMonths} months</span>
              </div>
            )}
            <div className="flex gap-2 flex-wrap mt-2">
              {battery.maintenance.requiresVentilation && (
                <Badge variant="outline" className="text-xs">
                  Requires Ventilation
                </Badge>
              )}
              {battery.maintenance.requiresTempControl && (
                <Badge variant="outline" className="text-xs">
                  Requires Temp Control
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Cost Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Cost
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Initial Cost:</span>
              <span className="font-medium">{battery.cost.initialCostIndex}/10</span>
            </div>
            <div className="flex justify-between">
              <span>Lifecycle Cost:</span>
              <span className="font-medium">{battery.cost.lifecycleCostIndex}/10</span>
            </div>
            <div className="flex justify-between">
              <span>Trend:</span>
              <Badge
                variant={battery.cost.trend === 'Decreasing' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {battery.cost.trend}
              </Badge>
            </div>
          </div>
        </div>

        {/* Safety Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Safety
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Thermal Runaway:</span>
              <Badge
                variant={
                  battery.safety.thermalRunawayRisk === 'None' ||
                  battery.safety.thermalRunawayRisk === 'Low'
                    ? 'default'
                    : 'destructive'
                }
                className="text-xs"
              >
                {battery.safety.thermalRunawayRisk}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Fire Risk:</span>
              <Badge
                variant={
                  battery.safety.fireRisk === 'Very Low' || battery.safety.fireRisk === 'Low'
                    ? 'default'
                    : 'destructive'
                }
                className="text-xs"
              >
                {battery.safety.fireRisk}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>H₂ Generation:</span>
              <span>{battery.safety.hydrogenGeneration ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport Class:</span>
              <span>{battery.safety.transportClass}</span>
            </div>
          </div>
        </div>

        {/* Standards Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Standards
          </h4>
          <div className="flex flex-wrap gap-1">
            {battery.standardReferences.map((ref) => (
              <Badge key={ref} variant="outline" className="text-xs">
                {ref}
              </Badge>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-3 md:col-span-2 lg:col-span-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Key Characteristics
          </h4>
          <ul className="space-y-2">
            {battery.notes.map((note, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CalculationCard>
  )
}
