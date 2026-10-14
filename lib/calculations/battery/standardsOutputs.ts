/**
 * Shared 015 outputs for runtime and sizing: bank voltage/cells from the
 * voltage window, charger sizing, ventilation and installation checks.
 * Pure post-processing; never alters the capacity/runtime math (G13).
 */

import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'
import { computeVoltageWindow } from './voltageWindow'
import { sizeCharger } from './charger'
import { computeVentilation } from './ventilation'
import { buildInstallationChecks } from './installationChecks'
import type {
  BankConfig,
  BatteryCalculatorInputs,
  ChargerResult,
  InstallationCheck,
  VentilationResult,
  VoltageWindowResult,
} from '@/lib/types'

/** Replace the block-based series count with the voltage-window count when given. */
export function applyVoltageWindow(bank: BankConfig, window: VoltageWindowResult): BankConfig {
  if (window.source !== 'window') return bank
  return { ...bank, cellsInSeries: window.cellsInSeries, nominalBankVoltage: window.nominalBankV }
}

export interface StandardsOutputs {
  charger: ChargerResult | null
  ventilation: VentilationResult
  installationChecks: InstallationCheck[]
  bankEnergyKWh: number
}

/**
 * @param dutyHours  backup period the bank must supply (target in sizing, computed runtime otherwise)
 * @param conversionEfficiency load-side efficiency applied in sizing
 * @param perStringAh rated Ah of one string
 */
export function buildStandardsOutputs(
  inputs: BatteryCalculatorInputs,
  profile: BatteryTypeSpec,
  bank: BankConfig,
  window: VoltageWindowResult,
  dutyHours: number,
  conversionEfficiency: number,
  perStringAh: number
): StandardsOutputs {
  const ahRemoved = (inputs.loadWatts * dutyHours) / (conversionEfficiency * inputs.voltage)
  const charger = sizeCharger(
    {
      ahRemoved,
      bankAh: bank.nameplateBankAh,
      standingLoadAmps: inputs.standingLoadAmps,
      rechargeHours: inputs.rechargeHours,
      rechargeFactor: inputs.rechargeFactor,
    },
    profile
  )
  const ventilation = computeVentilation(
    profile.id,
    window.cellsInSeries * bank.stringsInParallel,
    perStringAh,
    inputs.roomVolumeM3
  )
  const bankEnergyKWh = (bank.nameplateBankAh * bank.nominalBankVoltage) / 1000
  const installationChecks = buildInstallationChecks(profile, bank.nominalBankVoltage, bankEnergyKWh)
  return { charger, ventilation, installationChecks, bankEnergyKWh }
}

export { computeVoltageWindow }
