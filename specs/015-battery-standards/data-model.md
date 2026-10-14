# Data Model: Battery Standards Hardening (015)

## BatteryCalculatorInputs (extended — `lib/types/calculations.ts`)

| Field | Type | Default | Validation | Notes |
|---|---|---|---|---|
| `application` | `'standby' \| 'cycling'` | `'standby'` | enum | D1 |
| `loadType` | `'ac' \| 'dc'` | `'ac'` | enum | picks the efficiency default |
| `efficiency` | number? | 0.95 ac / 1.00 dc | 0.50–1.00 | **meaning changed** to conversion efficiency (D2) |
| `designMargin` | number? | 1.10 | 1.00–1.50 | D3 |
| `minLoadVoltage` | number? | — | > 0, < `maxLoadVoltage` | replaces the unused `minVoltage` (kept as a deprecated alias, read once in migration) |
| `maxLoadVoltage` | number? | — | > `minLoadVoltage` | |
| `endVoltagePerCell` | number? | chemistry default | > 0, < nominal cell V | D6 |
| `rechargeHours` | number? | 8 | > 0, ≤ 168 | D7 |
| `standingLoadAmps` | number? | 0 | ≥ 0 | D7 |
| `rechargeFactor` | number? | chemistry default | 1.00–1.50 | D7 |
| `roomVolumeM3` | number? | — | > 0 | D8 |

All existing fields stay.

## BatteryElectricalProfile (new map in `lib/standards/batteryReference.ts`, keyed by chemistry; `BatteryTypeSpec` unchanged)

```ts
electrical: {
  nominalCellVoltage: number
  floatVoltagePerCell: number
  endVoltagePerCell: number
}
charging: { rechargeFactor: number; maxChargeCRate: number }
ventilation: { igasFloat: number; igasBoost: number } | null   // mA/Ah; null = n/a
usesLeadAcidTempTable: boolean
```

## New reference module — `lib/standards/batteryReference.ts`

- `LEAD_ACID_TEMP_TABLE: { c: number; tcf: number }[]` (D5)
- `STANDARD_CHARGER_RATINGS_A: number[]` (D7)
- `NFPA855_THRESHOLDS_KWH: Record<category, number>` (D9)
- `NEC480_DISCONNECT_V = 60`, `NEC706_ESS_MIN_KWH = 1`

## AppliedFactors (extended)

Adds `designMargin: FactorValue`. `efficiency` now holds conversion efficiency. `dod.value = 1` in standby. `temperature.value` is still an *available fraction* (1/TCF for lead-acid), and a new optional `temperature.tcf` shows the IEEE 485 cell-size multiplier.

## BatteryCalculatorResult (extended)

```ts
application: 'standby' | 'cycling'
voltageWindow: {
  source: 'window' | 'block'           // FR-015
  cellsInSeries: number
  endVoltagePerCell: number
  nominalBankV: number; floatBankV: number; endBankV: number
} 
charger: {
  ahRemoved: number; rechargeFactor: FactorValue; rechargeHours: number
  standingLoadAmps: number; requiredAmps: number; recommendedRatingA: number
  chargeCRate: number
} | null                                // null when recharge input invalid
ventilation: {
  applicable: boolean; cells: number; ratedAh: number
  igasFloat?: number; igasBoost?: number
  qFloatM3h?: number; qBoostM3h?: number; airChangesPerHour?: number
  note: string
}
installationChecks: InstallationCheck[]
bankEnergyKWh: number
```

`InstallationCheck = { code: 'NEC 480.7' | 'NEC 480.10' | 'NEC 706' | 'NFPA 855'; severity: 'info' | 'warning'; message: string; standardReference: string }`

New `BatteryWarningType` values: `'voltage-window'`, `'temperature-table-clamped'`, `'charge-rate'`.

## Persisted store — `stores/useBatteryStore.ts`

`version: 1 → 2`. `migrate(state, from)`:
- from < 2: `application = 'standby'`, `loadType = 'ac'`, delete `efficiency` (old round-trip meaning), `minLoadVoltage = minVoltage` if it was set; everything else kept.
- The existing v0→v1 chemistry mapping still runs first.
