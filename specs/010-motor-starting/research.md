# Research: Motor Starting Analysis Calculator

**Feature**: 010-motor-starting | **Date**: 2026-05-04 | **Phase**: 0 (Outline & Research)

## Scope

Resolve every formula, lookup table, and methodology decision needed before writing the data model, contracts, or task list. No `[NEEDS CLARIFICATION]` markers remain in `spec.md`; the items below were identified as the technical questions whose answers govern Phase 1 design.

---

## R1. Per-Unit Voltage Dip at Point of Common Coupling

**Decision**: Use the per-unit method with Thevenin equivalent at the PCC, per IEEE 3002.7-2018 §7.2.

For a motor drawing locked-rotor current I_LR through a source of Thevenin impedance Z_th referred to the PCC bus:

```
V_pcc_pu = E_th_pu × Z_motor_pu / (Z_th_pu + Z_motor_pu)
V_dip_% = (1 − V_pcc_pu) × 100
```

Where Z_motor at start ≈ V_rated² / S_LR (locked-rotor apparent power). Source Thevenin assembled by series-summing utility + transformer + cable impedances on a common kVA base.

**Rationale**: Per-unit removes voltage-level conversions through transformers, makes the formula stable across NEC and IEC inputs, and matches the worked-example methodology engineers expect to see in a deliverable. IEEE 3002.7 Annex C provides reference cases against which our `voltageDip.ts` tests will be validated to ±2%.

**Alternatives considered**:
- Volt-amp method on physical units (rejected — leads to FP drift over the chain and hides the per-unit insight engineers want shown in the report).
- Symmetrical-components / time-domain transient simulation (rejected — out of scope per spec; would require iterative numeric integration, blowing past the < 50 ms per-method performance budget).

---

## R2. Source Thevenin Assembly (Utility + Transformer + Cable)

**Decision**: Series sum complex impedances on a common base (typically the transformer kVA base).

```
Utility:      Z_u_pu = S_base / S_sc_utility,   X/R from user (default 10 for HV system)
Transformer:  Z_t_pu = %Z / 100,                X/R from nameplate or default per kVA range
Cable:        Z_c_pu = (R_c + jX_c) × S_base / V_base²
              R_c, X_c from NEC Ch. 9 Table 9 (NEC mode) or IEC 60364-5-52 (IEC mode)
Z_th_pu     = Z_u_pu + Z_t_pu + Z_c_pu        (complex)
```

For the infinite-bus case (utility MVA blank/zero), Z_u_pu = 0 and assumption is labeled in results.

**Rationale**: Consistent with IEEE Red Book (Std 141) and IEEE 3002.7 worked examples. Transformer X/R defaults (per IEEE C37.010 Table A): 750–2500 kVA → X/R ≈ 4.9–7.0; ≥2500 kVA → X/R ≈ 8–12. These ship as defaults inside `motorStartingData.ts` and are user-overridable.

**Alternatives considered**:
- Lump-summed magnitudes (|Z_u| + |Z_t| + |Z_c|) without phase (rejected — overestimates Z, underestimates dip, fails accuracy bar).
- Frequency-dependent cable models (rejected — 60/50 Hz only; AC table values from NEC/IEC already include skin effect and proximity).

---

## R3. NEMA Code Letter and IEC Starting-kVA Tables

**Decision**: Ship two lookup tables in `motorStartingData.ts`.

**NEC mode** (NEC 430.7(B), NEMA Code Letters A–V):
| Letter | kVA/HP locked-rotor | | Letter | kVA/HP |
|---|---|---|---|---|
| A | 0–3.14 | | L | 9.0–9.99 |
| B | 3.15–3.54 | | M | 10.0–11.19 |
| C | 3.55–3.99 | | N | 11.2–12.49 |
| D | 4.0–4.49 | | P | 12.5–13.99 |
| E | 4.5–4.99 | | R | 14.0–15.99 |
| F | 5.0–5.59 | | S | 16.0–17.99 |
| G | 5.6–6.29 | | T | 18.0–19.99 |
| H | 6.3–7.09 | | U | 20.0–22.39 |
| J | 7.1–7.99 | | V | 22.4 + |
| K | 8.0–8.99 |

The calculator uses the **midpoint** of the range when only the code letter is supplied (e.g., G → 5.95 kVA/HP). Users may override with a direct LRA value or a multiplier-of-FLA.

**IEC mode** (IEC 60034-12:2016 Designs N and H):
- Design N: I_st / I_rated typically 5.5–7.0× (default 6.5×); T_st / T_rated 1.0–2.0× (default 1.6×).
- Design H: I_st / I_rated typically 5.5–7.0× (default 6.5×); T_st / T_rated 2.0–4.0× (default 2.5×); higher break-down torque.

