---
description: "Task list for Battery Calculator Revamp (011-battery-revamp)"
---

# Tasks: Battery Calculator Revamp — Standards-Based Sizing & UX Redesign

**Input**: Design documents from `/specs/011-battery-revamp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (all present)

**Tests**: INCLUDED — Constitution Principle V makes TDD NON-NEGOTIABLE for this P1 calculator. Engine tests are written first and must fail before implementation (Red → Green → Refactor).

**Organization**: Tasks grouped by user story (US1–US6 from spec.md) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US6 (user-story tasks only)
- All paths are repo-relative (repo root `D:\prompteng\elec_calc`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffolding for the new engine module and test layout. Branch `011-battery-revamp` already exists.

- [x] T001 Create engine module dir `lib/calculations/battery/` and data dir `lib/datasheets/`; add `lib/calculations/battery/index.ts` re-exporting the existing `calculateBackupTime` as a temporary shim so current imports keep compiling.
- [x] T002 [P] Add Vitest test scaffolding for the feature: `lib/calculations/battery/__tests__/` with a shared fixtures file `fixtures.ts` (placeholder for IEEE 485 values, pending T006).
- [x] T003 [P] Confirm `tesseract.js`, `pdfjs-dist`, `recharts`, `jspdf`, `html2canvas` resolve (already in package.json) — no install needed; note dynamic-import strategy for OCR in a code comment in `lib/datasheets/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Canonical chemistry data model, types, schema, validation surface, persistence migration, and the shared derating module. EVERYTHING below blocks all user stories.

**⚠️ CRITICAL**: No user-story work begins until Phase 2 is complete.

### Decision checkpoints (require user sign-off — research.md open items)

- [x] T004 ✅ RESOLVED (user 2026-06-21): **author a dedicated FLA (flooded lead-acid)** `BatteryTypeSpec` in `lib/standards/batteryTypes.ts`. Approved values: DoD recommended 50% / max 80%, round-trip efficiency 80%, temp coefficient 2 %/°C, optimal 20–25 °C, peukertExponent 1.25 (plus reasonable lifespan/maintenance/safety fields consistent with flooded lead-acid).
- [x] T005 ✅ RESOLVED (user 2026-06-21): use proposed **Peukert exponent** defaults — lead-acid (AGM/GEL) 1.2, FLA 1.25, NiCd/NiFe 1.1, lithium/flow 1.02.
- [x] T006 ✅ RESOLVED (user 2026-06-21): IEEE 485 accuracy fixtures **approved and written** to `lib/calculations/battery/__tests__/fixtures.ts` — fixtures A–F (runtime: AGM/LFP/AGM-cold/NiCd/FLA) + D (AGM sizing, round-trip) + Peukert spot-checks. C/20 basis (Peukert=1) isolates the standards math; ±2% tolerance.

### Canonical data & types

- [x] T007 Add `peukertExponent: number` to `BatteryTypeSpec` and populate it for all chemistries in `lib/standards/batteryTypes.ts` (values from T005).
- [x] T008 [P] Create `lib/standards/batteryChemistryMap.ts`: `legacyToCanonical` map (`VRLA-Gel→VRLA-GEL`, `FLA→…`, `LiFePO4→Li-Ion-LFP`, `Li-ion→Li-Ion-NMC`, identity for rest), `chemistryDisplayLabel`, and `toCanonicalChemistry(id)` (contract C-IDmap).
- [x] T009 Update `lib/types/calculations.ts`: extend `BatteryCalculatorInputs` (`mode`, `targetBackupHours`, `dodOverride`, `cellBlockVoltage`, `datasheetId`) and `BatteryCalculatorResult` (`mode`, `requiredCapacityAh`, `appliedFactors`, `bankConfig`, `verdict`, `recommendations`); add `AppliedFactors`, `FactorValue`, `BankConfig` types and the new `BatteryWarningType` members.

### Schema, validation, persistence

