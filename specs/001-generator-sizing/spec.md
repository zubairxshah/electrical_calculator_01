# Feature Specification: Generator Sizing Calculator

**Feature Branch**: `001-generator-sizing`
**Created**: 2026-03-30
**Status**: Draft
**Input**: User description: "Generator Sizing Calculator — standby/prime rated generators, motor starting analysis (voltage dip, locked rotor), step loading sequences, altitude/temperature derating, fuel consumption estimation. Standards: ISO 8528, IEEE 3006.4, NFPA 110, NEC 700/701/702. Features: multiple load entry with diversity factors, motor starting kVA impact, step loading optimization, generator selection from standard ratings, PDF export."

## Clarifications

### Session 2026-03-30

- Q: Should the calculator support 50Hz, 60Hz, or both frequency systems? → A: Both 50Hz and 60Hz with user selection (dual-standard), aligning with NEMA/NEC and IEC standards
- Q: How should metric and imperial units be handled? → A: Dual input per field — accept either unit system (HP or kW, L or gal, m or ft, °C or °F) with automatic conversion
- Q: How should NEC 700/701/702 emergency classifications be handled? → A: Classification dropdown pre-fills constraints (startup time, minimum fuel duration), but user can override individual values
- Q: What should default diversity factors be per load category? → A: All defaults at 1.0 (no diversity applied) — user sets each manually for conservative baseline

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Generator Load Sizing (Priority: P1)

An electrical engineer needs to size a standby generator for a facility. They have a list of loads (motors, lighting, HVAC, general power) and need to determine the minimum generator capacity that can supply all connected loads with appropriate diversity and safety margins.

**Why this priority**: Load summation with diversity factors is the foundational calculation. Every generator sizing exercise starts here. Without accurate total demand, no other analysis (step loading, motor starting) is meaningful.

**Independent Test**: Can be fully tested by entering a mixed load list (e.g., 3 motors at 15kW, lighting at 20kW, HVAC at 30kW) with diversity factors, selecting standby or prime rating, and receiving a recommended generator size from standard ratings. Delivers immediate value as a standalone sizing tool.

**Acceptance Scenarios**:

1. **Given** a user has a list of facility loads, **When** they enter each load with type (motor, resistive, lighting, mixed), kW/kVA rating, power factor, and quantity, **Then** the system calculates total running kW, total running kVA, and applies user-adjustable diversity factors per load category
2. **Given** the total demand is calculated, **When** the user selects generator duty (standby or prime), **Then** the system applies the appropriate loading limit (100% for standby per NFPA 110, 70-80% for prime continuous per ISO 8528) and recommends the next standard generator size above the requirement
3. **Given** a user enters loads with different power factors, **When** the calculation runs, **Then** the system correctly computes combined kW, kVAR, and kVA using vector summation (not simple arithmetic addition of kVA values)
4. **Given** invalid or incomplete data (zero load, negative values, power factor >1), **When** the user attempts calculation, **Then** the system displays clear validation messages indicating the issue

---

### User Story 2 - Motor Starting Analysis (Priority: P1)

An engineer needs to verify that the generator can handle the inrush current when large motors start. Motor starting creates a transient demand many times the running load, which can cause voltage dip and potentially stall the generator.

**Why this priority**: Motor starting is the most common cause of generator undersizing failures. A generator that handles running load but cannot tolerate motor starting kVA will experience voltage collapse. This is critical safety analysis required by IEEE 3006.4.

**Independent Test**: Can be fully tested by entering a motor (e.g., 50HP, code letter G, DOL start) on top of a running base load, and verifying the system calculates starting kVA, voltage dip percentage, and flags whether it exceeds the 15% threshold. Delivers value by preventing undersized generator selection.

**Acceptance Scenarios**:

