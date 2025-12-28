# Feature Specification: Circuit Breaker Sizing Calculator

**Feature Branch**: `003-circuit-breaker-sizing`
**Created**: 2025-12-28
**Status**: Draft
**Input**: User description: "Build a professional-grade Circuit Breaker Sizing Calculator with NEC and IEC standards support for single-phase and three-phase systems, including load conversion, voltage drop warnings, breaker type recommendations, and PDF export capabilities"

## Clarifications

### Session 2025-12-28

- Q: Should the system maintain a history of completed breaker sizing calculations that engineers can review, compare, or re-export later? → A: Persistent history - Store calculation history in localStorage with limit (e.g., last 50 calculations); allows engineers to review past work across sessions
- Q: Should the system capture diagnostic information (error logs, validation failures, calculation anomalies) to help engineers and developers identify issues? → A: Client-side console logging - Log validation errors, calculation warnings, and edge case triggers to browser console for developer troubleshooting and user support

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Circuit Breaker Sizing (Priority: P1)

An electrical engineer needs to quickly determine the correct circuit breaker size for a continuous load application. They input the load power (in kW or Amps), voltage, phase type, and power factor. The system calculates the required breaker rating according to the selected standard (NEC or IEC) and recommends the next standard breaker size from available ratings.

**Why this priority**: This is the core functionality that delivers immediate value. Engineers can use this independently to size breakers for the majority of common applications without needing any additional features.

**Independent Test**: Can be fully tested by entering load parameters (e.g., 5 kW, 230V, single-phase, PF 0.95, NEC standard) and verifying the system returns correct minimum breaker size (with 125% safety factor for continuous loads per NEC 210.20(A)) and suggests next standard rating (e.g., 30A if calculated is 27.6A).

**Acceptance Scenarios**:

1. **Given** an engineer selects NEC standard and enters 10 kW continuous load at 240V single-phase with 0.9 power factor, **When** they calculate, **Then** the system displays calculated current (46.3A), minimum breaker size (57.9A with 125% factor), and recommends standard 60A breaker
2. **Given** an engineer selects IEC standard and enters 50A load current at 400V three-phase, **When** they calculate, **Then** the system applies appropriate IEC correction factors and recommends suitable breaker rating based on IEC 60364 guidelines
3. **Given** an engineer toggles between kW and Amps input mode, **When** they enter values, **Then** the system automatically converts between power and current using the correct single-phase or three-phase formulas
4. **Given** an engineer enters invalid input (negative power, voltage outside standard range), **When** they attempt calculation, **Then** the system displays clear validation errors with acceptable ranges

---

### User Story 2 - Voltage Drop Analysis (Priority: P2)

An electrical engineer working on a long cable run needs to verify that the selected breaker and cable combination won't result in excessive voltage drop. They enter the circuit distance (length), and the system calculates the expected voltage drop percentage and warns if it exceeds acceptable limits (typically 3% for branch circuits, 5% for combined feeder+branch per NEC Article 210.19(A)).

**Why this priority**: Voltage drop is a critical safety and performance consideration. This feature complements breaker sizing and helps engineers avoid undersized installations, but the basic breaker sizing can function independently without it.

**Independent Test**: Can be tested by entering a circuit with known parameters (e.g., 30A load, 240V, 150 feet distance, copper conductor) and verifying the voltage drop calculation matches manual calculations using standard formulas, with appropriate warnings displayed when thresholds are exceeded.

**Acceptance Scenarios**:

1. **Given** an engineer has sized a breaker and enters cable length of 100 meters for a 400V three-phase circuit at 50A load, **When** the system calculates voltage drop, **Then** it displays the percentage drop and indicates whether it exceeds NEC/IEC acceptable limits with color-coded warnings
2. **Given** voltage drop exceeds acceptable limits (>3% for branch circuit), **When** results are displayed, **Then** the system recommends larger cable sizes that would bring voltage drop within acceptable range
3. **Given** an engineer uses imperial units (feet) with NEC standard, **When** they switch to IEC standard, **Then** the system automatically converts distance to meters and recalculates

---

### User Story 3 - Advanced Derating and Environmental Factors (Priority: P2)

An industrial engineer designing a high-rise riser or harsh environment installation needs to account for ambient temperature and cable grouping effects that reduce the effective ampacity of cables and breaker capacity. They enter the ambient temperature, number of cables grouped together, and installation method. The system applies appropriate derating factors according to NEC Table 310.15(B)(2)(a) and 310.15(C)(1) or equivalent IEC tables.

