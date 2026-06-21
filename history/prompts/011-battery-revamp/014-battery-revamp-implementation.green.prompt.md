---
id: 14
title: Battery Revamp Full Implementation
stage: green
date: 2026-06-22
surface: agent
model: claude-opus-4-8
feature: 011-battery-revamp
branch: 011-battery-revamp
user: zubairxshah
command: /sp.implement
labels: ["battery", "implementation", "tdd", "sizing", "engine", "ui", "pdf", "ocr", "migration"]
links:
  spec: specs/011-battery-revamp/spec.md
  ticket: null
  adr: history/adr/006-battery-sizing-methodology.md
  pr: null
files:
 - lib/standards/batteryTypes.ts
 - lib/standards/batteryChemistryMap.ts
 - lib/types/calculations.ts
 - lib/calculations/battery/{index,runtime,sizing,derating,bankConfig,dischargeCurve,assess,result}.ts
 - lib/calculations/battery/__tests__/fixtures.ts
 - lib/schemas/batterySchema.ts
 - lib/validation/batteryValidation.ts
 - stores/useBatteryStore.ts
 - lib/datasheets/{library,datasheetExtract}.ts
 - lib/pdfGenerator.battery.ts
 - components/battery/{BatteryCalculator,BatteryInputForm,BatteryResults,BatteryModeSwitch,DatasheetPicker,DischargeChart}.tsx
 - app/battery/page.tsx
 - __tests__/unit/calculations/battery/{derating,runtime,sizing,bankConfig,library}.test.ts
 - __tests__/unit/validation/batteryValidation.test.ts
tests:
 - 45 battery tests passing (derating 15, runtime 8, sizing 5, bankConfig 4, library 3, validation 10)
 - full suite 935 passing; 11 pre-existing failures (earthing/lighting/breaker) unrelated to battery
---

## Prompt

proceed to /sp.implement  →  "Full /sp.implement" (work through all phases end to end)

## Response snapshot

Implemented 53/60 tasks across all phases, TDD throughout (engine tests green against the approved fixtures).

Foundational: added FLA profile + `peukertExponent` to all 9 chemistries in batteryTypes.ts; made batteryTypes.ts `BatteryChemistry` the single source of truth (types/calculations.ts now re-exports it instead of its own legacy 6-value union — the three-way mismatch resolved); created batteryChemistryMap.ts (legacy→canonical + display labels); extended input/result types (mode, targetBackupHours, dodOverride, appliedFactors, bankConfig, verdict, recommendations, etc.); rewrote Zod schema (canonical enum + mode-conditional superRefine + legacy preprocess); rewrote validation (mode/chemistry/temperature-aware); store gained persist version+migrate (C4) so legacy localStorage chemistry IDs load cleanly + dual-mode calculate.

Engine (lib/calculations/battery/ module): derating.ts (DoD/temp/aging/efficiency factor fns + Peukert), runtime.ts (forward), sizing.ts (reverse, iterative Peukert solve), bankConfig.ts (series/parallel rounding), dischargeCurve.ts, assess.ts (warnings/verdict/recommendations), result.ts (shared assembly), index.ts (dispatcher + memo keyed on all inputs + back-compat calculateBackupTime/calculateDischargeRate). Deleted the old monolithic battery.ts so the directory resolves.

UI: rewrote BatteryCalculator (two-column sticky layout + mode switch + PDF export), BatteryInputForm (mode-aware, canonical chemistry, datasheet picker, advanced overrides, OCR confirmation panel), BatteryResults (hero metric, verdict badge, applied-factors table, bank config, recommendations, discharge chart); new BatteryModeSwitch (Radix Tabs), DatasheetPicker, DischargeChart (Recharts). pdfGenerator.battery.ts (standalone jsPDF report — no session mapping needed). Datasheets: library.ts (12 real models) + datasheetExtract.ts (dynamic-import tesseract.js/pdfjs, confirmation-gated, C6/C7).

Verification: all 45 battery tests pass incl. fixtures A–F (±2%), round-trip G2, chemistry sensitivity G1, perf G4. Battery files typecheck clean. Fixed 2 self-introduced TS errors (BigNumber union, Recharts formatter). Relocated tests to __tests__/unit/calculations/battery/ (repo convention; vitest include doesn't match colocated). Replaced obsolete old-engine tests.

## Outcome

- ✅ Impact: Battery Calculator is now a chemistry-aware, dual-mode, standards-based sizing tool with datasheet support, OCR, redesigned UI, and PDF export. The core defect (chemistry ignored) is fixed and proven.
- 🧪 Tests: 45 battery green; 935 total green; 11 pre-existing non-battery failures (earthing/lighting/breaker) confirmed unrelated.
- 📁 Files: ~28 created/modified (see list).
- 🔁 Next prompts: 7 deferred polish/manual items (T030 separate defaults test, T048 a11y, T049 reference dialog, T050 lint [next lint removed in Next 16, no flat config], T051 manual e2e, T052 design-sync re-push, T058 cross-browser PDF). Then commit + PR.
- 🧠 Reflection: The localStorage migration and the three-way chemistry reconciliation were the highest-risk areas; doing data/types/schema/store as one foundational pass before UI kept the refactor coherent.

## Evaluation notes (flywheel)

- Failure modes observed: vitest include pattern only matches `__tests__/unit|integration|session-memory` (colocated tests silently skipped — relocated); sibling battery.ts shadowed the new battery/ dir (deleted); `next lint`/flat-eslint unavailable in this repo.
- Graders run and results (PASS/FAIL): engine fixtures ±2% — PASS; round-trip G2 — PASS; chemistry sensitivity G1 — PASS; perf G4 — PASS; typecheck (battery) — PASS.
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): wire a dedicated defaults.test.ts (T030) asserting source-labeling end-to-end through calculateBattery, then layer the deferred a11y/reference-dialog polish.
