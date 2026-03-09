'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown, History, AlertCircle } from 'lucide-react'
import { useVoltageDropStore } from '@/stores/useVoltageDropStore'
import { calculateVoltageDrop } from '@/lib/calculations/voltage-drop/voltageDropCalculator'
import { validateVoltageDropInput } from '@/lib/validation/voltageDropValidation'
import VoltageDropInputForm from '@/components/voltage-drop/VoltageDropInputForm'
import VoltageDropResults from '@/components/voltage-drop/VoltageDropResults'
import VoltageDropHistorySidebar from '@/components/voltage-drop/VoltageDropHistorySidebar'
import { downloadVoltageDropPDF } from '@/lib/pdfGenerator.voltageDrop'

export default function VoltageDropTool() {
  const store = useVoltageDropStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true)
    setCalculationError(null)

    const inputObj = {
      standard: store.standard,
      phase: store.phase,
      systemVoltage: store.systemVoltage,
      current: store.current,
      length: store.length,
      lengthUnit: store.lengthUnit,
      conductorType: store.conductorType,
      conductorMaterial: store.conductorMaterial,
      powerFactor: store.powerFactor,
      cableSizeMode: store.cableSizeMode,
      cableSizeMm2: store.cableSizeMm2,
      cableSizeAWG: store.cableSizeAWG,
      customResistance: store.customResistance,
      parallelRuns: store.parallelRuns,
      buswayRating: store.buswayRating,
      buswayType: store.buswayType,
      customBuswayImpedance: store.customBuswayImpedance,
      maxDropPercent: store.maxDropPercent,
      includeCableSuggestion: store.includeCableSuggestion,
    }

    const validation = validateVoltageDropInput(inputObj)
    if (!validation.success) {
      setCalculationError(validation.error.issues.map(i => i.message).join('; '))
      setIsCalculating(false)
      return
    }

    try {
      const results = await calculateVoltageDrop({ input: inputObj })
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
      await downloadVoltageDropPDF({
        input: {
          standard: store.standard,
          phase: store.phase,
          systemVoltage: store.systemVoltage,
          current: store.current,
          length: store.length,
          lengthUnit: store.lengthUnit,
          conductorType: store.conductorType,
          conductorMaterial: store.conductorMaterial,
          powerFactor: store.powerFactor,
          cableSizeMode: store.cableSizeMode,
          cableSizeMm2: store.cableSizeMm2,
          cableSizeAWG: store.cableSizeAWG,
          customResistance: store.customResistance,
          parallelRuns: store.parallelRuns,
          buswayRating: store.buswayRating,
          buswayType: store.buswayType,
          customBuswayImpedance: store.customBuswayImpedance,
          maxDropPercent: store.maxDropPercent,
          includeCableSuggestion: store.includeCableSuggestion,
        },
        results: store.results,
        project: {
          projectName: store.projectName,
          projectLocation: store.projectLocation,
          engineerName: store.engineerName,
        },
      })
    } catch { /* silent */ } finally {
      setIsExportingPDF(false)
    }
  }, [store])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Voltage Drop Calculator</h2>
          <p className="text-muted-foreground text-sm">Cable & busway voltage drop per IEC 60364 / NEC / IEC 61439-6</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => store.setShowHistorySidebar(true)}>
            <History className="h-4 w-4 mr-1" /> History
          </Button>
          {store.results && (
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF}>
              <FileDown className="h-4 w-4 mr-1" />
              {isExportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Input Parameters</CardTitle></CardHeader>
          <CardContent>
            <VoltageDropInputForm
              standard={store.standard}
              phase={store.phase}
              systemVoltage={store.systemVoltage}
              current={store.current}
              length={store.length}
              lengthUnit={store.lengthUnit}
              conductorType={store.conductorType}
              conductorMaterial={store.conductorMaterial}
              powerFactor={store.powerFactor}
              cableSizeMode={store.cableSizeMode}
              cableSizeMm2={store.cableSizeMm2}
              cableSizeAWG={store.cableSizeAWG}
              customResistance={store.customResistance}
              parallelRuns={store.parallelRuns}
              buswayRating={store.buswayRating}
              buswayType={store.buswayType}
              customBuswayImpedance={store.customBuswayImpedance}
              maxDropPercent={store.maxDropPercent}
              includeCableSuggestion={store.includeCableSuggestion}
              onStandardChange={store.setStandard}
              onPhaseChange={store.setPhase}
              onSystemVoltageChange={store.setSystemVoltage}
              onCurrentChange={store.setCurrent}
              onLengthChange={store.setLength}
              onLengthUnitChange={store.setLengthUnit}
              onConductorTypeChange={store.setConductorType}
              onConductorMaterialChange={store.setConductorMaterial}
              onPowerFactorChange={store.setPowerFactor}
              onCableSizeModeChange={store.setCableSizeMode}
              onCableSizeMm2Change={store.setCableSizeMm2}
              onCableSizeAWGChange={store.setCableSizeAWG}
              onCustomResistanceChange={store.setCustomResistance}
              onParallelRunsChange={store.setParallelRuns}
              onBuswayRatingChange={store.setBuswayRating}
              onBuswayTypeChange={store.setBuswayType}
              onCustomBuswayImpedanceChange={store.setCustomBuswayImpedance}
              onMaxDropPercentChange={store.setMaxDropPercent}
              onIncludeCableSuggestionChange={store.setIncludeCableSuggestion}
              onCalculate={handleCalculate}
              onReset={store.reset}
              isCalculating={isCalculating}
            />
          </CardContent>
        </Card>

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
            <VoltageDropResults results={store.results} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  Enter parameters and click <strong>Calculate Voltage Drop</strong> to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <VoltageDropHistorySidebar
        isOpen={store.showHistorySidebar}
        onClose={() => store.setShowHistorySidebar(false)}
      />
    </div>
  )
}
