# Feature Specification: Arc Flash Calculator

**Feature Branch**: `012-arc-flash`
**Created**: 2026-10-04
**Status**: Draft
**Input**: User description: "Arc Flash Calculator per IEEE 1584-2018: compute incident energy (cal/cm²), arc flash boundary, arcing current (with variation correction), and PPE category (NFPA 70E-2024 Table 130.7(C)(15)(c) and incident-energy method) for electrical equipment. Inputs: system voltage (208V–15kV), bolted fault current, electrode configuration (VCB, VCBB, HCB, VOA, HOA), enclosure dimensions, gap between conductors, working distance, protective device clearing time (or arcing time). Outputs: arcing current (nominal and reduced), incident energy, arc flash boundary, PPE category and recommended clothing, arc flash label preview, PDF export. Dual-mode support consistent with existing ElectroMate calculators (NEC/IEC context, with IEC 61482 references where applicable), history sidebar, reference guide dialog, and unit tests."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calculate incident energy and arc flash boundary for one equipment location (Priority: P1)

An electrical engineer performing an arc flash study enters the parameters of a single piece of equipment (e.g., a 480 V switchboard): system voltage, bolted fault current, electrode configuration, conductor gap, enclosure dimensions, working distance and arcing time. The calculator returns the arcing current, the reduced arcing current (variation correction), the incident energy at the working distance and the arc flash boundary, all per IEEE 1584-2018.

**Why this priority**: Incident energy and arc flash boundary are the core deliverables of any arc flash assessment. Every other output (PPE, labels, reports) depends on them.

**Independent Test**: Enter the parameters of an IEEE 1584-2018 Annex D worked example and confirm that arcing current, incident energy and arc flash boundary match the published values within tolerance.

**Acceptance Scenarios**:

1. **Given** a 480 V, VCB configuration with valid gap, enclosure, working distance and arcing time, **When** the user calculates, **Then** the system shows the nominal arcing current, the reduced arcing current, the incident energy (cal/cm² and J/cm²) and the arc flash boundary (mm and in).
2. **Given** a calculation where the reduced arcing current produces a higher incident energy than the nominal current (because the reduced current gives a longer clearing time), **When** results are shown, **Then** the system reports the higher (governing) value and indicates which case governs.
3. **Given** an open-air configuration (VOA or HOA), **When** the user selects it, **Then** enclosure dimension inputs are hidden or disabled and no enclosure correction is applied.
4. **Given** a medium-voltage system (601 V–15 kV), **When** the user calculates, **Then** the system applies the IEEE 1584-2018 medium-voltage interpolation and shows results using the same output layout as low voltage.

---

### User Story 2 - Determine PPE category and recommended clothing (Priority: P1)

After calculating incident energy, the engineer needs the required arc-rated PPE so that workers can be told what to wear. The calculator assigns a PPE category (1–4) from the incident energy using the NFPA 70E-2024 thresholds and lists the clothing and equipment for that category. It also shows the minimum arc rating the clothing needs.

**Why this priority**: PPE selection is what the result is used for in the field. Incident energy without PPE guidance is incomplete for safety compliance.

**Independent Test**: Use incident energies of 1.0, 3.9, 7.5, 20 and 39 cal/cm² and confirm the reported categories are "below 1.2 cal/cm² threshold", 1, 2, 3 and 4. A value above 40 cal/cm² must show the danger state.

**Acceptance Scenarios**:

1. **Given** incident energy ≤ 4 cal/cm² (and ≥ 1.2 cal/cm²), **When** results are shown, **Then** the PPE category is 1 with minimum arc rating 4 cal/cm² and the matching clothing list.
2. **Given** incident energy > 40 cal/cm², **When** results are shown, **Then** the system shows a prominent DANGER state saying that no PPE category applies and that the equipment should be de-energized or the hazard mitigated.
3. **Given** the user selects the PPE category (table) method, **When** they choose an equipment type from NFPA 70E-2024 Table 130.7(C)(15)(a) and the system parameters fall within that row's limits, **Then** the table's PPE category and arc flash boundary are shown. If the parameters exceed the row's limits, the system states that the table method cannot be used and the incident energy method is required.

---

### User Story 3 - Generate arc flash label preview and PDF report (Priority: P2)

