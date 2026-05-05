---
id: 001
title: Motor Starting Analysis Spec
stage: spec
date: 2026-05-04
surface: agent
model: claude-opus-4-7
feature: 010-motor-starting
branch: 010-motor-starting
user: zubairxshah
command: /sp.specify
labels: [motor-starting, specification, dual-standard, NEC, IEC, IEEE]
links:
  spec: specs/010-motor-starting/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/010-motor-starting/spec.md
  - specs/010-motor-starting/checklists/requirements.md
tests:
  - none (spec stage)
---

## Prompt

Motor Starting Analysis Calculator — analyze and compare 5 starting methods (DOL, Star-Delta, Autotransformer, Soft Starter, VFD) for AC induction motors. Dual standard support: NEC 430 + IEC 60034-12 + IEEE 3002.7-2018. Core outputs: (1) voltage dip at PCC with IEEE 1668 limits, (2) starting current profile (LRA, acceleration curve), (3) acceleration time vs motor thermal limit (t6/stall curve), (4) method comparison table (cost, dip, torque, complexity), (5) source impedance chain (utility → transformer → cable → motor), (6) PDF export. Follow existing patterns from Generator Sizing and Conduit Fill calculators (dual-standard switcher, tooltips, reference guide dialog, unit tests, Zustand store, PDF export).

User clarifications captured before spec writing:
- Q1 starting methods: all five (DOL, Star-Delta, Autotransformer, Soft Starter, VFD)
- Q2 standards: both required (NEC 430 + IEC 60034-12 + IEEE 3002.7-2018)
- Q3 outputs: all six confirmed

## Response snapshot

Created branch `010-motor-starting` and wrote `specs/010-motor-starting/spec.md` covering:
- 5 prioritized user stories (P1: single-method analysis + 5-method comparison; P2: source impedance chain + PDF export; P3: NEC/IEC standards switcher), each independently testable.
- 20 functional requirements grouped: Motor Inputs (FR-001..003), Source Impedance (FR-004..007), Starting Method Analysis (FR-008..010), Compliance Checks (FR-011..012), Comparison & Recommendation (FR-013..014), Standards Switcher (FR-015), Output & Export (FR-016..017), UX (FR-018..020).
- Edge cases: locked rotor, insufficient torque, voltage dip > 20%, infinite bus, Y-Δ on 3-lead motors, VFD bypass, multi-motor (out of scope), DC/synchronous (out of scope).
- 7 measurable success criteria (completion time, render time, ±2% accuracy vs IEEE 3002.7 worked examples, usability, PDF export <10s, switcher <200 ms, ≥90% test coverage).
- Assumptions and explicit out-of-scope list for v1.
- Wrote validation checklist at `specs/010-motor-starting/checklists/requirements.md`; all 16 quality items pass with no `[NEEDS CLARIFICATION]` markers.

## Outcome

- ✅ Impact: Spec ready for `/sp.plan`. Branch on `010-motor-starting`, no commits yet.
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: `/sp.plan` to design module/data/UI architecture; consider `/sp.clarify` only if planning surfaces ambiguity
- 🧠 Reflection: PowerShell script choked on `→` and `()` in long description but completed branch creation and template copy before failing — manually finished spec write. Worth filing a lightweight wrapper or quoting helper for future runs.

## Evaluation notes (flywheel)

- Failure modes observed: PowerShell `create-new-feature.ps1` parameter binding rejected the long unicode/punctuation-heavy feature description after branch creation; spec template was still copied so no real damage.
- Graders run and results (PASS/FAIL): requirements.md checklist — PASS (16/16)
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): wrap long descriptions in `@'...'@` here-string when invoking the PS1 script, or pre-write the description to a temp file and pass `-File <path>`.
