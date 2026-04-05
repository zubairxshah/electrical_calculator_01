# Tasks: Conduit/Raceway Fill Calculator

**Input**: Design documents from `/specs/009-conduit-fill/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/calculator-api.md, quickstart.md

**Tests**: Included — constitution mandates TDD for critical calculation logic.

**Organization**: Tasks grouped by user story. US1 and US2 are combined (both P1, shared implementation).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Type definitions and project scaffolding

- [x] T001 Create TypeScript interfaces for all conduit fill entities in `types/conduit-fill.ts` — ConduitType, TradeSize, InsulationType, WireSize, ConductorEntry, ConduitFillInput, ConduitFillResult, ConductorDetail, ConduitFillHistoryEntry (per data-model.md)

---

## Phase 2: Foundational (NEC Data + Core Calculation)

**Purpose**: NEC Chapter 9 reference data and pure calculation logic — MUST complete before any UI work

**CRITICAL**: No user story UI work can begin until this phase is complete

### Tests (TDD — write first, verify they FAIL)

- [x] T002 [P] Write unit tests for NEC table data lookups in `__tests__/unit/calculations/conduit-fill/conduitFillData.test.ts` — test getConduitArea() for each conduit type/trade size combo (EMT 1/2" through 4", RMC, IMC, PVC40, PVC80, FMC, LFMC), getConductorArea() for common wire/insulation combos (#14-500 THHN, #12 XHHW, bare #6), getAvailableTradeSizes() returns correct sizes per type, getFillLimit() returns 53/31/40/60 correctly
- [x] T003 [P] Write unit tests for core fill calculator in `__tests__/unit/calculations/conduit-fill/conduitFillCalculator.test.ts` — test calculateConduitFill() with: single conductor (53% limit), two conductors (31% limit), 3+ conductors (40% limit), mixed sizes/types, boundary cases (exactly at limit), overfill case, empty conductor list error. Cross-reference results against NEC Annex C pre-calculated values for EMT with THHN conductors

### Implementation

- [x] T004 [P] Implement NEC Chapter 9 Table 4 conduit internal areas in `lib/calculations/conduit-fill/conduitFillData.ts` — all trade sizes for EMT, RMC, IMC, PVC Schedule 40, PVC Schedule 80, FMC, LFMC. Include getConduitArea(), getAvailableTradeSizes(), getFillLimit() functions. Export conduit type metadata (id, label) array
- [x] T005 [P] Implement NEC Chapter 9 Table 5 conductor areas in `lib/calculations/conduit-fill/conduitFillData.ts` — standard conductor cross-sectional areas for THHN/THWN-2, THWN, THW, XHHW, XHHW-2, RHH/RHW, RHW-2, USE-2 insulation types, sizes #18 AWG through 2000 kcmil. Implement NEC Table 8 bare conductor areas. Export getConductorArea() function. Export insulation type and wire size metadata arrays
- [x] T006 Implement core fill calculation in `lib/calculations/conduit-fill/conduitFillCalculator.ts` — calculateConduitFill(input) function: sum conductor areas (mathjs BigNumber), determine fill limit by conductor count, calculate fill percentage, pass/fail, remaining area, utilization ratio, per-conductor breakdown with NEC table references. Depends on T004, T005
- [x] T007 Run tests from T002 and T003 — verify all pass (GREEN). Fix any failures

**Checkpoint**: Core calculation engine complete and tested. All NEC table lookups verified.

---

## Phase 3: User Stories 1 & 2 — Single & Mixed Conduit Fill Check (Priority: P1) MVP

**Goal**: Working conduit fill calculator UI — user selects conduit type/size, adds conductors (single or mixed types/sizes), sees fill percentage and pass/fail result

**Independent Test**: Select EMT 3/4", add 3x #12 THHN, verify ~28% fill and PASS. Then add 4x #10 THWN to EMT 1/2", verify FAIL with overfill percentage. Mix conductor sizes and types, verify correct area summation.

- [x] T008 [P] [US1] Create Zod validation schema in `lib/validation/conduitFillValidation.ts` — validate conduitType (enum), tradeSize (string, must exist for type), conductors array (min 1 entry, each with valid wireSize, insulationType, quantity ≥ 1), isNipple (boolean), unitSystem enum. Export conduitFillInputSchema and validateConduitFillInput()
- [x] T009 [P] [US1] Create Zustand store in `stores/useConduitFillStore.ts` — state: ConduitFillInput fields + results + history. Actions: setConduitType (reset tradeSize if invalid), setTradeSize, addConductor (auto-lookup area), updateConductor, removeConductor, setUnitSystem, setResults, addToHistory (max 50), loadFromHistory, clearHistory, reset. Persist with localStorage key 'electromate-conduit-fill-history'
- [x] T010 [P] [US1] Create ConduitFillInputForm component in `components/conduit-fill/ConduitFillInputForm.tsx` — conduit type dropdown, trade size dropdown (filtered by selected type), conductor list with add/edit/remove rows (wire size, insulation type, quantity inputs using focus/blur pattern for numeric fields), unit system toggle (imperial/metric), project name/ref fields. Use shadcn/ui Select, Input, Button components
- [x] T011 [P] [US1] Create ConduitFillResults component in `components/conduit-fill/ConduitFillResults.tsx` — display conduit internal area, total conductor area, fill percentage, fill limit, pass/fail badge (green PASS / red FAIL / yellow warning >80%), visual fill bar (progress indicator), per-conductor breakdown table (wire size, insulation, qty, area each, area total, % of fill), NEC table references, remaining available area. Support imperial/metric display
- [x] T012 [P] [US1] Create ConduitFillHistorySidebar component in `components/conduit-fill/ConduitFillHistorySidebar.tsx` — list saved calculations with auto-generated labels (e.g., "EMT 3/4\" - 4 conductors"), click to load, delete individual entries, clear all button
- [x] T013 [US1] Create main tool component in `app/conduit-fill/ConduitFillTool.tsx` — 'use client', wire store to InputForm/Results/HistorySidebar, implement handleCalculate (validate → calculate → setResults → addToHistory), handle calculationError state, isCalculating state. Depends on T008-T012
- [x] T014 [US1] Create Next.js page in `app/conduit-fill/page.tsx` — export metadata (title: "Conduit Fill Calculator - NEC Chapter 9", description, keywords), default export wrapping ConduitFillTool in max-w-6xl container
- [x] T015 [US1] Add to navigation — add "Conduit Fill" entry to "Design & Installation" category in `components/layout/TopNavigation.tsx` (href: '/conduit-fill', description: 'NEC Chapter 9 conduit/raceway fill compliance') and `components/layout/Sidebar.tsx`
- [x] T016 [US1] Add calculator card to homepage in `app/page.tsx` — id: 'conduit-fill', title: 'Conduit Fill', href: '/conduit-fill', category: 'Design & Installation', isNew: true, tags: ['NEC', 'conduit', 'raceway', 'fill']

**Checkpoint**: Core conduit fill calculator fully functional. Users can select conduit, add mixed conductors, see fill results with pass/fail. MVP complete.

---

## Phase 4: User Story 3 — Conduit Size Recommendation (Priority: P2)

**Goal**: Auto-recommend minimum conduit trade size that satisfies NEC fill limits for a given conductor list

**Independent Test**: Enter 4x #8 THHN, select EMT, click "Find Minimum Size", verify system recommends smallest passing EMT size. Enter extreme conductor list, verify "no single conduit fits" message.

### Tests

- [x] T017 [P] [US3] Write unit tests for findMinimumConduitSize() in `__tests__/unit/calculations/conduit-fill/conduitFillCalculator.test.ts` — test: returns smallest EMT for 4x #8 THHN, returns smallest PVC40 for large conductor set, returns null when no size fits, works correctly with nipple mode (60% limit)

### Implementation

- [x] T018 [US3] Implement findMinimumConduitSize() in `lib/calculations/conduit-fill/conduitFillCalculator.ts` — iterate ascending trade sizes for conduit type, return first where fill ≤ limit, return null if none fits. Add MinimumSizeResult type to `types/conduit-fill.ts`
- [x] T019 [US3] Add "Find Minimum Size" button to `components/conduit-fill/ConduitFillInputForm.tsx` and display recommendation in `components/conduit-fill/ConduitFillResults.tsx` — show recommended size with its fill percentage, or "No single conduit sufficient — consider parallel runs" message
- [x] T020 [US3] Run tests from T017 — verify all pass

**Checkpoint**: Minimum conduit size recommendation working. Users can auto-find the right conduit size.

---

## Phase 5: User Story 4 — Nipple Fill 60% Rule (Priority: P2)

**Goal**: Support conduit nipple mode with 60% fill limit per NEC 376.22

**Independent Test**: Toggle nipple mode ON with 3+ conductors, verify 60% fill limit applied instead of 40%. Toggle OFF, verify standard limits restore.

### Tests

- [x] T021 [P] [US4] Write unit tests for nipple mode in `__tests__/unit/calculations/conduit-fill/conduitFillCalculator.test.ts` — test: nipple mode applies 60% limit for 1/2/3+ conductors, standard mode restores 53/31/40 limits, nipple mode affects findMinimumConduitSize() results

### Implementation

- [x] T022 [US4] Add nipple mode toggle to `components/conduit-fill/ConduitFillInputForm.tsx` — Switch or Checkbox component with label "Conduit Nipple (≤ 24\"/600mm)", tooltip explaining NEC 376.22 rule. Wire to store setNipple action
- [x] T023 [US4] Update `components/conduit-fill/ConduitFillResults.tsx` — when nipple mode active, display "NEC 376.22 — 60% fill limit (conduit nipple)" in NEC references section
- [x] T024 [US4] Run tests from T021 — verify all pass

**Checkpoint**: Nipple fill mode working. Both P2 stories complete.

---

## Phase 6: User Story 5 — PDF Report Export (Priority: P3)

**Goal**: Professional PDF export with all inputs, NEC references, calculations, and pass/fail result

**Independent Test**: Complete a fill calculation, export PDF, verify document contains conduit details, conductor table, area calculations, fill result, NEC table references, and disclaimer.

- [x] T025 [US5] Create PDF generator in `lib/pdfGenerator.conduitFill.ts` — export downloadConduitFillPDF(data) function using jsPDF. Include: header with title + timestamp, project info, conduit type/size/internal area, conductor table (wire size, insulation, qty, area each, total area), fill calculation summary (total area, fill %, limit, pass/fail), NEC references (Table 1, 4, 5/5A/8 as applicable), minimum size recommendation (if calculated), disclaimer text. Support imperial/metric units
- [x] T026 [US5] Wire PDF export to `app/conduit-fill/ConduitFillTool.tsx` — add handleExportPDF callback, isExportingPDF state, pass to Results component. Add export button to `components/conduit-fill/ConduitFillResults.tsx`

**Checkpoint**: PDF export working. Engineers can generate professional documentation.

---

## Phase 7: User Story 6 — Compact Conductor Support (Priority: P3)

**Goal**: Support compact conductors using NEC Chapter 9 Table 5A dimensions

**Independent Test**: Select compact conductor option for a THHN entry, verify cross-sectional area is smaller than standard Table 5 value. Mix compact and standard conductors, verify correct areas used.

### Tests

- [x] T027 [P] [US6] Write unit tests for compact conductor lookups in `__tests__/unit/calculations/conduit-fill/conduitFillData.test.ts` — test: getConductorArea() with isCompact=true returns Table 5A values, compact areas are smaller than standard for same size/type, error thrown for sizes not available in Table 5A

### Implementation

- [x] T028 [US6] Add NEC Table 5A compact conductor data to `lib/calculations/conduit-fill/conduitFillData.ts` — compact areas for THHN/THWN-2, XHHW/XHHW-2, and other types with compact listings. Update getConductorArea() to check isCompact flag
- [x] T029 [US6] Add compact conductor toggle to conductor entry row in `components/conduit-fill/ConduitFillInputForm.tsx` — checkbox per conductor entry, disabled when selected size/type has no Table 5A data. Update `components/conduit-fill/ConduitFillResults.tsx` to show "Table 5A" reference for compact entries
- [x] T030 [US6] Run tests from T027 — verify all pass

**Checkpoint**: All 6 user stories complete. Full feature implemented.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality improvements across all stories

- [x] T031 [P] Verify all numeric input fields use focus/blur local string state pattern (not direct number binding) in `components/conduit-fill/ConduitFillInputForm.tsx`
- [x] T032 [P] Verify responsive layout works on desktop and tablet viewports for all conduit fill components
- [x] T033 Run full test suite — `pnpm test __tests__/unit/calculations/conduit-fill` — all tests must pass

---

## Phase 9: Constitution Compliance Verification

**Purpose**: Validate implementation against constitutional principles

### Calculation Accuracy Validation
- [x] T034 [P] Cross-reference fill calculations against NEC Annex C pre-calculated tables for EMT with THHN — verify 100% match for at least 10 conductor/size combinations
- [x] T035 [P] Verify mathjs BigNumber used for area summation — no native JS floating-point arithmetic in critical paths in `lib/calculations/conduit-fill/conduitFillCalculator.ts`

### Safety Validation
- [x] T036 [P] Verify overfill detection: >100% shows red FAIL, >80% shows yellow warning, ≤80% shows green PASS in `components/conduit-fill/ConduitFillResults.tsx`
- [x] T037 Verify real-time calculation performance <100ms for 20 conductor entries

### Standards Compliance
- [x] T038 [P] Verify NEC table references (Table 1, 4, 5, 5A, 8) display in results and PDF output
- [x] T039 [P] Verify "NEC 2020 Chapter 9" version label in UI header and PDF report
- [x] T040 Verify disclaimer text in PDF export

### Test Coverage
- [x] T041 Review test coverage — confirm nominal, boundary (exactly at fill limit), edge (empty list, single conductor, max conductors), and error cases covered in `__tests__/unit/calculations/conduit-fill/`

### Professional Documentation
- [x] T042 Test PDF export in Chrome and verify all required elements present (inputs, calculations, NEC refs, timestamp, disclaimer)

### Dual Standards Support
- [x] T043 Verify imperial/metric toggle correctly converts all displayed areas (1 in² = 645.16 mm²) in results and conductor breakdown

**Checkpoint**: Constitution compliance verified — ready for code review and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (types) — BLOCKS all UI work
- **Phase 3 (US1+US2 MVP)**: Depends on Phase 2 completion
- **Phase 4 (US3)**: Depends on Phase 3 — extends calculator with recommendation
- **Phase 5 (US4)**: Depends on Phase 2 — can run in PARALLEL with Phase 3 or 4
- **Phase 6 (US5)**: Depends on Phase 3 — needs working calculator to export
- **Phase 7 (US6)**: Depends on Phase 2 — can run in PARALLEL with Phase 3
- **Phase 8 (Polish)**: Depends on all story phases complete
- **Phase 9 (Constitution)**: Depends on Phase 8

### User Story Dependencies

- **US1+US2 (P1)**: Core — no story dependencies, depends only on foundational data/calc
- **US3 (P2)**: Extends calculator — depends on US1+US2 for UI integration
- **US4 (P2)**: Independent toggle — depends only on foundational calc, can parallel with US1
- **US5 (P3)**: PDF export — depends on US1+US2 for content to export
- **US6 (P3)**: Data addition — depends only on foundational data, can parallel with US1

### Parallel Opportunities

Within Phase 2: T002 ∥ T003 (tests), then T004 ∥ T005 (data), then T006 (calc depends on both)
Within Phase 3: T008 ∥ T009 ∥ T010 ∥ T011 ∥ T012 (all different files)
Phase 5 (US4) can run in parallel with Phase 3 (US1+US2)
Phase 7 (US6) can run in parallel with Phase 3 (US1+US2)

---

## Parallel Example: Phase 3 (MVP)

```
# All these tasks can run in parallel (different files):
T008: Zod validation in lib/validation/conduitFillValidation.ts
T009: Zustand store in stores/useConduitFillStore.ts
T010: InputForm in components/conduit-fill/ConduitFillInputForm.tsx
T011: Results in components/conduit-fill/ConduitFillResults.tsx
T012: HistorySidebar in components/conduit-fill/ConduitFillHistorySidebar.tsx

# Then sequentially (depends on above):
T013: ConduitFillTool wires everything together
T014: page.tsx wraps the tool
T015: Navigation integration
T016: Homepage card
```

---

## Implementation Strategy

### MVP First (Phase 1 → 2 → 3)

1. Complete Phase 1: Types (T001)
2. Complete Phase 2: NEC data + calculator with tests (T002–T007)
3. Complete Phase 3: Full UI for US1+US2 (T008–T016)
4. **STOP and VALIDATE**: Test conduit fill calculator end-to-end
5. Deploy — users can check conduit fill compliance

### Incremental Delivery

1. Phase 1+2+3 → MVP: Core fill calculator
2. + Phase 4 → Minimum size recommendation
3. + Phase 5 → Nipple mode
4. + Phase 6 → PDF export
5. + Phase 7 → Compact conductors
6. Each addition is independently valuable and doesn't break previous work

---

## Notes

- [P] tasks = different files, no dependencies — safe to parallelize
- NEC table data (T004, T005) is the largest single task by volume — ~200+ data points
- Focus/blur numeric input pattern (per project feedback) must be used for quantity fields
- Cross-reference against NEC Annex C for validation — this is the "published standard test case" per constitution
- Total: 43 tasks across 9 phases
