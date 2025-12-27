/**
 * Solar Array Calculator Component
 *
 * Main calculator interface with inputs, results, and warnings
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

'use client'

import { useSolarStore } from '@/stores/useSolarStore'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { SolarInputForm } from './SolarInputForm'
import { SolarResults } from './SolarResults'
import { WarningBanner } from '@/components/shared/WarningBanner'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export function SolarArrayCalculator() {
  const { result, validation, resetInputs } = useSolarStore()

  const standardsUsed = ['NREL PVWatts', 'IEC 61215']

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <CalculationCard
        title="Input Parameters"
        description="Enter your energy requirements and panel specifications"
        standardsUsed={standardsUsed}
        className="p-4 md:p-6"
      >
        <SolarInputForm />
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={resetInputs}
            className="w-full sm:w-auto gap-2 transition-all duration-200 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </CalculationCard>

      {/* Warnings */}
      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <WarningBanner validations={[...validation.errors, ...validation.warnings]} />
      )}

      {/* Results */}
      {result && validation?.isValid && (
        <>
          <SolarResults result={result} />
        </>
      )}
    </div>
  )
}
