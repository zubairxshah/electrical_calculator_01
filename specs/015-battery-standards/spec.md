# Feature Specification: Battery Calculator Standards Hardening

**Feature Branch**: `015-battery-standards`
**Created**: 2026-10-14
**Status**: Draft
**Input**: User description: "Harden the existing /battery calculator (extend in place, no new page) into a solid, standards-compliant battery sizing tool: application mode (standby/float vs cycling), efficiency fix, design margin, end-of-discharge voltage and cell count, IEEE 485 temperature table, charger sizing, battery-room ventilation, NEC 480/706 and NFPA 855 checks; plus deferred 011 polish (defaults test, accessibility, reference guide). Multi-period duty cycle is out of scope."

## Background

A gap review on 2026-10-14 found that the battery calculator (feature 011, merged via PR #5):

- Applies the chemistry's cycling depth-of-discharge limit (50 % for lead-acid) **and** the end-of-life aging factor to every design, including standby/UPS banks. IEEE 485 sizes standby banks to a full discharge to the end voltage, so lead-acid standby banks come out roughly twice as large as they should.
- Uses the battery's round-trip (charge + discharge) efficiency in a discharge-only calculation, and has no input for inverter/converter efficiency.
- Has no design margin, no end-of-discharge voltage per cell, and derives the series count from a fixed block voltage rather than the load's voltage window. An existing "minimum voltage" input is collected but never used.
- Uses a linear temperature coefficient for lead-acid instead of the IEEE 485 electrolyte-temperature correction table.
- Gives no charger sizing, ventilation or installation-code guidance.
- Ignores the temperature-factor and Peukert overrides when deciding whether a cached result can be reused, so changing only those overrides can show a stale result.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Correct standby (UPS/DC backup) sizing (Priority: P1)

An engineer sizing a UPS or substation DC battery picks "Standby / float" (the default), enters load, backup time, chemistry and lowest electrolyte temperature, and gets a capacity that follows IEEE 485: full discharge to the end voltage, temperature correction, design margin and aging factor, with load-side conversion efficiency applied and no cycling depth-of-discharge cap.

**Why this priority**: This fixes the main calculation error. Standby is the most common use of this page, and today it oversizes lead-acid banks by about 2×.

**Independent Test**: Size a 48 V, 2 kW, 2 h VRLA standby bank at 25 °C and check that the required capacity equals Load × Time / (V × η_conv) × design margin × aging (1.25) × temperature factor, with no 50 % DoD division.

**Acceptance Scenarios**:

1. **Given** a new user with no saved state, **When** they open /battery, **Then** the application is "Standby / float" and the design margin is 1.10.
2. **Given** standby mode, **When** they size a bank, **Then** the applied-factors table lists design margin, aging, temperature, conversion efficiency and rate (Peukert) factors, and shows no DoD factor (or shows it as 100 % "full discharge to end voltage").
3. **Given** cycling mode, **When** they size the same bank, **Then** the chemistry's recommended DoD is applied as before, together with design margin and aging.
4. **Given** a user with state saved by the previous version, **When** they reload the page, **Then** their inputs are kept and the application is set to "Standby / float".
5. **Given** any mode, **When** the user overrides the design margin, conversion efficiency, temperature factor or Peukert exponent, **Then** the result is recalculated (no stale cached result) and the factor's source shows "user".
6. **Given** runtime mode (installed Ah known), **When** they calculate, **Then** the same factors are applied in the forward direction, and sizing→runtime round-trips to the target backup time within 1 % (before rounding up to whole strings).

---

### User Story 2 - Voltage window, end voltage and cell count (Priority: P1)

The engineer enters the DC load's maximum and minimum allowed voltage (or accepts defaults) and the chemistry's end-of-discharge voltage per cell. The tool computes the number of series cells from the voltage window, checks that the float/equalize voltage stays within the maximum, and shows the bank's end voltage.

**Why this priority**: Cell count and end voltage are core IEEE 485 inputs. The capacity a battery can deliver depends on the end voltage it is discharged to.

**Independent Test**: For a 125 V DC system with a 105 V minimum and lead-acid at 1.75 V/cell, the tool gives 60 cells (105 / 1.75 = 60) and warns if 60 cells × float voltage per cell exceeds the entered maximum.

**Acceptance Scenarios**:

1. **Given** a minimum load voltage and end voltage per cell, **When** they calculate, **Then** cells in series = floor(V_min / V_end-per-cell), shown with the resulting nominal, float and end-of-discharge bank voltages.
2. **Given** a maximum load voltage, **When** cells × float (or equalize) voltage per cell exceeds it, **Then** a warning explains the conflict and suggests fewer cells or a voltage regulator.
3. **Given** no voltage window entered, **When** they calculate, **Then** the tool falls back to the current block-based series count and the chemistry's default end voltage, and says so in the results.
4. **Given** a chemistry change, **When** the user has not overridden the end voltage, **Then** the end voltage per cell updates to that chemistry's default.

---

### User Story 3 - IEEE 485 temperature correction for lead-acid (Priority: P2)

For lead-acid chemistries, the temperature factor comes from the IEEE 485 electrolyte-temperature correction table (interpolated) instead of a linear coefficient. Other chemistries keep their coefficient model.

**Why this priority**: The current model under-corrects in cold rooms and gives no credit above 25 °C. The impact is smaller than US1 and US2.

**Independent Test**: At 25 °C the lead-acid correction is 1.00; at a table temperature the factor matches the table value exactly; between table rows the factor is linearly interpolated.

**Acceptance Scenarios**:

1. **Given** a lead-acid chemistry at a table temperature, **When** they calculate, **Then** the cell-size correction factor equals the table value.
2. **Given** a temperature outside the table range, **When** they calculate, **Then** the nearest end value is used and a warning is raised.
3. **Given** a non-lead-acid chemistry, **When** they calculate, **Then** the temperature factor behaves exactly as before.

---

### User Story 4 - Charger sizing and recharge time (Priority: P2)

After sizing the bank, the engineer sees the charger output current needed to recharge the bank within a chosen recharge time while also carrying the continuous standing load, plus the nearest standard charger rating.

**Why this priority**: Every standby battery needs a charger. Engineers currently have to do this calculation by hand.

**Independent Test**: For 200 Ah removed, an 8 h recharge time, a recharge factor of 1.10 and a 10 A standing load, the charger current is 200 × 1.10 / 8 + 10 = 37.5 A.

**Acceptance Scenarios**:

1. **Given** a sized or installed bank, **When** they enter a recharge time and standing (continuous) DC load, **Then** the charger current = Ah removed × recharge factor / recharge hours + standing load current.
2. **Given** a chemistry, **When** no recharge factor is entered, **Then** a chemistry default is used (lead-acid 1.10–1.15, nickel 1.20–1.40, lithium ≈ 1.05) and labelled as a default.
3. **Given** the computed current, **When** results are shown, **Then** the next standard charger rating up is recommended, and a warning is raised if the recharge current exceeds the chemistry's maximum charge rate.

---

### User Story 5 - Battery room ventilation (Priority: P3)

For vented and VRLA lead-acid and for nickel batteries, the tool computes the airflow needed to keep hydrogen below the safety limit during charging, using the EN 50272-2 / IEC 62485-2 method.

**Why this priority**: This is a safety requirement for battery rooms, but it is a secondary output of a sizing tool.

**Independent Test**: For 24 VRLA cells of 200 Ah on float, the required airflow Q = 0.05 × n × I_gas × C_rt / 1000 m³/h, using the approved default gas-current values.

**Acceptance Scenarios**:

1. **Given** a lead-acid or nickel chemistry, **When** results are shown, **Then** the required airflow in m³/h is shown for float and boost charging, with the I_gas value used and its source.
2. **Given** a lithium or flow chemistry, **When** results are shown, **Then** ventilation is shown as "not applicable (no hydrogen evolution in normal operation)", with a pointer to the manufacturer's and NFPA 855 requirements.
3. **Given** a room volume entered (optional), **When** results are shown, **Then** the equivalent air changes per hour are shown.

---

### User Story 6 - Installation and code checks (Priority: P3)

The results include warnings tied to the installation codes: NEC 480 (storage batteries, e.g. a disconnect, and ventilation for battery systems above 60 V nominal), NEC 706 (energy storage systems, by energy threshold), and NFPA 855 (lithium-ion energy thresholds that trigger room and spacing requirements).

**Why this priority**: These are informative compliance flags. They don't change the size.

**Independent Test**: A lithium-ion bank whose stored energy exceeds the approved NFPA 855 threshold triggers the NFPA 855 warning. A bank below the threshold does not.

**Acceptance Scenarios**:

1. **Given** a computed bank energy (kWh) and chemistry, **When** it exceeds the approved threshold for that chemistry, **Then** an NFPA 855 info/warning appears with the threshold and the clause.
2. **Given** a bank nominal voltage above 60 V DC, **When** results are shown, **Then** the NEC 480 disconnect and protection notes appear.
3. **Given** any code check, **When** shown, **Then** it never changes the computed capacity and is labelled "installation check".

---

### User Story 7 - Polish: defaults test, accessibility, reference guide (Priority: P3)

Deferred items from 011: a test proving that unspecified factors resolve to chemistry defaults (source "default") and that overrides flip to "user"; WCAG 2.1 AA labels and focus states on the battery components; and a reference-guide dialog summarising the standards and method, matching the conduit-fill and motor-starting dialogs.

**Why this priority**: Quality and consistency work that doesn't change any results.

**Independent Test**: The defaults test passes; every battery input has a programmatic label; the reference-guide dialog opens from the page header and lists IEEE 485, IEEE 1013/1561, IEEE 946, IEC 62485-2/EN 50272-2, NEC 480/706 and NFPA 855.

**Acceptance Scenarios**:

1. **Given** the battery form, **When** navigated by keyboard only, **Then** every control is reachable, has a visible focus ring and an accessible name.
2. **Given** the page, **When** the user opens "Reference guide", **Then** a dialog explains each factor, its default and its source standard.

### Edge Cases

- Voltage window impossible: V_min / V_end gives a cell count whose float voltage exceeds V_max → error-level warning, result still shown.
- V_min ≥ V_max, or end voltage per cell ≤ 0 → validation error on the field.
- Design margin < 1.0 → validation error (range 1.00–1.50).
- Conversion efficiency outside 0.50–1.00 → validation error.
- Recharge time ≤ 0 → charger section hidden with a field error; sizing still works.
- Temperature beyond the correction table range → clamp to the end value and warn.
- Cycling mode with DoD override above the chemistry maximum → clamped, with the existing warning.
- Saved state from version 1 with a user-set `efficiency` (round-trip meaning) → migrated so it is not misread as conversion efficiency (dropped, with the default restored).
- Runtime mode with no voltage window → block-based series count as today.

## Requirements *(mandatory)*

### Functional Requirements

**Application mode & method (US1)**

- **FR-001**: The system MUST offer an application selector with "Standby / float" (IEEE 485) and "Cycling" (IEEE 1013 / IEEE 1561), defaulting to Standby / float.
- **FR-002**: In standby mode the system MUST NOT apply the chemistry's cycling DoD limit. Capacity is sized to the full discharge to the end-of-discharge voltage.
- **FR-003**: In cycling mode the system MUST apply the chemistry's recommended DoD (with the existing override and clamp behaviour).
- **FR-004**: The system MUST apply a design margin factor (default 1.10, range 1.00–1.50, user-overridable) separate from the aging factor.
- **FR-005**: The system MUST keep the aging factor (default 0.8 remaining capacity at end of life ≡ ×1.25) and allow an override.
- **FR-006**: The system MUST apply a load-side conversion efficiency (inverter / DC-DC; default 0.95 for AC loads via inverter, user-overridable, range 0.50–1.00) and MUST NOT apply battery round-trip efficiency in discharge sizing.
- **FR-007**: The system MUST offer a "load type" choice: DC load (conversion efficiency defaults to 1.00) or AC load via inverter (defaults to 0.95).
- **FR-008**: Sizing (reverse) and runtime (forward) MUST use the same factor set, and sizing→runtime MUST round-trip to the target time within 1 % before string rounding.
- **FR-009**: The result-cache key MUST include every input that affects the result (including the temperature-factor, Peukert, design-margin, application, load-type, voltage-window, end-voltage and charger inputs).
- **FR-010**: Saved state from the previous version MUST migrate: application set to standby, the old round-trip `efficiency` override dropped, and other inputs kept.

**Voltage window & cell count (US2)**

- **FR-011**: Each chemistry MUST define a default end-of-discharge voltage per cell, a nominal cell voltage and a float voltage per cell (values approved at a gating task).
- **FR-012**: When a minimum load voltage is given, cells in series MUST equal floor(V_min / V_end-per-cell), with a minimum of 1.
- **FR-013**: When a maximum load voltage is given, the system MUST warn if cells × float voltage per cell exceeds it.
- **FR-014**: The results MUST show cells in series, nominal bank voltage, float bank voltage and end-of-discharge bank voltage.
- **FR-015**: Without a voltage window, the system MUST keep the current block-based series count and state that it did so.

**Temperature (US3)**

- **FR-016**: Lead-acid chemistries (FLA, VRLA-AGM, VRLA-GEL) MUST use the IEEE 485 electrolyte-temperature cell-size correction table with linear interpolation; a value of 1.00 at 25 °C.
- **FR-017**: Because the table gives a cell-size *multiplier* (≥ 1 when cold), the system MUST apply it as a multiplier on required capacity (equivalently its reciprocal on available capacity), consistently in both directions.
- **FR-018**: Temperatures outside the table MUST clamp to the end value and raise a warning. Non-lead-acid chemistries MUST keep the current coefficient model.

**Charger (US4)**

- **FR-019**: The system MUST compute the charger current = (Ah removed × recharge factor) / recharge time (h) + standing load current (A).
- **FR-020**: Ah removed MUST be the Ah delivered during the backup period at the bank's voltage (load energy / bank voltage / conversion efficiency).
- **FR-021**: The recharge factor MUST default by chemistry family and be user-overridable (range 1.00–1.50). Recharge time defaults to 8 h.
- **FR-022**: The system MUST recommend the next standard charger rating up and warn when the recharge current exceeds the chemistry's maximum charge C-rate.

**Ventilation (US5)**

- **FR-023**: For lead-acid and nickel chemistries the system MUST compute Q = 0.05 × n × I_gas × C_rt / 1000 (m³/h) for float and boost charging, where n = cells, C_rt = rated capacity (Ah) and I_gas = gas-producing current (mA/Ah) from approved chemistry defaults.
- **FR-024**: The system MUST show "not applicable" for lithium and flow chemistries, with a pointer to manufacturer and NFPA 855 requirements.
- **FR-025**: If the room volume is given, the system MUST show air changes per hour = Q / room volume.

**Code checks (US6)**

- **FR-026**: The system MUST evaluate NEC 480, NEC 706 and NFPA 855 checks against the bank's nominal voltage, stored energy (kWh) and chemistry, using approved thresholds, and show them as installation checks that never alter the sizing.

**Polish (US7)**

- **FR-027**: A unit test MUST verify the default and user provenance of every factor (including the new ones).
- **FR-028**: Battery components MUST meet WCAG 2.1 AA: an accessible name for every control, a visible focus state, errors linked to their fields, and results announced politely.
- **FR-029**: A reference-guide dialog MUST summarise the method, every factor with its default and range, and the standards cited.
- **FR-030**: The PDF export MUST include the application mode, all applied factors, the voltage window/cell count, the charger result, the ventilation result and the code checks.

### Key Entities

- **Application mode**: standby/float or cycling. It decides whether a DoD cap applies.
- **Applied factors**: design margin, aging, temperature (cell-size correction), conversion efficiency, DoD (cycling only), Peukert. Each has a value, a source (default/user) and a citation.
- **Chemistry electrical profile**: nominal, float and end-of-discharge voltage per cell; I_gas values for float and boost; recharge factor default; maximum charge C-rate; a lead-acid flag for the temperature table.
- **Voltage window**: minimum and maximum load voltage, which give the cell count and bank voltages.
- **Charger result**: Ah removed, recharge factor, recharge time, standing load, required current and recommended rating.
- **Ventilation result**: applicability, I_gas used, Q float, Q boost and air changes per hour.
- **Installation check**: code, clause, condition, message and severity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For the approved standby fixtures, required capacity matches the hand calculation (IEEE 485 method) within ±2 %.
- **SC-002**: A 48 V / 2 kW / 2 h VRLA standby design at 25 °C needs no more than 60 % of the capacity the previous version gave (removes the double-counted DoD and round-trip efficiency).
- **SC-003**: The cycling-mode results for the existing 011 fixtures change only by the documented efficiency correction and the new design margin. Before/after is tabulated in the research notes.
- **SC-004**: Sizing→runtime round-trip error ≤ 1 % across every chemistry in both application modes.
- **SC-005**: Every battery input passes an automated accessible-name check, and keyboard-only operation completes a sizing.
- **SC-006**: The results update within 100 ms of an input change for a typical design (no perceptible lag).
- **SC-007**: Every displayed factor, check and default cites its source standard or says "user-supplied".

## Assumptions

- The reference values (IEEE 485 temperature table, end voltages, float voltages, I_gas, recharge factors, NFPA 855 / NEC 706 thresholds) come from secondary sources and need user sign-off before the test fixtures are final (constitution, Principle V).
- Charger standard ratings use a common series (e.g. 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500 A).
- The multi-period duty cycle (IEEE 485 load profile with momentary loads) is out of scope. A single constant load is assumed, and the tool says so.
- Battery discharge efficiency is folded into the capacity-to-end-voltage rating (as in IEEE 485), so only conversion efficiency is applied explicitly.

## Out of Scope

- The IEEE 485 multi-period duty-cycle worksheet (planned for a later feature).
- Manufacturer-specific discharge (Kt) tables; Peukert is kept for rate derating.
- Thermal runaway or fire-suppression design; DC cable or protection sizing (covered by other calculators).
