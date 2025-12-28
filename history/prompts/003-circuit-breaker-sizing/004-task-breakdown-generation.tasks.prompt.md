---
id: 004
title: task-breakdown-generation
stage: tasks
date: 2025-12-28
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-circuit-breaker-sizing
branch: 003-circuit-breaker-sizing
user: developer
command: /sp.tasks
labels: ["tasks", "tdd", "user-stories", "breakdown", "circuit-breaker"]
links:
  spec: specs/003-circuit-breaker-sizing/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-circuit-breaker-sizing/tasks.md
tests:
  - Task format validation (143/143 tasks follow checkbox + ID + labels format)
  - Story organization validation (7 user stories properly phased)
  - TDD workflow validation (test tasks before implementation for P1 calculations)
---

## Prompt

User invoked /sp.tasks command with no additional arguments to generate detailed task breakdown for Circuit Breaker Sizing Calculator organized by user story with TDD workflow for calculation logic.

## Response snapshot

**Task Generation Summary:**

Successfully generated comprehensive tasks.md file with 143 tasks organized across 11 phases following strict task format requirements and user story organization principles.

**File Created:** `specs/003-circuit-breaker-sizing/tasks.md` (39KB)

**Task Breakdown by Phase:**

1. **Phase 1 - Setup** (5 tasks, T001-T005):
   - Project directory structure
   - Package.json configuration
   - Vitest test configuration
   - Playwright E2E configuration
   - TypeScript configuration

2. **Phase 2 - Foundational** (11 tasks, T006-T016):
   - Breaker ratings tables (NEC/IEC standards)
   - Trip curves reference data
   - Derating tables (temperature, grouping, installation)
   - TypeScript interfaces (breaker.ts)
   - Zod validation schemas
   - Shared UI components (WarningBanner, Tooltip)

3. **Phase 3 - User Story 1: Basic Circuit Breaker Sizing (P1)** (21 tasks, T017-T037):
   - **TDD Test Tasks First** (T017-T021): Load current tests, safety factor tests, standard rating tests, integration tests, validation tests
   - **Implementation** (T022-T031): loadCurrent.ts, safetyFactors.ts (NEC 125%, IEC correction), standardRatings.ts, breakerSizing.ts orchestrator, logger.ts
   - **UI Components** (T032-T034): BreakerInputForm.tsx, BreakerResults.tsx, BreakerSizingTool.tsx
   - **State & Pages** (T035-T037): useBreakerStore.ts (Zustand + localStorage), app/breaker/page.tsx
   - **Independent Test**: Enter 10kW, 240V, single-phase, PF 0.9, NEC → Verify 60A breaker recommended

4. **Phase 4 - User Story 2: Voltage Drop Analysis (P2)** (13 tasks, T038-T050):
   - Tests for voltage drop calculations (3%, 5%, 10% thresholds)
   - voltageDrop.ts integration with cable calculator logic
   - Cable size recommendation algorithm
   - VoltageDropAnalysis.tsx component with color-coded warnings
   - **Independent Test**: 30A load, 240V, 150ft → Verify voltage drop percentage and warnings

5. **Phase 5 - User Story 3: Advanced Derating (P2)** (14 tasks, T051-T064):
   - Derating factor tests (temperature, grouping, combined)
   - deratingFactors.ts implementation
   - DeratingFactorsDisplay.tsx showing factor breakdown
   - Integration with breaker sizing
   - **Independent Test**: 45°C ambient, 9 cables → Verify derating factors applied correctly

6. **Phase 6 - User Story 4: Short Circuit Protection (P2)** (9 tasks, T065-T073):
   - Short circuit capacity tests
   - shortCircuit.ts breaking capacity filtering
   - ShortCircuitSpecification.tsx component
   - kA rating database integration
   - **Independent Test**: 25kA fault current → Verify only breakers ≥25kA shown

7. **Phase 7 - User Story 5: Breaker Type Recommendations (P3)** (6 tasks, T074-T079):
   - Trip curve recommendation logic tests
   - recommendations.ts (Type B/C/D for IEC, thermal-magnetic vs. electronic for NEC)
   - BreakerTypeRecommendations.tsx component
   - **Independent Test**: Motor load, IEC standard → Verify Type D recommended

