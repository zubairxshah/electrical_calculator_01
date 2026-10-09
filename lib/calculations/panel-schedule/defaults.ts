/**
 * Category metadata and defaults (research R4, R5).
 */
import type { LoadCategory, Occupancy } from '@/types/panel-schedule'

export const LOAD_CATEGORIES: LoadCategory[] = [
  'lighting', 'receptacle', 'motor', 'hvac-heating', 'hvac-cooling',
  'kitchen', 'water-heater', 'ev-charger', 'other-continuous', 'other-noncontinuous',
]

export const CATEGORY_LABELS: Record<LoadCategory, string> = {
  lighting: 'General lighting',
  receptacle: 'Receptacles',
  motor: 'Motor',
  'hvac-heating': 'HVAC — heating',
  'hvac-cooling': 'HVAC — cooling',
  kitchen: 'Kitchen equipment',
  'water-heater': 'Water heater',
  'ev-charger': 'EV charger',
  'other-continuous': 'Other — continuous',
  'other-noncontinuous': 'Other — non-continuous',
}

/** Default continuous flag per category (NEC 625.41 EV, 422.13 water heaters; lighting by practice) */
export const CATEGORY_DEFAULT_CONTINUOUS: Record<LoadCategory, boolean> = {
  lighting: true,
  receptacle: false,
  motor: false,
  'hvac-heating': false,
  'hvac-cooling': false,
  kitchen: false,
  'water-heater': true,
  'ev-charger': true,
  'other-continuous': true,
  'other-noncontinuous': false,
}

/** IEC per-category diversity defaults — 1.0 everywhere (conservative, research R5) */
export const DEFAULT_IEC_DIVERSITY: Record<LoadCategory, number> = {
  lighting: 1, receptacle: 1, motor: 1, 'hvac-heating': 1, 'hvac-cooling': 1,
  kitchen: 1, 'water-heater': 1, 'ev-charger': 1, 'other-continuous': 1, 'other-noncontinuous': 1,
}

/** Typical-range hints shown beside the IEC diversity editor (guidance only, not standard values) */
export const IEC_DIVERSITY_HINTS: Record<LoadCategory, string> = {
  lighting: 'typically 0.9–1.0',
  receptacle: 'typically 0.2–0.5',
  motor: 'typically 0.75–1.0',
  'hvac-heating': 'typically 0.8–1.0',
  'hvac-cooling': 'typically 0.8–1.0',
  kitchen: 'typically 0.6–0.8',
  'water-heater': 'typically 1.0',
  'ev-charger': 'typically 1.0 (or per load management)',
  'other-continuous': 'typically 1.0',
  'other-noncontinuous': 'typically 0.5–1.0',
}

export const OCCUPANCY_LABELS: Record<Occupancy, string> = {
  other: 'All others (100%)',
  dwelling: 'Dwelling units',
  hotel: 'Hotels & motels (no tenant cooking)',
  warehouse: 'Warehouses (storage)',
  hospital: 'Hospitals',
}

export const SPACE_PRESETS = [12, 18, 24, 30, 42, 54, 60, 84] as const
