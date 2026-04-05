# Implementation Plan: Conduit/Raceway Fill Calculator

**Branch**: `009-conduit-fill` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-conduit-fill/spec.md`

## Summary

Implement a Conduit/Raceway Fill Calculator that checks NEC Chapter 9 conduit fill compliance. Users select a conduit type and size, add conductors with wire size/insulation/quantity, and the system calculates fill percentage against NEC Table 1 limits (53%/31%/40%/60% nipple). Includes minimum conduit size recommendation, compact conductor support (Table 5A), bare conductor support (Table 8), imperial/metric toggle, visual fill indicator, and PDF export. Follows established ElectroMate calculator architecture: Next.js page + client tool component + Zustand store + pure calculation module + Zod validation + jsPDF export.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 16.1 (Turbopack)
**Primary Dependencies**: React, Tailwind CSS, shadcn/ui, Zustand, mathjs (BigNumber), jsPDF, Zod
**Storage**: localStorage (calculation history via Zustand persist middleware)
**Testing**: Vitest
**Target Platform**: Web (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Fill calculation <50ms, UI responsive at 60fps
**Constraints**: Client-side only calculations, no backend API needed
**Scale/Scope**: Single calculator page with ~6 conduit types × ~16 trade sizes × ~25 conductor sizes × ~8 insulation types = comprehensive NEC Chapter 9 coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Calculation Accuracy (if applicable to engineering/calculation features)
- [x] All calculation formulas identified with applicable standards — NEC 2020 Chapter 9 Tables 1, 4, 4A, 5, 5A, 8
- [x] Test cases from published standards documented — NEC Annex C provides pre-calculated fill tables for validation
- [x] Accuracy tolerance thresholds specified — 100% match with NEC table values (discrete lookup, not interpolation)
- [x] Math.js or equivalent high-precision arithmetic library planned — mathjs BigNumber for area summation

### Safety-First Validation (if applicable to safety-critical features)
- [x] Dangerous condition detection rules defined — overfill (>100%) flagged as code violation, >80% flagged as warning
- [x] Real-time validation approach specified — calculate on every conductor add/remove/edit, <50ms target
- [x] Warning UI treatment defined — red FAIL badge for overfill, yellow warning for >80%, green PASS for compliant
- [x] Edge case validation planned — empty conductor list, zero quantity, invalid combinations

### Standards Compliance and Traceability (if applicable to regulated domains)
- [x] Standard versions specified — NEC 2020, Chapter 9
- [x] Standard references will be displayed in calculation outputs — Table 1, Table 4, Table 5/5A, Table 8 cited
- [x] PDF reports will include section numbers and formula citations — NEC Chapter 9 section references
- [x] Version labeling strategy defined — "NEC 2020 Chapter 9" label in UI and PDF

### Test-First Development
- [x] TDD workflow confirmed for critical calculation logic — Red-Green-Refactor for fill calculations
- [x] Test coverage requirements specified — nominal, boundary (exactly at limit), edge (empty, max conductors), error
- [x] User approval checkpoint planned for test case validation — test cases derived from NEC Annex C
- [x] Test framework and tooling selected — Vitest

### Professional Documentation (if applicable to client-facing tools)
- [x] PDF export requirements defined — inputs, NEC references, areas, fill %, pass/fail, recommendations
- [x] Cross-browser compatibility targets specified — Chrome, Firefox, Safari, Edge
- [x] Disclaimer text prepared — standard ElectroMate disclaimer
- [x] Intermediate calculation steps approach defined — show individual conductor areas and running total

### Progressive Enhancement
- [x] Feature prioritization confirmed — P1: core fill + mixed conductors, P2: min size + nipple, P3: PDF + compact
- [x] Each user story independently testable and deployable
- [x] No dependencies on incomplete higher-priority features
- [x] Incremental value delivery strategy defined — P1 delivers core calculator value

### Other Constitution Principles
- [x] Dual standards support planned — imperial (in²) and metric (mm²) with toggle
- [x] Security requirements addressed — input validation via Zod, no PII, client-side only
- [x] Code quality standards acknowledged — smallest viable diff, no hardcoded values
- [x] Complexity justifications documented — NEC table data is inherently large but essential

## Project Structure

### Documentation (this feature)

```text
specs/009-conduit-fill/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── calculator-api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
app/conduit-fill/
├── page.tsx                          # Next.js page with metadata
└── ConduitFillTool.tsx               # Main client tool component

components/conduit-fill/
├── ConduitFillInputForm.tsx          # Conduit/conductor input form
├── ConduitFillResults.tsx            # Fill results display
└── ConduitFillHistorySidebar.tsx     # Calculation history

lib/
├── calculations/conduit-fill/
│   ├── conduitFillCalculator.ts      # Core fill calculation logic
│   └── conduitFillData.ts            # NEC Chapter 9 table data
├── validation/
│   └── conduitFillValidation.ts      # Zod input validation
└── pdfGenerator.conduitFill.ts       # PDF report generation

