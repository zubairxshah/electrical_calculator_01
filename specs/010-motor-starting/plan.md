# Implementation Plan: Motor Starting Analysis Calculator

**Branch**: `010-motor-starting` | **Date**: 2026-05-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-motor-starting/spec.md`

## Summary

Implement a Motor Starting Analysis Calculator that evaluates and compares five starting methods (DOL, Star-Delta, Autotransformer, Soft Starter, VFD) for AC squirrel-cage induction motors against the source impedance chain (utility → transformer → cable → motor). Outputs voltage dip at PCC checked against IEEE 1668 limits, starting-current and acceleration-time curves overlaid on the motor thermal-limit (t6/stall) curve, a side-by-side method-comparison table, and PDF export. Dual standard support (NEC 430 + IEC 60034-12 + IEEE 3002.7-2018) reuses the standards-switcher pattern from Conduit Fill v2 and Voltage Drop. Implementation follows the established ElectroMate calculator architecture: Next.js page + client tool component + Zustand store + pure calculation modules + Zod validation + jsPDF export.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 16.1 (Turbopack)
**Primary Dependencies**: React, Tailwind CSS, shadcn/ui, Zustand, mathjs (BigNumber for impedance/per-unit math), jsPDF + jspdf-autotable, Zod, Recharts (for current/thermal curve visualizations — already in repo per Generator Sizing)
**Storage**: localStorage (calculation history via Zustand persist middleware)
**Testing**: Vitest
**Target Platform**: Web (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Single-method analysis < 50 ms; 5-method comparison < 2 s; standard switcher update < 200 ms; PDF export < 10 s
**Constraints**: Client-side only (no backend); steady-state and quasi-static analysis only (no time-domain simulation); single motor per analysis
**Scale/Scope**: One calculator route (`/motor-starting`) covering 5 starting methods × NEMA + IEC motor design classes × NEMA Code Letters (A–V) × ~20 NEC/IEC cable sizes × IEEE 1668 voltage-dip thresholds

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Calculation Accuracy
- [x] All calculation formulas identified with applicable standards — IEEE 3002.7-2018 (analysis methodology), NEC 430.7(B) (NEMA Code Letter kVA/HP), IEC 60034-12 (starting performance / Designs N & H), IEEE 1668-2017 (voltage-dip limits), NEMA MG 1 (motor thermal limits)
- [x] Test cases from published standards documented — IEEE 3002.7 Annex worked examples; NEMA MG 1 typical curves; method-multiplier values from Beeman, Wildi, IEEE Std 141 (Red Book)
- [x] Accuracy tolerance thresholds specified — ±2% for voltage dip and starting current vs reference cases (per spec SC-003)
- [x] Math.js BigNumber planned — used for per-unit impedance summation and complex-number arithmetic where R + jX matters

### Safety-First Validation
- [x] Dangerous condition detection rules defined — voltage dip > 20% (red), accel time ≥ motor t6/stall time (red), starting torque < load break-away torque (red)
- [x] Real-time validation approach specified — recompute on every input change, target < 100 ms per method, < 50 ms for source-chain Thevenin
- [x] Warning UI treatment defined — red badge "Excessive Dip" / "Insufficient Torque" / "Thermal Limit Risk", explanatory tooltip with the offending value and the limit it exceeded
- [x] Edge case validation planned — zero/negative inputs, infinite-bus assumption, missing thermal curve, Y-Δ on 3-lead motor, VFD bypass mode

### Standards Compliance and Traceability
- [x] Standard versions specified — NEC 2020 (Article 430), IEC 60034-12:2016, IEEE 3002.7-2018, IEEE 1668-2017, NEMA MG 1-2016
- [x] Standard references will be displayed in calculation outputs — every method result shows the citation for its multiplier values
- [x] PDF reports will include section numbers and formula citations — e.g., "NEC 430.7(B) Code Letter G → 6.3 kVA/HP"
- [x] Version labeling strategy defined — UI badge shows active standard set; switching between NEC and IEC modes updates labels and citations

### Test-First Development (NON-NEGOTIABLE for P1 calculations)
- [x] TDD workflow confirmed — Red-Green-Refactor for `sourceImpedance.ts`, `voltageDip.ts`, each method module, and `accelerationTime.ts`
- [x] Test coverage requirements specified — nominal (IEEE 3002.7 worked examples), boundary (infinite bus, locked rotor, exact-at-limit dip), edge (zero inertia, missing FLA), error (negative inputs)
- [x] User approval checkpoint planned for test case validation — task list will surface representative test cases for review before Green
- [x] Test framework selected — Vitest (matches Generator Sizing's 56 tests and Conduit Fill's 63 tests)

### Professional Documentation
- [x] PDF export requirements defined — inputs, source chain, per-method results, comparison table, current+thermal plots, voltage-dip indicator, IEEE/NEC/IEC citations
- [x] Cross-browser compatibility targets specified — Chrome, Firefox, Safari, Edge
- [x] Disclaimer text prepared — standard ElectroMate disclaimer reused
- [x] Intermediate calculation steps approach defined — "Show Details" toggle reveals Thevenin Z computation, per-unit conversions, and method-specific multipliers

### Progressive Enhancement
- [x] Feature prioritization confirmed — P1: single-method analysis + 5-method comparison; P2: full source-chain modeling + PDF export; P3: NEC/IEC standards switcher
- [x] Each user story independently testable — US1 ships even without US2; US3 source chain is hidden behind "Advanced" until P2
- [x] No dependencies on incomplete higher-priority features
- [x] Incremental value delivery strategy defined — P1 alone delivers DOL analysis with default source assumption; P2 adds full chain; P3 adds IEC parity

### Other Constitution Principles
- [x] Dual standards support planned — NEC ↔ IEC switcher with unit conversion (HP↔kW, AWG↔mm²) preserving accuracy via mathjs
- [x] Security requirements addressed — Zod input validation, no PII, fully client-side
- [x] Code quality standards acknowledged — smallest viable diff, no hardcoded values outside `motorStartingData.ts`, reuse Generator Sizing's chart and PDF helpers where applicable
- [x] Complexity justifications documented — five separate method modules instead of one parameterized function, because each has distinct physics (Y-Δ transition transient, autotransformer tap squared, VFD constant V/Hz) and distinct test cases. See Complexity Tracking below.

## Project Structure

### Documentation (this feature)

```text
specs/010-motor-starting/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── calculator-api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/sp.tasks - NOT created here)
```

### Source Code (repository root)

```text
app/motor-starting/
├── page.tsx                                # Next.js page with metadata
└── MotorStartingTool.tsx                   # Main client tool component (orchestrator)

