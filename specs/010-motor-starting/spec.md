# Feature Specification: Motor Starting Analysis Calculator

**Feature Branch**: `010-motor-starting`
**Created**: 2026-05-04
**Status**: Draft
**Input**: User description: "Motor Starting Analysis Calculator — analyze and compare 5 starting methods (DOL, Star-Delta, Autotransformer, Soft Starter, VFD) for AC induction motors. Dual standard support: NEC 430 + IEC 60034-12 + IEEE 3002.7-2018. Core outputs: voltage dip at PCC with IEEE 1668 limits, starting current profile (LRA, acceleration curve), acceleration time vs motor thermal limit (t6/stall curve), method comparison table (cost, dip, torque, complexity), source impedance chain (utility → transformer → cable → motor), PDF export."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Analyze a Single Starting Method (Priority: P1)

A consulting electrical engineer is sizing protection and feeders for a new 75 kW (100 HP) induction motor on a 480 V industrial bus. They need to verify whether a Direct-On-Line (DOL) start is acceptable, or whether the resulting voltage dip will trip sensitive loads on the same bus. They enter motor nameplate data, source impedance (utility short-circuit MVA, transformer kVA/%Z, feeder cable details), and select DOL. The calculator returns locked-rotor current, voltage at the motor terminals during start, voltage at the Point of Common Coupling (PCC), percentage dip, acceleration time, and an automatic pass/fail check against IEEE 1668 voltage-dip limits.

**Why this priority**: This is the minimum viable workflow. Without the ability to evaluate one method end-to-end, the calculator delivers no engineering value. Every other story builds on this primitive.

**Independent Test**: Can be fully tested by entering a known motor + source case (e.g., IEEE 3002.7 worked example) and verifying voltage dip, LRA, and acceleration time match published values within ±2%.

**Acceptance Scenarios**:

1. **Given** a 100 HP, 460 V, 4-pole NEMA Code G motor with utility 500 MVA, 1500 kVA / 5.75% transformer, and 50 m of 4/0 AWG cable, **When** the user selects DOL and runs analysis, **Then** the system displays starting current ≥ 600% FLA, voltage dip at PCC between 8% and 15%, acceleration time within motor thermal limit, and a green "Within IEEE 1668 limits" indicator.
2. **Given** the same motor and a weak source (50 MVA utility, 500 kVA / 6% transformer), **When** the user runs DOL analysis, **Then** the system flags the voltage dip exceeds 20% and recommends evaluating reduced-voltage starting methods.
3. **Given** missing motor nameplate data (e.g., no LRA), **When** the user selects a NEMA Code Letter, **Then** the system computes LRA from the code-letter kVA/HP table per NEC 430.7(B).

---

### User Story 2 - Compare All Five Starting Methods Side-by-Side (Priority: P1)

The same engineer wants to see at a glance which starting method yields acceptable voltage dip while still producing enough starting torque to accelerate the connected load (e.g., a centrifugal pump). They click "Compare Methods" and the calculator evaluates DOL, Star-Delta (Y-Δ), Autotransformer (with selectable tap: 50/65/80%), Soft Starter (with ramp time), and VFD against the same motor and source data. A comparison table shows, for each method: starting current %FLA, starting torque %FLT, voltage dip at PCC, acceleration time, relative cost, complexity, and a recommended/not-recommended badge.

**Why this priority**: Method selection is the core engineering decision motor starting analysis exists to inform. Side-by-side comparison is the differentiator over single-method tools and is the reason engineers will choose this calculator.

**Independent Test**: Can be tested by running the comparison on a fixed motor case and verifying the table shows all 5 methods, ordered by recommendation, with starting current/torque/dip values matching reference textbook values for each method.

**Acceptance Scenarios**:

1. **Given** a valid motor + source case, **When** the user clicks "Compare Methods", **Then** the system displays a 5-row table with columns: Method, Starting I%, Starting T%, Voltage Dip %, Accel Time, Cost, Complexity, Verdict.
2. **Given** the comparison results, **When** at least one method passes IEEE 1668 limits, **Then** the system highlights the lowest-cost passing method as "Recommended".
3. **Given** a motor whose load-torque curve exceeds DOL starting torque scaled by reduced-voltage methods, **When** running the comparison, **Then** Y-Δ and Autotransformer are flagged "Insufficient torque" but DOL/Soft Starter/VFD remain candidates.

---

### User Story 3 - Build Source Impedance Chain (Priority: P2)

