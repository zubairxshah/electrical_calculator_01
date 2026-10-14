/**
 * Battery-room ventilation for hydrogen — EN 50272-2 / IEC 62485-2
 * (feature 015 US5, research D8).
 *
 *   Q = 0.05 × n × I_gas × C_rt / 1000   [m³/h]
 *
 * 0.05 m³/Ah includes the dilution to stay below 4 % H₂ and a safety factor of 5.
 */

import { getElectricalProfile } from '@/lib/standards/batteryReference'
import type { BatteryChemistry } from '@/lib/standards/batteryTypes'
import type { VentilationResult } from '@/lib/types'

const REFERENCE = 'EN 50272-2 / IEC 62485-2 (Q = 0.05·n·I_gas·C_rt/1000)'

/**
 * @param cells   total cells in the bank (series × parallel strings)
 * @param ratedAh rated capacity of one string (Ah)
 * @param roomVolumeM3 optional room volume for air changes per hour
 */
export function computeVentilation(
  chemistry: BatteryChemistry,
  cells: number,
  ratedAh: number,
  roomVolumeM3?: number
): VentilationResult {
  const igas = getElectricalProfile(chemistry).igas
  if (!igas) {
    return {
      applicable: false,
      cells,
      ratedAh,
      note: 'Not applicable — no hydrogen evolution in normal operation. Follow manufacturer and NFPA 855 requirements.',
    }
  }
  const q = (current: number) => (0.05 * cells * current * ratedAh) / 1000
  const qFloatM3h = q(igas.float)
  const qBoostM3h = q(igas.boost)
  return {
    applicable: true,
    cells,
    ratedAh,
    igasFloat: igas.float,
    igasBoost: igas.boost,
    qFloatM3h,
    qBoostM3h,
    airChangesPerHour: roomVolumeM3 && roomVolumeM3 > 0 ? qBoostM3h / roomVolumeM3 : undefined,
    note: `${REFERENCE}; size for boost charging (worst case).`,
  }
}
