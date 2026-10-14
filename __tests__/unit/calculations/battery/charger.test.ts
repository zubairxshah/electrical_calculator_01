/**
 * US4 — charger sizing, IEEE 946 approach (015 T028, G11).
 */

import { describe, it, expect } from 'vitest'
import { sizeCharger, nextChargerRating } from '@/lib/calculations/battery/charger'
import { calculateRuntime, sizeForRuntime } from '@/lib/calculations/battery'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import type { BatteryCalculatorInputs } from '@/lib/types'

const agm = getBatteryTypeById('VRLA-AGM')!

describe('sizeCharger', () => {
  it('200 Ah removed × 1.10 / 8 h + 10 A = 37.5 A → 40 A rating', () => {
    const c = sizeCharger({ ahRemoved: 200, bankAh: 400, standingLoadAmps: 10, rechargeHours: 8, rechargeFactor: 1.1 }, agm)!
    expect(c.requiredAmps).toBeCloseTo(37.5, 6)
    expect(c.recommendedRatingA).toBe(40)
    expect(c.rechargeFactor.source).toBe('user')
  })
  it('uses the chemistry default recharge factor (lead-acid 1.10)', () => {
    const c = sizeCharger({ ahRemoved: 100, bankAh: 200 }, agm)!
    expect(c.rechargeFactor.value).toBe(1.1)
    expect(c.rechargeFactor.source).toBe('default')
    expect(c.rechargeHours).toBe(8)
    expect(c.requiredAmps).toBeCloseTo((100 * 1.1) / 8, 6)
  })
  it('chargeCRate = recharge current / bank Ah', () => {
    const c = sizeCharger({ ahRemoved: 200, bankAh: 400, standingLoadAmps: 10, rechargeHours: 8, rechargeFactor: 1.1 }, agm)!
    expect(c.chargeCRate).toBeCloseTo(27.5 / 400, 6)
  })
  it('returns null for an invalid recharge time', () => {
    expect(sizeCharger({ ahRemoved: 100, bankAh: 200, rechargeHours: 0 }, agm)).toBeNull()
  })
})

describe('nextChargerRating', () => {
  it('picks the smallest standard rating ≥ required', () => {
    expect(nextChargerRating(10)).toBe(10)
    expect(nextChargerRating(10.1)).toBe(15)
  })
  it('rounds up to the next 100 A above 500 A', () => {
    expect(nextChargerRating(501)).toBe(600)
  })
})

describe('engine integration', () => {
  const base: BatteryCalculatorInputs = { voltage: 48, loadWatts: 2400, mode: 'runtime', chemistry: 'VRLA-AGM', ampHours: 100 }
  it('Ah removed = P·t / (η·V) over the backup period', () => {
    const r = calculateRuntime({ ...base, loadType: 'dc' })
    const hours = Number(r.backupTimeHours.toString())
    expect(r.charger!.ahRemoved).toBeCloseTo((2400 * hours) / 48, 4)
  })
  it('warns when the recharge current exceeds the chemistry max charge rate', () => {
    const r = calculateRuntime({ ...base, rechargeHours: 1 })
    expect(r.warnings.some((w) => w.type === 'charge-rate')).toBe(true)
  })
  it('sizing mode also returns a charger', () => {
    const r = sizeForRuntime({ ...base, mode: 'sizing', targetBackupHours: 1, standingLoadAmps: 5 })
    expect(r.charger!.standingLoadAmps).toBe(5)
  })
})
