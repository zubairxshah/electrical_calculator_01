import type { Circuit, Panel } from '@/types/panel-schedule'
import { DEFAULT_IEC_DIVERSITY } from '@/lib/calculations/panel-schedule/defaults'

let seq = 0

/** A load circuit with sensible defaults; override any field. */
export function ckt(partial: Partial<Circuit> = {}): Circuit {
  seq += 1
  return {
    id: partial.id ?? `c${seq}`,
    kind: 'load',
    description: `Circuit ${seq}`,
    category: 'other-noncontinuous',
    loadValue: 1000,
    loadUnit: 'VA',
    powerFactor: 1,
    efficiency: 0.9,
    continuous: false,
    poles: 1,
    breakerA: 20,
    startSpace: null,
    locked: false,
    notes: '',
    ...partial,
  }
}

export function panel(partial: Partial<Panel> = {}): Panel {
  return {
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
    ...partial,
  }
}

/** Quickstart Worked Example A — 208Y/120 V, 42 spaces */
export function exampleA(): Panel {
  return panel({
    circuits: [
      ckt({ id: 'L1', description: 'Lighting', category: 'lighting', continuous: true, loadValue: 1200, startSpace: 1 }),
      ckt({ id: 'R2', description: 'Receptacles', category: 'receptacle', loadValue: 1440, startSpace: 2 }),
      ckt({ id: 'WH3', description: 'Water heater', category: 'water-heater', loadValue: 4800, poles: 2, breakerA: 30, startSpace: 3 }),
      ckt({ id: 'R4', description: 'Receptacles', category: 'receptacle', loadValue: 1800, startSpace: 4 }),
      ckt({ id: 'CP6', description: 'Copier', loadValue: 1000, startSpace: 6 }),
      ckt({ id: 'RTU7', description: 'RTU', category: 'hvac-cooling', loadValue: 15000, poles: 3, breakerA: 60, startSpace: 7 }),
    ],
  })
}
