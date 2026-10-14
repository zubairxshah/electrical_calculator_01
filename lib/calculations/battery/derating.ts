/**
 * Per-chemistry derating factors for battery sizing (ADR-006, amended by ADR-008).
 *
 * Pure functions over the chemistry profile + inputs. Each returns a FactorValue
 * (value + provenance + citation) so the UI can show what was applied and where
 * it came from (default vs user). Peukert rate-derating is separate because it
 * depends on the discharge rate, which depends on capacity.
 */

import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'
import {
  getElectricalProfile,
  LEAD_ACID_TEMP_TABLE,
  DESIGN_MARGIN_DEFAULT,
  CONVERSION_EFFICIENCY_DEFAULT,
} from '@/lib/standards/batteryReference'
import type { BatteryCalculatorInputs, AppliedFactors, FactorValue } from '@/lib/types'

export const AGING_DEFAULT = 0.8
export const DEFAULT_TEMPERATURE_C = 25
/** Floor so a very cold operating point never drives capacity to zero. */
export const TEMP_FACTOR_FLOOR = 0.4

/**
 * Depth-of-discharge fraction (ADR-008 D1).
 * Standby (default): 1.0 — IEEE 485 sizes to full discharge to the end voltage.
 * Cycling: chemistry recommended, or a user override clamped to max.
 */
export function dodFactor(inputs: BatteryCalculatorInputs, profile: BatteryTypeSpec): FactorValue {
  if ((inputs.application ?? 'standby') === 'standby') {
    return {
      value: 1,
      source: 'default',
      standardReference: 'IEEE 485-2020 (standby: capacity to end-of-discharge voltage)',
    }
  }
  const recFrac = profile.depthOfDischarge.recommended / 100
  const maxFrac = profile.depthOfDischarge.maximum / 100
  if (inputs.dodOverride != null) {
    return {
      value: Math.min(inputs.dodOverride, maxFrac),
      source: 'user',
      standardReference: 'IEEE 1013 / IEEE 1561 (cycling DoD)',
    }
  }
  return { value: recFrac, source: 'default', standardReference: 'IEEE 1013 / IEEE 1561 (cycling DoD)' }
}

/**
 * IEEE 485 lead-acid cell-size temperature correction factor (ADR-008 D5).
 * Linear interpolation between table rows; no credit above 25 °C (TCF ≥ 1.0);
 * `clamped` is true when the temperature lies outside the table range.
 */
export function leadAcidTcf(temperature: number): { tcf: number; clamped: boolean } {
  const table = LEAD_ACID_TEMP_TABLE
  const first = table[0]
  const last = table[table.length - 1]
  const clamped = temperature < first.c || temperature > last.c
  if (temperature <= first.c) return { tcf: first.tcf, clamped }
  if (temperature >= DEFAULT_TEMPERATURE_C) return { tcf: 1, clamped }
  for (let i = 1; i < table.length; i++) {
    const hi = table[i]
    if (temperature <= hi.c) {
      const lo = table[i - 1]
      const t = (temperature - lo.c) / (hi.c - lo.c)
      return { tcf: lo.tcf + t * (hi.tcf - lo.tcf), clamped }
    }
  }
  return { tcf: 1, clamped }
}

/**
 * Temperature factor as an available-capacity fraction.
 * Lead-acid: 1 / TCF from the IEEE 485 table. Others: 1.0 at/above the optimal
 * band; below it, reduce by tempCoefficient %/°C, floored at TEMP_FACTOR_FLOOR.
 */
export function derivedTemperatureFactor(temperature: number | undefined, profile: BatteryTypeSpec): number {
  const temp = temperature ?? DEFAULT_TEMPERATURE_C
  if (getElectricalProfile(profile.id).usesLeadAcidTempTable) {
    return 1 / leadAcidTcf(temp).tcf
  }
  const optMin = profile.temperature.optimal.min
  const coeff = profile.temperature.tempCoefficient / 100
  if (temp < optMin) {
    return Math.max(TEMP_FACTOR_FLOOR, 1 - coeff * (optMin - temp))
  }
  return 1.0
}

