# Implementation Plan: Lighting Design Calculator

**Branch**: `004-lighting-design` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-lighting-design/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Professional-grade lighting design calculator for indoor/commercial spaces with manual parameter input and premium visual input (PDF/floor plan analysis via Tesseract.js). Implements IES/CIE lumen method calculations, uniformity analysis, and PDF report generation. Supports both indoor (IESNA) and outdoor/roadway (IES RP-8, CIE 140) lighting standards. Technical approach follows existing ElectroMate patterns: modular calculation functions, Zustand state management, Math.js BigNumber precision, jsPDF exports.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with Next.js 16.1.1 (App Router)
**Primary Dependencies**: React 19.2.3, Math.js 15.1.0 (BigNumber), Zustand 5.0.9, jsPDF 3.0.4, Tesseract.js (visual input), pdf.js (PDF rendering), Zod 4.2.1 (validation), Radix UI (components)
**Storage**: Neon PostgreSQL via Drizzle ORM (user designs, luminaire catalog); localStorage (calculation history via Zustand persist)
**Testing**: Vitest 4.0.16 with @testing-library/react; Playwright 1.57.0 for E2E
**Target Platform**: Web application (responsive desktop/tablet), Chrome/Firefox/Safari/Edge
**Project Type**: Web application (integrated into existing ElectroMate Next.js app)
**Performance Goals**: Calculation <2s, PDF generation <10s, Visual analysis <30s (per spec constraints)
**Constraints**: Max room 100m×100m×50m, PDF upload 10MB limit, illuminance precision ±0.1 lux, luminaire count precision ±1
**Scale/Scope**: 50+ luminaire catalog entries, 50-calculation localStorage history, unlimited basic calculations with 3/month visual analysis (freemium)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Review `.specify/memory/constitution.md` and verify compliance with all applicable principles:

### Calculation Accuracy (if applicable to engineering/calculation features)
- [x] All calculation formulas identified with applicable standards (IEEE, IEC, NEC, BS, NREL)
  - Indoor: IESNA Lighting Handbook lumen method (N = E×A / F×UF×MF)
  - Outdoor: IES RP-8 (American roadway), CIE 140 (International roadway)
  - Energy: ASHRAE 90.1 for consumption estimates
- [x] Test cases from published standards documented for accuracy validation
  - IESNA Lighting Handbook example calculations (Chapter 9)
  - IES RP-8 Table examples for roadway pole spacing
- [x] Accuracy tolerance thresholds specified (e.g., ±2% for battery calculations, ±0.1% for voltage drop)
  - Calculation accuracy: ±5% of IESNA handbook formula results (SC-002)
  - Illuminance precision: ±0.1 lux
  - Luminaire count: ±1 fixture
- [x] Math.js or equivalent high-precision arithmetic library planned for implementation
  - Math.js 15.1.0 BigNumber (already in project, 64-digit precision)

### Safety-First Validation (if applicable to safety-critical features)
- [x] Dangerous condition detection rules defined (e.g., discharge rates >1C, voltage drops >3%)
  - Flag illuminance >1000 lux for offices (excessive, energy waste)
  - Warn when uniformity ratio <0.3 (poor distribution)
  - Alert when SHR exceeds luminaire max recommended ratio
- [x] Real-time validation approach specified (target <100ms validation latency)
  - Debounced validation (300ms) consistent with breaker calculator
  - Zod schema validation for all inputs
- [x] Warning UI treatment defined (red highlighting, explanatory text with code references)
  - Reuse WarningBanner component with severity levels
- [x] Edge case validation planned (negative values, impossible conditions, physical limits)
  - Room dimensions: 1-100m per dimension
  - Reflectances: 0-100%
  - Illuminance: 50-5000 lux range

### Standards Compliance and Traceability (if applicable to regulated domains)
- [x] Standard versions specified (e.g., "NEC 2020", "IEC 60364-5-52:2009")
  - IESNA Lighting Handbook 10th Edition
  - IES RP-8-18 (Roadway Lighting)
  - CIE 140:2019 (Road Lighting Calculations)
  - ASHRAE 90.1-2019 (Energy Standard)
- [x] Standard references will be displayed in calculation outputs
  - Formula references in results (e.g., "per IESNA Lumen Method")
- [x] PDF reports will include section numbers and formula citations
  - Follow pdfGenerator.breaker.ts pattern
- [x] Version labeling strategy defined for standard updates
  - Standard dropdown allowing future version additions

### Test-First Development
- [x] TDD workflow confirmed for critical calculation logic (Red-Green-Refactor)
  - P1 calculations (User Story 1, 5) follow TDD
- [x] Test coverage requirements specified (nominal, boundary, edge, error cases)
  - Nominal: Standard office 12×8×3m at 500 lux
  - Boundary: Min/max room sizes, min/max illuminance
  - Edge: Zero reflectance, single luminaire scenarios
  - Error: Negative dimensions, impossible UF values
