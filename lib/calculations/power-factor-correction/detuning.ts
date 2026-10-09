// Detuned reactor design for APFC steps
// Standards: IEC 60831-1 (capacitor voltage), IEC 61921 (detuned PFC assemblies), IEEE 18
// Research: specs/014-pfi-panel-design/research.md R6–R7

import type {
  PFCInput,
  PFCDesignInput,
  PFCDetuningFactor,
  PFCDetuningStep,
  PFCDetuningDesign,
  PFCStepBankDesign,
} from '@/types/power-factor-correction'
import { CAPACITOR_VOLTAGE_RATINGS, selectCapacitorVoltageRating } from './capacitorData'

const LV_CAPACITOR_RATINGS = CAPACITOR_VOLTAGE_RATINGS.filter(v => v <= 1000)

/** R6: 3rd harmonic flagged → 14 %; THD > 10 % → 7 %; otherwise none. 5.67 % is manual only. */
export function recommendDetuning(thdPercent: number, thirdHarmonic: boolean): PFCDetuningFactor | null {
  if (thirdHarmonic) return 14
  if (thdPercent > 10) return 7
  return null
}

/** fr = f / √p */
export function tuningFrequency(f: number, pPercent: number): number {
  return f / Math.sqrt(pPercent / 100)
}

/**
 * Capacitor rated voltage: not detuned → existing selection (≥ 1.1 U);
 * detuned → next LV rating ≥ 1.1 × U/(1 − p), else the minimum rounded up to 10 V.
 */
export function capacitorRatedVoltage(voltage: number, pPercent: number | null): number {
  if (pPercent === null) return selectCapacitorVoltageRating(voltage)
  const min = 1.1 * voltage / (1 - pPercent / 100)
  return LV_CAPACITOR_RATINGS.find(v => v >= min) ?? Math.ceil(min / 10) * 10
}

/** Per-step values (star-equivalent reactances, U = line voltage) */
export function detuneStep(
  qEffKVAR: number,
  voltage: number,
  f: number,
  pPercent: number | null,
  ur: number,
  threePhase: boolean
): Omit<PFCDetuningStep, 'index'> {
  const p = (pPercent ?? 0) / 100
  const qEff = qEffKVAR * 1000
  const xc = (voltage * voltage) / (qEff * (1 - p))
  const reactorInductanceMH = pPercent === null ? null : ((p * xc) / (2 * Math.PI * f)) * 1000
  const ratedKVAR = (ur * ur) / xc / 1000
  const currentA = threePhase ? qEff / (Math.sqrt(3) * voltage) : qEff / voltage
  return { effectiveKVAR: qEffKVAR, ratedKVAR, capacitorReactanceOhm: xc, reactorInductanceMH, currentA }
}

export function designDetuning(
  input: PFCInput,
  bank: PFCStepBankDesign,
  design: PFCDesignInput
): PFCDetuningDesign {
  const recommended = recommendDetuning(input.harmonicDistortion, design.thirdHarmonic)
  const applied: PFCDetuningFactor | null =
    design.detuning === 'auto' ? recommended : design.detuning === 'none' ? null : design.detuning

  const threePhase = input.systemType === 'three-phase-ac'
  const ur = capacitorRatedVoltage(input.voltage, applied)
  const steps = bank.steps.map(s => ({
    index: s.index,
    ...detuneStep(s.effectiveKVAR, input.voltage, input.frequency, applied, ur, threePhase),
  }))

  const notes: string[] = []
  if (applied !== null) {
    notes.push(`Capacitors see U/(1 − p) = ${(input.voltage / (1 - applied / 100)).toFixed(1)} V at fundamental; rated ${ur} V (≥ 1.1 × terminal voltage, IEC 60831-1).`)
    notes.push('Reactor linearity current is typically specified at 1.6–1.8 × step current; confirm with the reactor manufacturer.')
    notes.push('Detuned steps limit inrush current; standard capacitor-duty contactors are sufficient.')
    if (!LV_CAPACITOR_RATINGS.includes(ur)) {
      notes.push(`No standard LV capacitor rating covers ${(1.1 * input.voltage / (1 - applied / 100)).toFixed(0)} V — ${ur} V is a non-standard value.`)
    }
  }
  if (applied === 5.67 && design.thirdHarmonic) {
    notes.push('5.67 % detuning (fr ≈ 4.2 × f) is not suitable when the 3rd harmonic is significant; use 14 %.')
  }

  return {
    recommended,
    applied,
    tuningFrequencyHz: applied === null ? null : tuningFrequency(input.frequency, applied),
    capacitorVoltageV: applied === null ? input.voltage : input.voltage / (1 - applied / 100),
    capacitorRatedVoltageV: ur,
    steps,
    totalRatedKVAR: steps.reduce((a, s) => a + s.ratedKVAR, 0),
    notes,
  }
}
