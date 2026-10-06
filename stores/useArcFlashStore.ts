import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ArcFlashActions,
  ArcFlashHistoryEntry,
  ArcFlashInput,
  ArcFlashState,
  EnclosureDimensions,
} from '@/types/arc-flash'
import { TYPICAL_EQUIPMENT } from '@/lib/calculations/arc-flash/ieee1584Tables'
import { isOpenAir } from '@/lib/calculations/arc-flash/ieee1584'

const HISTORY_KEY = 'electromate-arc-flash-history'
const MAX_HISTORY = 50

/** Fields whose manual edit turns a pre-filled equipment class into 'custom' */
const PREFILLED_FIELDS: (keyof ArcFlashInput)[] = ['gapMm', 'workingDistanceMm', 'electrodeConfig', 'enclosure']

const DEFAULT_ENCLOSURE: EnclosureDimensions = { heightMm: 610, widthMm: 610, depthMm: 254 }

// Defaults: LV switchgear in the style of IEEE 1584-2018 Annex D.2
export const initialInput: ArcFlashInput = {
  equipmentId: '',
  projectName: '',
  voltageV: 480,
  frequencyHz: 60,
  boltedFaultKA: 45,
  electrodeConfig: 'VCB',
  gapMm: 32,
  workingDistanceMm: 609.6,
  enclosure: DEFAULT_ENCLOSURE,
  arcingTimeNominalMs: 61.3,
  arcingTimeReducedMs: 319,
  sameTimeForBoth: false,
  applyTwoSecondCap: false,
  equipmentClass: 'custom',
  ppeMethod: 'incident-energy',
  tableRowId: null,
}

function getHistory(): ArcFlashHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(entries: ArcFlashHistoryEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
  } catch {
    // Storage full or unavailable — history is a convenience, never block the calculation
  }
}

/** The calculation input for the current state (enclosure is null for open-air configurations). */
export function selectInput(state: ArcFlashState): ArcFlashInput {
  const input: ArcFlashInput = {
    equipmentId: state.equipmentId,
    projectName: state.projectName,
    voltageV: state.voltageV,
    frequencyHz: state.frequencyHz,
    boltedFaultKA: state.boltedFaultKA,
    electrodeConfig: state.electrodeConfig,
    gapMm: state.gapMm,
    workingDistanceMm: state.workingDistanceMm,
    enclosure: isOpenAir(state.electrodeConfig) ? null : state.enclosure,
    arcingTimeNominalMs: state.arcingTimeNominalMs,
    arcingTimeReducedMs: state.sameTimeForBoth ? state.arcingTimeNominalMs : state.arcingTimeReducedMs,
    sameTimeForBoth: state.sameTimeForBoth,
    applyTwoSecondCap: state.applyTwoSecondCap,
    equipmentClass: state.equipmentClass,
    ppeMethod: state.ppeMethod,
    tableRowId: state.tableRowId,
  }
  return input
}

const initialState: ArcFlashState = {
  ...initialInput,
  standard: 'NEC',
  result: null,
  ppe: null,
  validationErrors: [],
  isStale: false,
  history: [],
}

export const useArcFlashStore = create<ArcFlashState & ArcFlashActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      history: getHistory(),

      setField: (key, value) => {
        const state = get()
        const patch: Partial<ArcFlashState> = { [key]: value, isStale: state.result !== null }
        if (key === 'arcingTimeNominalMs' && state.sameTimeForBoth) {
          patch.arcingTimeReducedMs = value as number
        }
        if (PREFILLED_FIELDS.includes(key)) patch.equipmentClass = 'custom'
        set(patch)
      },

      setEnclosure: (dim, value) => {
        const enclosure = { ...(get().enclosure ?? DEFAULT_ENCLOSURE), [dim]: value }
        set({ enclosure, equipmentClass: 'custom', isStale: get().result !== null })
      },

      setElectrodeConfig: (config) => {
        set({
          electrodeConfig: config,
          enclosure: get().enclosure ?? DEFAULT_ENCLOSURE,
          equipmentClass: 'custom',
          isStale: get().result !== null,
        })
      },

      setSameTimeForBoth: (on) => {
        const patch: Partial<ArcFlashState> = { sameTimeForBoth: on, isStale: get().result !== null }
        if (on) patch.arcingTimeReducedMs = get().arcingTimeNominalMs
        set(patch)
      },

      setStandard: (standard) => set({ standard }),

      setValidationErrors: (validationErrors) => set({ validationErrors }),

      setResult: (result, ppe) => set({ result, ppe, isStale: false, validationErrors: [] }),

      applyEquipmentClass: (id) => {
        const eq = TYPICAL_EQUIPMENT.find((e) => e.id === id)
        if (!eq) {
          set({ equipmentClass: 'custom' })
          return
        }
        set({
          equipmentClass: id,
          gapMm: eq.gapMm,
          workingDistanceMm: eq.workingDistanceMm,
          electrodeConfig: eq.defaultConfig,
          enclosure: { heightMm: eq.heightMm, widthMm: eq.widthMm, depthMm: eq.depthMm },
          isStale: get().result !== null,
        })
      },

      addToHistory: (entry) => {
        const history = [entry, ...getHistory()].slice(0, MAX_HISTORY)
        saveHistory(history)
        set({ history })
      },

      loadFromHistory: (id) => {
        const entry = getHistory().find((h) => h.id === id)
        if (!entry) return
        set({
          ...entry.input,
          enclosure: entry.input.enclosure ?? get().enclosure ?? DEFAULT_ENCLOSURE,
          result: entry.result,
          ppe: entry.ppe,
          isStale: false,
          validationErrors: [],
        })
      },

      removeFromHistory: (id) => {
        const history = getHistory().filter((h) => h.id !== id)
        saveHistory(history)
        set({ history })
      },

      clearHistory: () => {
        saveHistory([])
        set({ history: [] })
      },

      reset: () => set({ ...initialState, history: getHistory() }),
    }),
    {
      name: 'electromate-arc-flash',
      partialize: (state) => ({ ...selectInput(state), enclosure: state.enclosure, standard: state.standard }),
    }
  )
)
