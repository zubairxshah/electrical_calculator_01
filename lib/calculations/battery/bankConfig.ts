/**
 * Battery bank configuration: series cells/blocks (for voltage) and parallel
 * strings (for capacity). Strings round up to whole units; the resulting
 * over-capacity is disclosed. (ADR-006, contracts/sizing-engine.contract.md.)
 */

import type { BankConfig } from '@/lib/types'

export const DEFAULT_UNIT_AH = 100

/**
 * @param requiredAh    required nameplate capacity (Ah)
 * @param systemVoltage target bank voltage (V)
 * @param cellBlockVoltage nominal voltage of one series element (V)
 * @param perUnitAh     nameplate capacity of one string/unit (Ah)
 * @param effectiveAh   usable capacity after derating, for delivered figure (Ah)
 */
export function computeBankConfig(
  requiredAh: number,
  systemVoltage: number,
  cellBlockVoltage: number,
  perUnitAh: number,
  effectiveAh?: number
): BankConfig {
  const cellsInSeries = Math.max(1, Math.ceil(systemVoltage / cellBlockVoltage))
  const stringsInParallel = Math.max(1, Math.ceil(requiredAh / perUnitAh))
  const nameplateBankAh = stringsInParallel * perUnitAh
  const overCapacityPct = requiredAh > 0 ? ((nameplateBankAh - requiredAh) / requiredAh) * 100 : 0
  return {
    cellsInSeries,
    stringsInParallel,
    nominalBankVoltage: cellsInSeries * cellBlockVoltage,
    nameplateBankAh,
    deliveredCapacityAh: effectiveAh ?? nameplateBankAh,
    overCapacityPct,
  }
}
