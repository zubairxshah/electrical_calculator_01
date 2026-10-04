---
id: 003
title: Plan Arc Flash Calculator
stage: plan
date: 2026-10-04
surface: agent
model: claude-opus-5-5
feature: 012-arc-flash
branch: 012-arc-flash
user: zubairxshah
command: /sp.plan
labels: ["arc-flash","ieee-1584","nfpa-70e","plan","research","golden-data"]
links:
  spec: specs/012-arc-flash/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/012-arc-flash/plan.md
 - specs/012-arc-flash/research.md
 - specs/012-arc-flash/data-model.md
 - specs/012-arc-flash/contracts/calculation-api.md
 - specs/012-arc-flash/quickstart.md
 - specs/012-arc-flash/spec.md (NFPA table reference correction)
tests:
 - research spike (scratchpad, not committed) — prototype engine vs 144,000-row IEEE 1584-2018 spreadsheet dataset, both cases, max rel. error 2.4e-6
 - research spike — Annex D.1 / D.2 headline values reproduced exactly
---

## Prompt

/sp.plan (no additional user input)

## Response snapshot

Completed Phase 0 + Phase 1. Research found two MIT reference implementations (jgrimard JS, rwl Rust) and the 144k-row IEEE spreadsheet dataset (LiaungYip). Cross-checked Table 1 between the sources. Resolved a VOA Table 2 constant conflict (0.33696 is correct; 0.334627 is a typo). Identified two IEEE spreadsheet v2.6.6 errata (600 V branch; VOA MV reduced) and found that the standard's text matches the golden data. A prototype engine matched all 144k rows (both nominal and reduced) and every Annex D.1/D.2 value, so the method is de-risked before implementation. Decisions: two arcing times; native doubles instead of mathjs BigNumber (a justified deviation from ADR-003, ADR amendment suggested); a 2,000-row golden subset committed as a test fixture; IEC mode = same engine plus IEC 61482 presentation; NFPA clothing lists paraphrased. Corrected the spec's table-method reference to NFPA 70E Table 130.7(C)(15)(a). Constitution gate PASS with one documented deviation. A release-blocking data-verification task was flagged for the NFPA 70E-2024 metric approach-boundary values.

## Outcome

- ✅ Impact: Plan and design artifacts complete; the calculation method was verified against official data before any production code
- 🧪 Tests: research spike only (scratchpad); production tests defined in plan/quickstart
- 📁 Files: plan.md, research.md, data-model.md, contracts/calculation-api.md, quickstart.md; spec.md corrected
- 🔁 Next prompts: /sp.adr native-arithmetic-for-empirical-models (optional), then /sp.tasks
- 🧠 Reflection: The golden dataset turned the accuracy requirement from "trust the transcription" into a mechanical check; the reduced-case term rules (R4) were the subtle part and are now pinned by tests

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.ps1 reported success but made no change to CLAUDE.md (no technology-list markers present); WebFetch declined to transcribe the NFPA tables (copyright), so the saved PDF was read directly for numeric values
- Graders run and results (PASS/FAIL): Constitution Check — PASS (1 justified deviation)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
