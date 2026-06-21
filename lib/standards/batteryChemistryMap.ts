/**
 * Battery chemistry ID reconciliation (feature 011-battery-revamp, ADR-006).
 *
 * Historically three vocabularies disagreed: the Zod schema enum, the input
 * form options, and the canonical `batteryTypes.ts` dataset. This module maps
 * the legacy IDs to the canonical `BatteryChemistry` union (now the single
 * source of truth) and provides display labels for the UI. Because the
 * Zustand store persists inputs to localStorage, `toCanonicalChemistry` is
 * used both by schema preprocessing and by the store's persist `migrate`.
 */

import type { BatteryChemistry } from './batteryTypes'
import { ALL_BATTERY_TYPES } from './batteryTypes'

/** Legacy / alternate chemistry IDs → canonical BatteryChemistry. */
export const legacyToCanonical: Record<string, BatteryChemistry> = {
  // identities (already canonical)
  'VRLA-AGM': 'VRLA-AGM',
  'VRLA-GEL': 'VRLA-GEL',
  FLA: 'FLA',
  'Li-Ion-LFP': 'Li-Ion-LFP',
  'Li-Ion-NMC': 'Li-Ion-NMC',
  'Li-Ion-LTO': 'Li-Ion-LTO',
  NiCd: 'NiCd',
  NiFe: 'NiFe',
  'Flow-Vanadium': 'Flow-Vanadium',
  // legacy spellings (old schema/form/localStorage)
  'VRLA-Gel': 'VRLA-GEL',
  LiFePO4: 'Li-Ion-LFP',
  'Li-ion': 'Li-Ion-NMC',
}

/** Human-readable labels for the chemistry dropdown. */
export const chemistryDisplayLabel: Record<BatteryChemistry, string> = {
  'VRLA-AGM': 'VRLA AGM (Sealed Lead-Acid)',
  'VRLA-GEL': 'VRLA Gel (Sealed Lead-Acid)',
  FLA: 'Flooded Lead-Acid (Vented)',
  'Li-Ion-LFP': 'LiFePO₄ (LFP)',
  'Li-Ion-NMC': 'Li-Ion NMC',
  'Li-Ion-LTO': 'Li-Ion Titanate (LTO)',
  NiCd: 'Nickel-Cadmium (NiCd)',
  NiFe: 'Nickel-Iron (NiFe / Edison)',
  'Flow-Vanadium': 'Vanadium Redox Flow',
}

const CANONICAL_IDS = new Set<string>(ALL_BATTERY_TYPES.map((b) => b.id))

/**
 * Resolve any chemistry id (canonical or legacy) to a canonical BatteryChemistry.
 * Falls back to VRLA-AGM for unknown values (defensive — should not occur after
 * schema validation), so a corrupted persisted value never throws on load.
 */
export function toCanonicalChemistry(id: string): BatteryChemistry {
  if (CANONICAL_IDS.has(id)) return id as BatteryChemistry
  return legacyToCanonical[id] ?? 'VRLA-AGM'
}

/** Ordered list of canonical chemistries for rendering selects. */
export const CANONICAL_CHEMISTRY_ORDER: BatteryChemistry[] = ALL_BATTERY_TYPES.map((b) => b.id)
