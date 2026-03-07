'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown, History, AlertCircle } from 'lucide-react'
import { usePowerFactorCorrectionStore } from '@/stores/usePowerFactorCorrectionStore'
import { calculatePowerFactorCorrection } from '@/lib/calculations/power-factor-correction/pfcCalculator'
import { validateWithWarnings } from '@/lib/validation/powerFactorCorrectionValidation'
import PowerFactorCorrectionInputForm from '@/components/power-factor-correction/PowerFactorCorrectionInputForm'
import PowerFactorCorrectionResults from '@/components/power-factor-correction/PowerFactorCorrectionResults'
import PowerFactorCorrectionHistorySidebar from '@/components/power-factor-correction/PowerFactorCorrectionHistorySidebar'
import { downloadPowerFactorCorrectionPDF } from '@/lib/pdfGenerator.powerFactorCorrection'

export default function PowerFactorCorrectionTool() {
  const store = usePowerFactorCorrectionStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true)
    setCalculationError(null)

    const inputObj = {
      standard: store.standard,
      systemType: store.systemType,
      voltage: store.voltage,
      frequency: store.frequency,
      activePower: store.activePower,
      currentPowerFactor: store.currentPowerFactor,
      targetPowerFactor: store.targetPowerFactor,
      connectionType: store.connectionType,
      correctionType: store.correctionType,
      loadProfile: store.loadProfile,
      harmonicDistortion: store.harmonicDistortion,
    }

    // Validate
    const validation = validateWithWarnings(inputObj)
    if (!validation.success) {
      const messages = validation.error?.issues.map(i => i.message).join('; ')
      setCalculationError(messages || 'Validation failed')
      setIsCalculating(false)
      return
    }

    try {
      const results = await calculatePowerFactorCorrection({
        input: inputObj,
        environment: {
          ambientTemperature: store.ambientTemperature,
          altitude: store.altitude,
        },
      })

      // Append validation warnings as alerts
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => {
          results.alerts.push({ type: 'warning', message: w.message })
        })
      }

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
      await downloadPowerFactorCorrectionPDF({
        input: {
          standard: store.standard,
          systemType: store.systemType,
          voltage: store.voltage,
          frequency: store.frequency,
          activePower: store.activePower,
          currentPowerFactor: store.currentPowerFactor,
          targetPowerFactor: store.targetPowerFactor,
          connectionType: store.connectionType,
          correctionType: store.correctionType,
          loadProfile: store.loadProfile,
          harmonicDistortion: store.harmonicDistortion,
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
          <h2 className="text-2xl font-bold">Power Factor Correction</h2>
          <p className="text-muted-foreground text-sm">Capacitor bank sizing per IEC 60831 / NEC 460</p>
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
            <PowerFactorCorrectionInputForm
              standard={store.standard}
              systemType={store.systemType}
              voltage={store.voltage}
              frequency={store.frequency}
              activePower={store.activePower}
              currentPowerFactor={store.currentPowerFactor}
              targetPowerFactor={store.targetPowerFactor}
              connectionType={store.connectionType}
              correctionType={store.correctionType}
              loadProfile={store.loadProfile}
              harmonicDistortion={store.harmonicDistortion}
              ambientTemperature={store.ambientTemperature}
              altitude={store.altitude}
              showEnvironmental={store.showEnvironmental}
              onStandardChange={store.setStandard}
              onSystemTypeChange={store.setSystemType}
              onVoltageChange={store.setVoltage}
              onFrequencyChange={store.setFrequency}
              onActivePowerChange={store.setActivePower}
              onCurrentPowerFactorChange={store.setCurrentPowerFactor}
              onTargetPowerFactorChange={store.setTargetPowerFactor}
              onConnectionTypeChange={store.setConnectionType}
              onCorrectionTypeChange={store.setCorrectionType}
              onLoadProfileChange={store.setLoadProfile}
              onHarmonicDistortionChange={store.setHarmonicDistortion}
              onAmbientTemperatureChange={store.setAmbientTemperature}
              onAltitudeChange={store.setAltitude}
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
            <PowerFactorCorrectionResults results={store.results} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  Enter parameters and click <strong>Calculate</strong> to size your capacitor bank.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* History Sidebar */}
      <PowerFactorCorrectionHistorySidebar
        isOpen={store.showHistorySidebar}
        onClose={() => store.setShowHistorySidebar(false)}
      />
    </div>
  )
}