**Why this priority**: Derating is essential for industrial applications and high-rise buildings where multiple circuits are run together. This ensures safety margins are maintained in real-world installations, but basic residential/commercial projects may not require this complexity.

**Independent Test**: Can be tested by entering a scenario with 40°C ambient temperature and 6 cables in a conduit. Verify the system applies correct derating factors (e.g., 0.8 for temperature, 0.8 for grouping per NEC) and recommends appropriately uprated breaker and cable sizes.

**Acceptance Scenarios**:

1. **Given** an engineer enters ambient temperature of 45°C and 9 cables grouped in conduit, **When** they calculate breaker size, **Then** the system applies both temperature and grouping derating factors and displays the adjusted minimum breaker rating required
2. **Given** derating factors reduce effective capacity significantly, **When** results are displayed, **Then** the system clearly shows original calculated current, applied derating factors, and final adjusted breaker requirement with explanatory notes
3. **Given** an engineer selects IEC standard, **When** they enter installation method (Method B, C, or D per IEC 60364-5-52), **Then** the system applies installation-specific correction factors appropriate to IEC standards

---

### User Story 4 - Short Circuit Protection Specification (Priority: P2)

An industrial engineer designing a facility with high fault current potential needs to specify the short circuit breaking capacity (kA rating) of the breaker. They input the expected short circuit current at the installation point, and the system recommends breakers with adequate breaking capacity to safely interrupt fault currents without catastrophic failure.

**Why this priority**: Short circuit capacity is critical for industrial safety, but residential and light commercial applications often have lower fault currents where this is less of a concern. This feature serves specialized users but isn't required for basic functionality.

**Independent Test**: Can be tested by entering a short circuit current value (e.g., 10 kA) and verifying the system only recommends breakers rated for ≥10 kA breaking capacity, filtering out inadequate options.

**Acceptance Scenarios**:

1. **Given** an engineer enters expected short circuit current of 25 kA at the installation point, **When** they view breaker recommendations, **Then** only breakers with breaking capacity ≥25 kA are suggested with clear indication of their kA ratings
2. **Given** the calculated breaker size is 100A with 15 kA fault current, **When** viewing recommendations, **Then** the system shows multiple breaker options (if available) with different breaking capacities (e.g., 10 kA, 25 kA, 50 kA models) and notes the minimum safe choice
3. **Given** an engineer hasn't specified short circuit current, **When** viewing recommendations, **Then** the system displays a warning that breaking capacity should be verified based on site-specific fault current calculations

---

### User Story 5 - Breaker Type and Trip Curve Recommendations (Priority: P3)

An electrical engineer needs guidance on which type of circuit breaker is most appropriate for their application (motor loads vs. resistive loads vs. mixed). The system recommends breaker types based on load characteristics: thermal-magnetic vs. electronic trip for NEC, or Type B/C/D curves for IEC applications. For motor loads, the system suggests Type D (IEC) or instantaneous trip settings that accommodate inrush currents.

**Why this priority**: Type recommendations help less experienced engineers and reduce errors, but experienced professionals often know their breaker type requirements. This enhances usability but isn't essential for core breaker sizing functionality.

**Independent Test**: Can be tested by specifying a motor load with high inrush current and verifying the system recommends Type D breaker (IEC) or adjustable magnetic trip (NEC) with appropriate settings to avoid nuisance tripping during motor start.

**Acceptance Scenarios**:

1. **Given** an engineer specifies a motor load application, **When** viewing breaker recommendations for IEC standard, **Then** the system suggests Type D curve breakers and explains they tolerate 10-20x inrush currents typical of motor starting
2. **Given** an engineer specifies resistive heating load, **When** viewing recommendations for IEC standard, **Then** the system suggests Type B or C curve breakers as appropriate for non-inductive loads
3. **Given** an engineer uses NEC standard with industrial application, **When** viewing recommendations, **Then** the system explains difference between thermal-magnetic and electronic trip breakers, recommending electronic trip for precise overload protection in critical applications

---

### User Story 6 - Calculation History and Review (Priority: P3)

An electrical engineer working on multiple projects or iterations needs to review previous breaker sizing calculations from past sessions. They access the calculation history to compare different design approaches, verify previous recommendations, or re-export a calculation performed days or weeks earlier without re-entering all parameters.

