# Research: Panel Schedule & Phase Load Balancing

**Feature**: 013-panel-schedule | **Date**: 2026-10-07

Every decision below is used by plan.md, data-model.md and the contracts. Edition baseline: **NEC 2020** (consistent with the rest of ElectroMate), IEC 60364 / IEC 61439-2.

## R1 — Space numbering and phase assignment

- **Decision**: Two-column panel, odd spaces on the left and even spaces on the right. Row `r = ceil(n / 2)`. Phase index = `(r − 1) mod P`, where P = 3 (A, B, C) for three-phase systems and P = 2 (A, B shown as L1/L2 or A/B) for 1φ 3W. For a 1φ 2W system (IEC 230 V), P = 1 (every space is L). A multi-pole circuit starting at space `n` occupies `n, n+2, (n+4)`: the same side, consecutive rows, and therefore consecutive phases.
- **Rationale**: This is the convention of NEMA PB 1 panelboards (bus stabs alternate per row). NEC 408.3(E) requires phase arrangement A, B, C from front to back, top to bottom, or left to right.
- **Alternatives**: Sequential numbering (1, 2, 3 down one column), used by some European distribution boards. It is shown in IEC mode as a label option only, because the engine is numbering-agnostic once space → phase is known. It is deferred from v1, and IEC boards use the same two-column model.

## R2 — Per-phase VA and current convention

- **Decision**: The per-phase connected load is the **arithmetic VA sum**. Each circuit's VA is split equally across its poles: 1-pole → VA, 2-pole → VA/2 per phase, 3-pole → VA/3 per phase.
  - Phase current shown in the summary: `I_p = VA_p / V_LN` (4W systems and 1φ 3W, where V_LN = 120 V); `I_p = VA_p / (V_LL / √3)` for a 3W delta.
  - Total (balanced-equivalent) current: `S_total / (√3 · V_LL)` for 3φ, `S_total / V_LL` for 1φ 3W, `S_total / V` for 1φ 2W.
  - Branch-circuit current (for the FR-013 breaker check): 1-pole `VA / V_LN`; 2-pole `VA / V_LL`; 3-pole `VA / (√3 · V_LL)`.
- **Rationale**: This matches standard panel-schedule practice and the way NEC Chapter 9 Annex D examples total loads (VA per phase). It is conservative because it ignores PF angle differences.
- **Note**: For 2-pole loads on 208Y/120, `VA_p / V_LN` slightly understates the actual line current of an L-L load (VA/2/120 = VA/240 vs VA/208). The summary current is labelled "per-phase load current (VA/V_LN)". The branch check uses the true L-L current.

## R3 — Neutral current estimate

- **Decision**: Only line-to-neutral (1-pole) loads contribute. 3φ 4W: `I_N = √(Ia² + Ib² + Ic² − IaIb − IbIc − IcIa)`, where `I_x` = 1-pole VA on phase x / V_LN. 1φ 3W: `I_N = |I_L1 − I_L2|`. There is no neutral on a 3W delta or a 1φ 2W system (for 1φ 2W, neutral = line).
- **Rationale**: This is the vector sum for unity PF at 120° displacement. It is labelled as an estimate that excludes triplen harmonics (refer to the Harmonic Analysis calculator).

## R4 — NEC demand rules (NEC 2020)

Applied in this order. Each produces a `DemandRuleApplication` row with its reference.

| Rule | Reference | Implementation |
|---|---|---|
| General lighting demand | Table 220.42 | By occupancy: **dwelling** first 3,000 @100%, 3,001–120,000 @35%, rest @25%; **hotel/motel** (no cooking) first 20,000 @60%, 20,001–100,000 @50%, rest @35%; **warehouse** first 12,500 @100%, rest @50%; **hospital** first 50,000 @40%, rest @20%; **other (default)** 100% |
| Receptacles | 220.44, Table 220.44 | Non-dwelling: first 10 kVA @100%, rest @50%. Dwelling: receptacle VA is added to the general lighting load before Table 220.42 (220.14(J)) |
| Kitchen equipment (non-dwelling) | 220.56, Table 220.56 | Count of kitchen circuits: 1–2 → 100%, 3 → 90%, 4 → 80%, 5 → 70%, ≥6 → 65%. The demand is never less than the sum of the two largest. Dwelling: 100% (220.53/220.55 out of scope) |
| Non-coincident loads | 220.60 | Only the larger of Σ HVAC heating and Σ HVAC cooling is included |
| Largest motor | 430.24 | Motors at 100% + 25% of the largest motor VA. The continuous flag is ignored on motor circuits (430.24 already covers it) |
| Continuous loads | 215.2(A)(1), 230.42(A) | +25% × (demand-adjusted VA of continuous circuits). Demand-adjusted VA = circuit VA × (category demand / category connected) |
| Everything else | — | 100% (water heater, EV charger, other) |

