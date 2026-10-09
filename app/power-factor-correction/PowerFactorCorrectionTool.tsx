'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown, History, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { usePowerFactorCorrectionStore } from '@/stores/usePowerFactorCorrectionStore'
import { calculatePowerFactorCorrection } from '@/lib/calculations/power-factor-correction/pfcCalculator'
import { designPanel } from '@/lib/calculations/power-factor-correction/panelDesign'
import { validateWithWarnings } from '@/lib/validation/powerFactorCorrectionValidation'
import PowerFactorCorrectionInputForm from '@/components/power-factor-correction/PowerFactorCorrectionInputForm'
import PowerFactorCorrectionResults from '@/components/power-factor-correction/PowerFactorCorrectionResults'
import PowerFactorCorrectionHistorySidebar from '@/components/power-factor-correction/PowerFactorCorrectionHistorySidebar'
import DesignStepper, { STAGES } from '@/components/power-factor-correction/DesignStepper'
import DesignSummaryStrip from '@/components/power-factor-correction/DesignSummaryStrip'
import DesignWarnings from '@/components/power-factor-correction/DesignWarnings'
import StepBankStage from '@/components/power-factor-correction/StepBankStage'
import DetuningStage from '@/components/power-factor-correction/DetuningStage'
import SwitchgearStage from '@/components/power-factor-correction/SwitchgearStage'
import { downloadPowerFactorCorrectionPDF } from '@/lib/pdfGenerator.powerFactorCorrection'
import type { PFCDesignStage, PFCInput } from '@/types/power-factor-correction'

type StoreState = ReturnType<typeof usePowerFactorCorrectionStore.getState>

function selectInput(s: StoreState): PFCInput {
  return {
    standard: s.standard,
    systemType: s.systemType,
    voltage: s.voltage,
    frequency: s.frequency,
    activePower: s.activePower,
    currentPowerFactor: s.currentPowerFactor,
    targetPowerFactor: s.targetPowerFactor,
    connectionType: s.connectionType,
    correctionType: s.correctionType,
    loadProfile: s.loadProfile,
    harmonicDistortion: s.harmonicDistortion,
  }
}

const getStore = () => usePowerFactorCorrectionStore.getState()

export default function PowerFactorCorrectionTool() {
  const store = usePowerFactorCorrectionStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const input = selectInput(store)
  const panel = useMemo(
    () => designPanel(input, store.results, store.design),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.results, store.design, store.standard, store.systemType, store.voltage, store.frequency,
      store.correctionType, store.harmonicDistortion]
  )
  const stage: PFCDesignStage = panel.available ? store.activeStage : 1

  const handleCalculate = async () => {
    setIsCalculating(true)
    setCalculationError(null)
    const s = getStore()
    const inputObj = selectInput(s)

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
        environment: { ambientTemperature: s.ambientTemperature, altitude: s.altitude },
      })
      validation.warnings.forEach(w => results.alerts.push({ type: 'warning', message: w.message }))
      getStore().setResults(results)
      setTimeout(() => getStore().saveToHistory(), 500)
    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleExportPDF = async () => {
    const s = getStore()
    if (!s.results) return
    setIsExportingPDF(true)
    try {
      const inputObj = selectInput(s)
      const design = designPanel(inputObj, s.results, s.design)
      await downloadPowerFactorCorrectionPDF({
        input: inputObj,
        results: s.results,
        project: { projectName: s.projectName, projectLocation: s.projectLocation, engineerName: s.engineerName },
        design: design.available ? design : undefined,
      })
    } catch {
      setCalculationError('PDF export failed — please try again')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const goTo = (next: PFCDesignStage) => getStore().setActiveStage(next)
  const title = STAGES.find(x => x.stage === stage)?.title
  const nextTitle = STAGES.find(x => x.stage === stage + 1)?.title

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Power Factor Correction &amp; APFC Panel Design</h2>
          <p className="text-muted-foreground text-sm">
            Capacitor bank sizing, step bank, detuning and switchgear per IEC 60831 / IEC 61921 / NEC 460
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => getStore().setShowHistorySidebar(true)}>
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

      <DesignStepper active={stage} designAvailable={panel.available} onChange={goTo} />
      <DesignSummaryStrip design={panel} />

      {calculationError && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <p className="text-sm">{calculationError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <section aria-label={`Stage ${stage}: ${title}`}>
        {stage === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div className="space-y-4">
              {store.results ? (
                <PowerFactorCorrectionResults results={store.results} />
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground">
                      Enter parameters and click <strong>Calculate</strong> to size the capacitor bank, then continue to the panel design stages.
                    </p>
                  </CardContent>
                </Card>
              )}
              {!panel.available && <DesignWarnings warnings={panel.warnings} />}
            </div>
          </div>
        )}

        {stage === 2 && panel.stepBank && (
          <StepBankStage
            input={input}
            design={store.design}
            bank={panel.stepBank}
            onDesignChange={(patch) => getStore().setDesign(patch)}
          />
        )}

        {stage === 3 && panel.detuning && (
          <DetuningStage
            input={input}
            design={store.design}
            detuning={panel.detuning}
            onDesignChange={(patch) => getStore().setDesign(patch)}
          />
        )}

        {stage === 4 && panel.switchgear && (
          <div className="space-y-4">
            <SwitchgearStage
              standard={store.standard}
              switchgear={panel.switchgear}
              onProtectionTypeChange={(t) => getStore().setDesign({ protectionType: t })}
              onOverride={(i, patch) => getStore().setStepOverride(i, patch)}
            />
            {panel.warnings.some(w => w.code === 'DETUNING_RECOMMENDED') && (
              <DesignWarnings warnings={panel.warnings.filter(w => w.code === 'DETUNING_RECOMMENDED')} />
            )}
          </div>
        )}
      </section>

      {/* Stage navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={stage === 1} onClick={() => goTo((stage - 1) as PFCDesignStage)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {stage < 4 && (
          <Button disabled={!panel.available} onClick={() => goTo((stage + 1) as PFCDesignStage)}>
            Next: {nextTitle} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      <PowerFactorCorrectionHistorySidebar
        isOpen={store.showHistorySidebar}
        onClose={() => getStore().setShowHistorySidebar(false)}
      />
    </div>
  )
}