**Why this priority**: History enhances professional workflow by enabling comparison and reference to past work, but the core calculation functionality delivers value independently. This feature supports iterative design and project continuity across sessions.

**Independent Test**: Can be tested by completing 3-5 calculations with different parameters over multiple browser sessions, then verifying all calculations appear in history with correct timestamps, parameters, and results. Test that calculations can be reviewed and re-exported, and that oldest calculations are removed when 50-calculation limit is exceeded.

**Acceptance Scenarios**:

1. **Given** an engineer has completed multiple calculations across different sessions, **When** they open the calculation history view, **Then** the system displays up to 50 most recent calculations with timestamps, key parameters (voltage, load, standard), and breaker recommendations in chronological order
2. **Given** an engineer selects a calculation from history, **When** they view details, **Then** the system displays all original input parameters, calculation results, and applied factors exactly as they appeared in the original calculation
3. **Given** an engineer wants to re-export a previous calculation, **When** they select "Export PDF" from history, **Then** the system generates a PDF with all original calculation data and marks it with the original calculation date
4. **Given** calculation history reaches 50 entries and a new calculation is completed, **When** the new calculation is saved, **Then** the system automatically removes the oldest calculation and maintains the 50-entry limit

---

### User Story 7 - PDF Technical Specification Report (Priority: P3)

After completing breaker sizing calculations, an engineer needs to generate a formal technical specification report for documentation, client review, or regulatory approval. They click "Export PDF" and receive a professionally formatted document containing all input parameters, calculated values, breaker recommendations, compliance notes referencing specific NEC/IEC code sections, and voltage drop analysis if applicable.

**Why this priority**: Documentation is important for professional deliverables and regulatory compliance, but the core calculation functionality provides value independently. PDF export enhances professional use but isn't required for the tool to be useful.

**Independent Test**: Can be tested by completing a full calculation with all parameters and exporting PDF. Verify the PDF contains all input values, formulas used, calculation results, standard breaker recommendation, code references (e.g., "Per NEC 210.20(A)"), and maintains professional formatting suitable for client presentation.

**Acceptance Scenarios**:

1. **Given** an engineer has completed breaker sizing with voltage drop analysis, **When** they click "Export PDF", **Then** a PDF document is generated containing project header, all input parameters in a table, calculated current, applied safety factors, recommended breaker size, voltage drop analysis, and relevant code section references
2. **Given** PDF includes derating factors, **When** generated, **Then** the report shows a clear breakdown of original current, each derating factor applied with code reference, and final adjusted requirement
3. **Given** an engineer hasn't filled in optional project name/location fields, **When** PDF is exported, **Then** the report still generates successfully with only technical calculations shown and appropriate sections marked as "Not Specified"

---

### Edge Cases

- What happens when calculated breaker size falls between standard ratings (e.g., 47A calculated but standards are 40A, 50A, 63A)? System must always round UP to next available standard rating
- How does system handle unusual voltage inputs (e.g., 380V, 415V, 208V three-phase)? System should accept wide voltage range (100-1000V) and calculate correctly rather than restricting to preset values
- What happens when power factor is extremely low (<0.6) or missing? System should warn about poor power factor (recommend correction) and default to 0.8 if not specified
- How does system handle very short distances (<5m) where voltage drop is negligible? System should still calculate and display, but suppress warnings if drop is <1%
- What happens when derating factors result in required breaker size exceeding available standard ratings (e.g., calculated need for >4000A)? System should recommend multiple parallel circuits as an alternative
- How does system handle switching between NEC and IEC mid-calculation? System should recalculate all values using new standard's formulas, factors, and voltage/size conventions
- What happens when ambient temperature is extremely high (>60°C) or low (<-20°C)? System should apply appropriate derating but also warn that special breaker types or enclosures may be required beyond standard ratings
- What happens when localStorage is full or unavailable? System should function normally for calculations but display warning that history cannot be saved; current calculation inputs should still persist if possible
- What happens when user clears browser data or switches browsers/devices? Calculation history stored in localStorage will be lost; system should handle missing history gracefully without errors

## Requirements *(mandatory)*

### Functional Requirements

#### Core Calculation Requirements

