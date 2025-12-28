# Implementation Plan: Circuit Breaker Sizing Calculator

**Branch**: `003-circuit-breaker-sizing` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-circuit-breaker-sizing/spec.md`

**Note**: This plan implements a professional-grade Circuit Breaker Sizing Calculator with NEC and IEC standards support, environmental derating factors, voltage drop analysis, and PDF technical specification export.

## Summary

Circuit Breaker Sizing Calculator is a web-based electrical engineering tool providing accurate breaker sizing calculations for single-phase and three-phase systems according to NEC and IEC standards. The platform emphasizes calculation accuracy (±0.5A for current calculations), real-time safety validation, environmental factor derating, and professional documentation suitable for submission to electrical inspection authorities.

**Technical Approach**:
- Next.js 15 App Router with React Server Components for static UI
- Math.js with BigNumber precision for engineering calculations
- Zustand for state management with localStorage persistence (50-calculation history limit)
- Client-side jsPDF generation for professional technical specification reports
- Structured console logging for debugging and developer support
- Progressive enhancement: Core breaker sizing (P1) independently deployable from advanced features (P2/P3)

**Key Architecture Decisions**:
1. **Math.js for Precision**: Non-negotiable for safety-critical electrical calculations (5-digit precision minimum)
2. **Zustand State Management**: Selective re-renders for real-time validation (<100ms target)
3. **Client-Side PDF**: Supports anonymous engineers without backend authentication, reduces server load
4. **localStorage for History**: Persistent 50-calculation limit supports cross-session reference without database overhead
5. **Dual Standards (NEC/IEC)**: Complete recalculation on standard switch; no hybrid calculations
6. **Console Logging**: Structured ERROR/WARN/INFO/DEBUG logs for troubleshooting without performance impact
7. **Feature-Based Modules**: Basic breaker sizing (User Story 1) deployable independently; voltage drop (P2), derating (P2), short circuit (P2), type recommendations (P3), history (P3), PDF export (P3) follow in subsequent phases

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router, React Server Components)

**Primary Dependencies**:
- **Math.js**: High-precision arithmetic (BigNumber, 64-digit precision for electrical calculations)
- **Zustand 5.x**: State management with persist middleware for localStorage integration
- **jsPDF 3.x + html2canvas**: Client-side PDF generation for technical reports
- **Zod**: Type-safe schema validation for input parameters
- **Tailwind CSS + shadcn/ui**: Styling and UI components (consistent with existing ElectroMate theme)
- **nuqs**: URL state synchronization for shareable calculations (optional, Phase 3+)

**Storage**:
- Anonymous users: localStorage (calculation history limited to 50 most recent entries with FIFO eviction)
- Registered users: PostgreSQL (future enhancement for unlimited history and multi-project support)
- Fallback: Current calculation inputs always persist to localStorage independent of history availability

**Testing**:
- **Unit**: Vitest (NEC 210.20(A) continuous load 125% factor, IEC 60364-5-52 derating tables, standard breaker ratings)
- **Integration**: Vitest + React Testing Library (localStorage persistence, history management, PDF generation)
- **E2E**: Playwright (user workflows: basic breaker sizing, voltage drop analysis, derating factors, PDF export)
- **Calculation Validation**: 50+ test case scenarios covering voltage ranges, load types, standards, and edge cases

**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) on desktop and tablet devices; mobile support Phase 4+

**Project Type**: Web application (frontend-heavy, calculation engine client-side)

**Performance Goals**:
- **Calculation latency**: <200ms from input change to result display (target <100ms for simple breaker sizing)
- **PDF generation**: Complete within 3 seconds for full technical specification report
- **Standard switch**: Recalculate all values with new standard's formulas and factors within 500ms
- **Derating application**: Complex multi-factor calculations (temperature + grouping + method) complete within 150ms
- **Real-time validation**: Input validation errors displayed within 50ms of keypress

**Constraints**:
- **Calculation precision**: Must use arbitrary-precision arithmetic (Math.js BigNumber), minimum 5 significant figures for all breaker/current calculations
- **Standards compliance**: All calculations reference NEC 2020/2023 or IEC 60364-5-52 with explicit code section citations
- **Edge case handling**: System must handle and warn appropriately for unusual voltages (380V, 415V, 440V), extreme temperatures (-40°C to +70°C), and unusual load factors without errors
- **localStorage quota**: Persistent history limited to 50 calculations; automatic FIFO eviction when limit exceeded
- **No offline support**: Requires JavaScript enabled; calculation results not cacheable for offline use

**Scale/Scope**:
- 7 user stories: Basic breaker sizing (P1), Voltage drop analysis (P2), Derating factors (P2), Short circuit protection (P2), Breaker type recommendations (P3), Calculation history (P3), PDF export (P3)
- Target: Electrical engineers, system designers, electricians, and electrical inspectors in NEC and IEC jurisdictions
- Expected calculation volume: 50+ sessions per anonymous user (SC-007), unlimited for registered users (future)
- Standards coverage: NEC 2020/2023 (USA/Canada), IEC 60364-5-52 (Europe/Asia/International)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Review `.specify/memory/constitution.md` and verify compliance with all applicable principles:

### Calculation Accuracy (if applicable to engineering/calculation features)
- [x] All calculation formulas identified with applicable standards (IEEE, IEC, NEC, BS, NREL)
  - NEC 210.20(A): Continuous load overcurrent protection (125% factor for breaker sizing)
  - NEC 210.19(A): Voltage drop limits (3% branch circuit, 5% combined feeder+branch)
  - NEC Table 310.15(B)(16): Cable ampacity (used for voltage drop wire gauge lookup)
  - NEC Table 310.15(B)(2)(a): Temperature derating factors
  - NEC Table 310.15(C)(1): Cable grouping derating factors
  - IEC 60364-5-52: Cable current-carrying capacity (Iz)
  - IEC 60364-5-52 Table B.52.5-B.52.7: Correction factors (temperature, grouping, installation method)
  - Standard breaker ratings: IEC 60898 (6-4000A), NEC UL 489 (15-4000A+)
- [x] Test cases from published standards documented for accuracy validation
  - NEC 210.20(A) reference case: 10kW at 240V single-phase → 46.3A load → 57.9A min (125% applied) → 60A recommended
  - IEC 60364 reference case: 50A load at 400V three-phase with installation method and temperature → appropriate correction factors
  - IEEE 835 voltage drop reference calculations for standard wire sizes and distances
- [x] Accuracy tolerance thresholds specified (e.g., ±2% for battery calculations, ±0.1% for voltage drop)
  - SC-002: Breaker sizing ±0.5A current calculation accuracy against manual IEEE methods
  - SC-003: Voltage drop ±0.1% accuracy for IEEE standard formulas (R and L values from NEC Chapter 9 Table 8)
  - SC-004: Derating factor application 100% compliant with NEC/IEC tables (zero tolerance for table values)
- [x] Math.js or equivalent high-precision arithmetic library planned for implementation
  - Math.js configured with BigNumber (64-digit precision)
  - All calculations use Math.js arithmetic (no native JavaScript floating-point for engineering calculations)

### Safety-First Validation (if applicable to safety-critical features)
- [x] Dangerous condition detection rules defined (e.g., discharge rates >1C, voltage drops >3%)
  - Voltage drop >3% branch circuit: RED warning with cable size recommendation
  - Voltage drop >5% combined feeder+branch: RED warning with urgent cable size recommendation
  - Breaker size >available standard ratings (>4000A): WARNING with parallel circuit recommendation
  - Ambient temperature >60°C: WARNING recommending special breaker types/enclosures
  - Short circuit current >available breaker kA rating: RED warning with "unsafe" flag
  - Power factor <0.6: WARN with power factor correction recommendation
  - Grouping derating factors reducing capacity >30%: INFO with breakdown display
- [x] Real-time validation approach specified (target <100ms validation latency)
  - Input validation on blur and onChange events with debounce (50ms)
  - Calculation recalculation triggers: voltage change, phase type, load, power factor, standard switch, temperature, grouping
  - Warning generation integrated into calculation pipeline (no separate validation pass)
- [x] Warning UI treatment defined (red highlighting, explanatory text with code references)
  - RED: Dangerous conditions (VD >3%, SC current exceeded, unsafe combinations)
  - AMBER/YELLOW: Advisory warnings (unusual parameters, extreme temperatures, power factor)
  - BLUE/INFO: Helpful notes (derating factor breakdown, installation method notes, code section references)
  - All warnings include: code reference (e.g., "Per NEC 210.19(A)"), explanation, and recommended action
- [x] Edge case validation planned (negative values, impossible conditions, physical limits)
  - Negative power/current: INPUT ERROR with range (>0 to 10,000A max)
  - Voltage outside 100-1000V: INPUT WARNING with standard voltage suggestions
  - Temperature outside -40°C to +70°C: INPUT WARNING recommending special equipment
  - Cable grouping >20: Accepted; INFO note that >20 requires special analysis
  - Distance <5m: Accepted; VD calculation suppresses warnings if <1%

### Standards Compliance and Traceability (if applicable to regulated domains)
- [x] Standard versions specified (e.g., "NEC 2020", "IEC 60364-5-52:2009")
  - NEC 2020 (with note for 2023 adoption where identical)
  - IEC 60364-5-52 (current edition, 2009/2015+ compatible formulas)
- [x] Standard references will be displayed in calculation outputs
  - Every calculation result includes applicable code section (e.g., "Per NEC 210.20(A)" or "Per IEC 60364-5-52 Table B.52.5")
  - Derating factors include source table (e.g., "NEC Table 310.15(B)(2)(a)" for temperature)
  - Voltage drop calculation notes standard compliance limits
- [x] PDF reports will include section numbers and formula citations
  - Header: "Breaker Sizing Calculation per NEC 2020" or "... per IEC 60364-5-52"
  - Each calculation section: formula display with code reference
  - Derating factors: table names and page references
  - Warnings: code section justification
- [x] Version labeling strategy defined for standard updates
  - UI displays selected standard prominently (e.g., "NEC 2020" selector)
  - PDF reports include date and standard version in header
  - Future: Config file for easy update to NEC 2023 or IEC edition changes

### Test-First Development
- [x] TDD workflow confirmed for critical calculation logic (Red-Green-Refactor)
  - Priority 1: NEC 210.20(A) 125% factor and standard breaker rating lookup
  - Priority 1: IEC 60364-5-52 correction factor tables and rating selection
  - Priority 2: Voltage drop calculation formula validation against IEEE 835 reference
  - Priority 2: Derating factor cascade (temperature + grouping combined effect)
  - Test framework: Vitest with 50+ test scenarios (nominal, boundary, edge, error cases)
- [x] Test coverage requirements specified (nominal, boundary, edge, error cases)
  - Nominal: Standard voltages (120V, 208V, 240V, 480V, 230V, 400V, 690V) with typical loads
  - Boundary: Breaker sizes at standard rating boundaries (e.g., 29.9A → 30A, 30.1A → 35A)
  - Edge: Unusual voltages (380V, 415V, 440V), extreme temperatures, extreme grouping, very long distances
  - Error: Negative inputs, out-of-range values, invalid combinations, missing data
- [x] User approval checkpoint planned for test case validation
  - Phase 0 Research: 50+ test case scenarios documented with expected results
  - Phase 1: Test cases reviewed and approved by user before Phase 2 implementation
  - Phase 2: All test cases passing before release
- [x] Test framework and tooling selected
  - Unit tests: Vitest (fast, ESM-native, Vue/React compatible)
  - Integration tests: Vitest + React Testing Library (component-level with hooks)
  - E2E tests: Playwright (full user workflows)

### Professional Documentation (if applicable to client-facing tools)
- [x] PDF export requirements defined (inputs, formulas, references, timestamps)
  - Inputs section: Project info (name, location, engineer), circuit parameters (voltage, phase, load), standard selected
  - Calculation section: Load current formula and result, safety factor or correction factors applied, minimum breaker size, recommended standard rating
  - Analysis section: Voltage drop analysis (if included), derating factors (if applied), short circuit capacity (if specified)
  - Recommendations section: Breaker type and trip curve, cable size recommendations, code compliance notes
  - Metadata: Calculation date/time, ElectroMate version, standards versions, "For Professional Engineering Review" disclaimer
- [x] Cross-browser compatibility targets specified (Chrome, Firefox, Safari, Edge)
  - PDF generation tested on: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
  - HTML2Canvas rendering consistency verified across all browsers
  - jsPDF layout tested for formatting preservation
- [x] Disclaimer text prepared for professional submission materials
  - "This calculation is provided for assistance and educational purposes. Final designs must be reviewed and stamped by licensed Professional Engineers where required by law. Consult applicable codes (NEC, IEC, local amendments) and equipment specifications."
- [x] Intermediate calculation steps approach defined (e.g., "Show Details" mode)
  - Results display includes expandable "Calculation Details" section showing:
    - Load current calculation (formula + result)
    - Applied safety factor or correction factors (formula + result)
    - Standard breaker rating selection logic
    - Optional: Derating factor cascade (if >1 factor applied)
    - Optional: Voltage drop analysis (if included)

### Progressive Enhancement
- [x] Feature prioritization confirmed (P1/P2/P3 from spec)
  - P1: Basic breaker sizing (core functionality, User Story 1) - Phase 2 priority
  - P2: Voltage drop analysis (User Story 2), Derating factors (US 3), Short circuit (US 4) - Phase 3
  - P3: Breaker type recommendations (US 5), History (US 6), PDF export (US 7) - Phase 4+
- [x] Each user story independently testable and deployable
  - US 1 (Breaker sizing) works without US 2-7
  - US 2 (Voltage drop) independent input group; can be hidden if not selected
  - US 3 (Derating) optional input section; core sizing works without it
  - US 4 (Short circuit) optional input; filtering applied if specified
  - US 5 (Type recommendations) recommendation layer; core sizing unaffected if disabled
  - US 6 (History) localStorage feature; core functionality works without it
  - US 7 (PDF export) rendering feature; calculation unaffected if PDF fails
- [x] No dependencies on incomplete higher-priority features
  - P2 and P3 features don't block P1 release
  - Architecture planned to support feature flags for phased rollout
- [x] Incremental value delivery strategy defined
  - Phase 2 (P1): Basic breaker sizing works end-to-end; delivers immediate value for core use case
  - Phase 3 (P2): Add environmental factors and voltage analysis; expands to industrial applications
  - Phase 4 (P3): Breaker type guidance, history, and professional PDF; completes professional-grade tool

### Other Constitution Principles
- [x] Dual standards support planned (if applicable: IEC/SI and NEC/North American units)
  - NEC: Amperes (A), AWG/kcmil wire sizes, feet, °F, megawatts (MW)
  - IEC: Amperes (A), mm² wire sizes, meters, °C, kilowatts (kW)
  - Standard toggle triggers complete recalculation with new formulas, factors, and unit suggestions
  - Voltage selector changes to standard-appropriate options (NEC: 120/208/240/480V; IEC: 230/400/690V)
- [x] Security requirements addressed (input validation, authentication, data retention)
  - Input validation: Type checking, range validation, edge case handling (no injection risk in calculations)
  - Authentication: None required (anonymous users); future registration optional for unlimited history
  - Data retention: localStorage limited to 50 calculations; no server-side storage of PII or project details
  - Sensitive data: None stored except technical parameters (voltage, load, etc.)
- [x] Code quality standards acknowledged (no hardcoded secrets, smallest viable diff)
  - All electrical constants (standard ratings, derating tables) defined in constants/electrical.ts
  - No API keys or secrets in client-side code
  - Formulas implemented as pure functions with single responsibility
  - PR criteria: Single feature per PR, test coverage >80% for calculations, code review before merge
- [x] Complexity justifications documented (if introducing abstraction layers or dependencies)
  - Math.js: Justified for arbitrary-precision arithmetic (non-negotiable for electrical safety)
  - Zustand: Justified for state management (simpler than Redux, better performance than Context API)
  - jsPDF: Justified for client-side PDF generation (no backend required, faster user experience)
  - localStorage: Justified for history (no database overhead, respects user privacy, FIFO simple)

## Project Structure

### Documentation (this feature)

```text
specs/003-circuit-breaker-sizing/
├── plan.md                          # This file (/sp.plan command output)
├── spec.md                          # Feature specification (requirements, user stories, edge cases)
├── research.md                      # Phase 0 research (NEC/IEC standards, derating tables, test cases)
├── data-model.md                    # Phase 1 data model (TypeScript interfaces, entities)
├── quickstart.md                    # Developer onboarding guide
├── contracts/
│   └── breaker-api.yaml            # OpenAPI 3.0 specification for calculation interfaces
├── checklists/
│   └── requirements.md              # Requirements validation checklist
└── tasks.md                         # Phase 2 implementation tasks (created by /sp.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── calculators/
│       └── breaker-sizing/
│           ├── BreakerSizingCalculator.tsx    # Main component (input form + results)
│           ├── BreakerInputForm.tsx           # Input parameters collection
│           ├── BreakerResults.tsx             # Results display with warnings
│           ├── DeratingSidebar.tsx            # Optional derating factor section
│           ├── HistorySidebar.tsx             # Optional calculation history panel
│           └── PDFReportTemplate.tsx          # PDF layout component
│
├── services/
│   └── breaker-calculator/
│       ├── calculator.ts            # Main calculation engine (load current, breaker sizing)
│       ├── standards.ts             # NEC and IEC standard definitions (ratings, derating tables)
│       ├── derating.ts              # Derating factor calculations (temperature, grouping, method)
│       ├── voltage-drop.ts          # Voltage drop calculation and analysis
│       ├── recommendations.ts       # Breaker type and cable size recommendations
│       └── validation.ts            # Input validation and edge case handling
│
├── hooks/
│   ├── useBreakerCalculation.ts     # Main state hook (Zustand store integration)
│   ├── useDeratingSidebar.ts        # Derating sidebar state (optional)
│   ├── useHistoryStorage.ts         # localStorage FIFO history management
│   └── usePDFExport.ts              # PDF generation hook (jsPDF + html2canvas)
│
├── types/
│   └── breaker-calculator.ts        # TypeScript interfaces (Circuit Config, Results, etc.)
│
├── constants/
│   └── electrical.ts                # Electrical constants (breaker ratings, derating factors, formulas)
│
├── utils/
│   ├── math-helpers.ts              # Math.js wrapper functions (precision arithmetic)
│   ├── unit-conversion.ts           # Metric/Imperial unit conversion
│   ├── logger.ts                    # Structured console logging (ERROR/WARN/INFO/DEBUG)
│   └── formatting.ts                # Number formatting and display helpers
│
└── pages/
    └── calculators/
        └── breaker-sizing/
            └── page.tsx             # Next.js page component
