---
id: 018
title: Battery Standards Hardening Session
stage: green
date: 2026-10-15
surface: agent
model: claude-opus-5-5
feature: 015-battery-standards
branch: 015-battery-standards
user: zubairxshah
command: /sp.auto (specify → clarify → plan → tasks → analyze → implement)
labels: ["battery", "ieee-485", "standby-sizing", "charger", "ventilation", "nfpa-855", "accessibility", "adr-008"]
links:
  spec: specs/015-battery-standards/spec.md
  ticket: null
  adr: history/adr/008-battery-sizing-method-v2.md
  pr: null
files:
 - specs/015-battery-standards/spec.md
 - specs/015-battery-standards/plan.md
 - specs/015-battery-standards/research.md
 - specs/015-battery-standards/data-model.md
 - specs/015-battery-standards/quickstart.md
 - specs/015-battery-standards/tasks.md
 - specs/015-battery-standards/contracts/battery-engine.contract.md
 - specs/015-battery-standards/checklists/requirements.md
 - specs/011-battery-revamp/tasks.md
 - history/adr/008-battery-sizing-method-v2.md
 - lib/standards/batteryReference.ts
 - lib/types/calculations.ts
 - lib/calculations/battery/derating.ts
 - lib/calculations/battery/voltageWindow.ts
 - lib/calculations/battery/charger.ts
 - lib/calculations/battery/ventilation.ts
 - lib/calculations/battery/installationChecks.ts
 - lib/calculations/battery/standardsOutputs.ts
 - lib/calculations/battery/runtime.ts
 - lib/calculations/battery/sizing.ts
 - lib/calculations/battery/assess.ts
 - lib/calculations/battery/result.ts
 - lib/calculations/battery/index.ts
 - lib/calculations/battery/__tests__/fixtures.ts
 - lib/validation/batteryValidation.ts
 - lib/pdfGenerator.battery.ts
 - stores/useBatteryStore.ts
 - components/battery/BatteryInputForm.tsx
 - components/battery/BatteryResults.tsx
 - components/battery/BatteryCalculator.tsx
 - components/battery/BatteryReferenceDialog.tsx
 - components/battery/DatasheetPicker.tsx
 - components/battery/OverrideCell.tsx
 - components/shared/InputField.tsx
tests:
 - __tests__/unit/calculations/battery/application.test.ts
 - __tests__/unit/calculations/battery/roundTrip.test.ts
 - __tests__/unit/calculations/battery/cacheKey.test.ts
 - __tests__/unit/calculations/battery/temperatureTable.test.ts
 - __tests__/unit/calculations/battery/voltageWindow.test.ts
 - __tests__/unit/calculations/battery/charger.test.ts
 - __tests__/unit/calculations/battery/ventilation.test.ts
 - __tests__/unit/calculations/battery/installationChecks.test.ts
 - __tests__/unit/calculations/battery/defaults.test.ts
 - __tests__/unit/calculations/battery/storeMigration.test.ts
 - __tests__/unit/calculations/battery/a11y.test.tsx
 - __tests__/unit/calculations/battery/derating.test.ts (updated)
 - __tests__/unit/calculations/battery/runtime.test.ts (updated)
 - __tests__/unit/calculations/battery/sizing.test.ts (updated)
 - __tests__/unit/validation/batteryValidation.test.ts (updated)
---

## Prompt

1. where we had been
2. remind me of walkthrough on Friday, however we can move on to other tasks
3. 8 PM
4. (answer to "which battery tasks") T030 defaults test, T048 accessibility, T049 reference dialog, " We also need to see if battery calculator has End of life factor, Depth of discharge, system efficiency, autonomy, and other factor that we might have missed check for those in standards and codes we need a solid battery page now "

(Plus selections via question prompts: next task = Battery Revamp; scope = fixes + factors + checks without duty cycle; default mode = standby/float; ADR-008 = yes; reference values D5–D9 and fixtures S1–S3 / C′ approved as listed.)

## Response snapshot

- Recapped the state: on 014-pfi-panel-design; T030 walkthrough and PR still open.
- Created a one-time cloud reminder routine `trig_01JgJNLhQMt6ewouhFx7iLh1` for Fri 2026-10-16 at 20:00 PKT (15:00 UTC), and created the "Default" cloud environment. Recorded it in memory.
- Found the memory index was stale (011 battery revamp was already merged via PR #5) and corrected it.
- Gap review of /battery against IEEE 485 / 946 / 1013 / 1561, IEC 62485-2 / EN 50272-2, NEC 480/706 and NFPA 855. Found that the DoD cap plus round-trip efficiency in standby oversized lead-acid by about 2×. Also missing: design margin, end voltage / cell count, the IEEE 485 temperature table, charger sizing, ventilation and code checks, plus a stale-cache bug (overrides missing from the cache key).
- Ran /sp.auto on branch 015-battery-standards: spec (7 user stories, 30 FRs), plan + research (D1–D12) + data model + contract (G1 scoped, G6–G14) + quickstart, tasks (43), and analyze (2 fixes). The user signed off gates T003–T006. Wrote ADR-008, which amends ADR-006.
- Implemented: application mode (standby default, DoD = 1), conversion-only efficiency (AC 0.95 / DC 1.00), design margin 1.10, interpolated IEEE 485 lead-acid TCF with no credit above 25 °C, voltage window → cell count with a float-conflict error, IEEE 946 charger sizing with standard ratings, EN 50272-2 ventilation, NEC 480.7 / 480.10 / 706 / NFPA 855 checks, a sorted full-input cache key, and persist migration v1 → v2. UI: radiogroup selectors, new input sections, result cards, a reference-guide dialog, an a11y pass (InputField label association, OverrideCell aria-label, a keyboard-reachable datasheet upload, a live result region), and PDF sections with page breaks.
- Decision: kept the per-chemistry electrical data in a new `batteryReference.ts` map instead of widening the shared `BatteryTypeSpec`, which Battery Comparison also uses.

## Outcome

- ✅ Impact: standby battery sizing now follows IEEE 485 (about 49% of the v1 size for 48 V / 2 kW / 2 h VRLA) and includes charger, ventilation and code-compliance outputs. 42 of 43 tasks done.
- 🧪 Tests: battery + validation suites 168/168 pass (up from 37 + validation). Full suite 1335 pass / 11 failing, all pre-existing in lighting/earthing/breaker. tsc: no errors in touched files. `npm run build` OK.
- 📁 Files: 9 new engine/data/UI files, 11 new test files, about 20 modified; spec artifacts and ADR-008.
- 🔁 Next prompts: T043 manual walkthrough of quickstart steps 1–12 incl. PDF; commit + PR for 015; T030 walkthrough on 014 (reminder Fri 8 PM).
- 🧠 Reflection: a gap review against the standard caught a method-level double count that the 011 fixtures had locked in. Fixtures validate arithmetic, not method, so method choices need their own review.

## Evaluation notes (flywheel)

- Failure modes observed: multi-heredoc bash commands failed to parse in this environment (worked around with scratchpad Python patch files). The first cold vitest run timed out with 0 tests.
- Graders run and results (PASS/FAIL): vitest battery 168 PASS; tsc touched-files PASS; next build PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): add a per-chemistry Kt (rate-to-capacity) table option to replace Peukert for lead-acid UPS rates (≤ 1 h), as the next accuracy step toward the deferred duty-cycle worksheet.
