/**
 * Panel system definitions and space → phase mapping (research R1).
 *
 * Two-column numbering: odd spaces on the left, even on the right.
 * Row r = ceil(n / 2); bus stabs rotate A, B, C down the rows (NEC 408.3(E)).
 */
import type { Panel, Phase, SystemDefinition, SystemTypeId } from '@/types/panel-schedule'

const PHASES: Phase[] = ['A', 'B', 'C']

const PRESETS: Record<Exclude<SystemTypeId, 'custom'>, SystemDefinition> = {
  'nec-1ph-3w-120-240': {
    id: 'nec-1ph-3w-120-240', label: '120/240 V 1φ 3W', phases: 2, wires: 3, vLN: 120, vLL: 240,
    hasNeutral: true, maxPoles: 2, allowOnePole: true, phaseLabels: ['A', 'B'], threePhase: false,
  },
  'nec-3ph-4w-208y120': {
    id: 'nec-3ph-4w-208y120', label: '208Y/120 V 3φ 4W', phases: 3, wires: 4, vLN: 120, vLL: 208,
    hasNeutral: true, maxPoles: 3, allowOnePole: true, phaseLabels: ['A', 'B', 'C'], threePhase: true,
  },
  'nec-3ph-4w-480y277': {
    id: 'nec-3ph-4w-480y277', label: '480Y/277 V 3φ 4W', phases: 3, wires: 4, vLN: 277, vLL: 480,
    hasNeutral: true, maxPoles: 3, allowOnePole: true, phaseLabels: ['A', 'B', 'C'], threePhase: true,
  },
  'nec-3ph-3w-240d': {
    id: 'nec-3ph-3w-240d', label: '240 V 3φ 3W Delta', phases: 3, wires: 3, vLN: null, vLL: 240,
    hasNeutral: false, maxPoles: 3, allowOnePole: false, phaseLabels: ['A', 'B', 'C'], threePhase: true,
  },
  'iec-1ph-2w-230': {
    id: 'iec-1ph-2w-230', label: '230 V 1φ 2W (L+N)', phases: 1, wires: 2, vLN: 230, vLL: 230,
    hasNeutral: true, maxPoles: 1, allowOnePole: true, phaseLabels: ['L'], threePhase: false,
  },
  'iec-3ph-4w-400y230': {
    id: 'iec-3ph-4w-400y230', label: '230/400 V 3φ 4W (+N)', phases: 3, wires: 4, vLN: 230, vLL: 400,
    hasNeutral: true, maxPoles: 3, allowOnePole: true, phaseLabels: ['L1', 'L2', 'L3'], threePhase: true,
  },
}

export const SYSTEM_PRESETS = PRESETS

export const NEC_SYSTEM_TYPES: SystemTypeId[] = [
  'nec-3ph-4w-208y120', 'nec-3ph-4w-480y277', 'nec-1ph-3w-120-240', 'nec-3ph-3w-240d', 'custom',
]
export const IEC_SYSTEM_TYPES: SystemTypeId[] = ['iec-3ph-4w-400y230', 'iec-1ph-2w-230', 'custom']

export function getSystem(panel: Pick<Panel, 'systemType' | 'customSystem' | 'standard'>): SystemDefinition {
  if (panel.systemType !== 'custom') return PRESETS[panel.systemType]

  const c = panel.customSystem ?? { phases: 3, wires: 4, vLN: 120, vLL: 208 }
  const iec = panel.standard === 'IEC'
  if (c.phases === 3) {
    const hasNeutral = c.wires === 4
    return {
      id: 'custom',
      label: `${hasNeutral ? `${c.vLL}Y/${c.vLN}` : c.vLL} V 3φ ${c.wires}W`,
      phases: 3, wires: c.wires, vLN: hasNeutral ? c.vLN : null, vLL: c.vLL,
      hasNeutral, maxPoles: 3, allowOnePole: hasNeutral,
      phaseLabels: iec ? ['L1', 'L2', 'L3'] : ['A', 'B', 'C'], threePhase: true,
    }
  }
  if (c.wires === 3) {
    return {
      id: 'custom', label: `${c.vLN}/${c.vLL} V 1φ 3W`, phases: 2, wires: 3, vLN: c.vLN, vLL: c.vLL,
      hasNeutral: true, maxPoles: 2, allowOnePole: true, phaseLabels: iec ? ['L1', 'L2'] : ['A', 'B'], threePhase: false,
    }
  }
  const v = c.vLN ?? c.vLL
  return {
    id: 'custom', label: `${v} V 1φ 2W`, phases: 1, wires: 2, vLN: v, vLL: v,
    hasNeutral: true, maxPoles: 1, allowOnePole: true, phaseLabels: ['L'], threePhase: false,
  }
}

export function rowOfSpace(space: number): number {
  return Math.ceil(space / 2)
}

export function phaseOfSpace(space: number, system: SystemDefinition): Phase {
  return PHASES[(rowOfSpace(space) - 1) % system.phases]
}

/** Spaces occupied by a circuit of `poles` poles starting at `start` (same side, consecutive rows). */
export function spacesFor(start: number, poles: number): number[] {
  return Array.from({ length: poles }, (_, i) => start + 2 * i)
}

/** Phases used by this system, in order */
export function systemPhases(system: SystemDefinition): Phase[] {
  return PHASES.slice(0, system.phases)
}

export function phaseLabel(phase: Phase, system: SystemDefinition): string {
  return system.phaseLabels[PHASES.indexOf(phase)] ?? phase
}
