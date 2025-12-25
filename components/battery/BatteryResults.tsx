/**
 * Battery Results Component
 *
 * Displays calculation results with primary metrics
 */

'use client'

import { toNumber, format } from '@/lib/mathConfig'
import { ResultDisplay, type ResultItem } from '@/components/shared/ResultDisplay'
import type { BatteryCalculatorResult } from '@/lib/types'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { formatTimeDisplay } from '@/lib/utils/formatTime'

interface BatteryResultsProps {
  result: BatteryCalculatorResult
}

export function BatteryResults({ result }: BatteryResultsProps) {
  // Format backup time in both decimal and human-readable formats
  const backupTimeDecimal = toNumber(result.backupTimeHours)
  const timeFormat = formatTimeDisplay(backupTimeDecimal)

  // Format results for display
  const resultItems: ResultItem[] = [
    {
      label: 'Backup Time',
      value: backupTimeDecimal.toFixed(2),
      unit: 'hours',
      isPrimary: true,
      standardReference: 'IEEE 485-2020',
      description: `(${timeFormat.formatted})`,
    },
    {
      label: 'Effective Capacity',
      value: toNumber(result.effectiveCapacityAh).toFixed(1),
      unit: 'Ah',
      standardReference: 'After aging factor',
    },
    {
      label: 'Discharge Rate',
      value: `C/${(1 / toNumber(result.dischargeRate)).toFixed(1)}`,
      unit: '',
      standardReference: toNumber(result.dischargeRate) > 0.2 ? 'IEEE 485 Section 5.3 - High Rate' : 'IEEE 485 Section 5.3',
    },
  ]

  // Calculate additional metrics
  const energyStoredWh = toNumber(result.effectiveCapacityAh) * result.inputs.voltage
  const usableEnergyWh = energyStoredWh * result.inputs.efficiency

  const additionalMetrics: ResultItem[] = [
    {
      label: 'Energy Stored (After Aging)',
      value: energyStoredWh.toFixed(0),
      unit: 'Wh',
    },
    {
      label: 'Usable Energy (After Efficiency)',
      value: usableEnergyWh.toFixed(0),
      unit: 'Wh',
    },
  ]

  return (
    <div className="space-y-4">
      <CalculationCard
        title="Calculation Results"
        description="Battery backup time and discharge characteristics"
        className="p-4 md:p-6"
      >
        <ResultDisplay results={resultItems} />
      </CalculationCard>

      <CalculationCard title="Additional Metrics" className="p-4 md:p-6">
        <ResultDisplay results={additionalMetrics} />
      </CalculationCard>

      {/* System Information */}
      <CalculationCard title="System Information" className="p-4 md:p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Battery Chemistry:</span>
            <span className="font-medium">{result.inputs.chemistry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">System Voltage:</span>
            <span className="font-medium">{result.inputs.voltage}V DC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rated Capacity:</span>
            <span className="font-medium">{result.inputs.ampHours}Ah</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Load Power:</span>
            <span className="font-medium">{result.inputs.loadWatts}W</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">System Efficiency:</span>
            <span className="font-medium">{(result.inputs.efficiency * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aging Factor:</span>
            <span className="font-medium">{(result.inputs.agingFactor * 100).toFixed(0)}%</span>
          </div>
        </div>
      </CalculationCard>
    </div>
  )
}
