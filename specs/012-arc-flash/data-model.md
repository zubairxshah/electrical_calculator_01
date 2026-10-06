# Data Model: Arc Flash Calculator

**Feature**: `012-arc-flash` | **Date**: 2026-10-04 | **Source**: spec Key Entities + research R4–R10

All entities are TypeScript types in `types/arc-flash.ts`. Internal units are **SI**: V, kA, mm, ms, J/cm². Unit conversion happens only at the UI/PDF boundary.

---

## Enumerations

```ts
type ArcFlashStandard = 'NEC' | 'IEC'                     // presentation mode only (R9)
type ElectrodeConfig = 'VCB' | 'VCBB' | 'HCB' | 'VOA' | 'HOA'
type EnclosureType = 'typical' | 'shallow' | 'open-air'   // derived (R6)
type ArcingCase = 'nominal' | 'reduced'
type PpeOutcome = 'below-threshold' | 1 | 2 | 3 | 4 | 'danger'
type PpeMethod = 'incident-energy' | 'table'
type EquipmentClassId =
  | 'kv15-switchgear' | 'kv15-mcc' | 'kv5-switchgear-large' | 'kv5-switchgear-small' | 'kv5-mcc'
  | 'lv-switchgear' | 'lv-mcc-panel-shallow' | 'lv-mcc-panel-deep'
  | 'cable-jb-shallow' | 'cable-jb-deep' | 'custom'
type Nfpa70eTableRowId = string                           // e.g. 'panelboard-le240', 'mcc-600-42ka'
```

---

## ArcFlashInput (spec: Arc Flash Input)

| Field | Type | Unit | Validation (R7) | Notes |
|---|---|---|---|---|
| equipmentId | string | — | ≤ 60 chars, optional | Label + history title |
| projectName | string | — | ≤ 100 chars, optional | PDF header |
| voltageV | number | V (L-L, Voc) | 208 ≤ v ≤ 15000 **(block)** | |
| frequencyHz | 50 \| 60 | Hz | enum | Informational (model is frequency-independent) |
| boltedFaultKA | number | kA | 0.5–106 (≤ 600 V); 0.2–65 (> 600 V) **(block)** | |
| electrodeConfig | ElectrodeConfig | — | enum | |
| gapMm | number | mm | 6.35–76.2 (≤ 600 V); 19.05–254 (> 600 V) **(block)** | |
| workingDistanceMm | number | mm | ≥ 305 **(block)** | |
| enclosure | { heightMm, widthMm, depthMm } \| null | mm | each > 0 **(block)**; > 1244.6 → warn (capped); width < 4·G → warn | `null` iff VOA/HOA |
| arcingTimeNominalMs | number | ms | > 0 **(block)**; > 2000 → warn | Spec FR-007 |
| arcingTimeReducedMs | number | ms | > 0 **(block)**; < nominal → warn | Spec FR-007 |
| sameTimeForBoth | boolean | — | — | UI convenience: mirrors nominal → reduced |
| applyTwoSecondCap | boolean | — | — | Only offered when either time > 2000 ms (R7) |
| equipmentClass | EquipmentClassId | — | enum | Pre-fill source; becomes `'custom'` once a pre-filled value is edited |
| ppeMethod | PpeMethod | — | enum | |
| tableRowId | Nfpa70eTableRowId \| null | — | required iff ppeMethod = 'table' | |

**Invariants**
- `enclosure === null ⇔ electrodeConfig ∈ {VOA, HOA}`.
- When `sameTimeForBoth` is true, `arcingTimeReducedMs === arcingTimeNominalMs`.
- The voltage determines the valid I_bf and gap ranges. Changing the voltage across the 600 V boundary re-validates both.

---

## CaseResult (one per ArcingCase)

| Field | Type | Unit | Notes |
|---|---|---|---|
| case | ArcingCase | — | |
| arcingCurrentKA | number | kA | Final (LV Eq. 25, or MV interpolated) |
| arcingTimeMs | number | ms | After the optional 2 s cap |
| incidentEnergyJcm2 | number | J/cm² | |
| incidentEnergyCalcm2 | number | cal/cm² | = J/cm² ÷ 4.184 |
| arcFlashBoundaryMm | number | mm | Distance where E = 5.0 J/cm² (1.2 cal/cm²) |
| intermediates | IntermediateValues | — | For "calculation details" (FR-009) |

**IntermediateValues**
- `iArc600KA`, `iArc2700KA?`, `iArc14300KA?` (MV only)
- `e600?`, `e2700?`, `e14300?`, `afb600?`, `afb2700?`, `afb14300?` (MV only)
- `reductionFactor` (= 1 − 0.5·VarCf for reduced; 1 for nominal)

---

## ArcFlashResult (spec: Arc Flash Result)

| Field | Type | Notes |
|---|---|---|
| nominal | CaseResult | |
| reduced | CaseResult | |
| governingCase | ArcingCase | Case with the higher incident energy. Tie → 'nominal' |
| governing | CaseResult | Alias for display |
| varCf | number | Table 2 polynomial at Voc (kV) |
| enclosure | { type: EnclosureType; equivalentWidthIn; equivalentHeightIn; ees; cf } | R6; CF = 1 for open-air |
| warnings | ArcFlashWarning[] | Non-blocking (R7) |
| modelPath | 'LV' \| 'MV' | LV iff Voc ≤ 600 V (R3 erratum) |
| standardRefs | string[] | e.g. 'IEEE 1584-2018 §4.10 Eq. 25' |
| calculatedAt | string (ISO) | |

**ArcFlashWarning** `{ code: string; severity: 'warning' | 'info'; message: string; clause: string }`

Codes: `ENCLOSURE_CAPPED`, `OPENING_LT_4G`, `TIME_GT_2S`, `REDUCED_TIME_SHORTER`, `LOW_VOLTAGE_SUSTAIN`, `TABLE_METHOD_NOT_APPLICABLE`.

---

## PpeAssessment (spec: PPE Assessment)

| Field | Type | Notes |
|---|---|---|
| method | PpeMethod | |
| outcome | PpeOutcome | Incident energy method: thresholds 1.2/4/8/25/40 cal/cm², inclusive upper bounds (R8) |
| minArcRatingCalcm2 | number \| null | 4/8/25/40; null for below-threshold/danger |
| minArcRatingJcm2 | number \| null | 16.75/33.5/104.7/167.5 |
| clothing | string[] | Paraphrased item names, NFPA mode |
| equipment | string[] | Paraphrased item names, NFPA mode |
| iecRequirement | { minArcRatingJcm2: number; text: string } \| null | IEC mode (R9): rating ≥ governing E |
| tableMethod | { rowId; applicable: boolean; category: 1\|2\|4; afbMm: number; failedLimits: string[] } \| null | `applicable = false` lists violated limits (FR-012) |
| approachBoundaries | { limitedMovableMm; limitedFixedMm; restricted: number \| 'avoid-contact' } | Table 130.4(E)(a) by Voc (R8) |
| references | string[] | |

**State rule**: `outcome = 'danger'` ⇒ `minArcRatingCalcm2 = null`, the label signal word is DANGER, and the UI shows a de-energize message (spec US2-AS2).

---

## ArcFlashLabel (spec: Arc Flash Label) — derived, never stored

| Field | Source |
|---|---|
| signalWord | 'DANGER' if governing E ≥ 40 cal/cm², else 'WARNING' |
| nominalVoltage | input.voltageV |
| arcFlashBoundary | governing.arcFlashBoundaryMm (unit per mode) |
| incidentEnergy + workingDistance | governing E @ input.workingDistanceMm |
| ppeCategory / minArcRating | PpeAssessment |
| limitedApproach / restrictedApproach | PpeAssessment.approachBoundaries |
| equipmentId, date | input / result.calculatedAt |

---

## ArcFlashHistoryEntry (spec: History Entry)

| Field | Type |
|---|---|
| id | string (`af-${timestamp}`) |
| timestamp | string (ISO) |
| title | string (equipmentId or `${V} V ${config} ${Ibf} kA`) |
| governingEnergyCalcm2 | number |
| outcome | PpeOutcome |
| input | ArcFlashInput |
| result | ArcFlashResult |
| ppe | PpeAssessment |

Storage: localStorage key `electromate-arc-flash-history`, FIFO, max 50 (pattern from `stores/useConduitFillStore.ts`). The persisted store state (`electromate-arc-flash`) excludes `result`, `ppe`, UI flags and errors.

---

## State transitions (UI)

```
idle ──edit──▶ dirty ──calculate──▶ [validate]
                                     ├─ blocking errors ─▶ invalid (field errors shown, no result)
                                     └─ ok ─▶ calculated (result + ppe + warnings; history entry added)
calculated ──edit any input──▶ dirty (result kept but marked stale until recalculated)
calculated ──toggle standard──▶ calculated (re-render only; numbers unchanged — SC-006)
history select ─▶ calculated (input + result restored)
```
