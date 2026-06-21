---
id: 13
title: Battery Calculator Revamp Tasks
stage: tasks
date: 2026-06-21
surface: agent
model: claude-opus-4-8
feature: 011-battery-revamp
branch: 011-battery-revamp
user: zubairxshah
command: /sp.tasks
labels: ["battery", "tasks", "tdd", "sizing", "chemistry-migration", "datasheet", "pdf-export"]
links:
  spec: specs/011-battery-revamp/spec.md
  ticket: null
  adr: history/adr/006-battery-sizing-methodology.md
  pr: null
files:
 - specs/011-battery-revamp/tasks.md
tests:
 - none yet (tasks define the TDD suites: T013/T015/T016/T023/T024/T030/T035/T044)
---

## Prompt

proceed to /sp.tasks

(Workflow: load plan/spec/research/data-model/contracts, generate dependency-ordered tasks.md organized by user story, with TDD test tasks since the constitution mandates it.)

## Response snapshot

Ran check-prerequisites.ps1 (FEATURE_DIR confirmed, all design docs present), read tasks-template.md. Generated specs/011-battery-revamp/tasks.md: 60 tasks (T001–T060), organized by the 6 user stories, tests INCLUDED (Constitution Principle V — TDD non-negotiable for P1 calculators).

Structure:
- Phase 1 Setup (3): engine module dir + shim, Vitest scaffolding, dep confirmation.
- Phase 2 Foundational (11, BLOCKING): 3 decision checkpoints requiring user sign-off (T004 FLA profile, T005 Peukert defaults, T006 IEEE 485 fixtures), then peukert field, chemistryChemistryMap, types, Zod schema, validation, store persist version+migrate, and the shared derating module (TDD T013→T014).
- Phase 3 US1 (P1, MVP, 8): chemistry-aware runtime engine + dischargeCurve (tests first T015/T016), dispatcher, store wiring, form canonical chemistry, results applied-factors.
- Phase 4 US2 (P1, 7): reverse sizing + bankConfig (tests T023/T024), mode switch component, mode-aware form/results.
- Phase 5 US3 (P2, 5): default-resolution + source labeling + recommendations.
- Phase 6 US4 (P2, 4): datasheet library + picker + conflict warning.
- Phase 7 US5 (P2, 5): side-by-side sticky layout, hero metric, Recharts chart, pdfGenerator.battery.ts + re-enable PDF.
- Phase 8 US6 (P3 stretch, 3): tesseract/pdfjs extraction (reuses ADR-005) + upload/confirm UI.
- Phase 9 Polish (6) incl. design-sync of final Battery patterns; Phase 10 Constitution verification (8).

Every task uses the required checklist format with IDs, [P] markers, [US#] labels, and explicit file paths. Dependencies, parallel examples, MVP/incremental strategy documented. The 3 open items are encoded as hard gating tasks (T004–T006) so implementation can't start the dependent data/tests without user sign-off.

## Outcome

- ✅ Impact: Immediately-executable, dependency-ordered task plan; MVP = Phases 1–3 (fixes the live chemistry defect).
- 🧪 Tests: 8 TDD suites defined to be written failing-first across engine + datasheets.
- 📁 Files: specs/011-battery-revamp/tasks.md.
- 🔁 Next prompts: resolve T004–T006 (FLA profile, Peukert defaults, IEEE 485 fixtures) with the user, then /sp.implement (or implement MVP US1 first).
- 🧠 Reflection: Encoding the 3 research open-items as gating tasks T004–T006 (rather than burying them in prose) makes the user-approval checkpoint enforceable in the task flow.

## Evaluation notes (flywheel)

- Failure modes observed: none this stage; check-prerequisites.ps1 ran clean.
- Graders run and results (PASS/FAIL): format validation — PASS (all tasks have checkbox + ID + file path; story labels only on US phases; [P] only where files are independent).
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): during /sp.implement, start with T013/T014 (derating) as the first Red→Green to validate the fixture/Peukert decisions before building runtime/sizing on top.
