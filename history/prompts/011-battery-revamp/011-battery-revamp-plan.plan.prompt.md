---
id: 11
title: Battery Calculator Revamp Plan
stage: plan
date: 2026-06-21
surface: agent
model: claude-opus-4-8
feature: 011-battery-revamp
branch: 011-battery-revamp
user: zubairxshah
command: /sp.plan
labels: ["battery", "sizing", "ieee-485", "peukert", "architecture", "chemistry-migration", "datasheet-ocr", "pdf-export"]
links:
  spec: specs/011-battery-revamp/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/011-battery-revamp/plan.md
 - specs/011-battery-revamp/research.md
 - specs/011-battery-revamp/data-model.md
 - specs/011-battery-revamp/contracts/sizing-engine.contract.md
 - specs/011-battery-revamp/contracts/chemistry-data.contract.md
 - specs/011-battery-revamp/quickstart.md
 - CLAUDE.md
tests:
 - none (planning stage; TDD fixtures defined in contracts for /sp.tasks)
---

## Prompt

proceed to /sp.plan

## Response snapshot

Ran setup-plan.ps1, read the spec + constitution, and grounded the plan in the actual codebase (battery store, schema, validation, types/calculations.ts, package.json, PDF-generator pattern).

Key codebase findings that shaped the plan:
- Chemistry mismatch is THREE-way: batterySchema.ts Zod enum (VRLA-AGM/VRLA-Gel/FLA/LiFePO4/Li-ion/NiCd) ≠ batteryTypes.ts BatteryChemistry (8 canonical) ≠ what types/calculations.ts already types. The Zod runtime enum and the TS type already disagree.
- The store persists inputs to localStorage (key electromate-battery) → reconciling chemistry IDs REQUIRES a persist version bump + migrate() so returning users' saved legacy IDs don't break the new enum.
- tesseract.js and pdfjs-dist are ALREADY in package.json → datasheet OCR (P3) is feature code, not a new dependency; recharts/jspdf/html2canvas/mathjs/vitest all present.
- types/calculations.ts already scaffolds temperature, minVoltage, dischargeCurve, and battery warning types — partially ready for the new method.

Decided architecture: promote monolithic lib/calculations/battery.ts → lib/calculations/battery/ module (runtime, sizing, derating, bankConfig, dischargeCurve) mirroring motor-starting; add batteryChemistryMap.ts (legacy→canonical) and datasheets/ (library + extract). Method: corrected-capacity formula bidirectional (Required_Ah = Load·t/(V·DoD·Temp·Eff·Aging); invert for runtime), DoD/efficiency/temp-coefficient sourced from batteryTypes.ts, EOL aging 0.8 default, Peukert exponent (new per-chemistry field) for rate derating. UI: shared kit + Radix Tabs mode switch + Recharts discharge chart + new pdfGenerator.battery.ts, side-by-side sticky layout.

Wrote plan.md (Technical Context, Constitution Check = PASS, source tree, empty Complexity table), research.md (6 decisions D1–D6 + 3 open items), data-model.md (SizingInputSet/SizingResult/AppliedFactors/BankConfig/DatasheetEntry + migration), contracts/ (sizing-engine G1–G5 guarantees; chemistry-data C1–C7 incl. persist migration C4 and OCR-confirmation C6/C7), quickstart.md. Ran update-agent-context.ps1 (updated CLAUDE.md tech stack). Constitution re-checked post-design: still PASS; TDD NON-NEGOTIABLE for this P1 calculator.

## Outcome

- ✅ Impact: Complete Phase 0/1 design for 011-battery-revamp; architecture, methodology, contracts, and migration strategy ready for task breakdown.
- 🧪 Tests: none yet; sizing-engine contract defines G1 (chemistry sensitivity), G2 (round-trip), G3 (±2% IEEE 485), G4 (<100ms), G5 (totality) as the Vitest targets.
- 📁 Files: plan.md, research.md, data-model.md, 2 contracts, quickstart.md, CLAUDE.md (agent context).
- 🔁 Next prompts: /sp.adr battery-sizing-methodology (ADR still recommended), then /sp.tasks to generate the TDD task breakdown. Confirm IEEE 485 fixture values + Peukert defaults + FLA-profile question at task time.
- 🧠 Reflection: The localStorage chemistry migration is the easy-to-miss risk; surfacing it in the data-model/contract prevents a returning-user breakage during the redesign.

## Evaluation notes (flywheel)

- Failure modes observed: repo-wide Glob still times out (used scoped Grep/Get-ChildItem instead); no script failures this stage (update-agent-context.ps1 succeeded).
- Graders run and results (PASS/FAIL): Constitution Check gate — PASS (pre- and post-design).
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): digitize IEEE 485 Kt (rate-to-capacity) tables so derating.ts can swap the Peukert approximation for the formal worksheet in a later iteration.
