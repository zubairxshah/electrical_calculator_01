# Data Model: Motor Starting Analysis Calculator

**Feature**: 010-motor-starting | **Date**: 2026-05-04 | **Phase**: 1

## Overview

All entities are TypeScript interfaces (no database). Persistence is limited to a calculation-history Zustand store (`localStorage` via `persist` middleware). Numeric fields that participate in the per-unit chain are typed `number` at the boundary and converted to mathjs `BigNumber` inside calculation modules.

Symbols below: `?` = optional; `string (enum)` denotes a TypeScript string-literal union.

---

## Reference Entities (static lookup data, lives in `motorStartingData.ts`)

### NemaCodeLetter

| Field | Type | Description |
|-------|------|-------------|
| letter | string (enum) | `'A' \| 'B' \| 'C' \| 'D' \| 'E' \| 'F' \| 'G' \| 'H' \| 'J' \| 'K' \| 'L' \| 'M' \| 'N' \| 'P' \| 'R' \| 'S' \| 'T' \| 'U' \| 'V'` |
| kvaPerHpMin | number | Lower bound of locked-rotor kVA/HP range (NEC 430.7(B)) |
| kvaPerHpMax | number | Upper bound |
| kvaPerHpMid | number | Midpoint used as default when only letter is provided |

### IecDesignClass

| Field | Type | Description |
|-------|------|-------------|
| design | string (enum) | `'N' \| 'H'` |
| iStartPerIRatedDefault | number | Default starting current multiplier (e.g., 6.5) |
| tStartPerTRatedDefault | number | Default starting torque multiplier |
| tBreakdownPerTRated | number | Pull-out torque multiplier |

### NemaDesignClass

| Field | Type | Description |
|-------|------|-------------|
| design | string (enum) | `'A' \| 'B' \| 'C' \| 'D'` |
| iStartPerIRatedTypical | number | Typical starting-current multiplier |
| tStartPerTRated | number | Typical starting torque multiplier |
| slipPercent | number | Typical slip at rated load |

### ThermalLimitDefault

| Field | Type | Description |
|-------|------|-------------|
| hpMin | number | Lower bound of HP range |
| hpMax | number | Upper bound |
| stallTimeColdSec | number | Default cold stall time (NEMA MG 1) |
| stallTimeHotSec | number | Default hot stall time |

### Ieee1668Threshold

| Field | Type | Description |
|-------|------|-------------|
| scenario | string (enum) | `'steady_state_common' \| 'transient_motor_start' \| 'sensitive_loads'` |
| dipPercentMax | number | Allowable dip percentage |
| label | string | UI label |

### CableImpedance

| Field | Type | Description |
|-------|------|-------------|
| sizeId | string | Cross-references existing wire-size catalog (AWG/kcmil or mm²) |
| material | string (enum) | `'Cu' \| 'Al'` |
| conduitType | string (enum) | `'PVC' \| 'Steel' \| 'Aluminum'` |
| rPerMeterOhms | number | AC resistance at 75 °C |
| xPerMeterOhms | number | AC reactance |
| sourceTable | string | "NEC Ch.9 Table 9" or "IEC 60364-5-52 Table B.52.20" |

---

## Input Entities (user-supplied, validated by Zod)

### Motor

| Field | Type | Description |
|-------|------|-------------|
| ratedPower | number | HP (NEC) or kW (IEC) |
| powerUnit | string (enum) | `'HP' \| 'kW'` |
| ratedVoltage | number | Volts (line-to-line) |
| ratedCurrent | number | Full-load amps (FLA) |
| poles | number | 2, 4, 6, 8, 10, 12 |
| ratedSpeed? | number | RPM (computed from poles × frequency if absent) |
| efficiency | number | 0–1 (e.g., 0.93) |
| powerFactor | number | 0–1 |
| serviceFactor | number | Typically 1.0 or 1.15 |
| designClass | string (enum) | NEMA `'A' \| 'B' \| 'C' \| 'D'` or IEC `'N' \| 'H'` |
| codeLetter? | string | NEMA Code Letter A–V (NEC mode only) |
| lockedRotorAmps? | number | Direct LRA (override of code-letter-derived value) |
| lockedRotorMultiplier? | number | LRA expressed as × FLA |
| startingTorquePerRated? | number | Override default for design class |
| breakdownTorquePerRated? | number | Override default |
| stallTimeHotSec? | number | Override default thermal limit |
| stallTimeColdSec? | number | Override default thermal limit |

