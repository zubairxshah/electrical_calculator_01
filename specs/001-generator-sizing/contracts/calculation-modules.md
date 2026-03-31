# Calculation Module Contracts: Generator Sizing Calculator

**Feature**: 001-generator-sizing | **Date**: 2026-03-31

All modules are pure functions (no side effects). Input/output typed via `types/generator-sizing.ts`.

---

## Module: loadSummation.ts

### `calculateLoadSummary(loads: LoadItem[], config: GeneratorConfig): LoadSummaryResult`

**Purpose**: Sum all loads using vector power summation with diversity factors.

**Input**: Array of LoadItem, GeneratorConfig (for duty type and loading limit).

**Output**:
```typescript
interface LoadSummaryResult {
  totalRunningKw: number      // Σ(kW_i × qty_i × df_i)
  totalRunningKvar: number    // Σ(kVAR_i)
  totalRunningKva: number     // √(kW² + kVAR²)
  combinedPowerFactor: number // kW / kVA
  loadingLimit: number        // 1.0 for standby, config value for prime
  requiredGeneratorKva: number // totalKVA / loadingLimit
  perLoadBreakdown: LoadBreakdownItem[]
}
```

**Validation**: At least one load required; all loads must have positive power and valid PF.

**Accuracy**: ±1% of hand calculation per SC-002.

---

## Module: motorStarting.ts

### `analyzeMotorStarting(motors: LoadItem[], generatorKva: number, allLoadsRunningKva: number, config: GeneratorConfig): MotorStartingResult[]`

**Purpose**: Calculate starting kVA and voltage dip for each motor.

**Input**: Motor-type loads, selected generator kVA, total running kVA of all other loads, generator config (Xd'', frequency for NEMA/IEC selection).

**Output**: Array of MotorStartingResult (one per motor), plus worst-case identification.

**Key formulas**:
- `startingKva = motorHp × lrKvaPerHp × startingMethodMultiplier` (60Hz/NEMA)
- `startingKva = motorKw × iecLockedRotorRatio × startingMethodMultiplier` (50Hz/IEC)
- `voltageDipPercent = (xd'' × startingKva) / generatorKva × 100`

**Thresholds**: Default 15% (NFPA 110 emergency), 20% (general industrial). Configurable.

---

## Module: stepLoading.ts

### `calculateStepSequence(loads: LoadItem[], generatorKva: number, config: GeneratorConfig): StepResult[]`

**Purpose**: Calculate cumulative demand at each loading step.

**Input**: Loads with stepNumber assigned, generator rated kVA.

**Output**: Array of StepResult with cumulative values and pass/fail status.

**Warning threshold**: Step increment > 50% of generator kVA per ISO 8528.

### `autoSequenceLoads(loads: LoadItem[], generatorKva: number): LoadItem[]`

**Purpose**: Suggest optimal step assignment following IEEE 3006.4 guidance.

**Input**: Loads without step assignments, target generator kVA.

**Output**: Same loads with stepNumber populated.

**Algorithm**: Largest motors first → large resistive → smaller loads. Each step ≤50% incremental kVA.

---

## Module: derating.ts

### `calculateDerating(siteConditions: SiteConditions): DeratingResult`

**Purpose**: Calculate altitude and temperature derating per ISO 8528-1.

**Input**: SiteConditions (altitude in meters, temperature in °C — pre-converted from imperial if needed).

**Output**:
```typescript
interface DeratingResult {
  altitudeFactor: number       // 1.0 if ≤1000m
  temperatureFactor: number    // 1.0 if ≤25°C
  combinedFactor: number       // altitude × temperature
  altitudeApplied: boolean
  temperatureApplied: boolean
}
```

**Accuracy**: ±2% of ISO 8528-1 published tables per SC-003.

---

## Module: fuelConsumption.ts

### `calculateFuelConsumption(generatorKva: number, combinedPf: number, fuelConfig: FuelConfig, generatorConfig: GeneratorConfig): FuelResult`

**Purpose**: Estimate fuel consumption rate and required tank volume.

**Input**: Generator size, power factor, fuel config (runtime, loading%, fuel type, volume unit).

**Output**: FuelResult with consumption rate and total volume.

**Data**: Interpolated from standard diesel/gas SFC tables in generatorData.ts.

---

## Module: generatorCalculator.ts (Orchestrator)

### `calculateGeneratorSizing(input: GeneratorSizingInput): SizingResult`

**Purpose**: Orchestrate all calculation modules and produce complete results.

**Flow**:
1. `calculateLoadSummary()` → total demand
2. `calculateDerating()` → site derating factor
3. Apply derating → required kVA after derating
4. Select standard generator size from ratings table
5. `analyzeMotorStarting()` → voltage dip per motor
6. If steps assigned: `calculateStepSequence()` → step analysis
7. If fuel config provided: `calculateFuelConsumption()` → fuel estimate
8. Compile alerts (voltage dip warnings, overload warnings, derating notes)
9. Return complete SizingResult

---

## Module: generatorData.ts (Constants/Tables)

**Exports**:
- `NEMA_CODE_LETTERS`: Record<NemaCodeLetter, { min: number, max: number, midpoint: number }>
- `STARTING_METHOD_MULTIPLIERS`: Record<StartingMethod, number> (defaults)
- `STANDARD_RATINGS_60HZ`: number[]
- `STANDARD_RATINGS_50HZ`: number[]
- `DIESEL_SFC_TABLE`: { loadPercent: number, lPerKwHr: number }[]
- `GAS_SFC_TABLE`: { loadPercent: number, m3PerKwHr: number }[]
- `NEC_CLASSIFICATION_CONSTRAINTS`: Record<NecClassification, { startupTime: number, minFuelHours: number }>
- `getNextStandardRating(requiredKva: number, frequency: Frequency): number`
- `getLrKvaPerHp(codeLetter: NemaCodeLetter): number`
- `interpolateSfc(loadPercent: number, fuelType: FuelType): number`
