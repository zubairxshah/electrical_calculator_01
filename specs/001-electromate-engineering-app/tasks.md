# Tasks: ElectroMate Engineering Web Application

**Input**: Design documents from `/specs/001-electromate-engineering-app/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: This project uses Test-Driven Development (TDD) per Constitution Principle V. Tests are MANDATORY for all P1 calculations (Battery, UPS, Cable Sizing) and must be written BEFORE implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `app/` for Next.js routes, `lib/` for business logic, `components/` for UI, `stores/` for Zustand state
- All paths relative to repository root: `D:\prompteng\elec_calc\`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Next.js 15 project with App Router and TypeScript in current directory
- [X] T002 Install core dependencies: next@15, react@19, typescript@5, mathjs@13, zustand@5, jspdf@3, recharts@2, better-auth, drizzle-orm, @neondatabase/serverless, tailwindcss@3, zod, nuqs
- [X] T003 [P] Create tsconfig.json with strict mode and path aliases (@/ for src)
- [X] T004 [P] Create next.config.js with App Router configuration
- [X] T005 [P] Create tailwind.config.ts with custom theme for professional engineering design
- [X] T006 [P] Create drizzle.config.ts for Neon PostgreSQL connection
- [X] T007 [P] Create vitest.config.ts for unit/integration testing
- [X] T008 [P] Create playwright.config.ts for E2E testing
- [X] T009 Create .env.local.example template with NEON_DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL placeholders

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Math.js & Core Utilities (CRITICAL - All calculations depend on these)

- [X] T010 Create lib/mathConfig.ts with Math.js BigNumber configuration (64-digit precision) per ADR-003
- [X] T011 [P] Create lib/unitConversion.ts with SI ↔ NEC unit conversion functions (mm² ↔ AWG, meters ↔ feet, °C ↔ °F)
- [X] T012 [P] Create types/calculations.ts with shared calculation input/output interfaces
- [X] T013 [P] Create types/validation.ts with ValidationResult, ValidationWarning interfaces
- [X] T014 [P] Create types/standards.ts with StandardReference interface

### shadcn/ui Component Installation

- [X] T015 [P] Install shadcn/ui CLI and initialize with default configuration
- [X] T016 [P] Install Button component in components/ui/button.tsx
- [X] T017 [P] Install Input component in components/ui/input.tsx
- [X] T018 [P] Install Card component in components/ui/card.tsx
- [X] T019 [P] Install Alert component in components/ui/alert.tsx
- [X] T020 [P] Install Select component in components/ui/select.tsx
- [X] T021 [P] Install Tooltip component in components/ui/tooltip.tsx
- [X] T022 [P] Install Label component in components/ui/label.tsx

### Layout Components (Global UI Structure)

- [X] T023 Create components/layout/Sidebar.tsx with navigation links (Battery, UPS, Solar, Cables) and engineering-themed design
- [X] T024 [P] Create components/layout/Header.tsx with unit system toggle (SI/NEC)
- [X] T025 [P] Create components/layout/Footer.tsx with "MZS CodeWorks" branding and engineering logo placeholder
- [X] T026 Create app/layout.tsx root layout with Sidebar, Header, BetterAuth provider integration
- [X] T027 Create app/page.tsx landing page with feature overview and navigation cards

### Authentication & Database

- [X] T028 Create lib/schema.ts with Drizzle ORM schemas (users, calculationSessions, projects tables) per data-model.md
- [X] T029 Create lib/db.ts with Neon PostgreSQL client configuration using Drizzle
- [X] T030 Create lib/auth.ts with BetterAuth configuration (email/password, session management)
- [X] T031 Create app/api/auth/[...nextauth]/route.ts for BetterAuth endpoints
- [ ] T032 Run drizzle-kit push to create database tables in Neon PostgreSQL

### Shared Utilities & Hooks

- [X] T033 Create lib/pdfGenerator.ts with jsPDF wrapper function (generateCalculationPDF) supporting inputs, formulas, results, charts, standard references per ADR-004
- [X] T034 Create lib/migrationService.ts with migrateLocalStorageToDatabase function for FR-016b compliance
- [X] T035 [P] Create hooks/useValidation.ts with debounced real-time validation hook (300ms debounce, <100ms validation target)
- [X] T036 [P] Create hooks/useChartExport.ts with html2canvas integration for Recharts → Canvas conversion
- [X] T037 [P] Create hooks/useLocalStorage.ts with storage quota monitoring utilities
- [X] T038 Create lib/standards/references.ts with StandardReference data (IEEE 485, IEEE 1100, NEC 2020, IEC 60364, NREL)

### Shared Calculator Components

- [X] T039 [P] Create components/shared/CalculationCard.tsx wrapper component for calculator UI
- [X] T040 [P] Create components/shared/InputField.tsx with real-time validation feedback and unit display
- [X] T041 [P] Create components/shared/ResultDisplay.tsx with formatted results and standard references
- [X] T042 [P] Create components/shared/WarningBanner.tsx with severity levels (danger/warning/info) and red highlighting for FR-004
- [X] T043 [P] Create components/shared/PDFDownloadButton.tsx integrated with lib/pdfGenerator.ts
- [X] T044 [P] Create components/shared/StorageWarningBanner.tsx for localStorage quota warnings per FR-016a

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Battery Backup Time Calculator (Priority: P1) 🎯 MVP

**Goal**: Engineers can calculate battery backup time per IEEE 485 with real-time validation, discharge curve visualization, and PDF export

**Independent Test**: Input battery specs (48V, 200Ah, 2000W load, 0.9 efficiency, 0.8 aging factor) → System displays backup time 3.46 hours ±2% (IEEE 485 Example 4.2.1) with discharge curve chart and generates professional PDF report

### Tests for User Story 1 (TDD - Red Phase) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T045 [P] [US1] Write battery backup time test in __tests__/unit/calculations/battery.test.ts validating IEEE 485 Example 4.2.1 (3.456 hours ±2% tolerance)
- [X] T046 [P] [US1] Write discharge rate validation test in __tests__/unit/calculations/battery.test.ts checking C-rate >1C warning
- [X] T047 [P] [US1] Write battery input validation test in __tests__/unit/validation/batteryValidation.test.ts for FR-002 (positive non-zero values)

### Implementation for User Story 1 (TDD - Green Phase)

- [X] T048 [P] [US1] Implement calculateBatteryBackupTime in lib/calculations/battery/backupTime.ts using Math.js BigNumber with formula T = (V × Ah × η × aging) / P per IEEE 485
- [X] T049 [P] [US1] Implement calculateDischargeRate in lib/calculations/battery/dischargeRate.ts with C-rate formula
- [X] T050 [P] [US1] Implement generateDischargeCurve in lib/calculations/battery/dischargeCurve.ts using Peukert's Law approximation
- [X] T051 [US1] Create batteryInputsSchema in lib/validation/batteryValidation.ts with Zod validation (voltage 1-2000V, ampHours 1-10000Ah, loadWatts 1-1000000W, efficiency 0.1-1.0, agingFactor 0.5-1.0)
- [X] T052 [US1] Create validateBatteryInputs function in lib/validation/batteryValidation.ts checking dangerous conditions (C-rate >1C, efficiency >100%) per FR-004
- [X] T053 [US1] Create batteryStore.ts in stores/ with Zustand persist middleware storing voltage, ampHours, loadWatts, efficiency, agingFactor in localStorage key "electromate-battery"
- [X] T054 [US1] Create app/battery/page.tsx Server Component with metadata and BatteryCalculator import
- [X] T055 [US1] Create app/battery/BatteryCalculator.tsx Client Component with input fields, real-time validation, result display, and PDF download button
- [X] T056 [US1] Create components/charts/BatteryDischargeChart.tsx with Recharts LineChart showing voltage and SOC over time
- [X] T057 [US1] Integrate batteryStore with BatteryCalculator component using Zustand selectors for real-time updates
- [X] T058 [US1] Add real-time validation to BatteryCalculator using useValidation hook with 300ms debounce
- [X] T059 [US1] Integrate PDF generation in BatteryCalculator with chart export using useChartExport hook
- [X] T060 [US1] Add navigation link to battery calculator in components/layout/Sidebar.tsx

### TDD Validation (Refactor Phase)

- [X] T061 [US1] Run battery calculation tests and verify all pass (IEEE 485 accuracy ±2%, validation rules enforced)
- [ ] T062 [US1] Profile validation performance and confirm <100ms response time per SC-002

**Checkpoint**: At this point, User Story 1 (Battery Calculator) should be fully functional, tested, and independently deployable as MVP

---

## Phase 4: User Story 2 - UPS Sizing Tool (Priority: P1)

**Goal**: Engineers can size UPS systems with automatic diversity factors per IEEE 1100, load list management, and 25% growth margin

**Independent Test**: Create load list (5 servers @ 500W each, 10 switches @ 100W each) → System calculates total load, applies IEEE 1100 diversity factor, adds 25% growth margin, recommends standard UPS kVA with detailed breakdown

### Tests for User Story 2 (TDD - Red Phase) ⚠️

- [X] T063 [P] [US2] Write UPS diversity factor test in __tests__/unit/calculations/ups.test.ts validating IEEE 1100 formula (N≤3: diversity=1.0, 3<N≤10: diversity=0.9+0.1/N, N>10: diversity=0.85)
- [X] T064 [P] [US2] Write power factor conversion test in __tests__/unit/calculations/ups.test.ts for VA ↔ W calculations with 0.8 default
- [X] T065 [P] [US2] Write UPS sizing test in __tests__/unit/calculations/ups.test.ts validating 25% growth margin application

### Implementation for User Story 2 (TDD - Green Phase)

- [X] T066 [P] [US2] Implement calculateDiversityFactor in lib/calculations/ups/diversityFactor.ts per IEEE 1100 Emerald Book guidelines
- [X] T067 [P] [US2] Implement convertPowerFactor in lib/calculations/ups/powerFactor.ts handling VA/Watts/PF relationships with 0.8 default per FR-011
- [X] T068 [US2] Implement calculateUPSSizing in lib/calculations/ups/sizing.ts integrating diversity, power factor, growth margin (25%), standard UPS sizes [10, 20, 30, 40, 60, 80, 100, 120, 160, 200] kVA
- [X] T069 [US2] Create upsInputsSchema in lib/validation/upsValidation.ts with Zod validation for LoadItem array (powerVA/powerWatts nullable but one required, powerFactor 0.1-1.0, quantity ≥1)
- [X] T070 [US2] Create validateUPSInputs function in lib/validation/upsValidation.ts warning for unusual power factors (<0.7 or >0.95)
- [X] T071 [US2] Create upsStore.ts in stores/ with Zustand persist managing loads array, growthMargin, and calculated results in localStorage key "electromate-ups"
- [X] T072 [US2] Create app/ups/page.tsx Server Component with metadata and UPSSizingTool import
- [X] T073 [US2] Create app/ups/UPSSizingTool.tsx Client Component with dynamic load list (add/remove loads), load editor modal, results display showing total load, diversity factor, effective load, with growth, recommended UPS kVA
- [X] T074 [US2] Create components/charts/UPSLoadChart.tsx with Recharts BarChart showing load breakdown by equipment type
- [X] T075 [US2] Create app/api/calculations/ups/route.ts with GET/POST endpoints per contracts/ups.openapi.yaml
- [X] T076 [US2] Integrate PDF generation in UPSSizingTool with load breakdown table, diversity factor calculation details, standard references (IEEE 1100, IEC 62040)
- [X] T077 [US2] Add navigation link to UPS calculator in components/layout/Sidebar.tsx
- [X] T078 [US2] Run UPS calculation tests and verify IEEE 1100 diversity factors calculate correctly

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Voltage Drop Calculator with Cable Sizing (Priority: P1)

**Goal**: Engineers can calculate voltage drop and select cable sizes with NEC/IEC compliance, derating factors, and red highlighting for violations >3%

**Independent Test**: Input circuit (50A current, 100m length, copper conductor, conduit installation, 30°C ambient) → System calculates voltage drop, applies derating factors, recommends cable size, flags violations in red if >3%

### Tests for User Story 3 (TDD - Red Phase) ⚠️

- [X] T079 [P] [US3] Write voltage drop calculation test in __tests__/unit/calculations/cables.test.ts validating formula V_drop = I × L × (mV/A/m) / 1000 against IEC 60364 examples
- [X] T080 [P] [US3] Write cable ampacity lookup test in __tests__/unit/calculations/cables.test.ts verifying NEC Table 310.15(B)(16) data accuracy
- [X] T081 [P] [US3] Write derating factor test in __tests__/unit/calculations/cables.test.ts validating temperature and grouping corrections per NEC 310.15(B)(2)(a)

### Standards Data (Reference Tables)

- [X] T082 [P] [US3] Create lib/standards/cableTables.ts with NEC Table 310.15(B)(16) copper/aluminum ampacity data (1.5mm² to 500mm² / 14 AWG to 600 kcmil) with resistance values (mV/A/m and Ω/1000ft)
- [X] T083 [P] [US3] Create lib/standards/deratingTables.ts with temperature correction factors (NEC 310.15(B)(2)(a), IEC 60364-5-52 Table B.52.14) and grouping factors
- [X] T084 [P] [US3] Add IEC 60364-5-52 cable data to lib/standards/cableTables.ts for dual standards support per FR-007a

### Implementation for User Story 3 (TDD - Green Phase)

- [X] T085 [P] [US3] Implement calculateVoltageDrop in lib/calculations/cables/voltageDrop.ts using Math.js BigNumber with formula V_drop = I × L × R per NEC/IEC 60364
- [X] T086 [P] [US3] Implement lookupCableAmpacity in lib/calculations/cables/ampacity.ts with table lookup from lib/standards/cableTables.ts
- [X] T087 [P] [US3] Implement calculateDeratingFactors in lib/calculations/cables/deratingFactors.ts applying temperature and grouping corrections
- [X] T088 [US3] Implement recommendCableSize in lib/calculations/cables/cableSizing.ts integrating voltage drop check (3% limit per FR-009), ampacity check with derating, and cable size suggestions
- [X] T089 [US3] Create cableInputsSchema in lib/validation/cableValidation.ts with Zod validation including systemVoltage enum (120V, 208V, 240V, 277V, 480V, 600V, 2.4kV, 4.16kV, 13.8kV, 12V, 24V, 48V, 125V, 250V, up to 1500V DC) per FR-007a
- [X] T090 [US3] Create validateCableInputs function in lib/validation/cableValidation.ts checking dangerous conditions (voltage drop >10%, current exceeds derated ampacity)
- [X] T091 [US3] Create cableStore.ts in stores/ with Zustand persist managing systemVoltage, current, length, conductorMaterial, installationMethod, ambientTemp in localStorage key "electromate-cable"
- [X] T092 [US3] Create app/cables/page.tsx Server Component with metadata and CableSizingTool import
- [X] T093 [US3] Create app/cables/CableSizingTool.tsx Client Component with voltage dropdown (organized by LV AC/MV/DC categories), cable size selector from standards tables, results display with red highlighting for >3% violations
- [X] T094 [US3] Create app/api/calculations/cables/route.ts with GET/POST endpoints per contracts/cable.openapi.yaml
- [X] T095 [US3] Integrate PDF generation in CableSizingTool with derating factor breakdown, voltage drop percentage, cable size recommendation, standard references (NEC Table 310.15(B)(16), IEC 60364-5-52)
- [X] T096 [US3] Add navigation link to cable calculator in components/layout/Sidebar.tsx
- [x] T097 [US3] Run cable calculation tests and verify voltage drop ±0.1% accuracy per SC-004, ampacity 100% compliance per SC-009

**Checkpoint**: All P1 user stories (Battery, UPS, Cable Sizing) should now be independently functional

---

## Phase 6: User Story 4 - Solar Panel Array Sizing (Priority: P2)

**Goal**: Engineers can size solar arrays with Peak Sun Hours (PSH), performance ratio (PR), and panel specifications to meet daily energy targets

**Independent Test**: Input energy requirement (10 kWh/day), location PSH (5 hours), panel specs (300W, 20% efficiency), performance ratio (0.75) → System calculates required panels, total array power, estimated daily/annual generation, roof area

### Implementation for User Story 4

- [X] T098 [P] [US4] Write solar array sizing test in __tests__/unit/calculations/solar.test.ts validating formula: Panels = Daily_kWh / (Panel_kW × PSH × PR)
- [X] T099 [P] [US4] Implement calculateSolarArraySize in lib/calculations/solar/arraySize.ts using Math.js BigNumber
- [X] T100 [P] [US4] Implement calculatePerformanceRatio in lib/calculations/solar/performanceRatio.ts with PR range validation (warn if <0.6 or >0.9, typical 0.7-0.85)
- [X] T101 [US4] Create solarInputsSchema in lib/validation/solarValidation.ts with Zod validation (dailyEnergyKWh 0.1-100000, peakSunHours 1-12, panelWattage 50-1000, performanceRatio 0.5-1.0)
- [X] T102 [US4] Create solarStore.ts in stores/ with Zustand persist in localStorage key "electromate-solar"
- [X] T103 [US4] Create app/solar/page.tsx Server Component
- [X] T104 [US4] Create app/solar/SolarArrayCalculator.tsx Client Component with PSH input, panel specs, PR slider, results showing panel count, array power, daily/annual generation, area requirements
- [X] T105 [US4] Create components/charts/SolarGenerationChart.tsx with Recharts AreaChart showing estimated monthly generation
- [X] T106 [US4] Create app/api/calculations/solar/route.ts with GET/POST endpoints per contracts/solar.openapi.yaml
- [X] T107 [US4] Integrate PDF generation in SolarArrayCalculator with standard references (NREL)
- [X] T108 [US4] Add navigation link to solar calculator in components/layout/Sidebar.tsx

---

## Phase 7: User Story 5 - MPPT/PWM Charge Controller Selection (Priority: P2)

**Goal**: Engineers can match solar array specifications (V_oc, I_sc) to appropriate charge controllers with safety margins (125% V_oc rating)

**Independent Test**: Input array specs (8 panels × 40V V_oc = 320V, 8 panels × 9A I_sc = 72A) → System recommends MPPT/PWM controllers with ratings exceeding array specs by 20-25% safety margin, explains efficiency gains for MPPT when voltage mismatch >20%

### Implementation for User Story 5

- [X] T109 [P] [US5] Implement recommendChargeController in lib/calculations/solar/chargeController.ts with V_oc safety margin (controller rating ≥ 125% array V_oc per FR-013), I_sc safety margin (20-25%), MPPT vs PWM recommendation logic (MPPT if voltage mismatch >20%)
- [X] T110 [P] [US5] Create charge controller validation with Zod schema checking V_oc and I_sc ranges
- [X] T111 [US5] Create app/charge-controller/page.tsx Server Component
- [X] T112 [US5] Create app/charge-controller/ChargeControllerTool.tsx Client Component with array V_oc/I_sc inputs, battery voltage input, controller recommendations table with MPPT/PWM comparison
- [X] T113 [US5] Integrate PDF generation in ChargeControllerTool with safety margin calculations, MPPT vs PWM efficiency comparison
- [X] T114 [US5] Add navigation link to charge controller tool in components/layout/Sidebar.tsx

---

## Phase 8: User Story 6 - Battery Type Comparison Tool (Priority: P3)

**Goal**: Engineers can compare battery technologies (VRLA, Li-Ion, NiCd) across lifespan, temperature tolerance, DoD, cycle life, maintenance

**Independent Test**: Select application type "UPS - data center" → System displays comparison table with VRLA (5-7 years, 20-25°C optimal, 50% DoD), Li-Ion (10-15 years, wider temp, 80% DoD), NiCd (15-20 years, extreme temp, 80% DoD) with tooltips for technical terms

### Implementation for User Story 6

- [X] T115 [P] [US6] Create lib/standards/batteryTypes.ts with reference data for VRLA, Lithium-Ion, NiCd (lifespan years, temperature range °C, recommended DoD %, cycle life, maintenance requirements, relative cost index)
- [X] T116 [US6] Create app/battery-comparison/page.tsx Server Component
- [X] T117 [US6] Create app/battery-comparison/BatteryComparisonTable.tsx Client Component with comparison table, application context selector, filtering by temperature/DoD requirements, tooltips explaining DoD/cycle life/temperature coefficient
- [X] T118 [US6] Add PDF export for battery comparison with selected application context and highlighted recommendations
- [X] T119 [US6] Add navigation link to battery comparison in components/layout/Sidebar.tsx

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T120 [P] Optimize PDF generation by implementing Web Worker in workers/pdfWorker.ts for reports >1 second generation time
- [ ] T121 [P] Profile real-time validation across all calculators and optimize if any exceed 100ms target (add memoization, reduce calculation frequency)
- [ ] T122 [P] Add integration test for localStorage persistence in __tests__/integration/localStorage.test.ts verifying 50+ calculation sessions support per SC-007
- [ ] T123 [P] Add integration test for localStorage → PostgreSQL migration in __tests__/integration/migration.test.ts validating FR-016b seamless migration
- [ ] T124 [P] Add E2E test in __tests__/e2e/batteryCalculator.spec.ts using Playwright for full user workflow (input → validation → calculation → PDF download)
- [ ] T125 Test PDF rendering in Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ and verify 95% success rate per SC-003
- [ ] T126 [P] Add WCAG 2.1 Level AA accessibility attributes (ARIA labels, keyboard navigation, screen reader support) to all calculator components
- [ ] T127 Create README.md with project overview, setup instructions (reference quickstart.md), architecture diagram, contribution guidelines

---

## Phase 10: Constitution Compliance Verification

**Purpose**: Validate implementation against constitutional principles (`.specify/memory/constitution.md`)

### Calculation Accuracy Validation

- [ ] T128 [P] Verify battery backup time calculation against IEEE 485-2020 Example 4.2.1 and confirm ±2% tolerance (SC-005)
- [ ] T129 [P] Verify voltage drop calculation against IEC 60364 published examples and confirm ±0.1% tolerance (SC-004)
- [ ] T130 [P] Verify cable ampacity lookups match NEC Table 310.15(B)(16) exactly (100% compliance per SC-009)
- [ ] T131 [P] Document standard versions in code comments (IEEE 485-2020, IEEE 1100-2020, NEC 2020, IEC 60364-5-52:2009, IEC 62040-3:2021, BS 7671:2018)

### Safety Validation

- [ ] T132 [P] Test dangerous condition detection for discharge rate >1C (VRLA) and verify red warning banner displays
- [ ] T133 [P] Test voltage drop >3% red highlighting and verify warning message includes NEC/IEC reference
- [ ] T134 [P] Test efficiency >100% validation and verify error prevents calculation
- [ ] T135 Profile validation performance across all calculators and confirm <100ms average (log any exceeding 100ms for optimization)

### Standards Compliance

- [ ] T136 [P] Verify all calculation results display applicable standard (e.g., "per IEEE 485-2020")
- [ ] T137 [P] Test PDF reports include standard references section with version numbers and section citations
- [ ] T138 Verify disclaimer text appears on every PDF: "Calculations for informational purposes. PE stamp/certification is user's responsibility."

### Test Coverage Verification

- [ ] T139 Review test coverage for P1 calculations (Battery, UPS, Cables) and verify TDD workflow followed (Red-Green-Refactor documented in test commits)
- [ ] T140 Verify test coverage includes nominal, boundary, edge, error cases per Constitution Principle V

### Professional Documentation

- [ ] T141 [P] Test PDF export in Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ and verify 95% success rate (SC-003)
- [ ] T142 [P] Verify PDF reports include all required elements (inputs, formulas, results, charts, standard references, timestamp, disclaimer, MZS CodeWorks footer)
- [ ] T143 Test "Show Calculation Details" mode displays formula derivations and intermediate values

### Progressive Enhancement Verification

- [ ] T144 Confirm Battery Calculator (US1) works independently without UPS or Cables
- [ ] T145 Confirm UPS Sizing (US2) works independently without Battery or Cables
- [ ] T146 Confirm Cable Sizing (US3) works independently without Battery or UPS
- [ ] T147 Validate no dependencies on incomplete P2/P3 features from P1 calculators

### Security & Code Quality

- [ ] T148 [P] Run grep for hardcoded secrets/API keys and verify none exist (all in .env.local)
- [ ] T149 [P] Verify all numerical inputs validated with Zod schemas (positive, non-zero, within physical limits)
- [ ] T150 Test BetterAuth authentication flow (register, login, logout, session management)
- [ ] T151 Verify 2-year data retention policy implementation with 30-day deletion warnings per FR-017a

### Dual Standards Support

- [ ] T152 [P] Test unit conversion accuracy between SI (mm²) and NEC (AWG) cable sizes and verify precision preserved
- [ ] T153 [P] Test unit conversion between meters and feet for cable length with Math.js BigNumber precision
- [ ] T154 Verify voltage system dropdown includes all specified voltages: LV AC (120V-600V), MV (2.4kV-13.8kV), DC (12V-1500V) per FR-007a
- [ ] T155 Test cable table lookups work for both IEC 60364-5-52 and NEC Table 310.15(B)(16) standards

**Checkpoint**: Constitution compliance verified - ready for code review and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5, P1)**: All depend on Foundational phase completion
  - User Story 1, 2, 3 can proceed in parallel (different routes, no shared files)
  - Or sequentially in priority order (Battery → UPS → Cables)
- **User Stories (Phase 6-7, P2)**: Can start after Foundational, independent of P1
- **User Story (Phase 8, P3)**: Can start after Foundational, independent of P1/P2
- **Polish (Phase 9)**: Depends on desired user stories being complete
- **Constitution Compliance (Phase 10)**: Depends on all implemented features

### User Story Dependencies

- **User Story 1 (Battery - P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (UPS - P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (Cables - P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (Solar - P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 5 (Charge Controller - P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 6 (Battery Comparison - P3)**: Can start after Foundational - No dependencies on other stories

### Within Each User Story (TDD Workflow)

- **Tests MUST be written FIRST** and FAIL before implementation (Red)
- Models/calculations implemented to pass tests (Green)
- Refactoring for performance/clarity (Refactor)
- Story complete before moving to next priority

### Parallel Opportunities

**Within Setup (Phase 1):**
- T003, T004, T005, T006, T007, T008 can run in parallel (different config files)

**Within Foundational (Phase 2):**
- T011-T014 (types) can run in parallel
- T016-T022 (shadcn/ui components) can run in parallel
- T024-T025 (Header, Footer) can run in parallel
- T035-T037 (hooks) can run in parallel
- T039-T044 (shared components) can run in parallel

**Within User Story 1 (Phase 3):**
- T045-T047 (tests) can run in parallel
- T048-T050 (calculation modules) can run in parallel

**Across User Stories (After Foundational):**
- Phase 3 (US1), Phase 4 (US2), Phase 5 (US3) can run in parallel if multiple developers
- Phase 6 (US4), Phase 7 (US5) can run in parallel
- Different user stories use different routes, stores, components (no file conflicts)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (~8 tasks)
2. Complete Phase 2: Foundational (~25 tasks)
3. Complete Phase 3: User Story 1 (~15 tasks)
4. **STOP and VALIDATE**: Test Battery Calculator independently
   - Manual testing: Input 48V, 200Ah, 2000W → Verify 3.46 hours ±2%
   - Automated tests: Run __tests__/unit/calculations/battery.test.ts
   - PDF export: Generate report and verify formatting
   - localStorage: Refresh browser and verify calculation persists
5. Deploy MVP if validation successful

**MVP Task Count**: ~48 tasks (Setup + Foundational + US1)

### Incremental Delivery (All P1 Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Battery) → Test independently → Deploy (MVP!)
3. Add User Story 2 (UPS) → Test independently → Deploy
4. Add User Story 3 (Cables) → Test independently → Deploy
5. **STOP and VALIDATE**: All P1 calculators functional
6. Proceed to P2 stories (Solar, Charge Controller) or Polish

**P1 Complete Task Count**: ~78 tasks (Setup + Foundational + US1 + US2 + US3)

### Full Platform (All 6 User Stories)

1. Complete P1 stories (Battery, UPS, Cables)
2. Add P2 stories (Solar Array, Charge Controller)
3. Add P3 story (Battery Comparison)
4. Complete Polish phase
5. Complete Constitution Compliance verification
6. **FINAL VALIDATION**: All acceptance scenarios from spec.md
7. Deploy production

**Full Platform Task Count**: ~155 tasks

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (~33 tasks)
2. Once Foundational is done:
   - Developer A: User Story 1 (Battery) - T045-T062
   - Developer B: User Story 2 (UPS) - T063-T078
   - Developer C: User Story 3 (Cables) - T079-T097
3. Stories complete and integrate independently (no conflicts)
4. Team proceeds to P2 stories in parallel
5. Team completes Polish + Compliance together

---

## Notes

- **[P] tasks** = different files, no dependencies (can run in parallel)
- **[Story] label** = maps task to specific user story for traceability (US1, US2, US3, US4, US5, US6)
- **Each user story** should be independently completable and testable per Constitution Principle VII (Progressive Enhancement)
- **TDD mandatory** for P1 calculations (Battery, UPS, Cables) per Constitution Principle V
- **Verify tests FAIL** before implementing (Red phase)
- **Commit after each task** or logical group for granular history
- **Stop at any checkpoint** to validate story independently before proceeding
- **Constitution Compliance phase** (Phase 10) validates all 7 constitutional principles before production deployment

**Avoid**:
- Vague tasks without file paths
- Tasks modifying same file (creates conflicts if parallel)
- Cross-story dependencies that break independence
- Skipping tests for P1 calculations (violates Constitution)

---

**Total Tasks**: 155 (Setup: 9, Foundational: 36, US1: 18, US2: 16, US3: 19, US4: 11, US5: 6, US6: 5, Polish: 8, Compliance: 27)

**MVP Tasks**: 48 (Setup + Foundational + US1)

**P1 Complete**: 78 (Setup + Foundational + US1 + US2 + US3)

**Next Command**: Begin implementation with `npm install` or proceed with task execution
