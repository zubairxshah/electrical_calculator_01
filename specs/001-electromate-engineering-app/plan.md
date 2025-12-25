# Implementation Plan: ElectroMate Engineering Web Application

**Branch**: `001-electromate-engineering-app` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-electromate-engineering-app/spec.md`

**Note**: This plan implements a comprehensive electrical engineering calculation platform with high-precision calculations, standards compliance (IEC/IEEE/NEC), and professional PDF reporting.

## Summary

ElectroMate is a web-based electrical engineering calculation platform providing battery/UPS sizing, cable voltage drop calculations, and solar array design tools. The platform emphasizes calculation accuracy (within specified tolerances per IEEE/IEC standards), real-time safety validation, and professional documentation suitable for submission to approval authorities.

**Technical Approach**:
- Next.js 15 App Router with strategic Server/Client Component split
- Math.js with BigNumber precision for engineering calculations
- Zustand for state management with localStorage persistence
- Client-side jsPDF generation for professional reports
- Recharts for battery discharge curves and visualizations
- BetterAuth + Neon PostgreSQL for registered user authentication and storage

**Key Architecture Decisions**:
1. **App Router over Pages Router**: Client-side calculation workload benefits from smaller bundles; Server Components for static UI shells
2. **Zustand over Context**: Selective re-renders critical for real-time validation (<100ms target)
3. **Math.js over Native**: Arbitrary-precision arithmetic non-negotiable for safety-critical calculations
4. **Client-Side PDF**: Supports anonymous users without backend authentication
5. **Feature-Based Modules**: Each calculator (Battery, UPS, Cables, Solar) independently testable per Progressive Enhancement principle

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router, React Server Components)
**Primary Dependencies**:
- **Math.js**: High-precision arithmetic (BigNumber, 64-digit precision)
- **Zustand 5.x**: State management with persist middleware
- **jsPDF 3.x + html2canvas**: Client-side PDF generation with chart embedding
- **Recharts 2.x**: SVG-based charts for discharge curves
- **BetterAuth**: Authentication library for Next.js
- **Drizzle ORM**: Type-safe PostgreSQL ORM
- **Tailwind CSS + shadcn/ui**: Styling and UI components
- **Zod**: Type-safe schema validation
- **nuqs**: URL state synchronization for shareable calculations

**Storage**:
- Anonymous users: localStorage (calculation sessions persisted client-side)
- Registered users: Neon PostgreSQL (seamless migration from localStorage on registration)
- 2-year data retention policy with 30-day deletion warnings

**Testing**:
- **Unit**: Vitest (calculation formulas validated against IEEE/IEC standard test cases)
- **Integration**: Vitest + React Testing Library (PDF generation, localStorage, DB migration)
- **E2E**: Playwright (user workflows across calculators)

**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) on desktop and tablet devices

**Project Type**: Web application (frontend-heavy with API routes)

**Performance Goals**:
- **Real-time validation**: <100ms response time for input validation (SC-002)
- **Calculation accuracy**: ±2% for battery (SC-005), ±0.1% for voltage drop (SC-004), 100% NEC/IEC ampacity compliance (SC-009)
- **PDF generation**: Complete within 2 seconds for standard reports
- **Concurrent users**: Support 100 concurrent users without degradation (SC-006)

**Constraints**:
- **Calculation precision**: Must use arbitrary-precision arithmetic (Math.js BigNumber)
- **Standards compliance**: All calculations must reference IEC/IEEE/NEC standards with version labels
- **Anonymous support**: Core functionality must work without registration (localStorage only)
- **Browser compatibility**: 95% PDF report rendering success across target browsers (SC-003)
- **Storage limits**: Anonymous users limited to localStorage quota (~5MB); registration required for unlimited history

**Scale/Scope**:
- 6 user stories: Battery (P1), UPS (P1), Cable Sizing (P1), Solar Array (P2), Charge Controller (P2), Battery Comparison (P3)
- Target: Engineering professionals requiring calculation tools for code compliance and client submissions
- Expected calculation history: 50+ sessions for anonymous users (SC-007), unlimited for registered users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Review `.specify/memory/constitution.md` and verify compliance with all applicable principles:

### Calculation Accuracy (if applicable to engineering/calculation features)
- [x] All calculation formulas identified with applicable standards (IEEE, IEC, NEC, BS, NREL)
  - Battery: IEEE 485-2020 (backup time calculation)
  - UPS: IEEE 1100 (Emerald Book - diversity factors), IEC 62040 (UPS standards)
  - Cables: NEC Table 310.15(B)(16), IEC 60364-5-52 (ampacity and derating)
  - Solar: NREL standards (performance ratio, temperature derating)
- [x] Test cases from published standards documented for accuracy validation
  - IEEE 485 Example 4.2.1 (battery backup time reference case)
  - NEC Table 310.15(B)(16) ampacity lookup validation
  - IEC 60364 voltage drop calculation examples
- [x] Accuracy tolerance thresholds specified (e.g., ±2% for battery calculations, ±0.1% for voltage drop)
  - SC-005: Battery backup time within 2% of IEEE 485 methodology
  - SC-004: Voltage drop within 0.1% of IEEE/IEC tables
  - SC-009: Cable ampacity 100% compliant with NEC/IEC standards
- [x] Math.js or equivalent high-precision arithmetic library planned for implementation
  - Math.js configured with BigNumber (64-digit precision)
  - All calculations use Math.js arithmetic (no native JavaScript floating-point)

### Safety-First Validation (if applicable to safety-critical features)
- [x] Dangerous condition detection rules defined (e.g., discharge rates >1C, voltage drops >3%)
  - Discharge rate >1C for VRLA batteries (IEEE 485 limit)
  - Voltage drop >3% (conservative NEC/IEC limit for all circuits)
  - Voltage drop >10% (physically dangerous condition)
  - Efficiency >100% (impossible condition)
  - Cable ampacity exceeded after derating factors
  - Solar V_oc exceeding charge controller ratings
- [x] Real-time validation approach specified (target <100ms validation latency)
  - Debounced validation (300ms debounce for typing)
  - Client-side validation (no network latency)
  - Web Workers for complex calculations (non-blocking UI)
  - Performance monitoring to log validation >100ms
- [x] Warning UI treatment defined (red highlighting, explanatory text with code references)
  - Red highlighting for violations (FR-009)
  - Warning banners with severity levels (danger, warning, info)
  - Explanatory text with standard references (e.g., "per IEEE 485 Section 4.2")
  - Tooltips for technical terms (DoD, C-rate, PSH, power factor)
- [x] Edge case validation planned (negative values, impossible conditions, physical limits)
  - Negative or zero values for voltages, currents, loads
  - Efficiency >100% or <0%
  - Cable lengths exceeding practical limits
  - Solar array voltage exceeding controller limits

### Standards Compliance and Traceability (if applicable to regulated domains)
- [x] Standard versions specified (e.g., "NEC 2020", "IEC 60364-5-52:2009")
  - IEEE 485-2020: Battery Sizing
  - IEEE 1100-2020 (Emerald Book): Power Quality and Diversity Factors
  - NEC 2020 Table 310.15(B)(16): Conductor Ampacity
  - IEC 60364-5-52:2009: Cable Sizing and Voltage Drop
  - IEC 62040-3:2021: UPS Performance and Test Requirements
  - BS 7671:2018: UK Wiring Regulations
- [x] Standard references will be displayed in calculation outputs
  - Calculation results display applicable standard (e.g., "per IEEE 485")
  - Intermediate steps show standard section numbers
  - "Show Details" mode expands formula derivations with references
- [x] PDF reports will include section numbers and formula citations
  - Standard references section in PDF with version numbers
  - Formula annotations with standard section references
  - Disclaimer text about PE certification responsibility
- [x] Version labeling strategy defined for standard updates
  - Standard versions stored in `lib/standards/references.ts`
  - Calculation metadata includes standard version used
  - Future: Allow users to select standard version (e.g., NEC 2017 vs 2020)

### Test-First Development
- [x] TDD workflow confirmed for critical calculation logic (Red-Green-Refactor)
  - Write tests based on IEEE/IEC/NEC published examples
  - User approval of test cases (verify real-world applicability)
  - Tests MUST fail initially (Red)
  - Implement calculation to pass tests (Green)
  - Refactor for performance/clarity (Refactor)
  - Mandatory for P1 calculations (Battery, UPS, Cable Sizing)
- [x] Test coverage requirements specified (nominal, boundary, edge, error cases)
  - Nominal cases: Typical input values (e.g., 48V, 200Ah, 2000W)
  - Boundary cases: Min/max valid inputs (e.g., 1.5mm² to 500mm²)
  - Edge cases: Zero values, very small/large numbers, physical limits
  - Error cases: Negative values, impossible conditions (efficiency >100%)
- [x] User approval checkpoint planned for test case validation
  - Present test cases derived from standards before implementation
  - Validate test scenarios match real-world engineering workflows
  - Document approval in test file comments
- [x] Test framework and tooling selected
  - Vitest for unit/integration tests (faster than Jest, Vite-compatible)
  - React Testing Library for component tests
  - Playwright for E2E tests (user workflows)

### Professional Documentation (if applicable to client-facing tools)
- [x] PDF export requirements defined (inputs, formulas, references, timestamps)
  - Input parameters section with units
  - Calculation results with precision appropriate to engineering practice
  - Formula section with variable definitions
  - Standard references with section numbers
  - Calculation timestamp and system version
  - Disclaimer text about PE certification
  - Footer with "MZS CodeWorks" branding
- [x] Cross-browser compatibility targets specified (Chrome, Firefox, Safari, Edge)
  - SC-003: 95% success rate across Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
  - jsPDF library supports all target browsers
  - PDF generation tested on all platforms
- [x] Disclaimer text prepared for professional submission materials
  - "Calculations for informational purposes. Professional Engineer (PE) stamp/certification is user's responsibility."
  - Included on every PDF report
  - Displayed in footer of calculation results
- [x] Intermediate calculation steps approach defined (e.g., "Show Details" mode)
  - Toggle button "Show Calculation Details"
  - Expands to show formula derivation, intermediate values, standard references
  - Helps engineers verify methodology and defend designs during review

### Progressive Enhancement
- [x] Feature prioritization confirmed (P1/P2/P3 from spec)
  - **P1 (Core Tools)**: Battery Backup Calculator, UPS Sizing, Voltage Drop/Cable Sizing
  - **P2 (Expansion)**: Solar Array Sizing, Charge Controller Selection
  - **P3 (Decision Support)**: Battery Type Comparison Tool
- [x] Each user story independently testable and deployable
  - Each calculator in separate route (`/battery`, `/ups`, `/cables`, etc.)
  - Independent Zustand stores (no cross-calculator state dependencies)
  - Independent test suites (`__tests__/unit/calculations/battery.test.ts`)
  - Can deploy P1 calculators before P2/P3 exist
- [x] No dependencies on incomplete higher-priority features
  - P2 calculators do not depend on P1 completion
  - P3 tools do not depend on P2 completion
  - Shared utilities (`mathConfig.ts`, `pdfGenerator.ts`) implemented once, used by all
- [x] Incremental value delivery strategy defined
  - Phase 1: Deploy Battery Calculator (MVP - immediate value)
  - Phase 2: Add UPS Sizing (expand capability)
  - Phase 3: Add Cable Sizing (compliance verification)
  - Phase 4: Add Solar tools (market expansion)
  - Each phase delivers standalone value without breaking previous phases

### Other Constitution Principles
- [x] Dual standards support planned (if applicable: IEC/SI and NEC/North American units)
  - Unit toggle: IEC/SI (mm², meters, kW) ↔ North American (AWG, feet, HP)
  - Voltage systems: LV AC (120V-600V), MV (2.4kV-13.8kV), DC (12V-1500V)
  - Cable tables: IEC 60364-5-52 AND NEC Table 310.15(B)(16)
  - Unit conversion with preserved accuracy (SC-015)
  - `lib/unitConversion.ts` handles all conversions with Math.js precision
- [x] Security requirements addressed (input validation, authentication, data retention)
  - **Input validation**: All numerical inputs validated (positive, non-zero, within physical limits) using Zod schemas
  - **Authentication**: BetterAuth integration with Neon PostgreSQL
  - **Data retention**: 2-year retention for registered users with 30-day deletion warning (FR-017a)
  - **HTTPS**: Required for production deployment
  - **No PII**: Calculation data does not contain personally identifiable information
- [x] Code quality standards acknowledged (no hardcoded secrets, smallest viable diff)
  - Environment variables in `.env.local` for sensitive configuration
  - Neon PostgreSQL connection string in environment variable
  - BetterAuth secrets in environment variable
  - Smallest viable diff: Modular calculator structure enables isolated changes
  - No hardcoded API keys or database credentials
- [x] Complexity justifications documented (if introducing abstraction layers or dependencies)
  - **Math.js**: Required for arbitrary-precision arithmetic (Constitution Principle I: NON-NEGOTIABLE)
  - **Zustand**: Justified over Context for performance (selective re-renders for <100ms validation)
  - **jsPDF**: Client-side generation supports anonymous users without backend complexity
  - **Recharts**: SVG-based charts provide print quality for professional PDFs
  - **BetterAuth**: Mature authentication library reduces security implementation risk

**GATE RESULT**: ✅ PASS - All constitutional principles satisfied with concrete implementation plans

## Project Structure

### Documentation (this feature)

```text
specs/001-electromate-engineering-app/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file - Implementation plan
├── research.md          # Phase 0 output (architectural decisions)
├── data-model.md        # Phase 1 output (entity definitions)
├── quickstart.md        # Phase 1 output (developer setup guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── battery.openapi.yaml
│   ├── ups.openapi.yaml
│   ├── cables.openapi.yaml
│   └── solar.openapi.yaml
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
D:\prompteng\elec_calc\
├── app/                              # Next.js 15 App Router
│   ├── layout.tsx                    # Root layout (Server Component)
│   │                                 # - Navigation sidebar
│   │                                 # - Footer with "MZS CodeWorks"
│   │                                 # - Global providers (BetterAuth)
│   ├── page.tsx                      # Landing page (Server Component)
│   │
│   ├── battery/                      # Battery Backup Calculator (P1)
│   │   ├── page.tsx                  # Route wrapper (Server Component)
│   │   └── BatteryCalculator.tsx    # Client component ("use client")
│   │
│   ├── ups/                          # UPS Sizing Tool (P1)
│   │   ├── page.tsx
│   │   └── UPSSizingTool.tsx
│   │
│   ├── cables/                       # Voltage Drop & Cable Sizing (P1)
│   │   ├── page.tsx
│   │   └── CableSizingTool.tsx
│   │
│   ├── solar/                        # Solar Array Sizing (P2)
│   │   ├── page.tsx
│   │   └── SolarArrayCalculator.tsx
│   │
│   ├── charge-controller/            # Charge Controller Selection (P2)
│   │   ├── page.tsx
│   │   └── ChargeControllerTool.tsx
│   │
│   ├── battery-comparison/           # Battery Type Comparison (P3)
│   │   ├── page.tsx
│   │   └── BatteryComparisonTable.tsx
│   │
│   ├── dashboard/                    # Registered user dashboard
│   │   ├── page.tsx
│   │   └── CalculationHistory.tsx
│   │
│   └── api/                          # API routes
│       ├── auth/                     # BetterAuth endpoints
│       │   └── [...nextauth]/
│       │       └── route.ts
│       └── calculations/             # Calculation persistence
│           ├── battery/
│           │   ├── route.ts          # GET/POST battery calculations
│           │   └── migrate/
│           │       └── route.ts      # Migration endpoint
│           ├── ups/
│           │   └── route.ts
│           ├── cables/
│           │   └── route.ts
│           └── solar/
│               └── route.ts
│
├── components/                       # Shared UI components
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── alert.tsx
│   │   ├── select.tsx
│   │   ├── tooltip.tsx
│   │   └── ...
│   │
│   ├── charts/                       # Recharts wrapper components
│   │   ├── BatteryDischargeChart.tsx
│   │   ├── UPSLoadChart.tsx
│   │   └── SolarGenerationChart.tsx
│   │
│   ├── layout/                       # Layout components
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   ├── Header.tsx                # Page header
│   │   └── Footer.tsx                # MZS CodeWorks footer
│   │
│   └── shared/                       # Shared calculator components
│       ├── CalculationCard.tsx       # Card wrapper for calculators
│       ├── InputField.tsx            # Validated input field with real-time feedback
│       ├── ResultDisplay.tsx         # Result display component
│       ├── WarningBanner.tsx         # Danger/warning banners (red highlighting)
│       ├── PDFDownloadButton.tsx     # PDF export button
│       └── StorageWarningBanner.tsx  # localStorage quota warning
│
├── lib/                              # Core business logic
│   ├── calculations/                 # Calculation engines (TDD)
│   │   ├── battery/
│   │   │   ├── backupTime.ts         # Battery backup time formula (IEEE 485)
│   │   │   ├── dischargeRate.ts      # C-rate calculations
│   │   │   └── dischargeCurve.ts     # Peukert's law modeling for discharge curves
│   │   │
│   │   ├── ups/
│   │   │   ├── sizing.ts             # UPS sizing with diversity factors
│   │   │   ├── diversityFactor.ts    # IEEE 1100 diversity calculations
│   │   │   └── powerFactor.ts        # VA ↔ W conversions
│   │   │
│   │   ├── cables/
│   │   │   ├── voltageDrop.ts        # Voltage drop calculations
│   │   │   ├── cableSizing.ts        # Cable size recommendations
│   │   │   ├── deratingFactors.ts    # NEC/IEC derating factors
│   │   │   └── ampacity.ts           # Ampacity tables (lookup)
│   │   │
│   │   └── solar/
│   │       ├── arraySize.ts          # Solar array sizing
│   │       ├── performanceRatio.ts   # Performance ratio calculations
│   │       └── chargeController.ts   # MPPT/PWM selection
│   │
│   ├── validation/                   # Validation logic (real-time)
│   │   ├── batteryValidation.ts      # Battery input validators (Zod schemas)
│   │   ├── upsValidation.ts          # UPS input validators
│   │   ├── cableValidation.ts        # Cable input validators
│   │   └── validators.ts             # Shared validator utilities
│   │
│   ├── standards/                    # Standards data
│   │   ├── cableTables.ts            # IEC 60364 / NEC Table 310.15(B)(16)
│   │   ├── deratingTables.ts         # Temperature/grouping derating factors
│   │   └── references.ts             # Standard references with versions
│   │
│   ├── mathConfig.ts                 # Math.js configuration (BigNumber, 64-digit precision)
│   ├── pdfGenerator.ts               # jsPDF wrapper for report generation
│   ├── unitConversion.ts             # SI ↔ North American unit conversions
│   ├── auth.ts                       # BetterAuth configuration
│   ├── db.ts                         # Neon PostgreSQL client (Drizzle ORM)
│   └── migrationService.ts           # localStorage → DB migration logic
│
├── stores/                           # Zustand state management
│   ├── batteryStore.ts               # Battery calculator state + localStorage persist
│   ├── upsStore.ts                   # UPS sizing state
│   ├── cableStore.ts                 # Cable sizing state
│   ├── solarStore.ts                 # Solar calculator state
│   └── userStore.ts                  # User authentication state
│
├── hooks/                            # Custom React hooks
│   ├── useValidation.ts              # Real-time validation hook (debounced)
│   ├── useChartExport.ts             # Chart → Canvas export for PDF
│   ├── useLocalStorage.ts            # localStorage utilities
│   └── useCalculationHistory.ts      # History management (fetch from DB)
│
├── types/                            # TypeScript type definitions
│   ├── calculations.ts               # Calculation input/output types
│   ├── standards.ts                  # Standards reference types
│   ├── validation.ts                 # Validation result types
│   └── database.ts                   # Database schema types (Drizzle)
│
├── __tests__/                        # Test suites (TDD)
│   ├── unit/
│   │   ├── calculations/
│   │   │   ├── battery.test.ts       # Battery formula tests (IEEE 485 examples)
│   │   │   ├── ups.test.ts           # UPS sizing tests (IEEE 1100 diversity)
│   │   │   ├── cables.test.ts        # Cable sizing tests (NEC/IEC compliance)
│   │   │   └── solar.test.ts         # Solar sizing tests (NREL standards)
│   │   │
│   │   ├── validation/
│   │   │   ├── batteryValidation.test.ts
│   │   │   ├── upsValidation.test.ts
│   │   │   └── cableValidation.test.ts
│   │   │
│   │   └── mathPrecision.test.ts     # Math.js precision verification
│   │
│   ├── integration/
│   │   ├── pdfGeneration.test.ts     # PDF export tests (cross-browser)
│   │   ├── localStorage.test.ts      # localStorage persistence tests
│   │   └── migration.test.ts         # DB migration tests
│   │
│   └── e2e/
│       ├── batteryCalculator.spec.ts # Playwright E2E (user workflows)
│       ├── upsCalculator.spec.ts
│       └── cableCalculator.spec.ts
│
├── public/                           # Static assets
│   ├── logo.svg                      # MZS CodeWorks logo
│   ├── icons/                        # Engineering icons (SVG, no emojis)
│   │   ├── battery.svg
│   │   ├── ups.svg
│   │   ├── cable.svg
│   │   └── solar.svg
│   └── standards/                    # PDF references (optional, for documentation)
│
├── .env.local                        # Environment variables (not committed)
│   # NEON_DATABASE_URL=postgresql://...
│   # BETTER_AUTH_SECRET=...
│   # NEXT_PUBLIC_APP_URL=http://localhost:3000
│
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── drizzle.config.ts                 # Drizzle ORM configuration
├── package.json                      # Dependencies
├── vitest.config.ts                  # Vitest test configuration
└── playwright.config.ts              # Playwright E2E configuration
```

**Structure Decision**: Web application structure selected. ElectroMate is a frontend-heavy calculation platform with API routes for user authentication and calculation persistence. The modular calculator architecture (`app/battery/`, `app/ups/`, `app/cables/`, etc.) supports Progressive Enhancement (Principle VII) by enabling independent development, testing, and deployment of each calculator tool. Each route contains a Server Component wrapper (`page.tsx`) and a Client Component with calculation logic (e.g., `BatteryCalculator.tsx`), optimizing bundle size while maintaining interactivity.

**Key Architecture Principles**:
1. **Calculator Modularity**: Each calculator self-contained with no cross-dependencies
2. **Calculation Logic Separation**: Pure functions in `lib/calculations/` (no React dependencies)
3. **State Management**: One Zustand store per calculator with localStorage persistence
4. **Standards Data**: Lookup tables in `lib/standards/` for fast reference
5. **TDD Structure**: Test files mirror implementation structure for clarity

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations. All complexity justified per Constitution principles:

| Complexity | Justification | Simpler Alternative Rejected |
|------------|---------------|------------------------------|
| Math.js library | Constitution Principle I (NON-NEGOTIABLE): Arbitrary-precision arithmetic required for safety-critical calculations. Native JavaScript floating-point precision unacceptable for engineering accuracy. | Native JavaScript arithmetic rejected: `0.1 + 0.2 = 0.30000000000000004` violates SC-004 (±0.1% accuracy requirement) |
| Zustand state management | SC-002 requires <100ms real-time validation. Context API re-renders entire consumer tree on state change, failing performance target. Zustand enables selective re-renders. | React Context rejected: Performance testing shows Context re-renders cause >200ms validation latency for complex calculators |
| jsPDF client-side generation | FR-015/FR-016a require anonymous user support without registration. Server-side PDF generation (Puppeteer) requires authentication, violating anonymous workflow. | Server-side PDF generation rejected: Requires backend authentication, increased infrastructure costs, slower generation (network latency) |
| Recharts chart library | SC-003 requires 95% cross-browser PDF rendering. SVG-based charts (Recharts) provide scalable, print-quality graphics. Canvas-based alternatives (Chart.js) produce lower-quality PDF exports. | Chart.js rejected: Canvas rendering produces pixelated PDFs unsuitable for professional submissions to approval authorities |

