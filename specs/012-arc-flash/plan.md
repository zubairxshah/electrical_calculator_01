# Implementation Plan: Arc Flash Calculator

**Branch**: `012-arc-flash` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-arc-flash/spec.md`

## Summary

Add calculator #23 at `/arc-flash`. It computes IEEE 1584-2018 arcing current, incident energy and arc flash boundary for one equipment location, in **both the nominal and reduced arcing-current cases, each with its own user-entered clearing time**, and reports the governing case. It then assigns NFPA 70E-2024 PPE: incident-energy method or table method, approach boundaries, and an IEC 61482 presentation in IEC mode. It renders a WARNING/DANGER label and exports a PDF.

The approach was de-risked during research. A native-number prototype of the planned engine reproduces **all 144,000 cases of the official IEEE 1584-2018 spreadsheet** in both cases (max relative error 2.4e-6) and **every Annex D.1/D.2 published value exactly** (research R2). Implementation is mostly a careful TypeScript port of that verified prototype plus UI in the existing calculator pattern.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.1 (App Router, Turbopack)
**Primary Dependencies**: existing only — Zustand 5 (store + persist), Zod 4 (validation), jsPDF 3 (PDF), shadcn/ui + Tailwind (UI), lucide-react (icons). **No new dependencies.** mathjs is not used by this feature (R5).
**Storage**: browser localStorage — `electromate-arc-flash` (persisted inputs) and `electromate-arc-flash-history` (FIFO 50)
**Testing**: Vitest 4 — `__tests__/unit/calculations/arc-flash/` + fixture `__tests__/fixtures/arc-flash/ieee1584-golden-subset.csv`
**Target Platform**: modern desktop/tablet browsers (Chrome, Firefox, Safari, Edge); client-side only
**Project Type**: web application (single Next.js project; existing layout)
**Performance Goals**: calculation + PPE < 5 ms; validation < 100 ms (Constitution II); result visible < 1 s (SC-005)
**Constraints**: AC only; single bus; IEEE 1584-2018 model ranges enforced (R7); offline-capable (no network calls)
**Scale/Scope**: 1 route, ~6 components, 4 calculation modules + 1 standards data module, ~2,000-row fixture, ~10 test files

No NEEDS CLARIFICATION items remain (spec FR-007 resolved: option B; all technical unknowns resolved in research.md R1–R11).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Calculation Accuracy
- [x] All formulas tied to standards: IEEE 1584-2018 Eqs. 1, 10–15, 25 and Tables 1–5, 7 (R1, R4, R6); NFPA 70E-2024 Tables 130.4(E)(a), 130.7(C)(15)(a)/(c) (R8)
- [x] Published test cases documented: Annex D.1/D.2 + 2,000-row official-spreadsheet subset (R2)
- [x] Tolerance specified: ≤ 0.01% vs golden data; Annex D at printed precision; spec SC-001 ±2% as the user-facing commitment
- [~] Math.js high-precision arithmetic — **justified deviation** (native doubles; see Complexity Tracking and R5)

### Safety-First Validation
- [x] Dangerous conditions defined: E > 40 cal/cm² → DANGER (no PPE category); reduced-case governing highlighted; T > 2 s; reduced time < nominal time; out-of-model-range inputs blocked (R7)
- [x] Real-time validation: Zod schema on change, < 100 ms
- [x] Warning UI: existing error/warning/info alert styles (`patterns.md`) with IEEE/NFPA clause in each message
- [x] Edge cases: zero/negative/non-numeric, range boundaries per voltage class, 600 V exact boundary, open-air (no enclosure)

### Standards Compliance and Traceability
- [x] Editions pinned: IEEE 1584-2018, NFPA 70E-2024, IEC 61482-1-1:2019, IEC 61482-2:2018
- [x] References shown in results ("calculation details") and the reference dialog
- [x] PDF includes equation/clause numbers
- [x] Version labeling: `standardRefs` array; edition changes are data-table swaps

### Test-First Development
- [x] TDD for calculation logic: Annex D + golden tests are written first and must fail (Red) before the port
- [x] Coverage: nominal (Annex D), boundary (range edges, 600 V, PPE thresholds), edge (open-air, capped enclosure, shallow enclosure), error (invalid inputs)
- [x] **User approval checkpoint**: the Annex D cases and the PPE threshold table (quickstart §3A–C) are presented for approval before the Green phase. The NFPA metric approach-boundary values need user verification against a licensed copy (R8)
- [x] Vitest 4 (existing)

### Professional Documentation
- [x] PDF: inputs, both cases, intermediates, PPE, boundaries, label, references, timestamp, version, disclaimer
- [x] Cross-browser: same jsPDF pipeline as 10 existing calculators
- [x] Disclaimer: Constitution VI text + spec FR-021 ("supports, does not replace, an engineered arc flash risk assessment")
- [x] "Calculation details" expandable section (FR-009)

### Progressive Enhancement
- [x] Priorities from spec: P1 = US1 (calc) + US2 (PPE); P2 = US3 (label/PDF) + US4 (IEC mode); P3 = US5 (history/reference/pre-fill)
- [x] Each story is independently testable; US2 depends only on US1 output (same P1 tier)
- [x] No dependency on unmerged `010-motor-starting`
- [x] Delivery order: engine → PPE → UI shell → label/PDF → IEC mode → history/reference/pre-fill

### Other
- [x] Dual standards: NEC/IEC switcher (presentation only, SC-006)
- [x] Security: input validation; no auth/PII; no network
- [x] Code quality: no secrets; additive change (new files + 3 nav/home edits)
- [x] Complexity: one justified deviation (below)

**Gate result: PASS** (one documented, justified deviation).

## Project Structure

### Documentation (this feature)

```text
specs/012-arc-flash/
├── plan.md              # This file
├── research.md          # Phase 0 (R1–R11)
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── calculation-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /sp.tasks (not created here)
```

### Source Code (repository root)

```text
types/
└── arc-flash.ts                         # NEW — all interfaces (data-model.md)

