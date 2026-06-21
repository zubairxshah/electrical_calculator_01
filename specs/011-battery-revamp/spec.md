# Feature Specification: Battery Calculator Revamp — Standards-Based Sizing & UX Redesign

**Feature Branch**: `011-battery-revamp`
**Created**: 2026-06-21
**Status**: Draft
**Input**: User description: "Battery Calculator revamp — rework the existing Battery sizing engine and page into a stringent, standards-based battery/UPS sizing tool, plus a UI/UX redesign aligned to the new ElectroMate Design System."

## Overview

The current Battery Calculator estimates backup time with a first-order energy-over-load formula. The selected battery chemistry is collected but never used, and the chemistry options shown to users do not match the rich reference dataset the product already maintains. This feature reworks the calculator into a stringent, standards-based battery/UPS sizing tool that respects per-chemistry limits and real engineering derating, supports both "how long will it last" and "how big must it be" workflows, surfaces actionable recommendations, and presents all of this through a redesigned interface aligned to the new ElectroMate Design System.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trustworthy runtime estimate that respects chemistry (Priority: P1)

An engineer enters their system voltage, load, installed battery capacity, battery chemistry, and operating conditions, and receives a backup-time estimate that correctly accounts for the usable depth of discharge, end-of-life aging, temperature, and high-rate discharge behavior of the selected chemistry — not a single generic formula that ignores the battery type.

**Why this priority**: This is the core defect being fixed. Today two very different chemistries return identical answers, which is misleading and undermines trust in every result the tool produces. Correctness of the primary number is the foundation everything else builds on.

**Independent Test**: Select two different chemistries (e.g., flooded lead-acid vs. LiFePO4) with otherwise identical inputs and confirm the backup-time results differ in line with their published usable-DoD and rate behavior; confirm the result changes appropriately when operating temperature is moved away from the reference temperature.

**Acceptance Scenarios**:

1. **Given** identical voltage, load, and capacity, **When** the user switches chemistry from VRLA-AGM to Li-Ion-LFP, **Then** the usable-capacity and backup-time results change to reflect each chemistry's recommended depth of discharge.
2. **Given** a selected chemistry and a high discharge current (short autonomy), **When** the result is computed, **Then** the usable capacity is derated for the high C-rate and the result is lower than a naive ampere-hour ÷ current estimate.
3. **Given** an operating temperature below the chemistry's optimal range, **When** the result is computed, **Then** the available capacity is reduced by the temperature correction and a margin note explains it.
4. **Given** an end-of-life design basis, **When** the result is computed, **Then** the sizing reflects capacity at 80% (aging design margin) rather than nameplate capacity.

---

### User Story 2 - Size the battery bank for a required backup time (Priority: P1)

An engineer specifies a target backup time, the load, the system voltage, the chemistry, and operating conditions, and the tool solves for the required battery capacity and a concrete bank configuration (cells/blocks in series and strings in parallel), applying the same standards-based derating in reverse.

**Why this priority**: Sizing for a target autonomy is the primary real-world design task the reference methodology is built around; a runtime-only calculator cannot answer "what do I need to buy." This makes the tool a design instrument, not just an estimator.

**Independent Test**: Provide a load, target backup time, voltage, and chemistry; confirm the tool returns a required capacity in ampere-hours and a valid series/parallel configuration whose delivered runtime (when fed back through Story 1) meets or exceeds the target.

**Acceptance Scenarios**:

1. **Given** a load, target backup time, system voltage, and chemistry, **When** the user runs sizing, **Then** the tool returns the minimum required ampere-hour capacity including DoD, temperature, efficiency, and aging factors.
2. **Given** a required capacity and a nominal cell/block voltage, **When** sizing completes, **Then** the tool reports the number of cells/blocks in series and the number of parallel strings needed to meet both voltage and capacity.
3. **Given** a sizing result, **When** the user views recommendations, **Then** the recommended continuous C-rate, the DoD used, the EOL margin, and the temperature margin are shown with a pass/marginal/fail verdict.

---

### User Story 3 - Few inputs, sensible defaults, clear recommendations (Priority: P2)

A less specialised user provides only the essentials (load, voltage or system type, desired backup time or installed capacity, chemistry) and still receives a proper, defensible sizing, because the tool fills in DoD ceiling, round-trip efficiency, temperature coefficient, and recommended limits from its chemistry reference data, and explains each assumption it made.

**Why this priority**: Approachability is an explicit product goal. Power users can override, but the default path must produce a correct, well-explained answer without requiring the user to know every derating factor.

**Independent Test**: Enter only load, voltage, chemistry, and target backup time; confirm a complete sizing result is produced and that every applied factor (DoD, efficiency, temperature, aging) is shown with its source/assumption.

**Acceptance Scenarios**:

1. **Given** only the essential inputs, **When** the result is computed, **Then** all derating factors are auto-populated from chemistry reference data and clearly labelled as defaults.
2. **Given** an auto-populated default, **When** the user overrides it, **Then** the result recalculates using the override and marks the value as user-supplied.
3. **Given** a completed result, **When** the user reviews it, **Then** a plain-language recommendation summarises whether the design is sound and what to change if it is not.

