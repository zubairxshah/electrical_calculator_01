# Data Model: PFI Panel kVAR Design

**Feature**: 014-pfi-panel-design | **Date**: 2026-10-10

All types are added to the existing `types/power-factor-correction.ts`. Existing types are unchanged except for the additive fields marked **(+)**.

## Inputs

```ts
export type PFCSequencePreset = '1:1:1' | '1:2:2' | '1:2:4' | '1:1:2:2'
export type PFCSequenceMode = 'auto' | PFCSequencePreset | 'custom'
export type PFCControllerOutputs = 6 | 8 | 12
export type PFCDetuningChoice = 'auto' | 'none' | 5.67 | 7 | 14
export type PFCDetuningFactor = 5.67 | 7 | 14          // percent
export type PFCProtectionType = 'fuse' | 'mccb'

export interface PFCStepOverride {
  contactorA?: number
  protectionA?: number
  cableSize?: string          // sizeMetric (IEC) or sizeAWG (NEC) as in cableTables.ts
}

export interface PFCDesignInput {
  sequenceMode: PFCSequenceMode        // default 'auto'
  customStepsKVAR: number[]            // used when 'custom'; each > 0, length 1–12
  maxOutputs: PFCControllerOutputs     // default 12
  ctPrimaryA: number                   // default 1000; > 0
  ctSecondaryA: 1 | 5                  // default 5
  minLoadVariationKVAR: number | null  // null → 10 % of bank total
  detuning: PFCDetuningChoice          // default 'auto'
  thirdHarmonic: boolean               // default false
  protectionType: PFCProtectionType | null  // null → standard default: 'fuse' (IEC), 'mccb' (NEC)
  overrides: Record<number, PFCStepOverride>   // keyed by step index (1-based)
}
```

### Validation (Zod, `lib/validation/powerFactorCorrectionValidation.ts`)

- `customStepsKVAR`: 1–12 items, each `> 0` and `≤ 1000`. Error `INVALID_CUSTOM_STEPS`.
- `ctPrimaryA > 0`, `ctSecondaryA ∈ {1, 5}`. An invalid CT gives `ck: null` and the message "enter CT ratio" (not a hard error).
- `minLoadVariationKVAR`: null or > 0.
- Override values: > 0, and `cableSize` must exist in the table for the standard.

## Results

```ts
export interface PFCStep {
  index: number                 // 1-based
  ratio: number | null          // null for custom
  effectiveKVAR: number         // at system voltage U
  cumulativeKVAR: number
}

export interface PFCStepBankDesign {
  mode: PFCSequenceMode
  preset: PFCSequencePreset | null     // chosen preset (auto → resolved)
  targetKVAR: number                   // R1
  steps: PFCStep[]
  totalKVAR: number
  overshootKVAR: number                // total − target
  resolutionKVAR: number               // smallest step
  switchingLevels: number              // distinct non-zero subset sums (R3)
  outputsUsed: number
  controller: { outputs: PFCControllerOutputs; ck: number | null; ctRatio: number } | null  // null for fixed
  warnings: PFCDesignWarning[]
}

export interface PFCDetuningStep {
  index: number
  effectiveKVAR: number
  ratedKVAR: number             // Qr at Ur
  capacitorReactanceOhm: number // Xc (star-equivalent)
  reactorInductanceMH: number | null   // null when not detuned
  currentA: number              // fundamental step current at U
}

export interface PFCDetuningDesign {
  recommended: PFCDetuningFactor | null
  applied: PFCDetuningFactor | null
  tuningFrequencyHz: number | null
  capacitorVoltageV: number      // Uc (= U when not detuned)
  capacitorRatedVoltageV: number // Ur
  steps: PFCDetuningStep[]
  totalRatedKVAR: number
  notes: string[]
}

export interface PFCSwitchgearStep {
  index: number
  ratedCurrentA: number          // In
  designCurrentA: number         // In × factor
  contactor: PFCSwitchgearItem<number> & { type: string }          // { value, overridden, ok }
  protection: PFCSwitchgearItem<number> & { type: PFCProtectionType }
  cable: PFCSwitchgearItem<string> & { ampacityA: number | null; label: string | null }
}

export interface PFCSwitchgearDesign {
  factor: number                 // 1.43 IEC | 1.35 NEC
  protectionType: PFCProtectionType
  steps: PFCSwitchgearStep[]
  totalRatedCurrentA: number
  totalDesignCurrentA: number
  incomerA: number | null
  busbarA: number | null
  warnings: PFCDesignWarning[]
}

export interface PFCDesignWarning {
  code: 'STEP_TOO_COARSE' | 'OVERSHOOT' | 'NO_STANDARD_STEP_FITS' | 'INVALID_CUSTOM_STEPS'
      | 'CK_NEEDS_CT' | 'STEP_ABOVE_MAX_CONTACTOR' | 'ABOVE_MAX_RATING' | 'OVERRIDE_UNDERSIZED'
      | 'MV_NOT_SUPPORTED' | 'DETUNING_RECOMMENDED' | 'UNDERSIZED_BANK'
  severity: 'error' | 'warning' | 'info'
  message: string
  reference?: string
  stepIndex?: number
}

export interface PFCPanelDesign {
  available: boolean            // false for MV (R9) or when stage 1 has no results
  stepBank: PFCStepBankDesign | null
  detuning: PFCDetuningDesign | null
  switchgear: PFCSwitchgearDesign | null
  warnings: PFCDesignWarning[]  // flattened, deduplicated
}
```

## Store additions (`stores/usePowerFactorCorrectionStore.ts`)

- **(+)** `PFCState`: `design: PFCDesignInput` and `activeStage: 1 | 2 | 3 | 4` (UI only, not persisted).
- **(+)** Actions: `setDesign(patch: Partial<PFCDesignInput>)`, `setStepOverride(index, patch | null)`, `setActiveStage(s)`.
- Design-input changes do **not** clear stage 1 `results` (stages 2–4 are derived). Stage 1 setters keep clearing results (FR-002, US1 scenario 3).
- Persist: `version: 1`, `migrate(v0) → { ...state, design: DEFAULT_DESIGN }`.
- **(+)** `PFCHistoryEntry.design?: PFCDesignInput`. On load: `design ?? DEFAULT_DESIGN` (FR-004).

## Relationships

```text
PFCInput + PFCEnvironment ──calculatePowerFactorCorrection──▶ PFCCalculationResults (stage 1, unchanged)
PFCCalculationResults + PFCInput + PFCDesignInput ──designPanel──▶ PFCPanelDesign
   stepBank  ◀── R1 target, R2–R5
   detuning  ◀── stepBank.steps, R6–R7
   switchgear◀── detuning.steps (currents), R8, overrides
```
