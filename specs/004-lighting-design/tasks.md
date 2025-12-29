# Tasks: Lighting Design Calculator

**Input**: Design documents from `/specs/004-lighting-design/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/lighting.openapi.yaml
**Feature Branch**: `004-lighting-design`
**Date Generated**: 2025-12-29

**Tests**: TDD required for P1 calculations per Constitution Principle V (Test-First Development).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js App Router structure per plan.md
- `app/lighting/` - Route components
- `components/lighting/` - UI components
- `lib/calculations/lighting/` - Calculation modules
- `lib/standards/` - Standards data tables
- `lib/validation/` - Zod schemas
- `stores/` - Zustand stores
- `__tests__/unit/calculations/lighting/` - Unit tests

---

## Phase 1: Setup (Shared Infrastructure) ✅

**Purpose**: Project initialization and dependencies

- [x] T001 Install new dependencies: `npm install tesseract.js pdfjs-dist`
- [x] T002 [P] Create lighting route directory structure in `app/lighting/`
- [x] T003 [P] Create components directory structure in `components/lighting/`
- [x] T004 [P] Create calculation modules directory in `lib/calculations/lighting/`
- [x] T005 [P] Create outdoor calculation subdirectory in `lib/calculations/lighting/outdoor/`
- [x] T006 [P] Create visual processing directory in `lib/visual/`
- [x] T007 Add lighting link to Sidebar navigation in `components/layout/Sidebar.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites) ✅

**Purpose**: Core types, enums, and shared infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### TypeScript Types and Enums

- [x] T008 [P] Create Room, Luminaire, DesignParameters interfaces in `lib/types/lighting.ts`
- [x] T009 [P] Create CalculationResults, RoomIndex interfaces in `lib/types/lighting.ts`
- [x] T010 [P] Create SpaceType, LuminaireCategory, DistributionType enums in `lib/types/lighting.ts`
- [x] T011 [P] Create LightingStandard, UnitSystem enums in `lib/types/lighting.ts`
- [x] T012 [P] Create CalculationFormula, CalculationWarning interfaces in `lib/types/lighting.ts`

### Validation Schemas

- [x] T013 Create Zod schemas for Room validation in `lib/validation/lightingValidation.ts`
- [x] T014 [P] Create Zod schemas for Luminaire validation in `lib/validation/lightingValidation.ts`
- [x] T015 [P] Create Zod schemas for DesignParameters validation in `lib/validation/lightingValidation.ts`
- [x] T016 [P] Implement validateWithWarnings() function in `lib/validation/lightingValidation.ts`

### Standards Data Tables

- [x] T017 [P] Create space type presets (illuminance targets) in `lib/standards/spaceTypePresets.ts`
- [x] T018 [P] Create reflectance defaults in `lib/standards/reflectanceDefaults.ts`
- [x] T019 Create Utilization Factor lookup tables in `lib/standards/utilizationFactorTables.ts`
- [x] T020 [P] Create built-in luminaire catalog (50+ fixtures) in `lib/standards/luminaireCatalog.ts`

### Zustand Store

