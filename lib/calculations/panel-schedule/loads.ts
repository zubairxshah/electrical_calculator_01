/**
 * Circuit load conversion (VA) and branch current (research R2, R6).
 */
import type { Circuit, PanelStandard, Poles, SystemDefinition } from '@/types/panel-schedule'
import { necMotorFlc } from '@/lib/standards/motorFlc'

const SQRT3 = Math.sqrt(3)
const HP_TO_KW = 0.7457

export class PanelError extends Error {
  constructor(public code: 'MOTOR_HP_NOT_IN_TABLE', message: string) {
    super(message)
    this.name = 'PanelError'
  }
}

/** Voltage across a circuit of the given pole count (1-pole: L-N, otherwise L-L). */
function circuitVoltage(poles: Poles, system: SystemDefinition): number {
  if (poles === 1) return system.vLN ?? system.vLL / SQRT3
  return system.vLL
}

/** Total apparent power of a circuit in VA. Spares and spaces carry no load. */
export function circuitVA(c: Circuit, system: SystemDefinition, standard: PanelStandard): number {
  if (c.kind !== 'load') return 0
  const pf = c.powerFactor > 0 ? c.powerFactor : 1
  const isMotor = c.category === 'motor'

  switch (c.loadUnit) {
    case 'VA':
      return c.loadValue
    case 'kVA':
      return c.loadValue * 1000
    case 'W':
      return c.loadValue / pf
    case 'kW':
      // IEC motors are rated by shaft output: input = P / η
      if (isMotor && standard === 'IEC') return (c.loadValue * 1000) / (c.efficiency * pf)
      return (c.loadValue * 1000) / pf
    case 'HP': {
      if (standard === 'IEC') return (c.loadValue * HP_TO_KW * 1000) / (c.efficiency * pf)
      // NEC 430.6(A)(1): table FLC
      const phases = c.poles === 3 ? 3 : 1
      const v = circuitVoltage(c.poles, system)
      const flc = necMotorFlc(c.loadValue, phases, Math.round(v))
      if (flc === null) {
        throw new PanelError(
          'MOTOR_HP_NOT_IN_TABLE',
          `${c.loadValue} HP ${phases}φ at ${Math.round(v)} V is not in NEC Table ${phases === 3 ? '430.250' : '430.248'} — enter the load in VA instead`,
        )
      }
      return flc * v * (phases === 3 ? SQRT3 : 1)
    }
  }
}

/** Branch-circuit current: 1-pole VA/V_LN, 2-pole VA/V_LL, 3-pole VA/(√3·V_LL). */
export function branchCurrent(va: number, poles: Poles, system: SystemDefinition): number {
  if (poles === 3) return va / (SQRT3 * system.vLL)
  return va / circuitVoltage(poles, system)
}
