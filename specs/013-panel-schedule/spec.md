# Feature Specification: Panel Schedule & Phase Load Balancing

**Feature Branch**: `013-panel-schedule`
**Created**: 2026-10-07
**Status**: Draft
**Input**: User description: "Panel Schedule calculator — build a panelboard schedule with load balancing across phases (single-phase and three-phase panels), NEC 220/408 and IEC 60364 conventions, consistent with the existing ElectroMate calculator pattern"

## Clarifications

### Session 2026-10-07

- Q: How should automatic phase balancing behave? → A: Propose a before/after preview that the user accepts or discards; locked circuits stay fixed (FR-014/FR-015).
- Q: How detailed should the demand-load calculation be? → A: Category rules — NEC 220.42, 220.44, 125% continuous, +25% largest motor, non-coincident heating/cooling; IEC editable per-category diversity. Dwelling optional method out of scope (FR-018/FR-019).
- Q: How should the schedule handle sub-panels and multiple panels? → A: One panel per calculation; a sub-panel is a single load circuit; history stores several saved panels.
- Q: How should loads be entered? → A: One total value per circuit (VA/W/kW/kVA/HP), split equally across its poles (FR-004/FR-009).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build a panel schedule and see per-phase loading (Priority: P1)

An electrical designer defines a panelboard (system type, voltage, bus rating, main device, number of spaces) and enters its branch circuits (description, load type, load in VA/W or kW, number of poles, breaker rating). The tool places each circuit in a breaker space using standard panel numbering (odd circuits on the left, even on the right, phases rotating A-B-C down the rows). It shows the schedule as a two-column panel layout with the phase of each space, and a summary of connected load per phase (VA and amperes), total connected load, and phase imbalance.

**Why this priority**: The panel schedule itself and per-phase totals are the core deliverable every designer needs; balancing and demand build on top of it.

**Independent Test**: Enter a 42-space 208Y/120 V three-phase panel with a mix of 1-, 2- and 3-pole circuits; verify phase assignment of each space and per-phase VA/A totals against a hand calculation.

**Acceptance Scenarios**:

1. **Given** a 208Y/120 V 3φ 4W panel, **When** a 1-pole 1,200 VA circuit is placed in space 1, **Then** it is shown on phase A and phase A current increases by 10.0 A (1,200 / 120).
2. **Given** a 2-pole 4,800 VA 208 V circuit in spaces 3/5, **When** the schedule computes, **Then** the load is split 2,400 VA on phase B and 2,400 VA on phase C.
3. **Given** a 3-pole 15 kVA circuit, **When** placed, **Then** 5,000 VA is added to each of A, B and C.
4. **Given** a 120/240 V 1φ 3W panel, **When** circuits are placed, **Then** rows alternate between L1 and L2 and 2-pole loads split equally across both lines.
5. **Given** an IEC 230/400 V 3φ+N panel, **When** circuits are entered, **Then** single-phase circuits are labelled L1/L2/L3 and currents use 230 V line-to-neutral.
6. **Given** a circuit that does not fit (e.g. a 3-pole circuit needing spaces beyond the panel size, or overlapping an occupied space), **When** the user adds it, **Then** an error explains the conflict and the circuit is not placed.

---

### User Story 2 - Balance load across phases (Priority: P1)

The designer asks the tool to balance the panel. The tool proposes a rearrangement of circuits across spaces that minimises the maximum phase deviation, respecting pole counts (multi-pole circuits must occupy adjacent same-side spaces) and any circuits the user has locked in place. The user sees before/after imbalance and can accept or discard the proposal.

**Why this priority**: Load balancing is the explicitly requested capability and the main reason to use a tool rather than a spreadsheet.

**Independent Test**: Load a deliberately unbalanced panel (all large loads on phase A); run balance; verify imbalance drops below the target and locked circuits do not move.

**Acceptance Scenarios**:

