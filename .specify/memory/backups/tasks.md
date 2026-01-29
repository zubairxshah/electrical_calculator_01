# Tasks: Lightning Arrester Calculator

**Feature**: Lightning Arrester Calculator
**Branch**: 1-lightning-arrester-calculator
**Input**: specs/1-lightning-arrester-calculator/spec.md, plan.md, data-model.md, contracts/api-contract.yaml

## Implementation Strategy

MVP scope: Complete User Story 1 (Calculate Lightning Arrester Requirements) with basic UI and core calculation functionality. This provides immediate value to users while establishing the foundational architecture for subsequent stories.

Incremental delivery approach:
- Phase 1: Project setup and foundational components
- Phase 2: Core calculation functionality (US1)
- Phase 3: PDF report generation (US2)
- Phase 4: Scenario-based recommendations (US3)
- Final Phase: Polish and cross-cutting concerns

## Dependencies

- User Story 1 (P1) must be completed before User Story 2 (P2) and User Story 3 (P3)
- Foundational components (models, validation, calculation engine) support all user stories
- UI components depend on underlying services and models

## Parallel Execution Opportunities

- UI component development can occur in parallel with service development
- Unit tests can be written in parallel with implementation
- API endpoints can be developed in parallel with frontend components
- Documentation can be created in parallel with implementation

---

## Phase 1: Setup

### Goal
Initialize project structure and foundational dependencies for the Lightning Arrester Calculator feature.

### Independent Test Criteria
- Project builds successfully with no errors
- Basic UI rendering works without crashes
- All required dependencies are installed and configured
- Development server starts without errors

### Implementation Tasks

- [x] T001 Create project structure per implementation plan in src/components/lightning-arrester/, src/services/lightning-arrester/, src/models/, src/constants/
- [x] T002 Install and configure TypeScript 5.3, React 18, Next.js 14 dependencies
- [x] T003 Install and configure Math.js library for precise calculations in src/lib/math.ts
- [x] T004 Install and configure jsPDF for PDF generation in src/services/lightning-arrester/pdfGenerator.ts
- [x] T005 [P] Create LightningArrester model in src/models/LightningArrester.ts
- [x] T006 [P] Create CalculationParameters model in src/models/CalculationParameters.ts
- [x] T007 [P] Create ComplianceResult model in src/models/ComplianceResult.ts
- [x] T008 Create constants file for standards in src/constants/standards.ts
- [ ] T009 Set up testing framework (Jest) with calculation accuracy tests

---

## Phase 2: Foundational Components

### Goal
Implement core services and validation logic that support all user stories for the Lightning Arrester Calculator.

### Independent Test Criteria
- Calculation engine produces accurate results per IEC 60099-4 standards
- Validation logic properly rejects invalid inputs
- Standards compliance checks work correctly
- Real-time validation responds within 100ms

### Implementation Tasks

- [x] T010 [P] Implement calculation engine for IEC 60099-4 formulas in src/services/lightning-arrester/calculationEngine.ts
- [x] T011 [P] Implement validation service for input parameters in src/services/lightning-arrester/validation.ts
- [x] T012 [P] Implement standards compliance service for IEC/NEC checks in src/services/lightning-arrester/standardsCompliance.ts
- [x] T013 [P] Create utility functions for units conversion in src/services/utils/unitsConverter.ts
- [x] T014 [P] Create math utility functions in src/services/utils/mathUtils.ts
- [x] T015 [P] Implement test-first approach with published standard examples for calculation accuracy
- [x] T016 Create unit tests for calculation engine with IEC 60099-4 compliance
- [x] T017 Create unit tests for validation service with boundary and error cases

---

## Phase 3: [US1] Calculate Lightning Arrester Requirements (Priority: P1)

### Goal
Enable electrical engineers to determine appropriate lightning arrester type and specifications based on system voltage, environmental conditions, and compliance requirements.

### Independent Test Criteria
- User can input system voltage, structure type, and environmental conditions
- System displays recommended arrester type, rating, and compliance status with IEC/NEC standards
- Different arrester types (Conventional, ESE, MOV) validate parameters according to IEC 60099-4 standards
- Compliance with NEC 2020/2023 requirements for Type 1/2 SPD installations is verified

### Acceptance Tests
- [ ] T018 [US1] Test scenario 1: Given user inputs system voltage, structure type, and environmental conditions, When user submits the calculation, Then system displays recommended arrester type, rating, and compliance status with IEC/NEC standards
- [ ] T019 [US1] Test scenario 2: Given user selects different arrester types (Conventional, ESE, MOV), When user reviews recommendations, Then system validates parameters according to IEC 60099-4 standards
- [ ] T020 [US1] Test scenario 3: Given user selects compliance requirement (Type 1 or Type 2 SPD per NEC), When user calculates requirements, Then system validates compliance with NEC 2020/2023 requirements

### Implementation Tasks

