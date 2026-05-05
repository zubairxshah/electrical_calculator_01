# Tasks: Motor Starting Analysis Calculator

**Input**: Design documents from `/specs/010-motor-starting/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/calculator-api.md, quickstart.md

**Tests**: Included — constitution mandates TDD for critical calculation logic (Principle V, NON-NEGOTIABLE for P1).

**Organization**: Tasks are grouped by user story. US1 (single-method analysis) and US2 (5-method comparison) are both P1 and share most of the implementation; they ship together as MVP. US3 (source-impedance chain UI), US4 (PDF export), and US5 (NEC/IEC switcher) layer on top.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: TypeScript types, Zod schemas, and route scaffolding shared by every user story.

- [X] T001 Create TypeScript interfaces for all motor-starting entities in `types/motor-starting.ts` — Motor, Load, UtilitySource, Transformer, CableSegment, SourceChain, MethodConfig (with discriminated union per method), MotorStartingInput, ThevenZResult, MethodResult, ComparisonResult, MotorStartingResult, plus the reference-data interfaces NemaCodeLetter, IecDesignClass, NemaDesignClass, ThermalLimitDefault, Ieee1668Threshold, CableImpedance (per data-model.md §Reference + §Input + §Computed)
- [X] T002 [P] Create Next.js page scaffold at `app/motor-starting/page.tsx` — server component exporting metadata (title, description) and rendering the client `<MotorStartingTool />` component
- [X] T003 [P] Create empty client tool stub at `app/motor-starting/MotorStartingTool.tsx` — `'use client'` directive, default export returning a placeholder div; will be filled in Phase 3

---

## Phase 2: Foundational (Reference Data + Core Math)

**Purpose**: NEC/IEC reference data and the pure calculation pipeline (source impedance → voltage dip → acceleration time → method results → comparison). MUST complete before any UI work.

**⚠️ CRITICAL**: No user-story UI work begins until this phase is complete and all tests pass.

### Tests (TDD — write first, verify they FAIL)

- [X] T004 [P] Write unit tests for reference-data lookups in `__tests__/unit/calculations/motor-starting/motorStartingData.test.ts` — `getNemaCodeLetter('G')` returns midpoint 5.95 kVA/HP, all 19 letters A–V resolvable, `getIecDesignClass('N')` and `'H'` return non-null defaults, `getThermalDefaultByHp(100)` falls in the 51–250 range, `getCableImpedance('4/0', 'Cu', 'Steel')` returns valid R/X, `getIeee1668Threshold('transient_motor_start')` returns 20%
- [X] T005 [P] Write unit tests for source-impedance Thevenin assembly in `__tests__/unit/calculations/motor-starting/sourceImpedance.test.ts` — nominal: utility 500 MVA + 1500 kVA / 5.75% xfmr + 4/0 Cu / 50 m on 480 V base produces transformer-dominated Z; boundary: `isInfiniteBus = true` makes `zUtility = 0`; edge: `parallelRuns = 2` halves R and X; error: missing transformer throws `Source chain incomplete`
- [X] T006 [P] Write unit tests for voltage-dip computation in `__tests__/unit/calculations/motor-starting/voltageDip.test.ts` — IEEE 3002.7 Annex C Case 1 (100 HP Code G, 1500 kVA xfmr) yields dip in the 9–13% range at PCC, ±2%; boundary: zero source Z → zero dip; edge: starting current = 0 → dip = 0; complex angle handled (current at 0.30 PF lagging vs source X/R)
- [X] T007 [P] Write unit tests for acceleration-time integration in `__tests__/unit/calculations/motor-starting/accelerationTime.test.ts` — nominal: NEMA MG 1 typical 50 HP 4-pole, quadratic load, WR² = 25 lb-ft² yields accel time 1–3 s; boundary: T_motor < T_load at any step → `Infinity` and `torqueVerdict = 'insufficient'`; edge: `inertia = 0` → `tAccSec = 0`; verify the speed-sample table has the requested step count
- [X] T008 [P] Write unit tests for the DOL method in `__tests__/unit/calculations/motor-starting/methods/dol.test.ts` — full LRA, full T_st; voltage dip and accel time delegate to T006/T007; `verdictBadge` set per dip vs threshold; cost `'low'`, complexity `'low'`
- [X] T009 [P] Write unit tests for the Star-Delta method in `__tests__/unit/calculations/motor-starting/methods/starDelta.test.ts` — current = ⅓ × LRA, torque = ⅓ × T_st; `methodNotes` contains "Requires 6-lead motor"; `'open'` transition adds transient note, `'closed'` does not
- [X] T010 [P] Write unit tests for the Autotransformer method in `__tests__/unit/calculations/motor-starting/methods/autotransformer.test.ts` — **CRITICAL**: line-side current = a² × LRA at taps 0.50, 0.65, 0.80 (the most-frequent hand-calc error); motor-side current = a × LRA; torque = a² × T_st; voltage dip uses line-side current; reject taps outside {0.50, 0.65, 0.80} via Zod
- [X] T011 [P] Write unit tests for the Soft Starter method in `__tests__/unit/calculations/motor-starting/methods/softStarter.test.ts` — peak current capped at `softStarterCurrentLimitPctFla`; current at start = LRA × (V_init / V_rated); torque scales with V²; ramp duration in 0 < t ≤ 60 s; initial voltage 10–80%
- [X] T012 [P] Write unit tests for the VFD method in `__tests__/unit/calculations/motor-starting/methods/vfd.test.ts` — current ≈ 1.0–1.1 × FLA at start; near-zero PCC dip during run-up; bypass flag adds note "reverts to DOL behavior"; verdict `'recommended'` when other methods fail dip but VFD passes
- [X] T013 [P] Write unit tests for comparison/ranking in `__tests__/unit/calculations/motor-starting/comparison.test.ts` — passing methods sorted by cost ascending then complexity; first survivor becomes `recommendedMethod`; no survivors → `recommendedMethod = 'none'` with rationale; rationale paragraph names the chosen method and the runners-up
- [X] T014 Run all tests T004–T013 and verify they FAIL (RED) — confirm test framework wiring before implementation

### Implementation

- [X] T015 [P] Implement reference data tables in `lib/calculations/motor-starting/motorStartingData.ts` — NEMA Code Letter table (A–V kVA/HP from NEC 430.7(B)), IEC Design N/H defaults (per IEC 60034-12), NEMA Design A–D typical multipliers, ThermalLimitDefault by HP range (1–10/11–50/51–250/251+ from NEMA MG 1), Ieee1668Threshold presets (steady_state_common 10%, transient_motor_start 20%, sensitive_loads 5%), CableImpedance lookup for NEC Ch.9 Table 9 and IEC 60364-5-52 (limit to common sizes 12 AWG–500 kcmil / 2.5–300 mm² for v1). Export getter functions matching contract names
- [X] T016 [P] Implement unit conversion helpers in `lib/calculations/motor-starting/unitConversions.ts` — hpToKw/kwToHp, lbFt2ToKgM2/kgM2ToLbFt2, rpmToRadPerSec/radPerSecToRpm, lbFtToNm/nmToLbFt; use mathjs BigNumber internally for round-trip stability; reuse AWG↔mm² helpers from existing voltage-drop calculator if present (check `lib/calculations/voltage-drop/` first)
- [X] T017 Implement source-impedance Thevenin assembly in `lib/calculations/motor-starting/sourceImpedance.ts` — `computeSourceImpedance(chain, baseKva, baseVoltageV)` returning `ThevenZResult` with R + jX components in per-unit and ohms; complex arithmetic via mathjs BigNumber; handle infinite-bus, parallel cable runs, conflicting utility MVA / SC amps inputs (warn via methodNotes if > 5% disagreement). Depends on T015, T016
- [X] T018 Implement voltage-dip calculation in `lib/calculations/motor-starting/voltageDip.ts` — `computeVoltageDip({ startingCurrentLineAmps, baseKva, baseVoltageV, thevenZPu, motorPowerFactorAtStart })` returning `{ vMotorPu, dipAtPccPct }`; handle the angle between motor inrush current (≈ 0.30 PF lag) and source impedance. Depends on T017
- [X] T019 Implement acceleration-time integration in `lib/calculations/motor-starting/accelerationTime.ts` — `computeAccelerationTime({ motor, load, voltageMultiplier, steps?, syncSpeedRpm })` doing 10-step quasi-static integration of `Δt = J × Δω / (T_motor − T_load)`; build motor torque-speed curve from three points (start/breakdown/full-load) with linear interpolation; build load curve per `torqueProfile`; return total time + sample table; return `Infinity` and flag if T_motor < T_load anywhere. Depends on T015, T016
- [X] T020 [P] Implement DOL method in `lib/calculations/motor-starting/methods/dol.ts` — `analyzeDol(args)` returning `MethodResult`; full LRA, full T_st; calls T018 and T019; cost `'low'`, complexity `'low'`. Depends on T017–T019
- [X] T021 [P] Implement Star-Delta method in `lib/calculations/motor-starting/methods/starDelta.ts` — current ⅓ × LRA, torque ⅓ × T_st; closed/open transition note; "Requires 6-lead motor" note. Depends on T017–T019
- [X] T022 [P] Implement Autotransformer method in `lib/calculations/motor-starting/methods/autotransformer.ts` — **line-side current = a² × LRA, motor-side = a × LRA, torque = a² × T_st**; supports taps 0.50/0.65/0.80; passes line-side current to dip calc. Depends on T017–T019
- [X] T023 [P] Implement Soft Starter method in `lib/calculations/motor-starting/methods/softStarter.ts` — linear voltage ramp from initial V to 100% over `softStarterRampSec`; current capped at `softStarterCurrentLimitPctFla`; torque scales with V²; report worst-case dip during ramp. Depends on T017–T019
- [X] T024 [P] Implement VFD method in `lib/calculations/motor-starting/methods/vfd.ts` — current ≈ FLA, full T at low frequency, near-zero PCC dip; bypass note when `vfdHasBypass`. Depends on T017–T019
- [X] T025 Implement comparison/ranking in `lib/calculations/motor-starting/comparison.ts` — `buildComparison({ methods, thresholdAppliedPct, thresholdScenario })` returning `ComparisonResult`; filter by passing dip + sufficient torque + thermal-safe; sort by cost asc, then complexity asc; build rationale paragraph. Depends on T020–T024
- [X] T026 Implement Zod validation schemas in `lib/validation/motorStartingValidation.ts` — `motorSchema`, `loadSchema`, `sourceChainSchema`, `methodConfigSchema` (discriminated union by `method`), `motorStartingInputSchema` (composes the above and asserts `methodConfigs.length === 5`). Depends on T001
- [X] T027 Implement top-level orchestrator in `lib/calculations/motor-starting/motorStartingCalculator.ts` — `analyzeMotorStarting(input)` parses with Zod (T026), computes Thevenin (T017), runs all five method modules (T020–T024), aggregates via comparison (T025), returns full `MotorStartingResult` with `computedAt` and `version='1.0.0'`. Depends on T017–T026
- [X] T028 Run all tests T004–T013 and verify they PASS (GREEN). Fix any failures. Run with coverage and verify ≥ 90% statement coverage on `lib/calculations/motor-starting/`

**Checkpoint**: Calculation core complete and tested against IEEE 3002.7 Annex C Case 1 within ±2%. UI work can now begin.

---

## Phase 3: User Stories 1 & 2 — Single-Method Analysis + 5-Method Comparison (Priority: P1) 🎯 MVP

**Goal**: Deliver the MVP — a working calculator UI where the user enters motor + load + minimal source data and sees per-method results plus a 5-row comparison table with a recommendation.

**Independent Test**: Open `/motor-starting`, enter the quickstart's 100 HP Code G case using *defaults* for source impedance (utility infinite-bus, default cable impedance), click **Compare Methods**, verify the comparison table shows 5 rows with starting current, torque, dip, accel time, and verdict badges, and the recommendation paragraph names a method with rationale.

### Tests

- [X] T029 [P] [US1] Write integration test in `__tests__/integration/motor-starting/singleMethodAnalysis.test.ts` — render `<MotorStartingTool />`, fill the quickstart's 100 HP Code G inputs, click **Analyze**, assert DOL row is rendered with `startingCurrentPctFla` ≈ 632 ± 20 and `voltageDipPasses1668 = true`
- [X] T030 [P] [US2] Write integration test in `__tests__/integration/motor-starting/methodComparison.test.ts` — same input, click **Compare Methods**, assert all five method rows present, recommendation paragraph names a non-`'none'` method, no row shows an unhandled-error placeholder

### Implementation

- [X] T031 [P] [US1] Implement Zustand store in `stores/useMotorStartingStore.ts` — state: `currentInput`, `currentResult`, `history` (capped at 50), `selectedMethodId`, `referenceGuideOpen`; actions: `setMotor`, `setLoad`, `setSourceChain`, `setMethodConfig`, `analyze`, `loadFromHistory`, `clearHistory`, `toggleReferenceGuide`; debounced (200 ms) recompute on input mutation; persist `history` to localStorage key `electromate.motor-starting.v1`
- [X] T032 [P] [US1] Implement Motor input form in `components/motor-starting/MotorInputForm.tsx` — fields: rated power + unit toggle (HP/kW), voltage, FLA, poles, efficiency, PF, service factor, design class (NEMA/IEC dropdown), code letter (NEC mode only), optional LRA override and multiplier-of-FLA override, optional thermal-limit overrides; tooltip on every field with units, typical range, and code reference; uses shadcn/ui form primitives
- [X] T033 [P] [US1] Implement Load input form in `components/motor-starting/LoadInputForm.tsx` — torque profile dropdown (constant / quadratic_fan_pump / linear), break-away torque (× T_rated) input, inertia (WR² or J) with unit toggle (lb-ft² / kg-m²); tooltips on each field
- [X] T034 [P] [US1] Implement Method config form in `components/motor-starting/MethodConfigForm.tsx` — collapsible sections per method showing method-specific tunables: autotransformer tap (50/65/80), Y-Δ transition (open/closed), soft-starter ramp seconds + initial V% + current limit %, VFD bypass toggle; defaults per research.md
- [X] T035 [US1] Implement single-method results card in `components/motor-starting/SingleMethodResults.tsx` — shows the user-selected method's full result: starting current (line and motor), starting torque, voltage at motor terminals, voltage dip at PCC with IEEE 1668 threshold marker, accel time vs thermal limit (color-coded), verdict badge, method notes list with citations. Subscribes to `useMotorStartingStore.currentResult` and `selectedMethodId`. Depends on T031
- [X] T036 [US2] Implement 5-method comparison table in `components/motor-starting/ComparisonTable.tsx` — columns: Method / Starting I% / Starting T% / Voltage Dip % / Accel Time / Cost / Complexity / Verdict; rows ordered by ranking (recommended first); recommended row highlighted; verdict badge color-coded per status; clicking a row sets `selectedMethodId`. Subscribes to `useMotorStartingStore.currentResult.comparison`. Depends on T031
- [X] T037 [US1] [US2] Implement starting-current chart in `components/motor-starting/StartingCurrentChart.tsx` — Recharts LineChart with one line per visible method using `MethodResult.currentVsTime`, plus an overlaid t-vs-I motor thermal-limit curve from `motor.stallTimeHotSec`; shaded danger zone above the limit. Depends on T031
- [X] T038 [US1] [US2] Implement voltage-dip indicator in `components/motor-starting/VoltageDipIndicator.tsx` — horizontal bar chart per method showing computed dip vs the active IEEE 1668 threshold marker; color-coded pass/fail. Depends on T031
- [X] T039 [US1] [US2] Wire all panels into `app/motor-starting/MotorStartingTool.tsx` (replacing the Phase 1 stub) — left column: input forms (Motor → Load → minimal Source defaults → Method configs); right column: tabbed results (Single Method | Comparison | Charts); top bar with Analyze + Compare buttons. Depends on T032–T038
- [X] T040 [US1] [US2] Implement calculation history sidebar in `components/motor-starting/HistorySidebar.tsx` — list of past `MotorStartingResult` entries from `store.history` with project name + timestamp + recommended method; click to load into `currentInput`; clear-history action. Mirrors Generator Sizing's pattern. Depends on T031
- [X] T041 [US1] [US2] Run T029, T030 and the unit suite; verify all GREEN. Manual smoke test per quickstart steps 1–7

**Checkpoint**: MVP shipped. Single-method analysis and 5-method comparison both work with default source-chain assumptions.

---

## Phase 4: User Story 3 — Source Impedance Chain (Priority: P2)

**Goal**: Replace the default source-chain assumption with explicit utility / transformer / cable inputs so that engineers can model the actual installation.

**Independent Test**: Toggle "Advanced source chain", enter the quickstart's utility 500 MVA / 1500 kVA 5.75% / 4/0 Cu 50 m chain, click **Analyze**, verify the displayed Thevenin Z (per-unit and ohmic) matches the hand-calc within ±1%, and the dip results shift accordingly vs the infinite-bus default.

### Tests

- [X] T042 [P] [US3] Write integration test in `__tests__/integration/motor-starting/sourceChainOverride.test.ts` — render with default infinite-bus, switch to advanced chain, enter the quickstart values, assert the rendered Thevenin Z component values (R, X both per-unit and ohms) and assert the DOL voltage dip changes vs the infinite-bus baseline

### Implementation

- [X] T043 [P] [US3] Implement Source Impedance form in `components/motor-starting/SourceImpedanceForm.tsx` — collapsible "Advanced" panel with three sub-forms: Utility (primary kV, SC MVA or SC amps, X/R, infinite-bus toggle), Transformer (kVA, primary kV, secondary V, %Z, X/R), Cable (size dropdown, material toggle, length m, parallel runs, conduit type); tooltips on every field; defaults from research.md
- [X] T044 [US3] Add Thevenin Z display panel inside `SingleMethodResults.tsx` — shows `currentResult.sourceImpedance` with per-unit R + jX, ohmic R + jX, and the `utilityAssumed` label ("Computed" or "Infinite bus assumed"). Depends on T035
- [X] T045 [US3] Wire `SourceImpedanceForm` into `MotorStartingTool.tsx` left column between Load and Method configs; bind to `useMotorStartingStore.setSourceChain`. Depends on T039, T043
- [X] T046 [US3] Run T042; manual verification per quickstart steps 6–7 with the full chain entered

**Checkpoint**: Engineers can model the actual source chain and see the impact on dip and recommendation.

---

## Phase 5: User Story 4 — PDF Export (Priority: P2)

**Goal**: Generate a multi-page engineering report suitable for client/AHJ submission.

**Independent Test**: Run any analysis, click **Export PDF**, verify download completes within 10 s and the PDF contains: project metadata, inputs, source chain, per-method results, comparison table, current-vs-time chart, voltage-dip indicator, citations to NEC 430 / IEC 60034-12 / IEEE 3002.7 / IEEE 1668.

### Tests

- [X] T047 [P] [US4] Write unit test for the PDF generator in `__tests__/unit/lib/pdfGenerator.motorStarting.test.ts` — invoke `generateMotorStartingPdf(result)` with a fixture `MotorStartingResult`, assert the returned `jsPDF` instance has the expected page count and that text searches find the recommended method label and a NEC 430 citation

### Implementation

- [X] T048 [P] [US4] Implement PDF generator in `lib/pdfGenerator.motorStarting.ts` — pages: (1) cover with project metadata + disclaimer, (2) inputs (motor + load), (3) source chain + Thevenin Z, (4) per-method results detail (one method per row), (5) comparison table via jspdf-autotable, (6) charts (rasterize from on-screen Recharts via html2canvas — reuse Generator Sizing's pattern if available), (7) citations and code references. Reuse `lib/pdfGenerator.helpers.ts` if present
- [X] T049 [US4] Add **Export PDF** button to `MotorStartingTool.tsx` top bar — disabled until `currentResult` exists; on click, calls `generateMotorStartingPdf(currentResult).save(filename)` with filename `motor-starting-{projectRef|timestamp}.pdf`. Depends on T039, T048
- [X] T050 [US4] Run T047; manually export a PDF and verify all sections render correctly across Chrome, Firefox, Safari, Edge

**Checkpoint**: PDF export shipped, ready for engineering deliverables.

---

## Phase 6: User Story 5 — NEC/IEC Standards Switcher + Reference Guide (Priority: P3)

**Goal**: Toggle between NEC and IEC modes; field labels, units, design classes, and citations follow.

**Independent Test**: Default-load the calculator (NEC mode), switch to IEC, verify HP→kW, AWG→mm², NEMA classes A–D → IEC N/H, citations swap to IEC 60034-12 / IEC 60364-5-52, and numerical results re-render within 200 ms with consistent values across the toggle (round-trip ±1%).

### Tests

- [X] T051 [P] [US5] Write integration test in `__tests__/integration/motor-starting/standardSwitcher.test.ts` — render in NEC mode, capture comparison-table values, switch to IEC, assert design-class options changed to N/H, units changed to kW/mm², values re-rendered within ±1%

### Implementation

- [X] T052 [P] [US5] Add standard-aware label/unit logic to `MotorInputForm.tsx`, `LoadInputForm.tsx`, `SourceImpedanceForm.tsx`, `MethodConfigForm.tsx` — read `currentInput.standard` from the store; toggle field labels (HP/kW, lb-ft²/kg-m², AWG/mm²), placeholder values, and shown design classes accordingly. Depends on T032, T033, T034, T043
- [X] T053 [P] [US5] Implement standard-aware citation lines in `SingleMethodResults.tsx` and `ComparisonTable.tsx` — show NEC citations in NEC mode (NEC 430.7(B), NEC 430.52, NEC Ch. 9 Table 9), IEC citations in IEC mode (IEC 60034-12 Tables 6–8, IEC 60364-5-52). Depends on T035, T036
- [X] T054 [P] [US5] Implement Reference Guide dialog in `components/motor-starting/ReferenceGuideDialog.tsx` — shadcn/ui Dialog with three tabs: Motor design classes (NEMA A–D vs IEC N/H side-by-side), Code letters / starting kVA per HP (NEC table A–V vs IEC ranges), Voltage-dip limits (IEEE 1668 thresholds). Triggered by a Help icon in the top bar. Bind open/close to `store.referenceGuideOpen`
- [X] T055 [US5] Add the Standards toggle to `MotorStartingTool.tsx` top bar — segmented control NEC | IEC bound to `currentInput.standard`; switching it triggers a full input-shape conversion (HP↔kW, lb-ft²↔kg-m², AWG↔mm²) via the helpers in `unitConversions.ts`, then re-runs analyze. Verify < 200 ms transition. Depends on T031, T052, T053, T054
- [X] T056 [US5] Run T051; manual verification per quickstart step 9

**Checkpoint**: Dual-standard parity achieved; calculator matches the standards-switcher pattern from Conduit Fill v2 and Voltage Drop.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T057 [P] Register the new route in `components/layout/TopNavigation.tsx` under the **Analysis Tools** category — match the existing pattern (label "Motor Starting", path `/motor-starting`)
- [X] T058 [P] Register the same route in `components/layout/Sidebar.tsx` under **Analysis Tools** to mirror the top navigation
- [X] T059 [P] Update `MEMORY.md` to add Motor Starting Analysis as calculator #22 with a one-line summary (5 methods, dual standards, IEEE 3002.7 + IEEE 1668 + NEC 430 + IEC 60034-12, source-impedance chain, PDF export)
- [X] T060 [P] Add accessibility pass on the form panels — keyboard navigation through all fields, ARIA labels on the verdict badges, aria-live region announcing "Recommended method: …" after analysis completes (WCAG 2.1 Level AA per constitution)
- [X] T061 [P] Add error-boundary wrapper in `app/motor-starting/MotorStartingTool.tsx` around the results panel so a numeric edge case in calculation doesn't blank the whole tool — show a "Recoverable error in results" card with retry button
- [X] T062 Run the full unit + integration suite (`npm run test`) and confirm zero failures; verify coverage on `lib/calculations/motor-starting/` ≥ 90% statements per spec SC-007
- [X] T063 Manual end-to-end pass through the quickstart.md walkthrough (steps 1–9) on a real dev server (`npm run dev`); capture any UX paper-cuts as follow-up issues rather than expanding scope here
- [X] T064 Update `specs/010-motor-starting/checklists/requirements.md` notes section to record final test counts, coverage %, and any deviations from the plan (e.g., method-multiplier defaults that ended up overridden during validation)

---

## Dependency Graph

```
Phase 1 (Setup, T001–T003)
    ↓
