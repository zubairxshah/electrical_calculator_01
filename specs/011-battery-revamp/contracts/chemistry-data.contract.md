# Contract: Chemistry Data, Schema & Datasheets

**Feature**: `011-battery-revamp`

Covers the single-source-of-truth reconciliation, the validation surface, and the datasheet library/extraction boundary.

## Canonical chemistry — `lib/standards/batteryTypes.ts` (existing, extended)

```ts
export type BatteryChemistry =
  | 'VRLA-AGM' | 'VRLA-GEL' | 'Li-Ion-LFP' | 'Li-Ion-NMC'
  | 'Li-Ion-LTO' | 'NiCd' | 'NiFe' | 'Flow-Vanadium'   // single source of truth

// add to BatteryTypeSpec:
peukertExponent: number   // (new) rate-derating exponent; ~1.2 lead-acid, ~1.02 lithium
```
- **C1**: every chemistry shown in the UI and accepted by the schema MUST exist in `ALL_BATTERY_TYPES` (SC-002, zero unmapped options).

## ID map — `lib/standards/batteryChemistryMap.ts` (new)

```ts
export const legacyToCanonical: Record<string, BatteryChemistry>
export const chemistryDisplayLabel: Record<BatteryChemistry, string>
export function toCanonicalChemistry(id: string): BatteryChemistry  // identity if already canonical
```

## Zod schema — `lib/schemas/batterySchema.ts` (changed)

```ts
export const BatteryChemistrySchema = z.enum([ /* 8 canonical IDs */ ])
export const BatteryInputSchema = z.object({
  voltage, loadWatts, chemistry,
  mode: z.enum(['runtime','sizing']),
  ampHours: z.number().min(1).max(10000).optional(),          // required when runtime
  targetBackupHours: z.number().positive().max(240).optional(),// required when sizing
  efficiency, agingFactor,
  temperature: z.number().min(-40).max(65).default(25),
  dodOverride: z.number().positive().max(1).optional(),
  cellBlockVoltage: z.number().positive().optional(),
  datasheetId: z.string().nullable().optional(),
}).superRefine(/* mode-conditional required fields + dodOverride ≤ chemistry max */)
```
- **C2**: `superRefine` enforces the mode-conditional requirement (ampHours XOR targetBackupHours) and the DoD-vs-maximum clamp.
- **C3**: a `preprocess` step maps any legacy `chemistry` string through `toCanonicalChemistry` before enum validation (defense in depth alongside the store migration).

## Validation — `lib/validation/batteryValidation.ts` (changed)
- Keep the existing < 100 ms structure and security validators; add: chemistry-limit checks (DoD override, safe continuous C-rate), temperature-range warning/error from the profile, and mode-aware required-field checks. Output shape (`BatteryValidationResult`) unchanged.

## Store migration — `stores/useBatteryStore.ts` (changed)
```ts
persist(..., {
  name: 'electromate-battery',
  version: 1,                         // bumped from implicit 0
  migrate: (state, fromVersion) => { /* rewrite inputs.chemistry via map; backfill mode, temperature, new fields */ },
  partialize: (s) => ({ inputs: s.inputs, result: s.result }),
})
```
- **C4**: a persisted state holding any legacy chemistry ID MUST load without error and resolve to the mapped canonical chemistry.

## Datasheet library — `lib/datasheets/library.ts` (new)
```ts
export const DATASHEET_LIBRARY: DatasheetEntry[]
export function getDatasheet(id: string): DatasheetEntry | undefined
export function datasheetsForChemistry(c: BatteryChemistry): DatasheetEntry[]
```
- **C5**: every `DatasheetEntry.chemistry` MUST be canonical (C1).

## Datasheet extraction — `lib/datasheets/datasheetExtract.ts` (new, P3 stretch)
```ts
export interface ExtractionResult { fields: Partial<DatasheetEntry>; confidence: number; raw: string }
export async function extractFromFile(file: File): Promise<ExtractionResult>  // tesseract.js / pdfjs-dist, client-side
```
- **C6**: extraction MUST NOT auto-apply; it returns candidates for explicit user confirmation, and manual entry/library selection remain available if it fails or is low-confidence (FR-017).
- **C7**: input files are type/size-limited and parsed client-side only; no upload to a server, no execution.