- [x] T021 [P] [US1] Create CalculatorForm component in src/components/lightning-arrester/CalculatorForm.tsx
- [x] T022 [P] [US1] Create ResultsDisplay component in src/components/lightning-arrester/ResultsDisplay.tsx
- [x] T023 [P] [US1] Create ComplianceBadge component in src/components/lightning-arrester/ComplianceBadge.tsx
- [x] T024 [US1] Implement API endpoint POST /api/lightning-arrester/calculate in app/api/lightning-arrester/calculate/route.ts
- [x] T025 [US1] Connect CalculatorForm to calculation engine and validation service
- [x] T026 [US1] Display real-time validation warnings for unusual voltage values
- [x] T027 [US1] Ensure all environmental conditions are required for calculations
- [x] T028 [US1] Handle case where no compliant arrester type is available with appropriate warnings
- [x] T029 [US1] Implement real-time validation with <100ms response time
- [x] T030 [US1] Display compliance status badges (IEC, NEC) when requirements are met
- [x] T031 [US1] Create integration tests for the entire calculation workflow
- [x] T032 [US1] Add accessibility features for calculator UI components

---

## Phase 4: [US2] Generate Compliance Report (Priority: P2)

### Goal
Allow users to generate detailed PDF reports of lightning arrester calculations and compliance verification for documentation and audit purposes.

### Independent Test Criteria
- User can generate PDF report containing all input parameters, recommendations, and compliance validation results
- PDF contains installation notes and diagrams relevant to the recommended arrester type
- Report includes all required information for professional audit purposes

### Acceptance Tests
- [ ] T033 [US2] Test scenario 1: Given calculation results are displayed, When user clicks "Export PDF" button, Then system generates a PDF report with inputs summary, recommended arrester type, compliance checklist, and validation results
- [ ] T034 [US2] Test scenario 2: Given user has completed a calculation, When user downloads the report, Then PDF contains installation notes and diagrams relevant to the recommended arrester type

### Implementation Tasks

- [x] T035 [P] [US2] Create ReportPreview component in src/components/lightning-arrester/ReportPreview.tsx
- [x] T036 [P] [US2] Implement PDF generator service in src/services/lightning-arrester/pdfGenerator.ts
- [x] T037 [US2] Implement API endpoint POST /api/lightning-arrester/generate-report in app/api/lightning-arrester/generate-report/route.ts
- [x] T038 [US2] Format PDF report with all input parameters, calculations, and compliance status
- [x] T039 [US2] Include standard references and formula citations in PDF report
- [x] T040 [US2] Add calculation timestamps and system version to PDF report
- [x] T041 [US2] Include professional disclaimer text in PDF report
- [x] T042 [US2] Add installation notes and diagrams to PDF report based on recommended arrester type
- [x] T043 [US2] Ensure PDF generation completes in under 2 seconds
- [x] T044 [US2] Verify PDF renders correctly across Chrome, Firefox, Safari, and Edge browsers
- [x] T045 [US2] Create tests for PDF generation with various input scenarios

---

## Phase 5: [US3] Select Arrester Based on Structure Type (Priority: P3)

### Goal
Provide scenario-based recommendations for different types of structures (homes, towers, industrial facilities, traction systems).

### Independent Test Criteria
- User can select structure type (home, tower, industry, traction)
- System provides appropriate arrester recommendations for each scenario
- Recommendations follow industry best practices for each structure type

### Acceptance Tests
- [ ] T046 [US3] Test scenario 1: Given user selects "Home" structure type, When calculation is performed, Then system recommends conventional rods with NEC Type 1 SPD
- [ ] T047 [US3] Test scenario 2: Given user selects "Tower" structure type, When calculation is performed, Then system recommends ESE rods with NEC Type 2 SPD
- [ ] T048 [US3] Test scenario 3: Given user selects "Industrial" structure type, When calculation is performed, Then system recommends MOV arresters with NEC Type 2 SPD

### Implementation Tasks

- [x] T049 [US3] Extend calculation engine to include structure-type-specific recommendations
- [x] T050 [US3] Update CalculatorForm to include structure type selection
- [x] T051 [US3] Implement scenario-based logic for home structures (conventional rods + Type 1 SPD)
- [x] T052 [US3] Implement scenario-based logic for tower structures (ESE rods + Type 2 SPD)
- [x] T053 [US3] Implement scenario-based logic for industrial structures (MOV arresters + Type 2 SPD)
- [x] T054 [US3] Implement scenario-based logic for traction systems (MOV arresters with high cantilever strength)
- [x] T055 [US3] Add visual indicators for different structure types in UI
- [x] T056 [US3] Create tests for structure-specific recommendation logic
- [x] T057 [US3] Update compliance validation for structure-specific requirements

---

## Final Phase: Polish & Cross-Cutting Concerns

### Goal
Complete the feature with professional polish, documentation, and cross-cutting concerns.

### Implementation Tasks

- [x] T058 Add error handling and user-friendly error messages throughout the application
- [x] T059 Implement responsive design for mobile and tablet devices
- [x] T060 Add loading states and performance indicators for calculations
- [x] T061 Create comprehensive documentation for the Lightning Arrester Calculator
- [x] T062 Perform accessibility audit and implement necessary improvements
- [x] T063 Optimize calculation performance to ensure <100ms response times
- [x] T064 Conduct security review of input validation and sanitization
- [x] T065 Perform cross-browser testing and fix any compatibility issues
- [ ] T066 Add analytics and usage tracking for the calculator feature
- [ ] T067 Create user help documentation and tooltips for calculator inputs