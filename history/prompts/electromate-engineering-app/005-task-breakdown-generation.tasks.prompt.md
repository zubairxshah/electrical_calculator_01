---
id: 005
title: ElectroMate Task Breakdown Generation
stage: tasks
date: 2025-12-24
surface: agent
model: claude-sonnet-4-5-20250929
feature: electromate-engineering-app
branch: 001-electromate-engineering-app
user: zubairxshah
command: /sp.tasks
labels: ["tasks", "tdd", "progressive-enhancement", "constitution-compliance"]
links:
  spec: specs/001-electromate-engineering-app/spec.md
  ticket: null
  adr: history/adr/001-nextjs-app-router-selection.md, history/adr/002-zustand-state-management.md, history/adr/003-mathjs-high-precision-arithmetic.md, history/adr/004-client-side-pdf-generation.md
  pr: null
files:
  - specs/001-electromate-engineering-app/tasks.md
tests:
  - Validated all 155 tasks follow strict checklist format (checkbox, ID, parallel marker, story label, file path)
  - Verified TDD workflow enforced for P1 calculations (tests before implementation)
  - Confirmed user story independence (no cross-story dependencies)
  - Validated parallel execution opportunities identified (44 parallelizable tasks)
---

## Prompt

(Empty - user invoked /sp.tasks without additional arguments)

## Response snapshot

Successfully generated comprehensive task breakdown for ElectroMate electrical engineering calculation platform with 155 tasks organized across 10 phases following Constitution Principle V (Test-First Development) and Principle VII (Progressive Enhancement).

**Task Organization**:

**Phase 1: Setup** (9 tasks)
- T001-T009: Next.js 15 initialization, dependency installation, configuration files (tsconfig, next.config, tailwind, drizzle, vitest, playwright)

**Phase 2: Foundational** (36 tasks) - BLOCKS all user stories
- T010-T014: Math.js BigNumber config (CRITICAL - first task), unit conversion, TypeScript types
- T015-T022: shadcn/ui component installation (Button, Input, Card, Alert, Select, Tooltip, Label)
- T023-T027: Layout components (Sidebar navigation, Header with unit toggle, Footer with MZS CodeWorks, root layout, landing page)
- T028-T032: BetterAuth + Neon PostgreSQL setup (schemas, DB client, auth config, API routes, migration)
- T033-T038: Shared utilities (PDF generator, localStorage migration, validation hooks, chart export, standards references)
- T039-T044: Shared calculator components (CalculationCard, InputField, ResultDisplay, WarningBanner, PDFDownloadButton, StorageWarningBanner)

