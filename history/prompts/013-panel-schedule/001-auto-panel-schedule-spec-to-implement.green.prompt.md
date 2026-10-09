---
id: 001
title: Auto panel schedule spec to implement
stage: green
date: 2026-10-08
surface: agent
model: claude-opus-5-5
feature: 013-panel-schedule
branch: 013-panel-schedule
user: zubairxshah
command: /sp.auto Panel Schedule calculator
labels: ["panel-schedule", "load-balancing", "nec-220", "nec-430", "iec-61439", "pdf", "session-summary"]
links:
  spec: specs/013-panel-schedule/spec.md
  ticket: null
  adr: history/adr/007-arithmetic-policy-native-vs-bignumber.md
  pr: https://github.com/zubairxshah/electrical_calculator_01/pull/6
files:
 - specs/013-panel-schedule/spec.md
 - specs/013-panel-schedule/checklists/requirements.md
 - specs/013-panel-schedule/plan.md
 - specs/013-panel-schedule/research.md
 - specs/013-panel-schedule/data-model.md
 - specs/013-panel-schedule/contracts/calculation-api.md
 - specs/013-panel-schedule/quickstart.md
 - specs/013-panel-schedule/tasks.md
 - specs/013-panel-schedule/verification.md
 - types/panel-schedule.ts
 - lib/standards/motorFlc.ts
 - lib/calculations/panel-schedule/system.ts
 - lib/calculations/panel-schedule/loads.ts
 - lib/calculations/panel-schedule/placement.ts
 - lib/calculations/panel-schedule/schedule.ts
 - lib/calculations/panel-schedule/demand.ts
 - lib/calculations/panel-schedule/balance.ts
 - lib/calculations/panel-schedule/defaults.ts
 - lib/calculations/panel-schedule/index.ts
 - lib/validation/panelScheduleValidation.ts
 - lib/pdfGenerator.panelSchedule.ts
 - stores/usePanelScheduleStore.ts
 - components/panel-schedule/NumberField.tsx
 - components/panel-schedule/PanelHeaderForm.tsx
 - components/panel-schedule/CircuitEditor.tsx
 - components/panel-schedule/PanelScheduleGrid.tsx
 - components/panel-schedule/PhaseSummaryCard.tsx
 - components/panel-schedule/BalanceDialog.tsx
 - components/panel-schedule/DemandCard.tsx
 - components/panel-schedule/PanelHistorySidebar.tsx
 - components/panel-schedule/PanelReferenceDialog.tsx
 - components/panel-schedule/PanelScheduleErrorBoundary.tsx
 - app/panel-schedule/page.tsx
 - app/panel-schedule/PanelScheduleTool.tsx
 - components/layout/Sidebar.tsx
 - components/layout/TopNavigation.tsx
 - app/page.tsx
 - __tests__/unit/calculations/panel-schedule/helpers.ts
 - __tests__/unit/calculations/panel-schedule/motorFlc.test.ts
 - __tests__/unit/calculations/panel-schedule/system.test.ts
 - __tests__/unit/calculations/panel-schedule/loads.test.ts
 - __tests__/unit/calculations/panel-schedule/placement.test.ts
 - __tests__/unit/calculations/panel-schedule/schedule.test.ts
 - __tests__/unit/calculations/panel-schedule/validation.test.ts
 - __tests__/unit/calculations/panel-schedule/demand.test.ts
 - __tests__/unit/calculations/panel-schedule/balance.test.ts
 - __tests__/unit/calculations/panel-schedule/pdf.test.ts
 - history/adr/007-arithmetic-policy-native-vs-bignumber.md
 - history/adr/003-mathjs-high-precision-arithmetic.md
tests:
 - __tests__/unit/calculations/panel-schedule (9 files, 133 tests, all pass)
 - npx tsc --noEmit (filtered to new/edited paths, 0 errors)
 - npx next build (pass)
 - next start smoke test of /panel-schedule (200)
---

## Prompt

1. what were doing
2. start panel schedule
3. /sp.auto Panel Schedule calculator — build a panelboard schedule with load balancing across phases (single-phase and three-phase panels), NEC 220/408 and IEC 60364 conventions, consistent with the existing ElectroMate calculator pattern
4. /sp.adr
5. commit and open PR
6. see you later

## Response snapshot

- Reported session state: arc flash (012) already merged to main; corrected the stale memory note. Listed open items: 010-motor-starting unmerged, arc-flash T031/manual checks.
- Ran the full SDD pipeline via /sp.auto on new branch `013-panel-schedule`:
  - **specify**: 5 user stories (schedule, balance, demand, PDF, persistence), FR-001–025, SC-001–006.
  - **clarify** (4 answers): balance = propose then accept, locked circuits fixed; demand = NEC category rules + IEC editable diversity; one panel per calculation; total load per circuit split across poles.
  - **plan**: research R1–R10 (numbering/phase rotation, arithmetic VA convention, neutral estimate, NEC 2020 220.42/220.44/220.56/220.60/430.24/215.2 ordering, IEC defaults 1.0 + optional 61439-2 RDF, NEC Tables 430.248/430.250, deterministic LPT + local-search balancer); data model, contracts, quickstart worked examples A–D.
  - **tasks**: 43 tasks (41 agent, 2 user). **analyze**: no CRITICAL/HIGH; one LOW fixed.
  - **implement**: engine (system, loads, placement, schedule, demand, balance), motor FLC tables, Zod validation, Zustand persist store + history, 10 UI components, page + tool, nav/home entries, landscape PDF generator.
- **/sp.adr**: created ADR-007 (calculation arithmetic policy: native doubles by default, BigNumber only where justified, accuracy proven by reference-case tests; amends ADR-003). Evidence: 9 of 17 calculation modules already native. Balancer algorithm judged feature-local (no ADR). ADR-003 status and 013 plan linked to ADR-007.
- Committed 6df3f10 (feature) and 729d571 (ADR-007), pushed `013-panel-schedule`, opened PR #6.
- Corrected two of my own mistakes during the run: hotel lighting factors (kept NEC 60/50/35, removed an erroneous 50/40/30 "correction") and the expected phase for spaces 40–42 in a test.

## Outcome

- ✅ Impact: Calculator #24 `/panel-schedule` built: two-column schedule, per-phase VA/A, imbalance, neutral estimate, deterministic phase balancing with preview, NEC 2020 demand / IEC diversity, main recommendation, PDF, saved panels.
- 🧪 Tests: 133/133 panel-schedule tests pass (incl. SC-003 200-panel random study and SC-004 84-space perf ~20 ms); tsc clean for new paths; next build passes.
- 📁 Files: 9 spec docs, 28 source files, 9 test files + helper; 3 nav/home edits.
- 🔁 Next prompts: T042 verify NEC/IEC table values against licensed copies; T043 browser walkthrough + cross-browser PDF; merge PR #6 after checks; update constitution step 5 to reference ADR-007.
- 🧠 Reflection: Building two balancing candidates (keep-layout local search vs fresh LPT) and preferring fewer moves gives near-optimal balance while keeping the designer's layout recognisable.

## Evaluation notes (flywheel)

- Failure modes observed: transcription doubt on Table 220.42 hotel tiers caused a wrong in-document correction (caught and reverted); hand-computed phase for space 42 was wrong in a test.
- Graders run and results (PASS/FAIL): vitest PASS; tsc (filtered) PASS; next build PASS.
- Prompt variant (if applicable): /sp.auto chained pipeline.
- Next experiment (smallest change to try): add a store-level integration test for addCircuit/updateCircuit rejection paths.
