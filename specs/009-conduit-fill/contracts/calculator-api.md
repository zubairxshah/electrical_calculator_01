# Calculator API Contract: Conduit Fill

**Feature**: 009-conduit-fill | **Date**: 2026-04-05

This calculator is entirely client-side. No REST/GraphQL API is needed. The "API" here refers to the internal TypeScript function contracts between modules.

## Core Calculation Function

### `calculateConduitFill(input: ConduitFillInput): ConduitFillResult`

**Location**: `lib/calculations/conduit-fill/conduitFillCalculator.ts`

**Input**: `ConduitFillInput` — conduit type, trade size, conductor list, nipple flag, unit system
**Output**: `ConduitFillResult` — fill percentage, pass/fail, conductor breakdown, NEC references
**Errors**: Throws `Error` if conduit type/size combination is invalid or conductor list is empty

**Behavior**:
1. Look up conduit internal area from Table 4
2. For each conductor entry, look up area from Table 5/5A/8
3. Sum total conductor area (area × quantity for each entry)
4. Determine fill limit from Table 1 based on total conductor count and nipple flag
5. Calculate fill percentage
6. Determine pass/fail
7. Return full result with per-conductor breakdown

### `findMinimumConduitSize(conduitType: string, conductors: ConductorEntry[], isNipple: boolean): TradeSize | null`

**Location**: `lib/calculations/conduit-fill/conduitFillCalculator.ts`

**Input**: Conduit type, conductor list, nipple flag
**Output**: Smallest passing `TradeSize` or `null` if none fits
**Behavior**: Iterates ascending trade sizes, returns first where fill ≤ limit

## Data Lookup Functions

### `getConduitArea(conduitType: string, tradeSize: string): number`

**Location**: `lib/calculations/conduit-fill/conduitFillData.ts`

**Returns**: Internal area in in² from NEC Table 4
**Throws**: `Error` if combination not found

### `getConductorArea(wireSize: string, insulationType: string, isCompact: boolean): number`

**Location**: `lib/calculations/conduit-fill/conduitFillData.ts`

**Returns**: Cross-sectional area in in² from NEC Table 5, 5A, or 8
**Throws**: `Error` if combination not found

### `getAvailableTradeSizes(conduitType: string): TradeSize[]`

**Location**: `lib/calculations/conduit-fill/conduitFillData.ts`

**Returns**: Array of valid trade sizes for the given conduit type, sorted ascending

### `getFillLimit(conductorCount: number, isNipple: boolean): number`

**Location**: `lib/calculations/conduit-fill/conduitFillData.ts`

**Returns**: Fill limit percentage (53, 31, 40, or 60)

## Validation Function

### `validateConduitFillInput(input: unknown): SafeParseReturnType`

**Location**: `lib/validation/conduitFillValidation.ts`

**Returns**: Zod SafeParseReturnType with validated input or error details

## Store Contract

### `useConduitFillStore`

**Location**: `stores/useConduitFillStore.ts`

**State**: `ConduitFillInput & { results: ConduitFillResult | null, history: ConduitFillHistoryEntry[] }`

**Actions**:
- `setConduitType(type: string)` — updates type, resets trade size if invalid
- `setTradeSize(size: string)` — updates trade size
- `addConductor(entry: Omit<ConductorEntry, 'id' | 'areaSqIn'>)` — adds conductor with auto ID and looked-up area
- `updateConductor(id: string, updates: Partial<ConductorEntry>)` — edits existing entry
- `removeConductor(id: string)` — removes entry by ID
- `setNipple(isNipple: boolean)` — toggles nipple mode
- `setUnitSystem(system: 'imperial' | 'metric')` — toggles display units
- `setResults(results: ConduitFillResult | null)` — stores calculation results
- `addToHistory(entry: ConduitFillHistoryEntry)` — adds to history (max 50)
- `loadFromHistory(id: string)` — restores inputs from history entry
- `clearHistory()` — clears all history
- `reset()` — resets to initial state

## PDF Export Function

### `downloadConduitFillPDF(data: ConduitFillPDFInput): Promise<void>`

**Location**: `lib/pdfGenerator.conduitFill.ts`

**Input**: `{ input: ConduitFillInput, result: ConduitFillResult, projectName?: string, projectRef?: string }`
**Output**: Triggers PDF download in browser
**Content**: Header, project info, conduit details, conductor table, area calculations, fill result, NEC references, disclaimer
