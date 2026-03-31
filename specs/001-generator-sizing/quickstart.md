# Quickstart: Generator Sizing Calculator

**Feature**: 001-generator-sizing | **Date**: 2026-03-31

## Prerequisites

- Node.js 18+ and npm/pnpm installed
- ElectroMate repo cloned and dependencies installed (`npm install`)
- On branch `001-generator-sizing`

## Development Sequence

Follow the progressive enhancement priority order:

### Phase 1: P1 — Core Sizing + Motor Starting

1. **Types**: Create `types/generator-sizing.ts` with all interfaces and enums
2. **Data tables**: Create `lib/calculations/generator-sizing/generatorData.ts` — NEMA codes, standard ratings, starting multipliers
3. **Load summation**: Create `lib/calculations/generator-sizing/loadSummation.ts` — vector power sum
4. **Motor starting**: Create `lib/calculations/generator-sizing/motorStarting.ts` — voltage dip calc
5. **Validation**: Create `lib/validation/generatorSizingValidation.ts` — Zod schemas
6. **Store**: Create `stores/useGeneratorSizingStore.ts` — Zustand with persist
7. **UI**: Create page route, main tool component, input form, load table, results display
8. **Navigation**: Add generator sizing to TopNavigation.tsx and Sidebar.tsx under "Power Systems"

### Phase 2: P2 — Step Loading + Derating

9. **Step loading**: Create `lib/calculations/generator-sizing/stepLoading.ts`
10. **Derating**: Create `lib/calculations/generator-sizing/derating.ts`
11. **Orchestrator**: Create `lib/calculations/generator-sizing/generatorCalculator.ts` composing all modules
12. **UI panels**: StepLoadingPanel.tsx, DeratingPanel.tsx

### Phase 3: P3 — Fuel + PDF

13. **Fuel consumption**: Create `lib/calculations/generator-sizing/fuelConsumption.ts`
14. **PDF generator**: Create `lib/pdfGenerator.generatorSizing.ts`
15. **UI panels**: FuelEstimationPanel.tsx

## Running the App

```bash
npm run dev
# Visit http://localhost:3000/generator-sizing
```

## Key Files to Reference

| What | File |
|------|------|
| Similar calculator pattern | `app/harmonic-analysis/HarmonicAnalysisTool.tsx` |
| Calculation module pattern | `lib/calculations/harmonic-analysis/harmonicCalculator.ts` |
| Store pattern | `stores/useHarmonicAnalysisStore.ts` |
| Zod validation pattern | `lib/validation/harmonicAnalysisValidation.ts` |
| PDF generation pattern | `lib/pdfGenerator.voltageDrop.ts` |
| Navigation structure | `components/layout/TopNavigation.tsx` |
| UI components | `components/ui/` (shadcn/ui library) |

## Testing

Test framework: Vitest (add to project if not present).

Priority test targets:
1. `loadSummation.ts` — vector sum accuracy vs hand calculation
2. `motorStarting.ts` — voltage dip for known motor/generator combinations
3. `derating.ts` — results vs ISO 8528-1 published tables
4. `fuelConsumption.ts` — consumption rates at standard loading points
5. `generatorData.ts` — NEMA code letter lookup, standard rating selection

```bash
# When test framework is added:
npx vitest run lib/calculations/generator-sizing/
```