- **FR-001**: System MUST support both single-phase and three-phase circuit calculations
- **FR-002**: System MUST allow load input in both kilowatts (kW) and amperes (A) with automatic conversion
- **FR-003**: System MUST support voltage input from 100V to 1000V to accommodate various international standards
- **FR-004**: System MUST allow power factor input from 0.5 to 1.0, defaulting to 0.8 if not specified
- **FR-005**: System MUST calculate load current using:
  - Single-phase: I = P / (V × PF)
  - Three-phase: I = P / (√3 × V × PF)
- **FR-006**: System MUST support both NEC (Americas) and IEC (International) standards with appropriate calculation methods for each
- **FR-007**: System MUST apply 125% safety factor for continuous loads when NEC standard is selected (per NEC 210.20(A))
- **FR-008**: System MUST apply appropriate correction factors (current-carrying capacity) when IEC standard is selected (per IEC 60364-5-52)

#### Standard Breaker Ratings

- **FR-009**: System MUST maintain database of standard breaker ratings for NEC: 15A, 20A, 25A, 30A, 35A, 40A, 45A, 50A, 60A, 70A, 80A, 90A, 100A, 110A, 125A, 150A, 175A, 200A, 225A, 250A, 300A, 350A, 400A, 450A, 500A, 600A, 700A, 800A, 1000A, 1200A, 1600A, 2000A, 2500A, 3000A, 4000A
- **FR-010**: System MUST maintain database of standard breaker ratings for IEC: 6A, 10A, 13A, 16A, 20A, 25A, 32A, 40A, 50A, 63A, 80A, 100A, 125A, 160A, 200A, 250A, 315A, 400A, 500A, 630A, 800A, 1000A, 1250A, 1600A, 2000A, 2500A, 3200A, 4000A
- **FR-011**: System MUST recommend the next standard breaker rating that is equal to or greater than the calculated minimum breaker size
- **FR-012**: System MUST display both the calculated minimum breaker size and the recommended standard rating

#### Voltage Drop Analysis

- **FR-013**: System MUST calculate voltage drop percentage based on circuit length, load current, conductor material (copper default), and conductor size
- **FR-014**: System MUST support distance input in both meters (IEC) and feet (NEC) with automatic unit conversion
- **FR-015**: System MUST warn when voltage drop exceeds 3% for branch circuits per NEC 210.19(A) guidance
- **FR-016**: System MUST warn when combined feeder and branch voltage drop exceeds 5% per NEC recommendations
- **FR-017**: System MUST suggest alternative cable sizes that would reduce voltage drop to acceptable levels when warnings are triggered

#### Derating and Environmental Factors

- **FR-018**: System MUST accept ambient temperature input from -40°C to +70°C
- **FR-019**: System MUST apply temperature derating factors according to NEC Table 310.15(B)(2)(a) or IEC 60364-5-52 Appendix B
- **FR-020**: System MUST accept number of grouped cables/circuits (1-20+) in same conduit/raceway
- **FR-021**: System MUST apply grouping derating factors according to NEC Table 310.15(C)(1) or IEC 60364-5-52 Table B.52.17
- **FR-022**: System MUST support IEC installation methods (A1, A2, B1, B2, C, D, E, F, G) and apply method-specific correction factors
- **FR-023**: System MUST clearly display all applied derating factors with their source code references
- **FR-024**: System MUST recalculate minimum breaker size after applying all derating factors

#### Short Circuit Protection

- **FR-025**: System MUST allow optional input of expected short circuit current (fault current) in kiloamperes (kA)
- **FR-026**: System MUST filter breaker recommendations to show only breakers with breaking capacity equal to or exceeding specified short circuit current
- **FR-027**: System MUST display breaking capacity (kA rating) for all recommended breakers when short circuit current is specified
- **FR-028**: System MUST show warning message when short circuit current is not specified, advising user to verify breaking capacity

#### Breaker Type Recommendations

- **FR-029**: System MUST recommend breaker trip curves for IEC applications: Type B (3-5× In trip) for lighting/residential, Type C (5-10× In) for mixed loads, Type D (10-20× In) for motors and transformers
- **FR-030**: System MUST recommend thermal-magnetic vs. electronic trip breakers for NEC industrial applications based on precision requirements
- **FR-031**: System MUST provide explanatory text for each breaker type recommendation explaining application suitability
- **FR-032**: System MUST allow user to specify load type (resistive, inductive/motor, mixed, capacitive) to inform breaker type recommendations