/** Temperature-correction factor: a direct override, else derived from temperature. */
export function temperatureFactor(inputs: BatteryCalculatorInputs, profile: BatteryTypeSpec): FactorValue {
  if (inputs.tempFactorOverride != null) {
    return { value: inputs.tempFactorOverride, source: 'user', standardReference: 'User-supplied' }
  }
  const value = derivedTemperatureFactor(inputs.temperature, profile)
  const source: FactorValue['source'] =
    inputs.temperature != null && inputs.temperature !== DEFAULT_TEMPERATURE_C ? 'user' : 'default'
  if (getElectricalProfile(profile.id).usesLeadAcidTempTable) {
    const { tcf } = leadAcidTcf(inputs.temperature ?? DEFAULT_TEMPERATURE_C)
    return { value, source, tcf, standardReference: 'IEEE 485-2020 Table 1 (cell-size temperature correction)' }
  }
  return { value, source, standardReference: 'IEEE 485-2020 §6 (temperature correction)' }
}

/** Effective Peukert exponent: a direct override, else the chemistry default. */
export function effectivePeukertExponent(
  inputs: BatteryCalculatorInputs,
  profile: BatteryTypeSpec
): { value: number; source: FactorValue['source'] } {
  if (inputs.peukertExponentOverride != null) {
    return { value: inputs.peukertExponentOverride, source: 'user' }
  }
  return { value: profile.peukertExponent, source: 'default' }
}

/** End-of-life aging design factor (default 0.8 = size for 80% remaining). */
export function agingFactor(inputs: BatteryCalculatorInputs): FactorValue {
  const value = inputs.agingFactor ?? AGING_DEFAULT
  const source: FactorValue['source'] =
    inputs.agingFactor != null && inputs.agingFactor !== AGING_DEFAULT ? 'user' : 'default'
  return { value, source, standardReference: 'IEEE 485-2020 §4.2 (aging, EOL 80%)' }
}

/**
 * Load-side conversion efficiency (inverter / DC-DC), ADR-008 D2.
 * Battery round-trip efficiency is deliberately NOT used: discharge losses are
 * already inside the capacity rating to end voltage.
 */
export function efficiencyFactor(inputs: BatteryCalculatorInputs, _profile: BatteryTypeSpec): FactorValue {
  if (inputs.efficiency != null) {
    return { value: inputs.efficiency, source: 'user', standardReference: 'User-supplied' }
  }
  const loadType = inputs.loadType ?? 'ac'
  return {
    value: CONVERSION_EFFICIENCY_DEFAULT[loadType],
    source: 'default',
    standardReference: loadType === 'ac' ? 'Inverter conversion efficiency (typical)' : 'DC load (no conversion)',
  }
}

/** Design margin multiplier (ADR-008 D3; IEEE 485 practice 1.10–1.15). */
export function designMarginFactor(inputs: BatteryCalculatorInputs): FactorValue {
  const value = inputs.designMargin ?? DESIGN_MARGIN_DEFAULT
  const source: FactorValue['source'] =
    inputs.designMargin != null && inputs.designMargin !== DESIGN_MARGIN_DEFAULT ? 'user' : 'default'
  return { value, source, standardReference: 'IEEE 485-2020 (design margin)' }
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
  designMargin: FactorValue
  /** dod × temperature × aging × efficiency / designMargin */
  fraction: number
}

export function resolveBaseFactors(inputs: BatteryCalculatorInputs, profile: BatteryTypeSpec): BaseFactors {
  const dod = dodFactor(inputs, profile)
  const temperature = temperatureFactor(inputs, profile)
  const aging = agingFactor(inputs)
  const efficiency = efficiencyFactor(inputs, profile)
  const designMargin = designMarginFactor(inputs)
  const fraction = (dod.value * temperature.value * aging.value * efficiency.value) / designMargin.value
  return { dod, temperature, aging, efficiency, designMargin, fraction }
}

/** Assemble the full AppliedFactors set given a resolved Peukert value. */
export function assembleAppliedFactors(
  base: BaseFactors,
  peukertValue: number,
  exponent: number,
  peukertSource: FactorValue['source'] = 'default'
): AppliedFactors {
  return {
    dod: base.dod,
    temperature: base.temperature,
    aging: base.aging,
    efficiency: base.efficiency,
    designMargin: base.designMargin,
    peukert: {
      value: peukertValue,
      source: peukertSource,
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
