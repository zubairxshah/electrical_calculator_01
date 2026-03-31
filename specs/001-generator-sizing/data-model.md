# Data Model: Generator Sizing Calculator

**Feature**: 001-generator-sizing | **Date**: 2026-03-31

## Entities

### LoadItem

Represents a single electrical load connected to the generator.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string | UUID, unique | Auto-generated |
| name | string | Required, 1-100 chars | User label |
| type | LoadType | Enum | motor, resistive, lighting, mixed, hvac |
| ratedPower | number | >0 | Stored in kW internally |
| powerInputUnit | PowerUnit | Enum | 'kW' or 'HP' — display preference |
| isKva | boolean | - | If true, ratedPower is kVA not kW |
| powerFactor | number | 0.01–1.0 | Default 0.85 |
| quantity | number | ≥1, integer | Default 1 |
| diversityFactor | number | 0.01–1.0 | Default 1.0 per clarification |
| stepNumber | number | ≥1, integer, nullable | Null = unassigned to step |
| isMotor | boolean | - | Derived from type === 'motor' |
| motorHp | number | >0, nullable | Only for motors |
| nemaCodeLetter | NemaCodeLetter | Enum, nullable | A–V, only for motors (60Hz) |
| iecLockedRotorRatio | number | >0, nullable | kVA/kW, for motors (50Hz) |
| startingMethod | StartingMethod | Enum | DOL, star-delta, autotransformer-65, autotransformer-80, soft-starter, vfd |
| vfdMultiplier | number | 0.02–0.50, nullable | Only when startingMethod = 'vfd' |
| softStarterMultiplier | number | 0.30–0.70, nullable | Only when startingMethod = 'soft-starter' |

### GeneratorConfig

Generator and system configuration.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| dutyType | DutyType | Enum | 'standby' or 'prime' |
| primeLoadingLimit | number | 0.50–1.0 | Default 0.70, only for prime |
| voltage | number | >0 | System voltage (V) |
| phases | Phases | Enum | 'single' or 'three' |
| frequency | Frequency | Enum | 50 or 60 (Hz) |
| subtransientReactance | number | 0.05–0.35 | Default 0.15 pu (Xd'') |
| fuelType | FuelType | Enum | 'diesel' or 'natural-gas' |
| necClassification | NecClassification | Enum, nullable | '700', '701', '702', null |

### SiteConditions

Installation site environmental conditions.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| altitude | number | 0–5000 | Stored in meters internally |
| altitudeUnit | AltitudeUnit | Enum | 'm' or 'ft' |
| ambientTemperature | number | -40–60 | Stored in °C internally |
| temperatureUnit | TempUnit | Enum | 'C' or 'F' |

### FuelConfig

Fuel and runtime parameters.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| requiredRuntime | number | >0 | Hours |
| averageLoadingPercent | number | 30–100 | % of generator rating |
| volumeUnit | VolumeUnit | Enum | 'liters' or 'gallons' |

### SizingResult (output)

Complete calculation output.

| Field | Type | Notes |
|-------|------|-------|
| totalRunningKw | number | After diversity |
| totalRunningKvar | number | After diversity |
| totalRunningKva | number | Vector sum |
| combinedPowerFactor | number | kW/kVA |
| requiredKvaBeforeDerating | number | Before site conditions |
| deratingFactor | number | Combined altitude + temperature |
| altitudeDeratingFactor | number | Individual factor |
| temperatureDeratingFactor | number | Individual factor |
| requiredKvaAfterDerating | number | After derating applied |
| recommendedGeneratorKva | number | Next standard size up |
| loadingPercent | number | Actual % of recommended gen |
| motorStartingAnalysis | MotorStartingResult[] | Per-motor analysis |
| worstCaseVoltageDip | MotorStartingResult | Highest voltage dip motor |
| stepLoadingSequence | StepResult[] | If steps assigned |
| fuelConsumption | FuelResult | If fuel config provided |
| necConstraints | NecConstraintResult | Pre-filled from classification |
| alerts | Alert[] | Warnings and errors |

### MotorStartingResult (output, per motor)

| Field | Type | Notes |
|-------|------|-------|
| loadId | string | Reference to LoadItem |
| motorName | string | From load name |
| startingKva | number | LR kVA × starting method multiplier |
| voltageDipPercent | number | % dip during starting |
| passesThreshold | boolean | Within configured limit |
| threshold | number | The limit used (15% or 20%) |

### StepResult (output, per step)

| Field | Type | Notes |
|-------|------|-------|
| stepNumber | number | 1-based |
| loadIds | string[] | Loads in this step |
| incrementalKw | number | Added this step |
| incrementalKva | number | Added this step (includes motor starting) |
| cumulativeKw | number | Running total |
| cumulativeKva | number | Running total |
| generatorLoadingPercent | number | % of rated kVA |
| status | StepStatus | 'pass', 'warning', 'fail' |
| statusReason | string | Why warning/fail |

### FuelResult (output)

| Field | Type | Notes |
|-------|------|-------|
| consumptionRate | number | L/hr at specified loading |
| totalFuelRequired | number | Liters, with reserve |
| reserveVolume | number | 10% reserve |
| runtimeHours | number | Requested runtime |

## Enums

```
LoadType: 'motor' | 'resistive' | 'lighting' | 'mixed' | 'hvac'
DutyType: 'standby' | 'prime'
Phases: 'single' | 'three'
Frequency: 50 | 60
FuelType: 'diesel' | 'natural-gas'
NecClassification: '700' | '701' | '702'
StartingMethod: 'dol' | 'star-delta' | 'autotransformer-65' | 'autotransformer-80' | 'soft-starter' | 'vfd'
NemaCodeLetter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' | 'L' | 'M' | 'N' | 'P' | 'R' | 'S' | 'T' | 'U' | 'V'
PowerUnit: 'kW' | 'HP'
AltitudeUnit: 'm' | 'ft'
TempUnit: 'C' | 'F'
VolumeUnit: 'liters' | 'gallons'
StepStatus: 'pass' | 'warning' | 'fail'
AlertSeverity: 'info' | 'warning' | 'error'
```

## State Transitions

Load items are stateless — no lifecycle beyond add/edit/remove. The calculation is stateless (pure function): inputs → outputs. History entries are immutable once saved to localStorage.

## Relationships

```
GeneratorConfig 1──* LoadItem (loads belong to a sizing session)
LoadItem *──1 StepResult (each load assigned to one step, via stepNumber)
SizingResult 1──* MotorStartingResult (one per motor-type load)
SizingResult 1──* StepResult (one per step)
SizingResult 1──1 FuelResult
```
