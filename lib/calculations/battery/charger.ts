/**
 * Battery charger sizing — IEEE 946 approach (feature 015 US4, research D7).
 *
 *   I_charger = Ah_removed × k_recharge / t_recharge + I_standing
 *
 * The recommended rating is the next standard rating up.
 */

import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'
import {
  getElectricalProfile,
  STANDARD_CHARGER_RATINGS_A,
  RECHARGE_HOURS_DEFAULT,
} from '@/lib/standards/batteryReference'
import type { ChargerResult, FactorValue } from '@/lib/types'

export interface ChargerParams {
  /** Ah delivered during the backup period */
  ahRemoved: number
  /** Nameplate bank capacity (Ah) for the charge-rate check */
  bankAh: number
  standingLoadAmps?: number
  rechargeHours?: number
  rechargeFactor?: number
}

/** Smallest standard rating ≥ required; above the table, the next 100 A. */
export function nextChargerRating(requiredAmps: number): number {
  const hit = STANDARD_CHARGER_RATINGS_A.find((r) => r >= requiredAmps - 1e-9)
  return hit ?? Math.ceil(requiredAmps / 100) * 100
}

/** Returns null when the recharge time is not a positive number. */
export function sizeCharger(p: ChargerParams, profile: BatteryTypeSpec): ChargerResult | null {
  const rechargeHours = p.rechargeHours ?? RECHARGE_HOURS_DEFAULT
  if (!(rechargeHours > 0)) return null

  const chemistryDefault = getElectricalProfile(profile.id).rechargeFactor
  const rechargeFactor: FactorValue =
    p.rechargeFactor != null
      ? { value: p.rechargeFactor, source: 'user', standardReference: 'User-supplied' }
      : { value: chemistryDefault, source: 'default', standardReference: 'IEEE 946 (recharge Ah-return factor)' }

  const standingLoadAmps = p.standingLoadAmps ?? 0
  const rechargeAmps = (p.ahRemoved * rechargeFactor.value) / rechargeHours
  const requiredAmps = rechargeAmps + standingLoadAmps

  return {
    ahRemoved: p.ahRemoved,
    rechargeFactor,
    rechargeHours,
    standingLoadAmps,
    requiredAmps,
    recommendedRatingA: nextChargerRating(requiredAmps),
    chargeCRate: p.bankAh > 0 ? rechargeAmps / p.bankAh : 0,
  }
}