```

**Structure Decision**: Web application (single frontend module) selected because:
- Circuit breaker sizing is calculation-heavy, UI-light (all computation client-side)
- No backend processing required (calculations, PDF generation, history all client-side)
- Next.js App Router provides server/client component split for optimal performance
- Future integration with other ElectroMate calculators (cable, battery, solar) can reuse shared infrastructure

### Key Components and Services

1. **BreakerSizingCalculator (Main Component)**
   - Orchestrates input form, calculation engine, results display, optional derating/history sidebars
   - Manages standard selection toggle (NEC/IEC) and unit system (Metric/Imperial)
   - Triggers calculations on input change (debounced)
   - Displays results in sections: Load Analysis, Breaker Sizing, Warnings, Recommendations

2. **Calculation Engine (calculator.ts)**
   - Pure functions for load current calculation (single-phase, three-phase)
   - Safety factor application (NEC 125%) or correction factor (IEC)
   - Standard breaker rating lookup and recommendation
   - Voltage drop calculation (if enabled)
   - Returns CalculationResult with all intermediate values for display

3. **Standards Module (standards.ts)**
   - NEC breaker ratings (15A-4000A+) with standard gaps definition
   - IEC breaker ratings (6A-4000A) with standard gaps definition
   - Derating factor tables (temperature, grouping, installation method)
   - Voltage drop limits and acceptable ranges
   - Breaker type curves and trip recommendations

4. **Logging System (logger.ts)**
   - Structured console logging with timestamp, level (ERROR/WARN/INFO/DEBUG), component, message, context
   - Log sampling to prevent console spam during rapid calculations
   - Sensitive data filtering (no project names, engineer details in logs)

5. **History Storage (useHistoryStorage.ts)**
   - localStorage wrapper with FIFO eviction (50-calculation limit)
   - Automatic oldest-entry removal when limit exceeded
   - Graceful fallback if localStorage unavailable

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Math.js library dependency | Arbitrary-precision arithmetic non-negotiable for electrical safety calculations; JavaScript native floating-point precision insufficient for breaker sizing accuracy | Native JS: Would produce rounding errors in multi-step calculations (e.g., 125% of calculated current at high amps) |
| Zustand state management | Real-time validation <100ms requires selective re-renders; React Context causes full tree re-renders on every input change | Context API: Would cause UI lag on every keystroke with full calculation recalculation |
| jsPDF for PDF generation | Client-side generation eliminates backend overhead, supports anonymous users, instant delivery without network latency | Server-side: Would require backend API, authentication, and storage infrastructure for simple calculation output |
| localStorage for history | Persistent 50-calculation limit supports professional workflow (review past designs) without database complexity or privacy concerns | Database: Over-engineered for feature scope; localStorage respects user privacy better for anonymous tool |

## Phase-Based Rollout Strategy

### Phase 2: Core Implementation (P1)
- User Story 1: Basic breaker sizing (NEC + IEC single-phase and three-phase)
- Input validation and error handling
- Real-time calculation <200ms
- Unit tests: 20+ test cases covering standard voltages and load ranges
- E2E: Complete breaker sizing workflow from input to results

### Phase 3: Advanced Features (P2)
- User Story 2: Voltage drop analysis (distance input, cable size lookup, warnings)
- User Story 3: Derating factors (temperature, grouping, installation method)
- User Story 4: Short circuit capacity filtering
- Integration tests: Combined calculations (breaker sizing + voltage drop + derating)
- E2E: Complete workflow with all optional inputs

### Phase 4: Professional Features (P3)
- User Story 5: Breaker type recommendations (trip curves, load type guidance)
- User Story 6: Calculation history (localStorage, view/compare/re-export)
- User Story 7: PDF technical specification export
- Acceptance tests: PDF content validation, history FIFO management
- E2E: Full professional tool workflow (calculate, review history, export PDF)

### Phase 5: Enhancement and Polish (Future)
- Mobile UI optimization
- Multi-project support (registered users, PostgreSQL)
- Batch calculations for panel design
- Integration with cable sizing tool
- Manufacturer-specific breaker catalogs (if demand justifies)

## Risk Analysis and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| Derating table values incorrect | Safety-critical: could recommend undersized breaker | Medium | Phase 0 research: verify all NEC/IEC table values against official standards; user review test cases |
| Voltage drop formula error | Could recommend inadequate cable, creating fire hazard | Medium | Test against IEEE 835 reference calculations; compare with NEC Article 210.19(A) examples |
| Standard switch mid-calculation breaks state | User confusion, potential incorrect results | Low | Zustand store completely resets on standard toggle; all inputs recalculated |
| localStorage quota exceeded | Calculation history fails silently | Low | Graceful fallback: warn user if history can't save; current calculation still processes |
| PDF generation fails (html2canvas unsupported) | User can't export results | Low | Fallback: generate basic PDF without charts; provide JSON export as alternative |
| Extremely high derating factors (>50%) | Recommended breaker exceeds standard ratings | Medium | System recommends parallel circuits; warning suggests engineering review |
| Ambient temperature >60°C | Calculated derating may require special equipment | Low | Warning recommends special breaker types; user responsible for equipment selection |

## Standards and References

**Primary References (Phase 0 Research)**:
- NEC 2020 (NFPA 70): Articles 210, 215, 240, 310 (overcurrent protection, circuit design, cable ampacity)
- IEC 60364-5-52:2015 (Low-voltage electrical installations, Part 5-52: Protection against thermal effects)
- IEEE Std 835-2019: Test Procedures for Stationary Battery Installations (reference calculations)
- UL 489: Standard for Circuit Breakers (breaking capacity ratings, trip curves)
- IEC 60898-1: Automatic disconnectors for household and similar installations (Type B/C/D curves)

**Calculation Precision References**:
- IEEE 835, Section 4.2.1: Backup time calculation example
- NEC Chapter 9, Table 8: Conductor resistance values (75°C) for voltage drop
- IEC 60228: Nominal cross-sectional areas and codes for conductors

## Success Criteria Mapping to Implementation

| Success Criterion | Phase | Validation Method |
|-------------------|-------|------------------|
| SC-001: <60s for basic calculation | Phase 2 | E2E timing test (page load to result display) |
| SC-002: ±0.5A current accuracy | Phase 2 | Unit tests against 20+ NEC/IEC reference cases |
| SC-003: ±0.1% voltage drop accuracy | Phase 3 | Unit tests against IEEE 835 reference calculations |
| SC-004: Derating factor compliance 100% | Phase 3 | Visual verification against NEC/IEC tables; unit tests |
| SC-005: <3s PDF generation | Phase 4 | E2E PDF generation timing test |
| SC-006: <500ms standard switch | Phase 2 | E2E timing test for NEC↔IEC toggle |
| SC-007: Edge case handling 100% | Phase 2 | Edge case test suite (unusual voltages, temperatures, loads) |
| SC-008: 90% user approval for recommendations | Phase 4 | User feedback survey after Phase 4 release |
| SC-009: Cable size recommendations 100% | Phase 3 | Unit tests validating recommendation logic against manual cases |
| SC-010: PDF accepted by inspection authorities | Phase 4 | Professional review (request feedback from 3 electrical inspectors) |

---

**Document Status**: DRAFT | **Last Updated**: 2025-12-28
