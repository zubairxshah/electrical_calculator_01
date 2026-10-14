/**
 * US6 — NEC 480 / NEC 706 / NFPA 855 installation checks (015 T034, G13).
 */

import { describe, it, expect } from 'vitest'
import { buildInstallationChecks } from '@/lib/calculations/battery/installationChecks'
import { calculateRuntime } from '@/lib/calculations/battery'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'
import { toNumber } from '@/lib/mathConfig'

const lfp = getBatteryTypeById('Li-Ion-LFP')!
const agm = getBatteryTypeById('VRLA-AGM')!

const codes = (c: ReturnType<typeof buildInstallationChecks>) => c.map((x) => x.code)

describe('buildInstallationChecks', () => {
  it('NEC 480.7 disconnect above 60 V', () => {
    expect(codes(buildInstallationChecks(agm, 120, 5))).toContain('NEC 480.7')
    expect(codes(buildInstallationChecks(agm, 48, 5))).not.toContain('NEC 480.7')
  })
  it('NEC 480.10 ventilation for lead-acid, not lithium', () => {
    expect(codes(buildInstallationChecks(agm, 48, 5))).toContain('NEC 480.10')
    expect(codes(buildInstallationChecks(lfp, 48, 5))).not.toContain('NEC 480.10')
  })
  it('NEC 706 above 1 kWh', () => {
    expect(codes(buildInstallationChecks(lfp, 48, 1.5))).toContain('NEC 706')
    expect(codes(buildInstallationChecks(lfp, 12, 0.5))).not.toContain('NEC 706')
  })
  it('NFPA 855 at 20 kWh for Li-ion, 70 kWh for lead-acid', () => {
    const li = buildInstallationChecks(lfp, 48, 25).find((c) => c.code === 'NFPA 855')
    expect(li?.severity).toBe('warning')
    expect(codes(buildInstallationChecks(lfp, 48, 15))).not.toContain('NFPA 855')
    expect(codes(buildInstallationChecks(agm, 48, 50))).not.toContain('NFPA 855')
    expect(codes(buildInstallationChecks(agm, 48, 80))).toContain('NFPA 855')
  })
})

describe('G13 — checks never change sizing', () => {
  it('a > 60 V, > 20 kWh lithium bank has the same numbers as the bare math', () => {
    const i = { voltage: 120, loadWatts: 5000, ampHours: 400, mode: 'runtime' as const, chemistry: 'Li-Ion-LFP' as const, temperature: 25 }
    const r = calculateRuntime(i)
    expect(r.bankEnergyKWh).toBeCloseTo(48, 6)
    expect(codes(r.installationChecks)).toEqual(expect.arrayContaining(['NEC 480.7', 'NEC 706', 'NFPA 855']))
    // fraction: 1 × 1 × 0.8 × 0.95 / 1.1; C-rate 5000/(120·400)=0.104 → Peukert (0.104·20)^-0.02
    const peukert = Math.pow(1 / (0.10417 * 20), 0.02)
    const expected = (400 * 120 * ((0.8 * 0.95) / 1.1) * peukert) / 5000
    expect(toNumber(r.backupTimeHours)).toBeCloseTo(expected, 2)
  })
})