components/motor-starting/
├── MotorInputForm.tsx                      # Motor nameplate inputs
├── LoadInputForm.tsx                       # Load torque type + inertia (WR²)
├── SourceImpedanceForm.tsx                 # Utility + transformer + cable inputs
├── MethodConfigForm.tsx                    # Method-specific tuning (autotrans tap, soft-starter ramp, VFD type)
├── SingleMethodResults.tsx                 # Per-method results card
├── ComparisonTable.tsx                     # 5-row side-by-side table
├── StartingCurrentChart.tsx                # I(t) curve overlaid with motor thermal limit
├── VoltageDipIndicator.tsx                 # Dip vs IEEE 1668 threshold
├── ReferenceGuideDialog.tsx                # NEC/IEC side-by-side reference
└── HistorySidebar.tsx                      # Calculation history (reuses Generator Sizing pattern)

lib/calculations/motor-starting/
├── motorStartingCalculator.ts              # Top-level orchestrator: analyze(input) → results
├── sourceImpedance.ts                      # Utility + xfmr + cable → Thevenin Z at motor
├── voltageDip.ts                           # Compute V_dip at PCC and motor terminals
├── accelerationTime.ts                     # WR²-based accel time integration (simplified IEEE 3002.7 method)
├── methods/
│   ├── dol.ts                              # Direct-on-line: full V, full I, full T
│   ├── starDelta.ts                        # Y-Δ: ⅓ I, ⅓ T, open vs closed transition
│   ├── autotransformer.ts                  # Tap a: a²·I_line, a²·T (50/65/80%)
│   ├── softStarter.ts                      # Linear voltage ramp from initial V → 100%
│   └── vfd.ts                              # Constant V/Hz, ~100% I, full T at low speed
├── motorStartingData.ts                    # NEMA Code Letter table, IEC Design N/H, default thermal curves, IEEE 1668 thresholds
├── comparison.ts                           # Aggregate 5 method results → ranked table + recommendation
└── unitConversions.ts                      # HP↔kW, AWG↔mm² helpers (reuse from existing if available)

lib/validation/
└── motorStartingValidation.ts              # Zod schema for full input bundle

lib/
└── pdfGenerator.motorStarting.ts           # Multi-page PDF: inputs, chain, results, table, plots, citations

stores/
└── useMotorStartingStore.ts                # Zustand state + history persist

types/
└── motor-starting.ts                       # All TS interfaces (mirrors data-model.md)

__tests__/unit/calculations/motor-starting/
├── sourceImpedance.test.ts                 # Thevenin Z assembly tests
├── voltageDip.test.ts                      # Per-unit dip formula tests
├── accelerationTime.test.ts                # WR² accel time tests
├── methods/
│   ├── dol.test.ts                         # DOL multipliers + result shape
│   ├── starDelta.test.ts                   # Y-Δ ⅓ rule + transition modes
│   ├── autotransformer.test.ts             # Tap²-scaling tests at 50/65/80%
│   ├── softStarter.test.ts                 # Ramp behavior + initial-voltage edge cases
│   └── vfd.test.ts                         # Constant-flux start, bypass note
├── motorStartingData.test.ts               # NEMA/IEC table integrity
└── comparison.test.ts                      # Ranking + recommendation logic
```

**Structure Decision**: Mirrors the established ElectroMate calculator architecture (one directory per layer: `app`, `components`, `lib/calculations`, `lib/validation`, `stores`, `types`). Method-specific calculation files live under `lib/calculations/motor-starting/methods/` to keep each method's physics, defaults, and tests isolated and readable — every method has its own ~40-line module + test file rather than one large parameterized function.

## Complexity Tracking

> Constitution Check passed without violations. The two design choices below add minor complexity that is justified for engineering correctness.

| Choice | Why Needed | Simpler Alternative Rejected Because |
|--------|------------|--------------------------------------|
| Separate module per starting method (5 files under `methods/`) | Each method has distinct physics (Y-Δ open/closed transition transient, autotransformer tap-squared current with continuity considerations, soft starter linear ramp, VFD constant V/Hz, DOL baseline) and distinct test cases sourced from different standards. | A single parameterized function would obscure method-specific defaults (autotrans taps, soft-start ramp profiles), make tests harder to write per-method, and create a leaky abstraction that future methods (e.g., reactor start, capacitor start) would have to bend to fit. |
| Complex-number / per-unit math via mathjs BigNumber for source chain | Voltage-dip accuracy at PCC depends on faithful R + jX summation of utility, transformer, and cable impedances. Floating-point drift accumulates noticeably over the chain at low per-unit values. | Plain `number` arithmetic was rejected because the IEEE 3002.7 reference cases require sub-percent agreement, and BigNumber precision is already a project standard (used by Battery, Voltage Drop, Generator Sizing). |