#### User Interface and Interaction

- **FR-033**: System MUST provide toggle between Metric (mm², meters, °C) and Imperial (AWG/kcmil, feet, °F) unit systems
- **FR-034**: System MUST automatically switch default voltage options when changing between NEC (120V, 208V, 240V, 480V) and IEC (230V, 400V, 690V) standards
- **FR-035**: System MUST provide clear labels and tooltips explaining each input parameter
- **FR-036**: System MUST validate all inputs and display clear error messages for out-of-range or invalid values
- **FR-036a**: System MUST log all validation errors, calculation warnings, and edge case triggers to browser console with structured format including timestamp, error type, and context for troubleshooting
- **FR-037**: System MUST persist user inputs in browser localStorage to prevent data loss on page refresh
- **FR-037a**: System MUST maintain persistent calculation history in localStorage storing up to 50 completed calculations with all input parameters, results, and timestamps for cross-session reference
- **FR-037b**: System MUST provide user interface to view, compare, and re-export calculations from history
- **FR-037c**: System MUST automatically remove oldest calculations when history limit (50 calculations) is reached using FIFO (first-in-first-out) policy
- **FR-038**: System MUST display calculation results in clearly organized sections: Load Analysis, Breaker Sizing, Voltage Drop, Derating Factors, Recommendations

#### PDF Export

- **FR-039**: System MUST generate PDF technical specification report containing all input parameters, calculated values, and recommendations
- **FR-040**: PDF MUST include code section references (e.g., "Per NEC 210.20(A)" or "Per IEC 60364-5-52 Table B.52.5")
- **FR-041**: PDF MUST display project information fields (project name, location, engineer name, date) if provided by user
- **FR-042**: PDF MUST include formulas used in calculations for transparency and verification
- **FR-043**: PDF MUST maintain professional formatting suitable for client presentation and regulatory submission
- **FR-044**: System MUST use jsPDF library (already in project dependencies) for PDF generation

### Key Entities

- **Circuit Configuration**: Represents the electrical circuit being designed, including voltage level, phase type (single/three), load power or current, power factor, and standard selection (NEC/IEC)
- **Environmental Conditions**: Represents installation environment factors affecting breaker sizing, including ambient temperature, cable grouping count, installation method, and circuit length for voltage drop
- **Breaker Specification**: Represents the recommended circuit breaker, including standard rating (amperes), breaking capacity (kA), trip curve type (B/C/D for IEC) or trip mechanism (thermal-magnetic/electronic for NEC), and relevant code compliance references
- **Calculation Results**: Represents all calculated values including load current, minimum breaker size before/after derating, applied correction factors with sources, voltage drop percentage, and warnings/recommendations
- **Project Information**: Represents optional documentation metadata including project name, location, engineer/designer name, calculation date, and notes for PDF export
- **Calculation History Entry**: Represents a completed calculation stored for future reference, containing complete Circuit Configuration, Environmental Conditions, Calculation Results, Project Information, calculation timestamp, and unique identifier for retrieval and comparison

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Engineers can complete basic breaker sizing calculation (User Story 1) in under 60 seconds from page load to result display
- **SC-002**: System produces breaker sizing results matching manual calculations per NEC and IEC standards with 100% accuracy for all standard test cases (defined as test suite of 50+ scenarios covering voltage ranges, load types, and standards)
- **SC-003**: Voltage drop calculations match IEEE standards formulas within 0.1% accuracy for copper and aluminum conductors across all standard sizes
- **SC-004**: System successfully applies correct derating factors matching NEC and IEC tables, verified by 20+ test scenarios covering temperature ranges from -20°C to +60°C and grouping from 1 to 20 cables
- **SC-005**: PDF export generates complete technical specification report in under 3 seconds for all calculation scenarios
- **SC-006**: Engineers can switch between NEC and IEC standards and have all calculations automatically recalculated correctly within 500ms
- **SC-007**: System handles edge cases (unusual voltages, extreme temperatures, very long cable runs) without errors and provides appropriate warnings in 100% of test scenarios
- **SC-008**: 90% of electrical engineers using the tool report the breaker type recommendations (User Story 5) as helpful and accurate for their application type
- **SC-009**: System correctly recommends cable size increases to meet voltage drop requirements in 100% of scenarios where initial calculation exceeds limits
- **SC-010**: Generated PDF reports are accepted by at least 3 electrical inspection authorities or engineering review processes without requiring manual formatting or content additions