---

### User Story 4 - Manufacturer datasheet selection (Priority: P2)

An engineer selects a real battery model from a small library of manufacturer datasheets, which pre-fills nominal voltage, capacity, chemistry, rate characteristics, and temperature behavior, so the sizing reflects a specific product rather than generic chemistry averages.

**Why this priority**: Designs are ultimately specified against real models; a curated datasheet library bridges generic chemistry sizing and procurement, and is a prerequisite for the later OCR/AI datasheet-reading capability.

**Independent Test**: Pick a model from the library; confirm its published parameters populate the inputs and that the sizing result reflects the model's specific capacity and rate characteristics.

**Acceptance Scenarios**:

1. **Given** the datasheet library, **When** the user selects a battery model, **Then** its published parameters populate the relevant inputs and are marked as sourced from that datasheet.
2. **Given** a selected model, **When** the user changes chemistry to one inconsistent with the model, **Then** the tool warns of the mismatch.

---

### User Story 5 - Redesigned, design-system-aligned experience with export (Priority: P2)

A user works on a clean, modern Battery page where the headline result (backup time or required capacity) is visually prominent, inputs and results sit side-by-side on larger screens with results staying in view while inputs change, and a finished design can be exported to a shareable PDF report.

**Why this priority**: The redesign and re-enabled export turn a correct calculation into a usable, presentable deliverable, and align the page with the rest of the product's emerging design system.

**Independent Test**: On a desktop viewport, confirm input and results are presented side-by-side with the headline metric emphasised and results remaining visible while editing inputs; trigger export and confirm a PDF report containing inputs, results, factors, and standards references is produced.

**Acceptance Scenarios**:

1. **Given** a completed calculation on a wide screen, **When** the user views the page, **Then** the headline result is visually dominant and the results panel remains visible while inputs are edited.
2. **Given** a completed calculation, **When** the user exports, **Then** a PDF report is generated containing inputs, the headline result, all applied factors, recommendations, and standards references.
3. **Given** any viewport, **When** the page is used on mobile, **Then** the layout reflows to a single readable column without loss of function.

---

### User Story 6 - Read parameters from an uploaded datasheet (Priority: P3, stretch)

A user uploads a manufacturer datasheet file and the tool extracts the key battery parameters automatically to pre-fill the inputs, reducing manual transcription.

**Why this priority**: High convenience value but the most technically involved and least certain; explicitly a phase-2 stretch that must not block the standards-based sizing MVP.

**Independent Test**: Upload a representative datasheet and confirm extracted parameters are presented for user confirmation before being applied, with manual entry always available as a fallback.

**Acceptance Scenarios**:

1. **Given** an uploaded datasheet, **When** extraction completes, **Then** detected parameters are shown for review and require user confirmation before populating inputs.
2. **Given** extraction fails or is low-confidence, **When** the user is notified, **Then** manual entry or library selection remains fully available.

---

### Edge Cases

- Target backup time or load of zero, or values exceeding sane engineering ranges, are rejected with clear guidance rather than producing a result.
- Operating temperature at or beyond the chemistry's rated operating limits produces a strong warning and either refuses or heavily derates, never silently returns an optimistic number.
- A required capacity that cannot be met by a whole number of strings rounds up to the next achievable configuration, and the resulting over-capacity is disclosed.
- A discharge rate beyond the chemistry's safe continuous rate triggers a high-rate warning and rate-based capacity derating.
- An aging factor implying the bank is already at or past end-of-life surfaces a replacement recommendation.
- A user override that is physically implausible (e.g., DoD above the chemistry maximum) is flagged and either clamped or warned.
- Datasheet selection that conflicts with separately chosen chemistry is reconciled with a warning.

## Requirements *(mandatory)*

### Functional Requirements

**Sizing engine**

- **FR-001**: System MUST compute backup time from installed capacity using a method that incorporates usable depth of discharge, round-trip/system efficiency, end-of-life aging margin, temperature correction, and discharge-rate (C-rate) derating for the selected chemistry.
- **FR-002**: System MUST compute required battery capacity for a user-specified target backup time, applying the same depth-of-discharge, efficiency, aging, temperature, and rate factors in reverse.
- **FR-003**: System MUST apply per-chemistry recommended depth-of-discharge ceilings drawn from the product's battery reference data rather than a single global value.
- **FR-004**: System MUST apply an end-of-life aging design margin (default equivalent to sizing for 80% remaining capacity) and allow it to be overridden.
- **FR-005**: System MUST apply a temperature correction based on the chemistry's temperature characteristics and the user's operating temperature, and disclose the correction applied.
- **FR-006**: System MUST derate usable capacity for high discharge rates (short autonomy) and report the effective continuous C-rate.
- **FR-007**: System MUST report a recommended bank configuration: number of cells/blocks in series to meet system voltage and number of parallel strings to meet required capacity.
- **FR-008**: System MUST output, for every result, the depth of discharge used, the recommended C-rate, the end-of-life margin, the temperature margin, and a plain-language pass/marginal/fail sizing verdict.
- **FR-009**: System MUST cite the governing standards for the methodology and per-result factors (IEEE 485 for lead-acid sizing, IEC battery standards, and NEC where applicable).

