# Tasks: Maximum Demand & Diversity Calculator

**Feature**: 007-maximum-demand-diversity  
**Branch**: 007-maximum-demand-diversity  
**Input**: specs/007-maximum-demand-diversity/spec.md, plan.md

---

## Implementation Strategy

**MVP Scope**: Complete User Story 1 (Residential calculations with IEC/NEC) with basic UI. This provides immediate value while establishing the foundation for commercial/industrial.

**Incremental Delivery**:
- Phase 1: Project setup and foundational components
- Phase 2: Core calculation functionality (US1 - Residential)
- Phase 3: Commercial & Industrial calculations (US2, US3)
- Phase 4: UI polish and integration
- Phase 5: PDF report generation (US4)
- Final Phase: Save/load projects and polish (US5)

---

## Dependencies

- User Story 1 (P0) must be completed before User Stories 2-3 (P0)
- Foundational components (models, factors, calculation engine) support all user stories
- UI components depend on underlying services and models
- Database migration required before save/load functionality

---

## Parallel Execution Opportunities

- UI component development can occur in parallel with service development
- Unit tests can be written in parallel with implementation
- API endpoints can be developed in parallel with frontend components
- Documentation can be created in parallel with implementation

---

## Phase 1: Setup

### Goal
Initialize project structure and foundational dependencies for the Maximum Demand & Diversity Calculator feature.

### Independent Test Criteria
- Project builds successfully with no errors
- Basic UI rendering works without crashes
- All required dependencies are installed and configured
- Development server starts without errors

### Implementation Tasks

- [ ] T001 Create project structure in `src/components/demand-diversity/`, `src/services/demand-diversity/`, `src/models/`
- [ ] T002 Verify Math.js dependency is available (already installed for other calculators)
- [ ] T003 Verify jsPDF dependency is available (already installed for lightning-arrester)
- [ ] T004 [P] Create DemandCalculationParameters model in `src/models/DemandCalculationParameters.ts`
- [ ] T005 [P] Create DemandCalculationResult model in `src/models/DemandCalculationResult.ts`
- [ ] T006 [P] Create IEC diversity factors constants in `src/services/demand-diversity/IECFactors.ts`
- [ ] T007 [P] Create NEC demand factors constants in `src/services/demand-diversity/NECFactors.ts`
- [ ] T008 Create shared constants file in `src/constants/demandDiversity.ts`
- [ ] T009 Create database migration file for `demand_calculations` table

---

## Phase 2: Foundational Components

### Goal
Implement core services and calculation logic for residential demand/diversity calculations.

### Independent Test Criteria
- Calculation engine produces accurate results per IEC 60364 and NEC Article 220
- Validation logic properly rejects invalid inputs
- Residential example matches spec (59kW connected → 43.6kW demand for IEC)
- Real-time validation responds within 100ms

### Implementation Tasks

- [ ] T010 [P] Implement IEC diversity factor calculator in `src/services/demand-diversity/IECFactors.ts`
  - Residential factors: lighting (100%), sockets (40%), HVAC (80%), cooking (70%), water heating (100%)
  - Include clause references for each factor
  
- [ ] T011 [P] Implement NEC demand factor calculator in `src/services/demand-diversity/NECFactors.ts`
  - Dwelling optional method (220.82): first 10kVA @ 100%, remainder @ 40%
  - Cooking equipment factors (220.55)
  - HVAC, water heater, dryer factors
  
- [ ] T012 [P] Implement calculation engine in `src/services/demand-diversity/calculationEngine.ts`
  - Orchestrates IEC/NEC factor application
  - Calculates total connected load
  - Applies appropriate factors by category
  - Returns DemandCalculationResult
  
- [ ] T013 [P] Implement validation service in `src/services/demand-diversity/validation.ts`
  - Validate numeric ranges (0-10000 kW per category)
  - Validate project type selection
  - Validate standard selection
  - Return array of validation errors
  
- [ ] T014 Create unit tests for IEC factors with published examples
- [ ] T015 Create unit tests for NEC factors with published examples
- [ ] T016 Create unit tests for calculation engine
- [ ] T017 Create unit tests for validation service

---

## Phase 3: [US1] Residential Calculations (Priority: P0)

### Goal
Enable electrical engineers to calculate maximum demand for residential projects with IEC or NEC standards.

### Independent Test Criteria
- User can input connected loads for residential categories
- System displays total connected load, applied factors, and maximum demand
- IEC calculation matches example: 59kW → 43.6kW
- NEC calculation matches optional method requirements
- Compliance notes display correct clause references