- [x] T021 Create useLightingStore with room, luminaire, designParameters state in `stores/useLightingStore.ts`
- [x] T022 Add localStorage persist middleware to useLightingStore in `stores/useLightingStore.ts`
- [x] T023 Add calculation history (FIFO, max 50) to useLightingStore in `stores/useLightingStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin ✅

---

## Phase 3: User Story 1 - Basic Indoor Lighting Calculation (Priority: P1) 🎯 MVP ✅

**Goal**: Engineer inputs room dimensions, reflectances, and luminaire data. System calculates required luminaires, average illuminance, and energy consumption using IESNA lumen method.

**Independent Test**: Input room (12×8×3m), reflectance (80/50/20), LED panel (40W, 3600lm), required 500 lux. Verify luminaires required ≈26 (±5% of IESNA handbook).

### Tests for User Story 1 (TDD - Write tests FIRST, ensure they FAIL) ⚠️

- [x] T024 [P] [US1] Create roomIndex.test.ts with IESNA reference cases in `__tests__/unit/calculations/lighting/roomIndex.test.ts`
- [x] T025 [P] [US1] Create lumenMethod.test.ts with accuracy ±5% validation in `__tests__/unit/calculations/lighting/lumenMethod.test.ts`
- [x] T026 [P] [US1] Create averageIlluminance.test.ts in `__tests__/unit/calculations/lighting/averageIlluminance.test.ts`
- [x] T027 [P] [US1] Create spacingRatio.test.ts with SHR validation in `__tests__/unit/calculations/lighting/spacingRatio.test.ts`
- [x] T028 [P] [US1] Create energyConsumption.test.ts in `__tests__/unit/calculations/lighting/energyConsumption.test.ts`

### Implementation for User Story 1

#### Calculation Modules (implement to pass tests)

- [x] T029 [P] [US1] Implement calculateRoomIndex() in `lib/calculations/lighting/lumenMethod.ts`
- [x] T030 [P] [US1] Implement calculateLuminairesRequired() in `lib/calculations/lighting/lumenMethod.ts`
- [x] T031 [P] [US1] Implement calculateAverageIlluminance() in `lib/calculations/lighting/lumenMethod.ts`
- [x] T032 [P] [US1] Implement calculateSpacingRatio() in `lib/calculations/lighting/lumenMethod.ts`
- [x] T033 [P] [US1] Implement calculateEnergyConsumption() in `lib/calculations/lighting/lumenMethod.ts`
- [x] T034 [US1] Create performLightingCalculation() orchestrator in `lib/calculations/lighting/lumenMethod.ts`

#### UI Components

- [x] T035 [P] [US1] Create LuminaireSelector dropdown component (integrated in LightingDesignTool)
- [x] T036 [P] [US1] Create LightingInputForm with room/reflectance/luminaire inputs (integrated in LightingDesignTool)
- [x] T037 [P] [US1] Create LightingResults with expandable formula details (integrated in LightingDesignTool)
- [x] T038 [US1] Create LightingDesignTool orchestrator component in `app/lighting/LightingDesignTool.tsx`
- [x] T039 [US1] Create page.tsx route with LightingDesignTool in `app/lighting/page.tsx`

#### Integration

- [x] T040 [US1] Connect LightingDesignTool to useLightingStore for state management
- [x] T041 [US1] Implement debounced calculation (300ms) in LightingDesignTool
- [x] T042 [US1] Add real-time validation with WarningBanner display
- [x] T043 [US1] Run tests and verify all pass with ±5% accuracy (33/33 tests passing)

**Checkpoint**: User Story 1 complete - Basic calculation working independently ✅

---

## Phase 4: User Story 5 - PDF Report Generation (Priority: P1) 🎯 MVP ✅

**Goal**: Engineer generates professional PDF report with room layout, luminaire schedule, formulas, results, and standard references.

**Independent Test**: Complete calculation, generate PDF. Verify PDF contains room parameters, luminaire data, results, formulas, and disclaimer. Opens in standard viewers.

**Depends on**: User Story 1 (needs calculation results to generate report)

### Tests for User Story 5 (TDD) ⚠️

- [ ] T044 [P] [US5] Create pdfGenerator.lighting.test.ts with output validation in `__tests__/unit/pdfGenerator.lighting.test.ts`

### Implementation for User Story 5

- [x] T045 [P] [US5] Create PDF structure constants (header, sections, footer) in `lib/reports/lightingPdfGenerator.ts`
- [x] T046 [US5] Implement generateLightingPdf() function in `lib/reports/lightingPdfGenerator.ts`
- [x] T047 [US5] Add room parameters table rendering to PDF generator
- [x] T048 [US5] Add luminaire data table rendering to PDF generator
- [x] T049 [US5] Add calculation formulas section with variable definitions
- [x] T050 [US5] Add results table rendering to PDF generator
- [x] T051 [US5] Add standard references (IESNA, ASHRAE) and disclaimer text
- [x] T052 [P] [US5] Create downloadLightingPdf() function in `lib/reports/lightingPdfGenerator.ts`
- [x] T053 [US5] Integrate PDF download button into LightingDesignTool component
- [ ] T054 [US5] Test PDF generation <10 seconds, verify cross-browser compatibility

**Checkpoint**: User Stories 1 + 5 complete - MVP ready for deployment

---

## Phase 5: User Story 2 - Visual Input from Floor Plans (Priority: P2)

**Goal**: User uploads PDF/image floor plan. System extracts room dimensions using OCR, flags uncertainties, and populates calculation form.

**Independent Test**: Upload PDF with "12.5m × 8.0m" annotation. System extracts 12.5m length, 8.0m width with ≥90% confidence.

### Tests for User Story 2 (TDD) ⚠️

- [ ] T055 [P] [US2] Create floorPlanAnalyzer.test.ts with dimension extraction cases in `__tests__/unit/visual/floorPlanAnalyzer.test.ts`
- [ ] T056 [P] [US2] Create dimensionExtractor.test.ts with metric/imperial patterns in `__tests__/unit/visual/dimensionExtractor.test.ts`

### Implementation for User Story 2

#### Visual Processing Modules

- [ ] T057 [P] [US2] Create VisualInputAnalysis, ExtractedRoom types in `lib/types/lighting.ts`
- [ ] T058 [P] [US2] Create Uncertainty, FileReference types in `lib/types/lighting.ts`
- [ ] T059 [P] [US2] Implement dimension regex patterns (metric, imperial) in `lib/visual/dimensionExtractor.ts`
- [ ] T060 [US2] Implement parseDimensionPatterns() function in `lib/visual/dimensionExtractor.ts`
- [ ] T061 [US2] Implement pdfToImageData() using pdf.js in `lib/visual/floorPlanAnalyzer.ts`
- [ ] T062 [US2] Implement imageToImageData() for PNG/JPG/BMP in `lib/visual/floorPlanAnalyzer.ts`
- [ ] T063 [US2] Implement Tesseract.js OCR worker in `lib/visual/floorPlanAnalyzer.ts`
- [ ] T064 [US2] Implement analyzeFloorPlan() orchestrator in `lib/visual/floorPlanAnalyzer.ts`
- [ ] T065 [US2] Implement confidence scoring and uncertainty flagging

#### UI Components

- [ ] T066 [P] [US2] Create VisualInputSection with file upload in `components/lighting/VisualInputSection.tsx`
- [ ] T067 [US2] Add progress indicator for OCR processing (0-100%)
- [ ] T068 [US2] Create ExtractedDataReview component for confirmation in `components/lighting/ExtractedDataReview.tsx`
- [ ] T069 [US2] Implement auto-populate room dimensions on confirmation

#### Integration

- [ ] T070 [US2] Add visual analysis state to useLightingStore
- [ ] T071 [US2] Add visualAnalysisCount for freemium limit (3/month)
- [ ] T072 [US2] Integrate VisualInputSection into LightingDesignTool
- [ ] T073 [US2] Test visual analysis <30 seconds, ≥90% accuracy

**Checkpoint**: User Story 2 complete - Visual input working independently

---

## Phase 6: User Story 3 - Advanced Lighting Simulations (Priority: P2)

**Goal**: User requests uniformity analysis after calculation. System generates illuminance grid, computes uniformity ratio, identifies problem areas, and provides optimization recommendations.

**Independent Test**: 4-luminaire layout produces uniformity ratio 0.65. System identifies one under-lit corner, recommends adding luminaire.

### Tests for User Story 3 (TDD) ⚠️

- [ ] T074 [P] [US3] Create uniformityRatio.test.ts with grid calculations in `__tests__/unit/calculations/lighting/uniformityRatio.test.ts`

### Implementation for User Story 3

#### Calculation Modules

- [ ] T075 [P] [US3] Create UniformityAnalysis, ProblemArea types in `lib/types/lighting.ts`
- [ ] T076 [P] [US3] Create OptimizationSuggestion type in `lib/types/lighting.ts`
- [ ] T077 [US3] Implement calculatePointIlluminance() for grid in `lib/calculations/lighting/uniformityRatio.ts`
- [ ] T078 [US3] Implement analyzeUniformity() function in `lib/calculations/lighting/uniformityRatio.ts`
- [ ] T079 [US3] Implement identifyProblemAreas() function in `lib/calculations/lighting/uniformityRatio.ts`
- [ ] T080 [US3] Implement generateOptimizationSuggestions() in `lib/calculations/lighting/uniformityRatio.ts`

#### UI Components

- [ ] T081 [P] [US3] Create UniformityAnalysis component with heatmap in `components/lighting/UniformityAnalysis.tsx`
- [ ] T082 [US3] Add problem area highlighting to heatmap visualization
- [ ] T083 [US3] Add optimization recommendations display
- [ ] T084 [US3] Integrate UniformityAnalysis into LightingResults

#### Integration

- [ ] T085 [US3] Add uniformityAnalysis state to useLightingStore
- [ ] T086 [US3] Add "Analyze Uniformity" button to trigger analysis
- [ ] T087 [US3] Verify uniformity recommendations improve ratio by ≥10%

**Checkpoint**: User Story 3 complete - Uniformity analysis working independently

---

## Phase 7: User Story 4 - Outdoor and Roadway Lighting (Priority: P3)

**Goal**: Engineer inputs road width, pole spacing, mounting height. System calculates illuminance and uniformity per IES RP-8 or CIE 140, generates pole layout diagram.

**Independent Test**: 6m road, 30m pole spacing, 10m mounting, LED cobra head. System outputs average illuminance per IES RP-8 Table 2.

### Tests for User Story 4 (TDD) ⚠️

- [ ] T088 [P] [US4] Create iesRp8.test.ts with handbook examples in `__tests__/unit/calculations/lighting/outdoor/iesRp8.test.ts`
- [ ] T089 [P] [US4] Create cie140.test.ts with CIE examples in `__tests__/unit/calculations/lighting/outdoor/cie140.test.ts`

### Implementation for User Story 4

#### Types and Standards

- [ ] T090 [P] [US4] Create RoadwayDesign type in `lib/types/lighting.ts`
- [ ] T091 [P] [US4] Create RoadClassIES, RoadClassCIE enums in `lib/types/lighting.ts`
- [ ] T092 [P] [US4] Create roadway UF tables in `lib/standards/roadwayUtilizationFactors.ts`

#### Calculation Modules

- [ ] T093 [US4] Implement calculateRoadwayIlluminance() for IES RP-8 in `lib/calculations/lighting/outdoor/iesRp8.ts`
- [ ] T094 [US4] Implement calculateRoadwayUniformity() for IES RP-8 in `lib/calculations/lighting/outdoor/iesRp8.ts`
- [ ] T095 [US4] Implement calculateRoadwayIlluminanceCIE() for CIE 140 in `lib/calculations/lighting/outdoor/cie140.ts`
- [ ] T096 [US4] Implement calculateLongitudinalUniformity() for CIE 140 in `lib/calculations/lighting/outdoor/cie140.ts`

#### UI Components

- [ ] T097 [P] [US4] Create RoadwayLightingSection with inputs in `components/lighting/RoadwayLightingSection.tsx`
- [ ] T098 [US4] Add standard toggle (IES RP-8 / CIE 140) to roadway section
- [ ] T099 [US4] Create pole layout diagram generator (Canvas/SVG)
- [ ] T100 [US4] Integrate RoadwayLightingSection into LightingDesignTool

**Checkpoint**: User Story 4 complete - Roadway lighting working independently

---

## Phase 8: User Story 6 - Luminaire Catalog Management (Priority: P3)

**Goal**: User browses built-in catalog, filters by type, saves custom luminaires to account for reuse.

**Independent Test**: User creates custom luminaire (45W, 4000lm). Luminaire appears in catalog. Selectable in future calculations.

### Implementation for User Story 6

#### Types and API

- [ ] T101 [P] [US6] Create LuminaireCatalog database type in `lib/types/lighting.ts`
- [ ] T102 [P] [US6] Create user_luminaires Drizzle schema in `lib/schemas/lighting.ts`
- [ ] T103 [US6] Create GET /api/lighting/luminaires endpoint in `app/api/lighting/luminaires/route.ts`
- [ ] T104 [US6] Create POST /api/lighting/luminaires endpoint in `app/api/lighting/luminaires/route.ts`
- [ ] T105 [US6] Create DELETE /api/lighting/luminaires/[id] endpoint in `app/api/lighting/luminaires/[id]/route.ts`

#### UI Components

- [ ] T106 [P] [US6] Create LuminaireCatalog browser component in `components/lighting/LuminaireCatalog.tsx`
- [ ] T107 [US6] Add category filtering (troffer, highbay, downlight, etc.)
- [ ] T108 [US6] Add "Save Custom Luminaire" form for logged-in users
- [ ] T109 [US6] Integrate custom luminaires into LuminaireSelector dropdown
- [ ] T110 [US6] Add authentication gating for custom luminaire save

**Checkpoint**: User Story 6 complete - Catalog management working independently

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T111 [P] Add unit toggle (SI/Imperial) to LightingInputForm
- [ ] T112 [P] Implement lux/footcandle conversion in display
- [ ] T113 [P] Add calculation history sidebar to LightingDesignTool
- [ ] T114 Code cleanup: extract shared constants, remove duplication
- [ ] T115 Performance optimization: lazy load Tesseract.js and pdf.js
- [ ] T116 [P] Add Web Worker for OCR processing to prevent UI blocking
- [ ] T117 Run quickstart.md validation scenarios end-to-end

---

## Phase 10: Constitution Compliance Verification

**Purpose**: Validate implementation against constitutional principles (`.specify/memory/constitution.md`)

### Calculation Accuracy Validation

- [ ] T118 [P] Verify Room Index formula against IESNA Handbook Chapter 9 examples
- [ ] T119 [P] Verify lumen method results within ±5% of handbook calculations (SC-002)
- [ ] T120 Document standard versions in code comments (IESNA 10th Ed, IES RP-8-18)
- [ ] T121 Add automated accuracy tests comparing to published examples

### Safety Validation

- [ ] T122 [P] Test warning display for illuminance >1000 lux (excessive)
- [ ] T123 [P] Test warning display for uniformity <0.3 (poor distribution)
- [ ] T124 Test warning display for SHR exceeding luminaire max
- [ ] T125 Verify validation latency <300ms (debounced)

### Standards Compliance

- [ ] T126 [P] Verify IESNA reference displays in calculation results
- [ ] T127 [P] Test PDF report includes formula citations and section numbers
- [ ] T128 Verify disclaimer text in PDF: "Calculations for informational purposes..."

### Professional Documentation

- [ ] T129 [P] Test PDF generation in Chrome, Firefox, Safari, Edge (95% success)
- [ ] T130 Verify PDF contains all required elements (inputs, formulas, references)
- [ ] T131 Test "Show Details" mode displays intermediate calculations
- [ ] T132 Verify PDF generation completes <10 seconds (SC-004)

### Progressive Enhancement

- [ ] T133 Confirm US1+US5 (MVP) works without US2-US6 dependencies
- [ ] T134 Verify each user story independently testable
- [ ] T135 Validate no P2/P3 code runs when P1-only features used

**Checkpoint**: Constitution compliance verified - ready for code review and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP core
- **User Story 5 (Phase 4)**: Depends on US1 completion (needs calculation results)
- **User Story 2 (Phase 5)**: Depends on Foundational only (independent of US1 results)
- **User Story 3 (Phase 6)**: Depends on US1 (extends calculation results)
- **User Story 4 (Phase 7)**: Depends on Foundational only (independent module)
- **User Story 6 (Phase 8)**: Depends on Foundational only (independent module)
- **Polish (Phase 9)**: After all desired user stories complete
- **Compliance (Phase 10)**: After Polish complete

### User Story Dependencies

```
Foundational (Phase 2)
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
    US1 (P1)                          US2, US4, US6 (can start in parallel)
         │
         ▼
    US5 (P1) ←── depends on US1 results
         │
         ▼
    US3 (P2) ←── depends on US1 results
