# Implementation Plan: Generator Sizing Calculator

**Branch**: `001-generator-sizing` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-generator-sizing/spec.md`

## Summary

Build a Generator Sizing Calculator for ElectroMate following the established calculator architecture pattern: Next.js route + client component + Zustand store + pure calculation module + Zod validation + jsPDF export. The calculator sizes standby/prime generators per ISO 8528, IEEE 3006.4, NFPA 110, and NEC 700/701/702 — covering load summation with vector power, motor starting voltage dip analysis, step loading sequencing, altitude/temperature derating, fuel consumption estimation, and NEC emergency classification. Supports dual frequency (50/60Hz), dual units (metric/imperial per field), and single/three-phase systems.

## Technical Context

**Language/Version**: TypeScript 5.x on Next.js 16.1 (Turbopack), React 19
**Primary Dependencies**: mathjs (BigNumber arithmetic), Zod (validation), Zustand (state), jsPDF (reports), shadcn/ui + Tailwind CSS (UI), lucide-react (icons)
**Storage**: localStorage via Zustand persist middleware (client-only, no server DB for calculations)
**Testing**: Vitest (recommended, aligns with Next.js ecosystem) — currently no test framework in place
**Target Platform**: Web (desktop + tablet), Chrome/Firefox/Safari/Edge
**Project Type**: Web application (Next.js App Router, single repo)
**Performance Goals**: <100ms validation latency, <500ms full calculation cycle for 20+ loads
**Constraints**: Client-side only computation, no server API needed, mathjs BigNumber for precision
**Scale/Scope**: Single calculator page, ~15 source files, max ~50 loads per calculation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Calculation Accuracy (if applicable to engineering/calculation features)
- [x] All calculation formulas identified with applicable standards (ISO 8528, IEEE 3006.4, NFPA 110, NEC 700/701/702)
- [x] Test cases from published standards documented for accuracy validation (vector summation, derating curves, voltage dip formula)
- [x] Accuracy tolerance thresholds specified: ±1% running load, ±5% motor starting transient, ±2% derating per SC-002/SC-003
- [x] Math.js BigNumber arithmetic planned for all power calculations

### Safety-First Validation (if applicable to safety-critical features)
- [x] Dangerous condition detection rules defined: voltage dip >15% (NFPA 110), >20% (industrial); overloaded steps; wet stacking (<30% loading); load exceeds max generator
- [x] Real-time validation approach specified: Zod schema + custom validators, <100ms latency
- [x] Warning UI treatment defined: red highlighting with explanatory text and standard code references (consistent with existing calculators)
- [x] Edge case validation planned: negative values, PF >1, zero load, single-step overload, exceeding max generator size

### Standards Compliance and Traceability (if applicable to regulated domains)
- [x] Standard versions specified: ISO 8528-1, IEEE 3006.4, NFPA 110, NEC 2020 Articles 700/701/702
- [x] Standard references will be displayed in calculation outputs (per FR-018)
- [x] PDF reports will include section numbers and formula citations (per FR-015)
- [x] Version labeling strategy: standard versions noted in types/constants, updatable without logic changes

### Test-First Development
- [x] TDD workflow confirmed for critical calculation logic (vector summation, voltage dip, derating)
- [x] Test coverage requirements specified: nominal, boundary, edge, error cases per constitution
- [x] User approval checkpoint planned for test case validation (before Green phase)
- [x] Test framework: Vitest (to be added if not present; aligns with Next.js/TypeScript)

### Professional Documentation (if applicable to client-facing tools)
- [x] PDF export requirements defined: load schedule, motor starting, step loading, derating, fuel, standards refs
- [x] Cross-browser compatibility: Chrome, Firefox, Safari, Edge (jsPDF client-side)
- [x] Disclaimer text: "Calculations for informational purposes; PE stamp/certification is user's responsibility"
- [x] Intermediate calculation steps: "Show Details" mode for vector summation breakdown, derating factors

### Progressive Enhancement
- [x] Feature prioritization confirmed: P1 (load sizing + motor starting), P2 (step loading + derating), P3 (fuel + PDF)
- [x] Each user story independently testable and deployable
- [x] No dependencies on incomplete higher-priority features
- [x] Incremental value delivery: P1 delivers a working generator sizer; P2 adds engineering depth; P3 adds project deliverables

### Other Constitution Principles
- [x] Dual standards support planned: 50/60Hz frequency, metric/imperial dual input, NEMA + IEC motor data
- [x] Security requirements addressed: input validation via Zod, no server-side data, no auth needed for calculations
- [x] Code quality standards acknowledged: no hardcoded secrets, smallest viable diff, consistent with existing patterns
- [x] Complexity justifications: no new abstractions — follows established calculator pattern exactly

## Project Structure

### Documentation (this feature)

```text
specs/001-generator-sizing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal module contracts)
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
app/generator-sizing/
├── page.tsx                          # Server component (metadata + layout)
└── GeneratorSizingTool.tsx           # Client component (orchestrator)

components/generator-sizing/
├── GeneratorInputForm.tsx            # Load entry, generator config, site conditions
├── LoadTable.tsx                     # Editable load schedule table
├── MotorStartingPanel.tsx            # Motor starting analysis display
├── StepLoadingPanel.tsx              # Step loading sequence editor + results
├── DeratingPanel.tsx                 # Altitude/temperature derating display
├── FuelEstimationPanel.tsx           # Fuel consumption + tank sizing
└── GeneratorResults.tsx              # Summary results + recommended size

lib/calculations/generator-sizing/
├── generatorCalculator.ts            # Main calculation orchestrator
├── loadSummation.ts                  # Vector power summation with diversity
├── motorStarting.ts                  # Motor starting kVA + voltage dip
├── stepLoading.ts                    # Step loading sequence + auto-sequencing
├── derating.ts                       # ISO 8528-1 altitude/temperature derating
├── fuelConsumption.ts                # Diesel/gas consumption + tank sizing
└── generatorData.ts                  # Standard ratings, NEMA codes, derating tables, fuel curves

types/generator-sizing.ts             # All TypeScript interfaces and types

lib/validation/generatorSizingValidation.ts  # Zod schemas

stores/useGeneratorSizingStore.ts     # Zustand store with persist

lib/pdfGenerator.generatorSizing.ts   # PDF report generator
```

**Structure Decision**: Follows the established ElectroMate calculator pattern exactly. Calculation logic split into focused modules (loadSummation, motorStarting, stepLoading, derating, fuelConsumption) rather than a single monolithic file, because each module maps to an independent user story and has distinct formula sets. The orchestrator (`generatorCalculator.ts`) composes them.

## Complexity Tracking

No constitution violations. All patterns follow established conventions.