1. **Given** a user has identified the largest motor to start, **When** they enter motor HP/kW, locked rotor kVA/HP (or NEMA code letter), and starting method (DOL, star-delta, soft starter, VFD), **Then** the system calculates the starting kVA demand using the appropriate multiplier for the starting method
2. **Given** the starting kVA and generator size are known, **When** the system calculates voltage dip, **Then** it uses the formula: voltage dip % = (starting kVA / generator kVA) × 100, adjusted for generator subtransient reactance (Xd''), and flags results exceeding 15% (NFPA 110) or 20% (general industrial) thresholds
3. **Given** multiple motors in the load list, **When** the user designates which motor starts last (worst case), **Then** the system evaluates starting kVA against the generator capacity remaining after all other running loads
4. **Given** a motor with reduced-voltage starting, **When** the user selects star-delta (×0.33), soft starter (×0.50), or VFD (×0.02-0.50 configurable), **Then** the starting kVA is reduced by the appropriate multiplier and the voltage dip recalculated

---

### User Story 3 - Step Loading Sequence (Priority: P2)

An engineer needs to optimize the order in which loads are energized after generator startup to prevent overloading and excessive voltage/frequency dip during the load acceptance sequence.

**Why this priority**: Step loading determines whether the generator can recover between load additions. Poor sequencing causes nuisance tripping or generator stalling. This is a key design requirement per NFPA 110 and IEEE 3006.4 for emergency systems.

**Independent Test**: Can be fully tested by assigning loads to numbered steps, and verifying that cumulative demand at each step stays within generator capacity with adequate recovery margin. Delivers value by producing a documented load acceptance sequence for commissioning.

**Acceptance Scenarios**:

1. **Given** a user has multiple loads, **When** they assign each load to a step number (1, 2, 3...), **Then** the system displays cumulative running kW and kVA at each step, including motor starting impact for any motors starting in that step
2. **Given** a step loading sequence, **When** any step exceeds 50% of generator rated kVA as incremental loading (ISO 8528 recommendation), **Then** the system warns the user and suggests splitting the step
3. **Given** a completed sequence, **When** the user views results, **Then** the system shows a step-by-step summary table with: step number, loads added, incremental kW/kVA, cumulative kW/kVA, % generator loading, and pass/fail status
4. **Given** the user has not assigned steps, **When** they request auto-sequence, **Then** the system suggests an optimized sequence: largest motors first (for voltage dip), then large resistive loads, then smaller loads, following IEEE 3006.4 guidance

---

### User Story 4 - Altitude and Temperature Derating (Priority: P2)

An engineer designing for a site at high altitude or in extreme temperatures needs to derate the generator output to account for reduced air density affecting engine combustion and alternator cooling.

**Why this priority**: Generators are rated at standard conditions (25°C, sea level per ISO 8528-1). Real installations often deviate significantly, and failing to derate can lead to overloaded engines. This is a mandatory design consideration for any non-standard site.

**Independent Test**: Can be fully tested by entering site altitude (e.g., 1500m) and ambient temperature (e.g., 45°C), and verifying the derated generator output matches ISO 8528-1 derating curves.

**Acceptance Scenarios**:

1. **Given** a user enters site altitude above 1000m, **When** the system calculates derating, **Then** it applies approximately 3-4% derating per 300m above 1000m for the engine (per ISO 8528-1) and displays both rated and derated output
2. **Given** a user enters ambient temperature above 25°C (ISO reference), **When** the system calculates derating, **Then** it applies approximately 2% derating per 5°C above reference temperature and displays both rated and derated output
3. **Given** both altitude and temperature derating apply, **When** the system calculates combined derating, **Then** the derating factors are applied cumulatively (multiplied, not added) to the generator rated output
4. **Given** site conditions are at or below standard (≤1000m, ≤25°C), **When** the user runs calculations, **Then** no derating is applied and the system indicates standard conditions

---

### User Story 5 - Fuel Consumption Estimation (Priority: P3)

An engineer or facility manager needs to estimate fuel consumption and tank sizing for a specified runtime, to plan fuel storage and delivery logistics.

**Why this priority**: While not a core electrical sizing function, fuel planning is always required alongside generator sizing for project completeness. It provides additional project value but depends on the generator size being determined first.

**Independent Test**: Can be fully tested by selecting a generator size and load percentage, and receiving estimated fuel consumption (liters/hour or gallons/hour) and required tank size for a specified runtime. Delivers value for procurement and site planning.