1. **Given** a panel with 40% imbalance, **When** balance is run, **Then** a proposal is shown with resulting imbalance and per-phase totals, and the original arrangement stays unchanged until the user accepts.
2. **Given** circuits marked as locked, **When** balance runs, **Then** locked circuits keep their space numbers.
3. **Given** the proposal is accepted, **When** the schedule redraws, **Then** circuit numbers are reassigned and the phase totals match the proposal.
4. **Given** a panel already within the imbalance target, **When** balance runs, **Then** the tool reports that no improvement is needed (or that only a marginal improvement is available).

---

### User Story 3 - Demand load, feeder and main sizing (Priority: P2)

The tool applies demand/diversity rules by load category to compute the panel's demand load and design current, then checks it against the bus rating and main device, and recommends the minimum standard main overcurrent device and feeder ampacity.

- **NEC mode**: 125% of continuous loads (NEC 215.2 / 230.42 conventions), lighting demand per NEC 220.42 (by occupancy), receptacle demand per NEC 220.44 (first 10 kVA at 100%, remainder at 50%), 25% of the largest motor added (NEC 430.24), non-coincident loads (heating vs cooling) per NEC 220.60 — only the larger counts. Next standard OCPD rating per NEC 240.6(A).
- **IEC mode**: diversity/utilisation factors per load category (IEC 60364 / IEC 61439 rated diversity factor conventions), user-editable, with sensible defaults; next standard device rating from the IEC preferred series.

**Why this priority**: Designers need the panel's demand to size the feeder and main; it depends on the schedule (US1) but is independent of balancing.

**Independent Test**: Enter a panel with known continuous lighting, receptacle and motor loads; verify demand VA, design current and recommended main rating against a worked NEC 220 example.

**Acceptance Scenarios**:

1. **Given** 15 kVA of general receptacle load in NEC mode, **When** demand is computed, **Then** receptacle demand = 10 kVA + 50% × 5 kVA = 12.5 kVA.
2. **Given** a panel whose design current exceeds the bus rating, **When** results display, **Then** an over-capacity warning is shown.
3. **Given** a design current of 183 A, **When** the main is recommended, **Then** the next standard rating (200 A) is proposed.
4. **Given** IEC mode, **When** the user edits a category diversity factor, **Then** demand recomputes using the edited factor and the factor is shown in the results.

---

### User Story 4 - Export panel schedule PDF (Priority: P2)

The user exports a professional panel schedule (the industry-standard two-column layout with circuit numbers, descriptions, breaker trip/poles, per-phase VA columns, totals, demand summary and imbalance) to PDF for inclusion in drawings and submittals.

**Why this priority**: The schedule is a construction document; without export the tool is incomplete for real use, but the calculation has value without it.

**Independent Test**: Export a 42-space panel; verify all circuits, totals and header data appear and match the on-screen values.

**Acceptance Scenarios**:

1. **Given** a completed schedule, **When** the user exports, **Then** the PDF contains the panel header (name, voltage, system, bus, main, mounting, fed from), all spaces, per-phase totals, demand summary, standard references and a disclaimer.
2. **Given** an empty space or spare, **When** exported, **Then** it shows as "SPARE" or "SPACE" as entered.

---

### User Story 5 - Save, reload and standards reference (Priority: P3)

The user's current panel persists across page reloads; previous panels can be saved to a local history list and restored. A reference guide explains numbering, balancing and the demand rules used.

**Why this priority**: Convenience and consistency with other ElectroMate calculators; not required to produce a correct schedule.

**Independent Test**: Build a panel, reload the page, confirm it is restored; save two panels to history, restore the first.

**Acceptance Scenarios**:

1. **Given** a partially built panel, **When** the page reloads, **Then** all circuits and settings are restored.
2. **Given** a history entry, **When** the user restores it, **Then** the panel replaces the current one after confirmation.

---

### Edge Cases

- Panel with zero circuits: totals are zero, imbalance shown as "—" (not NaN).
- Imbalance when the average phase load is zero: report 0% / not applicable, no division by zero.
- 2-pole circuit on a 3φ panel uses line-to-line voltage (e.g. 208 V); its per-phase current is VA / V_LL on each of the two phases.
- 3-pole circuit on a 1φ panel: rejected with a clear error.
- Multi-pole circuit starting in the last row so it would run off the end of the panel: rejected.
- Circuits with a power factor below 1: entries in W with a PF are converted to VA; per-phase sums are in VA (arithmetic), stated as a conservative convention.
- Neutral current estimate for 3φ 4W: vector sum of the line-to-neutral loads assuming unity PF and 120° displacement; shown as an estimate (it does not include harmonics).
- Balancing with all circuits locked, or with only a single circuit: returns "no change possible".
- Branch breaker smaller than 125% of a continuous load (NEC mode) is flagged as a warning on that circuit.
- Non-numeric, negative or out-of-range input: inline validation and no calculation.
- Panel sizes: 2–84 spaces, even number (two-column layout); common presets 12/18/24/30/42/54/60/84.

## Requirements *(mandatory)*

### Functional Requirements

**Panel definition**

- **FR-001**: Users MUST be able to choose the standard mode: NEC or IEC.
- **FR-002**: Users MUST be able to select a system type: NEC — 120/240 V 1φ 3W, 208Y/120 V 3φ 4W, 480Y/277 V 3φ 4W, 240 V 3φ 3W delta (no neutral loads); IEC — 230 V 1φ 2W, 230/400 V 3φ 4W (+N). A custom line-to-neutral/line-to-line voltage option MUST be offered.
- **FR-003**: Users MUST be able to enter panel header data: name/tag, location, fed from, bus rating (A), main type (main breaker / main lugs only), main rating (A), number of spaces, mounting, short-circuit rating (kA, informational).

**Circuits and schedule**

- **FR-004**: Users MUST be able to add, edit, duplicate, delete and reorder circuits with: description, load category, load value with unit (VA, W, kW, kVA, or HP for motors), power factor (default 1.0 for VA entries), continuous flag, poles (1, 2, 3), breaker trip rating, optional space number, locked flag, and notes.
- **FR-005**: Users MUST be able to mark spaces as SPARE (breaker, no load) or SPACE (no breaker).
- **FR-006**: The system MUST assign phases to spaces using standard numbering: odd numbers on the left, even on the right, row r = ceil(n/2), phase = rows cycling A, B, C (3φ) or L1, L2 (1φ). Multi-pole circuits MUST occupy consecutive same-side spaces (n, n+2, n+4).
- **FR-007**: When no space number is given, the system MUST auto-place the circuit in the first free position that fits its pole count.
- **FR-008**: The system MUST reject placements that overlap, exceed the panel size, or use more poles than the system has phases, with a specific error message.
- **FR-009**: The system MUST convert each circuit to VA per phase: 1-pole → full VA on its phase; 2-pole on 1φ 3W or 3φ → VA/2 on each occupied phase; 3-pole → VA/3 on each phase. HP for motors MUST be converted using standard full-load current tables (NEC Table 430.248/430.250 in NEC mode; kW rating ÷ (η × PF) defaults in IEC mode).

**Per-phase results**

- **FR-010**: The system MUST compute connected VA per phase, phase current per phase (A), total connected VA and total current.
- **FR-011**: The system MUST compute phase imbalance as max |phase VA − average| ÷ average × 100%, and flag it as acceptable or not against a user-adjustable target (default 10%).
- **FR-012**: For 3φ 4W systems, the system MUST estimate neutral current from the line-to-neutral phase currents (vector sum, unity PF, 120° displacement), labelled as an estimate.
- **FR-013**: In NEC mode, the system MUST warn when a branch breaker is smaller than 125% of a continuous load plus 100% of the non-continuous load on that circuit.

**Balancing**

- **FR-014**: Users MUST be able to run an automatic balance that proposes new space assignments minimising maximum phase deviation, keeping locked circuits fixed and multi-pole circuits on valid consecutive spaces.
- **FR-015**: The proposal MUST show before/after per-phase VA and imbalance, and MUST NOT change the schedule until the user accepts it; it MUST be possible to discard it.
- **FR-016**: Balancing MUST be deterministic (the same input always gives the same proposal) and MUST finish for a full 84-space panel without noticeable delay.