Phase 2 (Foundational, T004–T028)        ← BLOCKS all stories
    ↓
    ├─→ Phase 3 (US1+US2, T029–T041) — MVP — SHIPPABLE
    │       ↓
    ├─→ Phase 4 (US3, T042–T046) — depends on Phase 3 UI
    │       ↓
    ├─→ Phase 5 (US4, T047–T050) — depends on Phase 3 UI
    │       ↓
    └─→ Phase 6 (US5, T051–T056) — depends on Phase 3 UI; mostly independent of US3/US4
            ↓
        Phase 7 (Polish, T057–T064)
```

US3, US4, and US5 can be developed in parallel after Phase 3 ships; they touch different files and have no implementation dependencies on each other.

## Parallel Execution Examples

**Within Phase 2 (after T001 done)**:
```
[P] T004 motorStartingData.test.ts
[P] T005 sourceImpedance.test.ts
[P] T006 voltageDip.test.ts
[P] T007 accelerationTime.test.ts
[P] T008–T012 method tests (DOL, Star-Delta, Autotrans, Soft Starter, VFD)
[P] T013 comparison.test.ts
```
…then T014 (verify RED) sequentially, then [P] implementation tasks T015–T024 in parallel, then T025–T028 sequentially.

**Within Phase 3 (after Phase 2 GREEN)**:
```
[P] T031 useMotorStartingStore.ts
[P] T032 MotorInputForm.tsx
[P] T033 LoadInputForm.tsx
[P] T034 MethodConfigForm.tsx
```
…then T035–T041 sequentially (each depends on the store and the prior UI pieces).

**Phase 4 / 5 / 6 in parallel** once Phase 3 is shippable — three engineers (or three agent runs) can each take one user story.

## Implementation Strategy

1. **Land Phase 2 first** — calculation core with full test coverage. This is the highest-risk part (numeric accuracy) and the foundation everything else rests on.
2. **Ship MVP after Phase 3** — US1 + US2 together is the smallest deliverable that proves engineering value (single-method + comparison). Open a draft PR at this point for early review.
3. **Layer US3 (source chain) next** — converts the calculator from "useful for ballparking" to "defensible for design submission".
4. **Add US4 (PDF) and US5 (IEC parity) in either order** — both are pattern matches for prior calculators; can be done concurrently.
5. **Polish phase last** — navigation wiring, accessibility, MEMORY.md update; merge to main.

Total estimated effort matches Generator Sizing (similar complexity, slightly more methods to test): **64 tasks**, MVP in ~30 tasks (Phases 1–3).

## Task Count Summary

| Phase | Tasks | Stories |
|-------|-------|---------|
| 1. Setup | 3 (T001–T003) | – |
| 2. Foundational | 25 (T004–T028) | – |
| 3. US1 + US2 (MVP) | 13 (T029–T041) | US1, US2 |
| 4. US3 | 5 (T042–T046) | US3 |
| 5. US4 | 4 (T047–T050) | US4 |
| 6. US5 | 6 (T051–T056) | US5 |
| 7. Polish | 8 (T057–T064) | – |
| **Total** | **64** | |

Format check: every task above starts with `- [ ]`, has a `T###` ID, includes a story label where applicable (US1–US5), and names the exact file path it touches.