**Rationale**: Code-letter lookup is a NEC-mandated entry point and the most common nameplate field engineers will read into the calculator. IEC publishes ranges rather than discrete letters, so we ship sensible defaults inside the range with override.

**Alternatives considered**:
- Asking the user to compute kVA/HP manually (rejected — defeats the purpose of a calculator; engineers expect the tool to know NEC 430.7(B)).
- Using IEEE 3002.7 typical motor parameters by HP (kept as a *fallback* only when neither code letter nor direct LRA is provided, with clear "estimated" labeling).

---

## R4. Method-Specific Multipliers

**Decision**: Each method maps full-voltage starting current and torque to method-specific values:

| Method | I_start (line) | T_start | Notes |
|---|---|---|---|
| **DOL** | 1.0 × I_LR | 1.0 × T_st | Reference baseline |
| **Star-Delta (Y-Δ)** | ⅓ × I_LR | ⅓ × T_st | Open transition introduces transient at change-over; closed transition smoother but more contactor hardware |
| **Autotransformer** | a² × I_LR (line side); a × I_LR (motor side) | a² × T_st | a = tap fraction (0.50, 0.65, 0.80). Closed transition assumed by default. |
| **Soft Starter** | depends on initial-V setting and ramp time; current limited to user-set ceiling (default 350% FLA) | proportional to V² | Linear voltage ramp from V_init → 100% over t_ramp seconds |
| **VFD** | ≈ 1.0–1.1 × FLA | up to 1.5 × T_rated at low frequency (constant V/Hz) | True ramp; near-zero source disturbance after DC bus charge |

**Rationale**: These multipliers are textbook (Beeman §6, Wildi Ch. 27, IEEE Std 141 §9). The autotransformer line-side current is `a² × I_LR` because both voltage and current at the line terminals scale by `a` (so power scales by a²); this distinction is critical for source-side voltage-dip calculation and is a frequent source of errors in hand calculations — making it a natural test case.

**Alternatives considered**:
- Manufacturer-specific soft-starter / VFD curves (rejected for v1 — vendor-agnostic generic ramp is sufficient and matches IEEE 3002.7 simplification).
- Including reactor-start and capacitor-start methods (rejected — out of scope; can be added in a future enhancement using the same module pattern).

---

## R5. Acceleration Time

**Decision**: Use the simplified IEEE 3002.7 quasi-static integration:

```
t_acc = WR² × (n2 − n1) / (308 × T_acc_avg)         [NEC mode, lb-ft², rpm, lb-ft]
t_acc = J × Δω / T_acc_avg                          [IEC mode, kg·m², rad/s, N·m]
```

Where `T_acc_avg` is the average accelerating torque over the speed range (motor torque − load torque), computed by stepping the speed in 5–10 increments from 0 to rated speed and averaging the difference between the method-derated motor torque-speed curve and the load torque-speed curve.

Motor torque-speed curve approximated by NEMA Design B canonical shape: T(s) ≈ T_st × (1 − s) × ramp factor up to breakdown, where s is slip. For v1 we use the three published points (starting torque, breakdown torque, full-load torque) and linear interpolation between them.

**Rationale**: Closed-form analytic acceleration time only exists for trivial torque curves; numerical integration is standard practice and matches IEEE 3002.7 methodology while keeping calculation time well under 50 ms.