### Acceptance Tests
- [ ] T018 [US1] Test scenario 1: Given IEC residential inputs (10+15+20+8+6 kW), When calculated, Then show 43.6kW demand
- [ ] T019 [US1] Test scenario 2: Given NEC residential inputs, When calculated, Then apply optional method correctly
- [ ] T020 [US1] Test scenario 3: Given standard switch (IEC↔NEC), When recalculated, Then show different factors and results

### Implementation Tasks

- [ ] T021 [P] [US1] Create CalculatorForm component in `src/components/demand-diversity/CalculatorForm.tsx`
  - Project name input
  - Project type dropdown (residential, commercial, industrial)
  - Standard toggle (IEC/NEC)
  - System config inputs (voltage, phases, frequency)
  - Load category inputs (dynamic based on type)
  
- [ ] T022 [P] [US1] Create ResultsDisplay component in `src/components/demand-diversity/ResultsDisplay.tsx`
  - Summary card (connected load, demand, diversity factor)
  - Category breakdown table
  - Compliance status display
  
- [ ] T023 [P] [US1] Create ComplianceTable component in `src/components/demand-diversity/ComplianceTable.tsx`
  - Display compliance checks by standard
  - Show clause references
  - Color-coded pass/fail indicators
  
- [ ] T024 [US1] Implement API endpoint POST /api/demand-diversity/calculate in `app/api/demand-diversity/calculate/route.ts`
- [ ] T025 [US1] Connect CalculatorForm to calculation engine
- [ ] T026 [US1] Implement real-time validation with <100ms response
- [ ] T027 [US1] Display compliance notes with IEC/NEC clause references
- [ ] T028 [US1] Handle edge cases (zero loads, very large loads)
- [ ] T029 [US1] Create integration tests for residential calculation workflow
- [ ] T030 [US1] Add accessibility features (labels, keyboard navigation)

---

## Phase 4: [US2, US3] Commercial & Industrial (Priority: P0)

### Goal
Extend calculation engine to support commercial and industrial project types with appropriate demand factors.

### Independent Test Criteria
- Commercial calculations apply correct NEC/IEC factors
- Industrial motor load calculations follow NEC 220.50
- Results display category-specific breakdowns

### Acceptance Tests
- [ ] T031 [US2] Test scenario 1: Given commercial office inputs, When calculated, Then apply NEC 220.42 lighting factors
- [ ] T032 [US2] Test scenario 2: Given commercial receptacle loads, When calculated, Then apply 100%/50% tiered factors
- [ ] T033 [US3] Test scenario 3: Given industrial motor loads, When calculated, Then apply 125% largest + 100% others

### Implementation Tasks

- [ ] T034 [US2] Extend IECFactors.ts with commercial diversity factors
  - Office buildings: 70-80% overall
  - Retail: 80-90% overall
  
- [ ] T035 [US2] Extend NECFactors.ts with commercial demand factors
  - Lighting: 100% first 12.5kVA, then scaling (220.42)
  - Receptacles: 100% first 10kVA, 50% remainder (220.44)
  - Kitchen equipment: 65-90% based on quantity (220.56)
  
- [ ] T036 [US3] Extend NECFactors.ts with industrial demand factors
  - Motors: 125% largest + 100% others (220.50, 430.24)
  - Welding equipment: 70-85% based on duty cycle
  - Process equipment diversity
  
- [ ] T037 [US2, US3] Update CalculatorForm to show dynamic fields by project type
  - Residential: lighting, sockets, HVAC, cooking, water heating
  - Commercial: general lighting, receptacles, HVAC, elevators, kitchen
  - Industrial: motors, process equipment, lighting, HVAC, welding
  
- [ ] T038 [US3] Add MotorLoad input component for industrial projects
  - Motor name, power (kW), power factor, duty cycle
  - Largest motor identification
  
- [ ] T039 [US2, US3] Update calculation engine to handle all project types
- [ ] T040 [US2, US3] Create tests for commercial calculations
- [ ] T041 [US3] Create tests for industrial motor load calculations

---

## Phase 5: [US4] Generate Compliance Report (Priority: P1)

### Goal
Allow users to generate detailed PDF reports of demand calculations with compliance verification.

### Independent Test Criteria
- PDF contains all input parameters
- PDF shows calculation breakdown by category
- PDF includes IEC/NEC clause references
- PDF generation completes in <2 seconds

### Acceptance Tests
- [ ] T042 [US4] Test scenario 1: Given completed calculation, When export PDF clicked, Then download PDF with all sections
- [ ] T043 [US4] Test scenario 2: Given PDF generated, When opened, Then shows compliance clause references

### Implementation Tasks

