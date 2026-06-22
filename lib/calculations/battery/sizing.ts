/**
 * Reverse sizing: required nameplate capacity + bank configuration for a target
 * backup time. Same factors as runtime, applied in reverse, with the rate-dependent
 * Peukert term solved iteratively. (ADR-006; G2 round-trip guarantee.)
 */

import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import { toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import {
  resolveBaseFactors,
  peukertDerate,
  assembleAppliedFactors,
  defaultCellBlockVoltage,
  effectivePeukertExponent,
} from './derating'
import { computeBankConfig, DEFAULT_UNIT_AH } from './bankConfig'
import { buildDischargeCurve } from './dischargeCurve'
import { buildWarnings, computeVerdict, buildRecommendations } from './assess'
import { buildBatteryResult, BatterySizingError } from './result'
import type { BatteryCalculatorInputs, BatteryCalculatorResult } from '@/lib/types'

export function sizeForRuntime(inputs: BatteryCalculatorInputs): BatteryCalculatorResult {
  const profile = getBatteryTypeById(toCanonicalChemistry(inputs.chemistry))
  if (!profile) throw new BatterySizingError('chemistry', `Unknown chemistry: ${inputs.chemistry}`)

  const target = inputs.targetBackupHours
  if (target == null || target <= 0) {
    throw new BatterySizingError('targetBackupHours', 'Target backup time (h) is required for sizing mode.')
  }
  const { voltage, loadWatts } = inputs
  const base = resolveBaseFactors(inputs, profile)
  const { value: exponent, source: peukertSource } = effectivePeukertExponent(inputs, profile)

  // Solve required nameplate Ah; Peukert depends on the result, so iterate.
  let requiredAh = (loadWatts * target) / (voltage * base.fraction) // start with Peukert = 1
  for (let i = 0; i < 25; i++) {
    const cRate = loadWatts / (voltage * requiredAh)
    const peukert = peukertDerate(cRate, exponent)
    const next = (loadWatts * target) / (voltage * base.fraction * peukert)
    if (Math.abs(next - requiredAh) < 1e-6) {
      requiredAh = next
      break
    }
    requiredAh = next
  }

  const cellBlockVoltage = inputs.cellBlockVoltage ?? defaultCellBlockVoltage(profile)
  const perUnitAh = inputs.unitCapacityAh ?? DEFAULT_UNIT_AH

  // Whole-string rounding; the installed bank meets or exceeds the requirement.
  const provisional = computeBankConfig(requiredAh, voltage, cellBlockVoltage, perUnitAh)
  const nameplateBankAh = provisional.nameplateBankAh
  const cRate = loadWatts / (voltage * nameplateBankAh)
  const peukert = peukertDerate(cRate, exponent)
  const usableFraction = base.fraction * peukert
  const effectiveCapacityAh = nameplateBankAh * usableFraction
  const backupTimeHours = (effectiveCapacityAh * voltage) / loadWatts // delivered by the rounded bank

  const bankConfig = { ...provisional, deliveredCapacityAh: effectiveCapacityAh }
  const appliedFactors = assembleAppliedFactors(base, peukert, exponent, peukertSource)

  const ctx = {
    inputs,
    profile,
    cRate,
    tempFactorValue: base.temperature.value,
    overCapacityPct: bankConfig.overCapacityPct,
  }
  const warnings = buildWarnings(ctx)
  const verdict = computeVerdict(warnings)
  const recommendations = buildRecommendations(ctx, warnings, verdict)
  const dischargeCurve = buildDischargeCurve(voltage, nameplateBankAh, base.dod.value, backupTimeHours, profile)

  return buildBatteryResult({
    inputs,
    profile,
    backupTimeHours,
    requiredCapacityAh: requiredAh,
    effectiveCapacityAh,
    dischargeRate: cRate,
    appliedFactors,
    bankConfig,
    verdict,
    recommendations,
    warnings,
    dischargeCurve,
  })
}
