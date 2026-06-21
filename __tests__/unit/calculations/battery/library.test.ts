/**
 * Datasheet library tests (T035) — every entry maps to a canonical chemistry (C5).
 */

import { describe, it, expect } from 'vitest'
import { DATASHEET_LIBRARY, getDatasheet, datasheetsForChemistry } from '@/lib/datasheets/library'
import { getBatteryTypeById } from '@/lib/standards/batteryTypes'

describe('datasheet library', () => {
  it('every entry chemistry is canonical (C5)', () => {
    for (const d of DATASHEET_LIBRARY) {
      expect(getBatteryTypeById(d.chemistry), `${d.id} → ${d.chemistry}`).toBeDefined()
    }
  })
  it('getDatasheet resolves by id', () => {
    expect(getDatasheet('trojan-t105')?.manufacturer).toBe('Trojan')
    expect(getDatasheet('nope')).toBeUndefined()
  })
  it('datasheetsForChemistry filters', () => {
    const fla = datasheetsForChemistry('FLA')
    expect(fla.length).toBeGreaterThan(0)
    expect(fla.every((d) => d.chemistry === 'FLA')).toBe(true)
  })
})