**Data correctness**

- **FR-010**: System MUST present chemistry options that map one-to-one to the product's battery reference dataset, eliminating the current mismatch between displayed options and reference data.
- **FR-011**: System MUST source default derating inputs (depth of discharge, efficiency, temperature coefficient, rate/cycle characteristics) from the battery reference dataset for the selected chemistry.

**Inputs & usability**

- **FR-012**: Users MUST be able to obtain a complete, defensible sizing from a minimal essential input set, with all unspecified factors auto-populated from reference data and clearly labelled as defaults.
- **FR-013**: Users MUST be able to override any auto-populated factor, with overridden values visibly distinguished from defaults.
- **FR-014**: System MUST validate inputs against engineering ranges and per-chemistry limits, providing actionable error and warning messages.
- **FR-015**: Users MUST be able to switch between runtime mode (solve backup time) and sizing mode (solve required capacity).

**Datasheets**

- **FR-016**: Users MUST be able to select a battery model from a curated manufacturer datasheet library that pre-fills relevant inputs, marked as sourced from that model.
- **FR-017**: System SHOULD allow uploading a datasheet for automated parameter extraction with user confirmation before applying, treated as a phase-2 capability that does not block the sizing MVP, with manual entry/library selection always available as fallback.

**Presentation & output**

- **FR-018**: System MUST present a redesigned Battery page aligned to the ElectroMate Design System, with the headline result visually dominant.
- **FR-019**: System MUST present inputs and results side-by-side on larger screens with the results remaining visible while inputs are edited, and reflow to a single column on small screens.
- **FR-020**: Users MUST be able to export a calculation as a PDF report containing inputs, the headline result, all applied factors, recommendations, and standards references.

### Key Entities *(include if feature involves data)*

- **Battery Chemistry Profile**: A named chemistry (e.g., VRLA-AGM, VRLA-GEL, Li-Ion-LFP/NMC/LTO, NiCd, NiFe, Vanadium Flow) with recommended and maximum depth of discharge, round-trip efficiency, temperature characteristics and coefficient, rate/cycle-life characteristics, and standards references. Source of all per-chemistry defaults.
- **Sizing Input Set**: System voltage, load, mode (runtime vs. sizing), installed capacity or target backup time, selected chemistry, operating temperature, and optional overrides for each derating factor.
- **Sizing Result**: Headline value (backup time or required capacity), effective usable capacity, applied factors (DoD, efficiency, temperature, aging, C-rate), recommended bank configuration (series/parallel), verdict, warnings, and standards references.
- **Manufacturer Datasheet Entry**: A specific battery model mapping to a chemistry profile, with published nominal voltage, capacity, rate characteristics, and temperature behavior; the basis of library selection and (later) upload extraction.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For identical inputs, changing the selected chemistry changes the headline result in 100% of cases where the chemistries have different usable-DoD or rate characteristics (today: 0%).
- **SC-002**: Every chemistry option shown to the user maps to a reference-data profile, with zero unmapped or mismatched options.
- **SC-003**: A user can produce a complete, defensible sizing — including required capacity, bank configuration, applied factors, and verdict — from the minimal essential inputs in under two minutes.
- **SC-004**: Every result displays the depth of discharge used, recommended C-rate, end-of-life margin, temperature margin, and a verdict, with the governing standard(s) cited for the method.
- **SC-005**: A required-capacity sizing result, when its recommended configuration is fed back through the runtime calculation, meets or exceeds the requested backup time in 100% of valid cases.
- **SC-006**: Users can export a complete PDF report of a calculation, and on wide screens the results panel remains visible while inputs are edited.
- **SC-007**: Sizing results agree with worked examples from the cited standards/reference methodology within the product's stated calculation accuracy target.

## Assumptions

- The product's existing battery reference dataset is the authoritative source for per-chemistry derating defaults; this feature wires it into sizing rather than introducing a new dataset.
- NEC's contribution is primarily installation/safety guidance (e.g., ventilation, disconnects, listings) surfaced as warnings and references, while the quantitative sizing method follows IEEE 485 and the IEC battery standards.
- The end-of-life design basis defaults to 80% remaining capacity (a 1.25 aging factor), consistent with common stationary-battery practice, and is user-overridable.
- The manufacturer datasheet library launches as a small curated set covering the supported chemistries; breadth can grow later and is not a sizing-correctness dependency.
- Automated datasheet extraction (Story 6) is a phase-2 stretch; the MVP is complete and shippable with manual entry and library selection only.
- The redesign reuses the shared component patterns captured in the ElectroMate Design System (calculation card, input field, result display, warning banner) rather than introducing a separate visual language.

## Out of Scope

- Full battery lifecycle/cost modelling and chemistry-comparison recommendations (covered by the separate Battery Comparison tool).
- Charger/rectifier and PV array sizing (covered by other calculators).
- Real-time monitoring, BMS integration, or live telemetry.
- Procurement, pricing, or availability lookups against manufacturer catalogues.
