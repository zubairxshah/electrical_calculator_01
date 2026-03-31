---
id: 004
title: Generator Sizing Task Generation
stage: tasks
date: 2026-03-31
surface: agent
model: claude-opus-4-6
feature: 001-generator-sizing
branch: 001-generator-sizing
user: zubairxshah
command: /sp.tasks
labels: ["generator", "tasks", "tdd", "implementation", "progressive-enhancement"]
links:
  spec: specs/001-generator-sizing/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-generator-sizing/tasks.md
tests:
  - null
---

## Prompt

/sp.tasks — Generate actionable task breakdown for generator sizing calculator.

## Response snapshot

Generated 51 tasks across 10 phases organized by user story:
- Phase 1 (Setup): 6 tasks — types, data tables, validation, store, route scaffold
- Phase 2 (Foundational): 3 tasks — unit conversion, load table UI, generator config form
- Phase 3 (US1 MVP): 7 tasks — TDD tests + vector summation + generator selection + results UI
- Phase 4 (US2): 6 tasks — TDD tests + motor starting kVA + voltage dip + panel UI
- Phase 5 (US3): 4 tasks — step loading calculation + auto-sequence + panel UI
- Phase 6 (US4): 3 tasks — ISO 8528-1 derating + panel UI + orchestrator integration
- Phase 7 (US5): 4 tasks — fuel consumption + SFC interpolation + panel UI
- Phase 8 (US6): 3 tasks — orchestrator composition + PDF generator + export button
- Phase 9 (Polish): 4 tasks — navigation + history sidebar
- Phase 10 (Compliance): 11 tasks — accuracy, safety, standards, PDF cross-browser

TDD included for P1 stories (US1, US2) per constitution mandate. 16 tasks parallelizable. Dependency graph shows US4 can parallel with US1; US3/US5 need US1's loadSummation first. MVP = Phase 1-3 (US1 only).

## Outcome

- ✅ Impact: Complete executable task breakdown ready for implementation
- 🧪 Tests: TDD tasks defined for US1 (T010-T011) and US2 (T017)
- 📁 Files: tasks.md created with 51 tasks
- 🔁 Next prompts: `/sp.implement` to begin implementation, or start manually with Phase 1 Setup
- 🧠 Reflection: Tasks organized per user story for independent delivery. MVP (US1) delivers value in ~16 tasks. Constitution TDD requirement applied to P1 calculation modules.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Format validation — PASS (all tasks have checkbox, ID, story label, file paths)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
