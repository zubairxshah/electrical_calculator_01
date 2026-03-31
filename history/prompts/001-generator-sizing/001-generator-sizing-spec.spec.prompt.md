---
id: 001
title: Generator Sizing Calculator Specification
stage: spec
date: 2026-03-30
surface: agent
model: claude-opus-4-6
feature: 001-generator-sizing
branch: 001-generator-sizing
user: zubairxshah
command: /sp.specify
labels: ["generator", "sizing", "iso-8528", "ieee-3006", "nfpa-110", "motor-starting"]
links:
  spec: specs/001-generator-sizing/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-generator-sizing/spec.md
  - specs/001-generator-sizing/checklists/requirements.md
tests:
  - null
---

## Prompt

Generator Sizing Calculator — standby/prime rated generators, motor starting analysis (voltage dip, locked rotor), step loading sequences, altitude/temperature derating, fuel consumption estimation. Standards: ISO 8528, IEEE 3006.4, NFPA 110, NEC 700/701/702. Features: multiple load entry with diversity factors, motor starting kVA impact, step loading optimization, generator selection from standard ratings, PDF export.

## Response snapshot

Created full feature specification for Generator Sizing Calculator with 6 user stories (P1-P3): basic load sizing, motor starting analysis, step loading sequence, altitude/temperature derating, fuel consumption, and PDF export. Defined 18 functional requirements covering vector summation, NEMA code letters, starting method multipliers, ISO 8528 derating, and standard generator ratings (15-3000 kVA). All quality checklist items pass. No clarifications needed — reasonable defaults documented in Assumptions section.

## Outcome

- ✅ Impact: Feature specification complete and validated, ready for planning phase
- 🧪 Tests: N/A (specification phase)
- 📁 Files: spec.md created, requirements checklist created
- 🔁 Next prompts: `/sp.clarify` for additional requirement refinement, or `/sp.plan` to begin architectural planning
- 🧠 Reflection: Comprehensive spec leveraging domain knowledge from ISO 8528, IEEE 3006.4, NFPA 110. Motor starting analysis and step loading are the most technically complex areas.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Quality checklist — PASS (all items)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