- **Category defaults for the continuous flag**: lighting ✓, EV charger ✓ (625.41), water heater ✓ (422.13), other-continuous ✓; all others ✗. The user can change the flag.
- **Hotel/hospital note**: Table 220.42 marks the hotel/motel and hospital factors as not applicable to areas where the entire lighting is likely to be used at one time (operating rooms, ballrooms, dining rooms). This is shown as an info message when those occupancies are selected.
- **Verification**: a user verification task (like arc-flash T031) confirms Table 220.42/220.44/220.56 values against a licensed NEC 2020 copy before release.

## R5 — IEC demand

- **Decision**: Per-category diversity factors in 0–1, **default 1.0 for every category** (conservative, Constitution "Conservative Defaults"). Typical-range hints are shown in the UI. An optional assembly **Rated Diversity Factor** (IEC 61439-2 assumed loading by number of main circuits: 1 → 1.0, 2–3 → 0.9, 4–5 → 0.8, 6–9 → 0.7, ≥10 → 0.6) is **off by default** and applied to the total when enabled. There is no 125% continuous factor in IEC mode; the largest-motor +25% is kept as an optional toggle (default on) so motor starting margin is not lost.
- **Rationale**: IEC 60364 does not tabulate mandatory demand factors; practice relies on designer-chosen factors. Defaulting to 1.0 avoids presenting unverified numbers as standard values.
- **Verification**: the RDF table values are flagged for user verification against IEC 61439-2.

## R6 — Motor full-load current (NEC)

- **Decision**: New data module `lib/standards/motorFlc.ts` with NEC 2020 **Table 430.248** (1φ: 115/200/208/230 V, 1/6–10 HP) and **Table 430.250** (3φ induction: 200/208/230/460/575 V, ½–500 HP). The motor column is selected from the system voltage: 120 → 115, 208 → 208, 240 → 230, 480 → 460, 600 → 575. The motor VA = FLC × V_column_nominal_system × (√3 for 3-pole). A HP rating outside the table is rejected with a message to enter VA instead.
- **IEC**: motor kW (or HP × 0.7457) → VA = kW × 1000 / (η × PF), with circuit PF (default 0.85) and efficiency (default 0.90), both editable.
- **Rationale**: NEC 430.6(A)(1) requires table FLC (not nameplate) for conductor/OCPD sizing; panel schedules use the same values.
- **Verification**: table values are transcribed and must be checked against a licensed NEC copy (user task).

## R7 — Balancing algorithm

- **Decision**: A deterministic three-stage heuristic.
  1. **Fix** locked circuits and SPARE/SPACE entries in place.
  2. **Greedy placement (LPT)** of unlocked circuits: sort 3-pole, then 2-pole, then 1-pole, each by VA descending (ties broken by circuit id). For each circuit, evaluate every feasible start phase and choose the one minimising (max deviation, then sum of squared deviations). Then place it at the lowest-numbered free start space whose row phase matches. If no space fits, try the next-best phase.
  3. **Local search**: repeatedly evaluate swapping any two unlocked 1-pole circuits on different phases, and moving a 1-pole circuit into a free space on another phase. Apply the best improving move. Stop when no move improves the result or after 500 iterations.
- **Rationale**: LPT + pairwise swap is the standard approach for multiprocessor/number-partitioning problems. It is near-optimal for typical panel mixes and runs in well under 50 ms for 84 spaces (≤ 84 circuits, O(n²) per iteration). Exact ILP is unnecessary and would need a dependency.
- **Objective**: minimise imbalance % (FR-011); tie-break by fewer moved circuits from the original position (keeps the schedule familiar).
- **Alternatives**: random restarts / simulated annealing were rejected because they are non-deterministic (FR-016).

## R8 — Arithmetic

- **Decision**: Native `number` with rounding only at display/PDF. This is the same justified deviation from ADR-003 as arc-flash: the calculations are sums and products of 3–4 significant-figure inputs, and the 0.1% tolerance (SC-002) is far above double-precision error.

## R9 — Standard ratings for main recommendation

- **Decision**: Reuse `lib/standards/breakerRatings.ts` → `recommendStandardBreaker(minAmps, 'NEC' | 'IEC')`. NEC 240.6(A) list; IEC list (6…4000 A). No new data.

## R10 — Layout/pattern

- **Decision**: Follow `012-arc-flash` exactly: `types/panel-schedule.ts`, `lib/calculations/panel-schedule/`, `lib/validation/panelScheduleValidation.ts`, `stores/usePanelScheduleStore.ts` (Zustand persist), `components/panel-schedule/`, `app/panel-schedule/`, `lib/pdfGenerator.panelSchedule.ts`, tests under `__tests__/unit/calculations/panel-schedule/` (vitest only includes `__tests__/unit|integration|session-memory/**`). Nav: **Power Systems** category.
- Numeric inputs use focus/blur local string state (project feedback); handlers read `store.getState()` (no stale closures).
