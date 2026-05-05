# Calculator API Contract: Motor Starting Analysis

**Feature**: 010-motor-starting | **Date**: 2026-05-04 | **Phase**: 1

This is a *function-level* contract for the pure calculation modules. There is no HTTP/REST surface — every function is a synchronous TypeScript function consumed by the React tool component and Zustand store, with property-based unit tests in `__tests__/unit/calculations/motor-starting/`.

All numeric inputs/outputs use plain `number` at the boundary; internal arithmetic uses mathjs `BigNumber` where precision matters. No function performs I/O.

---

## Top-Level Orchestrator

### `analyzeMotorStarting(input: MotorStartingInput): MotorStartingResult`

**File**: `lib/calculations/motor-starting/motorStartingCalculator.ts`

Single entry point for the UI. Validates, computes Thevenin, runs all five methods, builds comparison, returns full result.

**Behavior**:
1. Throws `ZodError` if `motorStartingInputSchema.parse(input)` fails.
2. Computes `ThevenZResult` via `computeSourceImpedance`.
3. For each `MethodConfig` in `input.methodConfigs`, calls the matching method module (`analyzeDol`, `analyzeStarDelta`, `analyzeAutotransformer`, `analyzeSoftStarter`, `analyzeVfd`) passing the motor, load, source impedance, and dip threshold.
4. Aggregates the five `MethodResult`s through `buildComparison`.
5. Returns `MotorStartingResult` with `computedAt = new Date().toISOString()` and `version = '1.0.0'`.

**Performance contract**: ≤ 50 ms per single method (excluding chart sampling); ≤ 2 s for full comparison on commodity hardware.

**Failure modes**:
- Invalid input → `ZodError` (caught by UI to display field-level errors).
- Inconsistent state (e.g., utility neither infinite nor specified) → `Error('Source chain incomplete')`.
- Numeric overflow (only possible with deliberately absurd inputs) → `Error('Numeric overflow in source chain')`.

---

## Source Impedance

### `computeSourceImpedance(chain: SourceChain, baseKva: number, baseVoltageV: number): ThevenZResult`

**File**: `lib/calculations/motor-starting/sourceImpedance.ts`

Series-sums utility + transformer + cable on a common per-unit base.

**Inputs**:
- `chain` — full SourceChain
- `baseKva` — typically `chain.transformer.ratedKva`
- `baseVoltageV` — typically `chain.transformer.secondaryVoltageV`

**Output**: `ThevenZResult` with per-unit and ohmic Z components, plus `utilityAssumed` flag.

**Edge cases**:
- `chain.utility.isInfiniteBus === true` → `zUtilityPu = { r: 0, x: 0 }` and result.utilityAssumed = `'infinite_bus'`.
- Both `shortCircuitMva` and `shortCircuitAmps` provided → use `shortCircuitMva`; warn via `methodNotes` if they disagree by > 5%.
- Cable with `parallelRuns > 1` → divide R and X by `parallelRuns`.

---

## Method Modules

Each method module exports a single function with a uniform signature:

```ts
type AnalyzeMethodFn = (args: {
  motor: Motor;
  load: Load;
  thevenZPu: { r: BigNumber; x: BigNumber };
  baseKva: number;
  baseVoltageV: number;
  config: MethodConfig;
  voltageDipThresholdPct: number;
  standard: 'NEC' | 'IEC';
  thermalDefaults: ThermalLimitDefault;
}) => MethodResult;
```

### `analyzeDol(args): MethodResult`

**File**: `lib/calculations/motor-starting/methods/dol.ts`

- Starting current at motor = full LRA (from code letter / direct / multiplier).
- Starting torque = motor's full-voltage starting torque.
- Calls `computeVoltageDip` with full LRA at motor.
- Calls `computeAccelerationTime` with full motor torque-speed curve and load curve.
- Cost: `'low'`; Complexity: `'low'`.

### `analyzeStarDelta(args): MethodResult`

**File**: `lib/calculations/motor-starting/methods/starDelta.ts`

- Starting current = ⅓ × LRA; starting torque = ⅓ × T_st.
- If `config.starDeltaTransition === 'open'`, append a methodNote about the transition transient (informational only — calculator does not simulate it).
- If motor leads count cannot be inferred, append note "Requires 6-lead motor (not always available on small frames)".
- Cost: `'low'`; Complexity: `'medium'`.

### `analyzeAutotransformer(args): MethodResult`

**File**: `lib/calculations/motor-starting/methods/autotransformer.ts`

- Tap `a` ∈ {0.50, 0.65, 0.80}.
- **Critical**: line-side current = a² × LRA (because both V and I scale by a).
- Motor-side current = a × LRA.
- Starting torque = a² × T_st.
- Voltage dip uses *line-side* current (this is the engineering subtlety we test for).
- Cost: `'medium'`; Complexity: `'medium'`.

### `analyzeSoftStarter(args): MethodResult`

**File**: `lib/calculations/motor-starting/methods/softStarter.ts`

- Voltage ramp from `softStarterInitialVoltagePct` (default 30 %) to 100 % over `softStarterRampSec`.
- Starting current = LRA × (V_init / V_rated), capped at `softStarterCurrentLimitPctFla × FLA / 100`.
- Starting torque scales with V² along the ramp.
- For voltage-dip evaluation, use the **peak current** during ramp (typically near the end as V approaches 100 %, but bounded by the current limit).
- Cost: `'medium'`; Complexity: `'medium'`.

### `analyzeVfd(args): MethodResult`

