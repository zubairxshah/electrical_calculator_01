/**
 * Forward sizing: backup time from installed nameplate capacity, chemistry-aware
 * (DoD × temperature × efficiency × aging × Peukert). (ADR-006; G1, G3, G4.)
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
import { computeBankConfig } from './bankConfig'
import { buildDischargeCurve } from './dischargeCurve'
import { buildWarnings, computeVerdict, buildRecommendations } from './assess'
import { buildBatteryResult, BatterySizingError } from './result'
import type { BatteryCalculatorInputs, BatteryCalculatorResult } from '@/lib/types'

export function calculateRuntime(inputs: BatteryCalculatorInputs): BatteryCalculatorResult {
  const profile = getBatteryTypeById(toCanonicalChemistry(inputs.chemistry))
  if (!profile) throw new BatterySizingError('chemistry', `Unknown chemistry: ${inputs.chemistry}`)

  const ampHours = inputs.ampHours
  if (ampHours == null || ampHours <= 0) {
    throw new BatterySizingError('ampHours', 'Installed capacity (Ah) is required for runtime mode.')
  }
  const { voltage, loadWatts } = inputs

  const base = resolveBaseFactors(inputs, profile)
  const { value: exponent, source: peukertSource } = effectivePeukertExponent(inputs, profile)
  const cRate = loadWatts / (voltage * ampHours)
  const peukert = peukertDerate(cRate, exponent)
  const usableFraction = base.fraction * peukert

  const effectiveCapacityAh = ampHours * usableFraction
  const energyWh = ampHours * voltage * usableFraction
  const backupTimeHours = energyWh / loadWatts

  const appliedFactors = assembleAppliedFactors(base, peukert, exponent, peukertSource)
  const cellBlockVoltage = inputs.cellBlockVoltage ?? defaultCellBlockVoltage(profile)
  // Runtime describes a single installed bank (one string).
  const bankConfig = computeBankConfig(ampHours, voltage, cellBlockVoltage, ampHours, effectiveCapacityAh)

  const ctx = { inputs, profile, cRate, tempFactorValue: base.temperature.value }
  const warnings = buildWarnings(ctx)
  const verdict = computeVerdict(warnings)
  const recommendations = buildRecommendations(ctx, warnings, verdict)
  const dischargeCurve = buildDischargeCurve(voltage, ampHours, base.dod.value, backupTimeHours, profile)

  return buildBatteryResult({
    inputs,
    profile,
    backupTimeHours,
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
