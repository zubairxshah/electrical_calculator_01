# Feature Specification: Conduit/Raceway Fill Calculator

**Feature Branch**: `009-conduit-fill`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User description: "Conduit/Raceway Fill Calculator - NEC Chapter 9"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single Conduit Fill Check (Priority: P1)

An electrical engineer needs to verify whether a set of conductors fits within a chosen conduit size per NEC Chapter 9 fill limits. They select the conduit type (EMT, RMC, IMC, PVC, FMC, LFMC), choose the conduit trade size, then add one or more conductors by specifying wire type (THHN, THWN, XHHW, etc.), size (AWG/kcmil), and quantity. The system instantly shows the total conductor area, allowable fill area for that conduit, percent fill, and a clear pass/fail indicator against NEC Table 1 limits (53% for 1 conductor, 31% for 2, 40% for 3+).

**Why this priority**: This is the core use case — the fundamental fill calculation that every other feature builds upon. Without it, the calculator has no value.

**Independent Test**: Can be fully tested by selecting a conduit, adding conductors, and verifying the fill percentage matches NEC Chapter 9 tables.

**Acceptance Scenarios**:

1. **Given** user selects EMT 3/4" and adds 3x #12 THHN, **When** calculation runs, **Then** system shows fill area, percent fill (~28%), and PASS status
2. **Given** user selects EMT 1/2" and adds 4x #10 THWN, **When** calculation runs, **Then** system shows fill exceeds 40% limit and displays FAIL status with overfill percentage
3. **Given** user adds a single conductor, **When** calculation runs, **Then** system applies the 53% single-conductor fill limit (NEC Table 1)
4. **Given** user adds exactly 2 conductors, **When** calculation runs, **Then** system applies the 31% two-conductor fill limit

---

### User Story 2 - Mixed Conductor Types (Priority: P1)

An engineer is pulling a combination of different wire sizes and insulation types through the same conduit (e.g., power conductors plus a ground). They add multiple conductor entries with different sizes and types. The system sums all individual conductor areas (using NEC Chapter 9 Table 5/5A dimensions) and checks total against the conduit internal area (Table 4) at the 40% fill limit for 3+ conductors.

**Why this priority**: Real-world conduit fills almost always involve mixed conductor sizes. This is equally critical to the basic fill check.

**Independent Test**: Add conductors of different sizes/types, verify total area calculation and fill percentage are correct.

**Acceptance Scenarios**:

1. **Given** user adds 3x #10 THHN and 1x #12 THHN (ground) to EMT 3/4", **When** calculation runs, **Then** system sums all 4 conductor areas and checks against 40% fill limit
2. **Given** user mixes THHN and XHHW conductors, **When** calculation runs, **Then** system uses correct cross-sectional area for each insulation type from the appropriate NEC table

---

### User Story 3 - Conduit Size Recommendation (Priority: P2)

After entering their conductor list, the engineer wants the system to recommend the minimum conduit size that satisfies NEC fill requirements. Instead of trial-and-error, they click a "Find Minimum Size" option and the system iterates through available trade sizes for the selected conduit type and returns the smallest one that passes.

**Why this priority**: Saves significant time compared to manual lookup. High user value but depends on the core fill calculation being in place.

**Independent Test**: Enter a conductor list, request minimum size, verify the recommended conduit is the smallest that passes NEC fill limits.

**Acceptance Scenarios**:

1. **Given** user enters 4x #8 THHN and selects EMT, **When** they request minimum size, **Then** system recommends the smallest EMT trade size with fill ≤ 40%
2. **Given** user enters a conductor combination that exceeds the largest available conduit, **When** they request minimum size, **Then** system indicates no single conduit is sufficient and suggests parallel runs

---

### User Story 4 - Nipple Fill (60% Rule) (Priority: P2)

An engineer is sizing a short conduit nipple (≤ 24 inches / 600mm) between two enclosures. NEC 376.22 allows 60% fill for nipples. They toggle "Conduit Nipple" mode and the system applies the 60% fill limit instead of the standard limits.

**Why this priority**: Common field scenario with a different fill limit. Important for accurate real-world calculations.

**Independent Test**: Toggle nipple mode, verify 60% fill limit is applied instead of standard limits.

**Acceptance Scenarios**:

1. **Given** user enables nipple mode with 3+ conductors, **When** calculation runs, **Then** system applies 60% fill limit instead of 40%
2. **Given** user switches from nipple mode back to standard, **When** calculation runs, **Then** system reverts to standard NEC Table 1 limits

---

### User Story 5 - PDF Report Export (Priority: P3)

The engineer needs to document their conduit fill calculation for permit submissions or project records. They export a PDF showing all inputs (conduit type/size, conductor list), NEC table references, calculated areas, fill percentage, and pass/fail result.

**Why this priority**: Documentation is essential for professional use but depends on all calculations being correct first.

**Independent Test**: Complete a fill calculation, export PDF, verify all inputs, calculations, and NEC references are present and accurate.

**Acceptance Scenarios**:

1. **Given** user has completed a fill calculation, **When** they click export, **Then** system generates a PDF with conduit details, conductor list, area calculations, fill percentage, pass/fail status, and NEC table references
2. **Given** the calculation fails NEC limits, **When** PDF is exported, **Then** the report clearly indicates the violation and shows the required conduit size

