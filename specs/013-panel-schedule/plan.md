# Implementation Plan: Panel Schedule & Phase Load Balancing

**Branch**: `013-panel-schedule` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-panel-schedule/spec.md`

## Summary

Add calculator #24 at `/panel-schedule`. The user defines one panelboard (NEC or IEC system, bus, main, spaces) and its branch circuits. The engine places circuits in two-column numbered spaces, assigns phases per row, and totals VA and current per phase, plus imbalance and an estimated neutral current. It proposes a deterministic phase rebalance that respects locked and multi-pole circuits, applies NEC 2020 Article 220 / 430.24 demand rules (or IEC editable diversity factors), recommends a standard main rating, and exports a standard panel schedule PDF. Everything is client-side, follows the `012-arc-flash` layout, and needs no new dependencies.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.1 (App Router, Turbopack)
**Primary Dependencies**: existing only — Zustand 5 (persist), Zod 4, jsPDF 3, shadcn/ui + Tailwind, lucide-react. **No new dependencies.**
**Storage**: localStorage — `electromate-panel-schedule` (persist v1) and `electromate-panel-schedule-history` (FIFO 50)
**Testing**: Vitest 4 — `__tests__/unit/calculations/panel-schedule/`
**Target Platform**: modern desktop/tablet/mobile browsers; client-side, offline-capable
**Project Type**: single Next.js web app
**Performance Goals**: schedule recompute < 5 ms for 84 spaces; balance < 50 ms (SC-004 budget 1 s); validation < 100 ms (Constitution II)
**Constraints**: one panel per calculation; arithmetic VA summation (R2); NEC 2020 edition; no high-leg delta
**Scale/Scope**: 1 route, ~7 components, 7 calculation modules + 1 standards data module, ~9 test files

No NEEDS CLARIFICATION remains (spec Clarifications session 2026-10-07; research R1–R10).

## Constitution Check

### Calculation Accuracy
- [x] Formulas tied to standards: NEC 2020 Tables 220.42/220.44/220.56, 220.60, 430.24, 215.2(A)(1), 240.6(A), Tables 430.248/430.250; IEC 61439-2 RDF (R4–R6)
- [x] Test cases: worked examples A–D in quickstart.md (hand-calculated)
- [x] Tolerance: 0.1% (SC-002) — asserted with `toBeCloseTo` at that precision
- [~] mathjs BigNumber — **justified deviation** (R8, same as arc-flash; see Complexity Tracking)

### Safety-First Validation
- [x] Dangerous conditions: design current > bus/main, main > bus, undersized branch breaker for continuous load, overlap/out-of-range placement, imbalance > target
- [x] Real-time validation via Zod + placement checks on every change
- [x] Warnings carry NEC clause references (contract taxonomy)

### Standards Compliance and Traceability
- [x] Edition pinned: NEC 2020; IEC 61439-2:2020; IEC 60364 conventions
- [x] Each demand rule row displays its reference; the PDF lists references
- [x] Table data is transcribed → user verification task (T0xx) before release

### Test-First Development
- [x] Engine tests are written first (Red) from quickstart examples, then implemented (Green)
- [x] Coverage: nominal (A, B), boundary (table breakpoints, 84 spaces, imbalance at target), edge (empty panel, zero average, all locked), error (overlap, poles > system, HP not in table)
- [x] User approval checkpoint: worked examples A–D presented in the completion report; NEC table values flagged for licensed-copy check

### Professional Documentation
- [x] PDF: header, full schedule, per-phase totals, imbalance, neutral, demand rules + references, recommended main, timestamp, version, disclaimer

### Progressive Enhancement
- [x] P1: US1 (schedule) + US2 (balance); P2: US3 (demand), US4 (PDF); P3: US5 (persistence/history/reference)
- [x] US2 and US3 depend only on the US1 engine; no dependency on unmerged branches

### Other
- [x] Dual standards: NEC/IEC system types and labels; IEC diversity mode
- [x] Security: no network, no PII, input validated
- [x] Additive: new files + nav/home edits only

**Gate result: PASS** (one documented deviation).

## Project Structure

### Documentation

```text
specs/013-panel-schedule/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/calculation-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
types/panel-schedule.ts                          # NEW — all interfaces
lib/standards/motorFlc.ts                        # NEW — NEC Tables 430.248 / 430.250
lib/calculations/panel-schedule/
├── system.ts                                    # NEW — system definitions, space→phase
├── loads.ts                                     # NEW — unit→VA, branch current
├── placement.ts                                 # NEW — validation, auto-place, occupancy
├── schedule.ts                                  # NEW — per-circuit loads, phase summary, neutral
├── demand.ts                                    # NEW — NEC Art. 220 / IEC diversity, main recommendation
├── balance.ts                                   # NEW — LPT + local search proposal
└── index.ts                                     # NEW — barrel
lib/validation/panelScheduleValidation.ts        # NEW — Zod
lib/pdfGenerator.panelSchedule.ts                # NEW
stores/usePanelScheduleStore.ts                  # NEW — Zustand persist v1 + history
components/panel-schedule/
├── PanelHeaderForm.tsx                          # NEW — standard/system/bus/main/spaces
├── CircuitEditor.tsx                            # NEW — add/edit circuit dialog/row form
├── PanelScheduleGrid.tsx                        # NEW — two-column panel layout with phase badges
├── PhaseSummaryCard.tsx                         # NEW — per-phase bars, imbalance, neutral
├── BalanceDialog.tsx                            # NEW — before/after preview, accept/discard
├── DemandCard.tsx                               # NEW — rules table, design current, main, IEC diversity editor
├── PanelHistorySidebar.tsx                      # NEW
└── PanelReferenceDialog.tsx                     # NEW
app/panel-schedule/page.tsx                      # NEW — metadata
app/panel-schedule/PanelScheduleTool.tsx         # NEW — client orchestrator
components/layout/Sidebar.tsx, TopNavigation.tsx, app/page.tsx   # EDIT — nav + card (Power Systems)
__tests__/unit/calculations/panel-schedule/
├── system.test.ts · loads.test.ts · placement.test.ts · schedule.test.ts
├── demand.test.ts · balance.test.ts · motorFlc.test.ts · validation.test.ts · pdf.test.ts
```

**Structure Decision**: Mirror `012-arc-flash` (research R10). Placement, summary, demand and balance are separate modules so each contract (contracts §1–6) is unit-tested in isolation. Motor FLC data goes in `lib/standards/` for reuse by future motor features.

## Key Design Decisions

| # | Decision | Rationale | Ref |
|---|---|---|---|
| D1 | Space → phase by row index, two-column numbering | NEMA/NEC 408.3(E) convention | R1 |
| D2 | Arithmetic VA per phase, equal split across poles | Panel-schedule practice; conservative | R2, clarification Q4 |
| D3 | Balance = proposal object, never mutates state until accept | Clarification Q1; testable pure function | R7 |
| D4 | Deterministic LPT + local search, not ILP / annealing | FR-016 determinism; no dependency; fast | R7 |
| D5 | NEC demand ordering: category rules → 220.60 → 430.24 → continuous +25% on demand-adjusted VA | Avoids double-counting motors; mirrors NEC load calc order | R4 |
| D6 | IEC diversity defaults 1.0, RDF off | Conservative defaults; IEC lacks mandatory factors | R5 |
| D7 | Native numbers | Same as arc-flash | R8 |

## Risks and Mitigations

1. **Transcription errors in NEC tables** (220.42/220.44/220.56/430.248/430.250) → wrong demand or motor VA. *Mitigation*: spot-check tests against the quickstart examples, plus a release-blocking user verification task against a licensed NEC 2020 copy.
2. **The balancer moves circuits the designer wants kept together** (e.g. related loads). *Mitigation*: lock flag per circuit, proposal preview, a list of moved circuits, and a tie-break that prefers fewer moves.
3. **Users confusing connected and demand load when sizing feeders.** *Mitigation*: separate labelled cards, the design current is always based on demand and shown with its rule table, and the PDF prints both.

## Post-Design Constitution Re-check

Contracts keep every module pure and deterministic. The error taxonomy carries clause references, and the PDF content satisfies VI. **Gate: PASS.**

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| ADR-003 mandates mathjs BigNumber; this feature uses native doubles | Sums/products of 3–4 sig-fig inputs; 0.1% tolerance is ~10¹³× above double error; same choice as arc-flash, short-circuit, generator calculators | BigNumber adds verbosity with no accuracy gain |

## ADR Suggestion

Recorded as [ADR-007](../../history/adr/007-arithmetic-policy-native-vs-bignumber.md) — calculation arithmetic policy (amends ADR-003).