8. **Phase 8 - User Story 6: Calculation History (P3)** (10 tasks, T080-T089):
   - History management tests (FIFO, retrieval, persistence)
   - history.ts with localStorage FIFO eviction
   - CalculationHistory.tsx sidebar
   - HistoryEntry.tsx card component
   - Export from history functionality
   - **Independent Test**: Complete 3 calculations across sessions → Verify all stored and retrievable

9. **Phase 9 - User Story 7: PDF Export (P3)** (9 tasks, T090-T098):
   - PDF generation tests
   - pdfExport.ts extending lib/pdfGenerator.ts
   - PDF template with formulas and code references
   - Export button integration
   - **Independent Test**: Complete calculation → Export PDF → Verify contains inputs, formulas, code refs

10. **Phase 10 - Polish & Cross-Cutting** (9 tasks, T099-T107):
    - E2E tests for all 7 user stories (Playwright)
    - Cross-browser testing (Chrome, Firefox, Safari, Edge)
    - Performance optimization (<500ms calculations, <3s PDF)
    - WCAG 2.1 accessibility compliance
    - Console logging structured format
    - Error boundaries and edge case handling
    - README and documentation updates

11. **Phase 11 - Constitution Compliance Verification** (36 tasks, T108-T143):
    - **Calculation Accuracy** (T108-T113): 50+ test scenarios, NEC/IEC standard validation
    - **Safety Validation** (T114-T119): Dangerous condition detection, warning thresholds
    - **Standards Compliance** (T120-T123): Code references, PDF traceability
    - **Test Coverage** (T124-T126): >80% coverage, TDD workflow verification
    - **Professional Documentation** (T127-T130): PDF cross-browser testing
    - **Progressive Enhancement** (T131-T135): Independent story deployment verification
    - **Security & Code Quality** (T136-T139): Input validation, XSS prevention
    - **Dual Standards Support** (T140-T143): NEC/IEC unit conversion accuracy

**Task Format Compliance:**

All 143 tasks follow strict format: `- [ ] T### [P?] [US#] Description with file path`