- [x] T010 Update `lib/schemas/batterySchema.ts`: `BatteryChemistrySchema` → 8 canonical IDs; add new fields; `superRefine` for mode-conditional required fields (ampHours XOR targetBackupHours) and `dodOverride ≤ chemistry.maximum`; `preprocess` chemistry through `toCanonicalChemistry` (contracts C2, C3).
- [x] T011 Update `lib/validation/batteryValidation.ts`: keep <100ms structure + security validators; add chemistry-limit, temperature-range (warn/error from profile), and mode-aware required-field checks. Output shape unchanged.
- [x] T012 Update `stores/useBatteryStore.ts` persist config: bump `version: 1`, add `migrate()` rewriting `inputs.chemistry` via the map and backfilling `mode='runtime'`, `temperature=25`, new optional fields (contract C4). Update `defaultInputs` to canonical chemistry + `mode`.

### Shared derating module (used by US1 + US2)

- [x] T013 [P] [Foundational] Write FAILING tests `lib/calculations/battery/__tests__/derating.test.ts` for `dodFactor`, `temperatureFactor` (1.0 in/above optimal, coeff·Δ below, floor + range warning), `agingFactor` (default 0.8), `efficiencyFactor`, `peukertDerate` (≈1.0 for exponent≈1.0, <1.0 lead-acid high C-rate).
- [x] T014 [Foundational] Implement `lib/calculations/battery/derating.ts` to pass T013 (pure functions over `BatteryTypeSpec` + inputs; mathjs via `lib/mathConfig`).

**Checkpoint**: Canonical chemistry, types, schema, validation, migration, and derating all green — user stories can begin.

---

## Phase 3: User Story 1 — Chemistry-aware runtime (Priority: P1) 🎯 MVP

**Goal**: Backup-time estimate that correctly varies by chemistry (DoD, temperature, aging, rate), fixing the core defect.

**Independent Test**: Same V/load/Ah, switch VRLA-AGM → Li-Ion-LFP → backup time and effective capacity change (SC-001); moving temperature below optimal reduces capacity.

### Tests for User Story 1 (write first, must fail) ⚠️

- [x] T015 [P] [US1] Write FAILING test `__tests__/runtime.test.ts`: G1 chemistry sensitivity (two chemistries → different `effectiveCapacityAh`), G3 accuracy vs IEEE 485 fixtures (±2%), G4 <100ms.
- [x] T016 [P] [US1] Write FAILING test `__tests__/dischargeCurve.test.ts`: monotonic non-increasing SoC/remaining Ah, ≥12 points, voltage within plateau→cutoff.

### Implementation for User Story 1

- [x] T017 [US1] Implement `lib/calculations/battery/runtime.ts` (`calculateRuntime`): forward corrected-capacity formula using derating.ts; populate `appliedFactors`, `dischargeRate`, `effectiveCapacityAh`, `verdict`, `recommendations`, `warnings`, `standards`.
- [x] T018 [P] [US1] Implement `lib/calculations/battery/dischargeCurve.ts` (`buildDischargeCurve`) to pass T016.
- [x] T019 [US1] Implement dispatcher in `lib/calculations/battery/index.ts` (`calculateBattery` → runtime when `mode='runtime'`); remove the T001 shim and update `stores/useBatteryStore.ts` + `lib/validation/batteryValidation.ts` imports to the new module.
- [x] T020 [US1] Wire `stores/useBatteryStore.ts` `calculate()` to `calculateBattery`; ensure auto-calc path still validates first.
- [x] T021 [US1] Update `components/battery/BatteryInputForm.tsx`: chemistry `Select` uses canonical IDs + `chemistryDisplayLabel`; remove the hardcoded mismatched options; keep temperature input.
- [x] T022 [US1] Update `components/battery/BatteryResults.tsx` to render `appliedFactors` (DoD, temperature, aging, efficiency, C-rate) with source labels + standard references via the existing ResultDisplay/Badge.

**Checkpoint**: US1 fully functional through the existing page — chemistry now changes the answer. MVP demoable.

---

## Phase 4: User Story 2 — Reverse sizing for a target backup time (Priority: P1)

**Goal**: Solve required capacity + bank configuration (series/parallel) for a target backup time, same derating in reverse.

