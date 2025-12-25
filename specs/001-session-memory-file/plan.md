# Implementation Plan: Session Memory File for Project Continuity

**Branch**: `001-session-memory-file` | **Date**: 2025-12-25 | **Spec**: [D:\prompteng\elec_calc\specs\001-session-memory-file\spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-session-memory-file/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a session memory file system that captures project state (task completion, blockers, test results, environment configuration) to `.claude/session-memory.md` for automatic restoration on Claude Code startup, enabling seamless cross-session continuity without manual context re-explanation.

## Technical Context

**Language/Version**: TypeScript 5.9.3 / Node.js (Next.js 16.1.1 runtime)
**Primary Dependencies**: Node.js fs/path modules (native), process detection via OS commands (ps/tasklist)
**Storage**: File system (`.claude/session-memory.md` markdown file)
**Testing**: Vitest 4.0.16 for unit tests, Playwright 1.57.0 for E2E file generation/loading tests
**Target Platform**: Cross-platform CLI/Node.js environment (Windows/macOS/Linux compatible)
**Project Type**: Single (utility feature integrated into existing Next.js project)
**Performance Goals**: <10 seconds memory file generation (SC-001), <100ms file load on startup
**Constraints**: <50KB file size (SC-006), must work without network access (local file operations only)
**Scale/Scope**: Single developer use, typical projects with ~100-200 tasks, 10-50 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Review `.specify/memory/constitution.md` and verify compliance with all applicable principles:

### Calculation Accuracy (if applicable to engineering/calculation features)
- [N/A] All calculation formulas identified with applicable standards (IEEE, IEC, NEC, BS, NREL)
- [N/A] Test cases from published standards documented for accuracy validation
- [N/A] Accuracy tolerance thresholds specified (e.g., ±2% for battery calculations, ±0.1% for voltage drop)
- [N/A] Math.js or equivalent high-precision arithmetic library planned for implementation

**Rationale**: Session memory file is a developer productivity tool, not an engineering calculation feature. No numerical calculations or standards compliance required.

### Safety-First Validation (if applicable to safety-critical features)
- [N/A] Dangerous condition detection rules defined (e.g., discharge rates >1C, voltage drops >3%)
- [N/A] Real-time validation approach specified (target <100ms validation latency)
- [N/A] Warning UI treatment defined (red highlighting, explanatory text with code references)
- [✅] Edge case validation planned (corrupted files, missing tasks.md, invalid markdown)

**Rationale**: Not a safety-critical feature. However, edge case handling for file corruption/missing data is planned.

### Standards Compliance and Traceability (if applicable to regulated domains)
- [N/A] Standard versions specified (e.g., "NEC 2020", "IEC 60364-5-52:2009")
- [N/A] Standard references will be displayed in calculation outputs
- [N/A] PDF reports will include section numbers and formula citations
- [N/A] Version labeling strategy defined for standard updates

**Rationale**: Not a regulated domain feature; no standards compliance required.

### Test-First Development
- [✅] TDD workflow confirmed for critical logic (file generation, parsing, sensitive data filtering)
- [✅] Test coverage requirements specified (nominal, boundary, edge, error cases)
- [✅] Test framework and tooling selected (Vitest for unit, Playwright for E2E)
- [✅] User approval checkpoint for test cases via tasks.md review

**Rationale**: Critical file generation and sensitive data filtering logic requires TDD. Test cases include: valid generation, corrupted file handling, sensitive data detection, process scanning accuracy.

### Professional Documentation (if applicable to client-facing tools)
- [N/A] PDF export requirements defined (inputs, formulas, references, timestamps)
- [N/A] Cross-browser compatibility targets specified (Chrome, Firefox, Safari, Edge)
- [N/A] Disclaimer text prepared for professional submission materials
- [N/A] Intermediate calculation steps approach defined (e.g., "Show Details" mode)

**Rationale**: Session memory file is for internal developer use, not client-facing professional documentation.

### Progressive Enhancement
- [✅] Feature prioritization confirmed (P1: Save/Restore, P2: Quick Summary - all from spec)
- [✅] Each user story independently testable and deployable (US1: Save, US2: Restore, US3: Summary)
- [✅] No dependencies on incomplete higher-priority features (all stories self-contained)
- [✅] Incremental value delivery strategy defined (implement save first, then restore, then enhancements)

**Rationale**: Spec clearly defines P1 user stories that are independently valuable and testable.

### Other Constitution Principles
- [N/A] Dual standards support planned (if applicable: IEC/SI and NEC/North American units)
- [✅] Security requirements addressed (sensitive data filtering: API keys, passwords, tokens, database URLs)
- [✅] Code quality standards acknowledged (no hardcoded paths, cross-platform compatibility, smallest viable diff)
- [✅] Complexity justifications documented (using native fs/path modules - no external dependencies, simple markdown generation)

**Rationale**: Security principle applied via FR-011 (sensitive data exclusion). Code quality maintained via native Node.js APIs only, no complex abstractions needed.

**GATE STATUS**: ✅ **PASSED** - All applicable constitution principles addressed. Feature is low-complexity utility with appropriate test coverage and security considerations.

**POST-DESIGN RE-EVALUATION** (2025-12-25):

After completing Phase 0 (research.md) and Phase 1 (data-model.md, contracts, quickstart.md), the constitution check is re-evaluated:

- ✅ **Test-First Development**: data-model.md defines comprehensive test cases (nominal, edge, corruption scenarios); test framework confirmed (Vitest + Playwright)
- ✅ **Security**: Sensitive data filtering strategy documented in research.md with allowlist approach per constitution; specific patterns defined for API keys, passwords, tokens, database URLs
- ✅ **Code Quality**: Native Node.js APIs only (fs, path, child_process); no external dependencies added; cross-platform compatibility designed (Windows/macOS/Linux)
- ✅ **Complexity**: No new abstractions introduced; collector pattern is simple and testable; no violations requiring justification
- ✅ **Progressive Enhancement**: Feature independently deployable; no dependencies on incomplete features

**FINAL GATE STATUS**: ✅ **PASSED** - Design maintains constitution compliance. Ready for task generation (`/sp.tasks`).

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
└── session-memory/
    ├── generator.ts          # Core logic for generating memory file content
    ├── parser.ts             # Parse existing memory files (for validation/loading)
    ├── collectors/
    │   ├── task-collector.ts       # Extract task status from tasks.md
    │   ├── test-collector.ts       # Collect test results (Vitest/Playwright)
    │   ├── env-collector.ts        # Detect servers, dependencies, build status
    │   └── blocker-collector.ts    # Identify and document blockers
    ├── filters/
    │   └── sensitive-data-filter.ts  # Remove API keys, passwords, DB URLs
    └── types.ts              # TypeScript interfaces for memory file structure

.claude/
└── session-memory.md         # Generated memory file (output location)

__tests__/
└── session-memory/
    ├── generator.test.ts     # Unit tests for generation logic
    ├── collectors.test.ts    # Tests for all collector modules
    ├── filters.test.ts       # Tests for sensitive data filtering
    └── e2e.test.ts           # Playwright E2E: save → close → restore flow
```

**Structure Decision**: Single project structure (Option 1). This feature integrates into the existing Next.js/TypeScript ElectroMate project as a utility library under `lib/session-memory/`. The modular collector pattern allows independent testing of each data source (tasks, tests, environment, blockers) and clean separation of concerns. Sensitive data filtering is isolated in its own module for security auditability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - Constitution check passed. No complexity justifications required.