lib/
├── calculations/arc-flash/
│   ├── ieee1584Tables.ts                # NEW — Tables 1,2,3,4,5,7 + Table 8/10 typical values (R1, R10)
│   ├── ieee1584.ts                      # NEW — model core: VarCf, I_arc, enclosure CF, E, AFB (R4, R6)
│   ├── arcFlashCalculator.ts            # NEW — orchestration: both cases, governing, warnings
│   └── ppe.ts                           # NEW — category mapping, table method, boundaries, IEC text
├── standards/
│   └── nfpa70e.ts                       # NEW — PPE thresholds, Table 130.7(C)(15)(a) rows, Table 130.4(E)(a)
├── validation/
│   └── arcFlashValidation.ts            # NEW — Zod schema + range rules (R7)
└── pdfGenerator.arcFlash.ts             # NEW

stores/
└── useArcFlashStore.ts                  # NEW — Zustand + persist; history key electromate-arc-flash-history

components/arc-flash/
├── ArcFlashInputForm.tsx                # NEW — inputs, equipment-class pre-fill, two arcing times
├── ArcFlashResults.tsx                  # NEW — both cases, governing badge, details, warnings
├── PpeAssessmentCard.tsx                # NEW — category/DANGER, clothing, boundaries, table method
├── ArcFlashLabelPreview.tsx             # NEW — WARNING/DANGER label
├── ArcFlashHistorySidebar.tsx           # NEW
└── ArcFlashReferenceDialog.tsx          # NEW — configs, typical values, thresholds, errata note (R3)

app/arc-flash/
├── page.tsx                             # NEW — metadata
└── ArcFlashTool.tsx                     # NEW — client orchestrator

components/layout/Sidebar.tsx            # EDIT — add under "Protection & Safety"
components/layout/TopNavigation.tsx      # EDIT — same
app/page.tsx                             # EDIT — calculator card

