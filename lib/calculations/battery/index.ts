/**
 * Battery sizing engine — public API (ADR-006).
 *
 * Dispatches on inputs.mode:
 *  - 'runtime' → calculateRuntime (backup time from installed capacity)
 *  - 'sizing'  → sizeForRuntime  (required capacity + bank for a target time)
 */

import { toBigNumber } from '@/lib/mathConfig'
import { calculateRuntime } from './runtime'
import { sizeForRuntime } from './sizing'
import { BatterySizingError } from './result'
import type { BatteryCalculatorInputs, BatteryCalculatorResult } from '@/lib/types'
import type { math } from '@/lib/mathConfig'

export { calculateRuntime } from './runtime'
export { sizeForRuntime } from './sizing'
export { BatterySizingError } from './result'

// Memoization keyed on ALL inputs that affect the result (T047).
const cache = new Map<string, BatteryCalculatorResult>()
const CACHE_LIMIT = 100

function cacheKey(i: BatteryCalculatorInputs): string {
  return JSON.stringify([
    i.mode,
    i.voltage,
    i.loadWatts,
    i.chemistry,
    i.ampHours ?? null,
    i.targetBackupHours ?? null,
    i.efficiency ?? null,
    i.agingFactor ?? null,
    i.temperature ?? null,
    i.dodOverride ?? null,
    i.cellBlockVoltage ?? null,
    i.unitCapacityAh ?? null,
    i.datasheetId ?? null,
  ])
}

/** Single entry point the store/UI calls. */
export function calculateBattery(inputs: BatteryCalculatorInputs): BatteryCalculatorResult {
  const key = cacheKey(inputs)
  const cached = cache.get(key)
  if (cached) return { ...cached, timestamp: new Date().toISOString() }

  const result = inputs.mode === 'sizing' ? sizeForRuntime(inputs) : calculateRuntime(inputs)

  if (cache.size >= CACHE_LIMIT) {
    const first = cache.keys().next().value
    if (first !== undefined) cache.delete(first)
  }
  cache.set(key, result)
  return result
}

/**
 * Back-compat alias: the store historically imported `calculateBackupTime`.
 * Routes through the dispatcher so existing callers keep working.
 */
export function calculateBackupTime(inputs: BatteryCalculatorInputs): BatteryCalculatorResult {
  return calculateBattery(inputs)
}

/** Discharge rate (C-rate as fraction) for validation/UI. 0 when capacity unknown. */
export function calculateDischargeRate(inputs: BatteryCalculatorInputs): math.BigNumber {
  const ah = inputs.ampHours
  if (ah == null || ah <= 0 || inputs.voltage <= 0) return toBigNumber(0)
  return toBigNumber(inputs.loadWatts / (inputs.voltage * ah))
}

export function clearCalculationCache(): void {
  cache.clear()
}

void BatterySizingError // keep named export referenced for tree-shakers
