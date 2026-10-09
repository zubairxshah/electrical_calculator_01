---
description: "Task list for the Panel Schedule & Phase Load Balancing calculator"
---

# Tasks: Panel Schedule & Phase Load Balancing

**Input**: Design documents from `/specs/013-panel-schedule/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/calculation-api.md](./contracts/calculation-api.md), [quickstart.md](./quickstart.md)

**Tests**: REQUIRED for calculation logic (Constitution V). In each story, the test tasks come first and MUST fail before the matching implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelisable (different files, no dependency on incomplete tasks)
- Paths are relative to the repo root `D:\prompteng\elec_calc\`

## Conventions

- Native `number` arithmetic (plan D7). Round only at the UI/PDF.
- Store handlers use `usePanelScheduleStore.getState()`; never `useCallback([store])`.
- Numeric inputs use focus/blur local string state.
- Components in `components/panel-schedule/` are presentational. Only `PanelScheduleTool.tsx` and `PanelHistorySidebar.tsx` import the store.
- Alert styles as in arc-flash: error `bg-destructive/10 border-destructive/50`, warning `bg-yellow-50 border-yellow-200`, info `bg-blue-50 border-blue-200`.
- Tests live under `__tests__/unit/calculations/panel-schedule/` (vitest include rule).

---

## Phase 1: Setup

- [X] T001 Create directories `lib/calculations/panel-schedule/`, `components/panel-schedule/`, `app/panel-schedule/`, `__tests__/unit/calculations/panel-schedule/`

## Phase 2: Foundational (blocks all stories)

- [X] T002 Create `types/panel-schedule.ts` with every type in data-model.md: enums, `SystemDefinition`, `Panel`, `Circuit`, `CircuitLoad`, `PhaseSummary`, `PlacementIssue` (+ code union), `PanelWarning` (+ code union), `DemandRuleApplication`, `DemandResult`, `BalanceProposal`, `ScheduleResult`, `PanelHistoryEntry`, store `PanelScheduleState`/`PanelScheduleActions`
- [X] T003 [P] Write `__tests__/unit/calculations/panel-schedule/motorFlc.test.ts`: 430.250 spot checks (10 HP 208 V = 30.8, 5 HP 208 V = 16.7, 50 HP 460 V = 65, 100 HP 480 V system → 124), 430.248 (1 HP 115 V = 16, 5 HP 230 V = 28, 2 HP 208 V = 13.2), column mapping (120→115, 240→230, 480→460, 600→575), out-of-table HP → null
- [X] T004 [P] Create `lib/standards/motorFlc.ts` (NEC 2020 Tables 430.248 / 430.250, `necMotorFlc`), per research R6
- [X] T005 [P] Write `__tests__/unit/calculations/panel-schedule/system.test.ts`: every system type definition (phases, vLN, vLL, maxPoles, neutral), custom system, `phaseOfSpace` for 3φ (1,2→A; 3,4→B; 5,6→C; 7→A; 42→C), 1φ 3W (1→A, 3→B, 5→A), 1φ 2W (all A), `spacesFor(3,2) = [3,5]`, `spacesFor(7,3) = [7,9,11]`
- [X] T006 Create `lib/calculations/panel-schedule/system.ts`

## Phase 3: User Story 1 — Schedule and per-phase loading (P1) 🎯 MVP

### Tests (Red)

- [X] T007 [P] [US1] `loads.test.ts`: VA/kVA/W (PF)/kW conversions; NEC HP 3-pole 10 HP @208 → 30.8×208×√3; NEC 1-pole 1 HP @120 → 16×120; IEC 7.5 kW motor η 0.9 PF 0.85 → 9,803.9 VA; HP not in table → PanelError; `branchCurrent` 1P/2P/3P per R2
- [X] T008 [P] [US1] `placement.test.ts`: overlap, out of range (3-pole at 41 on 42 spaces), TOO_MANY_POLES on 1φ, ONE_POLE_ON_DELTA, auto-place first free fit (multi-pole skipping occupied spaces), spare/space occupy spaces, NO_FREE_SPACE
- [X] T009 [P] [US1] `schedule.test.ts`: quickstart Example A exactly (phase VA, currents, total current, imbalance 9.35%, neutral 11.84 A); 1φ 3W split; IEC 400Y/230 currents at 230 V; empty panel → imbalance null, no NaN; zero-average; delta has no neutral; FR-013 breaker-undersized warning (20 A breaker with 1,920 VA continuous @120 V → 16 A × 1.25 = 20 A OK; 2,000 VA → 20.8 A warning)

### Implementation (Green)

- [X] T010 [US1] `lib/calculations/panel-schedule/loads.ts` (`circuitVA`, `branchCurrent`, `PanelError`, category default continuous map)
- [X] T011 [US1] `lib/calculations/panel-schedule/placement.ts` (`validatePlacement`, `autoPlace`, `occupancyMap`)
- [X] T012 [US1] `lib/calculations/panel-schedule/schedule.ts` (`calculateSchedule`, `summarise`, `imbalancePct`, `neutralCurrent`) and `index.ts` barrel
- [X] T013 [P] [US1] `validation.test.ts` + `lib/validation/panelScheduleValidation.ts` (Zod `panelSchema`, `circuitSchema`, `validatePanel`): spaces even 2–84, PF range, poles vs system, required breaker, main ≤ bus warning, custom-system √3 consistency
- [X] T014 [US1] `stores/usePanelScheduleStore.ts`: persist `electromate-panel-schedule` v1; actions setPanelField, setStandard (switches default system), addCircuit (auto-place), updateCircuit (reject invalid placement, keep previous, return issue), duplicateCircuit, removeCircuit, moveCircuit, toggleLock, clearPanel, loadExample; default panel = 208Y/120 42-space 225 A bus / 200 A main
- [X] T015 [P] [US1] `components/panel-schedule/PanelHeaderForm.tsx` — standard switch, system type select (+ custom fields), name/location/fed-from, bus, main type/rating, spaces preset select, SCCR, imbalance target, occupancy (NEC)
- [X] T016 [P] [US1] `components/panel-schedule/CircuitEditor.tsx` — dialog form for add/edit: kind, description, category (sets default continuous/PF), load value + unit (HP only for motor), PF, efficiency (IEC motor), continuous, poles, breaker, start space (auto), locked, notes; inline errors
- [X] T017 [P] [US1] `components/panel-schedule/PanelScheduleGrid.tsx` — two-column table: left odd, right even; columns ckt#, description, breaker/poles, phase badge, VA; multi-pole rows merged visually with ┐ markers; spare/space styling; row actions (edit, duplicate, lock, delete); horizontally scrollable on mobile
- [X] T018 [P] [US1] `components/panel-schedule/PhaseSummaryCard.tsx` — per-phase VA/A bars, deviation %, imbalance badge vs target, total VA/A, neutral estimate (labelled), used/free spaces, warnings list
- [X] T019 [US1] `app/panel-schedule/page.tsx` (metadata) + `app/panel-schedule/PanelScheduleTool.tsx` (orchestrator: header form, grid, summary; `calculateSchedule` memoised from store state; "Load example" button = quickstart Example A)
- [X] T020 [US1] Navigation: add "Panel Schedule" under Power Systems in `components/layout/Sidebar.tsx`, `components/layout/TopNavigation.tsx`, and a card in `app/page.tsx`

**Checkpoint**: US1 tests green; `/panel-schedule` shows Example A with correct totals.

## Phase 4: User Story 2 — Balancing (P1)

- [X] T021 [P] [US2] `balance.test.ts` (Red): Example D optimal (max − min ≤ 1,500 VA, imbalance ≤ 20%); locked circuits never move; spare/space never move; placement invariant holds for every proposal; never worse than before; deterministic (two runs deep-equal); already-balanced panel → improved=false with message; all locked → "No unlocked circuits"; multi-pole circuits stay on valid same-side consecutive spaces; seeded random panels (200 cases, 1-/2-/3-pole mixes, 42 spaces, no locks, no single dominant load) → imbalance ≤ 5% in ≥ 95% (SC-003); 84-space full panel < 1 s (SC-004)
- [X] T022 [US2] `lib/calculations/panel-schedule/balance.ts` — `proposeBalance` (R7: fix locked, LPT greedy with phase choice + physical placement, local search swaps/moves, tie-break fewer moves) and `applyProposal`
- [X] T023 [US2] Store: `proposal` state (not persisted), `runBalance`, `acceptProposal`, `discardProposal`
- [X] T024 [P] [US2] `components/panel-schedule/BalanceDialog.tsx` — before/after per-phase table + imbalance, moved-circuit list (old → new space), accept/discard buttons, message when no improvement
- [X] T025 [US2] Wire Balance button + dialog into `PanelScheduleTool.tsx`; lock toggle visible in grid

**Checkpoint**: US2 tests green; balancing is visible in the UI.

## Phase 5: User Story 3 — Demand, feeder and main sizing (P2)

- [X] T026 [P] [US3] `demand.test.ts` (Red): quickstart Example B (≈ 67,386.8 VA, ≈ 187.0 A, main 200 A); Example C table spot checks (dwelling, warehouse, hospital, hotel, kitchen ×2, receptacles < 10 kVA); dwelling receptacles merged into lighting; 220.60 larger-of; motor continuous flag ignored; all-non-continuous 'other' panel → demand = connected; IEC defaults → demand = connected; IEC edited factor applied; RDF table (1, 3, 5, 9, 10 circuits); IEC largest-motor toggle; bus exceeded / main exceeded / main recommendation null above max rating; 1φ 3W design current = VA/240
- [X] T027 [US3] `lib/calculations/panel-schedule/demand.ts` (R4/R5, uses `recommendStandardBreaker` from `lib/standards/breakerRatings.ts`)
- [X] T028 [P] [US3] `components/panel-schedule/DemandCard.tsx` — rules table (rule, reference, connected, factor, demand), totals, design current, bus/main checks, recommended main; IEC diversity editor (per-category inputs, RDF toggle, largest-motor toggle); occupancy note (info)
- [X] T029 [US3] Store fields/actions for occupancy, IEC diversity, RDF, motor adder; wire DemandCard into the tool (tabs: Schedule | Demand)

## Phase 6: User Story 4 — PDF export (P2)

- [X] T030 [P] [US4] `pdf.test.ts` (Red): generates without throwing for Example A + B panel; output contains panel name, voltage label, every circuit description, "SPARE", per-phase totals, imbalance, demand total, recommended main, NEC references and the disclaimer (use jsPDF text capture as in arc-flash pdf test)
- [X] T031 [US4] `lib/pdfGenerator.panelSchedule.ts` — landscape A4/Letter (by standard): header block, two-column schedule table (ckt, desc, bkr/P, A/B/C VA columns, phase), totals rows, phase summary, demand table, references, timestamp/version, disclaimer; multi-page when > ~42 rows per side
- [X] T032 [US4] Export PDF button in the tool (disabled with tooltip when placement errors exist)

## Phase 7: User Story 5 — Persistence, history, reference (P3)

- [X] T033 [US5] Store history: `saveToHistory(name)`, `restoreFromHistory(id)` (confirm), `deleteHistory(id)`; key `electromate-panel-schedule-history`, FIFO 50, try/catch storage
- [X] T034 [P] [US5] `components/panel-schedule/PanelHistorySidebar.tsx`
- [X] T035 [P] [US5] `components/panel-schedule/PanelReferenceDialog.tsx` — numbering & phase rotation, imbalance formula, neutral estimate, NEC demand tables (220.42/220.44/220.56, 220.60, 430.24, continuous), IEC diversity/RDF, standard ratings, limitations
- [X] T036 [US5] Wire history + reference into the tool; test reload persistence manually

## Phase 8: Polish & Cross-Cutting

- [X] T037 Run full panel-schedule suite + `npx tsc --noEmit` filtered to new paths; fix all errors
- [X] T038 `npx next build` passes
- [X] T039 [P] Error boundary wrapper for the tool (pattern: `components/arc-flash/ArcFlashErrorBoundary.tsx`)
- [X] T040 [P] Accessibility pass: labels for all inputs, phase badges not colour-only (text A/B/C), keyboard-operable grid actions and dialogs
- [X] T041 Write `specs/013-panel-schedule/verification.md` recording test results and the open manual checks
- [x] T042 **USER**: verify NEC 2020 Table 220.42 / 220.44 / 220.56 and Tables 430.248 / 430.250 values against a licensed copy; verify IEC 61439-2 RDF values (closed 2026-10-10 by user decision after agent cross-check; licensed-copy check still recommended, see verification.md)
- [x] T043 **USER**: manual browser walkthrough (quickstart steps 1–8) and cross-browser PDF check

## Dependencies

- Setup → Foundational → US1 → (US2, US3 in parallel) → US4 (needs US3 for the demand table) → US5 → Polish.
- Within each story, tests come before the implementation.

## MVP

Phases 1–3 (US1). US2 is also P1 and completes the requested scope.
