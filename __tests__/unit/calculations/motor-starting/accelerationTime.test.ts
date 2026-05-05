import { describe, it, expect } from 'vitest'
import { computeAccelerationTime } from '@/lib/calculations/motor-starting/accelerationTime'
import type { Load, Motor } from '@/types/motor-starting'

function nemaB50hp(): Motor {
  return {
    ratedPower: 50,
    powerUnit: 'HP',
    ratedVoltage: 460,
    ratedCurrent: 65,
    poles: 4,
    efficiency: 0.92,
    powerFactor: 0.85,
    serviceFactor: 1.15,
    designClass: 'B',
    codeLetter: 'G',
    startingTorquePerRated: 1.5,
    breakdownTorquePerRated: 2.5,
  }
}

describe('computeAccelerationTime', () => {
  it('NEMA Design B 50 HP, quadratic load, WR² = 25 lb-ft² → accel time within typical range', () => {
    const motor = nemaB50hp()
    const load: Load = {
      torqueProfile: 'quadratic_fan_pump',
      breakawayTorquePerRated: 0.10,
      inertia: 25,
      inertiaUnit: 'lb_ft2',
    }
    const r = computeAccelerationTime({ motor, load, voltageMultiplier: 1.0 })
    expect(r.torqueVerdict).toBe('sufficient')
    expect(r.tAccSec).toBeGreaterThan(0.2)
    expect(r.tAccSec).toBeLessThan(20)
  })

  it('produces a speed-sample table with the requested step count + 1', () => {
    const motor = nemaB50hp()
    const load: Load = {
      torqueProfile: 'constant',
      breakawayTorquePerRated: 0.20,
      inertia: 10,
      inertiaUnit: 'lb_ft2',
    }
    const r = computeAccelerationTime({ motor, load, voltageMultiplier: 1.0, steps: 5 })
    expect(r.speedSamples.length).toBe(6)
  })

  it('boundary: T_motor < T_load anywhere → tAccSec Infinity, torqueVerdict insufficient', () => {
    const motor: Motor = { ...nemaB50hp(), startingTorquePerRated: 0.1, breakdownTorquePerRated: 0.2 }
    const load: Load = {
      torqueProfile: 'constant',
      breakawayTorquePerRated: 1.5, // load needs 150% torque to break away — motor can't
      inertia: 10,
      inertiaUnit: 'lb_ft2',
    }
    const r = computeAccelerationTime({ motor, load, voltageMultiplier: 1.0 })
    expect(r.tAccSec).toBe(Infinity)
    expect(r.torqueVerdict).toBe('insufficient')
  })

  it('edge: inertia = 0 → tAccSec = 0', () => {
    const motor = nemaB50hp()
    const load: Load = {
      torqueProfile: 'constant',
      breakawayTorquePerRated: 0.20,
      inertia: 0,
      inertiaUnit: 'lb_ft2',
    }
    const r = computeAccelerationTime({ motor, load, voltageMultiplier: 1.0 })
    expect(r.tAccSec).toBe(0)
  })

  it('lower voltage multiplier → longer accel time (or insufficient)', () => {
    const motor = nemaB50hp()
    const load: Load = {
      torqueProfile: 'quadratic_fan_pump',
      breakawayTorquePerRated: 0.10,
      inertia: 25,
      inertiaUnit: 'lb_ft2',
    }
    const full = computeAccelerationTime({ motor, load, voltageMultiplier: 1.0 })
    const half = computeAccelerationTime({ motor, load, voltageMultiplier: 0.5 })
    if (half.torqueVerdict === 'sufficient' && full.torqueVerdict === 'sufficient') {
      expect(half.tAccSec).toBeGreaterThan(full.tAccSec)
    } else {
      expect(half.torqueVerdict).toBe('insufficient')
    }
  })
})
