# Contract: Arc Flash Calculation Modules

**Feature**: `012-arc-flash` | **Date**: 2026-10-04

ElectroMate calculators run **client-side with no server API** (ADR-001 / ADR-004 pattern). So the contracts are the **pure-function interfaces** of `lib/calculations/arc-flash/` and `lib/standards/nfpa70e.ts`. Every function is synchronous, deterministic and side-effect free, and doesn't depend on React, Zustand or the DOM. All units are SI as given in [data-model.md](../data-model.md).

---

## 1. `ieee1584.ts` — model core

```ts
/** Table 2 polynomial; voltageKV = Voc / 1000. Range-checked by caller. */
export function variationCorrectionFactor(config: ElectrodeConfig, voltageKV: number): number

/** Eq. 1 at one Table-1 voltage level. */
export function intermediateArcingCurrent(
  level: 600 | 2700 | 14300, config: ElectrodeConfig, boltedFaultKA: number, gapMm: number
): number

/** Eqs. 11–15 + Table 7 (research R6). Open-air → { type: 'open-air', cf: 1, ... }. */
export function enclosureCorrection(
  config: ElectrodeConfig, voltageV: number,
  enclosure: { heightMm: number; widthMm: number; depthMm: number } | null
): EnclosureCorrection

/** Full calculation for one arcing case (research R4 term rules). */
export function calculateCase(params: {
  voltageV: number; boltedFaultKA: number; config: ElectrodeConfig; gapMm: number
  workingDistanceMm: number; arcingTimeMs: number; cf: number; arcingCase: ArcingCase
}): CaseResult
```

**Postconditions**
- `calculateCase(...).incidentEnergyJcm2 > 0`, `arcFlashBoundaryMm > 0`, `arcingCurrentKA < boltedFaultKA`.
- E is linear in `arcingTimeMs`: doubling T doubles E (property test).
- `reduced.arcingCurrentKA < nominal.arcingCurrentKA` for every config and voltage in range.
- Voc ≤ 600 V uses the LV path (Eq. 25), including **exactly 600 V** (research R3).

## 2. `arcFlashCalculator.ts` — orchestration

```ts
export function calculateArcFlash(input: ArcFlashInput): ArcFlashResult
```

- **Precondition**: `input` has passed `validateArcFlashInput` (blocking rules). Calling it with invalid input throws `ArcFlashRangeError` (defensive; the UI never reaches this).
- Runs `calculateCase` for both cases with their own arcing times (spec FR-007). Applies the 2 s cap only if `applyTwoSecondCap` is set.
- `governingCase` = the case with the higher `incidentEnergyJcm2`; a tie → `'nominal'`.
- Collects non-blocking warnings (data-model `ArcFlashWarning` codes).

## 3. `ppe.ts` — PPE assessment

```ts
export function assessPpe(
  result: ArcFlashResult, input: ArcFlashInput, standard: ArcFlashStandard
): PpeAssessment

export function ppeCategoryFromEnergy(energyCalcm2: number): PpeOutcome   // thresholds R8
export function evaluateTableMethod(
  rowId: Nfpa70eTableRowId, input: ArcFlashInput
): { applicable: boolean; category: 1 | 2 | 4; afbMm: number; failedLimits: string[] }
export function approachBoundaries(voltageV: number): ApproachBoundaries
```

**Category mapping** (inclusive upper bounds):

| E (cal/cm²) | Outcome |
|---|---|
| < 1.2 | `'below-threshold'` |
| 1.2 – 4.0 | 1 |
| > 4.0 – 8.0 | 2 |
| > 8.0 – 25.0 | 3 |
| > 25.0 – 40.0 | 4 |
| > 40.0 | `'danger'` |

`evaluateTableMethod` checks voltage class, I_bf ≤ max, **nominal** arcing time ≤ max clearing time, and D ≥ min working distance. Every violated limit is returned in `failedLimits`.

## 4. `lib/validation/arcFlashValidation.ts`

```ts
export const arcFlashInputSchema: z.ZodType<ArcFlashInput>   // blocking rules (R7)
export function validateArcFlashInput(input: unknown):
  { success: true; data: ArcFlashInput } | { success: false; errors: FieldError[] }

type FieldError = { field: keyof ArcFlashInput | `enclosure.${string}`; message: string; clause: string }
```

**Error taxonomy** (each message names the limit and its source clause, per SC-004):

| Code | Field | Example message |
|---|---|---|
| `VOLTAGE_RANGE` | voltageV | "Voltage must be 208–15,000 V (IEEE 1584-2018 §1.1 model range)" |
| `IBF_RANGE` | boltedFaultKA | "For 208–600 V, bolted fault current must be 0.5–106 kA" |
| `GAP_RANGE` | gapMm | "For 601 V–15 kV, gap must be 19.05–254 mm" |
| `WD_MIN` | workingDistanceMm | "Working distance must be ≥ 305 mm" |
| `POSITIVE` | any numeric | "Must be greater than 0" |
| `ENCLOSURE_REQUIRED` | enclosure | "Enclosure dimensions are required for VCB/VCBB/HCB" |
| `TABLE_ROW_REQUIRED` | tableRowId | "Select an equipment type for the table method" |

Validation must complete in < 100 ms (Constitution II); in practice it's microseconds.

## 5. `lib/pdfGenerator.arcFlash.ts`

```ts
export function generateArcFlashPDF(
  input: ArcFlashInput, result: ArcFlashResult, ppe: PpeAssessment, standard: ArcFlashStandard
): jsPDF
export function downloadArcFlashPDF(...same): void   // blob → anchor click (existing pattern)
```

Content (spec FR-018, Constitution VI): header + timestamp + app version, inputs with units, enclosure correction, both case results with intermediates, governing case highlighted, PPE assessment, approach boundaries, label rendering, standard references with clause/equation numbers, and the disclaimer.

## Versioning

The modules are internal, so there's no external versioning. `standardRefs` pins edition years (IEEE 1584-**2018**, NFPA 70E-**2024**, IEC 61482-1-1:**2019**, IEC 61482-2:**2018**). A future edition is a new data table plus a reference change, not an API change.
