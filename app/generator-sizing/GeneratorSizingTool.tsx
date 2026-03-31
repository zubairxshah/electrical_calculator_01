'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, History, Zap } from 'lucide-react'
import { useGeneratorSizingStore } from '@/stores/useGeneratorSizingStore'
import { calculateGeneratorSizing } from '@/lib/calculations/generator-sizing/generatorCalculator'
import { validateGeneratorSizingInput } from '@/lib/validation/generatorSizingValidation'
import { ftToM, fToC } from '@/lib/calculations/generator-sizing/generatorData'
import GeneratorInputForm from '@/components/generator-sizing/GeneratorInputForm'
import LoadTable from '@/components/generator-sizing/LoadTable'
import GeneratorResults from '@/components/generator-sizing/GeneratorResults'
import MotorStartingPanel from '@/components/generator-sizing/MotorStartingPanel'
import StepLoadingPanel from '@/components/generator-sizing/StepLoadingPanel'
import DeratingPanel from '@/components/generator-sizing/DeratingPanel'
import FuelEstimationPanel from '@/components/generator-sizing/FuelEstimationPanel'
import GeneratorHistorySidebar from '@/components/generator-sizing/GeneratorHistorySidebar'

export default function GeneratorSizingTool() {
  const store = useGeneratorSizingStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    setCalculationError(null)

    try {
      // Convert units to internal metric before validation
      const altitudeM = store.siteConditions.altitudeUnit === 'ft'
        ? ftToM(store.siteConditions.altitude)
        : store.siteConditions.altitude
      const tempC = store.siteConditions.temperatureUnit === 'F'
        ? fToC(store.siteConditions.ambientTemperature)
        : store.siteConditions.ambientTemperature

      const input = {
        loads: store.loads,
        generatorConfig: store.generatorConfig,
        siteConditions: {
          altitude: altitudeM,
          altitudeUnit: 'm' as const,
          ambientTemperature: tempC,
          temperatureUnit: 'C' as const,
        },
        fuelConfig: store.fuelConfig,
        voltageDipThreshold: store.voltageDipThreshold,
      }

      // Validate
      const validation = validateGeneratorSizingInput(input)
      if (!validation.success) {
        setCalculationError(validation.errors.join('; '))
        setIsCalculating(false)
        return
      }

      // Calculate
      const result = calculateGeneratorSizing(input)
      store.setResult(result)
    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setIsCalculating(false)
    }
  }, [store])

  const handleReset = useCallback(() => {
    store.reset()
    setCalculationError(null)
  }, [store])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Generator Sizing Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            ISO 8528 · IEEE 3006.4 · NFPA 110 · NEC 700/701/702
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Generator Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Generator Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneratorInputForm />
            </CardContent>
          </Card>

          {/* Load Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Load Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadTable />
            </CardContent>
          </Card>

          {/* Site Conditions & Derating */}
          <DeratingPanel />

          {/* Step Loading */}
          <StepLoadingPanel />

          {/* Fuel Estimation */}
          <FuelEstimationPanel />

          {/* Calculate Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleCalculate}
              disabled={isCalculating || store.loads.length === 0}
              className="flex-1"
              size="lg"
            >
              {isCalculating ? 'Calculating...' : 'Calculate Generator Size'}
            </Button>
            <Button variant="outline" onClick={handleReset} size="lg">
              Reset
            </Button>
          </div>

          {/* Error Display */}
          {calculationError && (
            <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <p className="text-sm">{calculationError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {store.result && (
            <>
              <GeneratorResults />
              <MotorStartingPanel />
            </>
          )}
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="lg:block">
            <GeneratorHistorySidebar />
          </div>
        )}
      </div>
    </div>
  )
}