The engineer wants to document the result: an on-screen arc flash warning label with the content NFPA 70E 130.5(H) requires, and a PDF report containing the inputs, intermediate values, results, PPE, standards references and the label.

**Why this priority**: Labels and reports are needed for compliance documentation, but they depend on P1 results being correct first.

**Independent Test**: After a completed calculation, open the label preview and export the PDF. Confirm the label shows nominal voltage, arc flash boundary, incident energy with working distance (or PPE category), limited and restricted approach boundaries and the date. Confirm the PDF contains all inputs and results.

**Acceptance Scenarios**:

1. **Given** a completed calculation with incident energy below 40 cal/cm², **When** the user opens the label preview, **Then** a "WARNING" style label shows the required fields.
2. **Given** incident energy ≥ 40 cal/cm², **When** the user opens the label preview, **Then** a "DANGER" style label is shown.
3. **Given** a completed calculation, **When** the user exports PDF, **Then** a report downloads containing project/equipment identification, all inputs, the arcing current (nominal and reduced), the governing case, incident energy, arc flash boundary, PPE, shock approach boundaries, the label and the standards references.

---

### User Story 4 - Work in the NEC or IEC context (Priority: P2)

Users who work to IEC conventions (outside North America) want the same calculation presented with SI-first units and IEC 61482 clothing references, consistent with the dual-standard switcher in other ElectroMate calculators.

**Why this priority**: The rest of ElectroMate is used internationally and offers both modes. The calculation engine is the same, so this is presentation scope.

**Independent Test**: Toggle the standard switcher with the same inputs and confirm the numeric results do not change, while units, PPE references and label wording switch between NFPA 70E (NEC) and IEC 61482 presentations.

**Acceptance Scenarios**:

1. **Given** IEC mode, **When** results are shown, **Then** incident energy is shown primarily in J/cm² (with cal/cm² secondary), distances in mm, and the clothing requirement is expressed as a minimum arc rating (ATPV/ELIM per IEC 61482-1-1) together with the corresponding IEC 61482-2 guidance.
2. **Given** NEC mode, **When** results are shown, **Then** incident energy is primarily cal/cm², distances in inches (mm secondary), and PPE uses NFPA 70E categories.

---

### User Story 5 - Reuse past calculations and look up reference information (Priority: P3)

The engineer returns to earlier calculations from a history sidebar and consults a reference guide that explains electrode configurations, typical gaps and working distances by equipment class, and the PPE category table.

**Why this priority**: These features increase productivity and reduce input errors, but the calculator works without them.

**Independent Test**: Run three calculations, reload the page and confirm that all three appear in history and that restoring one repopulates inputs and results. Open the reference guide and confirm it contains the electrode configuration diagrams/descriptions and typical value tables.

**Acceptance Scenarios**:

1. **Given** saved calculations, **When** the user selects one in the history sidebar, **Then** all inputs and results are restored.
2. **Given** the user picks an equipment class (e.g., "LV switchgear", "MCC", "panelboard", "15 kV switchgear"), **When** the class is selected, **Then** the typical gap, enclosure size and working distance from IEEE 1584-2018 Table 8/Table 9 are pre-filled and the user can still edit them.

---

### Edge Cases

- **Reduced-current arcing time shorter than nominal**: allowed, but a non-blocking warning is shown, because inverse-time devices normally clear more slowly at lower current.

- **Inputs outside the IEEE 1584-2018 model range** (voltage < 208 V or > 15 kV; bolted fault current outside 500 A–106 kA for 208–600 V or 200 A–65 kA for 601 V–15 kV; gap outside the per-voltage-class range; working distance < 305 mm): the system blocks calculation or shows a clear out-of-range warning that cites the limit violated. It never extrapolates silently.
- **208–240 V systems** supplied by transformers with low available fault current: show an informational note on the sustainability of arcs at low voltage per IEEE 1584-2018, but still calculate.
- **Enclosure dimensions** outside the model limits (height/width > 1244.6 mm, or width smaller than 4 × gap): apply the standard's prescribed handling (cap or use the limit value) and display a note.
- **Very long arcing times** (> 2 s): show a warning that IEEE 1584 guidance allows a 2 s cap when a worker can reasonably escape, and let the user choose whether to apply it.
- **Zero or negative inputs** and non-numeric entry: field-level validation errors; calculation disabled until resolved.
- **Incident energy below 1.2 cal/cm²**: report that the arc flash boundary is at or inside the working distance and no arc-rated PPE category is required (non-melting clothing still required per NFPA 70E). The arc flash boundary is still shown.
- **Incident energy above 40 cal/cm²**: DANGER state (User Story 2).
- **Frequency**: 50 Hz and 60 Hz systems are both accepted. The model applies to either.
- **DC systems**: out of scope. The UI states that the calculator is AC only.

