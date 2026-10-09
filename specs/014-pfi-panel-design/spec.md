# Feature Specification: PFI Panel kVAR Design (Power Factor Correction upgrade)

**Feature Branch**: `014-pfi-panel-design`
**Created**: 2026-10-10
**Status**: Draft
**Input**: User description: "Upgrade the existing Power Factor Correction calculator (/power-factor-correction) into a full Power Factor Improvement (PFI / APFC) panel kVAR design tool. Do NOT create a new calculator page: extend the existing one and redesign its UI so the advanced panel-design features fit intuitively (stepped flow: required kVAR -> step bank -> detuning -> switchgear). Keep the current required-kVAR calculation working. Scope: (1) step bank design — unequal step sequences, controller switching sequence and C/k value, number of controller outputs, smallest-step resolution; (2) detuned reactors — tuning factor p (5.67/7/14 %), raised capacitor voltage, effective kVAR, reactor inductance; (3) switchgear per step — capacitor-duty contactor (AC-6b), fuse/MCCB (~1.3–1.5 × In), step cable, main incomer and busbar. Out of scope: resonance/thermal analysis. Standards: IEC 60831, IEC 61921, IEC 60947-4-1, IEEE 18, NEC 460. PDF export of the panel design."

## Clarifications

### Session 2026-10-10

- Q: How should the four stages be laid out? → A: Numbered stepper tabs; one stage at a time with inputs and results side by side, a persistent summary strip, and Back/Next buttons (FR-001, FR-003).
- Q: Which detuning thresholds drive the recommendation? → A: THD ≤ 10 %: none; > 10 %: 7 %; 3rd harmonic flagged: 14 %; 5.67 % manual only (FR-011).
- Q: How detailed are switchgear recommendations? → A: Generic standard ratings, plus a per-step manual override of contactor, protection and cable. Overrides are checked against the computed minimum and shown as overridden in the UI and PDF (FR-015a).

## Context

The existing Power Factor Correction calculator already computes load analysis, required kVAR (Qc = P·(tan φ1 − tan φ2)), derating, a standard bank rating, equal-size step count, capacitor type hint, rated voltage/current, capacitance per phase, savings and alerts, with history and PDF export. This feature turns that output into a buildable APFC panel design on the **same page**. No new calculator or navigation entry is added.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guided design flow with required kVAR unchanged (Priority: P1)

An engineer opens Power Factor Correction and is guided through four clearly labelled stages: **1 Required kVAR → 2 Step bank → 3 Detuning → 4 Switchgear**. Stage 1 has the same inputs and gives the same required-kVAR results as today. Each later stage shows its own inputs and results, prefilled from the previous stage, and a summary strip always shows the current panel design (total kVAR, steps, tuning, incomer rating).

**Why this priority**: The redesign is the frame every other story lives in. Existing users must keep their current results.

**Independent Test**: Enter the default case (415 V, 50 Hz, 100 kW, PF 0.75 → 0.95). Required kVAR must match the current calculator (55.32 kVAR). Every stage must be reachable and show results without an error.

**Acceptance Scenarios**:

1. **Given** the default inputs, **When** the user calculates, **Then** load analysis, required kVAR, derating and savings equal the pre-upgrade values for the same inputs.
2. **Given** results exist, **When** the user moves between stages, **Then** inputs entered in any stage are kept and later stages recompute from earlier ones.
3. **Given** an input in stage 1 changes, **When** the user views later stages, **Then** their results are marked stale or recomputed. No stage shows results that contradict stage 1.
4. **Given** a saved history entry from before the upgrade, **When** it is loaded, **Then** stage 1 restores and later stages use default design settings without an error.

---

### User Story 2 - Step bank design (Priority: P1)

The engineer chooses or accepts a step sequence for an automatic bank. The tool recommends a sequence and step sizes from standard step ratings. Sequences include 1:1:1…, 1:2:2…, 1:2:4…, 1:1:2:2… and a custom list. The tool shows:
- the step table (step no., kVAR, cumulative kVAR)
- the number of controller outputs needed and the next standard controller size (6/8/12 outputs)
- the resolution (smallest step) and the number of distinct switching levels (different kVAR values the bank can produce)
- the controller C/k setting for a given CT ratio

