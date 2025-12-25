# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Review `.specify/memory/constitution.md` and verify compliance with all applicable principles:

### Calculation Accuracy (if applicable to engineering/calculation features)
- [ ] All calculation formulas identified with applicable standards (IEEE, IEC, NEC, BS, NREL)
- [ ] Test cases from published standards documented for accuracy validation
- [ ] Accuracy tolerance thresholds specified (e.g., ±2% for battery calculations, ±0.1% for voltage drop)
- [ ] Math.js or equivalent high-precision arithmetic library planned for implementation

### Safety-First Validation (if applicable to safety-critical features)
- [ ] Dangerous condition detection rules defined (e.g., discharge rates >1C, voltage drops >3%)
- [ ] Real-time validation approach specified (target <100ms validation latency)
- [ ] Warning UI treatment defined (red highlighting, explanatory text with code references)
- [ ] Edge case validation planned (negative values, impossible conditions, physical limits)

### Standards Compliance and Traceability (if applicable to regulated domains)
- [ ] Standard versions specified (e.g., "NEC 2020", "IEC 60364-5-52:2009")
- [ ] Standard references will be displayed in calculation outputs
- [ ] PDF reports will include section numbers and formula citations
- [ ] Version labeling strategy defined for standard updates

### Test-First Development
- [ ] TDD workflow confirmed for critical calculation logic (Red-Green-Refactor)
- [ ] Test coverage requirements specified (nominal, boundary, edge, error cases)
- [ ] User approval checkpoint planned for test case validation
- [ ] Test framework and tooling selected

### Professional Documentation (if applicable to client-facing tools)
- [ ] PDF export requirements defined (inputs, formulas, references, timestamps)
- [ ] Cross-browser compatibility targets specified (Chrome, Firefox, Safari, Edge)
- [ ] Disclaimer text prepared for professional submission materials
- [ ] Intermediate calculation steps approach defined (e.g., "Show Details" mode)

### Progressive Enhancement
- [ ] Feature prioritization confirmed (P1/P2/P3 from spec)
- [ ] Each user story independently testable and deployable
- [ ] No dependencies on incomplete higher-priority features
- [ ] Incremental value delivery strategy defined

### Other Constitution Principles
- [ ] Dual standards support planned (if applicable: IEC/SI and NEC/North American units)
- [ ] Security requirements addressed (input validation, authentication, data retention)
- [ ] Code quality standards acknowledged (no hardcoded secrets, smallest viable diff)
- [ ] Complexity justifications documented (if introducing abstraction layers or dependencies)

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
