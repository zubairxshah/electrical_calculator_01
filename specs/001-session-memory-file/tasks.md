# Tasks: Session Memory File for Project Continuity

**Input**: Design documents from `/specs/001-session-memory-file/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/session-memory.types.ts, research.md

**Tests**: Test-first development (TDD) is required per constitution for critical logic (file generation, parsing, sensitive data filtering).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Project structure (from plan.md):
- `lib/session-memory/` - Core session memory modules
- `__tests__/session-memory/` - Unit and E2E tests
- `.claude/` - Output directory for session-memory.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for session memory feature

- [x] T001 Create directory structure: `lib/session-memory/`, `lib/session-memory/collectors/`, `lib/session-memory/filters/`, `__tests__/session-memory/`
- [x] T002 Create directory for output: `.claude/` in project root
- [x] T003 [P] Copy type definitions from specs/001-session-memory-file/contracts/session-memory.types.ts to lib/session-memory/types.ts
- [x] T004 [P] Create .gitignore entry for `.claude/session-memory.md` (personal state, not team-shared)

**Checkpoint**: Project structure ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create utility module for ISO 8601 timestamp generation in lib/session-memory/utils.ts
- [x] T006 [P] Create utility module for git branch detection in lib/session-memory/git-utils.ts (exec `git rev-parse --abbrev-ref HEAD`)
- [x] T007 [P] Create utility module for project name detection in lib/session-memory/project-utils.ts (parse package.json or directory name)
- [x] T008 Create markdown serializer utility in lib/session-memory/markdown-serializer.ts (convert SessionMemory to markdown string)
- [x] T009 [P] Create markdown parser utility in lib/session-memory/markdown-parser.ts (parse markdown back to SessionMemory structure)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Save Current Project State (Priority: P1) 🎯 MVP

**Goal**: Enable developers to save current project state (tasks, blockers, tests, environment) to `.claude/session-memory.md` for session continuity

**Independent Test**: Create a memory file mid-session, verify it contains task status, blockers, test results, environment state, and next steps. File should be valid markdown under 50KB with no sensitive data.

### Tests for User Story 1 (TDD Required per Constitution)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US1] Unit test for task-collector: Parse tasks.md and extract phase completion status in __tests__/session-memory/task-collector.test.ts
- [x] T011 [P] [US1] Unit test for test-collector: Parse Vitest/Playwright output and extract pass/fail counts in __tests__/session-memory/test-collector.test.ts
- [x] T012 [P] [US1] Unit test for env-collector: Detect servers via netstat/lsof mock in __tests__/session-memory/env-collector.test.ts
- [x] T013 [P] [US1] Unit test for blocker-collector: Extract blockers from TODO/FIXME comments in __tests__/session-memory/blocker-collector.test.ts
- [x] T014 [P] [US1] Unit test for sensitive-data-filter: Verify API keys, passwords, tokens, DB URLs filtered in __tests__/session-memory/sensitive-data-filter.test.ts
- [x] T015 [P] [US1] Unit test for generator: Generate valid SessionMemory structure in __tests__/session-memory/generator.test.ts
- [x] T016 [P] [US1] Unit test for markdown-serializer: Convert SessionMemory to markdown format in __tests__/session-memory/markdown-serializer.test.ts
- [x] T017 [P] [US1] Integration test: End-to-end memory file generation with mock data in __tests__/session-memory/e2e-generation.test.ts
- [x] T018 [US1] E2E test (Playwright): Save command generates .claude/session-memory.md with all required sections in __tests__/session-memory/e2e.test.ts

**Checkpoint**: All tests written and FAILING - ready for implementation

### Implementation for User Story 1

#### Collectors (Parallel - Different Files)

- [x] T019 [P] [US1] Implement task-collector.ts: Read tasks.md, parse markdown, extract phase completion counts, current task, next tasks (max 5)
- [x] T020 [P] [US1] Implement test-collector.ts: Parse Vitest JSON output and Playwright reports, extract pass/fail counts, failure details (max 20)
- [x] T021 [P] [US1] Implement env-collector.ts: Detect active servers using child_process.exec with platform-specific commands (netstat on Windows, lsof on macOS/Linux), scan ports 3000-3099, 5173, 8000-8080
- [x] T022 [P] [US1] Implement blocker-collector.ts: Scan project files for TODO/FIXME comments, identify missing files from tasks, extract test failures as blockers (max 50)

**Checkpoint**: All collectors complete and unit tests passing

#### Sensitive Data Filtering (Critical Security)

- [x] T023 [US1] Implement sensitive-data-filter.ts: Allowlist approach with pattern matching for API keys, passwords, tokens, database URLs per research.md (depends on T019-T022 for input data)

**Checkpoint**: Sensitive data filter complete and unit tests passing (SC-007: zero credential leakage verified)

#### Core Generation Logic

- [x] T024 [US1] Implement generator.ts: Orchestrate all collectors, apply sensitive data filter, build SessionMemory structure, validate <50KB size (depends on T019-T023)
- [x] T025 [US1] Implement metadata generation in generator.ts: Extract project name, timestamp, branch, session duration
- [x] T026 [US1] Implement executive summary generation in generator.ts: Generate 5-sentence summary from collected data (FR-007)
- [x] T027 [US1] Implement next steps generation in generator.ts: Prioritize actions (immediate/short-term/medium-term) based on blockers and tasks
- [x] T028 [US1] Implement file size validation in generator.ts: Truncate sections progressively if >50KB (blockers→50, files→50, failures→20)

**Checkpoint**: Generator complete and all unit tests passing

#### Serialization

- [x] T029 [US1] Implement markdown serialization in markdown-serializer.ts: Convert SessionMemory to structured markdown with fixed sections per data-model.md template (depends on T024-T028)
- [x] T030 [US1] Add markdown table formatting for task status phases in markdown-serializer.ts
- [x] T031 [US1] Add subsections for blockers by priority (High/Medium/Low) in markdown-serializer.ts
- [x] T032 [US1] Add test results formatting (unit and E2E suites) in markdown-serializer.ts
- [x] T033 [US1] Add environment state formatting (servers, dependencies, build) in markdown-serializer.ts

**Checkpoint**: Serialization complete and unit tests passing

#### File Output

- [x] T034 [US1] Implement file write operation in generator.ts: Write markdown content to `.claude/session-memory.md`, create `.claude/` directory if missing, overwrite existing file (depends on T029-T033)
- [x] T035 [US1] Add error handling for file system errors (permission denied, disk full) in generator.ts

**Checkpoint**: File generation complete - User Story 1 fully functional and testable independently

### Validation

- [x] T036 [US1] Run all US1 unit tests and verify 100% pass rate
- [x] T037 [US1] Run integration test and verify generated file structure matches template
- [x] T038 [US1] Run E2E test with real project data and verify file size <50KB, no sensitive data, valid markdown
- [x] T039 [US1] Manual test: Generate memory file for ElectroMate project, verify all sections present and accurate

**Checkpoint**: User Story 1 complete and validated - MVP ready for deployment

---

## Phase 4: User Story 2 - Restore Project Context in New Session (Priority: P1) ✅ COMPLETE

**Status**: Complete - All 25 tasks implemented and tested

**Goal**: Enable Claude Code to automatically load `.claude/session-memory.md` on startup and restore full project context

**Independent Test**: Load a previously saved memory file and verify all sections can be parsed correctly. Test with corrupted files (missing sections, invalid markdown) and verify graceful degradation.

### Tests for User Story 2 (TDD Required)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T040 [P] [US2] Unit test for markdown-parser: Parse valid markdown back to SessionMemory structure in __tests__/session-memory/markdown-parser.test.ts
- [x] T041 [P] [US2] Unit test for markdown-parser: Handle corrupted files (missing sections) and return partial data with warnings in __tests__/session-memory/markdown-parser.test.ts
- [x] T042 [P] [US2] Unit test for markdown-parser: Handle invalid timestamps and fallback to "unknown" in __tests__/session-memory/markdown-parser.test.ts
- [x] T043 [P] [US2] Unit test for validation: Verify ISO 8601 timestamps, percentages 0-100, relative paths in __tests__/session-memory/validator.test.ts
- [x] T044 [US2] E2E test (Playwright): Load existing .claude/session-memory.md and verify Claude Code context includes project state in __tests__/session-memory/e2e.test.ts

**Checkpoint**: All tests written and FAILING - ready for implementation ✅ COMPLETE

### Implementation for User Story 2

#### Parsing Logic

- [x] T045 [US2] Implement markdown-parser.ts: Parse metadata section (project name, timestamp, branch) from markdown header
- [x] T046 [US2] Implement markdown-parser.ts: Parse executive summary section (5 bullets) into ExecutiveSummary interface
- [x] T047 [US2] Implement markdown-parser.ts: Parse task status table into PhaseStatus array
- [x] T048 [US2] Implement markdown-parser.ts: Parse blockers section by priority (High/Medium/Low) into BlockerEntry array
- [x] T049 [US2] Implement markdown-parser.ts: Parse test results sections (unit and E2E) into TestResults interface
- [x] T050 [US2] Implement markdown-parser.ts: Parse environment state sections into EnvironmentState interface
- [x] T051 [US2] Implement markdown-parser.ts: Parse files needing attention list into FileReference array
- [x] T052 [US2] Implement markdown-parser.ts: Parse next steps list into NextStep array

**Checkpoint**: Parser complete for all sections ✅ COMPLETE

#### Error Handling and Validation

- [x] T053 [US2] Implement error handling in markdown-parser.ts: Return partial data with warnings for missing sections (graceful degradation)
- [x] T054 [US2] Implement error handling in markdown-parser.ts: Handle empty file and return default "No session data" structure
- [x] T055 [US2] Create validator module in lib/session-memory/validator.ts: Validate ISO 8601 timestamps, percentages, paths, priorities, array limits (depends on T045-T052)
- [x] T056 [US2] Implement validation in validator.ts: Check for sensitive data in parsed content and log warnings if detected

**Checkpoint**: Parser complete with error handling and validation ✅ COMPLETE

#### Loading Interface

- [x] T057 [US2] Create loader module in lib/session-memory/loader.ts: Check if `.claude/session-memory.md` exists, read file, parse markdown, validate structure (depends on T045-T056)
- [x] T058 [US2] Implement staleness detection in loader.ts: Compare generatedAt timestamp to current date, warn if >3 days old
- [x] T059 [US2] Add file system error handling in loader.ts: Handle missing file (return null), permission errors (log warning)

**Checkpoint**: Loader complete - User Story 2 fully functional and testable independently ✅ COMPLETE

### Validation

- [x] T060 [US2] Run all US2 unit tests and verify 100% pass rate
- [x] T061 [US2] Run E2E test with saved memory file and verify correct parsing
- [x] T062 [US2] Test corrupted file handling: Missing sections, invalid markdown, truncated content
- [x] T063 [US2] Test staleness warning with file >3 days old
- [x] T064 [US2] Manual test: Load memory file and verify all data accessible via TypeScript interfaces

**Checkpoint**: User Story 2 complete and validated - Restore functionality ready

---

## Phase 5: User Story 3 - Quick Status Summary (Priority: P2) ⏸️ DEFERRED

**Status**: Deferred until after ElectroMate core features complete

**Goal**: Ensure executive summary section provides 5-sentence overview for quick project status scanning

**Independent Test**: Generate memory file, extract only executive summary section, verify it answers: What's the project? What's done? What's next? What's blocked?

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T065 [P] [US3] Unit test for summary generation: Verify 5 sentences covering project, completion, phase, blocker, next action in __tests__/session-memory/summary-generator.test.ts
- [ ] T066 [P] [US3] Unit test for summary generation: Test with no blockers (majorBlocker = null) in __tests__/session-memory/summary-generator.test.ts
- [ ] T067 [P] [US3] Unit test for summary generation: Test with 100% complete project (all tasks done) in __tests__/session-memory/summary-generator.test.ts
- [ ] T068 [US3] Integration test: Verify executive summary appears first in markdown output in __tests__/session-memory/summary-integration.test.ts

**Checkpoint**: All tests written and FAILING - ready for implementation

### Implementation for User Story 3

- [ ] T069 [US3] Extract summary generation logic to lib/session-memory/summary-generator.ts from generator.ts (refactor)
- [ ] T070 [US3] Implement projectDescription generation: Read package.json description or use project name
- [ ] T071 [US3] Implement completionStatus generation: Calculate X/Y tasks complete with percentage
- [ ] T072 [US3] Implement currentPhase detection: Identify phase with most incomplete tasks
- [ ] T073 [US3] Implement majorBlocker detection: Select highest-priority blocker or null if none
- [ ] T074 [US3] Implement nextAction generation: Derive from highest-priority blocker or first incomplete task
- [ ] T075 [US3] Ensure executive summary is first section in markdown output (already in template from T029)

**Checkpoint**: User Story 3 complete and testable independently

### Validation

- [ ] T076 [US3] Run all US3 unit tests and verify 100% pass rate
- [ ] T077 [US3] Run integration test and verify summary format
- [ ] T078 [US3] Manual test: Have non-context developer read summary only and answer 4 questions (project, status, blocker, next action)

**Checkpoint**: User Story 3 complete and validated - Quick summary feature ready

---

## Phase 6: Polish & Cross-Cutting Concerns ⏸️ DEFERRED

**Status**: Deferred until after ElectroMate core features complete

**Purpose**: Improvements affecting multiple user stories and production readiness

- [ ] T079 [P] Add comprehensive JSDoc comments to all public functions in lib/session-memory/ modules
- [ ] T080 [P] Create README.md in lib/session-memory/ documenting module architecture and usage
- [ ] T081 Add CLI command integration (if applicable): `/save-session` or `/snapshot` to trigger generator
- [ ] T082 [P] Performance optimization: Cache process detection results for 10 seconds to avoid repeated system calls
- [ ] T083 [P] Add progress indicator for slow operations (file parsing, process detection) - log to console
- [ ] T084 Code cleanup: Remove any TODO comments, unused imports, debug logs
- [ ] T085 [P] Update quickstart.md examples with actual generated memory file from ElectroMate project
- [ ] T086 Run full test suite (all unit, integration, E2E tests) and verify 100% pass rate
- [ ] T087 Generate test coverage report and verify >90% coverage for critical modules (generator, collectors, filter, parser)

---

## Phase 7: Constitution Compliance Verification ⏸️ DEFERRED

**Status**: Deferred until after ElectroMate core features complete

**Purpose**: Validate implementation against constitutional principles (`.specify/memory/constitution.md`)

### Test Coverage Verification (Constitution Principle V)

- [ ] T088 [P] Review test coverage against TDD requirements (nominal, boundary, edge, error cases)
- [ ] T089 [P] Verify Red-Green-Refactor cycle was followed for critical logic (generator, parser, filter)
- [ ] T090 [P] Confirm test cases cover: valid generation, corrupted file handling, sensitive data detection, process scanning accuracy
- [ ] T091 Document any test coverage gaps with justification in specs/001-session-memory-file/test-coverage.md

### Security & Code Quality Verification (Constitution Principles)

- [ ] T092 [P] Verify no hardcoded paths in code - all paths use path.join() with project root detection
- [ ] T093 [P] Verify cross-platform compatibility: Test on Windows (netstat), macOS (lsof), Linux (lsof)
- [ ] T094 [P] Test sensitive data filter with real-world patterns: .env files, connection strings, API key examples
- [ ] T095 [P] Verify allowlist approach in sensitive-data-filter.ts matches research.md allowlist specification
- [ ] T096 [P] Confirm zero external dependencies (only native Node.js: fs, path, child_process)

### Progressive Enhancement Verification (Constitution Principle VII)

- [ ] T097 Confirm User Story 1 (P1) independently testable and deployable without US2/US3
- [ ] T098 Confirm User Story 2 (P1) independently testable and deployable without US3
- [ ] T099 Confirm User Story 3 (P2) independently testable and adds value to US1/US2 without breaking them
- [ ] T100 Validate no dependencies on incomplete features across all user stories

**Checkpoint**: Constitution compliance verified - ready for code review and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (can run in parallel with US1)
- **User Story 3 (Phase 5)**: Depends on US1 completion (refactors generator.ts)
- **Polish (Phase 6)**: Depends on all user stories being complete
- **Constitution Verification (Phase 7)**: Depends on Polish completion

### User Story Dependencies

- **User Story 1 (P1)**: INDEPENDENT - Can start after Foundational (Phase 2)
  - Implements: Save functionality (generate → serialize → write)
- **User Story 2 (P1)**: INDEPENDENT - Can start after Foundational (Phase 2)
  - Implements: Restore functionality (read → parse → validate)
  - Can develop in parallel with US1
- **User Story 3 (P2)**: DEPENDS on US1 - Refactors summary generation from US1
  - Implements: Enhanced executive summary logic

### Within Each User Story

- **US1 Flow**: Tests → Collectors (parallel) → Filter → Generator → Serializer → File Write
- **US2 Flow**: Tests → Parser (all sections in sequence) → Validator → Loader
- **US3 Flow**: Tests → Extract summary logic → Enhance summary generation

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks can run in parallel except T001 (directory creation blocks others)

**Phase 2 (Foundational)**: T005 must complete first, then T006-T009 can run in parallel

**User Story 1 - Collectors**: T019, T020, T021, T022 can all run in parallel (different files)

**User Story 1 - Tests**: T010-T018 can all run in parallel (different test files)

**User Story 2 - Tests**: T040-T044 can all run in parallel (different test files)

**User Story 3 - Tests**: T065-T068 can all run in parallel (different test files)

**Polish Phase**: T079, T080, T082, T083, T085, T087 can run in parallel

**Constitution Verification**: T088-T096 can run in parallel (different validation checks)

---

## Parallel Example: User Story 1 Collectors

```bash
# Launch all collector implementations together (T019-T022):
Task: "Implement task-collector.ts"
Task: "Implement test-collector.ts"
Task: "Implement env-collector.ts"
Task: "Implement blocker-collector.ts"

