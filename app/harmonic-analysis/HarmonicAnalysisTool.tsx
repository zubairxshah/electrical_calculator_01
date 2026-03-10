'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, AlertCircle } from 'lucide-react'
import { useHarmonicAnalysisStore } from '@/stores/useHarmonicAnalysisStore'
import { calculateHarmonicAnalysis } from '@/lib/calculations/harmonic-analysis/harmonicCalculator'
import { validateHarmonicAnalysisInput } from '@/lib/validation/harmonicAnalysisValidation'
import HarmonicInputForm from '@/components/harmonic-analysis/HarmonicInputForm'
import HarmonicResults from '@/components/harmonic-analysis/HarmonicResults'
import HarmonicHistorySidebar from '@/components/harmonic-analysis/HarmonicHistorySidebar'

export default function HarmonicAnalysisTool() {
  const store = useHarmonicAnalysisStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true)
    setCalculationError(null)

    const inputObj = {
      standard: store.standard,
      systemType: store.systemType,
      voltageLevel: store.voltageLevel,
      systemVoltage: store.systemVoltage,
      fundamentalFrequency: store.fundamentalFrequency,
      loadProfile: store.loadProfile,
      fundamentalCurrent: store.fundamentalCurrent,
      loadPowerKW: store.loadPowerKW,
      shortCircuitCurrentKA: store.shortCircuitCurrentKA,
      maxDemandCurrent: store.maxDemandCurrent,
      currentHarmonics: store.currentHarmonics,
      voltageHarmonics: store.voltageHarmonics,
      calculateVoltageThd: store.calculateVoltageThd,
      calculateFilterSizing: store.calculateFilterSizing,
      targetThd: store.targetThd,
    }

    const validation = validateHarmonicAnalysisInput(inputObj)
    if (!validation.success) {
      setCalculationError(validation.error.issues.map(i => i.message).join('; '))
      setIsCalculating(false)
      return
    }

    try {
      const results = await calculateHarmonicAnalysis({ input: inputObj })
      store.setResults(results)
      setTimeout(() => store.saveToHistory(), 500)
    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setIsCalculating(false)
    }
  }, [store])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Harmonic Analysis & THD Calculator</h2>
          <p className="text-muted-foreground text-sm">
            THDi, THDv, TDD, K-Factor &amp; compliance per IEEE 519 / IEC 61000
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => store.setShowHistorySidebar(true)}>
            <History className="h-4 w-4 mr-1" /> History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <HarmonicInputForm
                standard={store.standard}
                systemType={store.systemType}
                voltageLevel={store.voltageLevel}
                systemVoltage={store.systemVoltage}
                fundamentalFrequency={store.fundamentalFrequency}
                loadProfile={store.loadProfile}
                fundamentalCurrent={store.fundamentalCurrent}
                loadPowerKW={store.loadPowerKW}
                shortCircuitCurrentKA={store.shortCircuitCurrentKA}
                maxDemandCurrent={store.maxDemandCurrent}
                currentHarmonics={store.currentHarmonics}
                voltageHarmonics={store.voltageHarmonics}
                calculateVoltageThd={store.calculateVoltageThd}
                calculateFilterSizing={store.calculateFilterSizing}
                targetThd={store.targetThd}
                onStandardChange={store.setStandard}
                onSystemTypeChange={store.setSystemType}
                onVoltageLevelChange={store.setVoltageLevel}
                onSystemVoltageChange={store.setSystemVoltage}
                onFundamentalFrequencyChange={store.setFundamentalFrequency}
                onLoadProfileChange={store.setLoadProfile}
                onFundamentalCurrentChange={store.setFundamentalCurrent}
                onLoadPowerKWChange={store.setLoadPowerKW}
                onShortCircuitCurrentKAChange={store.setShortCircuitCurrentKA}
                onMaxDemandCurrentChange={store.setMaxDemandCurrent}
                onCurrentHarmonicChange={store.updateCurrentHarmonic}
                onVoltageHarmonicChange={store.updateVoltageHarmonic}
                onCalculateVoltageThdChange={store.setCalculateVoltageThd}
                onCalculateFilterSizingChange={store.setCalculateFilterSizing}
                onTargetThdChange={store.setTargetThd}
                onCalculate={handleCalculate}
                onReset={store.reset}
                isCalculating={isCalculating}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {calculationError && (
            <Card className="border-red-300 bg-red-50 dark:bg-red-950/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{calculationError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {store.results ? (
            <HarmonicResults results={store.results} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  Select a load profile or enter harmonic data, then click{' '}
                  <strong>Analyze Harmonics</strong> to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <HarmonicHistorySidebar
        isOpen={store.showHistorySidebar}
        onClose={() => store.setShowHistorySidebar(false)}
        history={store.getHistory()}
        onLoadFromHistory={store.loadFromHistory}
        onDeleteFromHistory={store.deleteFromHistory}
      />
    </div>
  )
}
