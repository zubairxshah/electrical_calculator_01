# Quickstart: Battery Calculator Revamp

**Feature**: `011-battery-revamp` | **Branch**: `011-battery-revamp`

## Prerequisites
- Node + the repo installed (`npm install` — all deps including `mathjs`, `recharts`, `jspdf`, `tesseract.js`, `pdfjs-dist` are already in `package.json`).
- On branch `011-battery-revamp`.

## Run the app
```bash
npm run dev          # Next.js dev (Turbopack); open http://localhost:3000/battery
```

## Test (TDD — primary workflow)
```bash
npm test                                   # Vitest watch
npm test -- lib/calculations/battery       # just the sizing engine suites
npm run test:coverage                      # coverage
```
Write the failing test first (Red), implement to pass (Green), refactor. Engine modules under `lib/calculations/battery/` are pure and tested headless — no DOM needed.

## Manual verification walkthrough (maps to acceptance scenarios)
1. **Chemistry sensitivity (US1)** — `/battery`, mode = Runtime, fixed V/load/Ah. Switch chemistry VRLA-AGM → Li-Ion-LFP; backup time and effective capacity MUST change. *(SC-001)*
2. **Reverse sizing (US2)** — switch to Sizing mode, enter target backup hours + load + voltage + chemistry; confirm required Ah and a series/parallel bank config appear, with C-rate, DoD, EOL margin, temperature margin, and a verdict. *(SC-004)*
3. **Round-trip (US2/SC-005)** — take the sizing result's bank nameplate Ah, switch to Runtime with that Ah; delivered time MUST be ≥ the original target.
4. **Few inputs (US3)** — enter only the essentials; confirm DoD/efficiency/temperature/aging auto-fill from chemistry data and are labelled as defaults; override one and see it recalc + relabel as user-supplied.
5. **Datasheet (US4)** — pick a model from the library; confirm its parameters pre-fill and are marked datasheet-sourced; pick a conflicting chemistry → warning.
6. **Redesign + export (US5)** — on desktop confirm side-by-side input/results with the headline metric dominant and results sticky while editing; export PDF and confirm inputs, result, factors, recommendations, and standards refs are present.
7. **OCR (US6, P3)** — upload a sample datasheet; confirm detected fields are shown for confirmation before applying, with manual fallback.
8. **Migration (D4/C4)** — with an old `electromate-battery` localStorage value holding `LiFePO4`, load the page; it MUST resolve to `Li-Ion-LFP` without error.

## Key files to touch (see plan.md for the full tree)
- Engine: `lib/calculations/battery/{index,runtime,sizing,derating,bankConfig,dischargeCurve}.ts`
- Data: `lib/standards/{batteryTypes.ts (+peukert),batteryChemistryMap.ts}`, `lib/datasheets/{library,datasheetExtract}.ts`
- Surface: `lib/schemas/batterySchema.ts`, `lib/validation/batteryValidation.ts`, `lib/types/calculations.ts`, `stores/useBatteryStore.ts`, `lib/pdfGenerator.battery.ts`
- UI: `components/battery/{BatteryCalculator,BatteryInputForm,BatteryResults,BatteryModeSwitch,DatasheetPicker,DischargeChart}.tsx`

## Definition of done (this feature)
- All sizing-engine contract guarantees (G1–G5) covered by passing Vitest suites; ±2% vs IEEE 485 fixtures.
- Zero unmapped chemistry options; legacy localStorage migrates cleanly.
- PDF export works across Chrome/Firefox/Safari/Edge.
- P1+P2 stories pass manual walkthrough; P3 OCR behind confirmation with manual fallback.
