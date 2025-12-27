/**
 * Solar Results Component
 *
 * Displays calculation results with primary metrics for solar array sizing
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

'use client'

import { toNumber } from '@/lib/mathConfig'
import { ResultDisplay, type ResultItem } from '@/components/shared/ResultDisplay'
import type { SolarCalculatorResult } from '@/lib/calculations/solar'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { SolarGenerationChart } from '@/components/charts/SolarGenerationChart'

interface SolarResultsProps {
  result: SolarCalculatorResult
}

export function SolarResults({ result }: SolarResultsProps) {
  // Format results for display
  const primaryResults: ResultItem[] = [
    {
      label: 'Required Panels',
      value: result.requiredPanels.toString(),
      unit: 'panels',
      isPrimary: true,
      standardReference: 'NREL PVWatts',
      description: `@ ${result.inputs.panelWattage}W each`,
    },
    {
      label: 'Total Array Power',
      value: toNumber(result.totalArrayPowerKWp).toFixed(2),
      unit: 'kWp',
      description: 'Peak DC power capacity',
    },
    {
      label: 'Required Area',
      value: toNumber(result.arrayAreaM2).toFixed(1),
      unit: 'm²',
      description: `≈ ${(toNumber(result.arrayAreaM2) * 10.764).toFixed(0)} ft²`,
    },
  ]

  const generationResults: ResultItem[] = [
    {
      label: 'Est. Daily Generation',
      value: toNumber(result.estimatedDailyGenKWh).toFixed(2),
      unit: 'kWh/day',
      standardReference: 'Based on PSH and PR',
    },
    {
      label: 'Est. Annual Generation',
      value: toNumber(result.estimatedAnnualGenKWh).toFixed(0),
      unit: 'kWh/year',
      description: `≈ ${(toNumber(result.estimatedAnnualGenKWh) / 12).toFixed(0)} kWh/month`,
    },
    {
      label: 'Generation Surplus',
      value: ((toNumber(result.estimatedDailyGenKWh) / result.inputs.dailyEnergyKWh - 1) * 100).toFixed(1),
      unit: '%',
      description: 'Over target requirement',
    },
  ]

  // Generate monthly generation data for chart
  const monthlyData = generateMonthlyData(
    toNumber(result.estimatedAnnualGenKWh),
    result.inputs.peakSunHours
  )

  return (
    <div className="space-y-4">
      {/* Primary Results */}
      <CalculationCard
        title="Array Sizing Results"
        description="Required panels and system specifications"
        className="p-4 md:p-6"
      >
        <ResultDisplay results={primaryResults} />
      </CalculationCard>

      {/* Generation Estimates */}
      <CalculationCard
        title="Energy Generation Estimates"
        description="Expected power output based on location and system performance"
        className="p-4 md:p-6"
      >
        <ResultDisplay results={generationResults} />
      </CalculationCard>

      {/* Monthly Generation Chart */}
      <CalculationCard
        title="Monthly Generation Profile"
        description="Estimated monthly energy production throughout the year"
        className="p-4 md:p-6"
      >
        <div className="h-64">
          <SolarGenerationChart data={monthlyData} />
        </div>
      </CalculationCard>

      {/* System Information */}
      <CalculationCard title="Input Parameters" className="p-4 md:p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily Energy Target:</span>
            <span className="font-medium">{result.inputs.dailyEnergyKWh} kWh/day</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Peak Sun Hours:</span>
            <span className="font-medium">{result.inputs.peakSunHours} hours/day</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Panel Rating:</span>
            <span className="font-medium">{result.inputs.panelWattage}W</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Panel Efficiency:</span>
            <span className="font-medium">{(result.inputs.panelEfficiency * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Performance Ratio:</span>
            <span className="font-medium">{(result.inputs.performanceRatio * 100).toFixed(0)}%</span>
          </div>
        </div>
      </CalculationCard>

      {/* Standards Reference */}
      <CalculationCard title="Standards Reference" className="p-4 md:p-6">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Calculation Method:</strong> NREL PVWatts methodology
          </p>
          <p>
            <strong>Formula:</strong> Panels = Daily_kWh / (Panel_kW × PSH × PR)
          </p>
          <p>
            <strong>Standards Used:</strong> {result.standardsUsed.join(', ')}
          </p>
          <p className="text-xs mt-4 italic">
            Note: Actual generation may vary based on local conditions, shading, orientation,
            and seasonal variations. Consult a certified solar installer for accurate system design.
          </p>
        </div>
      </CalculationCard>
    </div>
  )
}

/**
 * Generate monthly generation profile based on annual estimate
 * Applies seasonal variation typical for mid-latitude locations
 */
function generateMonthlyData(annualGenKWh: number, psh: number) {
  // Seasonal variation factors (normalized to sum to 12)
  // Higher in summer, lower in winter
  const seasonalFactors = [
    0.65, // Jan
    0.75, // Feb
    0.95, // Mar
    1.10, // Apr
    1.20, // May
    1.25, // Jun
    1.25, // Jul
    1.15, // Aug
    1.00, // Sep
    0.85, // Oct
    0.70, // Nov
    0.65, // Dec
  ]

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyAvg = annualGenKWh / 12

  return months.map((month, i) => ({
    month,
    generation: Math.round(monthlyAvg * seasonalFactors[i]),
  }))
}
