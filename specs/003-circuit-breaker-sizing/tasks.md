# Tasks: Circuit Breaker Sizing Calculator

**Input**: Design documents from `/specs/003-circuit-breaker-sizing/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (available)

**Tests**: This project uses Test-Driven Development (TDD) per Constitution Principle V. Tests are MANDATORY for all P1 calculations (breaker sizing core logic) and must be written BEFORE implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each story is independently testable and deployable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5, US6, US7)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `app/breaker/` for Next.js routes, `lib/calculations/breaker/` for business logic, `components/breaker/` for UI, `stores/` for Zustand state
- All paths relative to repository root: `D:\prompteng\elec_calc\`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for breaker calculator feature

- [X] T001 Create feature directory structure: `app/breaker/`, `lib/calculations/breaker/`, `components/breaker/`, `__tests__/unit/calculations/breaker/`
- [X] T002 [P] Verify Math.js is already installed (should exist from previous features) in package.json
- [X] T003 [P] Verify Zustand with persist middleware is already installed in package.json
- [X] T004 [P] Verify jsPDF is already installed in package.json
- [X] T005 [P] Verify Zod is already installed in package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Electrical Constants & Standards Tables

- [X] T006 [P] Create `lib/standards/breakerRatings.ts` with NEC standard breaker ratings array: [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000] per FR-009
- [X] T007 [P] Add IEC standard breaker ratings to `lib/standards/breakerRatings.ts`: [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000] per FR-010
- [X] T008 [P] Create `lib/standards/deratingTables.ts` with NEC Table 310.15(B)(2)(a) temperature derating factors (10°C to 60°C) and NEC Table 310.15(C)(1) grouping factors (1-9+ cables) per research.md
- [X] T009 [P] Add IEC 60364-5-52 Table B.52.15 temperature derating factors to `lib/standards/deratingTables.ts` per research.md
- [X] T010 [P] Add IEC 60364-5-52 Table B.52.17 grouping derating factors to `lib/standards/deratingTables.ts`
- [X] T011 [P] Create `lib/standards/tripCurves.ts` with IEC trip curve definitions (Type B/C/D/K/Z) with trip ranges and application guidance per research.md Section 6

### Data Model & Validation Schemas

- [X] T012 [P] Create `types/breaker-calculator.ts` with TypeScript interfaces from data-model.md: CircuitConfiguration, EnvironmentalConditions, BreakerSpecification, CalculationResults, LoadAnalysis, BreakerSizingResult, DeratingFactorsResult, VoltageDropAnalysis, ShortCircuitAnalysis, Recommendations, CalculationAlert
- [X] T013 [P] Add validation schemas to `lib/validation/breakerValidation.ts` with Zod: voltageSchema (100-1000V), loadValueSchema (>0, max 10000), powerFactorSchema (0.5-1.0), temperatureSchema (-40°C to +70°C), groupedCablesSchema (1-100), circuitConfigSchema, calculationInputSchema per data-model.md

### Shared Breaker Components

- [X] T014 [P] Create `components/breaker/BreakerInputForm.tsx` reusable component for circuit configuration inputs (voltage, phase, load, power factor) with real-time validation using `useValidation` hook
- [X] T015 [P] Create `components/breaker/BreakerResults.tsx` display component for calculation results with sections: Load Analysis, Breaker Sizing, Warnings, Recommendations
- [X] T016 [P] Create `components/breaker/DeratingSidebar.tsx` optional sidebar component for environmental factors (temperature, grouping, installation method) with collapsible sections

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Circuit Breaker Sizing (Priority: P1) 🎯 MVP

**Goal**: Engineers can quickly determine correct circuit breaker size for continuous load with NEC and IEC standards support

**Independent Test**: Input 10 kW continuous load at 240V single-phase with 0.9 power factor using NEC standard → System displays calculated current (46.3A), minimum breaker size (57.9A with 125% factor), and recommends standard 60A breaker

### Tests for User Story 1 (TDD - Red Phase) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T017 [P] [US1] Write NEC continuous load test in `__tests__/unit/calculations/breaker/loadCurrent.test.ts` validating single-phase formula I = P / (V × PF) with test case: 10kW @ 240V, PF=0.9 → 46.3A ±0.5A per SC-002
- [X] T018 [P] [US1] Write three-phase load test in `__tests__/unit/calculations/breaker/loadCurrent.test.ts` validating formula I = P / (√3 × V × PF) with test case: 50kW @ 400V 3-phase, PF=0.9 → 80.3A ±0.5A
- [X] T019 [P] [US1] Write NEC 125% safety factor test in `__tests__/unit/calculations/breaker/safetyFactors.test.ts` validating 46.3A × 1.25 = 57.9A per NEC 210.20(A)
- [X] T020 [P] [US1] Write standard breaker rating lookup test in `__tests__/unit/calculations/breaker/standardRatings.test.ts` validating 57.9A → 60A (NEC), 52.1A → 63A (IEC) rounding logic per FR-011
- [X] T021 [P] [US1] Write input validation test in `__tests__/unit/validation/breakerValidation.test.ts` for FR-036 edge cases: negative power, voltage outside 100-1000V, invalid power factor

### Implementation for User Story 1 (TDD - Green Phase)

- [X] T022 [P] [US1] Implement `calculateLoadCurrent` in `lib/calculations/breaker/loadCurrent.ts` using Math.js BigNumber with single-phase formula I = P / (V × PF) and three-phase formula I = P / (√3 × V × PF) per FR-005
- [X] T023 [P] [US1] Implement `applySafetyFactor` in `lib/calculations/breaker/safetyFactors.ts` applying 125% factor for NEC continuous loads per NEC 210.20(A) and FR-007, return 1.0 for IEC per FR-008
- [X] T024 [P] [US1] Implement `recommendStandardBreaker` in `lib/calculations/breaker/standardRatings.ts` with binary search lookup finding smallest standard rating ≥ calculated minimum from breakerRatings.ts per FR-011, FR-012
- [X] T025 [US1] Create `useBreakerStore` Zustand store in `stores/useBreakerStore.ts` with persist middleware managing state: standard ('NEC'|'IEC'), voltage, phase, loadMode, loadValue, powerFactor, results, localStorage key "electromate-breaker" per FR-037
- [X] T026 [US1] Create main calculation orchestrator `calculateBreakerSizing` in `lib/calculations/breaker/breakerCalculator.ts` integrating loadCurrent, safetyFactors, standardRatings modules with error handling and logging per FR-036a
- [X] T027 [US1] Implement input validation in `lib/validation/breakerValidation.ts` using Zod schemas from T013 with structured error messages and console logging per FR-036, FR-036a
- [X] T028 [US1] Create `app/breaker/page.tsx` Server Component with metadata title "Circuit Breaker Sizing Calculator - ElectroMate" and BreakerSizingTool import
- [X] T029 [US1] Create `app/breaker/BreakerSizingTool.tsx` Client Component integrating BreakerInputForm, standard toggle (NEC/IEC), unit system toggle (Metric/Imperial), calculate button, BreakerResults display per FR-033, FR-034, FR-038
- [X] T030 [US1] Integrate useBreakerStore with BreakerSizingTool component using Zustand selectors for real-time updates with 300ms debounce per Constitution Principle II (real-time validation <100ms after debounce)
- [X] T031 [US1] Add standard switch handler in BreakerSizingTool that clears results and recalculates with new standard's formulas within 500ms per SC-006
- [X] T032 [US1] Implement structured console logging in breakerCalculator.ts using logger utility: ERROR level for validation failures, INFO for standard switches, DEBUG for calculation steps per FR-036a, NFR-001 through NFR-004
- [X] T033 [US1] Add navigation link to breaker calculator in `components/layout/Sidebar.tsx` with breaker icon
- [X] T034 [US1] Add code section references display in BreakerResults component showing "Per NEC 210.20(A)" or "Per IEC 60364-5-52" per FR-023, FR-040

### TDD Validation (Refactor Phase)

- [X] T035 [US1] Run all User Story 1 tests and verify 100% pass rate (load current ±0.5A, safety factor application, standard rating lookup)
- [X] T036 [US1] Profile calculation latency and confirm <200ms from input to result display per plan.md Performance Goals
- [X] T037 [US1] Test standard switch (NEC ↔ IEC) and verify recalculation completes within 500ms per SC-006

**Checkpoint**: At this point, User Story 1 (Basic Breaker Sizing) should be fully functional, tested, and independently deployable as MVP

---

## Phase 4: User Story 2 - Voltage Drop Analysis (Priority: P2)

**Goal**: Engineers can verify selected breaker and cable combination won't result in excessive voltage drop with NEC/IEC compliance warnings

**Independent Test**: Input 30A load at 240V with 150 feet distance using copper conductor → System calculates voltage drop percentage, warns if exceeds 3% (NEC branch circuit limit), recommends larger cable sizes

### Tests for User Story 2 (TDD - Red Phase) ⚠️

- [X] T038 [P] [US2] Write voltage drop calculation test in `__tests__/unit/calculations/breaker/voltageDrop.test.ts` validating formula VD% = (I × R × L) / (V × 10) with test case from research.md: 30A @ 240V, 150ft, #6 AWG → 0.7425% per IEEE 835
- [X] T039 [P] [US2] Write voltage drop warning threshold test validating 1-3% INFO, 3-5% YELLOW, >5% RED warnings per FR-015, FR-016, research.md Section 7
- [X] T040 [P] [US2] Write cable size recommendation test validating algorithm suggests next larger cable when VD exceeds limit per FR-017

### Implementation for User Story 2 (TDD - Green Phase)

- [X] T041 [P] [US2] Extend `lib/standards/cableTables.ts` (if exists from cable sizing feature) or create with conductor resistance values (Ω/1000ft and Ω/km) for standard wire sizes from NEC Chapter 9 Table 8 and IEC 60228
- [X] T042 [P] [US2] Implement `calculateVoltageDrop` in `lib/calculations/breaker/voltageDrop.ts` using Math.js BigNumber with formula VD% = (I × R × L) / (V × 10) for single-phase, adjust for three-phase per research.md Section 7
- [X] T043 [P] [US2] Implement `assessVoltageDropCompliance` in `lib/calculations/breaker/voltageDrop.ts` returning status ('acceptable'|'warning'|'exceed-limit') based on 3% and 5% thresholds per FR-015, FR-016
- [X] T044 [US2] Implement `recommendCableSizeForVD` in `lib/calculations/breaker/voltageDrop.ts` finding next larger cable size that reduces VD below acceptable limit per FR-017
- [X] T045 [US2] Extend useBreakerStore to add optional fields: circuitDistance, conductorMaterial ('copper'|'aluminum'), conductorSize { value, unit: 'AWG'|'mm²' }
- [X] T046 [US2] Add voltage drop input section to BreakerInputForm component with distance input (feet/meters toggle), conductor material select, conductor size select from cableTables.ts
- [X] T047 [US2] Add VoltageDropAnalysis section to BreakerResults component displaying VD percentage with color-coded status (green <1%, yellow 1-3%, red >3%), cable size recommendation if applicable per FR-038
- [X] T048 [US2] Integrate voltage drop calculation into breakerCalculator.ts main orchestrator, only perform if circuitDistance is provided (optional analysis) per FR-013
- [X] T049 [US2] Add unit conversion helper in unitConversion.ts for feet ↔ meters with Math.js precision per FR-014
- [X] T050 [US2] Run User Story 2 tests and verify voltage drop accuracy ±0.1% per SC-003

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (breaker sizing with optional voltage drop analysis)

---

## Phase 5: User Story 3 - Advanced Derating and Environmental Factors (Priority: P2)

**Goal**: Engineers can account for ambient temperature and cable grouping effects with NEC/IEC derating factor tables

**Independent Test**: Input 50A load with 45°C ambient temperature and 6 cables grouped in conduit → System applies Ca=0.76 (temp) and Cg=0.60 (grouping) per IEC 60364-5-52, displays adjusted minimum breaker requirement with derating breakdown

### Tests for User Story 3 (TDD - Red Phase) ⚠️

- [ ] T051 [P] [US3] Write temperature derating test in `__tests__/unit/calculations/breaker/deratingFactors.test.ts` validating NEC Table 310.15(B)(2)(a) lookups: 40°C → 0.80, 50°C → 0.71 (copper)
- [ ] T052 [P] [US3] Write grouping derating test validating NEC Table 310.15(C)(1) lookups: 3 cables → 0.70, 6 cables → 0.60, 9+ cables → 0.50
- [ ] T053 [P] [US3] Write IEC derating test validating IEC 60364-5-52 Table B.52.15 (temperature Ca) and Table B.52.17 (grouping Cg) per research.md Section 2
- [ ] T054 [P] [US3] Write combined derating test validating cascade effect: 50A load with Ca=0.76, Cg=0.60 → adjusted breaker size = 50A / (0.76 × 0.60) = 109.6A → 110A per research.md combined example

### Implementation for User Story 3 (TDD - Green Phase)

- [ ] T055 [P] [US3] Implement `getTemperatureDeratingFactor` in `lib/calculations/breaker/deratingFactors.ts` with table lookup from deratingTables.ts, interpolation for intermediate temperatures, separate NEC and IEC logic per FR-019
- [ ] T056 [P] [US3] Implement `getGroupingDeratingFactor` in `lib/calculations/breaker/deratingFactors.ts` with table lookup from deratingTables.ts per FR-021
- [ ] T057 [P] [US3] Implement `getInstallationMethodFactor` (IEC only) in `lib/calculations/breaker/deratingFactors.ts` for Methods A1, A2, B1, B2, C, D, E, F, G per FR-022
- [ ] T058 [US3] Implement `applyDeratingFactors` orchestrator in `lib/calculations/breaker/deratingFactors.ts` calculating combined factor (Ca × Cg × Cc), adjusted breaker size = load / combined, return DeratingFactorsResult with breakdown per FR-023, FR-024
- [ ] T059 [US3] Extend useBreakerStore to add derating fields: ambientTemperature, groupedCables, installationMethod (IEC)
- [ ] T060 [US3] Update DeratingSidebar component (created in T016) to include input fields: ambient temperature slider (-40°C to +70°C), grouped cables number input (1-20+), installation method dropdown (IEC only, show/hide based on standard)
- [ ] T061 [US3] Add DeratingFactorsResult section to BreakerResults component displaying each factor with code reference (e.g., "Ca = 0.76 per NEC Table 310.15(B)(2)(a)"), combined factor, adjusted breaker size per FR-023
- [ ] T062 [US3] Integrate derating factors into breakerCalculator.ts main orchestrator, apply after base safety factor, recalculate standard breaker recommendation with adjusted size
- [ ] T063 [US3] Add extreme temperature warning (>60°C or <-20°C) in assessVoltageDropCompliance recommending special equipment per edge case handling
- [ ] T064 [US3] Run User Story 3 tests and verify derating factor compliance 100% per SC-004

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently (breaker sizing + voltage drop + derating)

---

## Phase 6: User Story 4 - Short Circuit Protection Specification (Priority: P2)

**Goal**: Engineers can specify short circuit breaking capacity (kA rating) and filter breaker recommendations to adequate models

**Independent Test**: Input 50A breaker requirement with 25 kA fault current → System only recommends breakers with breaking capacity ≥25 kA, displays kA ratings, warns if calculated breaker size has insufficient kA models

### Implementation for User Story 4

- [ ] T065 [P] [US4] Write short circuit capacity test in `__tests__/unit/calculations/breaker/shortCircuit.test.ts` validating filtering logic: 50A breaker, 25 kA fault → only breakers with breakingCapacityKA ≥ 25 kA
- [ ] T066 [P] [US4] Implement `assessShortCircuitCapacity` in `lib/calculations/breaker/shortCircuit.ts` comparing user-specified fault current (kA) against breaker breaking capacity, return isSuitableCapacity boolean per FR-026
- [ ] T067 [US4] Extend BreakerSpecification interface in types/breaker-calculator.ts to include breakingCapacityKA field with standard values [10, 14, 25, 35, 50, 65, 100] per research.md Section 5
- [ ] T068 [US4] Extend recommendStandardBreaker function in standardRatings.ts to filter by breaking capacity if shortCircuitCurrentKA is specified per FR-026, FR-027
- [ ] T069 [US4] Extend useBreakerStore to add optional shortCircuitCurrentKA field
- [ ] T070 [US4] Add short circuit current input to BreakerInputForm component (optional field, kA units) with tooltip explaining breaking capacity concept
- [ ] T071 [US4] Add ShortCircuitAnalysis section to BreakerResults component displaying fault current, breaker breaking capacity, suitability assessment per FR-027, FR-028
- [ ] T072 [US4] Add warning banner in BreakerResults if short circuit current NOT specified: "⚠️ Breaking capacity not verified. Consult site-specific fault current calculations." per FR-028
- [ ] T073 [US4] Run User Story 4 tests and verify breaking capacity filtering works correctly

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - Breaker Type and Trip Curve Recommendations (Priority: P3)

**Goal**: Engineers receive guidance on breaker type (IEC trip curves B/C/D or NEC thermal-magnetic/electronic) based on load characteristics

**Independent Test**: Specify motor load application → System recommends Type D curve (IEC) or adjustable magnetic trip (NEC) explaining 10-20× inrush tolerance per research.md Section 6

### Implementation for User Story 5

- [ ] T074 [P] [US5] Implement `recommendBreakerType` in `lib/calculations/breaker/recommendations.ts` with logic: resistive loads → Type B (IEC) / thermal-magnetic (NEC), mixed loads → Type C / standard thermal-magnetic, motor/transformer → Type D / adjustable magnetic per FR-029, FR-030, FR-032
- [ ] T075 [US5] Extend useBreakerStore to add loadType field: 'resistive' | 'inductive' | 'mixed' | 'capacitive'
- [ ] T076 [US5] Add load type selector to BreakerInputForm component with radio buttons and icons (resistive: heater, inductive: motor, mixed: building, capacitive: capacitor bank)
- [ ] T077 [US5] Add BreakerTypeGuidance section to BreakerResults component displaying recommended trip curve/type, rationale text, inrush capability (e.g., "5-10× rated current") per FR-031
- [ ] T078 [US5] Integrate recommendBreakerType into breakerCalculator.ts Recommendations section
- [ ] T079 [US5] Add breaker type explanatory tooltips with trip curve diagrams (optional enhancement)

**Checkpoint**: At this point, User Stories 1-5 should all work independently

---

## Phase 8: User Story 6 - Calculation History and Review (Priority: P3)

**Goal**: Engineers can review previous breaker sizing calculations from past sessions with localStorage FIFO management (50-calculation limit)

**Independent Test**: Complete 3 calculations with different parameters over multiple browser sessions → History view displays all 3 with timestamps, key parameters (voltage, load, standard), breaker recommendations in chronological order

### Implementation for User Story 6

- [ ] T080 [P] [US6] Implement `saveCalculationToHistory` in `hooks/useHistoryStorage.ts` with FIFO eviction algorithm: retrieve history array from localStorage key "electromate-breaker-history", check if length ≥ 50, remove oldest (shift), push new entry with UUID and ISO8601 timestamp per FR-037a, FR-037c, research.md Section 8
- [ ] T081 [P] [US6] Implement `loadCalculationHistory` in hooks/useHistoryStorage.ts sorting by timestamp descending (newest first) per FR-037b
- [ ] T082 [P] [US6] Implement `deleteCalculation` in hooks/useHistoryStorage.ts filtering by ID
- [ ] T083 [P] [US6] Implement error handling in hooks/useHistoryStorage.ts for QuotaExceededError (localStorage full) clearing 10 oldest entries and retrying per research.md Section 8
- [ ] T084 [US6] Extend useBreakerStore to add history actions: saveToHistory(), getHistory(), loadFromHistory(id), deleteFromHistory(id)
- [ ] T085 [US6] Create `components/breaker/HistorySidebar.tsx` displaying calculation history list with cards showing: timestamp, voltage, phase, load, standard, recommended breaker, "Load" and "Delete" buttons
- [ ] T086 [US6] Add history toggle button to BreakerSizingTool toolbar opening/closing HistorySidebar
- [ ] T087 [US6] Implement "Load" action in HistorySidebar populating all inputs from historical calculation entry per FR-037b
- [ ] T088 [US6] Add calculation auto-save on successful calculation completion calling saveToHistory()
- [ ] T089 [US6] Add localStorage quota warning banner using StorageWarningBanner component (from foundation) if save fails

**Checkpoint**: At this point, User Stories 1-6 should all work independently (calculation history persistent across sessions)

---

## Phase 9: User Story 7 - PDF Technical Specification Report (Priority: P3)

**Goal**: Engineers can generate professional PDF report containing all inputs, calculations, breaker recommendations, and code references suitable for client review and regulatory approval

**Independent Test**: Complete breaker sizing with voltage drop and derating factors → Export PDF → Verify PDF contains: project header, input parameters table, load current calculation with formula, safety/correction factors, recommended breaker, voltage drop analysis, derating breakdown, code section references (e.g., "Per NEC 210.20(A)"), timestamp, disclaimer per FR-039 through FR-043

### Implementation for User Story 7

- [ ] T090 [P] [US7] Extend existing `lib/pdfGenerator.ts` (from foundation) or create breaker-specific function `generateBreakerPDF` with sections: Project Information, Circuit Configuration, Load Analysis (formula + result), Breaker Sizing (safety factor + standard rating), Voltage Drop (if applicable), Derating Factors (if applicable), Recommendations, Code References, Disclaimer per FR-039, FR-040, FR-041, FR-042
- [ ] T091 [P] [US7] Add optional project information fields to useBreakerStore: projectName, projectLocation, engineerName, notes
- [ ] T092 [US7] Create `components/breaker/ProjectInfoModal.tsx` dialog for optional project metadata entry before PDF export
- [ ] T093 [US7] Integrate jsPDF formatting for breaker calculator with tables (inputs, results), formulas with Math rendering, code section references in footer/annotations per FR-040, FR-043
- [ ] T094 [US7] Add "Export PDF" button to BreakerResults component opening ProjectInfoModal (optional) then calling generateBreakerPDF with current calculation results and project info
- [ ] T095 [US7] Add professional header to PDF with "Circuit Breaker Sizing Calculation" title, selected standard version (e.g., "Per NEC 2020"), calculation date/time per FR-041
- [ ] T096 [US7] Add disclaimer footer to PDF: "This calculation is provided for assistance and educational purposes. Final designs must be reviewed and stamped by licensed Professional Engineers where required by law. Consult applicable codes (NEC, IEC, local amendments) and equipment specifications." per plan.md Professional Documentation
- [ ] T097 [US7] Test PDF generation across Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ and verify formatting consistency
- [ ] T098 [US7] Implement PDF export from history: "Re-export" button in HistorySidebar generating PDF with original calculation date notation per FR-037b

**Checkpoint**: All 7 user stories should now be independently functional (breaker sizing + voltage drop + derating + short circuit + type recommendations + history + PDF export)

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T099 [P] Add loading spinner to calculate button while calculation in progress (especially with derating and voltage drop)
- [ ] T100 [P] Optimize standard rating binary search in standardRatings.ts for <50ms lookup time
- [ ] T101 [P] Add keyboard shortcuts: Enter to calculate, Ctrl+E to export PDF, Ctrl+H to toggle history
- [ ] T102 [P] Add example calculation presets dropdown in BreakerInputForm toolbar: "Residential 15A circuit", "Commercial 100A feeder", "Industrial 400A motor", "High-rise riser 600A" loading realistic parameters
- [ ] T103 [P] Add "Clear All" button in BreakerSizingTool toolbar resetting all inputs to defaults
- [ ] T104 [P] Implement responsive design for BreakerSizingTool optimizing for tablet devices (mobile support Phase 4+)
- [ ] T105 [P] Add integration test in `__tests__/integration/breakerCalculator.test.ts` testing full workflow: input → validation → calculation → results → PDF → history
- [ ] T106 Add E2E test in `__tests__/e2e/breakerCalculator.spec.ts` using Playwright for complete user journey including standard toggle, derating sidebar, history sidebar, PDF download
- [ ] T107 Test localStorage persistence: refresh browser mid-calculation and verify inputs persist per FR-037

---

## Phase 11: Constitution Compliance Verification

**Purpose**: Validate implementation against constitutional principles (`.specify/memory/constitution.md`)

### Calculation Accuracy Validation

- [ ] T108 [P] Verify load current calculation against manual IEEE reference: 10kW @ 240V single-phase, PF=0.9 → 46.3A within ±0.5A per SC-002
- [ ] T109 [P] Verify NEC 125% safety factor application: 46.3A × 1.25 = 57.9A exactly per NEC 210.20(A)
- [ ] T110 [P] Verify standard breaker rating lookup: 57.9A → 60A (NEC), 52.1A → 63A (IEC) per FR-011
- [ ] T111 [P] Verify voltage drop calculation against IEEE 835 reference: 30A @ 240V, 150ft, #6 AWG → 0.7425% within ±0.1% per SC-003
- [ ] T112 [P] Verify derating factors match NEC/IEC tables exactly: NEC 40°C → 0.80, IEC 45°C → 0.76, NEC 6 cables → 0.60 (100% compliance per SC-004)
- [ ] T113 Document standard versions in code comments: NEC 2020, IEC 60364-5-52:2015

### Safety Validation

- [ ] T114 [P] Test voltage drop >3% red highlighting and verify warning displays "Exceeds NEC 210.19(A) 3% branch circuit limit" per Constitution Principle II
- [ ] T115 [P] Test voltage drop >5% critical warning with urgent cable size recommendation
- [ ] T116 [P] Test negative power input validation error displays clear message with acceptable range
- [ ] T117 [P] Test voltage outside 100-1000V validation error suggests standard voltages
- [ ] T118 [P] Test extreme temperature warning (>60°C or <-20°C) recommends special equipment
- [ ] T119 Profile validation performance and confirm <100ms response time after 300ms debounce per Constitution Principle II

### Standards Compliance

- [ ] T120 [P] Verify all calculation results display applicable code section: "Per NEC 210.20(A)" or "Per IEC 60364-5-52" per FR-023
- [ ] T121 [P] Verify derating factors display source table: "NEC Table 310.15(B)(2)(a)" or "IEC 60364-5-52 Table B.52.15"
- [ ] T122 Test PDF report includes complete code references section with standard version (e.g., "NEC 2020") and section numbers per FR-040
- [ ] T123 Verify PDF disclaimer text included per plan.md Professional Documentation

### Test Coverage Verification

- [ ] T124 Review test coverage for P1 breaker sizing (load current, safety factors, standard ratings) and verify TDD workflow followed (Red-Green-Refactor with git commit messages documenting phases)
- [ ] T125 Verify test coverage includes all 50+ test case scenarios from research.md: nominal (standard voltages), boundary (rating gaps), edge (unusual voltages 380V/415V), error (negative values) per Constitution Principle V
- [ ] T126 Document any test coverage gaps with justification

### Professional Documentation

- [ ] T127 [P] Test PDF export across Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ and verify 95% success rate per SC-005
- [ ] T128 [P] Verify PDF includes all required elements: inputs table, formulas with variables, calculation results, derating breakdown, code references, timestamp, disclaimer per FR-039 through FR-043
- [ ] T129 Test "Show Calculation Details" mode (if implemented) displays formula derivations
- [ ] T130 Verify PDF suitable for professional submission (clear formatting, no rendering artifacts, professional typography)

### Progressive Enhancement Verification

- [ ] T131 Test Basic Breaker Sizing (US1) works independently without voltage drop, derating, history, or PDF
- [ ] T132 Test Voltage Drop Analysis (US2) is optional: calculation completes without circuitDistance input
- [ ] T133 Test Derating Factors (US3) is optional: calculation completes without temperature/grouping inputs
- [ ] T134 Test Short Circuit filtering (US4) is optional: calculation completes without fault current input
- [ ] T135 Validate no dependencies on incomplete higher-priority features (each story independently deployable)

### Security & Code Quality

- [ ] T136 [P] Run grep for hardcoded secrets and verify none exist (all electrical constants in lib/standards/)
- [ ] T137 [P] Verify all numerical inputs validated with Zod schemas: voltage (100-1000V), load (>0), power factor (0.5-1.0), temperature (-40 to +70°C)
- [ ] T138 Test localStorage security: verify no sensitive data (PII, project names) logged to console per NFR-003
- [ ] T139 Verify input validation prevents code injection attacks (though calculation-only, no server-side execution)

### Dual Standards Support

- [ ] T140 [P] Test NEC ↔ IEC standard toggle: verify complete recalculation with new formulas (125% factor → correction factor), new standard ratings, new voltage suggestions within 500ms per SC-006
- [ ] T141 [P] Test voltage dropdown changes correctly when switching standards: NEC shows 120V/208V/240V/480V, IEC shows 230V/400V/690V per FR-034
- [ ] T142 Test unit conversion accuracy between metric (meters, mm²) and imperial (feet, AWG) preserves Math.js precision per Constitution Principle IV
- [ ] T143 Verify cable tables support both NEC Table 310.15(B)(16) and IEC 60364-5-52 standards per FR-007a (if voltage drop implemented)

**Checkpoint**: Constitution compliance verified - ready for code review and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User Stories can proceed in parallel (different routes, stores, components, calculation modules)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5 → US6 → US7)
- **Polish (Phase 10)**: Depends on desired user stories being complete
- **Constitution Compliance (Phase 11)**: Depends on all implemented features

### User Story Dependencies

- **User Story 1 (Basic Breaker Sizing - P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (Voltage Drop - P2)**: Can start after Foundational - Extends US1 optionally, independently testable
- **User Story 3 (Derating - P2)**: Can start after Foundational - Extends US1 optionally, independently testable
- **User Story 4 (Short Circuit - P2)**: Can start after Foundational - Extends US1 optionally, independently testable
- **User Story 5 (Type Recommendations - P3)**: Can start after Foundational - Extends US1 recommendations section, independently testable
- **User Story 6 (History - P3)**: Can start after Foundational - Operates on completed calculations, independently testable
- **User Story 7 (PDF Export - P3)**: Can start after Foundational - Renders any calculation results, independently testable

### Within Each User Story (TDD Workflow)

- **Tests MUST be written FIRST** and FAIL before implementation (Red phase)
- Calculation logic implemented to pass tests (Green phase)
- Refactoring for performance/clarity (Refactor phase)
- Story complete and tested independently before moving to next priority

### Parallel Opportunities

**Within Setup (Phase 1):**
- T002, T003, T004, T005 can run in parallel (different packages/verification tasks)

**Within Foundational (Phase 2):**
- T006, T007, T008, T009, T010, T011 (standards tables) can run in parallel
- T012, T013 (data models and validation) can run in parallel
- T014, T015, T016 (shared components) can run in parallel

**Within User Story 1 (Phase 3):**
- T017, T018, T019, T020, T021 (all tests) can run in parallel
- T022, T023, T024 (calculation modules) can run in parallel after tests fail

**Within User Story 2 (Phase 4):**
- T038, T039, T040 (tests) can run in parallel
- T041, T042, T043, T044 (calculation modules) can run in parallel

**Within User Story 3 (Phase 5):**
- T051, T052, T053, T054 (tests) can run in parallel
- T055, T056, T057 (derating modules) can run in parallel

**Across User Stories (After Foundational):**
- Phase 3 (US1), Phase 4 (US2), Phase 5 (US3), Phase 6 (US4) can run in parallel if multiple developers
- Phase 7 (US5), Phase 8 (US6), Phase 9 (US7) can run in parallel
- Different user stories use different modules, components, stores (minimal file conflicts)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (TDD Red Phase):
Task T017: "Write NEC continuous load test in __tests__/unit/calculations/breaker/loadCurrent.test.ts"
Task T018: "Write three-phase load test in __tests__/unit/calculations/breaker/loadCurrent.test.ts"
Task T019: "Write NEC 125% safety factor test in __tests__/unit/calculations/breaker/safetyFactors.test.ts"
Task T020: "Write standard breaker rating lookup test in __tests__/unit/calculations/breaker/standardRatings.test.ts"
Task T021: "Write input validation test in __tests__/unit/validation/breakerValidation.test.ts"

# Verify all tests FAIL (Red phase complete)

# Launch all calculation modules for User Story 1 together (TDD Green Phase):
Task T022: "Implement calculateLoadCurrent in lib/calculations/breaker/loadCurrent.ts"
Task T023: "Implement applySafetyFactor in lib/calculations/breaker/safetyFactors.ts"
Task T024: "Implement recommendStandardBreaker in lib/calculations/breaker/standardRatings.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (~5 tasks)
2. Complete Phase 2: Foundational (~11 tasks for breaker-specific infrastructure)
3. Complete Phase 3: User Story 1 (~21 tasks including TDD)
4. **STOP and VALIDATE**: Test Basic Breaker Sizing independently
   - Manual testing: Input 10kW @ 240V single-phase, PF=0.9 → Verify 46.3A load current, 57.9A minimum breaker, 60A recommended
   - Automated tests: Run `__tests__/unit/calculations/breaker/*.test.ts` and verify 100% pass
   - Standard toggle: Test NEC ↔ IEC switch recalculates within 500ms
   - localStorage: Refresh browser and verify calculation inputs persist
5. Deploy MVP if validation successful

**MVP Task Count**: ~37 tasks (Setup + Foundational + US1)

### Incremental Delivery (P1 + P2 Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Basic Breaker Sizing) → Test independently → Deploy (MVP!)
3. Add User Story 2 (Voltage Drop) → Test independently → Deploy
4. Add User Story 3 (Derating) → Test independently → Deploy
5. Add User Story 4 (Short Circuit) → Test independently → Deploy
6. **STOP and VALIDATE**: All P1+P2 core calculations functional
7. Proceed to P3 stories (Type Recommendations, History, PDF) or Polish

**P1+P2 Complete Task Count**: ~89 tasks (Setup + Foundational + US1 + US2 + US3 + US4)

### Full Feature (All 7 User Stories)

1. Complete P1+P2 stories (Basic Breaker Sizing, Voltage Drop, Derating, Short Circuit)
2. Add P3 stories (Type Recommendations, History, PDF Export)
3. Complete Polish phase (integration tests, E2E, UX improvements)
4. Complete Constitution Compliance verification
5. **FINAL VALIDATION**: All acceptance scenarios from spec.md
6. Deploy production

**Full Feature Task Count**: ~143 tasks

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (~16 tasks)
2. Once Foundational is done:
   - Developer A: User Story 1 (Basic Breaker Sizing) - T017-T037
   - Developer B: User Story 2 (Voltage Drop) - T038-T050
   - Developer C: User Story 3 (Derating) - T051-T064
3. Stories complete and integrate independently (different calculation modules, no file conflicts)
4. Team proceeds to US4, US5, US6, US7 in parallel
5. Team completes Polish + Compliance together

---

## Notes

- **[P] tasks** = different files, no dependencies (can run in parallel)
- **[Story] label** = maps task to specific user story for traceability (US1-US7)
- **Each user story** independently testable and deployable per Constitution Principle VII (Progressive Enhancement)
- **TDD mandatory** for P1 breaker sizing calculations per Constitution Principle V
- **Verify tests FAIL** before implementing (Red phase)
- **Commit after each task** or logical group for granular history
- **Stop at any checkpoint** to validate story independently before proceeding
- **Constitution Compliance phase** (Phase 11) validates all 7 constitutional principles before production deployment

**Avoid**:
- Vague tasks without file paths
- Tasks modifying same file creating parallel conflicts
- Cross-story dependencies that break independence
- Skipping tests for P1 calculations (violates Constitution)
- Hardcoding electrical constants instead of using lib/standards/ tables

---

## Test Case Coverage Summary

From research.md Section 10 (50+ test scenarios):

- **Category 1-2**: Basic NEC breaker sizing (single-phase and three-phase) - 12 test cases
- **Category 3**: IEC standard sizing - 4 test cases
- **Category 4**: Temperature derating (NEC) - 3 test cases
- **Category 5**: Grouping derating (NEC) - 3 test cases
- **Category 6**: Combined derating (NEC + IEC) - 2 test cases
- **Category 7**: Voltage drop analysis - 6 test cases
- **Category 8**: Short circuit capacity - 5 test cases
- **Category 9**: Breaker type recommendations - 6 test cases
- **Category 10**: Edge cases (unusual inputs) - 12 test cases

**Total**: 53 test scenarios covering nominal, boundary, edge, and error cases for NEC and IEC standards

These test cases should be implemented progressively across Phase 3-9 test tasks.

---

**Total Tasks**: 143 (Setup: 5, Foundational: 11, US1: 21, US2: 13, US3: 14, US4: 9, US5: 6, US6: 10, US7: 9, Polish: 9, Compliance: 36)

**MVP Tasks**: 37 (Setup + Foundational + US1)

**P1+P2 Complete**: 89 (Setup + Foundational + US1 + US2 + US3 + US4)

**Next Command**: Begin implementation with Phase 1 Setup tasks or run `/sp.implement` to start task execution
