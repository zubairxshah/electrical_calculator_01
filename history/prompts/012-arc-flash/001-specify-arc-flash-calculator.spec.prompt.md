---
id: 001
title: Specify Arc Flash Calculator
stage: spec
date: 2026-10-04
surface: agent
model: claude-opus-5-5
feature: 012-arc-flash
branch: 012-arc-flash
user: zubairxshah
command: /sp.specify
labels: ["arc-flash","ieee-1584","nfpa-70e","iec-61482","spec"]
links:
  spec: specs/012-arc-flash/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/012-arc-flash/spec.md
 - specs/012-arc-flash/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

Arc Flash Calculator per IEEE 1584-2018: compute incident energy (cal/cm²), arc flash boundary, arcing current (with variation correction), and PPE category (NFPA 70E-2024 Table 130.7(C)(15)(c) and incident-energy method) for electrical equipment. Inputs: system voltage (208V–15kV), bolted fault current, electrode configuration (VCB, VCBB, HCB, VOA, HOA), enclosure dimensions, gap between conductors, working distance, protective device clearing time (or arcing time). Outputs: arcing current (nominal and reduced), incident energy, arc flash boundary, PPE category and recommended clothing, arc flash label preview, PDF export. Dual-mode support consistent with existing ElectroMate calculators (NEC/IEC context, with IEC 61482 references where applicable), history sidebar, reference guide dialog, and unit tests.

## Response snapshot

Created branch 012-arc-flash and wrote specs/012-arc-flash/spec.md: 5 prioritized user stories (P1 incident energy/AFB, P1 PPE, P2 label+PDF, P2 NEC/IEC mode, P3 history+reference), 23 functional requirements, 7 success criteria (incl. ±2% vs IEEE 1584-2018 Annex D), edge cases for model-range limits, assumptions and out-of-scope (DC, multi-bus). One clarification is open: FR-007, the arcing time source (single manual time / separate times per arcing-current case / derived from protective device TCC). The quality checklist passes except for that marker.

## Outcome

- ✅ Impact: Feature spec drafted; ready for planning once FR-007 is resolved
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: answer Q1 (FR-007), then /sp.plan
- 🧠 Reflection: The reduced-arcing-current case means arcing time can differ between cases, so the arcing time source is the main scope decision

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 hit a parameter-binding error after it created the branch and spec file
- Graders run and results (PASS/FAIL): spec quality checklist — PASS except 1 open clarification
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