**Why this priority**: The step arrangement is the core of an APFC panel and is what the current "equal steps" output lacks.

**Independent Test**: For 300 kVAR, sequence 1:2:4 (last ratio repeating) and a 6-output controller limit, the tool must produce steps of 20/40/80/80/80 (sum 300), 5 outputs, a 6-output controller recommendation, 20 kVAR resolution and 15 switching levels (20, 40 … 300 kVAR).

**Acceptance Scenarios**:

1. **Given** a total kVAR and a sequence, **When** computed, **Then** step sizes follow the ratio (last ratio repeats), the smallest step is a standard step rating, the bank sums to at least the required kVAR, and a warning appears if it exceeds the requirement by more than one smallest step.
2. **Given** a 400 V, 50 Hz bank with a 20 kVAR smallest step and a 1000/5 A CT, **When** C/k is computed, **Then** C/k = Q1 / (√3 · U · k) = 20,000 / (√3 · 400 · 200) ≈ 0.144 A.
3. **Given** the smallest step is larger than the user-entered minimum load variation (or more than 10 % of total by default), **When** computed, **Then** a warning advises a smaller first step.
4. **Given** the user enters custom step sizes, **When** computed, **Then** the tool uses them as entered and reports total, resolution and outputs.
5. **Given** fixed correction is selected, **When** computed, **Then** the bank is a single step (no controller), and switchgear sizing still applies.

---

### User Story 3 - Detuned reactor design (Priority: P2)

When harmonics are present, the engineer picks a detuning factor p (5.67 %, 7 % or 14 %) or accepts the tool's recommendation. The tool shows:
- the tuning frequency fr = f / √p (e.g. 189 Hz at 7 % / 50 Hz, 227 Hz at 7 % / 60 Hz)
- the capacitor voltage rise U/(1−p) and the required capacitor rated voltage
- the reactor inductance per phase and the reactor current rating
- the effective kVAR each step delivers at system voltage, with the capacitor rated kVAR needed to deliver the step's nominal kVAR

**Why this priority**: Detuning changes the capacitor voltage and the delivered kVAR. Getting this wrong gives an undersized or failed bank, but harmonic-free sites can skip it.

**Independent Test**: 400 V, 50 Hz, p = 7 %, 50 kVAR effective step. Capacitor voltage at the terminals = 400 / 0.93 = 430.1 V. With the 1.1 margin, 473.1 V is needed, so the capacitor is rated 480 V. Tuning frequency = 189.0 Hz. The capacitor rated kVAR at 480 V must satisfy Qeff = Qr · (U/Ur)² / (1 − p) = 50 kVAR, so Qr = 50 × 0.93 × (480/400)² ≈ 66.96 kVAR.

**Acceptance Scenarios**:

1. **Given** THD below the detuning threshold and no dominant 3rd harmonic, **When** computed, **Then** "no detuning" is recommended. The user can still choose a p value.
2. **Given** THD above the threshold, **When** computed, **Then** 7 % is recommended. When the user says the 3rd harmonic is significant, 14 % is recommended.
3. **Given** a chosen p, **When** computed, **Then** the tuning frequency, capacitor voltage, required capacitor rated voltage (next standard rating ≥ 1.1 × the capacitor terminal voltage), reactor inductance (mH) and effective kVAR per step are shown.
4. **Given** detuning is applied, **When** switchgear is sized (US4), **Then** step currents use the detuned-step current, and the contactor recommendation reflects that the reactor limits inrush.

---

### User Story 4 - Switchgear sizing per step and for the panel (Priority: P2)

For each step and for the whole panel the tool sizes:
- the step rated current In
- a capacitor-duty contactor (AC-6b) rated for the design current
- a protective device (gG fuse or MCCB) at the standard rating that covers the design current (1.3 × overcurrent capability × capacitance tolerance, about 1.43 × In under IEC, or the NEC 460 basis under NEC)
- the step cable cross-section for the design current
- the main incomer device and busbar rating for the total bank

**Why this priority**: The step table is not buildable until each step has its contactor, protection and cable. It depends on US2 (steps) and optionally US3 (detuning).

