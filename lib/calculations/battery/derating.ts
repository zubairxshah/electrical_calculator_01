/**
 * Per-chemistry derating factors for battery sizing (ADR-006, research.md D1–D3).
 *
 * Pure functions over the chemistry profile + inputs. Each returns a FactorValue
 * (value + provenance + citation) so the UI can show what was applied and where
 * it came from (default vs user). Peukert rate-derating is separate because it
 * depends on the discharge rate, which depends on capacity.
 */

import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'
import type { BatteryCalculatorInputs, AppliedFactors, FactorValue } from '@/lib/types'

export const AGING_DEFAULT = 0.8
export const DEFAULT_TEMPERATURE_C = 25
/** Floor so a very cold operating point never drives capacity to zero. */
export const TEMP_FACTOR_FLOOR = 0.4

/** Depth-of-discharge fraction: chemistry recommended, or a user override clamped to max. */
export function dodFactor(inputs: BatteryCalculatorInputs, profile: BatteryTypeSpec): FactorValue {
  const recFrac = profile.depthOfDischarge.recommended / 100
  const maxFrac = profile.depthOfDischarge.maximum / 100
  if (inputs.dodOverride != null) {
    return {
      value: Math.min(inputs.dodOverride, maxFrac),
      source: 'user',
      standardReference: 'IEEE 485-2020 §5 (usable DoD)',
    }
  }
  return { value: recFrac, source: 'default', standardReference: 'IEEE 485-2020 §5 (usable DoD)' }
}

/**
 * Temperature-correction factor. 1.0 at/above the chemistry optimal band; below it,
 * reduce by tempCoefficient %/°C of deviation, floored at TEMP_FACTOR_FLOOR.
 */
export function temperatureFactor(inputs: BatteryCalculatorInputs, profile: BatteryTypeSpec): FactorValue {
  const temp = inputs.temperature ?? DEFAULT_TEMPERATURE_C
  const optMin = profile.temperature.optimal.min
  const coeff = profile.temperature.tempCoefficient / 100
  let value = 1.0
  if (temp < optMin) {
    value = Math.max(TEMP_FACTOR_FLOOR, 1 - coeff * (optMin - temp))
  }
  const source: FactorValue['source'] =
    inputs.temperature != null && inputs.temperature !== DEFAULT_TEMPERATURE_C ? 'user' : 'default'
  return { value, source, standardReference: 'IEEE 485-2020 §6 (temperature correction)' }
}

/** End-of-life aging design factor (default 0.8 = size for 80% remaining). */
export function agingFactor(inputs: BatteryCalculatorInputs): FactorValue {
  const value = inputs.agingFactor ?? AGING_DEFAULT
  const source: FactorValue['source'] =
    inputs.agingFactor != null && inputs.agingFactor !== AGING_DEFAULT ? 'user' : 'default'
  return { value, source, standardReference: 'IEEE 485-2020 §4.2 (aging, EOL 80%)' }
}

/** System/round-trip efficiency: user override, else chemistry round-trip typical. */
export function efficiencyFactor(inputs: BatteryCalculatorInputs, profile: BatteryTypeSpec): FactorValue {
  if (inputs.efficiency != null) {
    return { value: inputs.efficiency, source: 'user', standardReference: 'User-supplied' }
  }
  return {
    value: profile.efficiency.roundTrip.typical / 100,
    source: 'default',
    standardReference: 'IEC 60896 / IEC 62619 (round-trip)',
  }
}

/**
 * Peukert discharge-rate derate multiplier (≤ 1.0).
 * Reference rating is C/20, so I_rated = Ah/20 and (I / I_rated) = cRate × 20.
 * available fraction = (I_rated / I)^(n-1). At or below C/20 → 1.0; lithium (n≈1.02)
 * is near-flat; lead-acid (n≈1.2) derates materially at high rate.
 *
 * @param cRate discharge rate as a fraction (0.05 == C/20, 0.2 == C/5)
 * @param exponent chemistry Peukert exponent
 */
export function peukertDerate(cRate: number, exponent: number): number {
  if (cRate <= 0) return 1
  const ratio = cRate * 20 // I / I_rated
  if (ratio <= 1) return 1
  return Math.pow(1 / ratio, exponent - 1)
}

/** Base usable fraction excluding Peukert (which needs the rate). */
export interface BaseFactors {
  dod: FactorValue
  temperature: FactorValue
  aging: FactorValue
  efficiency: FactorValue
  /** dod × temperature × aging × efficiency */
  fraction: number
}

export function resolveBaseFactors(inputs: BatteryCalculatorInputs, profile: BatteryTypeSpec): BaseFactors {
  const dod = dodFactor(inputs, profile)
  const temperature = temperatureFactor(inputs, profile)
  const aging = agingFactor(inputs)
  const efficiency = efficiencyFactor(inputs, profile)
  const fraction = dod.value * temperature.value * aging.value * efficiency.value
  return { dod, temperature, aging, efficiency, fraction }
}

/** Assemble the full AppliedFactors set given a resolved Peukert value. */
export function assembleAppliedFactors(
  base: BaseFactors,
  peukertValue: number,
  exponent: number
): AppliedFactors {
  return {
    dod: base.dod,
    temperature: base.temperature,
    aging: base.aging,
    efficiency: base.efficiency,
    peukert: {
      value: peukertValue,
      source: 'default',
      standardReference: `Peukert n=${exponent} (rate derating)`,
    },
  }
}

/** Default nominal cell/block voltage used for series-count when not provided. */
export function defaultCellBlockVoltage(profile: BatteryTypeSpec): number {
  // 12V blocks are the common stationary building block across supported chemistries.
  switch (profile.category) {
    case 'Flow':
      return 48
    default:
      return 12
  }
}
