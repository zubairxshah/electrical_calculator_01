# Contract: Sizing Engine (`lib/calculations/battery/`)

**Feature**: `011-battery-revamp`

Pure, side-effect-free functions (mathjs BigNumber via `lib/mathConfig`). These are the headless, independently-testable units the TDD gate covers. Signatures are the stable contract; tests target these.

## Public API — `lib/calculations/battery/index.ts`

```ts
import type { BatteryCalculatorInputs, BatteryCalculatorResult } from '@/lib/types'

/** Forward: installed nameplate capacity → backup time + full result. mode='runtime'. */
export function calculateRuntime(inputs: BatteryCalculatorInputs): BatteryCalculatorResult

/** Reverse: target backup time → required capacity, bank config, full result. mode='sizing'. */
export function sizeForRuntime(inputs: BatteryCalculatorInputs): BatteryCalculatorResult

/** Dispatch on inputs.mode; the single entry the store calls. */
export function calculateBattery(inputs: BatteryCalculatorInputs): BatteryCalculatorResult
```

### Behavioral guarantees
- **G1 (chemistry sensitivity)**: for two chemistries with different `depthOfDischarge.recommended` or `peukertExponent`, identical other inputs MUST yield different `effectiveCapacityAh` (kills the current defect; SC-001).
- **G2 (round-trip)**: `sizeForRuntime` then feeding the resulting `bankConfig.nameplateBankAh` into `calculateRuntime` MUST return `backupTimeHours >= targetBackupHours` (SC-005).
- **G3 (accuracy)**: results within ±2% of the IEEE 485 worked-example fixtures (constitution Principle I).
- **G4 (performance)**: each call < 100 ms (SC-002); memoization may be retained from the existing module.
- **G5 (totality)**: invalid inputs throw a typed error; callers validate first via `validateBatteryInputs`.

## Derating — `lib/calculations/battery/derating.ts`

```ts
export function dodFactor(inputs, profile): FactorValue          // recommended or clamped override
export function temperatureFactor(inputs, profile): FactorValue  // 1.0 in optimal band; coeff·Δ below
export function agingFactor(inputs): FactorValue                 // default 0.8
export function efficiencyFactor(inputs, profile): FactorValue   // default roundTrip.typical/100
export function peukertDerate(cRate: number, exponent: number): number  // usable-capacity multiplier
```
- `temperatureFactor` MUST be ≤ 1.0 below the optimal band and exactly 1.0 within/above it; floors at a sane minimum and signals a range warning out of `operating`.
- `peukertDerate` MUST return ≈ 1.0 for exponent ≈ 1.0 (lithium) and < 1.0 for lead-acid at high C-rate.

## Bank configuration — `lib/calculations/battery/bankConfig.ts`

```ts
export function computeBankConfig(
  requiredAh: number, systemVoltage: number, cellBlockVoltage: number, perUnitAh: number
): BankConfig
```
- `cellsInSeries = ceil(systemVoltage / cellBlockVoltage)`.
- `stringsInParallel = ceil(requiredAh / perUnitAh)` (whole strings only; G-round-up).
- Reports `overCapacityPct` from rounding up.

## Discharge curve — `lib/calculations/battery/dischargeCurve.ts`

```ts
export function buildDischargeCurve(inputs, profile, runtimeHours): DischargeCurvePoint[]
```
- Monotonically non-increasing `socPercent`/`remainingAh`; `voltage` within chemistry plateau→cutoff; ≥ 12 points for a smooth Recharts line.

## Error taxonomy
- `BatterySizingError` (typed) for impossible/over-range inputs that slip past validation; message is user-safe and field-tagged.
