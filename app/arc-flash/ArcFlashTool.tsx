'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { useArcFlashStore, selectInput } from '@/stores/useArcFlashStore'
import { calculateArcFlash } from '@/lib/calculations/arc-flash/arcFlashCalculator'
import { validateArcFlashInput } from '@/lib/validation/arcFlashValidation'
import ArcFlashInputForm from '@/components/arc-flash/ArcFlashInputForm'
import ArcFlashResults from '@/components/arc-flash/ArcFlashResults'

const formatEnergy = (jcm2: number) => `${(jcm2 / 4.184).toFixed(2)} cal/cm² (${jcm2.toFixed(2)} J/cm²)`
const formatDistance = (mm: number) => {
  const inches = Math.round(mm / 25.4)
  return `${Math.round(mm)} mm (${Math.floor(inches / 12)} ft ${inches % 12} in)`
}

export default function ArcFlashTool() {
  const store = useArcFlashStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  const handleCalculate = () => {
    setIsCalculating(true)
    setCalculationError(null)
    // Read current values directly from the store to avoid stale closures
    const state = useArcFlashStore.getState()
    const input = selectInput(state)

    const validation = validateArcFlashInput(input)
    if (!validation.success) {
      state.setValidationErrors(validation.errors)
      state.setResult(null, null)
      setIsCalculating(false)
      return
    }

    try {
      const result = calculateArcFlash(validation.data)
      state.setResult(result, null)
    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setIsCalculating(false)
    }
  }

  const values = selectInput(store)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Arc Flash Calculator</h1>
          <p className="text-muted-foreground text-sm">
            IEEE 1584-2018 incident energy &amp; arc flash boundary · NFPA 70E-2024
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
        <p>
          Results support, but do not replace, an arc flash risk assessment by a qualified person (NFPA 70E
          130.5). Calculations are for informational purposes; PE stamp/certification is the user&apos;s
          responsibility. AC systems only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <ArcFlashInputForm
            values={values}
            enclosure={store.enclosure ?? { heightMm: 610, widthMm: 610, depthMm: 254 }}
            errors={store.validationErrors}
            onFieldChange={store.setField}
            onEnclosureChange={store.setEnclosure}
            onElectrodeConfigChange={store.setElectrodeConfig}
            onSameTimeForBothChange={store.setSameTimeForBoth}
            onCalculate={handleCalculate}
            onReset={store.reset}
            isCalculating={isCalculating}
          />
        </CardContent>
      </Card>

      {store.validationErrors.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Inputs are outside the IEEE 1584-2018 model range — no result is shown.</p>
            <ul className="list-disc pl-5">
              {store.validationErrors.map((e) => (
                <li key={`${e.field}-${e.code}`}>{e.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {calculationError && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {calculationError}
        </div>
      )}

      {store.result && (
        <ArcFlashResults
          result={store.result}
          isStale={store.isStale}
          formatEnergy={formatEnergy}
          formatDistance={formatDistance}
        />
      )}
    </div>
  )
}
