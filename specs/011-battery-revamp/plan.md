# Implementation Plan: Battery Calculator Revamp — Standards-Based Sizing & UX Redesign

**Branch**: `011-battery-revamp` | **Date**: 2026-06-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-battery-revamp/spec.md`

## Summary

Rework calculator #1 (`/battery`) from a first-order energy-over-load estimator into a stringent, standards-based battery/UPS sizing tool, and redesign its page to the ElectroMate Design System. The core change is a chemistry-aware, dual-mode (runtime ↔ required-capacity) sizing engine that applies per-chemistry depth-of-discharge ceilings, end-of-life aging margin, temperature correction, and discharge-rate (Peukert/C-rate) derating sourced from the existing `lib/standards/batteryTypes.ts` dataset — fixing today's defect where chemistry is collected but never used, and reconciling the three-way chemistry-ID mismatch across the Zod schema, the form, and the reference dataset. On top of correctness we add: bank-configuration output (series/parallel), a plain-language verdict, a curated manufacturer datasheet library, re-enabled PDF export, and (phase-2 stretch) datasheet OCR using the already-installed `tesseract.js` + `pdfjs-dist`.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19, Next.js 16.1 (App Router + Turbopack)
**Primary Dependencies**: mathjs 15 (BigNumber precision), Zustand 5 (+persist/localStorage), Zod 4, react-hook-form 7, Recharts 3 (discharge/load charts), jsPDF 3 + html2canvas (PDF export), tesseract.js 7 + pdfjs-dist 5 (datasheet OCR/parse, P3), shadcn/ui (Radix), Tailwind 3, framer-motion
**Storage**: Browser localStorage via Zustand `persist` (key `electromate-battery`); no database for this feature (better-auth/Drizzle exist in the repo but are out of scope here)
**Testing**: Vitest (unit — primary, per constitution TDD), Playwright (e2e — available, optional for this feature)
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge); desktop + tablet first, mobile responsive
**Project Type**: Web — single Next.js app (existing structure: `app/`, `components/`, `lib/`, `stores/`, `types/`)
**Performance Goals**: Calculation + validation < 100 ms (constitution SC-002); 60 fps UI; OCR is async/off the critical path
**Constraints**: Battery sizing within ±2% of IEEE 485 worked examples (constitution Principle I); calculation must work offline; WCAG 2.1 AA; smallest viable diff (no refactor of unrelated calculators)
**Scale/Scope**: One calculator page; 8 canonical chemistries; a small curated datasheet library (~10–20 models at launch); two calculation modes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Calculation Accuracy
- [x] All calculation formulas identified with applicable standards — IEEE 485 (lead-acid sizing & aging), IEC 60896/62619 (VRLA/Li-ion characteristics), Peukert's law for rate derating; documented in research.md.
- [x] Test cases from published standards documented — IEEE 485 worked-example duty-cycle and a rate/temperature derating example captured in research.md / contracts as fixtures.
- [x] Accuracy tolerance specified — ±2% vs IEEE 485 worked examples (constitution); round-trip self-consistency (sizing→runtime) exact within rounding.
- [x] mathjs BigNumber planned — reuse existing `lib/mathConfig` (`toBigNumber`/`toNumber`/`round`).

### Safety-First Validation
- [x] Dangerous-condition rules defined — discharge rate above chemistry safe continuous C-rate; operating temperature outside rated range; DoD override above chemistry maximum; aging factor ≤ EOL; impossible efficiency.
- [x] Real-time validation < 100 ms — extend existing `validateBatteryInputs` (already on the < 100 ms path) with chemistry-limit checks.
- [x] Warning UI treatment defined — reuse WarningBanner/InputField error+warning states from the Design System (red error, amber warning, code references).
- [x] Edge-case validation planned — zero/negative, beyond-range, non-whole-string sizing, conflicting datasheet vs chemistry (spec Edge Cases).

### Standards Compliance and Traceability
- [x] Standard versions specified — IEEE 485-2020, IEC 60896-21/22, IEC 62619, NEC 2020 (Art. 480 safety references).
- [x] Standard references displayed in outputs — each result factor carries a `standardReference` (existing ResultItem/Badge pattern).
- [x] PDF reports include section numbers and citations — new `pdfGenerator.battery.ts` follows the existing per-calculator generator pattern.
- [x] Version labeling strategy — standards strings centralized in the chemistry/standards module.

### Test-First Development
- [x] TDD confirmed for critical calculation logic — NON-NEGOTIABLE for this P1 calculator; Red→Green→Refactor per sizing module.
- [x] Test coverage requirements — nominal, boundary (min/max ranges, DoD ceiling), edge (zero, asymptote, non-integer strings), error (negative/impossible) per module.
- [x] User approval checkpoint — test fixtures (IEEE 485 example values) to be confirmed before Green (during `/sp.tasks`/implementation).
- [x] Test framework selected — Vitest, consistent with the existing 70-test motor-starting suite.

### Professional Documentation
- [x] PDF export requirements defined — inputs, headline result, all applied factors, bank config, recommendations, standards refs, timestamp, disclaimer.
- [x] Cross-browser targets — Chrome/Firefox/Safari/Edge (constitution SC-003).
- [x] Disclaimer text — reuse standard ElectroMate PDF disclaimer.
- [x] Intermediate steps — "applied factors" breakdown serves as the Show-Details/verification view.

### Progressive Enhancement
- [x] Prioritization confirmed — P1 chemistry-aware runtime + reverse sizing; P2 few-inputs defaults, datasheet library, redesign+PDF; P3 OCR stretch (spec).
- [x] Each user story independently testable/deployable — engine (US1/US2) ships behind the existing page before the redesign; datasheet library and OCR layer on without blocking.
- [x] No dependency on incomplete higher-priority features — UI redesign consumes the engine but the engine is independently testable headless.
- [x] Incremental value strategy — land correct engine first (fixes the live defect), then UX, then datasheets, then OCR.

### Other Constitution Principles
- [x] Dual standards — IEEE/NEC ↔ IEC switcher consistent with conduit-fill/motor-starting; temperature in °C with °F display option; capacity in Ah.
- [x] Security — numeric input validation already present (`inputValidation.ts`, XSS guard in InputField); datasheet upload (P3) parsed client-side, file-type/size limited, never executed.
- [x] Code quality — no secrets; smallest viable diff confined to battery files; cite file:line in tasks.
- [x] Complexity justifications — only new dependency surface is tesseract.js/pdfjs-dist, both already installed; no new architecture layers (see Complexity Tracking — none required).

**Result**: PASS (no violations). Re-evaluated after Phase 1 design — still PASS (data-model and contracts introduce no new gate concerns).

## Project Structure

### Documentation (this feature)

```text
specs/011-battery-revamp/
├── plan.md              # This file
├── research.md          # Phase 0 — methodology + decisions
├── data-model.md        # Phase 1 — entities & migration
├── quickstart.md        # Phase 1 — dev/run/test walkthrough
├── contracts/           # Phase 1 — module + type contracts
│   ├── sizing-engine.contract.md
│   └── chemistry-data.contract.md
└── tasks.md             # Phase 2 — created by /sp.tasks (NOT here)
```

### Source Code (repository root)

```text
lib/
├── calculations/
│   └── battery/                    # NEW dir (was single battery.ts)
│       ├── index.ts                # public API: calculateRuntime, sizeForRuntime
│       ├── runtime.ts              # forward: installed capacity → backup time
│       ├── sizing.ts               # reverse: target time → required Ah + bank config
│       ├── derating.ts             # DoD, temperature, aging, Peukert/C-rate factors
│       ├── bankConfig.ts           # series cells/blocks + parallel strings
│       └── dischargeCurve.ts       # Recharts points (existing field, now populated)
├── standards/
│   ├── batteryTypes.ts             # EXISTING — canonical BatteryChemistry (single source)
│   └── batteryChemistryMap.ts      # NEW — legacy-ID → canonical migration + display meta
├── datasheets/
│   ├── library.ts                  # NEW — curated manufacturer models
│   └── datasheetExtract.ts         # NEW (P3) — tesseract.js/pdfjs-dist parameter extraction
├── schemas/batterySchema.ts        # UPDATE — Zod enum → canonical 8 chemistries + new fields
├── validation/batteryValidation.ts # UPDATE — chemistry-limit + temperature + mode checks
├── pdfGenerator.battery.ts         # NEW — re-enable export (per-calculator pattern)
└── types/calculations.ts           # UPDATE — inputs (mode, temp, datasheet ref), result (factors, bankConfig, verdict)