**Demand and sizing**

- **FR-017**: Each circuit MUST carry a load category used for demand: general lighting, receptacles, motor, HVAC heating, HVAC cooling, kitchen equipment, water heater, EV charger, other continuous, other non-continuous, spare.
- **FR-018**: NEC mode MUST compute demand load using: lighting demand per NEC 220.42 for the selected occupancy (with "other / 100%" as the default), receptacles per NEC 220.44, 125% of continuous loads, +25% of the largest motor (NEC 430.24), and non-coincident heating/cooling with only the larger counted (NEC 220.60). Each applied rule MUST be shown with its reference.
- **FR-019**: IEC mode MUST compute demand load using per-category diversity factors with defaults shown and user-editable (0–1), and an optional overall panel rated diversity factor.
- **FR-020**: The system MUST compute design current from the demand load, compare it to the bus and main ratings, and recommend the minimum standard main OCPD rating (NEC 240.6(A) in NEC mode; IEC preferred ratings in IEC mode).
- **FR-021**: The system MUST warn when connected or demand current exceeds the bus rating or main rating, and when the number of used spaces exceeds the panel size.

**Output, persistence, UX**

- **FR-022**: Users MUST be able to export the schedule and results to PDF in the standard two-column panel schedule format with header, per-phase VA columns, totals, demand summary, imbalance, references and disclaimer.
- **FR-023**: The current panel MUST persist across reloads; users MUST be able to save named panels to a local history and restore or delete them.
- **FR-024**: The calculator MUST be reachable from the main navigation (Power Systems category) and the sidebar, and follow existing ElectroMate page/layout conventions, including a reference guide dialog and mobile-usable layout.
- **FR-025**: All numeric inputs MUST validate inline (positive values, PF 0.1–1.0, poles valid for the system) and calculations MUST not run on invalid data.

### Key Entities

- **Panel**: header data, standard mode, system type, voltages, bus rating, main type/rating, spaces, imbalance target, occupancy (NEC lighting demand), diversity settings (IEC).
- **Circuit**: id, description, category, load value + unit, PF, continuous flag, poles, breaker rating, start space, locked flag, notes; derived per-phase VA.
- **Space**: number, side (left/right), row, phase; occupied by one circuit pole, a SPARE, or empty.
- **Phase Summary**: per-phase connected VA, current, deviation from average; totals; imbalance %; neutral estimate.
- **Demand Result**: applied rules (rule, reference, base VA, factor, result VA), demand VA, design current, recommended main rating, warnings.
- **Balance Proposal**: new space map, before/after phase summary, moved circuit list.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A designer can build a 42-circuit panel schedule and see per-phase totals in under 10 minutes.
- **SC-002**: Per-phase VA, current, imbalance and demand results match hand-calculated worked examples within 0.1%.
- **SC-003**: For a randomly generated unbalanced panel with no locked circuits, automatic balancing reduces imbalance to at most 5% (or the best achievable when one load dominates) in 95% of test cases.
- **SC-004**: Balancing a full 84-space panel completes in under 1 second.
- **SC-005**: The exported PDF reproduces 100% of the on-screen circuits and totals.
- **SC-006**: No placement that violates pole/space rules can be saved (0 invalid layouts accepted in tests).

## Assumptions

- Single panelboard per calculation; a downstream sub-panel is entered as one load circuit (its demand VA, poles).
- Phase sums use arithmetic VA addition (conservative, the convention in panel schedules); PF is used only to convert W/kW to VA.
- Neutral estimate ignores harmonics; the harmonic-analysis calculator remains the tool for triplen neutral loading.
- 240 V 3φ 3W delta panels with a high leg are out of scope for v1 (no high-leg 4W delta); plain delta allows only 2- and 3-pole loads.
- Demand factors cover the common NEC 220 Part II/III rules listed; dwelling optional methods (NEC 220.82–220.87), elevator, welder and other specialised demand rules are out of scope.
- IEC default diversity factors are engineering defaults shown as editable values, not mandated values.
- Storage is local to the browser (no accounts), consistent with other calculators.
