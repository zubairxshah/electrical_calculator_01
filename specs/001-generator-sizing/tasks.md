# Tasks: Generator Sizing Calculator

**Input**: Design documents from `/specs/001-generator-sizing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included for P1 critical calculation modules per constitution (TDD NON-NEGOTIABLE for P1). P2/P3 tests recommended but not blocking.

**Organization**: Tasks grouped by user story. US1+US2 are both P1 but US2 depends on US1's load summation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization — types, data tables, validation, store, route scaffolding

- [ ] T001 Create all TypeScript interfaces and enums in `types/generator-sizing.ts` based on data-model.md
- [ ] T002 Create generator reference data tables (NEMA codes, standard ratings 50/60Hz, starting multipliers, SFC curves, NEC constraints) in `lib/calculations/generator-sizing/generatorData.ts` based on research.md R2/R4/R5/R7
- [ ] T003 Create Zod validation schemas for all input entities in `lib/validation/generatorSizingValidation.ts`
- [ ] T004 Create Zustand store with persist middleware in `stores/useGeneratorSizingStore.ts` — state for loads[], generatorConfig, siteConditions, fuelConfig, results, history
- [ ] T005 [P] Scaffold server page with metadata in `app/generator-sizing/page.tsx`
- [ ] T006 [P] Scaffold client orchestrator component in `app/generator-sizing/GeneratorSizingTool.tsx` — empty shell importing store, placeholder sections

**Checkpoint**: Project skeleton in place. Route accessible at `/generator-sizing` with empty UI.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Unit conversion utilities and shared UI components needed by all stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Add unit conversion helpers to `lib/calculations/generator-sizing/generatorData.ts` — hpToKw, kwToHp, mToFt, ftToM, cToF, fToC, litersToGallons, gallonsToLiters
- [ ] T008 Create editable load table component in `components/generator-sizing/LoadTable.tsx` — add/edit/remove rows, columns: name, type, power (with kW/HP toggle), PF, qty, diversity, motor fields (conditional: HP, code letter, starting method)
- [ ] T009 Create generator input form component in `components/generator-sizing/GeneratorInputForm.tsx` — duty type, voltage, phases, frequency (50/60Hz), Xd'', fuel type, NEC classification dropdown with auto-fill constraints

**Checkpoint**: Foundation ready — load entry UI functional, unit toggles working, generator configuration available.

---

## Phase 3: User Story 1 — Basic Generator Load Sizing (Priority: P1) 🎯 MVP

**Goal**: Size a generator from a load list using vector power summation with diversity factors, recommend standard generator size.

**Independent Test**: Enter mixed loads (motors + lighting + HVAC), select standby/prime, receive correct kVA recommendation from standard ratings.

### Tests for User Story 1 (TDD — Constitution V)

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [US1] Write unit tests for vector power summation in `lib/calculations/generator-sizing/__tests__/loadSummation.test.ts` — test cases: (1) single resistive load kW=kVA at PF=1.0, (2) mixed PF loads verify kVA < arithmetic sum, (3) diversity factor reduces demand, (4) quantity multiplier, (5) zero loads returns error, (6) boundary: PF=0.01 and PF=1.0
- [ ] T011 [US1] Write unit tests for standard generator selection in `lib/calculations/generator-sizing/__tests__/generatorData.test.ts` — test cases: (1) exact match returns same size, (2) between sizes returns next up, (3) exceeds max returns warning, (4) 50Hz vs 60Hz ratings differ, (5) standby 100% vs prime 70% loading limit

### Implementation for User Story 1

- [ ] T012 [US1] Implement `calculateLoadSummary()` in `lib/calculations/generator-sizing/loadSummation.ts` — vector summation: per-load kW = rated × qty × diversity, kVAR = kW × tan(acos(PF)), total kVA = √(Σkw² + Σkvar²), apply loading limit, call getNextStandardRating()
- [ ] T013 [US1] Implement `getNextStandardRating()` in `lib/calculations/generator-sizing/generatorData.ts` — binary search on STANDARD_RATINGS_50HZ or _60HZ, return next size ≥ required, flag if exceeds max
- [ ] T014 [US1] Create results display component in `components/generator-sizing/GeneratorResults.tsx` — show total kW/kVAR/kVA, combined PF, required kVA, recommended generator size, loading %, standards references (ISO 8528, NFPA 110)
- [ ] T015 [US1] Wire US1 calculation into orchestrator `app/generator-sizing/GeneratorSizingTool.tsx` — connect store → loadSummation → results display, add Calculate button, handle validation errors
- [ ] T016 [US1] Run US1 tests — verify all pass within ±1% tolerance per SC-002

**Checkpoint**: Working generator sizer — enter loads, get recommended generator size. MVP complete.

---

## Phase 4: User Story 2 — Motor Starting Analysis (Priority: P1)

**Goal**: Calculate motor starting kVA and voltage dip for each motor, flag results exceeding thresholds.

**Independent Test**: Enter a 50HP motor (code G, DOL start) with base load, verify starting kVA = 50 × 5.95 = 297.5 kVA, voltage dip calculated and threshold flagged.

### Tests for User Story 2 (TDD — Constitution V)

- [ ] T017 [US2] Write unit tests for motor starting analysis in `lib/calculations/generator-sizing/__tests__/motorStarting.test.ts` — test cases: (1) DOL start full LR kVA, (2) star-delta ×0.33 reduction, (3) VFD custom multiplier, (4) NEMA code letter G lookup = 5.95 kVA/HP, (5) voltage dip calculation with Xd''=0.15, (6) threshold pass/fail at 15% and 20%, (7) IEC locked rotor ratio path (50Hz)

### Implementation for User Story 2

- [ ] T018 [US2] Implement `analyzeMotorStarting()` in `lib/calculations/generator-sizing/motorStarting.ts` — for each motor: lookup LR kVA/HP from NEMA code or use IEC ratio, apply starting method multiplier, calculate voltage dip % = (Xd'' × startingKVA / genKVA) × 100, compare to threshold, identify worst case
- [ ] T019 [US2] Implement `getLrKvaPerHp()` in `lib/calculations/generator-sizing/generatorData.ts` — return midpoint of NEMA code letter range
- [ ] T020 [US2] Create motor starting panel component in `components/generator-sizing/MotorStartingPanel.tsx` — per-motor table: name, HP, code letter, starting method, starting kVA, voltage dip %, pass/fail badge; highlight worst case; show formula and threshold reference
- [ ] T021 [US2] Wire US2 into orchestrator — after US1 calculates load summary + generator size, run motor starting analysis, display MotorStartingPanel
- [ ] T022 [US2] Run US2 tests — verify all pass within ±5% tolerance per SC-002

**Checkpoint**: Motor starting analysis functional. Engineers can verify voltage dip for each motor against thresholds.

---

## Phase 5: User Story 3 — Step Loading Sequence (Priority: P2)

**Goal**: Allow users to assign loads to numbered steps, calculate cumulative demand per step, provide auto-sequencing.

**Independent Test**: Assign 5 loads to 3 steps, verify cumulative kW/kVA at each step, verify warning when step exceeds 50% incremental.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Implement `calculateStepSequence()` in `lib/calculations/generator-sizing/stepLoading.ts` — group loads by stepNumber, calculate incremental and cumulative kW/kVA per step (include motor starting kVA for motors in each step), determine pass/warning/fail status per step (>50% incremental = warning)
- [ ] T024 [P] [US3] Implement `autoSequenceLoads()` in `lib/calculations/generator-sizing/stepLoading.ts` — sort motors by starting kVA desc, non-motors by kW desc, assign to steps with ≤50% incremental limit per IEEE 3006.4
- [ ] T025 [US3] Create step loading panel component in `components/generator-sizing/StepLoadingPanel.tsx` — step assignment dropdown per load in LoadTable, step summary table (step#, loads, incremental kW/kVA, cumulative kW/kVA, % loading, status badge), auto-sequence button
- [ ] T026 [US3] Wire US3 into orchestrator — add step loading tab/section, connect store step assignments → calculateStepSequence → display

**Checkpoint**: Step loading fully functional. Engineers can manually assign or auto-sequence loads.

---

## Phase 6: User Story 4 — Altitude and Temperature Derating (Priority: P2)

**Goal**: Apply ISO 8528-1 altitude and temperature derating to generator output, show rated vs derated capacity.

**Independent Test**: Enter 1500m altitude + 45°C, verify altitude factor ≈ 0.942, temperature factor ≈ 0.92, combined ≈ 0.867, derated output displayed.

### Implementation for User Story 4

- [ ] T027 [US4] Implement `calculateDerating()` in `lib/calculations/generator-sizing/derating.ts` — altitude factor = 1 - 0.035 × (alt-1000)/300 if alt>1000m else 1.0; temperature factor = 1 - 0.02 × (temp-25)/5 if temp>25°C else 1.0; combined = altitude × temperature (multiplicative)
- [ ] T028 [US4] Create derating panel component in `components/generator-sizing/DeratingPanel.tsx` — site conditions inputs (altitude with m/ft toggle, temperature with °C/°F toggle), display rated output, altitude factor, temperature factor, combined factor, derated output; show ISO 8528-1 reference
- [ ] T029 [US4] Wire US4 into orchestrator — apply derating factor to required kVA before standard rating selection, re-select generator size, update results display with derated values

**Checkpoint**: Derating functional. Generator recommendation now accounts for site conditions.

---

## Phase 7: User Story 5 — Fuel Consumption Estimation (Priority: P3)

**Goal**: Estimate fuel consumption rate and tank sizing for diesel or natural gas at specified loading.

**Independent Test**: 500kW diesel at 75% loading for 24hr → consumption ≈ 0.21 × 500 × 0.75 = 78.75 L/hr, tank ≈ 78.75 × 24 × 1.10 = 2079 L.

### Implementation for User Story 5

- [ ] T030 [US5] Implement `calculateFuelConsumption()` in `lib/calculations/generator-sizing/fuelConsumption.ts` — interpolate SFC from diesel/gas tables in generatorData.ts, calculate consumption rate (L/hr or m³/hr), total volume = rate × runtime × 1.10 reserve, convert to gallons if unit preference
- [ ] T031 [US5] Implement `interpolateSfc()` in `lib/calculations/generator-sizing/generatorData.ts` — linear interpolation between SFC table points for given load percentage
- [ ] T032 [US5] Create fuel estimation panel component in `components/generator-sizing/FuelEstimationPanel.tsx` — inputs: runtime (pre-filled from NEC classification), average loading %, fuel type; display: consumption rate (L/hr and gal/hr), total fuel required, reserve volume, tank size recommendation
- [ ] T033 [US5] Wire US5 into orchestrator — add fuel section, connect store fuelConfig → calculateFuelConsumption → display

**Checkpoint**: Fuel estimation functional. Complete sizing + fuel planning available.

---

## Phase 8: User Story 6 — PDF Report Export (Priority: P3)

**Goal**: Generate professional PDF report with all calculation sections, formulas, and standard references.

**Independent Test**: Complete a full sizing, click Export PDF, verify PDF contains load schedule, motor starting, derating, fuel sections with correct values and standard citations.

### Implementation for User Story 6

- [ ] T034 [US6] Create generator orchestrator function `calculateGeneratorSizing()` in `lib/calculations/generator-sizing/generatorCalculator.ts` — compose loadSummation → derating → getNextStandardRating → motorStarting → stepLoading → fuelConsumption, compile alerts, return complete SizingResult
- [ ] T035 [US6] Implement PDF generator in `lib/pdfGenerator.generatorSizing.ts` — sections: project info, load schedule table, vector summation details, motor starting analysis table, step loading sequence table, derating calculations, fuel estimation, recommended generator, standards references, disclaimer; omit empty sections
- [ ] T036 [US6] Add Export PDF button to GeneratorResults.tsx — call downloadGeneratorSizingPDF, pass complete input + results

**Checkpoint**: PDF export functional. Full professional report available for project documentation.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Navigation integration, final UX polish

- [ ] T037 [P] Add Generator Sizing to navigation in `components/layout/TopNavigation.tsx` under "Power Systems" category — name: "Generator Sizing", href: "/generator-sizing", description: "Standby/prime gen sizing (ISO 8528, IEEE 3006.4)", priority: "P1"
- [ ] T038 [P] Add Generator Sizing to sidebar in `components/layout/Sidebar.tsx` under "Power Systems" category — same details as TopNavigation
- [ ] T039 Add calculation history sidebar component in `components/generator-sizing/GeneratorHistorySidebar.tsx` — list past calculations from localStorage, click to restore
- [ ] T040 Add history sidebar integration to `app/generator-sizing/GeneratorSizingTool.tsx`

---

## Phase 10: Constitution Compliance Verification

**Purpose**: Validate implementation against constitutional principles

### Calculation Accuracy Validation
- [ ] T041 [P] Verify vector summation results against hand calculations — 3 test scenarios with mixed PF loads, tolerance ±1%
- [ ] T042 [P] Verify derating results against ISO 8528-1 published tables — 5 altitude/temperature combinations, tolerance ±2%
- [ ] T043 [P] Verify motor starting voltage dip against IEEE 3006.4 examples — 3 motor/generator combinations, tolerance ±5%

### Safety Validation
- [ ] T044 [P] Test dangerous condition detection — voltage dip >15%, overloaded steps, wet stacking warning (<30%), load exceeds max generator
- [ ] T045 Verify real-time validation performance — input changes trigger validation within 100ms

### Standards Compliance
- [ ] T046 [P] Verify standard references display in results — ISO 8528, IEEE 3006.4, NFPA 110, NEC 700/701/702
- [ ] T047 Test PDF report contains section numbers, formula citations, and disclaimer text

### Professional Documentation
- [ ] T048 Test PDF export across Chrome, Firefox, Safari, Edge — verify rendering
- [ ] T049 Verify "Show Details" mode for vector summation breakdown and derating factor display

### Progressive Enhancement
- [ ] T050 Confirm US1 works independently without US2-US6 features
- [ ] T051 Confirm each user story adds standalone value without breaking previous stories

**Checkpoint**: Constitution compliance verified — ready for code review and deployment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types, data, store must exist)
- **Phase 3 (US1)**: Depends on Phase 2 — **MVP target**
- **Phase 4 (US2)**: Depends on Phase 3 (needs loadSummation + generator size from US1)
- **Phase 5 (US3)**: Depends on Phase 2 + T012 (needs loadSummation for step cumulation)
- **Phase 6 (US4)**: Depends on Phase 2 only (derating is independent of load calculation)
- **Phase 7 (US5)**: Depends on Phase 2 + generator size selection (T013)
- **Phase 8 (US6)**: Depends on Phases 3-7 (composes all modules into orchestrator + PDF)
- **Phase 9 (Polish)**: Can start after Phase 3 (nav items), complete after Phase 8
- **Phase 10 (Compliance)**: Depends on all implementation phases complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation)
                        ↓
              ┌─────────┼─────────┬──────────┐
              ↓         ↓         ↓          ↓
         US1 (P1)   US3 (P2)*  US4 (P2)  US5 (P3)*
              ↓
         US2 (P1)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
 US6 (P3)         Phase 9 (Polish)
    ↓
Phase 10 (Compliance)

* US3 needs loadSummation from US1; US5 needs generator selection from US1
```