# All four can proceed independently - different files, no shared dependencies
```

---

## Parallel Example: User Story 1 and 2 Together

```bash
# After Foundational phase completes, two developers can work in parallel:

# Developer A: User Story 1 (Save)
Task: T010-T039 (all US1 tasks)

# Developer B: User Story 2 (Restore)
Task: T040-T064 (all US2 tasks)

# No conflicts - US1 writes files, US2 reads files
# Both can complete independently and merge cleanly
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009)
3. Complete Phase 3: User Story 1 (T010-T039)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Generate memory file with real ElectroMate project data
   - Verify all sections present, valid markdown, <50KB, no sensitive data
   - Manual review by developer unfamiliar with feature
5. Deploy/demo if ready

**MVP Deliverable**: Developers can save project state to `.claude/session-memory.md` with one command

### Incremental Delivery

1. **Milestone 1**: Setup + Foundational → Foundation ready (T001-T009)
2. **Milestone 2**: Add User Story 1 → Test independently → Deploy (MVP!) (T010-T039)
3. **Milestone 3**: Add User Story 2 → Test restore → Deploy (T040-T064)
4. **Milestone 4**: Add User Story 3 → Enhance summary → Deploy (T065-T078)
5. **Milestone 5**: Polish and verify → Production ready (T079-T100)