**Acceptance Scenarios**:

1. **Given** a selected generator size and expected average loading percentage, **When** the system calculates fuel consumption, **Then** it provides estimated consumption rate in liters/hour (and gallons/hour) using standard diesel consumption curves (approximately 0.21 L/kW/hr at 75% load for diesel)
2. **Given** a required runtime (e.g., 24 hours, 48 hours, 72 hours per NFPA 110 requirements) or NEC classification-driven minimum (2hr for NEC 700/701), **When** the system calculates tank size, **Then** it provides minimum fuel volume with a 10% reserve margin and day tank requirements if applicable
3. **Given** the user selects fuel type (diesel or natural gas), **When** the calculation runs, **Then** the system uses appropriate consumption rates for each fuel type

---

### User Story 6 - PDF Report Export (Priority: P3)

An engineer needs to generate a professional PDF report documenting the generator sizing analysis for inclusion in project design documents and client deliverables.

**Why this priority**: PDF export is essential for professional deliverables but depends on all calculations being complete. It is a presentation layer over the core calculation functionality.

**Independent Test**: Can be fully tested by completing a full sizing calculation and exporting a PDF, then verifying all sections (load summary, motor starting, step loading, derating, fuel) appear with correct values and standard references.

**Acceptance Scenarios**:

1. **Given** a completed generator sizing calculation, **When** the user clicks "Export PDF", **Then** the system generates a professional report with: project details, load schedule table, motor starting analysis, step loading sequence, derating calculations, fuel estimation, and recommended generator size
2. **Given** the PDF is generated, **When** the user reviews it, **Then** it includes applicable standard references (ISO 8528, IEEE 3006.4, NFPA 110, NEC 700/701/702) and all formulas used
3. **Given** optional sections are not completed (e.g., no step loading defined), **When** the PDF is generated, **Then** those sections are omitted rather than showing empty tables

---

### Edge Cases

- What happens when total load exceeds any available standard generator size? System displays warning and suggests paralleling generators or load shedding
- What happens when motor starting kVA causes >30% voltage dip even with the largest generator? System recommends reduced-voltage starting methods and shows the impact of each method
- What happens when altitude and temperature derating reduces generator output below the load requirement? System flags that the next larger generator size is needed and recalculates
- What happens when all loads are assigned to step 1? System warns that single-step loading may exceed generator transient capability and recommends distributing loads
- What happens when a user enters 0% loading for fuel calculation? System prevents calculation and indicates minimum loading requirement (typically 30% to prevent wet stacking)
- How does the system handle single-phase vs three-phase generators? System supports both, defaulting to three-phase and adjusting calculations (kVA = V × I × √3 for three-phase, kVA = V × I for single-phase)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to add, edit, and remove multiple loads with fields: name, type (motor/resistive/lighting/mixed/HVAC), rated kW or kVA, power factor, quantity, and diversity factor (default 1.0 for all types — user adjusts manually)
- **FR-002**: System MUST calculate total running demand using vector summation of kW and kVAR components, not arithmetic kVA addition
- **FR-003**: System MUST support both standby and prime/continuous generator ratings, applying 100% loading limit for standby and user-configurable 70-80% for prime per ISO 8528
- **FR-004**: System MUST calculate motor starting kVA using locked rotor kVA/HP values from NEMA code letters (A through V) or direct user input
- **FR-005**: System MUST support starting method multipliers: DOL (×1.0), star-delta (×0.33), autotransformer 65% (×0.42), autotransformer 80% (×0.64), soft starter (×0.50 configurable), VFD (×0.02-0.50 configurable)
- **FR-006**: System MUST calculate voltage dip percentage considering generator subtransient reactance and flag results exceeding configurable thresholds (default 15% per NFPA 110)
- **FR-007**: System MUST support step loading assignment where users can assign loads to numbered steps, and calculate cumulative demand at each step
- **FR-008**: System MUST provide auto-sequencing that suggests an optimized step loading order following IEEE 3006.4 guidance
- **FR-009**: System MUST apply altitude derating per ISO 8528-1 for sites above 1000m (approximately 3-4% per 300m)
- **FR-010**: System MUST apply temperature derating per ISO 8528-1 for ambient temperatures above 25°C (approximately 2% per 5°C)
- **FR-011**: System MUST calculate combined altitude and temperature derating cumulatively (multiplicative, not additive)
- **FR-012**: System MUST estimate fuel consumption for diesel and natural gas fuel types based on generator size and loading percentage
- **FR-013**: System MUST calculate minimum fuel tank size for user-specified runtime with 10% reserve margin
- **FR-014**: System MUST recommend the next standard generator size from a built-in ratings table (common kVA ratings: 15, 20, 25, 30, 50, 60, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 750, 800, 1000, 1250, 1500, 1750, 2000, 2500, 3000 kVA)
- **FR-015**: System MUST generate a professional PDF report including all calculation sections, formulas, standard references, and load schedule
- **FR-016**: System MUST support both single-phase and three-phase generator configurations
- **FR-019**: System MUST support both 50Hz and 60Hz frequency systems with user selection, loading appropriate motor data tables (NEMA code letters for 60Hz, IEC locked rotor ratios for 50Hz) and standard generator ratings for each frequency
- **FR-020**: System MUST accept dual unit input per field — users can enter values in either metric or imperial units (HP or kW, liters or gallons, meters or feet, °C or °F) with automatic conversion and display of both
- **FR-021**: System MUST provide NEC emergency classification selection (700 Emergency, 701 Legally Required Standby, 702 Optional Standby) that pre-fills associated constraints: NEC 700 → 10s startup, 2hr minimum fuel; NEC 701 → 60s startup, 2hr minimum fuel; NEC 702 → no startup time constraint, user-defined fuel duration. User can override any pre-filled value.
- **FR-017**: System MUST validate all inputs (positive values, power factor 0-1, altitude ≥0, temperature within -40°C to 60°C range)
- **FR-018**: System MUST display applicable standards and compliance notes (ISO 8528, IEEE 3006.4, NFPA 110, NEC 700/701/702) in results

