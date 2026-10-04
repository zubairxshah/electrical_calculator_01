---
id: 004
title: Generate Arc Flash Tasks
stage: tasks
date: 2026-10-04
surface: agent
model: claude-opus-5-5
feature: 012-arc-flash
branch: 012-arc-flash
user: zubairxshah
command: /sp.tasks
labels: ["arc-flash","tasks","tdd","ieee-1584","nfpa-70e"]
links:
  spec: specs/012-arc-flash/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/012-arc-flash/tasks.md
tests:
 - none run (tasks stage); 12 test files defined (tables, enclosure, annexD, golden, errata, calculator, validation, ppe, pdf, units, store + full-golden script)
---

## Prompt

/sp.tasks (no additional user input)

## Response snapshot

Generated specs/012-arc-flash/tasks.md with 54 tasks across 9 phases: Setup (3), Foundational (4), US1 calc P1 MVP (18), US2 PPE P1 (6), US3 label/PDF P2 (4), US4 NEC/IEC P2 (5), US5 history/reference/pre-fill P3 (5), Polish (4), Constitution compliance (5). Tests come first in every story (spec FR-023 + Constitution V), with a user-approval checkpoint at T014 and a release-blocking human data-verification task T031 (NFPA 70E-2024 metric boundaries). Calculation tasks restate the verified prototype logic (LV/MV reduced-case term rules, interpolation, enclosure correction) and give exact source URLs for the coefficient tables and golden data, because the research prototype lived only in the session scratchpad. The MVP is US1 + US2 together (energy without PPE isn't safe to ship).

## Outcome

- ✅ Impact: Implementation-ready task list; each task names its files and acceptance values
- 🧪 Tests: none run; test tasks defined first in each story
- 📁 Files: specs/012-arc-flash/tasks.md
- 🔁 Next prompts: /sp.analyze (optional consistency check), then /sp.implement starting with Phase 1–2
- 🧠 Reflection: Annex D values and formulas were embedded directly in the tasks so they can run without chat context

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check — all 54 tasks have a checkbox, ID, story label where required, and file path — PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