**Alternatives considered**:
- Constant-torque approximation (T_acc_avg = T_start − T_load_avg) (rejected — large error for fan/pump quadratic loads where most acceleration time accrues near rated speed).
- Full ODE integration of swing equation (rejected — overkill for steady-state engineering tool; would require time-step tuning and a runtime budget we don't have).

---

## R6. Motor Thermal Limit (t6 / Stall Time)

**Decision**: Default thermal curve from NEMA MG 1-2016 Section 12 typical values, user-overridable per motor.

| HP range | t_stall_cold (s) | t_stall_hot (s) |
|---|---|---|
| 1–10  | 60 | 30 |
| 11–50 | 30 | 15 |
| 51–250 | 20 | 10 |
| 251+ | 12 | 8 |

The calculator compares accel time against `t_stall_hot` (worst case after a previous start). If `t_acc > 0.8 × t_stall_hot`, flag as caution; if `t_acc ≥ t_stall_hot`, flag as failure.

**Rationale**: Manufacturer-specific curves are ideal but not always available; NEMA MG 1 typical values give engineers a defensible default with an explicit warning to override when a real curve is at hand.

**Alternatives considered**:
- Computing thermal limit from rotor resistance and thermal capacity (rejected — needs motor parameters rarely on the nameplate).
- Hardcoding a single global default (rejected — physically wrong for the broad HP range supported).

---

## R7. IEEE 1668 Voltage-Dip Limits

**Decision**: Default thresholds, user-overridable.

| Condition | Threshold | Source |
|---|---|---|
| Steady-state common loads | 10% dip max | IEEE 1668-2017 §5 |
| Transient (during motor start, < 5 s) | 20% dip max | IEEE 1668-2017 §6, common industry practice |
| Sensitive loads (computers, CNC, hospitals) | 5% dip max | Site-specific; user override |

The calculator displays the active threshold next to the dip indicator and labels the chosen scenario. The override field is part of `MotorStartingInput` so the value is preserved in the calculation history.

**Rationale**: IEEE 1668 publishes ranges; the calculator picks the most commonly cited thresholds with a single click to override.

**Alternatives considered**:
- Reading SEMI F47 / ITIC for industrial sites (deferred — can ship as a preset in a later release).

---

## R8. Unit-System Defaults and Conversions

**Decision**: Reuse `lib/calculations/voltage-drop/unitConversions.ts` style (single source of truth) and add motor-specific conversions:

- Power: HP ↔ kW (1 HP = 0.7457 kW)
- Inertia: lb-ft² ↔ kg-m² (1 lb-ft² = 0.0421401 kg-m²)
- Cable size: AWG/kcmil ↔ mm² (existing lookup; share with Voltage Drop)
- Speed: rpm ↔ rad/s (× 2π/60)
- Torque: lb-ft ↔ N-m (1 lb-ft = 1.35582 N-m)

All conversions performed in mathjs BigNumber to preserve test-case agreement when the user toggles the standard switcher.

**Rationale**: Constitutional requirement (Principle IV) plus user-experience parity with Voltage Drop and Conduit Fill v2.

---

## R9. Visualization Library

**Decision**: Recharts (already a project dependency — used in Generator Sizing for the load profile chart and in Harmonic Analysis for THD spectrum).

Two charts:
1. **Starting current vs time**: line series for each method's I(t) overlaid with the motor t-vs-I thermal limit curve. Shaded "danger zone" above the limit.
2. **Voltage-dip indicator**: bar with active-threshold marker and computed-dip marker, color-coded.

**Rationale**: Reusing the existing chart library keeps bundle size flat and visual consistency with Generator Sizing.

**Alternatives considered**:
- Custom SVG (rejected — duplicates Recharts' tooltip / responsive container work).
- D3 directly (rejected — too low-level for the task; no benefit over Recharts here).

---

## R10. Reference Worked Examples for Test Data

**Decision**: Three primary reference cases ship as Vitest fixtures:

1. **IEEE 3002.7-2018 Annex C Case 1** — 100 HP 460 V Code G motor, 1500 kVA/5.75% transformer, calculation of DOL voltage dip. Used for `voltageDip.test.ts` nominal case.
2. **Beeman, "Industrial Power Systems Handbook" Example 6-3** — 200 HP autotransformer-start at 65% tap, computation of line-side current. Used for `methods/autotransformer.test.ts`.
3. **NEMA MG 1 typical 50 HP 4-pole** — full nameplate set used to validate `accelerationTime.ts` and the comparison-table ranking.

Method-specific edge cases (Y-Δ open-transition transient, soft-starter ramp-time variations, VFD bypass) get synthetic test cases with hand-calculated expected values documented in the test file.

**Rationale**: Pinning tests to citable published examples is the cleanest path to defending calculation accuracy in PR review and matches the precedent set by Battery (IEEE 485) and Cable Sizing (NEC Annex C) tests.

---

## Summary

All Phase 0 questions resolved. Phase 1 may proceed with confidence.

| ID | Decision Summary |
|----|------------------|
| R1 | Per-unit Thevenin method per IEEE 3002.7 §7.2 |
| R2 | Series-sum complex impedances; defaults from IEEE C37.010 |
| R3 | Ship NEMA Code Letter table + IEC Design N/H defaults; midpoint when only letter known |
| R4 | Five method-specific multiplier modules; autotrans uses a² on line side |
| R5 | Quasi-static IEEE 3002.7 integration with three-point motor torque curve |
| R6 | NEMA MG 1 typical t_stall by HP range; user-overridable |
| R7 | IEEE 1668 thresholds: 10% steady, 20% transient, 5% sensitive (overridable) |
| R8 | mathjs BigNumber for unit conversions; share existing helpers where possible |
| R9 | Recharts (existing dependency) for current-vs-time and voltage-dip visuals |
| R10 | Three published worked examples as Vitest fixtures |
