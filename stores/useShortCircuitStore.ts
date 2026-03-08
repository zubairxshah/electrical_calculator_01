import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ShortCircuitState,
  ShortCircuitActions,
  ShortCircuitHistoryEntry,
  ShortCircuitStandard,
  SystemPhase,
  SystemGrounding,
  FaultType,
  ShortCircuitCalculationResults,
} from '@/types/short-circuit'

const HISTORY_KEY = 'electromate-short-circuit-history'
const MAX_HISTORY = 50

const initialState: ShortCircuitState = {
  standard: 'IEC',
  phase: 'three-phase',
  systemVoltage: 415,
  frequency: 50,
  grounding: 'solidly-grounded',
  utilityFaultMVA: 500,
  utilityXRRatio: 10,
  hasTransformer: true,
  transformerKVA: 1000,
  transformerImpedancePercent: 5,
  transformerXRRatio: 5,
  hasMotorContribution: false,
  totalMotorHP: 0,
  motorType: 'induction',
  hasCableImpedance: false,
  cableLength: 0,
  cableResistance: 0.193,
  cableReactance: 0.08,
  conductorsPerPhase: 1,
  faultTypes: ['three-phase', 'single-line-to-ground'],
  projectName: '',
  projectLocation: '',
  engineerName: '',
  results: null,
  showHistorySidebar: false,
}

function getHistory(): ShortCircuitHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(entries: ShortCircuitHistoryEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

export const useShortCircuitStore = create<ShortCircuitState & ShortCircuitActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStandard: (v: ShortCircuitStandard) => set({ standard: v, results: null }),
      setPhase: (v: SystemPhase) => set({ phase: v, results: null }),
      setSystemVoltage: (v: number) => set({ systemVoltage: v, results: null }),
      setFrequency: (v: number) => set({ frequency: v, results: null }),
      setGrounding: (v: SystemGrounding) => set({ grounding: v, results: null }),
      setUtilityFaultMVA: (v: number) => set({ utilityFaultMVA: v, results: null }),
      setUtilityXRRatio: (v: number) => set({ utilityXRRatio: v, results: null }),
      setHasTransformer: (v: boolean) => set({ hasTransformer: v, results: null }),
      setTransformerKVA: (v: number) => set({ transformerKVA: v, results: null }),
      setTransformerImpedancePercent: (v: number) => set({ transformerImpedancePercent: v, results: null }),
      setTransformerXRRatio: (v: number) => set({ transformerXRRatio: v, results: null }),
      setHasMotorContribution: (v: boolean) => set({ hasMotorContribution: v, results: null }),
      setTotalMotorHP: (v: number) => set({ totalMotorHP: v, results: null }),
      setMotorType: (v: 'induction' | 'synchronous' | 'mixed') => set({ motorType: v, results: null }),
      setHasCableImpedance: (v: boolean) => set({ hasCableImpedance: v, results: null }),
      setCableLength: (v: number) => set({ cableLength: v, results: null }),
      setCableResistance: (v: number) => set({ cableResistance: v, results: null }),
      setCableReactance: (v: number) => set({ cableReactance: v, results: null }),
      setConductorsPerPhase: (v: number) => set({ conductorsPerPhase: v, results: null }),
      setFaultTypes: (v: FaultType[]) => set({ faultTypes: v, results: null }),
      setProjectName: (v: string) => set({ projectName: v }),
      setProjectLocation: (v: string) => set({ projectLocation: v }),
      setEngineerName: (v: string) => set({ engineerName: v }),
      setResults: (r: ShortCircuitCalculationResults | null) => set({ results: r }),
      setShowHistorySidebar: (v: boolean) => set({ showHistorySidebar: v }),

      saveToHistory: () => {
        const state = get()
        if (!state.results) return
        const entry: ShortCircuitHistoryEntry = {
          id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          input: {
            standard: state.standard,
            phase: state.phase,
            systemVoltage: state.systemVoltage,
            frequency: state.frequency,
            grounding: state.grounding,
            utilityFaultMVA: state.utilityFaultMVA,
            utilityXRRatio: state.utilityXRRatio,
            hasTransformer: state.hasTransformer,
            transformerKVA: state.transformerKVA,
            transformerImpedancePercent: state.transformerImpedancePercent,
            transformerXRRatio: state.transformerXRRatio,
            hasMotorContribution: state.hasMotorContribution,
            totalMotorHP: state.totalMotorHP,
            motorType: state.motorType,
            hasCableImpedance: state.hasCableImpedance,
            cableLength: state.cableLength,
            cableResistance: state.cableResistance,
            cableReactance: state.cableReactance,
            conductorsPerPhase: state.conductorsPerPhase,
            faultTypes: state.faultTypes,
          },
          project: {
            projectName: state.projectName,
            projectLocation: state.projectLocation,
            engineerName: state.engineerName,
          },
          results: state.results,
        }
        const history = getHistory()
        history.unshift(entry)
        saveHistory(history)
      },

      loadFromHistory: (id: string) => {
        const entry = getHistory().find(h => h.id === id)
        if (!entry) return
        set({ ...entry.input, ...entry.project, results: entry.results })
      },

      deleteFromHistory: (id: string) => {
        saveHistory(getHistory().filter(h => h.id !== id))
      },

      getHistory: () => getHistory(),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'electromate-short-circuit',
      partialize: (state) => ({
        standard: state.standard,
        phase: state.phase,
        systemVoltage: state.systemVoltage,
        frequency: state.frequency,
        grounding: state.grounding,
        utilityFaultMVA: state.utilityFaultMVA,
        utilityXRRatio: state.utilityXRRatio,
        hasTransformer: state.hasTransformer,
        transformerKVA: state.transformerKVA,
        transformerImpedancePercent: state.transformerImpedancePercent,
        transformerXRRatio: state.transformerXRRatio,
        hasMotorContribution: state.hasMotorContribution,
        totalMotorHP: state.totalMotorHP,
        motorType: state.motorType,
        hasCableImpedance: state.hasCableImpedance,
        cableLength: state.cableLength,
        cableResistance: state.cableResistance,
        cableReactance: state.cableReactance,
        conductorsPerPhase: state.conductorsPerPhase,
        faultTypes: state.faultTypes,
        projectName: state.projectName,
        projectLocation: state.projectLocation,
        engineerName: state.engineerName,
      }),
    }
  )
)
