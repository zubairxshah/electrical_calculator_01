/**
 * Battery Calculator — dual-mode, design-system-aligned layout with a sticky
 * results panel on desktop and PDF export (US1, US2, US5).
 */

'use client'

import { useState } from 'react'
import { useBatteryStore } from '@/stores/useBatteryStore'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { WarningBanner } from '@/components/shared/WarningBanner'
import { BatteryModeSwitch } from './BatteryModeSwitch'
import { BatteryInputForm } from './BatteryInputForm'
import { BatteryResults } from './BatteryResults'
import { Button } from '@/components/ui/button'
import { RotateCcw, Download, Loader2 } from 'lucide-react'
import { downloadBatteryPDF } from '@/lib/pdfGenerator.battery'

export function BatteryCalculator() {
  const { inputs, result, validation, resetInputs, setMode } = useBatteryStore()
  const [exporting, setExporting] = useState(false)

  const standardsUsed = ['IEEE 485-2020', 'IEC 60896 / 62619']
  const hasResult = result && validation?.isValid

  const handleExport = () => {
    if (!result) return
    setExporting(true)
    try {
      downloadBatteryPDF(result)
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <div className="space-y-6">
        <CalculationCard
          title="Battery Sizing"
          description="Standards-based sizing — choose what to solve for"
          standardsUsed={standardsUsed}
          className="p-4 md:p-6"
        >
          <div className="mb-4">
            <BatteryModeSwitch mode={inputs.mode} onChange={setMode} />
          </div>

          <BatteryInputForm />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={resetInputs}
              className="w-full gap-2 transition-all active:scale-95 sm:w-auto"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </Button>
            <Button
              onClick={handleExport}
              disabled={!hasResult || exporting}
              className="w-full gap-2 sm:w-auto"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export PDF
            </Button>
          </div>
        </CalculationCard>

        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <WarningBanner validations={[...validation.errors, ...validation.warnings]} />
        )}
      </div>

      {/* Results (sticky on desktop) */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        {hasResult ? (
          <BatteryResults result={result} />
        ) : (
          <CalculationCard title="Result" className="p-4 md:p-6">
            <p className="py-8 text-center text-sm text-muted-foreground">
              Enter your parameters to see the {inputs.mode === 'sizing' ? 'required capacity' : 'backup time'}.
            </p>
          </CalculationCard>
        )}
      </div>
    </div>
  )
}
