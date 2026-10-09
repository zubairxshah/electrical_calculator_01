# Implementation Plan: PFI Panel kVAR Design (Power Factor Correction upgrade)

**Branch**: `014-pfi-panel-design` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-pfi-panel-design/spec.md`

## Summary

Upgrade the existing `/power-factor-correction` calculator in place into an APFC panel design tool with a four-stage stepper: Required kVAR → Step bank → Detuning → Switchgear. Stage 1 is the unchanged `calculatePowerFactorCorrection`. Stages 2–4 are new pure modules (`stepBank`, `detuning`, `switchgear`, orchestrated by `panelDesign`), derived synchronously from stage 1 results and persisted design inputs. They give unequal step sequences with C/k, detuned reactor values (fr, Ur, L, Qr), per-step contactor/protection/cable with checked user overrides, and incomer/busbar ratings. The existing PDF gains the panel design sections. No new route, nav item or dependency.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.1 (App Router, Turbopack)
**Primary Dependencies**: existing only — Zustand 5 (persist), Zod 4, jsPDF 3, shadcn/ui + Tailwind, lucide-react. **No new dependencies.**
**Storage**: localStorage — existing `electromate-pfc` (persist → version 1 with migrate) and `electromate-pfc-history` (entries gain optional `design`)
**Testing**: Vitest 4 — `__tests__/unit/calculations/power-factor-correction/` (new; the calculator currently has no tests)
**Target Platform**: modern desktop/tablet/mobile browsers; client-side
**Project Type**: single Next.js web app
**Performance Goals**: design recompute < 5 ms (12 steps → 4,096 subsets); UI update < 1 s (SC-004); validation < 100 ms (Constitution II)
**Constraints**: LV (≤ 1 kV) panel design only; generic ratings; resonance/thermal out of scope; stage 1 output byte-for-byte unchanged
**Scale/Scope**: 1 existing route, 5 new calc/data modules, ~6 new/changed components, 1 store, 1 PDF generator, ~6 test files

No NEEDS CLARIFICATION remains (spec Clarifications 2026-10-10; research R1–R10).

## Constitution Check

### Calculation Accuracy
- [x] Formulas tied to standards: IEC 60831-1 (1.3 × In overcurrent, 1.1 Un, tolerance), IEC 61921 (APFC assemblies, C/k, 1.43 factor), IEC 60947-4-1 (AC-6b), IEEE 18, NEC 460.8 (135 %), NEC 240.6(A), NEC 310.16 / IEC 60364-5-52 ampacity (R4, R7, R8)
- [x] Test cases: hand-calculated Examples A–D in quickstart.md
- [x] Tolerance: ±1 % values, exact for ratings (SC-002)
- [x] Arithmetic: native per ADR-007 (no deviation to justify)

### Safety-First Validation
- [x] Undersized overrides (error), steps above the largest contactor, overshoot → leading PF, coarse first step, MV not supported, detuning recommended
- [x] Real-time: design is derived on each input change
- [x] Warnings carry clause references

### Standards Compliance and Traceability
- [x] Each computed value shows its formula/clause (FR-019); PDF lists standards
- [x] Generic rating series documented in research R8 (not catalogue data)

### Test-First Development
- [x] Stage 1 regression snapshot written **before** any change (SC-001)
- [x] Each module test file is written first from Examples B–D (Red), then implemented (Green)
- [x] Coverage: nominal (B–D), boundary (12-step limit, 1,000 V, THD = 10 %), edge (fixed correction, single-phase, custom steps, CT missing), error (invalid custom, undersized override)

### Professional Documentation
- [x] PDF: stage 1 (as today) + step bank + controller + detuning + switchgear schedule + references, timestamp, disclaimer

### Progressive Enhancement
- [x] P1: US1 (stepper, stage 1 unchanged) + US2 (step bank). P2: US3 (detuning), US4 (switchgear). P3: US5 (PDF)
- [x] US4 works without US3 (non-detuned currents); US3 is optional input to US4

### Other
- [x] Dual standards: IEC/NEC factor, rating series and cable tables
- [x] Additive data model; persisted state migrates; old history loads
- [x] Smallest viable diff: `pfcCalculator.ts` untouched; existing components kept and moved into stage 1

**Gate result: PASS** (no deviations).

## Project Structure

### Documentation

```text
specs/014-pfi-panel-design/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/calculation-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
types/power-factor-correction.ts                         # EDIT — add design types (additive)
lib/calculations/power-factor-correction/
├── pfcCalculator.ts                                     # UNCHANGED (stage 1)
├── capacitorData.ts                                     # UNCHANGED (reused)
├── panelRatings.ts                                      # NEW — contactor/fuse/busbar series, nextRating
├── stepBank.ts                                          # NEW — R1–R5
├── detuning.ts                                          # NEW — R6–R7
├── switchgear.ts                                        # NEW — R8 (reuses cableTables, breakerRatings)
└── panelDesign.ts                                       # NEW — orchestrator + DEFAULT_DESIGN
lib/validation/powerFactorCorrectionValidation.ts        # EDIT — design input schema
stores/usePowerFactorCorrectionStore.ts                  # EDIT — design, activeStage, overrides, persist v1
components/power-factor-correction/
├── DesignStepper.tsx                                    # NEW — numbered stages + Back/Next
├── DesignSummaryStrip.tsx                               # NEW — total kVAR · steps · tuning · incomer
├── StepBankStage.tsx                                    # NEW — US2
├── DetuningStage.tsx                                    # NEW — US3
├── SwitchgearStage.tsx                                  # NEW — US4 (override inputs)
├── PowerFactorCorrectionInputForm.tsx                   # KEEP (stage 1)
├── PowerFactorCorrectionResults.tsx                     # KEEP (stage 1)
└── PowerFactorCorrectionHistorySidebar.tsx              # EDIT — restore design
app/power-factor-correction/PowerFactorCorrectionTool.tsx # EDIT — stepper layout, getState() handlers
lib/pdfGenerator.powerFactorCorrection.ts                # EDIT — optional design sections
__tests__/unit/calculations/power-factor-correction/
├── stage1-regression.test.ts · stepBank.test.ts · detuning.test.ts
├── switchgear.test.ts · panelDesign.test.ts · store.test.ts · pdf.test.ts
```

**Structure Decision**: Extend the existing feature folders (user decision: no new calculator). New logic lives in separate pure modules, so stage 1 stays untouched and each stage is testable alone.

## Key Decisions

1. **Design derived, not stored** — `designPanel()` runs in `useMemo` from (input, results, design). Only inputs persist, so stale design results cannot occur (US1 scenario 3).
2. **Effective kVAR convention** — step tables always show effective kVAR at system voltage. Capacitor nameplate kVAR is derived (R7). This avoids the most common APFC sizing error.
3. **Conservative contactor sizing** — the contactor uses the design current (1.43/1.35 × In), not In (constitution "Conservative Defaults").

None passes all three ADR tests (all are local to this calculator and follow existing patterns), so **no ADR suggested**.

## Risks

- Persisted-state migration could break returning users → covered by a store test with a v0 payload.
- Stage 1 regression → the snapshot test is written first.
- Generic rating series may differ from a given manufacturer → overrides (FR-015a) and the assumption is stated in the UI/PDF.

## Complexity Tracking

None.
