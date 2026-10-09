---
description: "Task list for the PFI Panel kVAR Design upgrade of the Power Factor Correction calculator"
---

# Tasks: PFI Panel kVAR Design (Power Factor Correction upgrade)

**Input**: Design documents from `/specs/014-pfi-panel-design/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/calculation-api.md](./contracts/calculation-api.md), [quickstart.md](./quickstart.md)

**Tests**: REQUIRED for calculation logic (Constitution V). In each story, the test tasks come first and MUST fail before the matching implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelisable (different files, no dependency on incomplete tasks)
- Paths are relative to the repo root `D:\prompteng\elec_calc\`

## Conventions

- Native `number` arithmetic (ADR-007). Round only at the UI/PDF.
- `lib/calculations/power-factor-correction/pfcCalculator.ts` and `capacitorData.ts` MUST NOT change (SC-001).
- Store handlers use `usePowerFactorCorrectionStore.getState()`; never `useCallback([store])`.
- Numeric inputs use focus/blur local string state.
- New stage components are presentational (props in, callbacks out). Only `PowerFactorCorrectionTool.tsx` and the history sidebar import the store.
- Tests live under `__tests__/unit/calculations/power-factor-correction/`.

---

## Phase 1: Setup

- [X] T001 Create `__tests__/unit/calculations/power-factor-correction/`
- [X] T002 Write `__tests__/unit/calculations/power-factor-correction/stage1-regression.test.ts`: run `calculatePowerFactorCorrection` on Example A plus 3 more cases (NEC 480 V 1φ fixed; IEC 400 V THD 15 % at 45 °C/1500 m; 11 kV) and assert every result field (except timestamp) against literal values captured from the **current** code. This must pass now and keep passing (SC-001)

## Phase 2: Foundational (blocks all stories)

- [X] T003 Add design types to `types/power-factor-correction.ts` per data-model.md (`PFCDesignInput`, `PFCStep`, `PFCStepBankDesign`, `PFCDetuningStep`, `PFCDetuningDesign`, `PFCSwitchgearStep`, `PFCSwitchgearDesign`, `PFCDesignWarning`, `PFCPanelDesign`, enums). Additive store/history fields: `design`, `activeStage`, `setDesign`, `setStepOverride`, `setActiveStage`, `PFCHistoryEntry.design?`
- [X] T004 [P] Create `lib/calculations/power-factor-correction/panelRatings.ts` (contactor AC-6b frames, IEC gG fuse series, busbar series, controller outputs, `nextRating`) per research R8
- [X] T005 Add `pfcDesignInputSchema` (Zod) to `lib/validation/powerFactorCorrectionValidation.ts` per data-model validation rules

## Phase 3: User Story 2 — Step bank design (P1) 🎯 MVP calculation core

- [X] T006 [P] [US2] Write `__tests__/unit/calculations/power-factor-correction/stepBank.test.ts` (Red): Example B (u = 20, 20/40/80/80/80, 15 levels, C/k 0.1443 A, controller 6); 12-output variant (u = 10, 9 steps, 310); `switchingLevels` for 1:1:1 ×4 (4), 1:2:4 (7), and the non-binary custom [10, 50] (3); `designTargetKVAR` uses adjustedKVAR when derating exists; auto picks the best resolution; fixed → 1 step, `controller: null`; custom steps used as entered; overshoot > u → `OVERSHOOT`; u > 10 % of total → `STEP_TOO_COARSE`; single-phase C/k; CT missing → `ck: null` + `CK_NEEDS_CT`; nothing fits in 12 → `NO_STANDARD_STEP_FITS`
- [X] T007 [US2] Implement `lib/calculations/power-factor-correction/stepBank.ts` per contract §2 (R1–R5) until T006 passes

## Phase 4: User Story 3 — Detuned reactor design (P2)

- [X] T008 [P] [US3] Write `__tests__/unit/calculations/power-factor-correction/detuning.test.ts` (Red): Example C (fr 189.0, Uc 430.1, Ur 480, Xc 3.4409, L 0.7667 mH, Qr 66.96, I 72.17); fr at 5.67/7/14 % for 50 and 60 Hz; recommendation (THD 5 → null, 10 → null, 10.1 → 7, any + 3rd → 14); not detuned → Ur = `selectCapacitorVoltageRating(U)`, `reactorInductanceMH: null`, Qr = Qeff·(Ur/U)²; 'auto' applies the recommendation, an explicit choice overrides it
- [X] T009 [US3] Implement `lib/calculations/power-factor-correction/detuning.ts` per contract §3 (R6–R7) until T008 passes

## Phase 5: User Story 4 — Switchgear sizing (P2)

- [X] T010 [P] [US4] Write `__tests__/unit/calculations/power-factor-correction/switchgear.test.ts` (Red): Example D IEC (103.2 A, fuse 125, contactor 115, 35 mm²), IEC MCCB (125), NEC (81.19 A, OCPD 90, contactor 95, 4 AWG), panel (Σ In 433.0, design 619.2, incomer 630, busbar 630); contactor type text for detuned vs not; override below minimum → `ok: false` + `OVERRIDE_UNDERSIZED`; valid override → `overridden: true, ok: true`; step > 400 A design → `STEP_ABOVE_MAX_CONTACTOR`; single-phase step In = Q/U (230 V, 10 kVAR → 43.48 A)
- [X] T011 [US4] Implement `lib/calculations/power-factor-correction/switchgear.ts` per contract §4 (R8), reusing `findMinimumCableSize` and `recommendStandardBreaker`, until T010 passes

## Phase 6: Orchestration (US2–US4 integration)

- [X] T012 [P] Write `__tests__/unit/calculations/power-factor-correction/panelDesign.test.ts` (Red): `results === null` → unavailable; 11 kV → unavailable + `MV_NOT_SUPPORTED`; Example A end-to-end gives a consistent chain (bank total = Σ steps, switchgear rows = steps, detuned currents feed switchgear); invalid custom steps → error warning, no throw; warnings deduplicated
- [X] T013 Implement `lib/calculations/power-factor-correction/panelDesign.ts` (`DEFAULT_DESIGN`, `designPanel`) until T012 passes

## Phase 7: User Story 1 — Guided stepper UI and persistence (P1)

- [X] T014 [P] [US1] Write `__tests__/unit/calculations/power-factor-correction/store.test.ts` (Red): default `design` = `DEFAULT_DESIGN`; `setDesign` does not clear `results`, a stage 1 setter does; `setStepOverride(i, null)` removes the override; persist `migrate` from a v0 payload adds the design; `loadFromHistory` with an entry without `design` → defaults; `saveToHistory` stores `design`
- [X] T015 [US1] Update `stores/usePowerFactorCorrectionStore.ts`: `design`, `activeStage` (not persisted), actions, persist `version: 1` + `migrate`, history save/load of `design` (T014 passes)
- [X] T016 [P] [US1] Create `components/power-factor-correction/DesignStepper.tsx` (numbered 1–4, current/complete/disabled states, click to revisit, Back/Next, keyboard accessible, `aria-current="step"`)
- [X] T017 [P] [US1] Create `components/power-factor-correction/DesignSummaryStrip.tsx` (total kVAR · steps + sequence · tuning or "none" · incomer A; placeholders before calculation)
- [X] T018 [US1] Restructure `app/power-factor-correction/PowerFactorCorrectionTool.tsx`: stepper + summary strip, stage 1 = existing input form + results, `design = useMemo(designPanel(...))`, stages 2–4 disabled until stage 1 results exist or for MV, handlers via `getState()` (no `useCallback([store])`), header text "Power Factor Correction & APFC Panel Design"
- [X] T019 [US1] Update `components/power-factor-correction/PowerFactorCorrectionHistorySidebar.tsx` if needed so loading restores `design` (no change if handled in the store)

## Phase 8: Stage UIs (US2–US4)

- [X] T020 [P] [US2] Create `components/power-factor-correction/StepBankStage.tsx`: sequence select (Auto / presets / Custom), custom steps editor (comma list), max outputs (6/8/12), CT primary/secondary, minimum load variation; results: step table (step, kVAR, cumulative), outputs/controller, resolution, switching levels, C/k with formula tooltip, warnings
- [X] T021 [P] [US3] Create `components/power-factor-correction/DetuningStage.tsx`: detuning select (Auto (shows recommendation) / None / 5.67 / 7 / 14 %), "significant 3rd harmonic" checkbox, THD read-only from stage 1; results: fr, Uc, Ur, per-step table (Qeff, Qr, Xc, L mH, I), notes, formulas
- [X] T022 [P] [US4] Create `components/power-factor-correction/SwitchgearStage.tsx`: protection type (fuse/MCCB); per-step table (In, design I, contactor, protection, cable) with an inline override input per cell, an "override" badge, a red error when undersized, and a reset button; panel totals (Σ In, design I, incomer, busbar); factor note (1.43 IEC / 1.35 NEC)
- [X] T023 Wire T020–T022 into `PowerFactorCorrectionTool.tsx` with `getState().setDesign` / `setStepOverride`

## Phase 9: User Story 5 — PDF export (P3)

- [X] T024 [P] [US5] Write `__tests__/unit/calculations/power-factor-correction/pdf.test.ts` (Red): `buildPanelDesignSections` for Example B + detuning 7 % contains every step row, C/k, tuning frequency, incomer, standards list (IEC 60831, IEC 61921, IEC 60947-4-1, IEEE 18, NEC 460); detuning none → "No detuning applied"; override marker "(override)"
- [X] T025 [US5] Extend `lib/pdfGenerator.powerFactorCorrection.ts`: optional `design` option, `buildPanelDesignSections`, render sections with page breaks; pass `design` from the tool's export handler

## Phase 10: Polish

- [X] T026 Run `npx vitest run __tests__/unit/calculations/power-factor-correction` and `npx tsc --noEmit` (filtered to touched paths); fix failures
- [X] T027 Run `npx next build`; smoke test `/power-factor-correction` serves 200
- [X] T028 [P] Accessibility pass: labels on all new inputs, stepper keyboard operation, warnings not colour-only
- [X] T029 Write `specs/014-pfi-panel-design/verification.md` (test results, open manual checks)
- [ ] T030 **USER**: manual browser walkthrough (quickstart steps 1–8) and PDF check

## Dependencies

- T002 before any change to the PFC code. T003 → T004/T005 → all stories.
- US2 (T006–T007) → US3 (T008–T009) → US4 (T010–T011) → T012–T013. US4 can be tested with non-detuned input before US3 (T010 uses `pPercent: null`).
- T013 → T018 (UI needs `designPanel`). T015 → T018.
- T016/T017/T020–T022 are parallel presentational components. T023 after T018.
- T024–T025 after T013.

## Parallel examples

- T004 ∥ T005 after T003.
- Test-writing tasks T006, T008, T010 can be drafted in parallel (different files).
- T016 ∥ T017 ∥ T020 ∥ T021 ∥ T022.

## Implementation strategy

MVP = Setup + Foundational + US2 + orchestration + US1 stepper with the stage 2 UI. Then US3, US4, US5, each independently demonstrable.