**Independent Test**: For a 400 V, 50 kVAR non-detuned step: In = 72.2 A, design current 1.43 × In = 103.2 A. The fuse/MCCB is the next standard rating ≥ 103.2 A (125 A). The contactor is AC-6b rated ≥ 103.2 A (next frame 115 A). The cable is the smallest copper size with ampacity ≥ 103.2 A (35 mm² PVC under IEC 60364-5-52 method B1, 110 A).

**Acceptance Scenarios**:

1. **Given** each step, **When** sized, **Then** the step table lists In, design current, contactor rating, protection rating and cable size.
2. **Given** the NEC standard, **When** sized, **Then** conductor ampacity is ≥ 135 % of capacitor rated current (NEC 460.8(A)) and protection uses NEC standard ratings (NEC 240.6(A)).
3. **Given** the whole bank, **When** sized, **Then** the main incomer and busbar are rated for the total design current. The panel total equals the sum of all steps.
4. **Given** a non-detuned bank, **When** the contactor is recommended, **Then** it is marked as a capacitor-duty type with inrush-limiting (damping) resistors.

---

### User Story 5 - PDF export of the panel design (Priority: P3)

The engineer exports one PDF report. It contains the stage 1 results (as today), the step table, the controller settings, the detuning data and the switchgear schedule, plus the standards references, timestamp and disclaimer.

**Why this priority**: Deliverable for submittals. It depends on all earlier stories.

**Independent Test**: Export the default design. The PDF must contain every step row, C/k, tuning frequency, incomer rating and the standards list.

**Acceptance Scenarios**:

1. **Given** a completed design, **When** exported, **Then** the PDF includes all four stages and every step row.
2. **Given** detuning is off, **When** exported, **Then** the detuning section states "No detuning applied" instead of empty values.

### Edge Cases

- Required kVAR is zero or negative (target ≤ current PF): show the existing validation error, and later stages are disabled.
- Medium-voltage systems (> 1 kV): only stage 1 is available, with a note that the panel design covers LV (≤ 1 kV) APFC panels only.
- Single-phase systems: the step bank and switchgear use single-phase current. The C/k formula uses U·k.
- Custom steps with zero or negative values, or more than 12 steps: rejected with a message.
- The sequence cannot reach the required kVAR within 12 outputs: warn and suggest a larger smallest step.
- p = 14 % at 60 Hz, and frequencies other than 50/60 Hz: the tuning frequency is still computed from f/√p.
- CT ratio is missing or invalid: C/k shows "enter CT ratio" and no number.
- Leading PF risk (total bank > required by more than one step): warn.

## Requirements *(mandatory)*

### Functional Requirements

**Flow and compatibility**
- **FR-001**: The Power Factor Correction page MUST present the design as four ordered stages (Required kVAR, Step bank, Detuning, Switchgear) in a numbered stepper. One stage is shown at a time with inputs and results side by side (stacked on mobile), with Back/Next buttons; any completed stage can be revisited by clicking it. No new route or navigation item is added.
- **FR-002**: Stage 1 MUST keep the existing inputs and give the existing results for the same inputs (load analysis, required kVAR, derating, bank rating, savings, alerts).
- **FR-003**: A persistent summary MUST show total installed kVAR, number of steps and sequence, detuning factor (or "none"), and main incomer rating.
- **FR-004**: History entries MUST store the full design. Entries saved before the upgrade MUST load with default design settings.

**Step bank**
- **FR-005**: Users MUST be able to choose a step sequence from 1:1:1…, 1:2:2…, 1:2:4…, 1:1:2:2… or enter custom step sizes. The tool MUST recommend a sequence and step sizes by default.
- **FR-006**: Recommended step sizes MUST come from the standard step rating list, and the bank total MUST be ≥ the required (derated) kVAR.
- **FR-007**: The tool MUST report the step table (kVAR and cumulative kVAR), the controller outputs used, the recommended controller size (next of 6/8/12 outputs), the resolution (smallest step) and the number of distinct non-zero switching levels (distinct sums of step subsets).
- **FR-008**: The tool MUST compute C/k = Q1 / (√3 · U · k) for three-phase (Q1/(U · k) single-phase), where Q1 is the smallest step in var and k the CT ratio (primary/secondary). It MUST accept the CT ratio as an input.
- **FR-009**: The tool MUST warn when the smallest step exceeds the minimum load variation entered (default: 10 % of total kVAR) and when the total exceeds the requirement by more than one smallest step.
- **FR-010**: Users MUST be able to set the controller output limit (6, 8 or 12; default 12). Steps MUST be limited to 1–12. Fixed correction MUST produce one step and no controller.