stores/useBatteryStore.ts           # UPDATE — mode, dual-mode calc, persist version+migrate

app/battery/page.tsx                # UPDATE — metadata only (server component)
components/battery/
├── BatteryCalculator.tsx           # UPDATE — side-by-side sticky layout, mode switch, PDF button
├── BatteryInputForm.tsx            # UPDATE — canonical chemistry, mode-aware fields, datasheet picker
├── BatteryResults.tsx              # UPDATE — hero metric, applied-factors, bank config, verdict
├── BatteryModeSwitch.tsx           # NEW — runtime ↔ sizing toggle
├── DatasheetPicker.tsx             # NEW — library select + (P3) upload
└── DischargeChart.tsx              # NEW — Recharts discharge/SoC curve

__tests__/ or *.test.ts colocated   # NEW — Vitest suites per calc module (TDD)
```

**Structure Decision**: Single Next.js web app (existing). The monolithic `lib/calculations/battery.ts` is promoted to a `battery/` module directory mirroring the motor-starting layout (one concern per file: runtime, sizing, derating, bankConfig, dischargeCurve), which keeps each unit independently testable per the TDD gate. All other changes stay within the established per-calculator conventions (store, schema, validation, types, `pdfGenerator.<calc>.ts`, `components/<calc>/`). No new architectural layers are introduced.

## Complexity Tracking

> No constitution violations — this feature introduces no new abstraction layers or dependencies beyond packages already present in `package.json` (tesseract.js, pdfjs-dist). Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |
