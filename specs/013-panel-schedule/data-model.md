# Data Model: Panel Schedule

**Feature**: 013-panel-schedule | **Date**: 2026-10-07
Units: V, A, VA. Load values are stored as entered (value + unit) and converted to VA by the engine.

## Enumerations

```ts
type PanelStandard = 'NEC' | 'IEC'
type SystemTypeId =
  | 'nec-1ph-3w-120-240' | 'nec-3ph-4w-208y120' | 'nec-3ph-4w-480y277' | 'nec-3ph-3w-240d'
  | 'iec-1ph-2w-230' | 'iec-3ph-4w-400y230' | 'custom'
type Phase = 'A' | 'B' | 'C'
type LoadUnit = 'VA' | 'W' | 'kW' | 'kVA' | 'HP'
type LoadCategory =
  | 'lighting' | 'receptacle' | 'motor' | 'hvac-heating' | 'hvac-cooling'
  | 'kitchen' | 'water-heater' | 'ev-charger' | 'other-continuous' | 'other-noncontinuous'
type Occupancy = 'other' | 'dwelling' | 'hotel' | 'warehouse' | 'hospital'
type MainType = 'main-breaker' | 'mlo'
type CircuitKind = 'load' | 'spare' | 'space'
```

## SystemDefinition (derived from SystemTypeId)

| Field | Type | Notes |
|---|---|---|
| phases | 1 \| 2 \| 3 | phase cycle length (1φ 3W = 2) |
| wires | 2 \| 3 \| 4 | |
| vLN | number \| null | null for 3W delta |
| vLL | number | for 1φ 2W, vLL = vLN = 230 |
| hasNeutral | boolean | |
| maxPoles | 1 \| 2 \| 3 | 1φ 2W → 1; 1φ 3W → 2; 3φ → 3 |
| allowOnePole | boolean | false for 3W delta |
| phaseLabels | string[] | NEC: A/B/C; IEC: L1/L2/L3 |

`custom`: the user enters phases (1 or 3), wires, vLN and vLL. Validation: for 3φ 4W, vLL ≈ √3 × vLN within 2%.

## Panel

| Field | Type | Validation |
|---|---|---|
| name | string | ≤ 40 chars |
| location, fedFrom, mounting | string | optional |
| standard | PanelStandard | |
| systemType | SystemTypeId | must match standard (nec-* for NEC, iec-* for IEC; custom either) |
| customSystem | { phases, wires, vLN, vLL } \| null | required iff custom |
| busRatingA | number | 1–6000 |
| mainType | MainType | |
| mainRatingA | number \| null | required iff main-breaker; ≤ busRatingA (warn otherwise) |
| spaces | number | even, 2–84 |
| sccrKA | number \| null | informational |
| imbalanceTargetPct | number | 1–50, default 10 |
| occupancy | Occupancy | NEC only, default 'other' |
| iecDiversity | Record<LoadCategory, number> | 0–1, default 1.0 each |
| iecApplyRdf | boolean | default false |
| iecLargestMotorAdder | boolean | default true |
| circuits | Circuit[] | |

## Circuit

| Field | Type | Validation |
|---|---|---|
| id | string | unique, stable |
| kind | CircuitKind | |
| description | string | ≤ 60 chars |
| category | LoadCategory | load only |
| loadValue | number | > 0 for load; ignored for spare/space |
| loadUnit | LoadUnit | HP only for category motor (NEC: must be in table) |
| powerFactor | number | 0.1–1.0, default 1.0 (motor IEC default 0.85) |
| efficiency | number | 0.5–1.0, IEC motor only, default 0.90 |
| continuous | boolean | default from category (research R4) |
| poles | 1 \| 2 \| 3 | ≤ system.maxPoles; 1 not allowed on 3W delta; spare/space: 1–3 |
| breakerA | number \| null | required for load and spare; null for space |
| startSpace | number \| null | null = auto-place; set by the engine after placement |
| locked | boolean | default false |
| notes | string | optional |

**Placement invariant**: a circuit with poles k starting at space n occupies `{ n + 2i | i = 0..k−1 }`. All must be ≤ spaces, and no two circuits may share a space.

## Derived: CircuitLoad (engine output per circuit)

| Field | Notes |
|---|---|
| circuitId | |
| va | total VA after unit conversion |
| spaces | number[] occupied |
| phases | Phase[] (one per pole) |
| vaPerPhase | Partial<Record<Phase, number>> |
| currentA | branch current per research R2 |
| requiredBreakerA | 1.25 × I (continuous) or I |
| warnings | CircuitWarning[] |

## Derived: PhaseSummary

| Field | Notes |
|---|---|
| perPhase | `{ phase, va, currentA, deviationPct }[]` |
| totalVA, totalCurrentA | |
| averageVA | |
| imbalancePct | null when averageVA = 0 |
| imbalanceOk | imbalancePct ≤ target |
| neutralCurrentA | null when no neutral |
| usedSpaces, freeSpaces | |

## Derived: DemandResult

| Field | Notes |
|---|---|
| rules | `DemandRuleApplication[]` = `{ id, label, reference, connectedVA, demandVA, factorText }` |
| connectedVA | Σ load VA |
| demandVA | Σ rule demand (incl. continuous and motor adders, RDF) |
| designCurrentA | demandVA / (√3·vLL) \| vLL \| v |
| recommendedMainA | next standard rating ≥ designCurrentA, null if > 6000/4000 |
| busOk, mainOk | design current ≤ bus / main |
| warnings | |

## BalanceProposal

| Field | Notes |
|---|---|
| assignments | `Record<circuitId, startSpace>` |
| before, after | PhaseSummary |
| movedCircuitIds | string[] |
| improved | boolean (after.imbalancePct < before.imbalancePct − 0.05) |
| message | e.g. "Already within target", "No unlocked circuits to move" |

## History entry

`{ id, savedAt (ISO), name, panel: Panel }`. Stored under localStorage `electromate-panel-schedule-history` (FIFO 50). The current panel persists under `electromate-panel-schedule` (Zustand persist, version 1).

## State transitions

- Add circuit → validate → auto-place if startSpace null → schedule recomputes.
- Edit poles/startSpace → re-validate placement. An invalid placement is rejected and the previous value is kept, with an error.
- Balance → proposal (no state change) → accept (startSpace updated for moved circuits) | discard.
- Change system type → circuits whose poles exceed the new maxPoles are flagged invalid until edited. Nothing is deleted silently.
