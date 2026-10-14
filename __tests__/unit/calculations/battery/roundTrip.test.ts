/**
 * G2 (extended) — unrounded sizing → runtime returns the target within 1 %
 * across every chemistry × application × load type (015 T012).
 */

import { describe, it, expect } from 'vitest'
import { sizeForRuntime, calculateRuntime } from '@/lib/calculations/battery'
import { ALL_BATTERY_TYPES } from '@/lib/standards/batteryTypes'
import { toNumber } from '@/lib/mathConfig'
import type { BatteryApplication, BatteryLoadType } from '@/lib/types'

const applications: BatteryApplication[] = ['standby', 'cycling']
const loadTypes: BatteryLoadType[] = ['ac', 'dc']

describe('G2 — round-trip', () => {
  for (const p of ALL_BATTERY_TYPES) {
    for (const application of applications) {
      for (const loadType of loadTypes) {
        it(`${p.id} · ${application} · ${loadType}`, () => {
          const common = { voltage: 48, loadWatts: 1500, chemistry: p.id, application, loadType, temperature: 10 }
          const target = 3
          const sized = sizeForRuntime({ ...common, mode: 'sizing', targetBackupHours: target })
          const back = calculateRuntime({ ...common, mode: 'runtime', ampHours: toNumber(sized.requiredCapacityAh!) })
          expect(Math.abs(toNumber(back.backupTimeHours) - target) / target).toBeLessThanOrEqual(0.01)
        })
      }
    }
  }
})
