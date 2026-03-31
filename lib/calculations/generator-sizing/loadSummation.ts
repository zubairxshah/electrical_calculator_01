// Load Summation — Vector Power Summation with Diversity Factors
// Per IEEE 3006.4 Section 5

import type {
  LoadItem,
  GeneratorConfig,
  LoadSummaryResult,
  LoadBreakdownItem,
} from '@/types/generator-sizing'
import { getNextStandardRating } from './generatorData'

/**
 * Calculate total running demand using vector summation of kW and kVAR.
 * Does NOT use arithmetic kVA addition — computes kVA from √(kW² + kVAR²).
 */
export function calculateLoadSummary(
  loads: LoadItem[],
  config: GeneratorConfig
): LoadSummaryResult {
  if (loads.length === 0) {
    throw new Error('At least one load is required')
  }

  const perLoadBreakdown: LoadBreakdownItem[] = []
  let totalKw = 0
  let totalKvar = 0

  for (const load of loads) {
    const ratedKw = load.isKva
      ? load.ratedPower * load.powerFactor   // kVA × PF = kW
      : load.ratedPower                       // already kW
    const effectiveKw = ratedKw * load.quantity * load.diversityFactor
    const kvar = effectiveKw * Math.tan(Math.acos(load.powerFactor))
    const kva = Math.sqrt(effectiveKw ** 2 + kvar ** 2)

    totalKw += effectiveKw
    totalKvar += kvar

    perLoadBreakdown.push({
      loadId: load.id,
      name: load.name || 'Unnamed Load',
      type: load.type,
      ratedKw,
      effectiveKw,
      kvar,
      kva,
      powerFactor: load.powerFactor,
      quantity: load.quantity,
      diversityFactor: load.diversityFactor,
    })
  }

  const totalKva = Math.sqrt(totalKw ** 2 + totalKvar ** 2)
  const combinedPowerFactor = totalKva > 0 ? totalKw / totalKva : 1

  // Apply loading limit
  const loadingLimit = config.dutyType === 'standby'
    ? 1.0
    : config.primeLoadingLimit
  const requiredGeneratorKva = totalKva / loadingLimit

  return {
    totalRunningKw: Math.round(totalKw * 100) / 100,
    totalRunningKvar: Math.round(totalKvar * 100) / 100,
    totalRunningKva: Math.round(totalKva * 100) / 100,
    combinedPowerFactor: Math.round(combinedPowerFactor * 1000) / 1000,
    loadingLimit,
    requiredGeneratorKva: Math.round(requiredGeneratorKva * 100) / 100,
    perLoadBreakdown,
  }
}
