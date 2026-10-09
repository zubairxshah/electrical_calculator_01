# Contract: Panel Schedule Calculation Modules

**Feature**: `013-panel-schedule` | **Date**: 2026-10-07

Client-side only (ADR-001/004). The contracts are pure, synchronous and deterministic functions in `lib/calculations/panel-schedule/`, with no React, Zustand or DOM.

## 1. `system.ts`

```ts
export function getSystem(panel: Pick<Panel, 'systemType' | 'customSystem' | 'standard'>): SystemDefinition
export function phaseOfSpace(space: number, system: SystemDefinition): Phase   // R1
export function spacesFor(start: number, poles: number): number[]              // n, n+2, n+4
```

## 2. `loads.ts`

```ts
export function circuitVA(c: Circuit, system: SystemDefinition, standard: PanelStandard): number
// HP: NEC → table FLC (motorFlc.ts) × V × (√3 if 3-pole); IEC → HP×0.7457 kW → kW/(η·PF)
// W/kW → /PF; kVA → ×1000. Throws PanelError('MOTOR_HP_NOT_IN_TABLE') when out of table.
export function branchCurrent(va: number, poles: 1|2|3, system: SystemDefinition): number  // R2
```

## 3. `placement.ts`

```ts
export function validatePlacement(circuits: Circuit[], spaces: number, system: SystemDefinition): PlacementIssue[]
export function autoPlace(circuits: Circuit[], spaces: number, system): { circuits: Circuit[]; unplaced: string[] }
export function occupancyMap(circuits: Circuit[]): Map<number, { circuitId: string; poleIndex: number }>
```

PlacementIssue codes: `OVERLAP`, `OUT_OF_RANGE`, `TOO_MANY_POLES`, `ONE_POLE_ON_DELTA`, `NO_FREE_SPACE`.

## 4. `schedule.ts`

```ts
export function calculateSchedule(panel: Panel): ScheduleResult
// { system, circuitLoads: CircuitLoad[], summary: PhaseSummary, issues: PlacementIssue[], warnings }
export function summarise(loads: CircuitLoad[], circuits: Circuit[], system, spaces, targetPct): PhaseSummary
export function imbalancePct(phaseVA: number[]): number | null   // max|x−avg|/avg×100
export function neutralCurrent(lnCurrents: number[], system): number | null // R3
```

## 5. `demand.ts`

```ts
export function calculateDemand(panel: Panel, schedule: ScheduleResult): DemandResult   // uses schedule.circuitLoads + schedule.system
export function lightingDemandNec(va: number, occ: Occupancy): number        // Table 220.42
export function receptacleDemandNec(va: number): number                      // Table 220.44
export function kitchenDemandNec(vas: number[]): number                       // Table 220.56
export function iecRatedDiversityFactor(mainCircuits: number): number        // IEC 61439-2
```

Postconditions: `demandVA ≥ 0`. In NEC mode with all categories 'other-noncontinuous', `demandVA = connectedVA`. `recommendedMainA ≥ designCurrentA`.

## 6. `balance.ts`

```ts
export function proposeBalance(panel: Panel): BalanceProposal   // R7
export function applyProposal(panel: Panel, p: BalanceProposal): Panel
```

Postconditions:
- Locked circuits and spare/space entries keep their `startSpace`.
- Every assignment satisfies the placement invariant (no overlap, in range).
- `after.imbalancePct ≤ before.imbalancePct` (never worse).
- Total VA and per-circuit VA are unchanged.
- The function is deterministic: the same input gives a deep-equal output.

## 7. `lib/standards/motorFlc.ts`

```ts
export const NEC_TABLE_430_248: Record<number /*HP*/, Partial<Record<115|200|208|230, number>>>
export const NEC_TABLE_430_250: Record<number, Partial<Record<200|208|230|460|575, number>>>
export function necMotorFlc(hp: number, phases: 1|3, systemV: number): number | null
```

## 8. Validation (`lib/validation/panelScheduleValidation.ts`)

Zod schemas `panelSchema` and `circuitSchema`, field-level messages, plus `validatePanel(panel): { errors, warnings }` combining the schemas and the placement issues.

## Error / warning taxonomy

| Code | Severity | Message (abridged) | Ref |
|---|---|---|---|
| OVERLAP | error | Circuit X overlaps space n used by Y | NEC 408.3(E) numbering |
| OUT_OF_RANGE | error | Needs spaces beyond panel size | — |
| TOO_MANY_POLES | error | 3-pole circuit on single-phase panel | — |
| ONE_POLE_ON_DELTA | error | No neutral on 3W delta | — |
| MOTOR_HP_NOT_IN_TABLE | error | HP not in Table 430.248/250, enter VA | NEC 430.6(A)(1) |
| BREAKER_UNDERSIZED | warning | Breaker < 125% continuous load | NEC 210.20(A) |
| IMBALANCE_HIGH | warning | Imbalance x% > target | — |
| BUS_EXCEEDED | error-styled warning | Design current > bus rating | NEC 408.30 |
| MAIN_EXCEEDED | error-styled warning | Design current > main rating | NEC 408.36 |
| MAIN_OVER_BUS | warning | Main rating > bus rating | NEC 408.36 |
| SPACES_FULL | warning | No free spaces left | — |
| LIGHTING_FACTOR_NOTE | info | Table 220.42 factor exclusion for areas lit all at once | Table 220.42 note |
