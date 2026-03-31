import { create } from 'zustand'
import type {
  GeneratorSizingState,
  GeneratorSizingActions,
  LoadItem,
  GeneratorConfig,
  SiteConditions,
  FuelConfig,
  SizingResult,
  GeneratorSizingHistoryEntry,
} from '@/types/generator-sizing'

const MAX_HISTORY = 50
const HISTORY_KEY = 'electromate-generator-sizing-history'

function getHistory(): GeneratorSizingHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(entries: GeneratorSizingHistoryEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

const defaultGeneratorConfig: GeneratorConfig = {
  dutyType: 'standby',
  primeLoadingLimit: 0.70,
  voltage: 480,
  phases: 'three',
  frequency: 60,
  subtransientReactance: 0.15,
  fuelType: 'diesel',
  necClassification: null,
}

const defaultSiteConditions: SiteConditions = {
  altitude: 0,
  altitudeUnit: 'm',
  ambientTemperature: 25,
  temperatureUnit: 'C',
}

const defaultFuelConfig: FuelConfig = {
  requiredRuntime: 24,
  averageLoadingPercent: 75,
  volumeUnit: 'liters',
}

const initialState: GeneratorSizingState = {
  loads: [],
  generatorConfig: { ...defaultGeneratorConfig },
  siteConditions: { ...defaultSiteConditions },
  fuelConfig: { ...defaultFuelConfig },
  voltageDipThreshold: 15,
  result: null,
  history: [],
}

export const useGeneratorSizingStore = create<GeneratorSizingState & GeneratorSizingActions>()(
  (set, get) => ({
    ...initialState,
    history: getHistory(),

    // ── Load management ────────────────────────────────────────────
    addLoad: (load: LoadItem) =>
      set((state) => ({ loads: [...state.loads, load] })),

    updateLoad: (id: string, updates: Partial<LoadItem>) =>
      set((state) => ({
        loads: state.loads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      })),

    removeLoad: (id: string) =>
      set((state) => ({ loads: state.loads.filter((l) => l.id !== id) })),

    clearLoads: () => set({ loads: [], result: null }),

    // ── Config ─────────────────────────────────────────────────────
    setGeneratorConfig: (config: Partial<GeneratorConfig>) =>
      set((state) => ({
        generatorConfig: { ...state.generatorConfig, ...config },
      })),

    setSiteConditions: (conditions: Partial<SiteConditions>) =>
      set((state) => ({
        siteConditions: { ...state.siteConditions, ...conditions },
      })),

    setFuelConfig: (config: Partial<FuelConfig>) =>
      set((state) => ({
        fuelConfig: { ...state.fuelConfig, ...config },
      })),

    setVoltageDipThreshold: (threshold: number) =>
      set({ voltageDipThreshold: threshold }),

    // ── Results ────────────────────────────────────────────────────
    setResult: (result: SizingResult | null) => set({ result }),

    // ── History ────────────────────────────────────────────────────
    saveToHistory: (label: string) => {
      const state = get()
      if (!state.result) return
      const entry: GeneratorSizingHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        label,
        loads: [...state.loads],
        config: { ...state.generatorConfig },
        siteConditions: { ...state.siteConditions },
        fuelConfig: state.fuelConfig ? { ...state.fuelConfig } : null,
        result: state.result,
      }
      const updated = [entry, ...state.history].slice(0, MAX_HISTORY)
      saveHistory(updated)
      set({ history: updated })
    },

    loadFromHistory: (id: string) => {
      const state = get()
      const entry = state.history.find((h) => h.id === id)
      if (!entry) return
      set({
        loads: [...entry.loads],
        generatorConfig: { ...entry.config },
        siteConditions: { ...entry.siteConditions },
        fuelConfig: entry.fuelConfig ? { ...entry.fuelConfig } : { ...defaultFuelConfig },
        result: entry.result,
      })
    },

    removeFromHistory: (id: string) => {
      const state = get()
      const updated = state.history.filter((h) => h.id !== id)
      saveHistory(updated)
      set({ history: updated })
    },

    clearHistory: () => {
      saveHistory([])
      set({ history: [] })
    },

    // ── Reset ──────────────────────────────────────────────────────
    reset: () =>
      set({
        loads: [],
        generatorConfig: { ...defaultGeneratorConfig },
        siteConditions: { ...defaultSiteConditions },
        fuelConfig: { ...defaultFuelConfig },
        voltageDipThreshold: 15,
        result: null,
      }),
  })
)