### Parallel Opportunities

**Within Phase 1**: T005 ∥ T006 (different files)
**Within Phase 2**: T008 ∥ T009 (different components)
**Within Phase 5**: T023 ∥ T024 (same file but independent functions)
**Within Phase 9**: T037 ∥ T038 (different files)
**Within Phase 10**: T041 ∥ T042 ∥ T043, T044 ∥ T046

**Cross-phase parallelism** (after Foundation):
- US4 (derating) can run in parallel with US1 (they're independent modules)
- US3 and US5 can start after US1's T012+T013 complete

---

## Parallel Example: User Story 1

```bash
# Tests first (single file):
Task T010: "Write unit tests for loadSummation"
Task T011: "Write unit tests for generator selection"

# Then implementation (T012 ∥ T013 — different functions/concerns):
Task T012: "Implement calculateLoadSummary() in loadSummation.ts"
Task T013: "Implement getNextStandardRating() in generatorData.ts"

# Then UI + wiring (sequential — depends on calc modules):
Task T014: "Create GeneratorResults.tsx"
Task T015: "Wire into orchestrator"
Task T016: "Run tests — verify pass"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T009)
3. Complete Phase 3: User Story 1 (T010–T016)
4. **STOP and VALIDATE**: Enter mixed loads, verify generator recommendation
5. Deploy/demo if ready — working generator sizer

### Incremental Delivery

1. Setup + Foundation → skeleton ready
2. US1 → basic generator sizing MVP ✅
3. US2 → motor starting voltage dip analysis ✅
4. US4 → site condition derating (can parallel with US2) ✅
5. US3 → step loading sequence ✅
6. US5 → fuel consumption estimation ✅
7. US6 → PDF report export ✅
8. Polish + Compliance → production ready

### Task Count Summary

| Phase | Story | Tasks | Parallel |
|-------|-------|-------|----------|
| Setup | — | 6 | 2 |
| Foundational | — | 3 | 2 |
| US1 (P1) | Load Sizing | 7 | 0 (sequential TDD) |
| US2 (P1) | Motor Starting | 6 | 0 (sequential TDD) |
| US3 (P2) | Step Loading | 4 | 2 |
| US4 (P2) | Derating | 3 | 0 |
| US5 (P3) | Fuel | 4 | 0 |
| US6 (P3) | PDF Export | 3 | 0 |
| Polish | — | 4 | 2 |
| Compliance | — | 11 | 8 |
| **Total** | | **51** | **16** |