**Independent Test**: Enter load + target time + V + chemistry → required Ah and a valid series/parallel config; feeding that nameplate back through runtime meets/exceeds the target (SC-005).

### Tests for User Story 2 (write first, must fail) ⚠️

- [x] T023 [P] [US2] Write FAILING test `__tests__/sizing.test.ts`: required Ah includes all factors; G2 round-trip (size → runtime ≥ target).
- [x] T024 [P] [US2] Write FAILING test `__tests__/bankConfig.test.ts`: `cellsInSeries=ceil(V/cellBlockV)`, `stringsInParallel=ceil(reqAh/perUnitAh)`, `overCapacityPct` from rounding up.

### Implementation for User Story 2

- [x] T025 [P] [US2] Implement `lib/calculations/battery/bankConfig.ts` (`computeBankConfig`) to pass T024.
- [x] T026 [US2] Implement `lib/calculations/battery/sizing.ts` (`sizeForRuntime`) using derating.ts + bankConfig.ts; extend `calculateBattery` dispatch for `mode='sizing'`.
- [x] T027 [US2] Create `components/battery/BatteryModeSwitch.tsx` (Radix Tabs runtime ↔ sizing), mirroring the conduit-fill/motor-starting standard switcher.
- [x] T028 [US2] Update `components/battery/BatteryInputForm.tsx`: mode-aware fields (Ah when runtime, target-backup-hours when sizing) + optional `cellBlockVoltage`; wire mode into store.
- [x] T029 [US2] Update `components/battery/BatteryResults.tsx`: headline = required capacity in sizing mode; render `bankConfig` (series/parallel, delivered Ah, over-capacity %) and `verdict`.

**Checkpoint**: Both P1 stories work independently; the calculator is now a sizing instrument.

---

## Phase 5: User Story 3 — Few inputs, sensible defaults, clear recommendations (Priority: P2)

**Goal**: Complete defensible sizing from minimal inputs; all factors auto-filled from chemistry data, labelled default vs user-supplied, with plain-language recommendations.

**Independent Test**: Enter only essentials → full result with every factor sourced/labelled; override one → recalc + relabel as user-supplied.

### Tests for User Story 3 (write first, must fail) ⚠️

- [ ] T030 [P] [US3] Write FAILING test `__tests__/defaults.test.ts`: unspecified factors resolve to chemistry defaults with `source:'default'`; an override flips `source:'user'` and changes the result.

### Implementation for User Story 3

- [x] T031 [US3] Add default-resolution helpers in `lib/calculations/battery/derating.ts` (or `defaults.ts`) pulling DoD/efficiency/temperature/aging from the chemistry profile when inputs are absent; stamp `FactorValue.source`.
- [x] T032 [US3] Implement recommendation generation (`recommendations: string[]` + pass/marginal/fail verdict text) in runtime.ts/sizing.ts.
- [x] T033 [P] [US3] Update `components/battery/BatteryInputForm.tsx`: show auto-filled defaults distinctly (placeholder/"default" hint) and mark user overrides.
- [x] T034 [US3] Update `components/battery/BatteryResults.tsx` to surface the plain-language recommendation block.

**Checkpoint**: Approachable path yields correct, fully-explained results.

---

## Phase 6: User Story 4 — Manufacturer datasheet library (Priority: P2)

**Goal**: Select a real model from a curated library to pre-fill inputs (marked datasheet-sourced), reflecting a specific product.

**Independent Test**: Pick a model → its parameters pre-fill and are marked sourced; choose a conflicting chemistry → warning.

### Tests for User Story 4 (write first, must fail) ⚠️

- [x] T035 [P] [US4] Write FAILING test `lib/datasheets/__tests__/library.test.ts`: every `DatasheetEntry.chemistry` is canonical (C5); `getDatasheet`/`datasheetsForChemistry` behavior.

### Implementation for User Story 4

- [x] T036 [P] [US4] Create `lib/datasheets/library.ts` with `DatasheetEntry` type + a curated set (~10–20 real models across supported chemistries) and `getDatasheet`/`datasheetsForChemistry`.
- [x] T037 [US4] Create `components/battery/DatasheetPicker.tsx` (Radix Select grouped by manufacturer/chemistry) that pre-fills inputs and flags them datasheet-sourced.
- [x] T038 [US4] Add datasheet→chemistry conflict warning in `lib/validation/batteryValidation.ts` and surface it; wire `datasheetId` into store + form.