### Non-Functional Requirements

#### Observability and Diagnostics

- **NFR-001**: System MUST log diagnostic information to browser console using structured format (timestamp, log level, component, message, context data)
- **NFR-002**: Log levels MUST include: ERROR (validation failures, calculation errors), WARN (edge case triggers, unusual parameter combinations), INFO (standard calculation flow, mode switches), DEBUG (detailed calculation steps for development)
- **NFR-003**: Console logs MUST NOT contain sensitive user data or proprietary project information beyond technical parameters necessary for troubleshooting
- **NFR-004**: Logging MUST NOT impact user-facing performance (target <10ms overhead per calculation)

## Assumptions

1. **Standard Voltages**: While the system accepts any voltage from 100-1000V, most users will work with standard voltages (NEC: 120V, 208V, 240V, 480V; IEC: 230V, 400V, 690V). Less common voltages (e.g., 380V, 415V, 440V) will still calculate correctly.

2. **Conductor Material**: Default conductor material is copper. If aluminum conductors are used in future enhancements, appropriate resistance values and derating must be applied.

3. **Continuous Load Default**: All loads are assumed to be continuous (operating for 3+ hours) unless the system is enhanced to allow non-continuous load specification. This is a safe conservative assumption per NEC 210.20(A).

4. **Cable Sizing Integration**: This specification focuses on breaker sizing. While voltage drop analysis requires cable size input, the system will assume user has determined cable size separately (possibly using the existing Cable Sizing tool in ElectroMate). Future integration with the cable calculator could create a unified workflow.

5. **Breaking Capacity Data**: Standard breaker breaking capacities (kA ratings) will be based on common manufacturer specifications (residential: 10kA, commercial: 14-25kA, industrial: 35-100kA). Users must verify specific product specifications.

6. **Installation Method**: For IEC calculations, if installation method is not specified, system will default to Method C (cables in conduit on wall or in ground) as a commonly used conservative baseline.

7. **Resistance Values**: Voltage drop calculations will use standard conductor resistance values from NEC Chapter 9 Table 8 and IEC 60228 at 75°C operating temperature.

8. **Power Factor**: When not specified, power factor defaults to 0.8, which is typical for mixed commercial/industrial loads. Users should specify actual PF for precise motor or highly inductive loads.

9. **Three-Phase Balance**: All three-phase calculations assume balanced loads across all three phases. Unbalanced loads require special analysis beyond this tool's scope.

10. **Code Editions**: Calculations reference NEC 2020/2023 and IEC 60364 current editions. Users are responsible for verifying applicable code edition in their jurisdiction.

## Out of Scope

1. **Panel and Distribution Design**: This tool sizes individual circuit breakers, not entire electrical panels, distribution boards, or load centers. Panel bus sizing, main breaker selection, and panel schedule creation are separate engineering tasks.

2. **Load Calculation and Demand Factors**: The tool requires user to input the load value (kW or A). It does NOT calculate building loads, apply demand factors per NEC Article 220, or perform load diversity analysis. Use separate load calculation tools for these tasks.

3. **Transformer Sizing**: While the tool can size breakers for transformer primary or secondary circuits, it does not perform transformer sizing, impedance calculations, or transformer protection coordination.

4. **Arc Flash Analysis**: Arc flash hazard calculations, incident energy levels, PPE requirements, and NFPA 70E compliance are complex analyses requiring specialized software and are outside this tool's scope.

5. **Protective Device Coordination**: Time-current curve coordination, selective coordination studies, and coordination between upstream/downstream protective devices require specialized analysis tools. This tool sizes individual breakers in isolation.

6. **Three-Phase Unbalanced Loads**: All three-phase calculations assume balanced loads. Analysis of unbalanced loads, single-phase loads on three-phase systems, and neutral conductor sizing for unbalanced conditions are not supported.

7. **Harmonic Analysis**: Effects of harmonic currents on breaker sizing, derating for non-linear loads, and neutral conductor oversizing for harmonics are not addressed. Users working with variable frequency drives or other harmonic sources must apply additional engineering judgment.

8. **Motor Starting Analysis**: While the tool recommends breaker types suitable for motors (Type D, etc.), detailed motor starting analysis, acceleration time, locked rotor current duration, and motor protection coordination are not calculated.