**Phase 3: User Story 1 - Battery Backup Calculator (P1)** (18 tasks) 🎯 MVP
- T045-T047: Tests FIRST (TDD Red phase - IEEE 485 Example 4.2.1, discharge rate validation, input validation)
- T048-T050: Calculation logic (backupTime.ts, dischargeRate.ts, dischargeCurve.ts with Peukert's Law)
- T051-T053: Validation + State (Zod schema, dangerous condition checks, Zustand store with localStorage persist)
- T054-T060: UI implementation (page route, calculator component, discharge chart, real-time validation, PDF integration)
- T061-T062: TDD validation (verify tests pass, profile <100ms performance)

**Phase 4: User Story 2 - UPS Sizing Tool (P1)** (16 tasks)
- T063-T065: Tests (IEEE 1100 diversity factor, power factor conversion, growth margin)
- T066-T068: Calculation logic (diversityFactor.ts, powerFactor.ts, sizing.ts with standard UPS sizes)
- T069-T071: Validation + State (LoadItem Zod schema, unusual power factor warnings, load list management)
- T072-T078: UI + API (page, component with dynamic load list, load chart, API endpoints, PDF with diversity breakdown)

**Phase 5: User Story 3 - Cable Sizing (P1)** (19 tasks)
- T079-T081: Tests (voltage drop formula IEC 60364, ampacity lookup NEC Table 310.15(B)(16), derating factors)
- T082-T084: Standards data (cableTables.ts with NEC/IEC data, deratingTables.ts, dual standards support)
- T085-T088: Calculation logic (voltageDrop.ts, ampacity.ts, deratingFactors.ts, cableSizing.ts)
- T089-T097: Validation + State + UI (comprehensive voltage enum, dangerous condition checks, cable store, voltage dropdown with LV/MV/DC categories, red highlighting for >3% violations, API, PDF with derating breakdown)

**Phase 6: User Story 4 - Solar Array Sizing (P2)** (11 tasks)
- T098-T108: Tests, calculation logic (arraySize.ts, performanceRatio.ts), validation, state, UI with PSH/PR inputs, generation chart, API, PDF

**Phase 7: User Story 5 - Charge Controller Selection (P2)** (6 tasks)
- T109-T114: MPPT/PWM recommendation logic with 125% V_oc safety margin, validation, UI with controller comparison table, PDF

**Phase 8: User Story 6 - Battery Comparison Tool (P3)** (5 tasks)
- T115-T119: Battery type reference data (VRLA/Li-Ion/NiCd), comparison table UI with filtering, tooltips, PDF export

**Phase 9: Polish & Cross-Cutting** (8 tasks)
- T120-T127: Web Worker PDF optimization, validation profiling, localStorage/migration integration tests, E2E Playwright tests, cross-browser PDF testing, accessibility audit (WCAG 2.1 AA), README

**Phase 10: Constitution Compliance Verification** (27 tasks)
- T128-T155: Comprehensive validation against all 7 constitutional principles
  - Calculation accuracy (4 tasks): IEEE/IEC/NEC standard validation
  - Safety validation (4 tasks): Dangerous condition detection, <100ms performance
  - Standards compliance (3 tasks): PDF references, version labeling, disclaimers
  - Test coverage (2 tasks): TDD workflow verification, nominal/boundary/edge/error coverage
  - Professional documentation (3 tasks): Cross-browser PDF testing, required elements, calculation details
  - Progressive enhancement (4 tasks): Independent user story validation
  - Security & code quality (4 tasks): No secrets, input validation, auth flows, retention policy
  - Dual standards support (4 tasks): Unit conversion accuracy, voltage coverage, cable table lookups

**Task Count Summary**:
- Total: 155 tasks
- MVP (Setup + Foundational + US1): 48 tasks
- P1 Complete (Setup + Foundational + US1 + US2 + US3): 78 tasks
- Full Platform: 155 tasks

**Format Compliance**: All 155 tasks follow strict checklist format:
- ✅ Checkbox: `- [ ]`
- ✅ Sequential ID: T001-T155
- ✅ Parallel markers: 44 tasks marked [P] for independent execution
- ✅ Story labels: All user story tasks marked [US1]-[US6]
- ✅ Exact file paths: Every task includes specific file path

**TDD Workflow**: Tests written FIRST for all P1 calculations (Constitution Principle V):
- Battery: T045-T047 (tests) before T048-T050 (implementation)
- UPS: T063-T065 (tests) before T066-T068 (implementation)
- Cables: T079-T081 (tests) before T085-T088 (implementation)

**Progressive Enhancement**: All 6 user stories independently testable (Constitution Principle VII):
- Independent test criteria defined for each story
- No cross-story dependencies (different routes, stores, components)
- Can deploy P1 before P2/P3 exist
- Checkpoints after each story for validation

**Parallel Execution Opportunities**:
- Within phases: 44 tasks marked [P] can run in parallel (different files, no dependencies)
- Across user stories: US1, US2, US3 can run in parallel after Foundational (if multiple developers)
- Critical path: Setup (9) → Foundational (36) → US1 (18) sequential minimum = 63 tasks

## Outcome

- ✅ Impact: Generated production-ready task breakdown with 155 tasks enabling systematic implementation of ElectroMate from MVP (Battery Calculator) through full platform (6 calculators) with constitution compliance validation
- 🧪 Tests: Format validation (all tasks follow checklist format), TDD enforcement (tests before implementation for P1), independence validation (no cross-story dependencies), parallel opportunities identified (44 [P] tasks)
- 📁 Files: tasks.md (474 lines, 155 tasks, 10 phases, dependency graph, implementation strategies)
- 🔁 Next prompts: Begin implementation (npm install), /sp.implement (execute tasks systematically), or manual task execution starting with T001
- 🧠 Reflection: Task generation successfully translated planning artifacts (plan.md, data-model.md, contracts/, 4 ADRs) into actionable, testable tasks organized by Progressive Enhancement principle. Key strengths: (1) TDD workflow enforced with tests preceding implementation for safety-critical calculations (ADR-003: Math.js precision), (2) User story independence enables parallel development and incremental delivery (Constitution Principle VII), (3) Constitutional compliance verification phase ensures all 7 principles validated before production, (4) Clear MVP scope (48 tasks) provides achievable first milestone validating entire tech stack.

## Evaluation notes (flywheel)

- Failure modes observed: None - all 155 tasks properly formatted, organized by user story, with clear dependencies
- Graders run and results (PASS/FAIL): Format Compliance (PASS - all tasks have checkbox + ID + file path), TDD Enforcement (PASS - tests before implementation for P1), User Story Independence (PASS - no cross-story dependencies), Parallel Opportunities (PASS - 44 tasks marked [P]), Constitution Alignment (PASS - Phase 10 validates all 7 principles)
- Prompt variant (if applicable): Standard /sp.tasks workflow with complete planning artifacts available (spec, plan, research, data-model, contracts, ADRs)
- Next experiment (smallest change to try): Consider adding task time estimates if team requests project timeline planning (currently timeline-free per professional objectivity guidelines)
