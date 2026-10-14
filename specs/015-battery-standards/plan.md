# Implementation Plan: Battery Calculator Standards Hardening

**Branch**: `015-battery-standards` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/015-battery-standards/spec.md`

## Summary

Extend the existing `/battery` engine and UI in place. Add an application mode (standby default / cycling), change efficiency to load-side conversion efficiency, add a design margin, compute the cell count from the voltage window and end voltage, use the IEEE 485 temperature table for lead-acid, and add charger sizing, ventilation and installation checks. The engine's public API is unchanged, and new outputs are added to the result. Persisted state migrates v1 → v2. Also the 011 polish items (defaults test, a11y, reference dialog). Method details: [research.md](./research.md); types: [data-model.md](./data-model.md); guarantees: [contracts/battery-engine.contract.md](./contracts/battery-engine.contract.md).

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16.1 (App Router, Turbopack)
**Primary Dependencies**: Zustand (persist), Zod, jsPDF, shadcn/ui, Tailwind; native arithmetic per ADR-007 (BigNumber only at the result boundary, as today)
**Storage**: localStorage via Zustand persist (`electromate-battery`, v1 → v2)
**Testing**: Vitest — `__tests__/unit/calculations/battery/**` (only `__tests__/unit|integration|session-memory/**` are collected)
**Target Platform**: Browser (desktop/tablet)
**Project Type**: Web app (single Next.js project)
**Performance Goals**: Recalculation < 100 ms (SC-006, constitution)
**Constraints**: Smallest viable diff, only battery files touched; no new dependencies
**Scale/Scope**: about 9 engine/data files, 6 components, store, validation, PDF

## Constitution Check

### Calculation Accuracy
- [x] Formulas traceable to IEEE 485 / IEEE 946 / EN 50272-2 / IEC 62485-2 (research D4–D8)
- [x] ±2 % fixtures; reference values gated on user sign-off (T003–T006)

### Safety-First Validation
- [x] Voltage-window, charge-rate, temperature-clamp warnings; NEC/NFPA installation checks

### Standards Compliance and Traceability
- [x] Every factor/check carries `standardReference`; PDF lists them (FR-030)

### Test-First Development
- [x] Red tests per story before Green; fixtures user-approved

### Professional Documentation
- [x] PDF extended with the new sections

### Progressive Enhancement
- [x] US1+US2 = MVP; US3–US7 independently shippable

### Other
- [x] WCAG 2.1 AA (US7); input validation for every new field

**Gate result**: PASS (no violations).

## Project Structure

### Documentation (this feature)

```text
specs/015-battery-standards/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/battery-engine.contract.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/standards/batteryTypes.ts          # + electrical/charging/ventilation/usesLeadAcidTempTable per chemistry
lib/standards/batteryReference.ts      # NEW: temp table, charger ratings, NFPA/NEC thresholds
lib/types/calculations.ts              # inputs/result/AppliedFactors extensions
lib/calculations/battery/
├── derating.ts                        # application-aware DoD, conversion eff, design margin, temp table
├── voltageWindow.ts                   # NEW: cells from window, bank voltages
├── charger.ts                         # NEW: IEEE 946 charger sizing
├── ventilation.ts                     # NEW: EN 50272-2 airflow
├── installationChecks.ts              # NEW: NEC 480/706, NFPA 855
├── runtime.ts, sizing.ts              # wire new modules
├── assess.ts, result.ts, index.ts     # warnings, result assembly, cache key fix
lib/validation/batteryValidation.ts    # new field rules
stores/useBatteryStore.ts              # defaults + persist v2 migrate
components/battery/
├── BatteryInputForm.tsx               # application, load type, margin, window, charger, room inputs
├── BatteryResults.tsx                 # voltage window, charger, ventilation, installation checks
├── BatteryReferenceDialog.tsx         # NEW (US7)
└── BatteryCalculator.tsx              # header button for dialog
lib/pdfGenerator.battery.ts            # new sections
__tests__/unit/calculations/battery/   # new + updated tests
```

**Structure Decision**: Follows the existing `lib/calculations/battery/` module split (ADR-006). The new concerns go into their own small pure modules so each story is testable on its own.

## Key Decisions

1. **Standby default with DoD = 1** (D1). Recorded in [ADR-008](../../history/adr/008-battery-sizing-method-v2.md), which amends ADR-006.
2. **Repurpose `efficiency`** instead of adding a new field (D2). This keeps the type and PDF churn small; the semantic change is handled by the persist migration.
3. **Keep V_sys nominal** for current (D4). There's no change to the existing current basis; the conservatism comes from the design margin.
4. **Lead-acid TCF with no credit above 25 °C** (D5), a conservative default.
5. **Cache key = full sorted input serialisation** (D10) so new fields can't be left out again.

## Risks

- Reference values come from secondary sources, so they're gated on sign-off (T003–T006).
- Existing users see smaller standby sizes after the upgrade (intended). A one-line notice in the results ("method updated to IEEE 485 standby practice") explains it.
- Fixture C changes by design (D11).

## Complexity Tracking

No constitution violations to justify.
