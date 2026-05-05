'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'
import MotorInputForm from '@/components/motor-starting/MotorInputForm'
import LoadInputForm from '@/components/motor-starting/LoadInputForm'
import SourceImpedanceForm from '@/components/motor-starting/SourceImpedanceForm'
import MethodConfigForm from '@/components/motor-starting/MethodConfigForm'
import SingleMethodResults from '@/components/motor-starting/SingleMethodResults'
import ComparisonTable from '@/components/motor-starting/ComparisonTable'
import StartingCurrentChart from '@/components/motor-starting/StartingCurrentChart'
import VoltageDipIndicator from '@/components/motor-starting/VoltageDipIndicator'
import HistorySidebar from '@/components/motor-starting/HistorySidebar'
import ReferenceGuideDialog from '@/components/motor-starting/ReferenceGuideDialog'
import { generateMotorStartingPdf } from '@/lib/pdfGenerator.motorStarting'
import type { Standard, DipScenario } from '@/types/motor-starting'

export default function MotorStartingTool() {
  const {
    currentInput,
    currentResult,
    lastError,
    setStandard,
    setVoltageDipScenario,
    analyze,
    saveCurrentToHistory,
    toggleReferenceGuide,
    resetInput,
  } = useMotorStartingStore()
  const [tab, setTab] = useState<'comparison' | 'single' | 'charts'>('comparison')

  const handleAnalyze = () => {
    const r = analyze()
    if (r) setTab('comparison')
  }

  const handleExportPdf = () => {
    if (!currentResult) return
    try {
      const pdf = generateMotorStartingPdf(currentResult)
      const filename = `motor-starting-${currentResult.input.projectRef ?? Date.now()}.pdf`
      pdf.save(filename)
    } catch (e) {
      console.error('PDF export failed:', e)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Motor Starting Analysis</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            DOL · Star-Delta · Autotransformer · Soft Starter · VFD — IEEE 3002.7-2018, IEEE 1668, NEC 430, IEC 60034-12
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Standard</Label>
            <Select value={currentInput.standard} onValueChange={(v) => setStandard(v as Standard)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NEC">NEC</SelectItem>
                <SelectItem value="IEC">IEC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Dip Scenario</Label>
            <Select value={currentInput.voltageDipScenario} onValueChange={(v) => setVoltageDipScenario(v as DipScenario)}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="steady_state_common">Steady-state (10%)</SelectItem>
                <SelectItem value="transient_motor_start">Transient motor start (20%)</SelectItem>
                <SelectItem value="sensitive_loads">Sensitive loads (5%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => toggleReferenceGuide(true)}>
            Reference Guide
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">History</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96 p-0">
              <HistorySidebar />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-lg border p-4">
            <MotorInputForm />
          </div>
          <div className="rounded-lg border p-4">
            <LoadInputForm />
          </div>
          <div className="rounded-lg border p-4">
            <SourceImpedanceForm />
          </div>
          <div className="rounded-lg border p-4">
            <MethodConfigForm />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAnalyze} className="flex-1 min-w-32">Compare Methods</Button>
            <Button variant="outline" onClick={saveCurrentToHistory} disabled={!currentResult}>Save</Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={!currentResult}>Export PDF</Button>
            <Button variant="ghost" onClick={resetInput}>Reset</Button>
          </div>
          {lastError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {lastError}
            </div>
          )}
        </div>

        {/* Right column: results */}
        <div className="lg:col-span-7">
          {!currentResult ? (
            <div className="rounded-lg border p-12 text-center text-muted-foreground">
              Enter motor + source data, then click <strong>Compare Methods</strong>.
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="single">Single Method</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
              </TabsList>
              <TabsContent value="comparison" className="space-y-4 pt-4">
                <ComparisonTable />
              </TabsContent>
              <TabsContent value="single" className="space-y-4 pt-4">
                <SingleMethodResults />
              </TabsContent>
              <TabsContent value="charts" className="space-y-4 pt-4">
                <StartingCurrentChart />
                <VoltageDipIndicator />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <ReferenceGuideDialog />
    </div>
  )
}