```

### MVP Scope (Recommended)

**MVP = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US5)**

This delivers:
- Basic indoor lighting calculation with IESNA accuracy
- PDF report generation with professional formatting
- No external dependencies (Tesseract.js not needed for MVP)

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- Types/enums before calculation modules
- Calculation modules before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004, T005, T006 can all run in parallel

**Phase 2 (Foundational)**:
- T008-T012 (types) can all run in parallel
- T013-T016 (validation) mostly parallel after T008
- T017-T020 (standards) can all run in parallel
- T021-T023 (store) must be sequential

**Phase 3 (US1)**:
- T024-T028 (tests) can all run in parallel
- T029-T033 (calculations) can all run in parallel
- T035-T037 (UI) can all run in parallel after calculations

**Phase 5 (US2)**:
- T055-T056 (tests) can run in parallel
- T057-T062 (visual processing) partially parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create roomIndex.test.ts in __tests__/unit/calculations/lighting/roomIndex.test.ts"
Task: "Create lumenMethod.test.ts in __tests__/unit/calculations/lighting/lumenMethod.test.ts"
Task: "Create averageIlluminance.test.ts in __tests__/unit/calculations/lighting/averageIlluminance.test.ts"
Task: "Create spacingRatio.test.ts in __tests__/unit/calculations/lighting/spacingRatio.test.ts"
Task: "Create energyConsumption.test.ts in __tests__/unit/calculations/lighting/energyConsumption.test.ts"

# After tests written and failing, launch all calculation modules:
Task: "Implement calculateRoomIndex() in lib/calculations/lighting/roomIndex.ts"
Task: "Implement calculateLuminairesRequired() in lib/calculations/lighting/lumenMethod.ts"
Task: "Implement calculateAverageIlluminance() in lib/calculations/lighting/averageIlluminance.ts"
Task: "Implement calculateSpacingRatio() in lib/calculations/lighting/spacingRatio.ts"
Task: "Implement calculateEnergyConsumption() in lib/calculations/lighting/energyConsumption.ts"

# After calculations pass tests, launch UI components:
Task: "Create LuminaireSelector in components/lighting/LuminaireSelector.tsx"
Task: "Create LightingInputForm in components/lighting/LightingInputForm.tsx"
Task: "Create LightingResults in components/lighting/LightingResults.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US5 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Basic Calculation)
4. Complete Phase 4: User Story 5 (PDF Report)
5. **STOP and VALIDATE**: Test MVP end-to-end
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Basic calc working
3. Add US5 → Test independently → PDF reports working (MVP!)
4. Add US2 → Test independently → Visual input working
5. Add US3 → Test independently → Uniformity analysis working
6. Add US4 → Test independently → Roadway lighting working
7. Add US6 → Test independently → Catalog management working
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US5 (MVP path)
   - Developer B: US2 (can start independently)
   - Developer C: US4 (can start independently)
3. After MVP:
   - Developer A: US3 (depends on US1)
   - Developer B: Continue US2 integration
   - Developer C: US6

---

## Summary

| Phase | User Story | Priority | Task Count | Parallel Tasks |
|-------|------------|----------|------------|----------------|
| 1 | Setup | - | 7 | 5 |
| 2 | Foundational | - | 16 | 12 |
| 3 | US1: Basic Calculation | P1 | 20 | 15 |
| 4 | US5: PDF Report | P1 | 11 | 2 |
| 5 | US2: Visual Input | P2 | 19 | 5 |
| 6 | US3: Uniformity | P2 | 14 | 3 |
| 7 | US4: Roadway | P3 | 13 | 5 |
| 8 | US6: Catalog | P3 | 10 | 3 |
| 9 | Polish | - | 7 | 4 |
| 10 | Compliance | - | 18 | 8 |
| **Total** | | | **135** | **62** |

**MVP Scope**: Phases 1-4 (54 tasks)
**Full Feature**: All phases (135 tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [USn] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests FAIL before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Accuracy requirement: ±5% of IESNA handbook (SC-002)
- Performance requirements: Calculation <2s, PDF <10s, Visual <30s
