'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Download, FilePlus2, History, Plus, Scale, Trash2, Info } from 'lucide-react'
import type { PanelStandard } from '@/types/panel-schedule'
import { usePanelScheduleStore, selectPanel } from '@/stores/usePanelScheduleStore'
import { calculateSchedule } from '@/lib/calculations/panel-schedule/schedule'
import { calculateDemand } from '@/lib/calculations/panel-schedule/demand'
import { validatePanel } from '@/lib/validation/panelScheduleValidation'
import { downloadPanelSchedulePDF } from '@/lib/pdfGenerator.panelSchedule'
import PanelHeaderForm from '@/components/panel-schedule/PanelHeaderForm'
import PanelScheduleGrid from '@/components/panel-schedule/PanelScheduleGrid'
import PhaseSummaryCard from '@/components/panel-schedule/PhaseSummaryCard'
import DemandCard from '@/components/panel-schedule/DemandCard'
import BalanceDialog from '@/components/panel-schedule/BalanceDialog'
import CircuitEditor, { newDraft, type CircuitDraft } from '@/components/panel-schedule/CircuitEditor'
import PanelHistorySidebar from '@/components/panel-schedule/PanelHistorySidebar'
import PanelReferenceDialog from '@/components/panel-schedule/PanelReferenceDialog'
import PanelScheduleErrorBoundary from '@/components/panel-schedule/PanelScheduleErrorBoundary'

const STANDARDS: { id: PanelStandard; label: string }[] = [
  { id: 'NEC', label: 'NEC' },
  { id: 'IEC', label: 'IEC' },
]

export default function PanelScheduleTool() {
  return (
    <PanelScheduleErrorBoundary onReset={() => usePanelScheduleStore.getState().clearPanel()}>
      <PanelScheduleCalculator />
    </PanelScheduleErrorBoundary>
  )
}