**File**: `lib/calculations/motor-starting/methods/vfd.ts`

- Starting current ≈ 1.0–1.1 × FLA (constant V/Hz keeps current near rated).
- Starting torque up to 1.5 × T_rated at low frequency (motor's nameplate breakdown torque governs).
- Voltage dip is dominated by DC-bus charge inrush, which is brief and outside steady-state scope — calculator reports near-zero PCC dip during run-up and adds a note about precharge inrush.
- If `config.vfdHasBypass`, append note "Bypass mode reverts to DOL behavior — re-evaluate with DOL method".
- Cost: `'high'`; Complexity: `'high'`.

---

## Voltage Dip

### `computeVoltageDip(params): { vMotorPu: number; dipAtPccPct: number }`

**File**: `lib/calculations/motor-starting/voltageDip.ts`

```ts
params: {
  startingCurrentLineAmps: number;   // line-side
  baseKva: number;
  baseVoltageV: number;
  thevenZPu: { r: BigNumber; x: BigNumber };
  motorPowerFactorAtStart: number;   // typically 0.30 lag during start
}
```

Returns voltage at motor terminals (per-unit) and dip at PCC (%).

**Formula**: per-unit Thevenin division accounting for the angle between source impedance and motor inrush current (using `motorPowerFactorAtStart` to set the current-angle).

---

## Acceleration Time

### `computeAccelerationTime(params): { tAccSec: number; speedSamples: { rpm: number; tMotor: number; tLoad: number }[] }`

**File**: `lib/calculations/motor-starting/accelerationTime.ts`

```ts
params: {
  motor: Motor;
  load: Load;
  voltageMultiplier: number;          // a (autotrans), 1/√3 (Y-Δ on phase voltage), etc.
  steps?: number;                     // default 10
  syncSpeedRpm: number;               // 120 × f / poles
}
```

Quasi-static integration of the swing equation across `steps` evenly-spaced rotor speeds from 0 to (1 − rated slip) × syncSpeedRpm. Returns total time and the sample table for the chart.

**Algorithm**:
1. Build motor torque-speed curve from three points (start, breakdown, full-load) with linear interpolation.
2. Apply method-specific torque multiplier (= voltageMultiplier²).
3. At each speed step, compute T_motor − T_load and accumulate `Δt = (J × Δω) / T_avg`.
4. If at any step `T_motor < T_load`, return `tAccSec = Infinity` and flag `torqueVerdict: 'insufficient'`.

---

## Comparison

### `buildComparison(params): ComparisonResult`

**File**: `lib/calculations/motor-starting/comparison.ts`

```ts
params: {
  methods: MethodResult[];
  thresholdAppliedPct: number;
  thresholdScenario: string;
}
```

Ranking algorithm:
1. Filter methods with `verdictBadge !== 'insufficient_torque'` and `verdictBadge !== 'thermal_risk'` and `voltageDipPasses1668 === true`.
2. Among survivors, sort by `qualitativeCost` ascending (low < medium < high < very_high), tie-break by `qualitativeComplexity` ascending.
3. The first survivor becomes `recommendedMethod`. If none survive, `recommendedMethod = 'none'`.
4. Build `recommendationRationale` summarizing why the chosen method beat the alternatives (or why none qualified).

---

## Lookups

### `getNemaCodeLetter(letter: string): NemaCodeLetter | undefined`
### `getIecDesignClass(design: 'N' | 'H'): IecDesignClass`
### `getThermalDefaultByHp(hp: number): ThermalLimitDefault`
### `getCableImpedance(sizeId: string, material: 'Cu' | 'Al', conduit: string): CableImpedance | undefined`
### `getIeee1668Threshold(scenario: string): Ieee1668Threshold`

All in `motorStartingData.ts`. Pure functions; throw on unknown scenarios for the threshold/design-class lookups (these have closed enumerations); return `undefined` for code-letter/cable lookups (open enumerations from user input).

---

## Unit Conversions

### `hpToKw(hp: number): number` / `kwToHp(kw: number): number`
### `lbFt2ToKgM2(i: number): number` / `kgM2ToLbFt2(i: number): number`
### `rpmToRadPerSec(rpm: number): number` / `radPerSecToRpm(rad: number): number`
### `lbFtToNm(t: number): number` / `nmToLbFt(t: number): number`

**File**: `lib/calculations/motor-starting/unitConversions.ts` (or shared from a common helper if one exists; check Voltage Drop's helpers first to avoid duplication).

---

## Error Taxonomy

| Class | Where thrown | Recovery |
|---|---|---|
| `ZodError` | `analyzeMotorStarting` boundary | UI shows field-level errors |
| `Error('Source chain incomplete')` | `computeSourceImpedance` | UI prompts user to fix utility/transformer entries |
| `Error('Numeric overflow in source chain')` | `computeSourceImpedance` | UI flags absurd inputs, suggests review |
| `Error('Method config mismatch')` | method modules when config shape ≠ method | Indicates programming error; should never reach UI in production |

---

## Test Contract

For every exported function:
- One **nominal** test using a published reference case (IEEE 3002.7 Annex C, Beeman, NEMA MG 1).
- One **boundary** test (infinite bus, exactly-at-limit dip, zero inertia, etc.).
- One **edge** test (missing optional field, default fallback).
- One **error** test (validation failure, inconsistent inputs).

Coverage target: ≥ 90 % statements (per spec SC-007). Tests live in `__tests__/unit/calculations/motor-starting/` mirroring the source layout.