__tests__/
├── fixtures/arc-flash/
│   ├── ieee1584-golden-subset.csv       # NEW — 2,000 rows, attribution header (R2)
│   └── README.md                        # NEW — provenance, license (MIT), regeneration script
└── unit/calculations/arc-flash/
    ├── tables.test.ts                   # coefficient spot-checks, VOA k7 = 0.33696, 15 kV MCC gap
    ├── enclosure.test.ts                # typical/shallow/open-air/capped; D.1 & D.2 EES/CF
    ├── annexD.test.ts                   # all D.1/D.2 intermediates and finals
    ├── golden.test.ts                   # subset, both cases, ≤ 0.01%
    ├── errata.test.ts                   # 600 V LV path; VOA MV reduced
    ├── calculator.test.ts               # governing case, two times, 2 s cap, warnings, linearity in T
    ├── ppe.test.ts                      # thresholds, DANGER, table method applicability, boundaries, IEC text
    ├── validation.test.ts               # every error code and boundary
    └── pdf.test.ts                      # PDF generates; contains key strings
```

**Structure Decision**: Follow the established per-calculator layout (research R11; reference implementation `conduit-fill`). The model core (`ieee1584.ts`) is split from orchestration (`arcFlashCalculator.ts`) so the Annex D intermediates can be tested directly, matching how the standard presents its steps. NFPA data lives in `lib/standards/` beside `breakerRatings.ts`/`tripCurves.ts`, so a future feature (e.g., auto clearing time from TCC, deferred in the spec) can reuse it.

## Key Design Decisions

| # | Decision | Rationale | Ref |
|---|---|---|---|
| D1 | Two independent arcing times (nominal/reduced) with a "same for both" toggle | Spec FR-007; Annex D.2 shows the reduced case can govern at 4.6× | R2, spec |
| D2 | Native `number` arithmetic, not mathjs BigNumber | Empirical 4–6 sig-fig coefficients; the reference spreadsheet is double precision; measured error 2.4e-6 | R5 |
| D3 | Follow the standard's text where the IEEE spreadsheet v2.6.6 deviates | Two known errata; covered by regression tests | R3 |
| D4 | Golden-data subset (2,000 rows) committed; full 144k set used only for one-off verification | Repo size vs coverage | R2 |
| D5 | IEC mode = same engine + IEC 61482 presentation; no DGUV box-test method | Spec Assumptions; avoids a second hazard model | R9 |
| D6 | NFPA clothing lists paraphrased, numeric values encoded, clauses cited | Copyright; values are facts needed for compliance | R8 |
| D7 | Internal SI units; conversion only at UI/PDF edges | Single source of truth; SC-006 toggle invariance | data-model |

## Risks and Mitigations

1. **Coefficient transcription error** (safety-critical: under-predicted energy → under-protected worker). *Mitigation*: the golden subset covers every configuration × voltage-level coefficient row. A single wrong digit in any table fails ≥ 1 test. Two independent sources cross-checked (R1).
2. **NFPA 70E-2024 metric approach-boundary values unverified** (R8). *Mitigation*: imperial values are authoritative; the metric values live in one table, and a release-blocking verification task is assigned to the user (licensed copy).
3. **Users misreading the governing case or entering the nominal time for both cases.** *Mitigation*: the reduced-time field is visible by default, the "governs" badge is prominent, a warning shows when the reduced time is shorter than nominal, and the reference dialog explains why the reduced current usually clears more slowly.

## Post-Design Constitution Re-check

Re-evaluated after Phase 1 (data-model, contracts, quickstart): no new violations. The contracts keep the calculation pure and testable (V), the error taxonomy cites clauses (II, III), and the PDF content list satisfies VI. **Gate: PASS.**

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| ADR-003 says mathjs BigNumber for ALL calculations; this feature uses native doubles | IEEE 1584-2018 is an empirical log/power-law model whose official reference calculator is double precision. BigNumber can't increase accuracy beyond 4–6 sig-fig coefficients and would make the code diverge from the equations as printed in the standard, making review harder | "Use BigNumber anyway": ~3× code for `10^x`/`log10`/7th-order polynomials with zero measured accuracy benefit (native error 2.4e-6 vs 2% requirement), and the existing codebase already uses native numbers in short-circuit, generator, harmonic and transformer calculators |

## ADR Suggestion

📋 Architectural decision detected: **Native floating-point arithmetic for empirical-model calculators (amends ADR-003's "all calculations use mathjs BigNumber")** — Document reasoning and tradeoffs? Run `/sp.adr native-arithmetic-for-empirical-models`
