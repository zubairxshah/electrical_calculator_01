/**
 * Charge Controller Results Component
 *
 * Displays calculation results with controller recommendations
 *
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

'use client'

import { ResultDisplay, type ResultItem } from '@/components/shared/ResultDisplay'
import type { ChargeControllerResult, ControllerRecommendation } from '@/lib/calculations/solar'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ChargeControllerResultsProps {
  result: ChargeControllerResult
}

export function ChargeControllerResults({ result }: ChargeControllerResultsProps) {
  // Format primary results
  const safetyResults: ResultItem[] = [
    {
      label: 'Minimum V_oc Rating',
      value: result.minimumVocRating.toFixed(0),
      unit: 'V',
      isPrimary: true,
      standardReference: 'IEC 62109 (125% safety margin)',
      description: `Array V_oc (${result.inputs.arrayVoc}V) x 1.25`,
    },
    {
      label: 'Minimum I_sc Rating',
      value: result.minimumIscRating.toFixed(1),
      unit: 'A',
      standardReference: '25% safety margin',
      description: `Array I_sc (${result.inputs.arrayIsc}A) x 1.25`,
    },
  ]

  // Add cold weather V_oc if calculated
  if (result.coldWeatherVoc) {
    safetyResults.push({
      label: 'Cold Weather V_oc',
      value: result.coldWeatherVoc.toFixed(1),
      unit: 'V',
      description: `Adjusted for ${result.inputs.minTemperature}°C`,
    })
  }

  const typeResults: ResultItem[] = [
    {
      label: 'Recommended Type',
      value: result.recommendedType,
      unit: '',
      isPrimary: true,
    },
    {
      label: 'MPPT Efficiency Gain',
      value: result.mpptEfficiencyGain.toFixed(0),
      unit: '%',
      description: 'Over PWM controller',
    },
    {
      label: 'Voltage Mismatch',
      value: (result.voltageMismatch * 100).toFixed(0),
      unit: '%',
      description: result.voltageMismatch > 0.2 ? 'High - MPPT recommended' : 'Low - PWM acceptable',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Safety Requirements */}
      <CalculationCard
        title="Controller Safety Requirements"
        description="Minimum ratings based on array specifications with safety margins"
        className="p-4 md:p-6"
      >
        <ResultDisplay results={safetyResults} />
      </CalculationCard>

      {/* Type Recommendation */}
      <CalculationCard
        title="Controller Type Recommendation"
        description={result.explanation}
        className="p-4 md:p-6"
      >
        <ResultDisplay results={typeResults} />
      </CalculationCard>

      {/* Recommended Controllers Table */}
      {result.recommendedControllers.length > 0 && (
        <CalculationCard
          title="Recommended Controllers"
          description="Controllers meeting your requirements, ranked by suitability"
          className="p-4 md:p-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Current</th>
                  <th className="text-left py-2 px-2">Max Voltage</th>
                  <th className="text-left py-2 px-2">Efficiency</th>
                  <th className="text-left py-2 px-2">Rating</th>
                  <th className="text-left py-2 px-2 hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {result.recommendedControllers.slice(0, 6).map((controller, index) => (
                  <ControllerRow key={index} controller={controller} rank={index + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </CalculationCard>
      )}

      {/* Input Summary */}
      <CalculationCard title="Input Summary" className="p-4 md:p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Array V_oc:</span>
            <span className="font-medium">{result.inputs.arrayVoc}V</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Array I_sc:</span>
            <span className="font-medium">{result.inputs.arrayIsc}A</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Battery Voltage:</span>
            <span className="font-medium">{result.inputs.batteryVoltage}V</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Array Power:</span>
            <span className="font-medium">{result.inputs.arrayMaxPower}W</span>
          </div>
          {result.inputs.minTemperature !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Temperature:</span>
              <span className="font-medium">{result.inputs.minTemperature}°C</span>
            </div>
          )}
        </div>
      </CalculationCard>

      {/* Standards Reference */}
      <CalculationCard title="Standards Reference" className="p-4 md:p-6">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Safety Standard:</strong> IEC 62109 - Safety of power converters for use in
            photovoltaic power systems
          </p>
          <p>
            <strong>V_oc Margin:</strong> Controller must be rated for at least 125% of array V_oc
            to handle cold weather voltage increases
          </p>
          <p>
            <strong>I_sc Margin:</strong> Controller current rating should exceed array I_sc by
            20-25% for reliable operation
          </p>
          <p className="text-xs mt-4 italic">
            Note: Always verify controller specifications with manufacturer datasheets. Consider
            local installation codes and environmental conditions.
          </p>
        </div>
      </CalculationCard>
    </div>
  )
}

/**
 * Controller recommendation row component
 */
function ControllerRow({
  controller,
  rank,
}: {
  controller: ControllerRecommendation
  rank: number
}) {
  const ratingStars = '★'.repeat(Math.round(controller.suitabilityScore)) +
    '☆'.repeat(5 - Math.round(controller.suitabilityScore))

  return (
    <tr className={cn('border-b last:border-0', rank === 1 && 'bg-primary/5')}>
      <td className="py-2 px-2">
        <Badge variant={controller.type === 'MPPT' ? 'default' : 'secondary'}>
          {controller.type}
        </Badge>
      </td>
      <td className="py-2 px-2">{controller.currentRating}A</td>
      <td className="py-2 px-2">{controller.maxInputVoltage}V</td>
      <td className="py-2 px-2">{controller.efficiency.toFixed(0)}%</td>
      <td className="py-2 px-2 text-amber-500">{ratingStars}</td>
      <td className="py-2 px-2 text-xs text-muted-foreground hidden md:table-cell">
        {controller.notes}
      </td>
    </tr>
  )
}