The engineer wants accurate voltage-dip results, which require modeling the impedance chain from the utility down to the motor terminals: utility short-circuit contribution (MVA or X/R), transformer impedance (kVA, %Z, X/R), and feeder cable impedance (size, length, R and X per unit length). They enter each element and the calculator computes the Thevenin equivalent at the motor terminals, used for all method analyses.

**Why this priority**: Required for engineering accuracy but can ship with simplified defaults (typical X/R, standard cable values) for v1. The user can override defaults when more precision is needed.

**Independent Test**: Verify the computed Thevenin Z at the motor terminals against a hand-calculated example (utility + transformer + cable in series), within ±1%.

**Acceptance Scenarios**:

1. **Given** utility 500 MVA SC at 13.8 kV, transformer 1500 kVA 13.8/0.48 kV at 5.75%, cable 4/0 AWG copper, 50 m, **When** the user enters these and runs analysis, **Then** the system displays the per-unit and ohmic Thevenin impedance at the motor terminals.
2. **Given** an "infinite bus" assumption (utility MVA blank or zero), **When** running analysis, **Then** the system uses transformer + cable only and clearly labels the assumption in the output.

---

### User Story 4 - Export Engineering Report as PDF (Priority: P2)

The engineer needs to attach the analysis to a design package or submit it for client/AHJ review. They click "Export PDF" and receive a multi-page report containing inputs, the source impedance chain, per-method results, the comparison table, voltage-dip plot, acceleration-time-vs-thermal-limit plot, and citations to the applicable standards (NEC 430.x, IEC 60034-12, IEEE 3002.7-2018, IEEE 1668).

**Why this priority**: PDF export is a standard deliverable across the existing calculator suite (Generator, Conduit Fill, Voltage Drop) and users expect it. Not blocking for v1 release if other stories ship, but strongly desired.

**Independent Test**: Run analysis, click Export, verify PDF opens and contains all input values, the comparison table, and standard references.

**Acceptance Scenarios**:

1. **Given** a completed analysis, **When** the user clicks "Export PDF", **Then** a PDF downloads within 10 seconds with project metadata, inputs, results per method, comparison, plots, and standard references.
2. **Given** a partial input set, **When** the user clicks "Export PDF" before running analysis, **Then** the system prompts the user to run analysis first.

---

### User Story 5 - Switch Between NEC and IEC Standards (Priority: P3)

The calculator supports both North American (NEC 2020 Article 430, IEEE 3002.7) and international (IEC 60034-12, IEC 60364) practices. The user toggles a Standard switcher at the top of the form; field labels, default values, code-letter tables, and acceptance criteria adjust accordingly (e.g., NEMA Code Letters for NEC, IEC Design N/H for IEC).

**Why this priority**: Matches the dual-standard pattern from Conduit Fill v2 and Voltage Drop, but the underlying physics is identical. v1 can ship with a single standard view if needed; the switcher is incremental.

**Independent Test**: Toggle the switcher and verify that motor design-class options change (NEMA A/B/C/D ↔ IEC N/H), units default appropriately (HP/AWG ↔ kW/mm²), and reference citations update.

**Acceptance Scenarios**:

1. **Given** the standard is set to NEC, **When** the user opens the motor design class dropdown, **Then** options are NEMA A, B, C, D and code letters A–V appear in the LRA selector.
2. **Given** the standard is switched to IEC, **When** the same dropdowns are opened, **Then** IEC Design N and Design H are shown and units default to kW and mm².

---

### Edge Cases

- **Locked rotor (motor cannot accelerate)**: If computed acceleration time exceeds motor thermal limit (t6 / stall time), the system flags "Motor damage risk — starting time exceeds thermal limit" and recommends a different method or larger motor.
- **Insufficient starting torque**: If method-derated starting torque is less than load break-away torque, the system flags "Motor will not start with this method against this load".
- **Voltage dip exceeds transient limit**: If dip > 20% (typical sensitive-load threshold per IEEE 1668), the system shows a red warning and links to mitigation guidance.
- **Infinite bus / missing source data**: If utility MVA is blank, the system assumes infinite source (Z_utility = 0) and labels the assumption explicitly in results.
- **Star-Delta on a 6-lead motor only**: System warns that Y-Δ requires a motor with 6 accessible terminals and that single-voltage 3-lead motors cannot use this method.
- **VFD bypass / manual mode**: VFD comparison assumes ramp start; the calculator notes that bypass operation reverts to DOL behavior.
- **Multiple motors starting simultaneously**: Out of scope for v1. The system analyzes one motor at a time; coincident starts are documented as a future enhancement.
- **DC and synchronous motors**: Out of scope. The calculator covers AC squirrel-cage induction motors only; synchronous and wound-rotor motors will note "Not supported in this version".

