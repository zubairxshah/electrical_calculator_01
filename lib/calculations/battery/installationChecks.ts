/**
 * Installation/code checks — informative only, never change sizing
 * (feature 015 US6, research D9, contract G13).
 */

import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'
import {
  getElectricalProfile,
  NEC480_DISCONNECT_V,
  NEC706_ESS_MIN_KWH,
  NFPA855_THRESHOLDS_KWH,
} from '@/lib/standards/batteryReference'
import type { InstallationCheck } from '@/lib/types'

export function buildInstallationChecks(
  profile: BatteryTypeSpec,
  nominalBankV: number,
  energyKWh: number
): InstallationCheck[] {
  const checks: InstallationCheck[] = []

  if (nominalBankV > NEC480_DISCONNECT_V) {
    checks.push({
      code: 'NEC 480.7',
      severity: 'info',
      message: `Bank is ${nominalBankV.toFixed(0)} V DC (> ${NEC480_DISCONNECT_V} V): provide a disconnecting means for all ungrounded conductors, readily accessible and within sight of the battery.`,
      standardReference: 'NEC 2020 480.7',
    })
  }

  if (getElectricalProfile(profile.id).igas) {
    checks.push({
      code: 'NEC 480.10',
      severity: 'info',
      message: 'Battery locations must be ventilated to prevent accumulation of an explosive mixture (see ventilation result).',
      standardReference: 'NEC 2020 480.10(A)',
    })
  }

  if (energyKWh > NEC706_ESS_MIN_KWH) {
    checks.push({
      code: 'NEC 706',
      severity: 'info',
      message: `Stored energy ${energyKWh.toFixed(1)} kWh exceeds 1 kWh (3.6 MJ): NEC Article 706 (energy storage systems) applies when installed as an ESS.`,
      standardReference: 'NEC 2020 706.1',
    })
  }

  const threshold = NFPA855_THRESHOLDS_KWH[profile.category]
  if (energyKWh > threshold) {
    checks.push({
      code: 'NFPA 855',
      severity: 'warning',
      message: `Stored energy ${energyKWh.toFixed(1)} kWh exceeds the NFPA 855 threshold of ${threshold} kWh for ${profile.category}: room separation, spacing, detection and suppression requirements apply.`,
      standardReference: 'NFPA 855-2023 Table 1.3',
    })
  }

  return checks
}