- **Checkbox**: ✓ All tasks start with `- [ ]`
- **Task ID**: ✓ Sequential T001-T143
- **[P] marker**: ✓ 62 tasks marked parallelizable
- **[US#] label**: ✓ All Phase 3-9 tasks have story labels [US1]-[US7]
- **File paths**: ✓ All tasks specify exact file locations
- **Story labels omitted**: ✓ Setup, Foundational, Polish, Compliance phases have no story labels

**TDD Workflow:**

Constitution-mandated Test-First Development implemented:

- **Red Phase**: Write tests first (T017-T021, T038, T041, etc.)
- **Green Phase**: Implement to pass tests (T022-T031, T042-T045, etc.)
- **Refactor Phase**: Performance optimization in Polish phase (T102-T103)
- **Test Scenarios**: 50+ scenarios from research.md mapped to test tasks

**Dependencies & Execution Order:**

**Sequential Dependencies:**
1. Phase 1 (Setup) → Phase 2 (Foundational) [BLOCKS ALL]
2. Phase 2 → Phase 3+ (User Stories) [can execute in parallel]
3. Phase 3-9 → Phase 10 (Polish)
4. Phase 10 → Phase 11 (Compliance Verification)

**User Story Independence:**
- US1 (Basic Sizing): No dependencies, MVP baseline
- US2 (Voltage Drop): Independent from US1
- US3 (Derating): Independent, integrates with US1 calculations
- US4 (Short Circuit): Independent filtering logic
- US5 (Recommendations): Independent guidance logic
- US6 (History): Independent localStorage feature
- US7 (PDF Export): Depends on all features for complete reports

**Parallel Execution Opportunities:**

Within each phase, tasks marked [P] can execute in parallel:

- **Foundational Phase**: T006-T011 (6 parallel tasks - standards tables)
- **US1 Phase**: T017-T021 (5 parallel test tasks), T022-T031 (10 parallel implementation tasks)
- **US2 Phase**: T038-T041 (4 parallel tasks)
- **US3 Phase**: T051-T058 (8 parallel tasks)

**Implementation Strategies:**

1. **MVP (Minimum Viable Product)** - 37 tasks:
   - Phase 1 (Setup): 5 tasks
   - Phase 2 (Foundational): 11 tasks
   - Phase 3 (US1 Basic Sizing): 21 tasks
   - **Deliverable**: Working breaker calculator with NEC/IEC support

2. **P1+P2 Complete** - 89 tasks:
   - MVP (37) + US2 (13) + US3 (14) + US4 (9) + Polish basics (16)
   - **Deliverable**: Professional-grade calculator with voltage drop, derating, short circuit

3. **Full Feature** - 143 tasks:
   - All user stories + Polish + Constitution Compliance
   - **Deliverable**: Production-ready with history, PDF export, full validation

**Checkpoints & Independent Testing:**

Each user story phase includes:

1. **Goal**: What the story delivers
2. **Independent Test**: Standalone verification criteria
3. **Checkpoint**: Before-proceeding validation

Examples:
- **US1 Checkpoint**: "Can calculate breaker size for continuous loads with correct NEC 125% factor"
- **US2 Checkpoint**: "Can analyze voltage drop and recommend cable sizes when exceeding thresholds"
- **US3 Checkpoint**: "Can apply temperature and grouping derating factors with code references"

**Test Scenario Coverage:**

53 test scenarios from research.md distributed across:

- Basic NEC single-phase: 8 scenarios (T017)
- Basic NEC three-phase: 4 scenarios (T017)
- IEC breaker sizing: 4 scenarios (T018)
- Temperature derating: 3 scenarios (T051)
- Grouping derating: 3 scenarios (T052)
- Combined derating: 2 scenarios (T053)
- Voltage drop: 6 scenarios (T038, T041)
- Short circuit capacity: 5 scenarios (T065)
- Breaker type recommendations: 6 scenarios (T074)
- Edge cases: 12 scenarios (T020, T041, T053, T065, T074, T086)

**Standards Compliance:**

- **NEC 2020/2023**: Articles 210.20(A), 240.6(A), 310.15(B)(2)(a), 310.15(C)(1)
- **IEC 60364-5-52**: Tables B.52.5, B.52.14, B.52.17
- **IEC 60898-1**: Trip curve specifications
- **UL 489**: Breaker ratings

**Key File Locations:**

- Calculations: `lib/calculations/breaker/*.ts`
- Standards: `lib/standards/breakerRatings.ts`, `lib/standards/tripCurves.ts`
- Validation: `lib/validation/breakerValidation.ts`
- State: `stores/useBreakerStore.ts`
- Components: `components/breaker/*.tsx`
- Tests: `__tests__/unit/calculations/breaker/*.test.ts`
- E2E: `__tests__/e2e/breaker-calculator.spec.ts`
- Page: `app/breaker/page.tsx`

**Ready for Implementation:** All 143 tasks are immediately executable with clear file paths, TDD workflow, and independent testing criteria. Implementation can begin with `/sp.implement` or manual execution following the phased approach.

## Outcome

- ✅ Impact: Generated 143 tasks organized across 11 phases with strict format compliance, TDD workflow for P1 calculations, and independent testing criteria for all 7 user stories
- 🧪 Tests: 53 test scenarios from research.md mapped to test tasks; TDD workflow (Red-Green-Refactor) documented; test coverage requirements specified (>80%)
- 📁 Files: Created tasks.md (39KB) with complete task breakdown
- 🔁 Next prompts: Run `/sp.implement` to execute tasks automatically, or manually work through tasks in order starting with Phase 1 (Setup)
- 🧠 Reflection: Task generation successfully leveraged general-purpose agent (Sonnet) for comprehensive breakdown. All 143 tasks follow strict checkbox format with sequential IDs, parallel markers, story labels, and file paths. Organization by user story enables independent implementation and testing per Progressive Enhancement principle. TDD requirements from constitution properly integrated with test tasks before implementation. 62 tasks marked parallelizable for team collaboration. MVP scope clearly defined (37 tasks: Setup + Foundational + US1). Each user story includes goal, independent test criteria, and checkpoint validation. Dependencies properly sequenced with Foundational phase blocking user stories. Constitution compliance verification phase ensures all 8 principles validated. Ready for immediate implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None - task generation completed successfully with full format compliance
- Graders run and results (PASS/FAIL): Task format validation PASS (143/143 tasks), Story organization PASS (7 stories properly phased), TDD workflow PASS (test tasks before implementation), Parallel opportunities PASS (62 tasks marked)
- Prompt variant (if applicable): Standard /sp.tasks workflow with general-purpose agent delegation
- Next experiment (smallest change to try): Consider generating task time estimates based on similar tasks in project history; evaluate whether task IDs should use story prefixes (US1-T001 vs T001) for better tracking across parallel story development
