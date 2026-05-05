import { describe, it, expect } from 'vitest'
import {
  getCableImpedance,
  getIecDesignClass,
  getIeee1668Threshold,
  getNemaCodeLetter,
  getThermalDefaultByHp,
  NEMA_CODE_LETTERS,
} from '@/lib/calculations/motor-starting/motorStartingData'

describe('getNemaCodeLetter', () => {
  it('returns midpoint 5.95 kVA/HP for code G', () => {
    const c = getNemaCodeLetter('G')
    expect(c).toBeDefined()
    expect(c!.kvaPerHpMid).toBeCloseTo(5.95, 2)
  })

  it('resolves all 19 letters A–V', () => {
    const letters = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','U','V']
    expect(NEMA_CODE_LETTERS.length).toBe(19)
    for (const l of letters) {
      expect(getNemaCodeLetter(l)).toBeDefined()
    }
  })

  it('is case-insensitive', () => {
    expect(getNemaCodeLetter('g')).toBeDefined()
  })

  it('returns undefined for unknown letter', () => {
    expect(getNemaCodeLetter('Z')).toBeUndefined()
  })
})

describe('getIecDesignClass', () => {
  it('returns N defaults', () => {
    const d = getIecDesignClass('N')
    expect(d.iStartPerIRatedDefault).toBeGreaterThan(0)
    expect(d.tStartPerTRatedDefault).toBeGreaterThan(0)
  })
  it('returns H defaults with higher torque than N', () => {
    const dH = getIecDesignClass('H')
    const dN = getIecDesignClass('N')
    expect(dH.tStartPerTRatedDefault).toBeGreaterThan(dN.tStartPerTRatedDefault)
  })
})

describe('getThermalDefaultByHp', () => {
  it('100 HP falls in 51–250 range', () => {
    const t = getThermalDefaultByHp(100)
    expect(t.hpMin).toBe(51)
    expect(t.hpMax).toBe(250)
    expect(t.stallTimeHotSec).toBe(10)
  })
  it('5 HP falls in 1–10 range', () => {
    const t = getThermalDefaultByHp(5)
    expect(t.hpMin).toBe(1)
    expect(t.hpMax).toBe(10)
  })
  it('500 HP falls in 251+ range', () => {
    const t = getThermalDefaultByHp(500)
    expect(t.hpMin).toBe(251)
  })
})

describe('getCableImpedance', () => {
  it('returns valid R/X for 4/0 Cu Steel', () => {
    const c = getCableImpedance('4/0', 'Cu', 'Steel')
    expect(c).toBeDefined()
    expect(c!.rPerMeterOhms).toBeGreaterThan(0)
    expect(c!.xPerMeterOhms).toBeGreaterThan(0)
    expect(c!.rPerMeterOhms).toBeLessThan(0.001) // small ohms/m for 4/0
  })
  it('returns valid R/X for 95 mm² Cu PVC (IEC)', () => {
    const c = getCableImpedance('95', 'Cu', 'PVC')
    expect(c).toBeDefined()
    expect(c!.sourceTable).toContain('IEC')
  })
  it('Aluminum has higher resistance than Copper', () => {
    const cu = getCableImpedance('4/0', 'Cu', 'Steel')!
    const al = getCableImpedance('4/0', 'Al', 'Steel')!
    expect(al.rPerMeterOhms).toBeGreaterThan(cu.rPerMeterOhms)
  })
  it('returns undefined for unknown size', () => {
    expect(getCableImpedance('999', 'Cu', 'Steel')).toBeUndefined()
  })
})

describe('getIeee1668Threshold', () => {
  it('transient_motor_start = 20%', () => {
    expect(getIeee1668Threshold('transient_motor_start').dipPercentMax).toBe(20)
  })
  it('steady_state_common = 10%', () => {
    expect(getIeee1668Threshold('steady_state_common').dipPercentMax).toBe(10)
  })
  it('sensitive_loads = 5%', () => {
    expect(getIeee1668Threshold('sensitive_loads').dipPercentMax).toBe(5)
  })
  it('throws on unknown scenario', () => {
    expect(() => getIeee1668Threshold('unknown_scenario')).toThrow()
  })
})