---

### User Story 6 - Compact Conductor Support (Priority: P3)

Some installations use compact conductors (NEC Chapter 9 Table 5A) which have smaller cross-sectional areas than standard conductors. The engineer selects "Compact" for applicable conductor entries, and the system uses Table 5A dimensions instead of Table 5.

**Why this priority**: Supports a specific but important subset of installations. Lower priority because standard conductors cover most use cases.

**Independent Test**: Select compact conductor option, verify areas come from NEC Table 5A values.

**Acceptance Scenarios**:

1. **Given** user selects a compact THHN conductor, **When** calculation runs, **Then** system uses the smaller cross-sectional area from Table 5A
2. **Given** user mixes compact and standard conductors, **When** calculation runs, **Then** system uses the correct table for each conductor entry

---

### Edge Cases

- What happens when the conductor list is empty? System should disable calculation and prompt user to add at least one conductor.
- What happens when the user selects a conduit type that doesn't come in the chosen trade size? System should only show valid trade sizes for the selected conduit type.
- How does the system handle bare conductors (grounding)? Use NEC Chapter 9 Table 8 dimensions for bare conductors.
- What happens when all conductors are the same size and type? System may reference NEC Annex C (pre-calculated fill tables) for validation but still performs the Chapter 9 calculation.
- How does the system handle equipment grounding conductors (EGC) sized per NEC 250.122? EGCs are counted as conductors in the fill calculation using their actual cross-sectional area.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate conduit fill percentage using NEC Chapter 9 Table 1 fill limits: 53% for 1 conductor, 31% for 2 conductors, 40% for 3 or more conductors
- **FR-002**: System MUST support conduit types: EMT, RMC, IMC, PVC Schedule 40, PVC Schedule 80, FMC, and LFMC with internal areas per NEC Chapter 9 Table 4
- **FR-003**: System MUST support trade sizes from 3/8" (metric 12) through 6" (metric 155) as applicable per conduit type
- **FR-004**: System MUST look up conductor cross-sectional areas from NEC Chapter 9 Table 5 (standard) and Table 5A (compact) based on wire size and insulation type
- **FR-005**: System MUST support wire sizes from #18 AWG through 2000 kcmil
- **FR-006**: System MUST support common insulation types including THHN/THWN-2, THWN, THW, XHHW, XHHW-2, RHH/RHW, RHW-2, and USE-2
- **FR-007**: System MUST calculate total conductor area as the sum of individual conductor cross-sectional areas multiplied by their quantities
- **FR-008**: System MUST display a clear pass/fail indicator based on whether fill percentage exceeds the applicable NEC limit
- **FR-009**: System MUST recommend the minimum conduit trade size that satisfies NEC fill limits for a given conductor list
- **FR-010**: System MUST support conduit nipple mode with a 60% fill limit per NEC 376.22
- **FR-011**: System MUST support bare conductor dimensions from NEC Chapter 9 Table 8 for grounding conductors
- **FR-012**: System MUST allow users to add, edit, and remove conductor entries from the fill calculation
- **FR-013**: System MUST display the NEC table references used in the calculation (Table 1, Table 4, Table 5/5A)
- **FR-014**: System MUST export calculation results as a PDF report including all inputs, calculations, NEC references, and pass/fail status
- **FR-015**: System MUST support both imperial (in²) and metric (mm²) area units with user toggle
- **FR-016**: System MUST show a visual fill indicator (e.g., progress bar) representing how full the conduit is

### Key Entities

- **Conduit**: Type (EMT, RMC, etc.), trade size, internal area (from NEC Table 4), material
- **Conductor**: Wire size (AWG/kcmil), insulation type, cross-sectional area (from NEC Table 5/5A/8), quantity, compact flag
- **Fill Calculation**: List of conductors, total conductor area, conduit internal area, fill percentage, applicable fill limit, pass/fail result, nipple mode flag
- **NEC Reference Data**: Table 1 (fill limits), Table 4 (conduit areas), Table 5 (conductor areas), Table 5A (compact conductor areas), Table 8 (bare conductor areas)

## Assumptions

- All conduit and conductor dimensions are based on NEC 2020 Chapter 9 tables. Values are consistent across recent NEC editions (2017, 2020, 2023) for the supported sizes.
- The calculator addresses only conduit fill compliance. It does not calculate derating factors, voltage drop, or ampacity — those are handled by other ElectroMate calculators.
- "Conduit nipple" is defined as ≤ 24 inches (600mm) per NEC, and enabling nipple mode is a user choice (the calculator does not determine conduit length).
- Cable assemblies (MC, AC, NM) are out of scope for this calculator — it handles individual conductors only.
- Wireway and cable tray fill calculations are out of scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can determine conduit fill compliance for a typical 4-conductor pull in under 30 seconds
- **SC-002**: All fill calculations match NEC Chapter 9 table values with 100% accuracy for standard conductor/conduit combinations
- **SC-003**: Minimum conduit size recommendation matches manual NEC table lookup for all supported conduit types
- **SC-004**: 95% of users successfully complete a fill calculation on first attempt without needing help documentation
- **SC-005**: PDF export contains all information required for permit submission (inputs, NEC references, calculations, result)
- **SC-006**: Calculator supports at least 20 conductor entries in a single calculation without performance degradation