9. **Ground Fault Protection**: Ground fault circuit interrupter (GFCI) requirements, ground fault relay settings, and ground fault coordination are not addressed. Users must apply code requirements separately.

10. **Economic Analysis**: Cost comparison between breaker options, lifecycle cost analysis, energy efficiency calculations, and ROI analysis are not provided.

11. **Equipment Selection from Specific Manufacturers**: The tool recommends breaker ratings and types generically. It does not integrate with manufacturer catalogs, provide part numbers, check product availability, or compare specific products from manufacturers like Schneider Electric, ABB, Siemens, Eaton, etc.

12. **Conduit Fill and Cable Tray Sizing**: While the tool accounts for cable grouping effects on ampacity, it does not calculate conduit fill percentages, cable tray fill, or recommend conduit/tray sizes per NEC Chapter 9.

## Dependencies

1. **Existing Cable Sizing Tool**: For complete workflow, users may need to reference the existing ElectroMate Cable Sizing Calculator (User Story 3 from Feature 001) to determine appropriate cable sizes before or in conjunction with breaker sizing. Future enhancement could integrate these tools.

2. **Standards Documentation**: Accurate implementation requires access to current editions of NEC 2020/2023 (specifically Articles 210, 215, 240, 310) and IEC 60364 series (specifically 60364-5-52 for cable derating tables). Development team must verify all table values and formulas against official standards.

3. **jsPDF Library**: PDF export functionality depends on jsPDF library, which is already included in the ElectroMate project dependencies (package.json line 42). No additional installation required.

4. **Math.js Library**: Precision calculations require Math.js with BigNumber support, already included in project dependencies (package.json line 44). This ensures numerical accuracy for all electrical calculations.

5. **Browser localStorage API**: Input persistence feature depends on browser localStorage API. Tool will function without it, but users will lose data on page refresh if localStorage is disabled/unavailable.

6. **Modern Browser Support**: PDF generation and complex calculations require modern browser with ES6+ JavaScript support. Target: Chrome/Edge 90+, Firefox 88+, Safari 14+.

## Constraints

1. **Standards Version Lag**: Electrical codes (NEC, IEC) are updated periodically (NEC every 3 years). The tool will implement calculations based on specific code editions (NEC 2020/2023, IEC 60364 current). Users must verify their jurisdiction's adopted code edition and whether differences affect their calculations.

2. **Jurisdiction Variations**: While NEC is standard in USA/Canada and IEC in most other countries, local jurisdictions may have amendments, stricter requirements, or different adopted code years. The tool provides code-compliant calculations but cannot account for all local variations. Users are responsible for verifying local requirements.

3. **Engineering Judgment Required**: The tool performs calculations and provides recommendations based on input parameters. It cannot replace engineering judgment for unusual conditions, special applications, or situations requiring professional analysis. Users must be qualified electrical professionals or work under supervision of licensed engineers.

4. **Liability Disclaimer**: The tool is provided for assistance and educational purposes. Final designs must be reviewed and stamped by licensed Professional Engineers where required by law. The tool developers assume no liability for designs produced using the tool.

5. **No Equipment Warranty Integration**: Breaker recommendations are generic (ratings and types). Users must verify specific equipment specifications with manufacturers, as breaker characteristics (breaking capacity, trip curves, dimensions, termination requirements) vary by manufacturer and product line.

6. **Calculation Precision vs. Real-World Tolerances**: Calculations are performed with high numerical precision, but real-world equipment has tolerances (e.g., breakers trip at ±10-20% of rating, voltage varies ±5-10%). The tool provides precise calculations but cannot account for all real-world variations.

7. **Single Circuit Analysis**: The tool analyzes one circuit at a time. Projects with multiple circuits require multiple calculations. Future enhancements could support batch processing or multi-circuit projects.

8. **Performance Limits**: PDF generation and complex calculations with many derating factors should complete within 3 seconds on modern hardware. Very old devices or browsers may experience slower performance.

9. **No Offline Mode**: The tool requires browser with JavaScript enabled. No native mobile app or offline desktop version is planned for this release.

10. **Standards Access Not Included**: The tool implements calculations from NEC and IEC standards but does not include full text of these standards. Users who need to reference complete code text must obtain standards documents separately (NFPA for NEC, ISO/IEC for IEC 60364).