**Detuning**
- **FR-011**: Users MUST be able to select detuning: none, 5.67 %, 7 % or 14 %. The tool MUST recommend: none when THD ≤ 10 %, 7 % when THD > 10 %, and 14 % when the user flags a significant 3rd harmonic (regardless of THD). 5.67 % is never auto-recommended.
- **FR-012**: For a chosen p, the tool MUST compute the tuning frequency fr = f/√p, the capacitor terminal voltage Uc = U/(1−p), the required capacitor rated voltage (next standard ≥ 1.1 × Uc), the per-step capacitor rated kVAR needed for the step's effective kVAR (Qr = Qeff · (1−p) · (Ur/U)²), and the reactor inductance per phase.
- **FR-013**: Effective kVAR per step and for the bank MUST be shown at system voltage.

**Switchgear**
- **FR-014**: Per step, the tool MUST compute the rated current In and the design current. Design current is 1.3 × 1.1 × In (≈ 1.43 × In) for IEC (IEC 60831-1 overcurrent capability × capacitance tolerance), and 1.35 × In for NEC (NEC 460.8(A)).
- **FR-015**: Per step, the tool MUST recommend an AC-6b capacitor-duty contactor rating (next standard frame ≥ design current), a protective device rating (next standard rating ≥ design current; NEC 240.6(A) list in NEC mode), and a copper cable size whose ampacity is ≥ the design current.
- **FR-015a**: Users MUST be able to override each step's contactor rating, protection rating and cable size. An override below the computed minimum MUST be flagged as an error, and overrides MUST be marked as such in the UI and PDF. Clearing an override restores the recommendation.
- **FR-016**: For the panel, the tool MUST recommend the main incomer device and busbar ratings from the total design current.
- **FR-017**: Contactor notes MUST say "capacitor-duty with damping resistors" for non-detuned steps and "standard capacitor-duty, inrush limited by reactor" for detuned steps.

**Output**
- **FR-018**: The PDF export MUST include all four stages, every step row, the controller settings, the detuning data, the switchgear schedule, the standards references (IEC 60831, IEC 61921, IEC 60947-4-1, IEEE 18, NEC 460), a timestamp and a disclaimer.
- **FR-019**: Every computed value MUST show its formula or clause reference in the UI (tooltip or note), matching the existing calculator pattern.

### Key Entities

- **Step bank design**: sequence (type + ratios or custom sizes), steps (index, effective kVAR, capacitor rated kVAR, cumulative), controller (outputs, recommended size, CT ratio, C/k), resolution, combinations, warnings.
- **Detuning design**: p (or none), tuning frequency, capacitor terminal voltage, capacitor rated voltage, reactor inductance per phase, effective vs rated kVAR.
- **Switchgear schedule**: per step (In, design current, contactor rating and type, protection rating and type, cable size, each with optional user override and a pass/fail check), and panel (total In, design current, incomer rating, busbar rating).
- **PFI panel design**: stage 1 results + step bank + detuning + switchgear, stored in history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For the same inputs, stage 1 values match the pre-upgrade calculator in 100 % of the regression cases.
- **SC-002**: The worked examples in the user stories (step split, C/k, detuning, switchgear) are reproduced to within ±1 % (±1 standard size step for ratings).
- **SC-003**: An engineer can go from the stage 1 inputs to a complete panel design (steps, tuning, switchgear) in under 3 minutes with the recommended defaults.
- **SC-004**: All design results update within 1 second of an input change.
- **SC-005**: The PDF contains 100 % of the step rows and all four stage sections for banks of up to 12 steps.

## Assumptions

- Panel design covers LV APFC panels (≤ 1,000 V). MV banks keep the stage 1 output only.
- Ratings are generic standard series (contactor, fuse/MCCB, busbar, cable), not manufacturer catalogues.
- Cables are copper PVC/XLPE multicore in air at 30 °C, using the project's existing ampacity data. Detailed installation derating is out of scope.
- Standard capacitor rated voltages come from the existing list (e.g. 400, 415, 440, 480, 525 V).
- Resonance and thermal/ventilation analysis are out of scope (user decision 2026-10-10).
