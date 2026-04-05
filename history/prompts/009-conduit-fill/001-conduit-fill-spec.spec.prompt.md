---
id: 1
title: Conduit Fill Calculator Spec
stage: spec
date: 2026-04-05
surface: agent
model: claude-opus-4-6
feature: 009-conduit-fill
branch: 009-conduit-fill
user: zubairxshah
command: /sp.specify
labels: ["conduit-fill", "nec-chapter-9", "specification"]
links:
  spec: specs/009-conduit-fill/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/009-conduit-fill/spec.md
  - specs/009-conduit-fill/checklists/requirements.md
tests:
  - null
---

## Prompt

see what's next
2
(User selected item #2 from next steps: Conduit/Raceway Fill Calculator - NEC Chapter 9)

## Response snapshot

Created feature specification for Conduit/Raceway Fill Calculator on branch `009-conduit-fill`. Spec covers 6 user stories: single conduit fill check (P1), mixed conductor types (P1), conduit size recommendation (P2), nipple fill 60% rule (P2), PDF export (P3), and compact conductor support (P3). 16 functional requirements based on NEC Chapter 9 Tables 1, 4, 5, 5A, and 8. Supports EMT, RMC, IMC, PVC-40/80, FMC, LFMC conduit types with wire sizes #18 AWG through 2000 kcmil. Quality checklist passed all items. Scope explicitly excludes cable assemblies, wireways, and cable trays.

## Outcome

- Impact: Feature spec created, ready for clarification or planning phase
- Tests: N/A (spec phase)
- Files: spec.md, checklists/requirements.md
- Next prompts: /sp.clarify or /sp.plan
- Reflection: NEC Chapter 9 is well-defined with unambiguous table data, allowing spec creation without clarification questions

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 partial error on prompts directory creation (non-blocking)
- Graders run and results (PASS/FAIL): Quality checklist PASS (all items)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