- [x] User approval checkpoint planned for test case validation
  - Test cases verified against IESNA examples before Green phase
- [x] Test framework and tooling selected
  - Vitest 4.0.16, @testing-library/react

### Professional Documentation (if applicable to client-facing tools)
- [x] PDF export requirements defined (inputs, formulas, references, timestamps)
  - Room parameters, luminaire data, illuminance results
  - Formula with variable definitions
  - Standard references (IESNA, CIE, ASHRAE)
  - Generation timestamp and ElectroMate version
- [x] Cross-browser compatibility targets specified (Chrome, Firefox, Safari, Edge)
  - jsPDF client-side generation (95% success rate target)
- [x] Disclaimer text prepared for professional submission materials
  - "Calculations for informational purposes; PE stamp/certification is user's responsibility"
- [x] Intermediate calculation steps approach defined (e.g., "Show Details" mode)
  - Expandable sections showing Room Index, UF lookup, MF application

### Progressive Enhancement
- [x] Feature prioritization confirmed (P1/P2/P3 from spec)
  - P1: Basic indoor calculation (US1), PDF reports (US5)
  - P2: Visual input (US2), Advanced analysis (US3)
  - P3: Outdoor/roadway (US4), Luminaire catalog (US6)
- [x] Each user story independently testable and deployable
  - US1 delivers standalone value without US2-US6
- [x] No dependencies on incomplete higher-priority features
  - P1 features independent; P2/P3 extend P1
- [x] Incremental value delivery strategy defined
  - Phase 1: Manual input + basic calc + PDF (MVP)
  - Phase 2: Visual input + uniformity analysis
  - Phase 3: Outdoor + catalog management

### Other Constitution Principles
- [x] Dual standards support planned (if applicable: IEC/SI and NEC/North American units)
  - Unit toggle: meters/feet, lux/footcandles (fc = lux × 0.0929)
- [x] Security requirements addressed (input validation, authentication, data retention)
  - Zod input validation, file type verification for uploads
  - Premium features gated by subscription status
- [x] Code quality standards acknowledged (no hardcoded secrets, smallest viable diff)
  - Follow existing patterns, minimal new dependencies
- [x] Complexity justifications documented (if introducing abstraction layers or dependencies)
  - Tesseract.js: Required for zero-cost OCR (spec decision Q1)
  - pdf.js: Required for PDF floor plan rendering

## Project Structure

### Documentation (this feature)

```text
specs/004-lighting-design/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   └── lighting.openapi.yaml
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
app/
├── lighting/
│   ├── page.tsx                    # Lighting calculator route
│   └── LightingDesignTool.tsx      # Main orchestrator component

components/
├── lighting/
│   ├── LightingInputForm.tsx       # Manual room/luminaire inputs
│   ├── LightingResults.tsx         # Results display with expandable details
│   ├── VisualInputSection.tsx      # PDF/image upload (P2 - Premium)
│   ├── UniformityAnalysis.tsx      # Uniformity heatmap (P2)
│   ├── RoadwayLightingSection.tsx  # Outdoor calculations (P3)
│   ├── LuminaireCatalog.tsx        # Catalog browser/selector (P3)
│   └── LuminaireSelector.tsx       # Dropdown with luminaire data

lib/
├── calculations/
│   └── lighting/
│       ├── lightingCalculator.ts   # ORCHESTRATOR: main entry point
│       ├── roomIndex.ts            # RI = (L×W)/(H×(L+W))
│       ├── lumenMethod.ts          # N = (E×A)/(F×UF×MF)
│       ├── averageIlluminance.ts   # Eavg = (N×F×UF×MF)/A
│       ├── spacingRatio.ts         # SHR validation
│       ├── energyConsumption.ts    # kWh/year = (W×hours×365)/1000
│       ├── uniformityRatio.ts      # Emin/Eavg analysis (P2)
│       └── outdoor/
│           ├── iesRp8.ts           # IES RP-8 roadway (P3)
│           └── cie140.ts           # CIE 140 international (P3)
├── standards/
│   ├── luminaireCatalog.ts         # Built-in luminaire data (50+ fixtures)
│   ├── utilizationFactorTables.ts  # UF lookup by RI and reflectances
│   ├── spaceTypePresets.ts         # Illuminance presets by space type
│   └── reflectanceDefaults.ts      # Surface reflectance recommendations
├── validation/
│   └── lightingValidation.ts       # Zod schemas + warnings
├── visual/
│   ├── floorPlanAnalyzer.ts        # Tesseract.js OCR orchestrator (P2)
│   └── dimensionExtractor.ts       # Dimension parsing from OCR (P2)
├── pdfGenerator.lighting.ts        # Lighting-specific PDF generation

stores/
└── useLightingStore.ts             # Zustand store with persist

__tests__/
└── unit/
    └── calculations/
        └── lighting/
            ├── roomIndex.test.ts
            ├── lumenMethod.test.ts
            ├── averageIlluminance.test.ts
            ├── spacingRatio.test.ts
            ├── energyConsumption.test.ts
            └── uniformityRatio.test.ts
```

