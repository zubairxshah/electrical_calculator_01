import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Circuit, Panel, PanelHistoryEntry, PanelScheduleActions, PanelScheduleState, PanelStandard, PlacementIssue,
} from '@/types/panel-schedule'
import { getSystem } from '@/lib/calculations/panel-schedule/system'
import { autoPlace, validatePlacement } from '@/lib/calculations/panel-schedule/placement'
import { applyProposal, proposeBalance } from '@/lib/calculations/panel-schedule/balance'
import { DEFAULT_IEC_DIVERSITY } from '@/lib/calculations/panel-schedule/defaults'

const HISTORY_KEY = 'electromate-panel-schedule-history'
const MAX_HISTORY = 50

export function newCircuitId(): string {
  return `ckt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export const initialPanel: Panel = {
  name: 'LP-1',
  location: '',
  fedFrom: '',
  mounting: 'Surface',
  standard: 'NEC',
  systemType: 'nec-3ph-4w-208y120',
  customSystem: null,
  busRatingA: 225,
  mainType: 'main-breaker',
  mainRatingA: 200,
  spaces: 42,
  sccrKA: 10,
  imbalanceTargetPct: 10,
  occupancy: 'other',
  iecDiversity: { ...DEFAULT_IEC_DIVERSITY },
  iecApplyRdf: false,
  iecLargestMotorAdder: true,
  circuits: [],
}

const base = (c: Partial<Circuit> & Pick<Circuit, 'description' | 'loadValue'>): Circuit => ({
  id: newCircuitId(),
  kind: 'load',
  category: 'other-noncontinuous',
  loadUnit: 'VA',
  powerFactor: 1,
  efficiency: 0.9,
  continuous: false,
  poles: 1,
  breakerA: 20,
  startSpace: null,
  locked: false,
  notes: '',
  ...c,
})

/** Quickstart Worked Example A (208Y/120 V) plus a spare and a space */
export function examplePanel(): Panel {
  return {
    ...initialPanel,
    name: 'LP-1',
    location: 'Electrical Room 101',
    fedFrom: 'MDP',
    circuits: [
      base({ description: 'Lighting — Office', category: 'lighting', continuous: true, loadValue: 1200, startSpace: 1 }),
      base({ description: 'Receptacles — Office', category: 'receptacle', loadValue: 1440, startSpace: 2 }),
      base({ description: 'Water heater', category: 'water-heater', continuous: true, loadValue: 4800, poles: 2, breakerA: 30, startSpace: 3 }),
      base({ description: 'Receptacles — Corridor', category: 'receptacle', loadValue: 1800, startSpace: 4 }),
      base({ description: 'Copier', loadValue: 1000, startSpace: 6 }),
      base({ description: 'RTU-1', category: 'hvac-cooling', loadValue: 15000, poles: 3, breakerA: 60, startSpace: 7 }),
      base({ description: 'Spare', kind: 'spare', loadValue: 0, startSpace: 8 }),
      base({ description: '', kind: 'space', loadValue: 0, breakerA: null, startSpace: 10 }),
    ],
  }
}

function getHistory(): PanelHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(entries: PanelHistoryEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
  } catch {
    // Storage full or unavailable — history is a convenience, never block the schedule
  }
}

/** The panel data in the store (no actions, no transient proposal) */
export function selectPanel(state: PanelScheduleState): Panel {
  return stripActions(state)
}

/** Placement problem a circuit would cause in the given list, or null if it fits. */
function placementIssue(panel: Panel, circuits: Circuit[], id: string): PlacementIssue | null {
  const system = getSystem(panel)
  return validatePlacement(circuits, panel.spaces, system).find((i) => i.circuitId === id) ?? null
}

interface HistoryActions {
  history: PanelHistoryEntry[]
  refreshHistory: () => void
  saveToHistory: (name?: string) => void
  deleteFromHistory: (id: string) => void
  clearHistory: () => void
}

export const usePanelScheduleStore = create<PanelScheduleState & PanelScheduleActions & HistoryActions>()(
  persist(
    (set, get) => {
      /** Auto-place, validate one circuit, commit when it fits */
      const commitCircuits = (circuits: Circuit[], id: string): PlacementIssue | null => {
        const panel = selectPanel(get())
        const system = getSystem(panel)
        const placed = autoPlace(circuits, panel.spaces, system)
        if (placed.unplaced.includes(id)) {
          return { code: 'NO_FREE_SPACE', circuitId: id, message: 'No free space fits this circuit — increase the panel size or free some spaces' }
        }
        const issue = placementIssue(panel, placed.circuits, id)
        if (issue) return issue
        set({ circuits: placed.circuits, proposal: null })
        return null
      }

      return {
        ...initialPanel,
        proposal: null,
        history: [],

        setPanelField: (key, value) => set({ [key]: value, proposal: null } as Partial<PanelScheduleState>),

        setStandard: (standard: PanelStandard) => {
          if (get().standard === standard) return
          set({
            standard,
            systemType: standard === 'NEC' ? 'nec-3ph-4w-208y120' : 'iec-3ph-4w-400y230',
            customSystem: null,
            proposal: null,
          })
        },

        addCircuit: (circuit) => {
          const id = newCircuitId()
          return commitCircuits([...get().circuits, { ...circuit, id }], id)
        },

        updateCircuit: (id, patch) => {
          const circuits = get().circuits.map((c) => (c.id === id ? { ...c, ...patch, id } : c))
          return commitCircuits(circuits, id)
        },

        duplicateCircuit: (id) => {
          const src = get().circuits.find((c) => c.id === id)
          if (!src) return null
          const copy: Circuit = { ...src, id: newCircuitId(), startSpace: null, locked: false }
          return commitCircuits([...get().circuits, copy], copy.id)
        },

        removeCircuit: (id) => set({ circuits: get().circuits.filter((c) => c.id !== id), proposal: null }),

        toggleLock: (id) =>
          set({ circuits: get().circuits.map((c) => (c.id === id ? { ...c, locked: !c.locked } : c)), proposal: null }),

        setIecDiversity: (category, factor) =>
          set({ iecDiversity: { ...get().iecDiversity, [category]: factor } }),

        clearPanel: () => set({ ...initialPanel, iecDiversity: { ...DEFAULT_IEC_DIVERSITY }, proposal: null }),

        loadExample: () => set({ ...examplePanel(), proposal: null }),

        loadPanel: (panel) => set({ ...initialPanel, ...panel, proposal: null }),

        runBalance: () => set({ proposal: proposeBalance(selectPanel(get())) }),

        acceptProposal: () => {
          const { proposal } = get()
          if (!proposal) return
          set({ circuits: applyProposal(selectPanel(get()), proposal).circuits, proposal: null })
        },

        discardProposal: () => set({ proposal: null }),

        refreshHistory: () => set({ history: getHistory() }),

        saveToHistory: (name) => {
          const panel = selectPanel(get())
          const entry: PanelHistoryEntry = {
            id: `ps-${Date.now()}`,
            savedAt: new Date().toISOString(),
            name: name?.trim() || panel.name || 'Untitled panel',
            panel,
          }
          const entries = [entry, ...getHistory()].slice(0, MAX_HISTORY)
          saveHistory(entries)
          set({ history: entries })
        },

        deleteFromHistory: (id) => {
          const entries = getHistory().filter((e) => e.id !== id)
          saveHistory(entries)
          set({ history: entries })
        },

        clearHistory: () => {
          saveHistory([])
          set({ history: [] })
        },
      }
    },
    {
      name: 'electromate-panel-schedule',
      version: 1,
      partialize: (state) => selectPanel(state),
    },
  ),
)

/** Keep only Panel data fields (drops store functions and transient state) */
function stripActions(p: Panel): Panel {
  return {
    name: p.name, location: p.location, fedFrom: p.fedFrom, mounting: p.mounting,
    standard: p.standard, systemType: p.systemType, customSystem: p.customSystem,
    busRatingA: p.busRatingA, mainType: p.mainType, mainRatingA: p.mainRatingA, spaces: p.spaces,
    sccrKA: p.sccrKA, imbalanceTargetPct: p.imbalanceTargetPct, occupancy: p.occupancy,
    iecDiversity: p.iecDiversity, iecApplyRdf: p.iecApplyRdf, iecLargestMotorAdder: p.iecLargestMotorAdder,
    circuits: p.circuits,
  }
}
