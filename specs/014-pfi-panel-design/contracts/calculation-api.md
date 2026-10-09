# Contract: PFI Panel Design Calculation Modules

**Feature**: `014-pfi-panel-design` | **Date**: 2026-10-10

Client-side only. Pure, synchronous, deterministic functions in `lib/calculations/power-factor-correction/`: no React, Zustand or DOM. `pfcCalculator.ts` is **unchanged**.

## 1. `panelRatings.ts` (data)

```ts
export const CONTACTOR_AC6B_FRAMES_A: readonly number[]   // R8
export const IEC_GG_FUSE_RATINGS_A: readonly number[]     // R8
export const BUSBAR_RATINGS_A: readonly number[]          // R8
export const CONTROLLER_OUTPUTS: readonly PFCControllerOutputs[]  // [6, 8, 12]
export function nextRating(min: number, series: readonly number[]): number | null
```

## 2. `stepBank.ts`

```ts
export function designTargetKVAR(results: PFCCalculationResults): number                 // R1
export function buildSteps(u: number, ratios: number[], target: number, maxSteps: number): number[] | null
export function recommendSequence(target: number, maxOutputs: PFCControllerOutputs): { preset: PFCSequencePreset; u: number; steps: number[] }  // R2
export function switchingLevels(steps: number[]): number                                  // R3
export function calculateCk(q1KVAR: number, voltage: number, ctRatio: number, threePhase: boolean): number  // R4
export function designStepBank(input: PFCInput, results: PFCCalculationResults, design: PFCDesignInput): PFCStepBankDesign
```

Postconditions: `totalKVAR ≥ targetKVAR` (unless custom), `1 ≤ steps.length ≤ 12`, cumulative is monotonic, and `resolutionKVAR = min(steps)`. Fixed correction → one step, `controller = null`.

## 3. `detuning.ts`

```ts
export function recommendDetuning(thdPercent: number, thirdHarmonic: boolean): PFCDetuningFactor | null   // R6
export function tuningFrequency(f: number, pPercent: number): number                                     // f/√p
export function capacitorRatedVoltage(voltage: number, pPercent: number | null): number                   // R7
export function detuneStep(qEffKVAR: number, voltage: number, f: number, pPercent: number | null, ur: number, threePhase: boolean): Omit<PFCDetuningStep, 'index'>
export function designDetuning(input: PFCInput, bank: PFCStepBankDesign, design: PFCDesignInput): PFCDetuningDesign
```

Postconditions: `capacitorRatedVoltageV ≥ 1.1 × capacitorVoltageV`, and `ratedKVAR > effectiveKVAR` whenever Ur > U.

## 4. `switchgear.ts`

```ts
export function designCurrentFactor(standard: PFCStandard): number                           // 1.43 | 1.35
export function sizeStep(index: number, currentA: number, standard: PFCStandard, protectionType: PFCProtectionType, detuned: boolean, override?: PFCStepOverride): PFCSwitchgearStep
export function designSwitchgear(input: PFCInput, detuning: PFCDetuningDesign, design: PFCDesignInput): PFCSwitchgearDesign
```

Cable lookup reuses `findMinimumCableSize(I, 'copper', 75, standard)` from `lib/standards/cableTables.ts`. Breaker ratings reuse `recommendStandardBreaker` from `lib/standards/breakerRatings.ts`.

## 5. `panelDesign.ts` (orchestrator)

```ts
export const DEFAULT_DESIGN: PFCDesignInput
export function designPanel(input: PFCInput, results: PFCCalculationResults | null, design: PFCDesignInput): PFCPanelDesign
```

- `results === null` → `{ available: false, … nulls }`.
- `input.voltage > 1000` → `available: false` + `MV_NOT_SUPPORTED`.
- Never throws. Invalid design input produces warnings with `severity: 'error'`.

## 6. PDF (`lib/pdfGenerator.powerFactorCorrection.ts`)

```ts
downloadPowerFactorCorrectionPDF({ input, results, project, design?: PFCPanelDesign })
export function buildPanelDesignSections(design: PFCPanelDesign, standard: PFCStandard): PdfSection[]  // pure; testable
```

The existing signature stays valid (`design` is optional). With `design` present, the PDF appends: Step bank (table + controller), Detuning (or "No detuning applied"), Switchgear schedule (with "(override)" markers), and Standards references.