**Validation**:
- ratedPower > 0; ratedVoltage > 0; ratedCurrent > 0
- 0 < efficiency ≤ 1; 0 < powerFactor ≤ 1
- Exactly one of {codeLetter, lockedRotorAmps, lockedRotorMultiplier} provided (or fall back to design-class default)

### Load

| Field | Type | Description |
|-------|------|-------------|
| torqueProfile | string (enum) | `'constant' \| 'quadratic_fan_pump' \| 'linear'` |
| breakawayTorquePerRated | number | T_load(0) / T_motor_rated |
| inertia | number | WR² (lb-ft²) or J (kg-m²) |
| inertiaUnit | string (enum) | `'lb_ft2' \| 'kg_m2'` |

**Validation**: inertia ≥ 0 (zero permitted for unloaded test starts); breakawayTorquePerRated < motor's starting torque for the chosen method (validated as a *result*, not at input time).

### UtilitySource

| Field | Type | Description |
|-------|------|-------------|
| primaryVoltage | number | kV at the utility primary |
| shortCircuitMva? | number | Three-phase SC MVA at primary (mutually exclusive with shortCircuitAmps) |
| shortCircuitAmps? | number | Three-phase SC current at primary |
| xOverR | number | X/R ratio (default 10 for HV utility) |
| isInfiniteBus | boolean | Set when no utility data is available |

### Transformer

| Field | Type | Description |
|-------|------|-------------|
| ratedKva | number | Transformer kVA rating |
| primaryVoltageKv | number | Primary kV |
| secondaryVoltageV | number | Secondary V (matches motor ratedVoltage) |
| percentZ | number | Nameplate %Z (e.g., 5.75) |
| xOverR | number | Transformer X/R (default per IEEE C37.010) |

### CableSegment

| Field | Type | Description |
|-------|------|-------------|
| sizeId | string | Catalog ID matching `CableImpedance` |
| material | string (enum) | `'Cu' \| 'Al'` |
| lengthMeters | number | One-way length |
| parallelRuns | number | Default 1 |
| conduitType | string (enum) | `'PVC' \| 'Steel' \| 'Aluminum'` |

### SourceChain

| Field | Type | Description |
|-------|------|-------------|
| utility | UtilitySource | Upstream source |
| transformer | Transformer | Step-down |
| cable | CableSegment | Feeder to motor |
| pccLocation | string (enum) | `'transformer_secondary' \| 'motor_terminals'` — where dip is reported |

### MethodConfig

Method-specific tuning. The orchestrator builds five MethodConfig instances (one per method) from defaults + any user overrides.

| Field | Type | Description |
|-------|------|-------------|
| method | string (enum) | `'DOL' \| 'STAR_DELTA' \| 'AUTOTRANSFORMER' \| 'SOFT_STARTER' \| 'VFD'` |
| autotransformerTap? | number | 0.50, 0.65, 0.80 (Autotransformer only) |
| starDeltaTransition? | string (enum) | `'open' \| 'closed'` (Star-Delta only) |
| softStarterRampSec? | number | Linear ramp duration (Soft Starter only) |
| softStarterInitialVoltagePct? | number | Initial voltage % (e.g., 30 — Soft Starter only) |
| softStarterCurrentLimitPctFla? | number | Current ceiling (default 350 — Soft Starter only) |
| vfdHasBypass? | boolean | If true, note bypass = DOL behavior |

### MotorStartingInput

The complete bundle persisted to history.

| Field | Type | Description |
|-------|------|-------------|
| standard | string (enum) | `'NEC' \| 'IEC'` |
| motor | Motor | |
| load | Load | |
| sourceChain | SourceChain | |
| methodConfigs | MethodConfig[] | One per method |
| voltageDipThresholdPct? | number | Override IEEE 1668 default |
| voltageDipScenario | string (enum) | Picks the threshold preset |
| projectName? | string | Optional metadata for PDF |
| projectRef? | string | Optional metadata |
| createdAt | string | ISO timestamp |

---

## Computed Entities (calculator outputs)

### ThevenZResult

| Field | Type | Description |
|-------|------|-------------|
| baseKva | number | Per-unit base used for the chain |
| baseVoltageV | number | Per-unit base voltage |
| zUtilityPu | { r: number, x: number } | |
| zTransformerPu | { r: number, x: number } | |
| zCablePu | { r: number, x: number } | |
| zTotalPu | { r: number, x: number } | Sum |
| zTotalOhms | { r: number, x: number } | Converted to ohms at motor terminals |
| utilityAssumed | string (enum) | `'computed' \| 'infinite_bus'` |

