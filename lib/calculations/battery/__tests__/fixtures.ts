/**
 * Battery sizing accuracy fixtures — USER-APPROVED 2026-06-21 (T006 checkpoint).
 *
 * Constitution Principle V requires user sign-off on test cases before Green.
 * These are the ±2% accuracy targets for the corrected-capacity method
 * (ADR-006). All accuracy fixtures use a C/20 discharge rate so the Peukert
 * factor is exactly 1.0, isolating the standards math (DoD × Temp × Eff × Aging).
 * Peukert rate-derating is validated separately at the spot-check points below.
 *
 * Method (forward runtime):
 *   usable_Wh = Installed_Ah × V_dc × (DoD × TempFactor × Efficiency × Aging × Peukert)
 *   runtime_h = usable_Wh / Load_W
 * Reverse (sizing) is the algebraic inverse.
 *
 * @see specs/011-battery-revamp/research.md (D1–D3), contracts/sizing-engine.contract.md (G1–G3)
 */

export interface RuntimeFixture {
  name: string
  mode: 'runtime'
  inputs: {
    voltage: number
    ampHours: number
    loadWatts: number
    chemistry: string
    temperature: number
    agingFactor: number
  }
  expected: {
    backupTimeHours: number
    effectiveCapacityAh: number
    /** C-rate as a fraction (0.05 == C/20) */
    dischargeRate: number
  }
  tolerancePct: number
}

export interface SizingFixture {
  name: string
  mode: 'sizing'
  inputs: {
    voltage: number
    loadWatts: number
    targetBackupHours: number
    chemistry: string
    temperature: number
    agingFactor: number
    cellBlockVoltage: number
    perUnitAh: number
  }
  expected: {
    requiredCapacityAh: number
    cellsInSeries: number
    stringsInParallel: number
  }
  tolerancePct: number
}

/** Forward runtime fixtures (A, B, C, E, F). */
export const RUNTIME_FIXTURES: RuntimeFixture[] = [
  {
    name: 'A · VRLA-AGM @ C/20, 25°C',
    mode: 'runtime',
    inputs: { voltage: 48, ampHours: 200, loadWatts: 480, chemistry: 'VRLA-AGM', temperature: 25, agingFactor: 0.8 },
    // 0.50 · 1.00 · 0.85 · 0.80 · 1.0 = 0.340 → 200·48·0.340 = 3264 Wh → /480 = 6.80 h
    expected: { backupTimeHours: 6.80, effectiveCapacityAh: 68.0, dischargeRate: 0.05 },
    tolerancePct: 2,
  },
  {
    name: 'B · Li-Ion-LFP @ C/20, 25°C (chemistry sensitivity vs A — G1)',
    mode: 'runtime',
    inputs: { voltage: 48, ampHours: 200, loadWatts: 480, chemistry: 'Li-Ion-LFP', temperature: 25, agingFactor: 0.8 },
    // 0.80 · 1.00 · 0.95 · 0.80 · 1.0 = 0.608 → 200·48·0.608 = 5836.8 Wh → /480 = 12.16 h
    expected: { backupTimeHours: 12.16, effectiveCapacityAh: 121.6, dischargeRate: 0.05 },
    tolerancePct: 2,
  },
  {
    name: 'C · VRLA-AGM @ C/20, 0°C (temperature correction)',
    mode: 'runtime',
    inputs: { voltage: 48, ampHours: 200, loadWatts: 480, chemistry: 'VRLA-AGM', temperature: 0, agingFactor: 0.8 },
    // TempFactor = 1 - 0.02·(20-0) = 0.60 → 0.50·0.60·0.85·0.80 = 0.204 → 200·48·0.204 = 1958.4 Wh → /480 = 4.08 h
    expected: { backupTimeHours: 4.08, effectiveCapacityAh: 40.8, dischargeRate: 0.05 },
    tolerancePct: 2,
  },
  {
    name: 'E · NiCd @ C/20, 25°C',
    mode: 'runtime',
    inputs: { voltage: 48, ampHours: 200, loadWatts: 480, chemistry: 'NiCd', temperature: 25, agingFactor: 0.8 },
    // 0.80 · 1.00 · 0.75 · 0.80 · 1.0 = 0.480 → 200·48·0.480 = 4608 Wh → /480 = 9.60 h
    expected: { backupTimeHours: 9.60, effectiveCapacityAh: 96.0, dischargeRate: 0.05 },
    tolerancePct: 2,
  },
  {
    name: 'F · FLA (new profile) @ C/20, 25°C',
    mode: 'runtime',
    inputs: { voltage: 48, ampHours: 200, loadWatts: 480, chemistry: 'FLA', temperature: 25, agingFactor: 0.8 },
    // 0.50 · 1.00 · 0.80 · 0.80 · 1.0 = 0.320 → 200·48·0.320 = 3072 Wh → /480 = 6.40 h
    expected: { backupTimeHours: 6.40, effectiveCapacityAh: 64.0, dischargeRate: 0.05 },
    tolerancePct: 2,
  },
]

/** Reverse sizing fixture (D) — exact inverse of A; must round-trip (G2). */
export const SIZING_FIXTURES: SizingFixture[] = [
  {
    name: 'D · VRLA-AGM sizing, target 6.80 h (inverse of A)',
    mode: 'sizing',
    inputs: {
      voltage: 48, loadWatts: 480, targetBackupHours: 6.8, chemistry: 'VRLA-AGM',
      temperature: 25, agingFactor: 0.8, cellBlockVoltage: 12, perUnitAh: 100,
    },
    // (480·6.8) / (48·0.50·1.0·0.85·0.80·1.0) = 3264 / 16.32 = 200.0 Ah → 4S (48/12) × 2P (ceil 200/100)
    expected: { requiredCapacityAh: 200.0, cellsInSeries: 4, stringsInParallel: 2 },
    tolerancePct: 2,
  },
]

/**
 * Peukert spot-checks for derating.test.ts (separate from the C/20 accuracy fixtures).
 * derate = (I_rated / I)^(n-1), with I_rated = Ah/20.
 * Approved exponents: lead-acid 1.2, NiCd/NiFe 1.1, lithium/flow 1.02, FLA 1.25.
 */
export const PEUKERT_SPOTCHECKS = [
  { exponent: 1.02, cRateRatio: 4.1667, approxMultiplier: 0.972 }, // lithium — near flat
  { exponent: 1.2, cRateRatio: 4.1667, approxMultiplier: 0.752 },  // lead-acid AGM at ~C/4.8
  { exponent: 1.0, cRateRatio: 4.1667, approxMultiplier: 1.0 },    // exponent 1 → no derate
] as const
