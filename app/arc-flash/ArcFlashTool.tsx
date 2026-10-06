'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Download, Eye, EyeOff, History, ShieldAlert } from 'lucide-react'
import type { ArcFlashStandard } from '@/types/arc-flash'
import { useArcFlashStore, selectInput } from '@/stores/useArcFlashStore'
import { calculateArcFlash } from '@/lib/calculations/arc-flash/arcFlashCalculator'
import { validateArcFlashInput } from '@/lib/validation/arcFlashValidation'
import ArcFlashInputForm from '@/components/arc-flash/ArcFlashInputForm'
import ArcFlashResults from '@/components/arc-flash/ArcFlashResults'
import PpeAssessmentCard from '@/components/arc-flash/PpeAssessmentCard'
import ArcFlashLabelPreview from '@/components/arc-flash/ArcFlashLabelPreview'
import ArcFlashHistorySidebar from '@/components/arc-flash/ArcFlashHistorySidebar'
import ArcFlashReferenceDialog from '@/components/arc-flash/ArcFlashReferenceDialog'
import ArcFlashErrorBoundary from '@/components/arc-flash/ArcFlashErrorBoundary'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TYPICAL_EQUIPMENT } from '@/lib/calculations/arc-flash/ieee1584Tables'
import { assessPpe } from '@/lib/calculations/arc-flash/ppe'
import { buildArcFlashLabel } from '@/lib/calculations/arc-flash/label'
import { formatDistance, formatEnergy } from '@/lib/calculations/arc-flash/units'
import { downloadArcFlashPDF } from '@/lib/pdfGenerator.arcFlash'

const STANDARDS: { id: ArcFlashStandard; label: string }[] = [
  { id: 'NEC', label: 'NEC / NFPA 70E' },
  { id: 'IEC', label: 'IEC' },
]

export default function ArcFlashTool() {
  return (
    <ArcFlashErrorBoundary onReset={() => useArcFlashStore.getState().reset()}>
      <ArcFlashCalculator />
    </ArcFlashErrorBoundary>
  )
}

function ArcFlashCalculator() {
  const store = useArcFlashStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [showLabel, setShowLabel] = useState(true)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

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
      const ppe = assessPpe(result, validation.data, state.standard)
      state.setResult(result, ppe)
      const input = validation.data
      state.addToHistory({
        id: `af-${Date.now()}`,
        timestamp: result.calculatedAt,
        title: input.equipmentId || `${input.voltageV} V ${input.electrodeConfig} ${input.boltedFaultKA} kA`,
        governingEnergyCalcm2: result.governing.incidentEnergyCalcm2,
        outcome: ppe.outcome,
        input,
        result,
        ppe,
      })
    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleStandardChange = (standard: ArcFlashStandard) => {
    const state = useArcFlashStore.getState()
    state.setStandard(standard)
    // Presentation only (SC-006): re-derive the PPE wording for a current result, numbers unchanged
    if (state.result && !state.isStale) {
      state.setResult(state.result, assessPpe(state.result, selectInput(state), standard))
    }
  }

  const handleExportPDF = () => {
    const state = useArcFlashStore.getState()
    if (!state.result || !state.ppe) return
    setIsExportingPDF(true)
    try {
      downloadArcFlashPDF(selectInput(state), state.result, state.ppe, state.standard)
    } catch (err) {
      setCalculationError(err instanceof Error ? `PDF export failed: ${err.message}` : 'PDF export failed')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const values = selectInput(store)
  const fmtEnergy = (jcm2: number) => formatEnergy(jcm2, store.standard)
  const fmtDistance = (mm: number) => formatDistance(mm, store.standard)
  const label = store.result && store.ppe ? buildArcFlashLabel(values, store.result, store.ppe, store.standard) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Arc Flash Calculator</h1>
          <p className="text-muted-foreground text-sm">
            IEEE 1584-2018 incident energy &amp; arc flash boundary · NFPA 70E-2024
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Presentation standard" className="inline-flex rounded-md border p-1 gap-1">
            {STANDARDS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={store.standard === s.id}
                onClick={() => handleStandardChange(s.id)}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  store.standard === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <ArcFlashReferenceDialog />
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" /> History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!store.result || !store.ppe || store.isStale || isExportingPDF}
            title={store.isStale ? 'Recalculate before exporting' : undefined}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExportingPDF ? 'Exporting…' : 'Export PDF'}
          </Button>
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
            standard={store.standard}
            enclosure={store.enclosure ?? { heightMm: 610, widthMm: 610, depthMm: 254 }}
            errors={store.validationErrors}
            onFieldChange={store.setField}
            onEnclosureChange={store.setEnclosure}
            onElectrodeConfigChange={store.setElectrodeConfig}
            onSameTimeForBothChange={store.setSameTimeForBoth}
            onCalculate={handleCalculate}
            onReset={store.reset}
            isCalculating={isCalculating}
          >
            <div className="space-y-1 max-w-md">
              <Label htmlFor="af-equipment-class">Equipment class (pre-fills typical values)</Label>
              <Select value={store.equipmentClass} onValueChange={(v) => store.applyEquipmentClass(v as typeof store.equipmentClass)}>
                <SelectTrigger id="af-equipment-class">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  {TYPICAL_EQUIPMENT.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Typical gap, enclosure and working distance per IEEE 1584-2018 Tables 8 and 10. Editing any of them switches to Custom.
              </p>
            </div>
          </ArcFlashInputForm>
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
          formatEnergy={fmtEnergy}
          formatDistance={fmtDistance}
        />
      )}

      {store.result && store.ppe && (
        <PpeAssessmentCard
          ppe={store.ppe}
          governingEnergyJcm2={store.result.governing.incidentEnergyJcm2}
          isStale={store.isStale}
          formatEnergy={fmtEnergy}
          formatDistance={fmtDistance}
        />
      )}

      {label && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Equipment label preview</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowLabel((v) => !v)} aria-expanded={showLabel}>
              {showLabel ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showLabel ? 'Hide' : 'Show'}
            </Button>
          </CardHeader>
          {showLabel && (
            <CardContent>
              <ArcFlashLabelPreview label={label} />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Content per NFPA 70E-2024 130.5(H). Field-verify before posting.
              </p>
            </CardContent>
          )}
        </Card>
      )}

      <ArcFlashHistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  )
}
