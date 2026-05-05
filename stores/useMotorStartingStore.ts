'use client'

import { create } from 'zustand'
import type {
  Load,
  MethodConfig,
  Motor,
  MotorStartingHistoryEntry,
  MotorStartingInput,
  MotorStartingResult,
  SourceChain,
  StartingMethodId,
  Standard,
} from '@/types/motor-starting'
import { analyzeMotorStarting } from '@/lib/calculations/motor-starting/motorStartingCalculator'

const HISTORY_KEY = 'electromate.motor-starting.v1'
const MAX_HISTORY = 50

function loadHistory(): MotorStartingHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.history) ? parsed.history : []
  } catch {
    return []
  }
}

function saveHistory(entries: MotorStartingHistoryEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ history: entries.slice(0, MAX_HISTORY) }))
  } catch {
    // ignore quota errors
  }
}

const defaultMotor: Motor = {
  ratedPower: 100,
  powerUnit: 'HP',
  ratedVoltage: 460,
  ratedCurrent: 124,
  poles: 4,
  efficiency: 0.93,
  powerFactor: 0.86,
  serviceFactor: 1.15,
  designClass: 'B',
  codeLetter: 'G',
}

const defaultLoad: Load = {
  torqueProfile: 'quadratic_fan_pump',
  breakawayTorquePerRated: 0.20,
  inertia: 45,
  inertiaUnit: 'lb_ft2',
}

const defaultSource: SourceChain = {
  utility: {
    primaryVoltage: 13.8,
    shortCircuitMva: 500,
    xOverR: 10,
    isInfiniteBus: false,
  },
  transformer: {
    ratedKva: 1500,
    primaryVoltageKv: 13.8,
    secondaryVoltageV: 480,
    percentZ: 5.75,
    xOverR: 6,
  },
  cable: {
    sizeId: '4/0',
    material: 'Cu',
    lengthMeters: 50,
    parallelRuns: 1,
    conduitType: 'Steel',
  },
  pccLocation: 'transformer_secondary',
}

const defaultMethodConfigs: MethodConfig[] = [
  { method: 'DOL' },
  { method: 'STAR_DELTA', starDeltaTransition: 'closed' },
  { method: 'AUTOTRANSFORMER', autotransformerTap: 0.65 },
  { method: 'SOFT_STARTER', softStarterRampSec: 10, softStarterInitialVoltagePct: 30, softStarterCurrentLimitPctFla: 350 },
  { method: 'VFD', vfdHasBypass: false },
]

function makeDefaultInput(): MotorStartingInput {
  return {
    standard: 'NEC',
    motor: { ...defaultMotor },
    load: { ...defaultLoad },
    sourceChain: { ...defaultSource, utility: { ...defaultSource.utility }, transformer: { ...defaultSource.transformer }, cable: { ...defaultSource.cable } },
    methodConfigs: defaultMethodConfigs.map((c) => ({ ...c }) as MethodConfig),
    voltageDipScenario: 'transient_motor_start',
    createdAt: new Date().toISOString(),
  }
}

export interface MotorStartingState {
  currentInput: MotorStartingInput
  currentResult: MotorStartingResult | null
  history: MotorStartingHistoryEntry[]
  selectedMethodId: StartingMethodId | null
  referenceGuideOpen: boolean
  lastError: string | null
}

export interface MotorStartingActions {
  setStandard: (s: Standard) => void
  setMotor: (m: Partial<Motor>) => void
  setLoad: (l: Partial<Load>) => void
  setSourceChain: (s: Partial<SourceChain>) => void
  setUtility: (u: Partial<SourceChain['utility']>) => void
  setTransformer: (t: Partial<SourceChain['transformer']>) => void
  setCable: (c: Partial<SourceChain['cable']>) => void
  setMethodConfig: (method: StartingMethodId, partial: Partial<MethodConfig>) => void
  setVoltageDipScenario: (s: MotorStartingInput['voltageDipScenario']) => void
  setVoltageDipThresholdOverride: (v?: number) => void
  setProjectName: (name: string) => void
  setSelectedMethodId: (m: StartingMethodId | null) => void
  toggleReferenceGuide: (open?: boolean) => void
  analyze: () => MotorStartingResult | null
  saveCurrentToHistory: () => void
  loadFromHistory: (id: string) => void
  clearHistory: () => void
  resetInput: () => void
}