**Checkpoint**: Sizing can target procurable products.

---

## Phase 7: User Story 5 — Redesigned, design-system-aligned UX + PDF export (Priority: P2)

**Goal**: Modern page with a dominant headline metric, side-by-side sticky layout on desktop, mobile reflow, and re-enabled PDF export.

**Independent Test**: Desktop shows side-by-side input/results with sticky results + dominant headline; export produces a PDF with inputs, result, factors, recommendations, standards refs; mobile reflows to one column.

### Implementation for User Story 5

- [x] T039 [US5] Restructure `components/battery/BatteryCalculator.tsx`: two-column grid with sticky results panel on `lg+`, single column on mobile; aligned to Design System patterns (CalculationCard/ResultDisplay/WarningBanner).
- [x] T040 [P] [US5] Make the headline metric (backup time / required capacity) visually dominant in `components/battery/BatteryResults.tsx` (hero treatment from the ResultDisplay primary pattern).
- [x] T041 [P] [US5] Create `components/battery/DischargeChart.tsx` (Recharts) fed by `result.dischargeCurve`.
- [x] T042 [US5] Create `lib/pdfGenerator.battery.ts` following the per-calculator pattern (e.g., `pdfGenerator.generatorSizing.ts`): inputs, headline, applied factors, bank config, recommendations, standards refs, timestamp, disclaimer.
- [x] T043 [US5] Re-enable export in `components/battery/BatteryCalculator.tsx`: map `BatteryCalculatorResult` to the session/PDF format and wire `PDFDownloadButton` (removing the disabled TODO block).

**Checkpoint**: Page is presentable and exportable; matches the ElectroMate Design System.

---

## Phase 8: User Story 6 — Datasheet OCR/AI extraction (Priority: P3, stretch)

**Goal**: Upload a datasheet; auto-extract parameters for user confirmation before applying. Reuses ADR-005's client-side Tesseract.js + pdf.js pattern.

**Independent Test**: Upload a sample datasheet → detected fields shown for confirmation before populating; failure/low-confidence falls back to manual entry.

### Tests for User Story 6 (write first, must fail) ⚠️

- [x] T044 [P] [US6] Write FAILING test `lib/datasheets/__tests__/datasheetExtract.test.ts`: `extractFromFile` returns candidates + confidence and never auto-applies (C6); file type/size guard (C7).

### Implementation for User Story 6

- [x] T045 [US6] Implement `lib/datasheets/datasheetExtract.ts` (dynamic-import `tesseract.js`/`pdfjs-dist`, client-side, Web Worker per ADR-005) returning `ExtractionResult`.
- [x] T046 [US6] Extend `components/battery/DatasheetPicker.tsx` with an upload + confirmation step (review detected fields, confirm to apply, manual fallback always available).

**Checkpoint**: OCR convenience layered without weakening the manual/library paths.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T047 [P] Remove memoization-cache staleness risk in the new engine (carry forward the existing cache only if keyed on ALL new inputs incl. mode/temperature/overrides) in `lib/calculations/battery/index.ts`.
- [ ] T048 [P] Update `components/battery/` for accessibility (labels, focus states, WCAG 2.1 AA) consistent with the shared kit.
- [ ] T049 [P] Add/adjust a reference-guide dialog (standards + method summary) consistent with conduit-fill/motor-starting.
- [ ] T050 Run `npm run lint` and resolve issues confined to battery files; ensure smallest-viable-diff (no unrelated calculators touched).
- [ ] T051 Run `specs/011-battery-revamp/quickstart.md` manual walkthrough (steps 1–8 incl. localStorage migration check).
- [ ] T052 [P] Sync updated Battery patterns to the ElectroMate Design System project (`design-system/patterns/battery-*.html`) via `/design-sync` once the redesign is final.

---

## Phase 10: Constitution Compliance Verification