- [ ] T044 [P] [US4] Create ReportPreview component in `src/components/demand-diversity/ReportPreview.tsx`
- [ ] T045 [P] [US4] Implement PDF generator in `src/services/demand-diversity/pdfGenerator.ts`
  - Title page with project info
  - Input parameters section
  - Calculation breakdown by category
  - Compliance verification table
  - Standards references
  - Disclaimer
  
- [ ] T046 [US4] Implement API endpoint POST /api/demand-diversity/generate-report
- [ ] T047 [US4] Add PDF preview in UI
- [ ] T048 [US4] Ensure PDF generation <2 seconds
- [ ] T049 [US4] Verify PDF renders correctly across browsers
- [ ] T050 [US4] Create tests for PDF generation

---

## Phase 6: [US5] Save and Load Projects (Priority: P1)

### Goal
Enable users to save calculations and reload them later for iteration and record-keeping.

### Independent Test Criteria
- User can save calculation with project name
- User can load saved calculations
- User can list their saved projects
- User can delete saved projects

### Acceptance Tests
- [ ] T051 [US5] Test scenario 1: Given completed calculation, When save clicked, Then project saved to database
- [ ] T052 [US5] Test scenario 2: Given saved projects, When list viewed, Then show all user's projects
- [ ] T053 [US5] Test scenario 3: Given saved project, When load clicked, Then populate form with saved data

### Implementation Tasks

- [ ] T054 [US5] Run database migration for demand_calculations table
- [ ] T055 [P] [US5] Implement projectStorage service in `src/services/demand-diversity/projectStorage.ts`
  - saveProject(params, result) → projectId
  - loadProject(projectId) → {params, result}
  - listProjects(userId) → ProjectSummary[]
  - deleteProject(projectId) → boolean
  
- [ ] T056 [US5] Implement API endpoints:
  - POST /api/demand-diversity/save
  - GET /api/demand-diversity/load/:id
  - GET /api/demand-diversity/list
  - DELETE /api/demand-diversity/delete/:id
  
- [ ] T057 [P] [US5] Create ProjectList component in `src/components/demand-diversity/ProjectList.tsx`
  - Display saved projects table
  - Load button for each project
  - Delete button with confirmation
  
- [ ] T058 [US5] Add Save Project button to ResultsDisplay
- [ ] T059 [US5] Add project list sidebar/modal
- [ ] T060 [US5] Create tests for save/load functionality
- [ ] T061 [US5] Create tests for project list and delete

---

## Final Phase: Polish & Cross-Cutting Concerns

### Goal
Complete the feature with professional polish, documentation, and testing.

### Implementation Tasks

- [ ] T062 Add error handling and user-friendly error messages
- [ ] T063 Implement responsive design for mobile and tablet
- [ ] T064 Add loading states and performance indicators
- [ ] T065 Create comprehensive documentation (README.md)
- [ ] T066 Perform accessibility audit and improvements
- [ ] T067 Optimize calculation performance to <100ms
- [ ] T068 Perform security review of input validation
- [ ] T069 Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] T070 Add dark/light mode support
- [ ] T071 Add tooltips and help text for all inputs
- [ ] T072 Create example calculations for each project type
- [ ] T073 Run full test suite and fix any failures
- [ ] T074 Performance profiling and optimization
- [ ] T075 Create user guide documentation

---

## Test Summary

### Unit Tests (17 files)
- IECFactors.test.ts
- NECFactors.test.ts
- calculationEngine.test.ts
- validation.test.ts
- pdfGenerator.test.ts
- projectStorage.test.ts
- CalculatorForm.test.tsx
- ResultsDisplay.test.tsx
- ComplianceTable.test.tsx
- ReportPreview.test.tsx
- ProjectList.test.tsx

### Integration Tests
- Residential calculation workflow
- Commercial calculation workflow
- Industrial calculation workflow
- Save/load round-trip
- PDF generation workflow

### E2E Tests
- User completes residential IEC calculation
- User switches standard and recalculates
- User saves project and reloads
- User exports PDF report

---

## MVP Definition

**MVP = Phase 1 + Phase 2 + Phase 3 (US1 only)**

This delivers:
- ✅ Residential demand/diversity calculations
- ✅ IEC and NEC standard support
- ✅ Accurate calculations matching examples
- ✅ Basic UI with input form and results
- ✅ Compliance clause references

**Deferred to Post-MVP**:
- Commercial calculations (Phase 4)
- Industrial calculations (Phase 4)
- PDF export (Phase 5)
- Save/load projects (Phase 6)
- Advanced UI features (Final phase)

---

**Task Author**: AI Assistant  
**Date Created**: February 22, 2026  
**Feature ID**: 007-maximum-demand-diversity  
**Total Tasks**: 75  
**MVP Tasks**: 30 (Phase 1-3 US1)