**Structure Decision**: Web application integrated into existing ElectroMate Next.js codebase. Follows established patterns from breaker calculator (modular calculations in `lib/calculations/`, Zustand store, component hierarchy with orchestrator pattern). New dependencies: Tesseract.js for visual input, pdf.js for PDF floor plan rendering.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| Tesseract.js (~2MB) | Visual input OCR for floor plan dimension extraction | Cloud API rejected (per-page costs violate spec Q1 decision); manual dimension entry is baseline, OCR adds premium value |
| pdf.js (~500KB) | Render PDF floor plans for visual input | No alternative for client-side PDF rendering; required for premium feature |

No constitution violations. Both dependencies are justified per spec clarification decisions (Q1: Local OCR prioritizing accessibility and zero per-page costs).

## Implementation Phases

### Phase 1: MVP (P1 User Stories)
**Scope**: User Story 1 (Basic Indoor Calculation) + User Story 5 (PDF Report)

**Deliverables**:
- Manual input form for room dimensions, reflectances, luminaire selection
- Lumen method calculations with IESNA accuracy (±5%)
- Results display with Room Index, luminaire count, energy consumption
- PDF report generation with formulas, references, and professional disclaimer
- Zustand store with localStorage persistence
- Unit tests for all calculation modules

**Success Criteria**:
- Engineer completes basic calculation in <60 seconds (SC-001)
- Accuracy within ±5% of IESNA handbook examples (SC-002)
- PDF generation <10 seconds (SC-004)

### Phase 2: Premium Features (P2 User Stories)
**Scope**: User Story 2 (Visual Input) + User Story 3 (Advanced Analysis)

**Deliverables**:
- PDF/image upload with Tesseract.js OCR
- Dimension extraction with confidence scoring
- Uncertainty flagging for ambiguous measurements
- Uniformity ratio analysis (Emin/Eavg)
- Optimization recommendations for improved uniformity
- DIALux comparison baseline (parameter-based approximation)

**Success Criteria**:
- Dimension extraction ≥90% accuracy on readable plans (SC-003)
- Visual analysis <30 seconds

### Phase 3: Extended Features (P3 User Stories)
**Scope**: User Story 4 (Outdoor/Roadway) + User Story 6 (Luminaire Catalog)

**Deliverables**:
- IES RP-8 roadway lighting calculations
- CIE 140 international roadway calculations
- Pole layout diagram generation
- Luminaire catalog browser with filtering
- Custom luminaire save/load for registered users

## Key Formulas and Standards

### Indoor Lighting (IESNA Lumen Method)

```
Room Index (RI) = (L × W) / (H_m × (L + W))
where:
  L = room length (m)
  W = room width (m)
  H_m = mounting height above work plane (m)

Luminaires Required (N) = (E × A) / (F × UF × MF)
where:
  E = required illuminance (lux)
  A = room area (m²)
  F = luminaire lumens (lm)
  UF = utilization factor (0.5-0.8, from tables)
  MF = maintenance factor (0.7-0.9, typically 0.8 for LED)

Average Illuminance (E_avg) = (N × F × UF × MF) / A

Energy Consumption = (Total_Watts × Hours_per_day × 365) / 1000 (kWh/year)
```

### Outdoor/Roadway (IES RP-8, CIE 140)

```
Average Illuminance (roadway) = (Φ × UF × MF) / (S × W)
where:
  Φ = luminaire lumens
  S = pole spacing (m)
  W = road width (m)
  UF = utilization factor for roadway
  MF = maintenance factor

Uniformity Ratio (U_0) = E_min / E_avg
  - Minimum U_0 = 0.4 for residential roads
  - Minimum U_0 = 0.35 for highways

Longitudinal Uniformity (U_l) = E_min / E_max along centerline
  - Minimum U_l = 0.6 for most road classes
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tesseract.js accuracy <90% on complex PDFs | Medium | High | Fallback to manual entry with uncertainty flags; user confirmation required |
| UF table lookup complexity | Low | Medium | Start with simplified zonal cavity method; expand tables incrementally |
| Performance on large floor plans | Medium | Medium | Implement canvas downscaling, web worker for OCR processing |
| Standards version updates | Low | Low | Version dropdown with default to latest; document version-specific differences |

## Dependencies for Implementation

### New npm packages required:
```bash
npm install tesseract.js pdfjs-dist
```

### Existing packages (already in project):
- math.js (BigNumber precision)
- jspdf + html2canvas (PDF generation)
- zustand (state management)
- zod (validation)
- @radix-ui/* (UI components)

## Next Steps

After plan approval:
1. Run `/sp.tasks` to generate detailed task breakdown
2. Begin Phase 1 implementation following TDD (Red-Green-Refactor)
3. Validate accuracy against IESNA handbook examples before deployment
