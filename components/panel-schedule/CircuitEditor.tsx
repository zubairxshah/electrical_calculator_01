'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import type { Circuit, LoadCategory, LoadUnit, PanelStandard, Poles, SystemDefinition } from '@/types/panel-schedule'
import { CATEGORY_DEFAULT_CONTINUOUS, CATEGORY_LABELS, LOAD_CATEGORIES } from '@/lib/calculations/panel-schedule/defaults'
import { validateCircuit } from '@/lib/validation/panelScheduleValidation'
import NumberField from './NumberField'

export type CircuitDraft = Omit<Circuit, 'id'> & { id?: string }

interface Props {
  open: boolean
  /** Circuit being edited, or a new draft */
  initial: CircuitDraft | null
  standard: PanelStandard
  system: SystemDefinition
  spaces: number
  onSave: (draft: CircuitDraft) => string | null
  onClose: () => void
}

export function newDraft(standard: PanelStandard): CircuitDraft {
  return {
    kind: 'load',
    description: '',
    category: 'receptacle',
    loadValue: 1000,
    loadUnit: 'VA',
    powerFactor: 1,
    efficiency: 0.9,
    continuous: false,
    poles: 1,
    breakerA: standard === 'NEC' ? 20 : 16,
    startSpace: null,
    locked: false,
    notes: '',
  }
}

const UNITS: LoadUnit[] = ['VA', 'kVA', 'W', 'kW', 'HP']

export default function CircuitEditor({ open, initial, standard, system, spaces, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<CircuitDraft | null>(initial)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(initial)
    setSaveError(null)
  }, [initial])

  if (!draft) return null
  const set = (patch: Partial<CircuitDraft>) => setDraft({ ...draft, ...patch })
  const fieldErrors = validateCircuit({ ...draft, id: draft.id ?? 'draft' })
  const err = (path: string) => fieldErrors.find((e) => e.path === path)?.message
  const isLoad = draft.kind === 'load'
  const isMotor = draft.category === 'motor'
  const poleOptions = ([1, 2, 3] as Poles[]).filter((p) => p <= system.maxPoles)

  const onCategory = (category: LoadCategory) => {
    const motor = category === 'motor'
    set({
      category,
      continuous: CATEGORY_DEFAULT_CONTINUOUS[category],
      loadUnit: motor ? (standard === 'NEC' ? 'HP' : 'kW') : draft.loadUnit === 'HP' ? 'VA' : draft.loadUnit,
      powerFactor: motor && standard === 'IEC' ? 0.85 : draft.powerFactor,
      poles: motor && system.maxPoles === 3 ? 3 : draft.poles,
    })
  }

  const save = () => {
    if (fieldErrors.length > 0) {
      setSaveError('Fix the highlighted fields first')
      return
    }
    const problem = onSave(draft)
    if (problem) setSaveError(problem)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft.id ? 'Edit circuit' : 'Add circuit'}</DialogTitle>
          <DialogDescription>Leave the space empty to place the circuit in the first free position.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ce-kind">Type</Label>
            <Select value={draft.kind} onValueChange={(v) => set({ kind: v as Circuit['kind'], ...(v === 'space' ? { breakerA: null } : draft.breakerA === null ? { breakerA: 20 } : {}) })}>
              <SelectTrigger id="ce-kind"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="load">Load circuit</SelectItem>
                <SelectItem value="spare">SPARE (breaker, no load)</SelectItem>
                <SelectItem value="space">SPACE (no breaker)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ce-desc">Description</Label>
            <Input id="ce-desc" value={draft.description} maxLength={60} onChange={(e) => set({ description: e.target.value })}
              placeholder={isLoad ? 'e.g. Receptacles — Room 101' : draft.kind === 'spare' ? 'SPARE' : 'SPACE'} />
          </div>

          {isLoad && (
            <>
              <div className="space-y-1">
                <Label htmlFor="ce-cat">Load category</Label>
                <Select value={draft.category} onValueChange={(v) => onCategory(v as LoadCategory)}>
                  <SelectTrigger id="ce-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOAD_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
                <NumberField id="ce-load" label="Load" value={draft.loadValue} onChange={(v) => set({ loadValue: v ?? Number.NaN })} error={err('loadValue')} />
                <div className="space-y-1">
                  <Label htmlFor="ce-unit">Unit</Label>
                  <Select value={draft.loadUnit} onValueChange={(v) => set({ loadUnit: v as LoadUnit })}>
                    <SelectTrigger id="ce-unit" className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.filter((u) => u !== 'HP' || isMotor).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(draft.loadUnit === 'W' || draft.loadUnit === 'kW' || (isMotor && standard === 'IEC')) && (
                <NumberField id="ce-pf" label="Power factor" value={draft.powerFactor} step={0.01}
                  onChange={(v) => set({ powerFactor: v ?? Number.NaN })} error={err('powerFactor')} />
              )}
              {isMotor && standard === 'IEC' && (
                <NumberField id="ce-eff" label="Efficiency" value={draft.efficiency} step={0.01}
                  onChange={(v) => set({ efficiency: v ?? Number.NaN })} error={err('efficiency')} />
              )}
              {isMotor && standard === 'NEC' && draft.loadUnit === 'HP' && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Motor VA uses NEC Table {draft.poles === 3 ? '430.250' : '430.248'} full-load current (NEC 430.6(A)(1)), not the nameplate.
                </p>
              )}
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="ce-poles">Poles</Label>
            <Select value={String(draft.poles)} onValueChange={(v) => set({ poles: Number(v) as Poles })}>
              <SelectTrigger id="ce-poles"><SelectValue /></SelectTrigger>
              <SelectContent>
                {poleOptions.map((p) => <SelectItem key={p} value={String(p)}>{p}-pole</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {draft.kind !== 'space' && (
            <NumberField id="ce-breaker" label="Breaker" unit="A" value={draft.breakerA} nullable
              onChange={(v) => set({ breakerA: v })} error={err('breakerA')} />
          )}
          <NumberField id="ce-space" label="Start space" value={draft.startSpace} nullable step={1}
            hint={`1–${spaces}; empty = auto. Multi-pole uses n, n+2${draft.poles === 3 ? ', n+4' : ''}`}
            onChange={(v) => set({ startSpace: v === null ? null : Math.round(v) })} error={err('startSpace')} />

          {isLoad && (
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="ce-cont" checked={draft.continuous} disabled={isMotor}
                onCheckedChange={(v) => set({ continuous: v === true })} />
              <Label htmlFor="ce-cont" className="font-normal">
                Continuous load (≥ 3 h){isMotor && <span className="text-muted-foreground"> — motors use 430.24</span>}
              </Label>
            </div>
          )}
          <div className="flex items-center gap-2 pt-6">
            <Checkbox id="ce-lock" checked={draft.locked} onCheckedChange={(v) => set({ locked: v === true })} />
            <Label htmlFor="ce-lock" className="font-normal">Lock position (balancing will not move it)</Label>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="ce-notes">Notes</Label>
            <Input id="ce-notes" value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </div>

        {saveError && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {saveError}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{draft.id ? 'Save' : 'Add circuit'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
