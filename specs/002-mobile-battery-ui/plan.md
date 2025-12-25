# Implementation Plan: Mobile-Friendly Battery Calculator UI

**Branch**: `002-mobile-battery-ui` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-mobile-battery-ui/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enhance the battery calculator UI with dual time format display (hours + hours/minutes), mobile-responsive layout (320px-2560px), and app-like mobile experience with touch-friendly controls and elegant theming. This is a frontend-only enhancement that improves usability for field engineers using the calculator on mobile devices without modifying existing calculation logic.

## Technical Context

**Language/Version**: TypeScript 5.9.3 / React 18 (Next.js 15.1.1)
**Primary Dependencies**: Next.js 15.1.1, Tailwind CSS 3.4, React 18, Zustand (existing state management)
**Storage**: Client-side state only (no backend changes)
**Testing**: Vitest 4.0.16 for utility functions, manual responsive testing on real devices
**Target Platform**: Mobile-first web application (iOS Safari 15+, Android Chrome 100+, modern desktop browsers)
**Project Type**: Web (frontend enhancement to existing Next.js app)
**Performance Goals**: <3s initial page load on 3G, <300ms layout shift on orientation change, 60fps animations
**Constraints**: No horizontal scrolling, minimum 44px touch targets, WCAG AA contrast, 16px minimum font size
**Scale/Scope**: Single calculator page enhancement, 2-3 component modifications, 1 new utility function (time formatting)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Review `.specify/memory/constitution.md` and verify compliance with all applicable principles:

### Calculation Accuracy (if applicable to engineering/calculation features)
- [N/A] All calculation formulas identified with applicable standards (IEEE, IEC, NEC, BS, NREL)
- [N/A] Test cases from published standards documented for accuracy validation
- [N/A] Accuracy tolerance thresholds specified (e.g., ±2% for battery calculations, ±0.1% for voltage drop)
- [N/A] Math.js or equivalent high-precision arithmetic library planned for implementation

**Rationale**: This is a UI/UX enhancement feature. No calculation formulas are being added or modified. Existing battery calculation logic remains unchanged and is already validated against IEEE 485-2020.

### Safety-First Validation (if applicable to safety-critical features)
- [N/A] Dangerous condition detection rules defined (e.g., discharge rates >1C, voltage drops >3%)
- [N/A] Real-time validation approach specified (target <100ms validation latency)
- [✅] Warning UI treatment defined (red highlighting, explanatory text with code references)
- [N/A] Edge case validation planned (negative values, impossible conditions, physical limits)

**Rationale**: No new safety-critical calculations being added. However, existing warning display will be enhanced for mobile readability (FR-012, proper contrast and sizing).

### Standards Compliance and Traceability (if applicable to regulated domains)
- [N/A] Standard versions specified (e.g., "NEC 2020", "IEC 60364-5-52:2009")
- [N/A] Standard references will be displayed in calculation outputs
- [N/A] PDF reports will include section numbers and formula citations
- [N/A] Version labeling strategy defined for standard updates

**Rationale**: UI enhancement only. Standards compliance is handled by existing calculation logic which is not being modified.

### Test-First Development
- [✅] TDD workflow confirmed for critical logic (time formatting utility)
- [✅] Test coverage requirements specified (nominal, boundary, edge cases for time conversion)
- [N/A] User approval checkpoint planned for test case validation
- [✅] Test framework and tooling selected (Vitest for utility functions)

**Rationale**: Time formatting utility requires TDD (test cases: < 1 minute, normal range, > 100 hours, decimal to hours/minutes conversion accuracy). UI responsiveness will be tested manually on real devices.

### Professional Documentation (if applicable to client-facing tools)
- [N/A] PDF export requirements defined (inputs, formulas, references, timestamps)
- [✅] Cross-browser compatibility targets specified (Chrome 100+, Safari 15+, Firefox 100+, Edge 100+)
- [N/A] Disclaimer text prepared for professional submission materials
- [N/A] Intermediate calculation steps approach defined (e.g., "Show Details" mode)

**Rationale**: This feature focuses on UI responsiveness and time display. PDF export already exists (commented out in BatteryCalculator.tsx). Browser compatibility defined in spec NFR section.

### Progressive Enhancement
- [✅] Feature prioritization confirmed (P1: Time Display, P1: Responsive Layout, P2: App-Like Experience)
- [✅] Each user story independently testable and deployable
- [✅] No dependencies on incomplete higher-priority features
- [✅] Incremental value delivery strategy defined

**Rationale**: User stories are independent - can deploy time formatting without responsive changes, or responsive layout without app-like theming. Each adds standalone value.

### Other Constitution Principles
- [N/A] Dual standards support planned (if applicable: IEC/SI and NEC/North American units)
- [✅] Security requirements addressed (no user data collection, client-side only)
- [✅] Code quality standards acknowledged (smallest viable diff, existing Tailwind patterns)
- [✅] Complexity justifications documented (no new abstractions - using existing Tailwind responsive utilities)

**Rationale**: No backend changes, no data storage. Using existing Tailwind CSS responsive utilities and React patterns. Minimal complexity added.

**GATE STATUS**: ✅ **PASSED** - This is a low-complexity UI enhancement with appropriate testing for new utility functions. No constitution violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
lib/
└── utils/
    └── formatTime.ts           # NEW: Time formatting utility

components/
└── battery/
    ├── BatteryCalculator.tsx   # MODIFIED: Add responsive padding, button layout
    ├── BatteryInputForm.tsx    # MODIFIED: Add inputMode, responsive grid, touch sizing
    └── BatteryResults.tsx      # MODIFIED: Add dual time format display

__tests__/
└── unit/
    └── utils/
        └── formatTime.test.ts  # NEW: Unit tests for time formatting

specs/002-mobile-battery-ui/
├── spec.md                      # Feature specification
├── plan.md                      # This file
├── research.md                  # Research findings
├── data-model.md                # Data structures and interfaces
├── quickstart.md                # Implementation guide
├── contracts/
│   └── time-format.types.ts    # TypeScript type definitions
└── checklists/
    └── requirements.md          # Specification validation checklist
```

**Structure Decision**: Next.js web application with frontend-only changes. No backend, API, or database modifications. This feature enhances existing React components (`components/battery/`) and adds a single utility function (`lib/utils/formatTime.ts`). All changes follow existing project conventions and file organization patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - Constitution check passed. No complexity justifications required.

This is a straightforward UI enhancement using existing patterns:
- Tailwind responsive utilities (already in project)
- Simple time conversion math (no library needed)
- Minimal component modifications (3 files)
- Single new utility function with comprehensive tests