## Requirements *(mandatory)*

### Functional Requirements

**Motor Inputs**
- **FR-001**: System MUST accept motor nameplate inputs: rated power (HP or kW), rated voltage, rated full-load current (FLA), number of poles or rated speed, efficiency, power factor, service factor, and design class (NEMA A/B/C/D or IEC Design N/H).
- **FR-002**: System MUST allow the user to specify locked-rotor current as either a direct value (amps), a multiple of FLA (e.g., 6×), or a NEMA Code Letter (A–V) per NEC 430.7(B), and compute the missing values automatically.
- **FR-003**: System MUST accept load characteristics: load-torque type (constant, fan/pump quadratic, linear) and reflected load inertia (WR² in lb-ft² or kg-m²) for acceleration-time calculation.

**Source Impedance Chain**
- **FR-004**: System MUST accept utility source data as either short-circuit MVA at the primary or three-phase short-circuit current with X/R ratio.
- **FR-005**: System MUST accept transformer data: rated kVA, primary/secondary voltage, %Z impedance, and X/R ratio (with sensible defaults if X/R not provided).
- **FR-006**: System MUST accept feeder cable data: conductor material (Cu/Al), size (AWG/kcmil or mm²), length, number of parallel runs, and conduit type (for impedance reactance).
- **FR-007**: System MUST compute the Thevenin equivalent impedance at the motor terminals from the source chain and display both per-unit and ohmic values.

**Starting Method Analysis**
- **FR-008**: System MUST analyze five starting methods: Direct-On-Line (DOL), Star-Delta (Y-Δ), Autotransformer (with user-selectable taps of 50%, 65%, 80%), Soft Starter (with user-selectable ramp time and initial-voltage setting), and Variable Frequency Drive (VFD).
- **FR-009**: For each method, the system MUST compute starting current as a percentage of FLA, starting torque as a percentage of full-load torque, voltage at the motor terminals during start, voltage dip at the PCC, and acceleration time.
- **FR-010**: System MUST compare computed acceleration time against the motor's safe stall time (cold and hot), and flag cases where acceleration time approaches or exceeds the thermal limit.

**Compliance Checks**
- **FR-011**: System MUST evaluate computed voltage dip at PCC against IEEE 1668-2017 limits and provide a pass/fail indicator with the applied threshold value.
- **FR-012**: System MUST cite the relevant code references in results: NEC 430.7 (motor data), NEC 430.52 (branch-circuit protection note), IEC 60034-12 (starting performance), IEEE 3002.7-2018 (analysis methodology), IEEE 1668 (voltage-dip limits).

**Comparison & Recommendation**
- **FR-013**: System MUST provide a side-by-side comparison view of all five methods showing: starting current %FLA, starting torque %FLT, voltage dip at PCC, acceleration time, qualitative cost rating, qualitative complexity rating, and a verdict badge (Recommended / Acceptable / Insufficient Torque / Excessive Dip / Not Applicable).
- **FR-014**: System MUST highlight the lowest-cost method that passes voltage-dip and torque criteria as "Recommended" and explain why other methods were ranked lower.

**Standards Switcher**
- **FR-015**: System MUST provide a toggle between NEC (North American) and IEC (international) modes that updates field labels, default units (HP↔kW, AWG↔mm²), motor design classes (NEMA A–D ↔ IEC N/H), and code citations.

**Output & Export**
- **FR-016**: System MUST produce two visualizations: a starting-current vs time curve overlaid with the motor thermal-limit (t6/stall) curve, and a voltage-dip indicator showing dip at PCC against the IEEE 1668 threshold.
- **FR-017**: System MUST allow the user to export the complete analysis (inputs, source chain, per-method results, comparison table, plots, citations) as a PDF report consistent with existing calculators in the suite.

**User Experience**
- **FR-018**: System MUST display tooltips on every input field explaining the parameter, expected units, typical range, and applicable code reference.
- **FR-019**: System MUST provide a Reference Guide dialog with side-by-side NEC vs IEC comparison covering motor design classes, code letters, voltage-dip limits, and starting-method guidance.
- **FR-020**: System MUST validate inputs and surface clear, actionable error messages (e.g., "FLA must be greater than 0", "Transformer %Z typically 4–7% for distribution transformers") rather than generic validation errors.