## Requirements *(mandatory)*

### Functional Requirements

**Calculation (IEEE 1584-2018)**

- **FR-001**: System MUST accept system line-to-line voltage from 208 V to 15,000 V, three-phase bolted fault current in kA, electrode configuration (VCB, VCBB, HCB, VOA, HOA), gap between conductors (mm), working distance (mm or in), enclosure height/width/depth (mm or in, for enclosed configurations) and arcing time (ms or s).
- **FR-002**: System MUST calculate the nominal arcing current using the IEEE 1584-2018 model, including the intermediate-voltage interpolation for systems above 600 V.
- **FR-003**: System MUST calculate the reduced arcing current using the IEEE 1584-2018 arcing-current variation correction factor, and compute incident energy and arc flash boundary for both the nominal and reduced arcing current cases.
- **FR-004**: System MUST report the governing (higher) incident energy and its arc flash boundary, and identify which case governs.
- **FR-005**: System MUST apply the IEEE 1584-2018 enclosure size correction factor for enclosed configurations (VCB, VCBB, HCB), including the "typical" vs "shallow" enclosure distinction, and MUST NOT apply it for open-air configurations.
- **FR-006**: System MUST calculate the arc flash boundary as the distance at which incident energy equals 1.2 cal/cm² (5.0 J/cm²).
- **FR-007**: System MUST accept two user-entered arcing (clearing) times: one at the nominal arcing current and one at the reduced arcing current, each read from the protective device's time-current curve. Each time MUST be used for its own case's incident energy and arc flash boundary. The system MUST offer a "same time for both" convenience option that copies the nominal time to the reduced case, and show a note that the reduced-current time is normally equal to or longer than the nominal one. If the reduced-current time entered is shorter, the system MUST show a non-blocking warning. Automatic derivation of clearing times from a selected protective device is out of scope for this feature.
- **FR-008**: System MUST validate every input against the IEEE 1584-2018 model applicability ranges (see Edge Cases) and display the violated limit when an input is out of range.
- **FR-009**: System MUST show intermediate values (e.g., per-voltage-level arcing currents for MV interpolation, enclosure correction factor, variation correction factor) in an expandable "calculation details" section.

**PPE and boundaries (NFPA 70E-2024 / IEC 61482)**

- **FR-010**: System MUST map governing incident energy to NFPA 70E PPE categories: Category 1 (≤ 4 cal/cm²), 2 (≤ 8), 3 (≤ 25), 4 (≤ 40). Above 40 cal/cm² it MUST show a DANGER state with no PPE category.
- **FR-011**: System MUST list the clothing and PPE items for the assigned category per NFPA 70E-2024 Table 130.7(C)(15)(c) (equipment-type table for the table method is 130.7(C)(15)(a)) and state the minimum arc rating required.
- **FR-012**: System MUST offer the PPE category (table) method as an alternative. The user selects an equipment type and the system shows the table's PPE category and arc flash boundary only when the inputs (voltage, available fault current, clearing time, working distance) satisfy that row's parameters. Otherwise it MUST say that the incident energy method is required.
- **FR-013**: System MUST show the limited approach boundary and restricted approach boundary for the nominal voltage per NFPA 70E-2024 Table 130.4(E)(a).
- **FR-014**: In IEC mode, System MUST express the clothing requirement as a minimum arc rating (ATPV or ELIM, per IEC 61482-1-1) that must be ≥ the governing incident energy, and reference IEC 61482-2 for garment requirements.

**Presentation, output and persistence**

