/**
 * Charge Controller Tool Component
 *
 * Main calculator interface with inputs, results, and recommendations
 *
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

'use client'

import { useChargeControllerStore } from '@/stores/useChargeControllerStore'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { ChargeControllerInputForm } from './ChargeControllerInputForm'
import { ChargeControllerResults } from './ChargeControllerResults'
import { WarningBanner } from '@/components/shared/WarningBanner'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export function ChargeControllerTool() {
  const { result, validation, resetInputs } = useChargeControllerStore()

  const standardsUsed = ['IEC 62109', 'Manufacturer Guidelines']

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <CalculationCard
        title="Solar Array Specifications"
        description="Enter your solar array electrical specifications"
        standardsUsed={standardsUsed}
        className="p-4 md:p-6"
      >
        <ChargeControllerInputForm />
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
        <ChargeControllerResults result={result} />
      )}
    </div>
  )
}