function PanelScheduleCalculator() {
  const store = usePanelScheduleStore()
  const [editing, setEditing] = useState<CircuitDraft | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const panel = useMemo(() => selectPanel(store), [store])
  const validation = useMemo(() => validatePanel(panel), [panel])
  const schedule = useMemo(() => calculateSchedule(panel), [panel])
  const demand = useMemo(() => calculateDemand(panel, schedule), [panel, schedule])
  const headerErrors = validation.errors.filter((e) => !e.path.startsWith('circuits.') && e.path !== 'placement')
  const invalidIds = new Set(schedule.issues.map((i) => i.circuitId))
  const circuitErrors = validation.errors.filter((e) => e.path.startsWith('circuits.') || e.path === 'placement')
  const canExport = headerErrors.length === 0 && circuitErrors.length === 0

  const openNew = (startSpace: number | null = null) => {
    const { standard } = usePanelScheduleStore.getState()
    setEditing({ ...newDraft(standard), startSpace })
  }

  const openEdit = (id: string) => {
    const c = usePanelScheduleStore.getState().circuits.find((x) => x.id === id)
    if (c) setEditing({ ...c })
  }

  const saveDraft = (draft: CircuitDraft): string | null => {
    const state = usePanelScheduleStore.getState()
    const { id, ...rest } = draft
    const issue = id ? state.updateCircuit(id, rest) : state.addCircuit(rest)
    if (issue) return issue.message
    setEditing(null)
    return null
  }

  const handleExport = () => {
    setExportError(null)
    try {
      const p = selectPanel(usePanelScheduleStore.getState())
      const s = calculateSchedule(p)
      downloadPanelSchedulePDF(p, s, calculateDemand(p, s))
    } catch (err) {
      setExportError(err instanceof Error ? `PDF export failed: ${err.message}` : 'PDF export failed')
    }
  }

  const handleClear = () => {
    if (window.confirm('Clear the current panel and all its circuits?')) usePanelScheduleStore.getState().clearPanel()
  }

  const loadCount = panel.circuits.filter((c) => c.kind === 'load').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Panel Schedule &amp; Load Balancing</h1>
          <p className="text-muted-foreground text-sm">
            {panel.standard === 'NEC'
              ? 'NEC 2020 Article 220 demand · 408.3(E) phase arrangement · 430.24 motors'
              : 'IEC 60364 diversity · IEC 61439-2 rated diversity factor'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Standard" className="inline-flex rounded-md border p-1 gap-1">
            {STANDARDS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={store.standard === s.id}
                onClick={() => usePanelScheduleStore.getState().setStandard(s.id)}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  store.standard === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <PanelReferenceDialog />
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" /> Saved
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!canExport}
            title={canExport ? undefined : 'Fix the errors in the panel before exporting'}>
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
          <CardTitle>Panel</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => usePanelScheduleStore.getState().loadExample()}>
              <FilePlus2 className="h-4 w-4 mr-2" /> Load example
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PanelHeaderForm panel={panel} errors={headerErrors} onFieldChange={store.setPanelField} />
        </CardContent>
      </Card>

      {exportError && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {exportError}
        </div>
      )}

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="demand">Demand &amp; main</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
              <CardTitle>Circuits ({loadCount})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => usePanelScheduleStore.getState().runBalance()} disabled={loadCount === 0}>
                  <Scale className="h-4 w-4 mr-2" /> Balance phases
                </Button>
                <Button size="sm" onClick={() => openNew()}>
                  <Plus className="h-4 w-4 mr-2" /> Add circuit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {circuitErrors.length > 0 && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <ul className="list-disc pl-4">
                    {circuitErrors.map((e, i) => <li key={`${e.circuitId}-${i}`}>{e.message}</li>)}
                  </ul>
                </div>
              )}
              {validation.warnings.filter((w) => w.path === 'placement').length > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <ul className="list-disc pl-4">
                    {validation.warnings.filter((w) => w.path === 'placement').map((w, i) => <li key={i}>{w.message}</li>)}
                  </ul>
                </div>
              )}
              <PanelScheduleGrid
                circuits={panel.circuits}
                loads={schedule.circuitLoads}
                system={schedule.system}
                spaces={panel.spaces}
                invalidIds={invalidIds}
                onEdit={openEdit}
                onAddAt={(space) => openNew(space)}
                onDuplicate={(id) => {
                  const issue = usePanelScheduleStore.getState().duplicateCircuit(id)
                  if (issue) window.alert(issue.message)
                }}
                onDelete={(id) => usePanelScheduleStore.getState().removeCircuit(id)}
                onToggleLock={(id) => usePanelScheduleStore.getState().toggleLock(id)}
              />
              <p className="text-xs text-muted-foreground">
                Click a description to edit. Use <strong>Lock position</strong> to keep a circuit in place when balancing.
              </p>
            </CardContent>
          </Card>

          <PhaseSummaryCard summary={schedule.summary} system={schedule.system} targetPct={panel.imbalanceTargetPct} warnings={schedule.warnings} />
        </TabsContent>

        <TabsContent value="demand">
          <DemandCard
            panel={panel}
            demand={demand}
            onDiversityChange={store.setIecDiversity}
            onFieldChange={store.setPanelField}
          />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Calculations are for informational purposes; verify demand factors and ratings against the code edition adopted
        by your AHJ. PE stamp/certification is the user&apos;s responsibility.
      </p>

      <CircuitEditor
        open={editing !== null}
        initial={editing}
        standard={panel.standard}
        system={schedule.system}
        spaces={panel.spaces}
        onSave={saveDraft}
        onClose={() => setEditing(null)}
      />
      <BalanceDialog
        proposal={store.proposal}
        circuits={panel.circuits}
        onAccept={() => usePanelScheduleStore.getState().acceptProposal()}
        onDiscard={() => usePanelScheduleStore.getState().discardProposal()}
      />
      <PanelHistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  )
}
