/**
 * Stage 1 regression (SC-001): the required-kVAR calculation must stay unchanged by the
 * PFI panel design upgrade. Expected values were captured from the pre-upgrade code
 * (commit 38bf5a1) into stage1-snapshot.json.
 *
 * One deliberate change: IECderated (400 V) capacitorBank.ratedVoltage 480 → 440 V.
 * The pre-upgrade code compared 1.1 × 400 = 440.00000000000006 > 440 and skipped 440 V.
 */
import { describe, it, expect } from 'vitest'
import { calculatePowerFactorCorrection } from '@/lib/calculations/power-factor-correction/pfcCalculator'
import type { PFCInput, PFCEnvironment } from '@/types/power-factor-correction'
import snapshot from './stage1-snapshot.json'

const base: PFCInput = {
  standard: 'IEC', systemType: 'three-phase-ac', voltage: 415, frequency: 50, activePower: 100,
  currentPowerFactor: 0.75, targetPowerFactor: 0.95, connectionType: 'delta', correctionType: 'automatic',
  loadProfile: 'variable', harmonicDistortion: 5,
}

const cases: [keyof typeof snapshot, PFCInput, PFCEnvironment][] = [
  ['A', base, { ambientTemperature: 35, altitude: 0 }],
  ['NEC1ph', {
    ...base, standard: 'NEC', systemType: 'single-phase-ac', voltage: 480, frequency: 60, activePower: 40,
    currentPowerFactor: 0.7, targetPowerFactor: 0.92, correctionType: 'fixed', loadProfile: 'constant', harmonicDistortion: 3,
  }, { ambientTemperature: 30, altitude: 0 }],
  ['IECderated', {
    ...base, voltage: 400, activePower: 250, currentPowerFactor: 0.8, targetPowerFactor: 0.98, harmonicDistortion: 15,
  }, { ambientTemperature: 45, altitude: 1500 }],
  ['MV', {
    ...base, voltage: 11000, activePower: 2000, currentPowerFactor: 0.82, targetPowerFactor: 0.95,
    connectionType: 'star', harmonicDistortion: 2,
  }, { ambientTemperature: 35, altitude: 0 }],
]

describe('stage 1 regression (SC-001)', () => {
  it.each(cases)('case %s matches the pre-upgrade output', async (name, input, environment) => {
    const { timestamp, ...rest } = await calculatePowerFactorCorrection({ input, environment })
    expect(typeof timestamp).toBe('string')
    expect(rest).toEqual(snapshot[name])
  })

  it('Example A required kVAR is 55.32', () => {
    expect(snapshot.A.correctionSizing.requiredKVAR).toBe(55.32)
  })
})
