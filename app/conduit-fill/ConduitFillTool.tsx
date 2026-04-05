'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, AlertCircle } from 'lucide-react'
import { useConduitFillStore } from '@/stores/useConduitFillStore'
import { calculateConduitFill, findMinimumConduitSize } from '@/lib/calculations/conduit-fill/conduitFillCalculator'
import { validateConduitFillInput } from '@/lib/validation/conduitFillValidation'
import ConduitFillInputForm from '@/components/conduit-fill/ConduitFillInputForm'
import ConduitFillResults from '@/components/conduit-fill/ConduitFillResults'
import ConduitFillHistorySidebar from '@/components/conduit-fill/ConduitFillHistorySidebar'
import ConduitFillReferenceDialog from '@/components/conduit-fill/ConduitFillReferenceDialog'
import { CONDUIT_TYPES } from '@/lib/calculations/conduit-fill/conduitFillData'
import { downloadConduitFillPDF } from '@/lib/pdfGenerator.conduitFill'

export default function ConduitFillTool() {
  const store = useConduitFillStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleCalculate = () => {
    setIsCalculating(true)
    setCalculationError(null)

    // Read current values directly from the store to avoid stale closures
    const {
      standard,
      conduitType,
      tradeSize,
      conductors,
      isNipple,
      unitSystem,
      projectName,
      projectRef,
      setResults,
      addToHistory,
    } = useConduitFillStore.getState()

    const inputObj = {
      standard,
      conduitType,
      tradeSize,
      conductors,
      isNipple,
      unitSystem,
      projectName,
      projectRef,
    }

    const validation = validateConduitFillInput(inputObj)
    if (!validation.success) {
      setCalculationError(validation.error.issues.map(i => i.message).join('; '))
      setIsCalculating(false)
      return
    }

    try {
      const result = calculateConduitFill(inputObj)

      // Also find minimum conduit size
      const minSize = findMinimumConduitSize(
        conduitType,
        conductors,
        isNipple,
        standard
      )
      result.minimumConduitSize = minSize
      result.noConduitFits = minSize === null && conductors.length > 0

      setResults(result)

      // Add to history
      const conduitLabel = CONDUIT_TYPES.find(t => t.id === conduitType)?.label?.split(' - ')[0] ?? conduitType
      const totalConductors = conductors.reduce((sum, c) => sum + c.quantity, 0)
      const sizeLabel = standard === 'IEC' ? `${tradeSize}mm` : `${tradeSize}"`
      addToHistory({
        id: `h-${Date.now()}`,
        timestamp: new Date().toISOString(),
        input: inputObj,
        result,
        label: `${conduitLabel} ${sizeLabel} — ${totalConductors} conductor${totalConductors !== 1 ? 's' : ''}`,
      })
    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleExportPDF = async () => {
    if (!store.results) return
    setIsExportingPDF(true)
    try {
      await downloadConduitFillPDF({
        input: {
          standard: store.standard,
          conduitType: store.conduitType,
          tradeSize: store.tradeSize,
          conductors: store.conductors,
          isNipple: store.isNipple,
          unitSystem: store.unitSystem,
          projectName: store.projectName,
          projectRef: store.projectRef,
        },
        result: store.results,
      })
    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'PDF export failed')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const isIEC = store.standard === 'IEC'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Conduit Fill Calculator</h1>
          <p className="text-muted-foreground text-sm">
            {isIEC
              ? 'IEC 61386 / BS 7671 — Conduit Fill Compliance'
              : 'NEC 2020 Chapter 9 — Conduit/Raceway Fill Compliance'}
          </p>
        </div>
        <div className="flex gap-2">
          <ConduitFillReferenceDialog />
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" /> History
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <ConduitFillInputForm
            standard={store.standard}
            conduitType={store.conduitType}
            tradeSize={store.tradeSize}
            conductors={store.conductors}
            isNipple={store.isNipple}
            unitSystem={store.unitSystem}
            projectName={store.projectName}
            projectRef={store.projectRef}
            onStandardChange={store.setStandard}
            onConduitTypeChange={store.setConduitType}
            onTradeSizeChange={store.setTradeSize}
            onAddConductor={store.addConductor}
            onUpdateConductor={store.updateConductor}
            onRemoveConductor={store.removeConductor}
            onNippleChange={store.setNipple}
            onUnitSystemChange={store.setUnitSystem}
            onProjectNameChange={store.setProjectName}
            onProjectRefChange={store.setProjectRef}
            onCalculate={handleCalculate}
            onReset={store.reset}
          />
        </CardContent>
      </Card>

      {calculationError && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{calculationError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {store.results && (
        <ConduitFillResults
          results={store.results}
          standard={store.standard}
          unitSystem={store.unitSystem}
          onExportPDF={handleExportPDF}
          isExportingPDF={isExportingPDF}
        />
      )}

      <ConduitFillHistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  )
}
