---
id: 004
title: session memory tasks
stage: tasks
date: 2025-12-25
surface: agent
model: claude-sonnet-4-5
feature: 001-session-memory-file
branch: 001-session-memory-file
user: developer
command: /sp.tasks
labels: ["tasks", "breakdown", "tdd", "implementation", "session-memory"]
links:
  spec: D:\prompteng\elec_calc\specs\001-session-memory-file\spec.md
  ticket: null
  adr: null
  pr: null
files:
  - D:\prompteng\elec_calc\specs\001-session-memory-file\tasks.md
tests:
  - none (task generation phase)
---

## Prompt

/sp.tasks

## Response snapshot

Executed the sp.tasks workflow to generate comprehensive task breakdown for the Session Memory File feature. Generated 100 testable tasks organized by user story:

**Task Organization**:
- Phase 1: Setup (4 tasks) - Project structure, directories, gitignore
- Phase 2: Foundational (5 tasks) - Core utilities (timestamps, git, project name, markdown serializer/parser)
- Phase 3: User Story 1 - Save Project State (P1, 30 tasks) - TDD with 9 test tasks, then implement collectors (task, test, env, blocker), sensitive data filter, generator, serializer, file write
- Phase 4: User Story 2 - Restore Context (P1, 25 tasks) - TDD with 5 test tasks, then implement markdown parser, validator, loader with error handling
- Phase 5: User Story 3 - Quick Summary (P2, 14 tasks) - TDD with 4 test tasks, then refactor summary generation from US1
- Phase 6: Polish (9 tasks) - Documentation, CLI integration, performance optimization, test coverage
- Phase 7: Constitution Verification (13 tasks) - TDD compliance, security validation, cross-platform testing, progressive enhancement checks

**Test-First Development (TDD)**:
- Constitution requires TDD for critical logic (file generation, parsing, sensitive data filtering)
- Total 18 test tasks across US1 (9), US2 (5), US3 (4)
- All tests written FIRST and must FAIL before implementation (Red-Green-Refactor)
- Test coverage: nominal cases, boundary cases, edge cases (corrupted files, missing data), error cases
- Unit tests (Vitest) for all collectors, generator, parser, filter, validator
- Integration tests for end-to-end flows
- E2E tests (Playwright) for real file generation/loading

**Key Technical Decisions from Research/Plan**:
- Native OS commands for process detection (netstat on Windows, lsof on macOS/Linux)
- Allowlist approach for sensitive data filtering per constitution
- Modular collector pattern (task, test, env, blocker) for independent testing
- Markdown serializer/parser for human-readable output
- Progressive truncation if file >50KB (blockers→50, files→50, failures→20)

**Parallel Opportunities Identified**:
- Setup: 3 tasks parallel (after directory creation)
- Foundational: 4 tasks parallel (after timestamps util)
- US1 Collectors: 4 tasks parallel (T019-T022 - different files)
- US1 Tests: 9 tasks parallel (T010-T018)
- US2 Tests: 5 tasks parallel (T040-T044)
- US3 Tests: 4 tasks parallel (T065-T068)
- Polish: 6 tasks parallel
- Constitution Verification: 9 tasks parallel
- **User Stories 1 and 2 can run completely in parallel** (different developers)

**Independent Test Criteria Per Story**:
- US1: Generate memory file, verify task status, blockers, tests, environment captured; <50KB; no sensitive data; valid markdown
- US2: Load existing memory file, parse all sections correctly, handle corrupted files gracefully with warnings
- US3: Extract executive summary only, verify 5-sentence format answers project status questions

**Dependencies**:
- Setup → Foundational (BLOCKS all user stories)
- Foundational → US1 and US2 (can proceed in parallel)
- US1 → US3 (US3 refactors summary generation from US1)
- All US complete → Polish → Constitution Verification

**MVP Scope**: Phase 1 + Phase 2 + User Story 1 = 39 tasks
- Delivers: Save project state to `.claude/session-memory.md` with one command
- Independent test: Generate memory file and verify completeness

**File Structure** (from plan.md):
- lib/session-memory/ - Core modules (generator, parser, collectors/, filters/, types, utils)
- __tests__/session-memory/ - Unit and E2E tests
- .claude/session-memory.md - Generated output file

**Format Compliance**:
- ✅ All 100 tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- ✅ Task IDs: T001-T100 (sequential execution order)
- ✅ [P] markers: 35 tasks marked parallelizable (different files, no dependencies)
- ✅ [Story] labels: US1 (30 tasks), US2 (25 tasks), US3 (14 tasks)
- ✅ Exact file paths in descriptions for all implementation tasks
- ✅ No story labels for Setup, Foundational, Polish, Constitution phases (correct)

## Outcome

- ✅ Impact: Complete task breakdown with TDD approach; 100 tasks spanning setup, implementation, testing, polish, constitution verification; MVP clearly defined (39 tasks); parallel opportunities maximizing efficiency
- 🧪 Tests: 18 test tasks defined (9 US1, 5 US2, 4 US3) following Red-Green-Refactor; test framework (Vitest + Playwright) confirmed; constitution TDD requirement satisfied
- 📁 Files: Created tasks.md with comprehensive task list, dependencies, parallel examples, implementation strategy
- 🔁 Next prompts: /sp.implement (begin implementation following TDD workflow)
- 🧠 Reflection: TDD approach ensures critical logic (sensitive data filter, file generation, parsing) validated before deployment; modular collector pattern enables parallel development of US1 collectors; US1 and US2 independence allows two-developer parallel workflow; MVP scope (39 tasks) delivers core value (save state) without restore/summary enhancements

## Evaluation notes (flywheel)

- Failure modes observed: None; all workflows completed successfully
- Graders run and results (PASS/FAIL): N/A (task generation phase)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): During implementation, validate that TDD workflow (Red-Green-Refactor) produces higher quality sensitive data filtering than implementation-first approach; measure by counting sensitive data patterns that slip through in testing vs TDD approach
