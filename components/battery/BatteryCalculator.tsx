/**
 * Battery Calculator Component
 *
 * Main calculator interface with inputs, results, and warnings
 */

'use client'

import { useBatteryStore } from '@/stores/useBatteryStore'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { BatteryInputForm } from './BatteryInputForm'
import { BatteryResults } from './BatteryResults'
import { WarningBanner } from '@/components/shared/WarningBanner'
import { PDFDownloadButton } from '@/components/shared/PDFDownloadButton'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export function BatteryCalculator() {
  const { result, validation, resetInputs } = useBatteryStore()

  const standardsUsed = ['IEEE 485-2020', 'IEC 60038']

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <CalculationCard
        title="Input Parameters"
        description="Enter your battery system specifications"
        standardsUsed={standardsUsed}
        className="p-4 md:p-6"
      >
        <BatteryInputForm />
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
          <BatteryResults result={result} />

          {/* PDF Export - Temporarily disabled for testing */}
          {/* TODO: Map BatteryCalculatorResult to CalculationSession format */}
          {/* <div className="flex justify-end">
            <PDFDownloadButton
              calculation={result}
              standards="IEC"
              filename={`battery-calculation-${Date.now()}.pdf`}
            />
          </div> */}
        </>
      )}
    </div>
  )
}
