import { describe, it, expect, beforeEach } from 'vitest'
import { useArcFlashStore, selectInput, initialInput } from '@/stores/useArcFlashStore'
import { calculateArcFlash } from '@/lib/calculations/arc-flash/arcFlashCalculator'
import { assessPpe } from '@/lib/calculations/arc-flash/ppe'
import type { ArcFlashHistoryEntry } from '@/types/arc-flash'

const HISTORY_KEY = 'electromate-arc-flash-history'

function makeEntry(i: number): ArcFlashHistoryEntry {
  const input = { ...initialInput, equipmentId: `EQ-${i}` }
  const result = calculateArcFlash(input)
  const ppe = assessPpe(result, input, 'NEC')
  return {
    id: `af-${i}`,
    timestamp: new Date(2026, 0, 1, 0, 0, i).toISOString(),
    title: input.equipmentId,
    governingEnergyCalcm2: result.governing.incidentEnergyCalcm2,
    outcome: ppe.outcome,
    input,
    result,
    ppe,
  }
}

const store = () => useArcFlashStore.getState()

beforeEach(() => {
  localStorage.clear()
  store().reset()
})

describe('history', () => {
  it('adds newest first and persists to its own localStorage key', () => {
    store().addToHistory(makeEntry(1))
    store().addToHistory(makeEntry(2))
    expect(store().history.map((h) => h.id)).toEqual(['af-2', 'af-1'])
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    expect(saved).toHaveLength(2)
  })

  it('keeps at most 50 entries, dropping the oldest (FIFO)', () => {
    const entry = makeEntry(0)
    for (let i = 0; i < 55; i++) store().addToHistory({ ...entry, id: `af-${i}` })
    const history = store().history
    expect(history).toHaveLength(50)
    expect(history[0].id).toBe('af-54')
    expect(history.some((h) => h.id === 'af-4')).toBe(false)
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')).toHaveLength(50)
  })

  it('loadFromHistory restores input, result and ppe', () => {
    const entry = makeEntry(7)
    entry.input = { ...entry.input, voltageV: 600, boltedFaultKA: 30 }
    store().addToHistory(entry)
    store().loadFromHistory('af-7')
    const s = store()
    expect(selectInput(s)).toMatchObject({ equipmentId: 'EQ-7', voltageV: 600, boltedFaultKA: 30 })
    expect(s.result).toEqual(entry.result)
    expect(s.ppe).toEqual(entry.ppe)
    expect(s.isStale).toBe(false)
  })

  it('removes single entries and clears all', () => {
    store().addToHistory(makeEntry(1))
    store().addToHistory(makeEntry(2))
    store().removeFromHistory('af-1')
    expect(store().history.map((h) => h.id)).toEqual(['af-2'])
    store().clearHistory()
    expect(store().history).toEqual([])
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')).toEqual([])
  })
})

describe('equipment class pre-fill', () => {
  it("applyEquipmentClass('lv-switchgear') sets typical gap, enclosure, working distance and config", () => {
    store().setElectrodeConfig('HCB')
    store().applyEquipmentClass('lv-switchgear')
    const s = store()
    expect(s.equipmentClass).toBe('lv-switchgear')
    expect(s.gapMm).toBe(32)
    expect(s.enclosure).toEqual({ heightMm: 508, widthMm: 508, depthMm: 508 })
    expect(s.workingDistanceMm).toBe(609.6)
    expect(s.electrodeConfig).toBe('VCB')
  })

  it.each([
    ['gap', () => store().setField('gapMm', 25)],
    ['working distance', () => store().setField('workingDistanceMm', 914.4)],
    ['enclosure', () => store().setEnclosure('depthMm', 300)],
    ['electrode config', () => store().setElectrodeConfig('HCB')],
  ])('editing the pre-filled %s switches to custom', (_name, edit) => {
    store().applyEquipmentClass('lv-switchgear')
    edit()
    expect(store().equipmentClass).toBe('custom')
  })

  it('editing a non-geometry field keeps the class', () => {
    store().applyEquipmentClass('lv-switchgear')
    store().setField('boltedFaultKA', 30)
    expect(store().equipmentClass).toBe('lv-switchgear')
  })
})