export const useMotorStartingStore = create<MotorStartingState & MotorStartingActions>((set, get) => ({
  currentInput: makeDefaultInput(),
  currentResult: null,
  history: loadHistory(),
  selectedMethodId: 'DOL',
  referenceGuideOpen: false,
  lastError: null,

  setStandard: (standard) =>
    set((state) => ({ currentInput: { ...state.currentInput, standard } })),

  setMotor: (m) =>
    set((state) => ({
      currentInput: { ...state.currentInput, motor: { ...state.currentInput.motor, ...m } },
    })),

  setLoad: (l) =>
    set((state) => ({
      currentInput: { ...state.currentInput, load: { ...state.currentInput.load, ...l } },
    })),

  setSourceChain: (s) =>
    set((state) => ({
      currentInput: { ...state.currentInput, sourceChain: { ...state.currentInput.sourceChain, ...s } },
    })),

  setUtility: (u) =>
    set((state) => ({
      currentInput: {
        ...state.currentInput,
        sourceChain: {
          ...state.currentInput.sourceChain,
          utility: { ...state.currentInput.sourceChain.utility, ...u },
        },
      },
    })),

  setTransformer: (t) =>
    set((state) => ({
      currentInput: {
        ...state.currentInput,
        sourceChain: {
          ...state.currentInput.sourceChain,
          transformer: { ...state.currentInput.sourceChain.transformer, ...t },
        },
      },
    })),

  setCable: (c) =>
    set((state) => ({
      currentInput: {
        ...state.currentInput,
        sourceChain: {
          ...state.currentInput.sourceChain,
          cable: { ...state.currentInput.sourceChain.cable, ...c },
        },
      },
    })),

  setMethodConfig: (method, partial) =>
    set((state) => ({
      currentInput: {
        ...state.currentInput,
        methodConfigs: state.currentInput.methodConfigs.map((cfg) =>
          cfg.method === method ? ({ ...cfg, ...partial } as MethodConfig) : cfg,
        ),
      },
    })),

  setVoltageDipScenario: (voltageDipScenario) =>
    set((state) => ({ currentInput: { ...state.currentInput, voltageDipScenario } })),

  setVoltageDipThresholdOverride: (voltageDipThresholdPct) =>
    set((state) => ({ currentInput: { ...state.currentInput, voltageDipThresholdPct } })),

  setProjectName: (projectName) =>
    set((state) => ({ currentInput: { ...state.currentInput, projectName } })),

  setSelectedMethodId: (selectedMethodId) => set({ selectedMethodId }),

  toggleReferenceGuide: (open) =>
    set((state) => ({ referenceGuideOpen: open ?? !state.referenceGuideOpen })),

  analyze: () => {
    const input = { ...get().currentInput, createdAt: new Date().toISOString() }
    try {
      const result = analyzeMotorStarting(input)
      set({ currentResult: result, lastError: null })
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed'
      set({ lastError: msg, currentResult: null })
      return null
    }
  },

  saveCurrentToHistory: () => {
    const { currentResult, history } = get()
    if (!currentResult) return
    const entry: MotorStartingHistoryEntry = {
      id: `${Date.now()}`,
      result: currentResult,
      createdAt: currentResult.computedAt,
      label:
        currentResult.input.projectName ||
        `${currentResult.input.motor.ratedPower}${currentResult.input.motor.powerUnit} → ${
          currentResult.comparison.recommendedMethod
        }`,
    }
    const updated = [entry, ...history].slice(0, MAX_HISTORY)
    saveHistory(updated)
    set({ history: updated })
  },

  loadFromHistory: (id) => {
    const entry = get().history.find((h) => h.id === id)
    if (!entry) return
    set({ currentInput: entry.result.input, currentResult: entry.result })
  },

  clearHistory: () => {
    saveHistory([])
    set({ history: [] })
  },

  resetInput: () => set({ currentInput: makeDefaultInput(), currentResult: null, lastError: null }),
}))
