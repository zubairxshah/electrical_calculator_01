# Research: Conduit/Raceway Fill Calculator

**Feature**: 009-conduit-fill | **Date**: 2026-04-05

## Decision 1: NEC Table Data Source and Scope

**Decision**: Use NEC 2020 Chapter 9 tables as the authoritative data source. Cover Tables 1, 4, 5, 5A, and 8.

**Rationale**: NEC Chapter 9 is the definitive standard for conduit fill in North America. Table values are consistent across NEC 2017, 2020, and 2023 editions for the conduit types and wire sizes we support. Storing data as TypeScript constants matches the existing ElectroMate pattern (e.g., `voltageDropData.ts`, `harmonicData.ts`).

**Alternatives considered**:
- External API lookup: Rejected — adds latency, requires internet, no benefit for static reference data
- JSON data files: Rejected — TypeScript constants provide type safety and are tree-shakeable
- Database storage: Rejected — data is read-only reference, no CRUD needed

## Decision 2: Conduit Types Supported

**Decision**: Support 7 conduit types: EMT, RMC, IMC, PVC Schedule 40, PVC Schedule 80, FMC, LFMC.

**Rationale**: These cover >95% of commercial and residential electrical installations. EMT and PVC are the most common. RMC and IMC are used in hazardous locations. FMC and LFMC handle flexible connections.

**Alternatives considered**:
- EMT/PVC only: Rejected — too limited for professional use
- Add HDPE/aluminum: Deferred — uncommon, can be added later without architectural changes

## Decision 3: Trade Sizes

**Decision**: Support trade sizes from 3/8" (metric 12) through 6" (metric 155), varying by conduit type per NEC Table 4.

**Rationale**: NEC Table 4 defines specific trade sizes per conduit type. Not all types come in all sizes (e.g., EMT starts at 1/2", FMC starts at 3/8"). The UI will filter available sizes based on selected conduit type.

**Trade size mapping** (NEC designation → metric):
- 3/8" → 12
- 1/2" → 16
- 3/4" → 21
- 1" → 27
- 1-1/4" → 35
- 1-1/2" → 41
- 2" → 53
- 2-1/2" → 63
- 3" → 78
- 3-1/2" → 91
- 4" → 103
- 5" → 129
- 6" → 155

## Decision 4: Wire Size Range

**Decision**: Support #18 AWG through 2000 kcmil.

**Rationale**: Covers the full range in NEC Chapter 9 Table 5. #18 is used for control wiring, 2000 kcmil for large feeder conductors. Most common range is #14–500 kcmil.

## Decision 5: Insulation Types

**Decision**: Support 8 insulation types: THHN/THWN-2, THWN, THW, XHHW, XHHW-2, RHH/RHW, RHW-2, USE-2.

**Rationale**: These are the most commonly specified insulation types in NEC jurisdictions. THHN/THWN-2 accounts for ~70% of building wire installations. Each type has different cross-sectional areas per NEC Table 5 due to different insulation thicknesses.

**Alternatives considered**:
- All NEC Table 5 types (TF, TFF, THHW, etc.): Deferred — uncommon types can be added without architecture changes
- Single "generic" type: Rejected — different insulation types have materially different areas

## Decision 6: Calculation Precision

**Decision**: Use mathjs BigNumber for area summation to avoid floating-point errors.

**Rationale**: NEC table values are given to 4 decimal places (in²). Summing many small areas (e.g., 20× #18 AWG at 0.0040 in²) can accumulate floating-point errors with native JavaScript arithmetic. mathjs BigNumber is already a project dependency.

**Alternatives considered**:
- Native JS Number: Rejected — floating-point accumulation errors possible with many conductors
- Integer arithmetic (multiply by 10000): Considered viable but mathjs already available and cleaner

## Decision 7: Unit System Implementation

**Decision**: Store all areas in in² (NEC native units). Convert to mm² for display when metric mode selected.

**Rationale**: NEC Chapter 9 tables are published in in². Storing in native units avoids conversion errors in core calculations. The conversion factor (1 in² = 645.16 mm²) is applied only at the display layer.

## Decision 8: Fill Limit Rules

**Decision**: Implement NEC Table 1 fill limits as a pure function of conductor count:

| Conductor Count | Fill Limit | Source |
|----------------|------------|--------|
| 1 | 53% | NEC Table 1 |
| 2 | 31% | NEC Table 1 |
| 3+ | 40% | NEC Table 1 |
| Any (nipple ≤24") | 60% | NEC 376.22 |

**Rationale**: These are the standard NEC fill percentages. The nipple exception (60%) applies regardless of conductor count when the conduit run is ≤24 inches between enclosures.

## Decision 9: Bare Conductor Handling

**Decision**: Support bare conductors (grounding) using NEC Chapter 9 Table 8 dimensions. User selects "Bare" as the insulation type.

**Rationale**: Equipment grounding conductors are often bare copper and must be included in fill calculations. Table 8 provides the cross-sectional area for bare conductors by size.

## Decision 10: Minimum Size Recommendation

**Decision**: Iterate through trade sizes in ascending order for the selected conduit type. Return the first size where fill ≤ limit. If no size works, suggest parallel conduit runs.

**Rationale**: Simple, correct, and fast (max 13 iterations for the largest conduit type). No optimization needed for such a small search space.