### Key Entities

- **Load Item**: Name, type (motor/resistive/lighting/mixed/HVAC), rated power (kW or kVA), power factor, quantity, diversity factor, step assignment, motor-specific fields (HP, code letter, starting method)
- **Generator**: Rated kVA, duty type (standby/prime), voltage, phases, frequency (50Hz or 60Hz — determines motor data tables and standard ratings), subtransient reactance (Xd''), fuel type
- **Site Conditions**: Altitude (meters), ambient temperature (°C), combined derating factor
- **Step Loading Sequence**: Ordered list of steps, each containing load items, with cumulative demand and status
- **Sizing Result**: Required kVA (before/after derating), recommended standard generator size, voltage dip analysis, fuel consumption estimate

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a full generator sizing (load entry through recommendation) in under 5 minutes for a typical 10-load facility
- **SC-002**: Generator size recommendations match hand calculations within 1% tolerance for running load and 5% for motor starting transient analysis
- **SC-003**: Altitude and temperature derating results match ISO 8528-1 published tables within 2% tolerance
- **SC-004**: 95% of users can correctly complete a motor starting voltage dip analysis on first attempt without external reference material
- **SC-005**: Step loading sequence clearly identifies overloaded steps, enabling engineers to resolve sequencing issues before commissioning
- **SC-006**: PDF reports contain sufficient detail to serve as project documentation without additional annotation

## Assumptions

- Standard diesel and natural gas consumption curves are sufficient for estimation; manufacturer-specific data is not required
- NEMA motor code letters are the primary method for determining locked rotor kVA in the target market; IEC locked rotor current ratios will be supported as secondary input
- Standard generator kVA ratings follow the common commercial range (15 kVA to 3000 kVA); parallel generator configurations are out of scope for this feature
- Generator subtransient reactance (Xd'') defaults to 0.15 per unit when not specified by the user, which is representative of typical standby generators
- Fuel consumption estimation is for planning purposes; detailed fuel curves from specific manufacturers are not included
- The voltage dip threshold of 15% per NFPA 110 is used as the default; users can adjust this threshold for non-emergency applications
