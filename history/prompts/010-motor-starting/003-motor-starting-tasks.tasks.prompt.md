---
id: 003
title: Motor Starting Analysis Tasks
stage: tasks
date: 2026-05-04
surface: agent
model: claude-opus-4-7
feature: 010-motor-starting
branch: 010-motor-starting
user: zubairxshah
command: /sp.tasks
labels: [motor-starting, tasks, TDD, MVP, dependency-ordered, dual-standard]
links:
  spec: specs/010-motor-starting/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/010-motor-starting/tasks.md
tests:
  - none (tasks generation stage; T004–T013 will be authored during implementation)
---

## Prompt

/sp.tasks (no user-supplied input — generated against the planning bundle in `specs/010-motor-starting/`).

## Response snapshot

Wrote `specs/010-motor-starting/tasks.md` with 64 tasks across 7 phases, every line conforming to the strict checklist format `- [ ] T### [P?] [US#?] description with file path`.

Phase summary:

| Phase | Tasks | Scope |
|---|---|---|
| 1 Setup | 3 (T001–T003) | TS interfaces, page scaffold, client tool stub |
| 2 Foundational | 25 (T004–T028) | Reference data + 5 method modules + Thevenin + dip + accel time + Zod + orchestrator. **TDD: T004–T013 RED before T015–T027 GREEN, then T028 verifies coverage ≥ 90%** |
| 3 MVP (US1+US2) | 13 (T029–T041) | Zustand store, three input forms, single-method results, 5-method comparison table, current/dip charts, history sidebar, integration tests |
| 4 US3 source chain | 5 (T042–T046) | Advanced source form + Thevenin display + integration test |
| 5 US4 PDF | 4 (T047–T050) | jsPDF generator + button + cross-browser smoke |
| 6 US5 standards switcher | 6 (T051–T056) | NEC↔IEC unit/label/citation toggle + Reference Guide dialog |
| 7 Polish | 8 (T057–T064) | Nav wiring, MEMORY.md update, a11y, error boundary, full test pass |

Critical engineering callouts inside the task text:
- **T010 (autotransformer test)** explicitly tests the line-side current = a² × LRA rule (the most-common hand-calc error and primary source-of-truth for dip accuracy).
- **T028** gates Phase 3 entry on ≥ 90% statement coverage of `lib/calculations/motor-starting/`, matching spec SC-007.
- **T015** lists the exact reference data tables needed (NEMA Code Letters A–V from NEC 430.7(B), IEC Designs N/H, NEMA MG 1 thermal defaults by HP range, IEEE 1668 thresholds, NEC Ch.9 Table 9 / IEC 60364-5-52 cable impedance).

Parallel-execution opportunities: 16 tasks marked `[P]` (independent test-file authoring, independent method-module implementations, independent UI-form components, independent polish tasks). MVP can be shipped in ~30 tasks (Phases 1–3); US3, US4, US5 can be developed in parallel after MVP.

Dependency graph and implementation strategy section call out the recommended order: foundational core → MVP → source-chain → PDF + IEC parity → polish. Three of the optional user stories (US3, US4, US5) are parallelizable across engineers/agents once MVP ships.

Format validation: spot-checked tasks across all 7 phases — every line begins `- [ ]`, every task has a sequential `T###` ID, every Phase 3–6 task carries a `[USx]` label, every implementation task names the exact file path touched.

## Outcome

- ✅ Impact: Tasks ready for execution. Branch on `010-motor-starting`, no commits yet. Suggested next step is to start Phase 1 + Phase 2 RED tests, or open a draft PR after Phase 3 (MVP).
- 🧪 Tests: 0 written; Phase 2 will introduce the full Vitest suite per task descriptions.
- 📁 Files: tasks.md (one file, 64 tasks)
- 🔁 Next prompts: `/sp.implement` to start working through tasks in order; or branch a focused implementation prompt around Phase 2 alone given its size and risk profile (numeric accuracy)
- 🧠 Reflection: This task list is denser than Conduit Fill (40 tasks) because the calculator core has more separable units — five method modules + source chain + dip + accel time = seven independent pure functions to test before any UI work begins. The TDD/coverage gate at T028 is intentionally placed as a hard checkpoint to keep MVP UI work from compounding bugs in the math.

## Evaluation notes (flywheel)

- Failure modes observed: none in this run.
- Graders run and results (PASS/FAIL): tasks.md format check (all 64 entries match `- [ ] T### [P?] [USx?] desc with path`) — PASS.
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): when implementation begins, parallelize T008–T012 (five method-test files) in a single agent batch; that's the largest [P] cluster in the list and the easiest fast-feedback win.