### MethodResult

| Field | Type | Description |
|-------|------|-------------|
| method | string (enum) | Echoes MethodConfig.method |
| methodLabel | string | Human display name |
| startingCurrentLineAmps | number | Source-side current during start |
| startingCurrentMotorAmps | number | Motor-terminal current |
| startingCurrentPctFla | number | Motor current ÷ FLA × 100 |
| startingTorquePctRated | number | Method-derated starting torque |
| voltageAtMotorPu | number | Per-unit V at motor terminals during start |
| voltageDipAtPccPct | number | Computed dip at PCC |
| voltageDipPasses1668 | boolean | Pass/fail vs threshold |
| accelerationTimeSec | number | Computed accel time |
| thermalMarginRatio | number | accelerationTimeSec ÷ stallTimeHotSec |
| thermalVerdict | string (enum) | `'safe' \| 'caution' \| 'damage_risk'` |
| torqueVerdict | string (enum) | `'sufficient' \| 'insufficient'` |
| qualitativeCost | string (enum) | `'low' \| 'medium' \| 'high' \| 'very_high'` |
| qualitativeComplexity | string (enum) | `'low' \| 'medium' \| 'high'` |
| verdictBadge | string (enum) | `'recommended' \| 'acceptable' \| 'excessive_dip' \| 'insufficient_torque' \| 'thermal_risk' \| 'not_applicable'` |
| methodNotes | string[] | Standards citations + caveats (e.g., "NEC 430.7(B) Code G", "Y-Δ requires 6-lead motor") |
| currentVsTime | { tSec: number; iAmps: number }[] | Sampled curve for the chart |

### ComparisonResult

| Field | Type | Description |
|-------|------|-------------|
| methods | MethodResult[] | Always 5 entries |
| recommendedMethod | string (enum) | One of the five method IDs, or `'none'` if no method passes |
| recommendationRationale | string | One-paragraph explanation |
| thresholdAppliedPct | number | The IEEE 1668 limit used |
| thresholdScenario | string | UI label of the scenario |

### MotorStartingResult

The full output persisted in history alongside the input.

| Field | Type | Description |
|-------|------|-------------|
| input | MotorStartingInput | Echo of inputs |
| sourceImpedance | ThevenZResult | |
| comparison | ComparisonResult | |
| computedAt | string | ISO timestamp |
| version | string | Calculator version (e.g., "1.0.0") |

---

## Validation Rules (Zod schemas in `motorStartingValidation.ts`)

- `motorSchema`: positive ratedPower/voltage/current/efficiency/PF; designClass valid for selected standard; LRA derivable from at least one of {codeLetter, lockedRotorAmps, lockedRotorMultiplier, designClass default}.
- `loadSchema`: torqueProfile valid; breakawayTorquePerRated ≥ 0 and ≤ 2.0 (sanity bound); inertia ≥ 0.
- `sourceChainSchema`: at least transformer required; utility infiniteBus flag XOR (shortCircuitMva or shortCircuitAmps) provided.
- `methodConfigSchema`: per-method conditional requireds (autotrans tap ∈ {0.50, 0.65, 0.80}; soft-starter ramp 0 < t ≤ 60 s; soft-starter initial voltage 10–80 %).
- `motorStartingInputSchema`: composes the above and asserts `methodConfigs.length === 5`.

## State Transitions

The Zustand store (`useMotorStartingStore`) holds:

- `currentInput: MotorStartingInput` (working draft)
- `currentResult: MotorStartingResult | null` (recomputed on input change)
- `history: MotorStartingResult[]` (persisted to localStorage; capped at 50 entries)
- `selectedMethodId: MethodId | null` (UI focus for the per-method results card)
- `referenceGuideOpen: boolean`

Computation is *eager*: any input mutation triggers a debounced (200 ms) recompute. Comparison view shows `currentResult.comparison.methods` directly.

## Persistence

- localStorage key: `electromate.motor-starting.v1`
- Stored shape: `{ history: MotorStartingResult[] }` (current draft excluded — restored only on explicit "Load from History")
- Migration: not applicable for v1 (no schema yet); future schema bumps add a `version` field check at hydration.