### Key Entities

- **Motor**: Represents the AC induction motor under analysis. Attributes: rated power, voltage, FLA, LRA (or code letter), poles, efficiency, PF, service factor, design class, thermal-limit curve (t6, stall time hot/cold), starting torque at full voltage.
- **Load**: Represents the mechanical load driven by the motor. Attributes: torque-speed characteristic (constant, quadratic, linear), break-away torque, reflected inertia (WR²).
- **Source Chain**: Represents the impedance path from utility to motor. Attributes: utility short-circuit MVA, X/R; transformer kVA, %Z, X/R; cable size, length, material, parallel runs; computed Thevenin Z at motor terminals.
- **Starting Method**: Represents one of five analysis methods. Attributes: method name, current multiplier on full voltage, torque multiplier on full voltage, method-specific parameters (Y-Δ closed/open transition, autotransformer tap, soft-starter ramp, VFD type), qualitative cost and complexity ratings.
- **Analysis Result**: Per-method output. Attributes: starting current (A and %FLA), starting torque (%FLT), voltage at motor terminals during start, voltage dip at PCC (% and V), acceleration time (s), thermal-limit margin, IEEE 1668 verdict.
- **Comparison Report**: Aggregate of all method results plus the recommended method and rationale, used for both on-screen display and PDF export.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete a single-method DOL analysis (enter motor, source, and run) in under 90 seconds starting from an empty form.
- **SC-002**: The five-method comparison view renders results in under 2 seconds on commodity hardware after the user clicks "Compare".
- **SC-003**: Computed voltage dip and locked-rotor current match published worked examples (IEEE 3002.7-2018 reference cases, NEMA MG 1 examples) within ±2% for all five methods.
- **SC-004**: At least 95% of users with electrical-engineering background can interpret the comparison-table verdict ("Recommended", "Insufficient Torque", "Excessive Dip") without consulting external documentation, validated through a 10-person usability check.
- **SC-005**: PDF export completes in under 10 seconds and produces a report containing every input, every per-method result, the comparison table, both plots, and citations to NEC 430, IEC 60034-12, IEEE 3002.7-2018, and IEEE 1668.
- **SC-006**: The standard switcher (NEC ↔ IEC) updates all relevant labels, units, design-class options, and citations within 200 ms with no broken inputs or stale values.
- **SC-007**: Unit-test coverage of the calculation core meets or exceeds 90% of statements, matching the bar set by Generator Sizing (56 tests) and Conduit Fill (63 tests).

## Assumptions

- The calculator covers AC squirrel-cage induction motors only. Synchronous motors, wound-rotor motors, and DC motors are out of scope and will surface a "Not supported" notice if selected.
- Single-motor-start analysis only. Coincident multi-motor starts and complex bus-load aggregation are deferred to a future enhancement.
- VFD analysis assumes a ramp-start with negligible inrush; bypass operation is treated as DOL.
- Source impedance assumes balanced three-phase steady-state. Unbalanced and harmonic effects are out of scope (covered separately by the Harmonic Analysis calculator).
- IEEE 1668 voltage-dip threshold defaults: 10% for steady-state common loads, 20% transient at PCC. The user may override the threshold for a specific facility.
- NEMA Code Letter values (kVA/HP) follow NEC 430.7(B) Table; IEC code values follow IEC 60034-12 Table 6.
- Cable impedance defaults follow NEC Chapter 9 Table 9 for AC; IEC values follow IEC 60364-5-52 / BS 7671 manufacturer averages.
- Motor thermal-limit curve defaults to NEMA MG 1 typical t6 values when the user does not provide a manufacturer-specific curve.

## Out of Scope (v1)

- Multi-motor coincident starting and bus-aggregate analysis
- Synchronous and wound-rotor motor starting
- DC motor starting
- Generator-set source modeling (a separate calculator already covers generator sizing for motor starting; results can be cross-referenced manually)
- Harmonic distortion during VFD operation (covered by Harmonic Analysis calculator)
- Arc flash incident energy during start (covered by future Arc Flash calculator)
- Time-domain transient simulation (calculator uses steady-state and quasi-static approximations consistent with IEEE 3002.7 hand-calculation methods)