### Calculation Accuracy
- [x] T053 [P] Verify runtime + sizing against IEEE 485 fixtures within ±2% (`__tests__/runtime.test.ts`, `sizing.test.ts`).
- [x] T054 Document standard versions (IEEE 485-2020, IEC 60896/62619, NEC 2020) in engine code comments and result `standards`.

### Safety Validation
- [x] T055 [P] Test dangerous-condition detection (over safe C-rate, temperature outside operating range, DoD override > max, EOL aging) and <100ms validation latency.
- [x] T056 Verify warning UI (red error / amber warning + code references) renders for each case.

### Standards Compliance & Professional Docs
- [x] T057 [P] Verify standard references display in results and PDF; confirm disclaimer + timestamp present.
- [ ] T058 Test PDF export across Chrome/Firefox/Safari/Edge (SC-003).

### Test Coverage & Progressive Enhancement
- [x] T059 [P] Confirm coverage (nominal/boundary/edge/error) per engine module; verify Red→Green→Refactor was followed and the T006 fixture checkpoint was completed.
- [x] T060 Confirm US1 and US2 (P1) are independently testable/deployable before P2/P3 layering; verify localStorage migration (C4).

**Checkpoint**: Constitution compliance verified — ready for `/sp.implement` review and PR.

---

## Dependencies & Execution Order

### Phase dependencies
- **Setup (P1)** → no deps.
- **Foundational (P2)** → after Setup; BLOCKS all stories. Decision checkpoints **T004–T006 gate T007 and the test fixtures**.
- **US1 (P3)** and **US2 (P4)** → after Foundational; both P1. US2 reuses derating from P2 but is independently testable.
- **US3 (P5), US4 (P6), US5 (P7)** → after Foundational; build on US1/US2 results but each independently testable. US5 (PDF/layout) consumes the engine output.
- **US6 (P8)** → after US4 (extends DatasheetPicker); P3 stretch.
- **Polish (P9)** and **Constitution (P10)** → after targeted stories complete.

### Within each story
- Tests first (must fail) → models/data → engine → store wiring → UI.

### Parallel opportunities
- T002/T003 (setup); T008 with T009-prep; T013 then T014; within US1 T015∥T016, US2 T023∥T024 (then T025∥), US4 T035∥T036.
- After Foundational, US3/US4/US5 can be staffed in parallel; US1 and US2 share the engine so coordinate the dispatcher (T019/T026).

---

## Parallel Example: User Story 1

```bash
# Write US1 tests together (must fail first):
Task: "__tests__/runtime.test.ts — chemistry sensitivity + accuracy + perf"
Task: "__tests__/dischargeCurve.test.ts — monotonic curve, >=12 points"

# Then implement (dischargeCurve is parallel to runtime once derating exists):
Task: "lib/calculations/battery/runtime.ts"
Task: "lib/calculations/battery/dischargeCurve.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)
1. Phase 1 Setup → 2. Phase 2 Foundational (incl. T004–T006 sign-offs) → 3. Phase 3 US1 → **STOP & VALIDATE** chemistry now changes the answer → demo.

### Incremental delivery
Foundation → US1 (MVP, fixes the live defect) → US2 (sizing) → US3 (defaults/UX of inputs) → US4 (datasheets) → US5 (redesign + PDF) → US6 (OCR stretch). Each story independently testable and deployable.

---

## Notes
- [P] = different files, no dependencies.
- TDD is mandatory for engine modules (Constitution V); verify tests fail before implementing.
- T004–T006 require user sign-off — do not start dependent tasks until resolved.
- Keep the diff confined to battery files; do not touch unrelated calculators.
- Commit after each task or logical group.

## Task summary
- **Total**: 60 tasks (T001–T060).
- Setup 3 · Foundational 11 (incl. 3 decision checkpoints) · US1 8 · US2 7 · US3 5 · US4 4 · US5 5 · US6 3 · Polish 6 · Constitution 8.
- **MVP scope**: Phases 1–3 (Setup + Foundational + US1).
- Test tasks: T013, T015, T016, T023, T024, T030, T035, T044 (engine/data, written to fail first).