- **FR-015**: System MUST provide a standard switcher (NEC / IEC) consistent with other ElectroMate calculators. Switching changes units, PPE presentation and label wording, but not the numeric calculation.
- **FR-016**: System MUST let users pre-fill gap, enclosure size and working distance from an equipment class selector based on IEEE 1584-2018 typical values. All pre-filled values stay editable.
- **FR-017**: System MUST render an arc flash label preview containing: signal word (WARNING below 40 cal/cm², DANGER at or above), nominal voltage, arc flash boundary, incident energy at the working distance or PPE category, minimum arc rating, limited and restricted approach boundaries, equipment identifier and calculation date.
- **FR-018**: System MUST export a PDF report containing equipment identification, all inputs, intermediate values, results for both arcing current cases, the governing result, PPE, approach boundaries, the label and the standards references.
- **FR-019**: System MUST save completed calculations to a history sidebar that persists across page reloads on the same device, and restore inputs and results when an entry is selected.
- **FR-020**: System MUST provide a reference guide dialog that explains electrode configurations, typical equipment values, the PPE category thresholds, model limitations and the standards cited.
- **FR-021**: System MUST show a disclaimer that results support, but do not replace, an engineered arc flash risk assessment by a qualified person.
- **FR-022**: The calculator MUST be reachable from the existing navigation under Protection & Safety.

**Verification**

- **FR-023**: The calculation logic MUST be covered by automated tests, including reproduction of the IEEE 1584-2018 Annex D worked examples, PPE category boundaries (4/8/25/40 cal/cm² edges), range validation and both arcing current cases.

### Key Entities

- **Arc Flash Input**: equipment identifier, system voltage, frequency, bolted fault current, electrode configuration, gap, working distance, enclosure dimensions (if enclosed), arcing time at nominal arcing current, arcing time at reduced arcing current, equipment class (optional), selected standard mode.
- **Arc Flash Result**: nominal arcing current, reduced arcing current, incident energy per case, arc flash boundary per case, governing case, enclosure correction factor, variation correction factor, warnings.
- **PPE Assessment**: method (incident energy or table), PPE category or DANGER state, minimum arc rating, clothing list, limited/restricted approach boundaries, standard references (NFPA 70E or IEC 61482).
- **Arc Flash Label**: signal word, the required field values derived from Result and PPE Assessment, date.
- **History Entry**: timestamp, equipment identifier, the Input and Result snapshot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Arcing current, incident energy and arc flash boundary for every IEEE 1584-2018 Annex D worked example are reproduced within ±2% of the published values.
- **SC-002**: PPE category assignment is correct for 100% of test values at and on either side of the 1.2, 4, 8, 25 and 40 cal/cm² thresholds.
- **SC-003**: An engineer familiar with arc flash studies can complete a single-equipment calculation, from opening the page to viewing PPE, in under 2 minutes using equipment class pre-fill.
- **SC-004**: 100% of out-of-range inputs produce a visible message that names the violated limit. No result is shown from silently extrapolated inputs.
- **SC-005**: Results appear within 1 second of the user requesting a calculation.
- **SC-006**: Switching between NEC and IEC modes leaves numeric results unchanged (to 4 significant figures) for the same inputs.
- **SC-007**: The exported PDF contains every input and result field shown on screen, plus the label.

## Assumptions

- The IEEE 1584-2018 empirical model (not the 2002 edition) is the only calculation method. Lee method and DC arc flash are out of scope.
- Each calculation covers one equipment location (bus). Multi-bus studies, one-line diagrams and short-circuit/coordination studies are out of scope. Bolted fault current is supplied by the user (it can come from the existing Short Circuit calculator).
- No international standard gives an IEC-native incident energy model in common use, so IEC mode uses the IEEE 1584-2018 calculation with IEC 61482 clothing references. The IEC 61482-1-2 box test classes (APC 1/APC 2) are referenced as informational guidance only, because they are not a direct function of incident energy.
- Typical gap, enclosure size and working distance values come from IEEE 1584-2018 typical equipment tables.
- History is stored locally on the user's device, consistent with other ElectroMate calculators. No accounts or server storage.
- The shock approach boundaries use AC values from NFPA 70E-2024 Table 130.4(E)(a).

## Out of Scope

- DC arc flash calculations.
- Multi-bus arc flash studies, one-line diagram import and automatic short-circuit or coordination studies.
- Printable label stock formatting beyond the on-screen preview and the PDF.
- Deriving clearing times automatically from a selected breaker, fuse or relay time-current curve (candidate for a later phase).
- Arc flash mitigation design (e.g., maintenance switch sizing, arc-resistant switchgear evaluation), beyond showing the effect of a user-entered shorter arcing time.
