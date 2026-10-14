/**
 * Series cell count and bank voltages from the load voltage window and the
 * end-of-discharge voltage per cell (IEEE 485; feature 015 US2, research D6).
 *
 * With a minimum load voltage: cells = floor(V_min / V_end), so the bank never
 * discharges below the load minimum. Without one, fall back to the 011
 * block-based count and say so (`source: 'block'`).
 */

import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import { toCanonicalChemistry } from '@/lib/standards/batteryChemistryMap'
import { getElectricalProfile } from '@/lib/standards/batteryReference'
import { defaultCellBlockVoltage } from './derating'
import type { BatteryCalculatorInputs, VoltageWindowResult } from '@/lib/types'

export function computeVoltageWindow(inputs: BatteryCalculatorInputs): VoltageWindowResult {
  const chemistry = toCanonicalChemistry(inputs.chemistry)
  const electrical = getElectricalProfile(chemistry)
  const endVoltagePerCell = inputs.endVoltagePerCell ?? electrical.endVoltagePerCell

  if (inputs.minLoadVoltage != null && inputs.minLoadVoltage > 0) {
    const cellsInSeries = Math.max(1, Math.floor(inputs.minLoadVoltage / endVoltagePerCell + 1e-9))
    return {
      source: 'window',
      cellsInSeries,
      endVoltagePerCell,
      nominalBankV: cellsInSeries * electrical.nominalCellVoltage,
      floatBankV: cellsInSeries * electrical.floatVoltagePerCell,
      endBankV: cellsInSeries * endVoltagePerCell,
    }
  }

  // Fallback: whole blocks to reach the system voltage, then cells per block.
  const profile = getBatteryTypeById(chemistry)!
  const blockV = inputs.cellBlockVoltage ?? defaultCellBlockVoltage(profile)
  const blocks = Math.max(1, Math.ceil(inputs.voltage / blockV))
  const cellsPerBlock = Math.max(1, Math.round(blockV / electrical.nominalCellVoltage))
  const cellsInSeries = blocks * cellsPerBlock
  return {
    source: 'block',
    cellsInSeries,
    endVoltagePerCell,
    nominalBankV: blocks * blockV,
    floatBankV: cellsInSeries * electrical.floatVoltagePerCell,
    endBankV: cellsInSeries * endVoltagePerCell,
  }
}