Each milestone adds value without breaking previous functionality.

### Parallel Team Strategy

With 2 developers after Foundational phase completes:

1. **Developer A**: User Story 1 (Save) - T010-T039
2. **Developer B**: User Story 2 (Restore) - T040-T064

Both stories complete independently, then:

3. **Both**: User Story 3 (Summary) - T065-T078
4. **Both**: Polish & Verification - T079-T100

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability (US1, US2, US3)
- **TDD Required**: Constitution mandates test-first development for critical logic
- **Independent Stories**: Each user story should be independently completable and testable
- **Verify tests fail before implementing**: Red-Green-Refactor cycle
- **Commit strategy**: Commit after each task or logical group (e.g., all collectors)
- **Stop at checkpoints**: Validate story independently before moving to next priority
- **Performance targets**: <10s generation (SC-001), <100ms loading, <50KB file (SC-006)
- **Security critical**: SC-007 requires zero sensitive information leakage - test thoroughly

---

## Task Count Summary

- **Total Tasks**: 100
- **Setup Phase**: 4 tasks
- **Foundational Phase**: 5 tasks
- **User Story 1 (P1)**: 30 tasks (tests + collectors + filter + generator + serializer + file write + validation)
- **User Story 2 (P1)**: 25 tasks (tests + parser + validator + loader + validation)
- **User Story 3 (P2)**: 14 tasks (tests + summary generation + validation)
- **Polish Phase**: 9 tasks
- **Constitution Verification**: 13 tasks

**Parallel Opportunities**:
- Setup: 3 tasks can run in parallel (after T001)
- Foundational: 4 tasks can run in parallel (after T005)
- US1 Collectors: 4 tasks can run in parallel (T019-T022)
- US1 Tests: 9 tasks can run in parallel (T010-T018)
- US2 Tests: 5 tasks can run in parallel (T040-T044)
- US3 Tests: 4 tasks can run in parallel (T065-T068)
- Polish: 6 tasks can run in parallel
- Verification: 9 tasks can run in parallel

**MVP Scope**: Phase 1 + Phase 2 + User Story 1 (T001-T039) = 39 tasks
