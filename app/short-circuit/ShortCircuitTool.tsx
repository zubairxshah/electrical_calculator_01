'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown, History, AlertCircle } from 'lucide-react'
import { useShortCircuitStore } from '@/stores/useShortCircuitStore'
import { calculateShortCircuit } from '@/lib/calculations/short-circuit/shortCircuitCalculator'
import { validateShortCircuitInput } from '@/lib/validation/shortCircuitValidation'
import ShortCircuitInputForm from '@/components/short-circuit/ShortCircuitInputForm'
import ShortCircuitResults from '@/components/short-circuit/ShortCircuitResults'
import ShortCircuitHistorySidebar from '@/components/short-circuit/ShortCircuitHistorySidebar'
import { downloadShortCircuitPDF } from '@/lib/pdfGenerator.shortCircuit'

export default function ShortCircuitTool() {
  const store = useShortCircuitStore()
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
      frequency: store.frequency,
      grounding: store.grounding,
      utilityFaultMVA: store.utilityFaultMVA,
      utilityXRRatio: store.utilityXRRatio,
      hasTransformer: store.hasTransformer,
      transformerKVA: store.transformerKVA,
      transformerImpedancePercent: store.transformerImpedancePercent,
      transformerXRRatio: store.transformerXRRatio,
      hasMotorContribution: store.hasMotorContribution,
      totalMotorHP: store.totalMotorHP,
      motorType: store.motorType,
      hasCableImpedance: store.hasCableImpedance,
      cableLength: store.cableLength,
      cableResistance: store.cableResistance,
      cableReactance: store.cableReactance,
      conductorsPerPhase: store.conductorsPerPhase,
      faultTypes: store.faultTypes,
    }

    const validation = validateShortCircuitInput(inputObj)
    if (!validation.success) {
      setCalculationError(validation.error.issues.map(i => i.message).join('; '))
      setIsCalculating(false)
      return
    }

    try {
      const results = await calculateShortCircuit({ input: inputObj })
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
      await downloadShortCircuitPDF({
        input: {
          standard: store.standard,
          phase: store.phase,
          systemVoltage: store.systemVoltage,
          frequency: store.frequency,
          grounding: store.grounding,
          utilityFaultMVA: store.utilityFaultMVA,
          utilityXRRatio: store.utilityXRRatio,
          hasTransformer: store.hasTransformer,
          transformerKVA: store.transformerKVA,
          transformerImpedancePercent: store.transformerImpedancePercent,
          transformerXRRatio: store.transformerXRRatio,
          hasMotorContribution: store.hasMotorContribution,
          totalMotorHP: store.totalMotorHP,
          motorType: store.motorType,
          hasCableImpedance: store.hasCableImpedance,
          cableLength: store.cableLength,
          cableResistance: store.cableResistance,
          cableReactance: store.cableReactance,
          conductorsPerPhase: store.conductorsPerPhase,
          faultTypes: store.faultTypes,
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
          <h2 className="text-2xl font-bold">Short Circuit Analysis</h2>
          <p className="text-muted-foreground text-sm">Fault current calculations per IEC 60909 / IEEE 551 / NEC 110.9</p>
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
          <CardHeader><CardTitle>System Parameters</CardTitle></CardHeader>
          <CardContent>
            <ShortCircuitInputForm
              standard={store.standard}
              phase={store.phase}
              systemVoltage={store.systemVoltage}
              frequency={store.frequency}
              grounding={store.grounding}
              utilityFaultMVA={store.utilityFaultMVA}
              utilityXRRatio={store.utilityXRRatio}
              hasTransformer={store.hasTransformer}
              transformerKVA={store.transformerKVA}
              transformerImpedancePercent={store.transformerImpedancePercent}
              transformerXRRatio={store.transformerXRRatio}
              hasMotorContribution={store.hasMotorContribution}
              totalMotorHP={store.totalMotorHP}
              motorType={store.motorType}
              hasCableImpedance={store.hasCableImpedance}
              cableLength={store.cableLength}
              cableResistance={store.cableResistance}
              cableReactance={store.cableReactance}
              conductorsPerPhase={store.conductorsPerPhase}
              faultTypes={store.faultTypes}
              onStandardChange={store.setStandard}
              onPhaseChange={store.setPhase}
              onSystemVoltageChange={store.setSystemVoltage}
              onFrequencyChange={store.setFrequency}
              onGroundingChange={store.setGrounding}
              onUtilityFaultMVAChange={store.setUtilityFaultMVA}
              onUtilityXRRatioChange={store.setUtilityXRRatio}
              onHasTransformerChange={store.setHasTransformer}
              onTransformerKVAChange={store.setTransformerKVA}
              onTransformerImpedancePercentChange={store.setTransformerImpedancePercent}
              onTransformerXRRatioChange={store.setTransformerXRRatio}
              onHasMotorContributionChange={store.setHasMotorContribution}
              onTotalMotorHPChange={store.setTotalMotorHP}
              onMotorTypeChange={store.setMotorType}
              onHasCableImpedanceChange={store.setHasCableImpedance}
              onCableLengthChange={store.setCableLength}
              onCableResistanceChange={store.setCableResistance}
              onCableReactanceChange={store.setCableReactance}
              onConductorsPerPhaseChange={store.setConductorsPerPhase}
              onFaultTypesChange={store.setFaultTypes}
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
            <ShortCircuitResults results={store.results} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  Enter system parameters and click <strong>Calculate Fault Currents</strong> to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ShortCircuitHistorySidebar
        isOpen={store.showHistorySidebar}
        onClose={() => store.setShowHistorySidebar(false)}
      />
    </div>
  )
}
