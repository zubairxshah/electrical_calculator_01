# Phase 1 Data Model: Battery Calculator Revamp

**Feature**: `011-battery-revamp` | **Date**: 2026-06-21

Entities below extend the existing `lib/types/calculations.ts` shapes. New/changed fields are marked **(new)** or **(changed)**. All BigNumber values use the existing `lib/mathConfig`.

---

## Entity: BatteryChemistryProfile

Canonical per-chemistry reference — **already defined** as `BatteryTypeSpec` in `lib/standards/batteryTypes.ts`. This feature *consumes* it (no schema change), drawing sizing defaults from existing fields:

| Field used by sizing | Source path | Role |
|---|---|---|
| `depthOfDischarge.recommended` / `.maximum` | existing | DoD ceiling + override clamp |
| `efficiency.roundTrip.typical` | existing | default efficiency factor |
| `temperature.optimal` / `.operating` / `.tempCoefficient` | existing | temperature correction + range warning |
| `lifespan.cycleLifeDoD`, `.cycleLife` | existing | recommendation context |
| `standardReferences` | existing | result/PDF citations |
| `peukertExponent` | **(new)** | rate derating (D3); add per chemistry |

`BatteryChemistry` union (8 canonical IDs) becomes the **single source of truth** for the schema, form, and types.

---

## Entity: ChemistryIdMap **(new)**

`lib/standards/batteryChemistryMap.ts` — maps legacy persisted/schema IDs to canonical IDs and carries display metadata.

| Field | Type | Notes |
|---|---|---|
| `legacyToCanonical` | `Record<string, BatteryChemistry>` | `VRLA-Gel→VRLA-GEL`, `FLA→VRLA-GEL`, `LiFePO4→Li-Ion-LFP`, `Li-ion→Li-Ion-NMC`, identity for the rest |
| `displayLabel` | `Record<BatteryChemistry, string>` | dropdown text (e.g., `Li-Ion-LFP → "LiFePO₄ (LFP)"`) |

Used by: Zod schema preprocessing, form options, and the store persist `migrate`.

---

## Entity: SizingInputSet **(changed — BatteryCalculatorInputs)**

| Field | Type | New? | Validation |
|---|---|---|---|
| `voltage` | number | — | 1–2000 V |
| `loadWatts` | number | — | 1–1,000,000 W |
| `chemistry` | `BatteryChemistry` | **changed** | canonical 8-value enum |
| `mode` | `'runtime' \| 'sizing'` | **(new)** | required; drives which of the two below applies |
| `ampHours` | number | — | required when `mode='runtime'`; 1–10,000 Ah |
| `targetBackupHours` | number | **(new)** | required when `mode='sizing'`; > 0, ≤ 240 h |
| `efficiency` | number | — | 0.1–1.0; default from chemistry |
| `agingFactor` | number | — | 0.5–1.0; default 0.8 |
| `temperature` | number | **(used)** | −40…65 °C; default 25; warn outside chemistry `operating` |
| `dodOverride` | number | **(new)** | optional; ≤ chemistry `.maximum`; default chemistry `.recommended` |
| `cellBlockVoltage` | number | **(new)** | optional; nominal per-cell/block V for series count; default by chemistry |
| `datasheetId` | string \| null | **(new)** | optional; references a DatasheetEntry |

**State note**: factors not supplied by the user are auto-filled from the chemistry profile and flagged as defaults vs. user-supplied for display (FR-012/FR-013).

---

## Entity: SizingResult **(changed — BatteryCalculatorResult)**

| Field | Type | New? | Notes |
|---|---|---|---|
| `mode` | `'runtime' \| 'sizing'` | **(new)** | echoes input |
| `backupTimeHours` | BigNumber | — | headline when `mode='runtime'` |
| `requiredCapacityAh` | BigNumber | **(new)** | headline when `mode='sizing'` (nameplate, pre-rounding) |
| `effectiveCapacityAh` | BigNumber | — | usable after all factors |
| `dischargeRate` | BigNumber | — | effective continuous C-rate |
| `appliedFactors` | `AppliedFactors` | **(new)** | DoD, temp, aging, efficiency, peukert — value + source(default/user/datasheet) |
| `bankConfig` | `BankConfig` | **(new)** | series/parallel + delivered capacity |
| `verdict` | `'pass' \| 'marginal' \| 'fail'` | **(new)** | plus a plain-language string |
| `recommendations` | string[] | **(new)** | actionable guidance |
| `dischargeCurve` | `DischargeCurvePoint[]` | **(populate)** | field exists; now filled for the chart |
| `warnings` | `BatteryWarning[]` | — | extend with chemistry-limit + temperature-range types |
| `standards` | string[] | **(changed)** | the standards actually applied for this result |

### Sub-type: AppliedFactors **(new)**
`{ dod: FactorValue; temperature: FactorValue; aging: FactorValue; efficiency: FactorValue; peukert: FactorValue }`
where `FactorValue = { value: number; source: 'default' | 'user' | 'datasheet'; standardReference?: string }`.

### Sub-type: BankConfig **(new)**
`{ cellsInSeries: number; stringsInParallel: number; nominalBankVoltage: number; nameplateBankAh: number; deliveredCapacityAh: number; overCapacityPct: number }`.

---

## Entity: DatasheetEntry **(new)**

`lib/datasheets/library.ts` — curated manufacturer model.

| Field | Type | Notes |
|---|---|---|
| `id` | string | stable key |
| `manufacturer` | string | |
| `model` | string | |
| `chemistry` | `BatteryChemistry` | must be canonical |
| `nominalVoltage` | number | V |
| `nameplateAh` | number | at stated rate |
| `ratedAtCRate` | string | e.g., `C/20` |
| `peukertExponent` | number \| null | overrides chemistry default when known |
| `tempDerate` | `{ tempC: number; factor: number }[]` \| null | model curve when published |
| `sourceUrl` | string \| null | datasheet reference |

---

## Validation & state transitions

- **Mode toggle**: switching `runtime ↔ sizing` clears the now-irrelevant headline but preserves shared inputs (voltage, load, chemistry, conditions).
- **Override clamp**: `dodOverride > chemistry.maximum` → warn + clamp; never silently exceed.
- **Temperature range**: outside `chemistry.temperature.operating` → strong warning; outside hard physical bounds → error (no result).
- **Datasheet vs chemistry conflict**: `datasheetId.chemistry !== inputs.chemistry` → warn and offer to adopt the datasheet's chemistry.
- **Non-integer strings**: reverse sizing rounds `stringsInParallel` up to the next whole string; `overCapacityPct` discloses the resulting margin.
- **Persistence**: `persist` `version` incremented; `migrate` rewrites legacy `chemistry` via ChemistryIdMap and backfills `mode='runtime'`, `temperature=25`, and other new optional fields.
