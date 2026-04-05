import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ConduitFillState,
  ConduitFillActions,
  ConduitFillHistoryEntry,
  ConduitFillResult,
  ConduitStandard,
  ConduitTypeId,
  InsulationTypeId,
  UnitSystem,
  ConductorEntry,
} from '@/types/conduit-fill'
import {
  getConductorArea,
  getConductorAreaMm2,
  getAvailableTradeSizes,
  getConduitTypesForStandard,
} from '@/lib/calculations/conduit-fill/conduitFillData'

const HISTORY_KEY = 'electromate-conduit-fill-history'
const MAX_HISTORY = 50

const initialState: ConduitFillState = {
  standard: 'NEC',
  conduitType: 'EMT',
  tradeSize: '3/4',
  conductors: [],
  isNipple: false,
  unitSystem: 'imperial',
  projectName: '',
  projectRef: '',
  results: null,
  history: [],
}

function getHistory(): ConduitFillHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(entries: ConduitFillHistoryEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

let nextId = 1

export const useConduitFillStore = create<ConduitFillState & ConduitFillActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      history: getHistory(),

      setStandard: (std: ConduitStandard) => {
        const types = getConduitTypesForStandard(std)
        const defaultType = types[0]?.id ?? 'EMT'
        const sizes = getAvailableTradeSizes(defaultType)
        set({
          standard: std,
          conduitType: defaultType,
          tradeSize: sizes[0]?.imperial ?? '',
          conductors: [],
          unitSystem: std === 'IEC' ? 'metric' : 'imperial',
          results: null,
        })
      },

      setConduitType: (type: ConduitTypeId) => {
        const sizes = getAvailableTradeSizes(type)
        const currentSize = get().tradeSize
        const validSize = sizes.find(s => s.imperial === currentSize)
        set({
          conduitType: type,
          tradeSize: validSize ? currentSize : sizes[0]?.imperial ?? '',
          results: null,
        })
      },

      setTradeSize: (size: string) => set({ tradeSize: size, results: null }),

      addConductor: (entry) => {
        const id = `c-${Date.now()}-${nextId++}`
        let areaSqIn = 0
        let areaMm2 = 0
        try {
          areaSqIn = getConductorArea(entry.wireSize, entry.insulationType, entry.isCompact)
          areaMm2 = getConductorAreaMm2(entry.wireSize, entry.insulationType, entry.isCompact)
        } catch {
          areaSqIn = 0
          areaMm2 = 0
        }
        const newConductor: ConductorEntry = {
          ...entry,
          id,
          areaSqIn,
          areaMm2,
        }
        set((state) => ({
          conductors: [...state.conductors, newConductor],
          results: null,
        }))
      },

      updateConductor: (id: string, updates: Partial<ConductorEntry>) => {
        set((state) => {
          const conductors = state.conductors.map((c) => {
            if (c.id !== id) return c
            const updated = { ...c, ...updates }
            if (updates.wireSize !== undefined || updates.insulationType !== undefined || updates.isCompact !== undefined) {
              try {
                updated.areaSqIn = getConductorArea(
                  updated.wireSize,
                  updated.insulationType,
                  updated.isCompact
                )
                updated.areaMm2 = getConductorAreaMm2(
                  updated.wireSize,
                  updated.insulationType,
                  updated.isCompact
                )
              } catch {
                updated.areaSqIn = 0
                updated.areaMm2 = 0
              }
            }
            return updated
          })
          return { conductors, results: null }
        })
      },

      removeConductor: (id: string) => {
        set((state) => ({
          conductors: state.conductors.filter((c) => c.id !== id),
          results: null,
        }))
      },

      setNipple: (isNipple: boolean) => set({ isNipple, results: null }),

      setUnitSystem: (system: UnitSystem) => set({ unitSystem: system }),

      setProjectName: (name: string) => set({ projectName: name }),
      setProjectRef: (ref: string) => set({ projectRef: ref }),

      setResults: (results: ConduitFillResult | null) => set({ results }),

      addToHistory: (entry: ConduitFillHistoryEntry) => {
        const history = [entry, ...getHistory()].slice(0, MAX_HISTORY)
        saveHistory(history)
        set({ history })
      },

      loadFromHistory: (id: string) => {
        const history = getHistory()
        const entry = history.find((h) => h.id === id)
        if (entry) {
          set({
            ...entry.input,
            results: entry.result,
          })
        }
      },

      clearHistory: () => {
        saveHistory([])
        set({ history: [] })
      },

      reset: () => {
        set({ ...initialState, history: getHistory() })
      },
    }),
    {
      name: 'electromate-conduit-fill',
      partialize: (state) => ({
        standard: state.standard,
        conduitType: state.conduitType,
        tradeSize: state.tradeSize,
        isNipple: state.isNipple,
        unitSystem: state.unitSystem,
        projectName: state.projectName,
        projectRef: state.projectRef,
      }),
    }
  )
)
