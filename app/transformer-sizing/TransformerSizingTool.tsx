'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown, History, AlertCircle } from 'lucide-react'
import { useTransformerSizingStore } from '@/stores/useTransformerSizingStore'
import { calculateTransformerSizing } from '@/lib/calculations/transformer-sizing/transformerCalculator'
import { validateTransformerInput, validateTransformerEnvironment, getTransformerWarnings } from '@/lib/validation/transformerSizingValidation'
import TransformerSizingInputForm from '@/components/transformer-sizing/TransformerSizingInputForm'
import TransformerSizingResults from '@/components/transformer-sizing/TransformerSizingResults'
import TransformerSizingHistorySidebar from '@/components/transformer-sizing/TransformerSizingHistorySidebar'
import { downloadTransformerSizingPDF } from '@/lib/pdfGenerator.transformerSizing'

export default function TransformerSizingTool() {
  const store = useTransformerSizingStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true)
    setCalculationError(null)

    const inputObj = {
      standard: store.standard,
      phase: store.phase,
      loadKW: store.loadKW,
      loadPowerFactor: store.loadPowerFactor,
      primaryVoltage: store.primaryVoltage,
      secondaryVoltage: store.secondaryVoltage,
      transformerType: store.transformerType,
      coolingClass: store.coolingClass,
      vectorGroup: store.vectorGroup,
      tapPosition: store.tapPosition,
      tapRange: store.tapRange,
      loadProfile: store.loadProfile,
      demandFactor: store.demandFactor,
      futureGrowth: store.futureGrowth,
      impedancePercent: store.impedancePercent,
    }

    const envObj = {
      ambientTemperature: store.ambientTemperature,
      altitude: store.altitude,
      installationLocation: store.installationLocation,
    }

    // Validate input
    const inputValidation = validateTransformerInput(inputObj)
    if (!inputValidation.success) {
      const messages = inputValidation.error.issues.map(i => i.message).join('; ')
      setCalculationError(messages)
      setIsCalculating(false)
      return
    }

    const envValidation = validateTransformerEnvironment(envObj)
    if (!envValidation.success) {
      const messages = envValidation.error.issues.map(i => i.message).join('; ')
      setCalculationError(messages)
      setIsCalculating(false)
      return
    }

    try {
      const results = await calculateTransformerSizing({
        input: inputObj,
        environment: envObj,
      })

      // Append validation warnings as info alerts
      const warnings = getTransformerWarnings(inputValidation.data)
      warnings.forEach(w => {
        results.alerts.push({ type: 'warning', message: w.message })
      })

      store.setResults(results)
      setTimeout(() => store.saveToHistory(), 500)
    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setIsCalculating(false)
    }
  }, [store])

  const handleExportPDF = useCallback(async () => {
    if (!store.results) return
    setIsExportingPDF(true)
    try {
      await downloadTransformerSizingPDF({
        input: {
          standard: store.standard,
          phase: store.phase,
          loadKW: store.loadKW,
          loadPowerFactor: store.loadPowerFactor,
          primaryVoltage: store.primaryVoltage,
          secondaryVoltage: store.secondaryVoltage,
          transformerType: store.transformerType,
          coolingClass: store.coolingClass,
          vectorGroup: store.vectorGroup,
          tapPosition: store.tapPosition,
          tapRange: store.tapRange,
          loadProfile: store.loadProfile,
          demandFactor: store.demandFactor,
          futureGrowth: store.futureGrowth,
          impedancePercent: store.impedancePercent,
        },
        results: store.results,
        project: {
          projectName: store.projectName,
          projectLocation: store.projectLocation,
          engineerName: store.engineerName,
        },
      })
    } catch {
      // PDF export failed silently
    } finally {
      setIsExportingPDF(false)
    }
  }, [store])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transformer Sizing</h2>
          <p className="text-muted-foreground text-sm">kVA rating, losses, impedance & regulation per IEC 60076 / IEEE C57 / NEC 450</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => store.setShowHistorySidebar(true)}
          >
            <History className="h-4 w-4 mr-1" /> History
          </Button>
          {store.results && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
            >
              <FileDown className="h-4 w-4 mr-1" />
              {isExportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <TransformerSizingInputForm
              standard={store.standard}
              phase={store.phase}
              loadKW={store.loadKW}
              loadPowerFactor={store.loadPowerFactor}
              primaryVoltage={store.primaryVoltage}
              secondaryVoltage={store.secondaryVoltage}
              transformerType={store.transformerType}
              coolingClass={store.coolingClass}
              vectorGroup={store.vectorGroup}
              tapPosition={store.tapPosition}
              tapRange={store.tapRange}
              loadProfile={store.loadProfile}
              demandFactor={store.demandFactor}
              futureGrowth={store.futureGrowth}
              impedancePercent={store.impedancePercent}
              ambientTemperature={store.ambientTemperature}
              altitude={store.altitude}
              installationLocation={store.installationLocation}
              showEnvironmental={store.showEnvironmental}
              onStandardChange={store.setStandard}
              onPhaseChange={store.setPhase}
              onLoadKWChange={store.setLoadKW}
              onLoadPowerFactorChange={store.setLoadPowerFactor}
              onPrimaryVoltageChange={store.setPrimaryVoltage}
              onSecondaryVoltageChange={store.setSecondaryVoltage}
              onTransformerTypeChange={store.setTransformerType}
              onCoolingClassChange={store.setCoolingClass}
              onVectorGroupChange={store.setVectorGroup}
              onTapPositionChange={store.setTapPosition}
              onTapRangeChange={store.setTapRange}
              onLoadProfileChange={store.setLoadProfile}
              onDemandFactorChange={store.setDemandFactor}
              onFutureGrowthChange={store.setFutureGrowth}
              onImpedancePercentChange={store.setImpedancePercent}
              onAmbientTemperatureChange={store.setAmbientTemperature}
              onAltitudeChange={store.setAltitude}
              onInstallationLocationChange={store.setInstallationLocation}
              onShowEnvironmentalChange={store.setShowEnvironmental}
              onCalculate={handleCalculate}
              onReset={store.reset}
              isCalculating={isCalculating}
            />
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          {calculationError && (
            <Card className="border-destructive mb-4">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <p className="text-sm">{calculationError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {store.results ? (
            <TransformerSizingResults results={store.results} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  Enter parameters and click <strong>Calculate Transformer Size</strong> to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* History Sidebar */}
      <TransformerSizingHistorySidebar
        isOpen={store.showHistorySidebar}
        onClose={() => store.setShowHistorySidebar(false)}
      />
    </div>
  )
}