stores/
└── useConduitFillStore.ts            # Zustand state management

types/
└── conduit-fill.ts                   # TypeScript interfaces

__tests__/unit/calculations/
└── conduit-fill/
    ├── conduitFillCalculator.test.ts # Fill calculation tests
    └── conduitFillData.test.ts       # NEC table data tests
```

**Structure Decision**: Follows established ElectroMate calculator architecture — one directory per layer (app, components, lib/calculations, lib/validation, stores, types) with feature-specific files in each. No new architectural patterns introduced.

## Complexity Tracking

No constitution violations. Standard calculator implementation using established patterns.

## Implementation Phases

### Phase 1 — P1: Core Fill Calculation (User Stories 1 & 2)

**Goal**: Working conduit fill calculator with single and mixed conductor support.

**Files to create**:
1. `types/conduit-fill.ts` — All TypeScript interfaces
2. `lib/calculations/conduit-fill/conduitFillData.ts` — NEC Chapter 9 Tables 1, 4, 5, 5A, 8
3. `lib/calculations/conduit-fill/conduitFillCalculator.ts` — Core calculation: total area, fill %, pass/fail
4. `lib/validation/conduitFillValidation.ts` — Zod schema for inputs
5. `stores/useConduitFillStore.ts` — Zustand store with persist
6. `components/conduit-fill/ConduitFillInputForm.tsx` — Conduit selector + conductor list editor
7. `components/conduit-fill/ConduitFillResults.tsx` — Results with visual fill bar
8. `components/conduit-fill/ConduitFillHistorySidebar.tsx` — History panel
9. `app/conduit-fill/ConduitFillTool.tsx` — Main tool component
10. `app/conduit-fill/page.tsx` — Next.js page with metadata
11. `__tests__/unit/calculations/conduit-fill/conduitFillCalculator.test.ts` — Unit tests
12. `__tests__/unit/calculations/conduit-fill/conduitFillData.test.ts` — Table data tests

**Navigation integration**:
- Add to "Design & Installation" category in `components/layout/TopNavigation.tsx`
- Add to "Design & Installation" category in `components/layout/Sidebar.tsx`
- Add calculator card to `app/page.tsx`

### Phase 2 — P2: Minimum Size + Nipple Mode (User Stories 3 & 4)

**Goal**: Auto-recommend smallest passing conduit, support 60% nipple fill.

**Files to modify**:
- `lib/calculations/conduit-fill/conduitFillCalculator.ts` — Add `findMinimumConduitSize()` and nipple mode
- `types/conduit-fill.ts` — Add nipple mode flag, recommendation result type
- `components/conduit-fill/ConduitFillInputForm.tsx` — Add nipple toggle, "Find Minimum" button
- `components/conduit-fill/ConduitFillResults.tsx` — Show recommendation
- `__tests__/` — Additional test cases

### Phase 3 — P3: PDF Export + Compact Conductors (User Stories 5 & 6)

**Goal**: Professional PDF export and compact conductor support.

**Files to create/modify**:
- `lib/pdfGenerator.conduitFill.ts` — PDF generation
- `lib/calculations/conduit-fill/conduitFillData.ts` — Add Table 5A compact data
- `types/conduit-fill.ts` — Add compact flag to conductor type
- `components/conduit-fill/ConduitFillInputForm.tsx` — Compact conductor toggle
- `app/conduit-fill/ConduitFillTool.tsx` — Wire up PDF export

## Key Technical Decisions

### NEC Table Data Storage
Store NEC Chapter 9 table data as typed TypeScript objects in `conduitFillData.ts`. Tables are static reference data — no database or API needed. Data includes:
- **Table 1**: Fill percentage limits (1 wire: 53%, 2 wires: 31%, 3+: 40%, nipple: 60%)
- **Table 4**: Conduit internal areas by type and trade size (in² and mm²)
- **Table 5**: Conductor cross-sectional areas by size and insulation type (in² and mm²)
- **Table 5A**: Compact conductor areas (subset of Table 5 entries)
- **Table 8**: Bare conductor areas for grounding

### Fill Calculation Algorithm
```
totalConductorArea = Σ(conductorArea[i] × quantity[i])
allowableFillArea = conduitInternalArea × fillLimitPercent
fillPercent = (totalConductorArea / conduitInternalArea) × 100
pass = fillPercent ≤ fillLimitPercent
```

### Minimum Size Recommendation Algorithm
```
for each tradeSize in conduitType (ascending):
  if totalConductorArea ≤ (conduitArea[tradeSize] × fillLimit):
    return tradeSize
return null (suggest parallel runs)
```

### Unit System
Store all areas in in² (NEC native). Convert to mm² on display when metric selected. Conversion factor: 1 in² = 645.16 mm².
