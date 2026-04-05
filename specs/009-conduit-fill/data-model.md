# Data Model: Conduit/Raceway Fill Calculator

**Feature**: 009-conduit-fill | **Date**: 2026-04-05

## Entities

### ConduitType

Represents a type of conduit/raceway.

| Field | Type | Description |
|-------|------|-------------|
| id | string (enum) | `'EMT' \| 'RMC' \| 'IMC' \| 'PVC40' \| 'PVC80' \| 'FMC' \| 'LFMC'` |
| label | string | Display name (e.g., "EMT - Electrical Metallic Tubing") |
| tradeSizes | TradeSize[] | Available trade sizes for this conduit type |

### TradeSize

Represents a conduit trade size with its internal area.

| Field | Type | Description |
|-------|------|-------------|
| imperial | string | Trade size designation (e.g., "3/4", "1-1/2") |
| metric | number | Metric designator (e.g., 21, 41) |
| internalAreaSqIn | number | Internal area in square inches (NEC Table 4) |

### InsulationType

Represents a wire insulation type.

| Field | Type | Description |
|-------|------|-------------|
| id | string (enum) | `'THHN' \| 'THWN' \| 'THW' \| 'XHHW' \| 'XHHW2' \| 'RHH_RHW' \| 'RHW2' \| 'USE2' \| 'BARE'` |
| label | string | Display name (e.g., "THHN/THWN-2") |
| necTable | string | Source table ("Table 5", "Table 5A", "Table 8") |

### WireSize

Represents a conductor size.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Size designation (e.g., "12", "10", "4/0", "250", "500") |
| label | string | Display label (e.g., "#12 AWG", "4/0 AWG", "250 kcmil") |
| isKcmil | boolean | True for sizes ≥250 (kcmil), false for AWG |
| sortOrder | number | Numeric sort value for ordering (ascending by physical size) |

### ConductorEntry

A single line item in the conductor list (user input).

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique entry ID (UUID or auto-increment) |
| wireSize | string | Selected wire size ID |
| insulationType | string | Selected insulation type ID |
| quantity | number | Number of conductors (≥1) |
| isCompact | boolean | Use Table 5A compact dimensions (default: false) |
| areaSqIn | number | Looked-up cross-sectional area per conductor (in²) |

### ConduitFillInput

Complete set of user inputs for a fill calculation.

| Field | Type | Description |
|-------|------|-------------|
| conduitType | string | Selected conduit type ID |
| tradeSize | string | Selected trade size (imperial designation) |
| conductors | ConductorEntry[] | List of conductor entries |
| isNipple | boolean | Nipple mode (60% fill limit) |
| unitSystem | 'imperial' \| 'metric' | Display unit preference |
| projectName | string | Optional project identifier |
| projectRef | string | Optional reference number |

### ConduitFillResult

Calculated output from a fill calculation.

| Field | Type | Description |
|-------|------|-------------|
| conduitInternalArea | number | Conduit internal area (in²) |
| totalConductorArea | number | Sum of all conductor areas (in²) |
| fillPercentage | number | (totalConductorArea / conduitInternalArea) × 100 |
| fillLimit | number | Applicable NEC limit (53, 31, 40, or 60) |
| totalConductorCount | number | Sum of all conductor quantities |
| pass | boolean | fillPercentage ≤ fillLimit |
| remainingArea | number | Available area before hitting limit (in²) |
| utilizationRatio | number | fillPercentage / fillLimit (for visual indicator) |
| conductorDetails | ConductorDetail[] | Per-entry breakdown |
| necReferences | string[] | Applicable NEC table references |
| minimumConduitSize | TradeSize \| null | Smallest passing size (if requested) |
| noConduitFits | boolean | True if no single conduit satisfies fill |

### ConductorDetail

Per-conductor-entry breakdown in results.

| Field | Type | Description |
|-------|------|-------------|
| entryId | string | References ConductorEntry.id |
| wireSize | string | Wire size label |
| insulationType | string | Insulation type label |
| quantity | number | Count |
| areaPerConductor | number | Individual conductor area (in²) |
| totalArea | number | areaPerConductor × quantity (in²) |
| percentOfFill | number | This entry's contribution to total fill % |
| necTableRef | string | Table 5, 5A, or 8 |

### ConduitFillHistoryEntry

Saved calculation for history sidebar.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique history entry ID |
| timestamp | string | ISO date string |
| input | ConduitFillInput | Saved inputs |
| result | ConduitFillResult | Saved results |
| label | string | Auto-generated label (e.g., "EMT 3/4\" - 4 conductors") |

## Relationships

```
ConduitType (1) ──has──> (many) TradeSize
ConductorEntry (many) ──references──> (1) WireSize
ConductorEntry (many) ──references──> (1) InsulationType
ConduitFillInput (1) ──contains──> (many) ConductorEntry
ConduitFillResult (1) ──contains──> (many) ConductorDetail
ConduitFillHistoryEntry (1) ──contains──> (1) ConduitFillInput + (1) ConduitFillResult
```

## State Transitions

The calculator has a simple linear flow:

```
Empty → Conduit Selected → Conductors Added → Calculated → (Export PDF)
                                    ↕
                              Edit Conductors
```

- **Empty**: No conduit type selected, no conductors
- **Conduit Selected**: Type and trade size chosen, conductor list empty
- **Conductors Added**: At least one conductor entry exists
- **Calculated**: Fill result computed and displayed
- **Edit**: Any input change triggers recalculation

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| conduitType | Must be valid enum value | "Select a conduit type" |
| tradeSize | Must exist for selected conduit type | "Select a valid trade size" |
| conductors | At least 1 entry required | "Add at least one conductor" |
| conductor.quantity | Integer ≥ 1 | "Quantity must be at least 1" |
| conductor.wireSize | Must be valid size ID | "Select a wire size" |
| conductor.insulationType | Must be valid type ID | "Select an insulation type" |
| conductor.isCompact | Only valid for sizes where Table 5A has data | "Compact not available for this size" |
| isNipple | Boolean | N/A |

## NEC Reference Data Structure

### Table 1 (Fill Limits)
```
{ 1: 53, 2: 31, '3+': 40, nipple: 60 }
```

### Table 4 (Conduit Internal Areas)
```
{ [conduitType]: { [tradeSize]: { areaSqIn: number } } }
```

### Table 5 (Conductor Areas — Standard)
```
{ [insulationType]: { [wireSize]: { areaSqIn: number } } }
```

### Table 5A (Conductor Areas — Compact)
```
{ [insulationType]: { [wireSize]: { areaSqIn: number } } }
```

### Table 8 (Bare Conductor Areas)
```
{ [wireSize]: { areaSqIn: number } }
```
