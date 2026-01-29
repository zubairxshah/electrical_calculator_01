# Implementation Plan: Lightning Arrester Calculator

**Branch**: `1-lightning-arrester-calculator` | **Date**: 2026-01-27 | **Spec**: specs/1-lightning-arrester-calculator/spec.md
**Input**: Feature specification from `/specs/1-lightning-arrester-calculator/spec.md`

## Summary

Development of a standards-compliant Lightning Arrester Calculator that enables electrical engineers to select appropriate lightning protection devices (Conventional, ESE, MOV) based on system voltage, environmental conditions, and compliance requirements. The calculator will validate selections against IEC 60099-4 and NEC 2020/2023 standards, and generate PDF reports for professional documentation.

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js 18+
**Primary Dependencies**: React 18, Next.js 14, Math.js for precise calculations, jsPDF for PDF generation
**Storage**: Client-side localStorage for input preservation, potential server-side storage for registered users
**Testing**: Jest for unit tests, Cypress for integration tests, calculation accuracy tests against IEC/NEC standards
**Target Platform**: Web application (Chrome, Firefox, Safari, Edge compatible)
**Project Type**: Web application with client-side calculation engine
**Performance Goals**: Real-time calculation updates <100ms, PDF generation <2s
**Constraints**: <200ms p95 validation latency, accessible UI, offline capability for basic calculations
**Scale/Scope**: Designed for electrical engineers, contractors, and facility managers globally

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Review `.specify/memory/constitution.md` and verify compliance with all applicable principles:

### Calculation Accuracy (if applicable to engineering/calculation features)
- [x] All calculation formulas identified with applicable standards (IEEE, IEC, NEC, BS, NREL)
- [x] Test cases from published standards documented for accuracy validation
- [x] Accuracy tolerance thresholds specified (e.g., ±2% for battery calculations, ±0.1% for voltage drop)
- [x] Math.js or equivalent high-precision arithmetic library planned for implementation

### Safety-First Validation (if applicable to safety-critical features)
- [x] Dangerous condition detection rules defined (e.g., discharge rates >1C, voltage drops >3%)
- [x] Real-time validation approach specified (target <100ms validation latency)
- [x] Warning UI treatment defined (red highlighting, explanatory text with code references)
- [x] Edge case validation planned (negative values, impossible conditions, physical limits)

### Standards Compliance and Traceability (if applicable to regulated domains)
- [x] Standard versions specified (e.g., "NEC 2020", "IEC 60099-4:2018")
- [x] Standard references will be displayed in calculation outputs
- [x] PDF reports will include section numbers and formula citations
- [x] Version labeling strategy defined for standard updates

### Test-First Development
- [x] TDD workflow confirmed for critical calculation logic (Red-Green-Refactor)
- [x] Test coverage requirements specified (nominal, boundary, edge, error cases)
- [x] User approval checkpoint planned for test case validation
- [x] Test framework and tooling selected

### Professional Documentation (if applicable to client-facing tools)
- [x] PDF export requirements defined (inputs, formulas, references, timestamps)
- [x] Cross-browser compatibility targets specified (Chrome, Firefox, Safari, Edge)
- [x] Disclaimer text prepared for professional submission materials
- [x] Intermediate calculation steps approach defined (e.g., "Show Details" mode)

### Progressive Enhancement
- [x] Feature prioritization confirmed (P1/P2/P3 from spec)
- [x] Each user story independently testable and deployable
- [x] No dependencies on incomplete higher-priority features
- [x] Incremental value delivery strategy defined

### Other Constitution Principles
- [x] Dual standards support planned (if applicable: IEC/SI and NEC/North American units)
- [x] Security requirements addressed (input validation, authentication, data retention)
- [x] Code quality standards acknowledged (no hardcoded secrets, smallest viable diff)
- [x] Complexity justifications documented (if introducing abstraction layers or dependencies)

## Project Structure

### Documentation (this feature)

```text
specs/1-lightning-arrester-calculator/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── lightning-arrester/
│   │   ├── CalculatorForm.tsx
│   │   ├── ResultsDisplay.tsx
│   │   ├── ComplianceBadge.tsx
│   │   └── ReportPreview.tsx
│   └── ui/
│       ├── InputField.tsx
│       ├── Select.tsx
│       └── Button.tsx
├── services/
│   ├── lightning-arrester/
│   │   ├── calculationEngine.ts
│   │   ├── validation.ts
│   │   ├── standardsCompliance.ts
│   │   └── pdfGenerator.ts
│   └── utils/
│       ├── unitsConverter.ts
│       └── mathUtils.ts
├── models/
│   ├── LightningArrester.ts
│   ├── CalculationParameters.ts
│   └── ComplianceResult.ts
├── constants/
│   └── standards.ts
└── lib/
    └── math.ts
```

**Structure Decision**: Selected web application structure with dedicated components and services for the lightning arrester calculator, following the existing project architecture and enabling easy integration with other electrical calculation tools.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Math.js library | High-precision arithmetic required for electrical calculations | Native JavaScript arithmetic insufficient for required accuracy per constitution |
| Client-side PDF generation | Professional documentation required per constitution | Server-side PDF generation would require additional infrastructure |