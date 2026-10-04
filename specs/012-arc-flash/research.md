# Phase 0 Research: Arc Flash Calculator

**Feature**: `012-arc-flash` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Each decision lists what was chosen, why, and the alternatives considered.

---

## R1. Source of IEEE 1584-2018 model coefficients (Tables 1–5, 7)

**Decision**: Transcribe the coefficient tables into `lib/calculations/arc-flash/ieee1584Tables.ts`:
- Table 1 (intermediate arcing current, k1–k10 at 600/2700/14300 V for VCB/VCBB/HCB/VOA/HOA)
- Table 2 (arcing current variation correction factor, k1–k7)
- Tables 3/4/5 (incident energy / AFB, k1–k13 at 600/2700/14300 V)
- Table 7 (enclosure correction b1–b3, typical and shallow)

**Sources and cross-checks** (both MIT-licensed reference implementations; IEEE 1584-2018 remains the normative source cited in the UI and PDF):

| Table | Source | Cross-check |
|-------|--------|-------------|
| 1, 3, 4, 5, 7 | jgrimard/arc-flash-calculator (JS, MIT) | Table 1 is identical to rwl/arcflash (Rust, MIT), value by value |
| 2 | rwl/arcflash (Rust, MIT) | Reproduces the spreadsheet's reduced/full current ratio for all LV rows to 1e-16 |

**Finding — conflicting Table 2 VOA constant**: one public source gives VOA k7 = 0.334627. Against the IEEE spreadsheet data it is off by 1.2e-3 in the reduced-current ratio. **0.33696 is correct** (exact match). Record the conflict in a code comment so it isn't "fixed" back later.

**Alternatives considered**:
- *Transcribe from a licensed copy of IEEE 1584-2018 by hand*: still the authority for disputes, but error-prone. Two independent implementations that agree, plus the golden dataset (R2), are a stronger check than one manual transcription.
- *Depend on an npm package*: none found that is maintained and verified. A runtime dependency for ~200 lines of formulas isn't justified (Constitution: Complexity Justification).

---

## R2. Accuracy validation strategy (Constitution I, V; spec SC-001)

**Decision**: Three test layers.
1. **Annex D worked examples** (IEEE 1584-2018 D.1 MV and D.2 LV), asserting every published intermediate and final value to the printed precision. Expected values were taken from rwl/arcflash's tests, which cite equation numbers D.9–D.103.
2. **Golden dataset subset**: 144,000 cases generated from the official IEEE 1584-2018 Excel calculator (published by LiaungYip/arcflash, MIT). The full CSV is 22.9 MB, which is too big to commit. Vendor a **deterministic 2,000-row stratified subset** (all 5 electrode configurations × all 7 voltages × all I_bf / gap / D / T / enclosure levels represented; ~320 KB) as `__tests__/fixtures/arc-flash/ieee1584-golden-subset.csv`, with the generating script and attribution.
3. **Named regression tests** for the two known spreadsheet errata (R3) and for the PPE thresholds.

**Tolerance**: ≤ 0.01% relative error vs the golden data and ±0.001 at the printed precision for Annex D. That is far stricter than the spec's ±2% (SC-001), which stays as the user-facing commitment.

**Feasibility spike (done during research)**: a ~60-line native-JS prototype of the planned engine was run against **all 144,000 rows, both nominal and reduced cases**:

| Quantity | Max relative error |
|----------|--------------------|
| I_arc (nominal / reduced) | 1.4e-15 / 4.3e-15 |
| E (nominal / reduced) | 2.4e-6 / 2.4e-6 |
| AFB (nominal / reduced) | 1.3e-6 / 1.3e-6 |

Annex D results from the prototype:

| Case | I_arc (kA) | E (J/cm²) | AFB (mm) | Published |
|------|-----------|-----------|----------|-----------|
| D.1 4.16 kV VCB, nominal, 197 ms | 12.979 | 12.152 | 1606 | ✅ exact |
| D.1 reduced, 223 ms | 12.675 | 13.343 | 1704 | ✅ exact |
| D.2 480 V VCB, nominal, 61.3 ms | 28.793 | 11.585 | 1029 | ✅ exact |
| D.2 reduced, 319 ms | 25.244 | **53.156** | 2669 | ✅ exact |

D.2 shows why spec FR-007 (two arcing times) matters: the reduced-current case governs at **4.6× the nominal energy**.

**Alternatives considered**: Annex D only (two cases can't cover 5 configurations × LV/MV interpolation); the full 144k CSV in the repo (23 MB, slow test run); generating fixtures at test time from a URL (network-dependent, not reproducible).

---

## R3. Known IEEE spreadsheet errata (v2.6.6) — follow the standard's text, not the spreadsheet

**Decision**: The engine follows the equations in the standard. The golden subset agrees with this, because the CSV was produced from a corrected spreadsheet and the prototype matched it.

| Erratum in `IEEE ExcelCalculator_V 2.6.6` | Standard says | Regression test |
|---|---|---|
| Voltage branch uses `V ≥ 0.6 kV` for the MV path | Clause 4.10: **208 V ≤ Voc ≤ 600 V** uses the LV equations | Voc = 600 V exactly → LV path (Eq. 25) |
| VOA, MV, reduced case: k3 term uses full I_arc | The reduced I_arc is used in both current terms | VOA @ 4.16 kV reduced matches the golden data |

**Rationale**: users may compare against the spreadsheet. Documenting the discrepancies in the reference dialog avoids "your tool is wrong" reports.

---

## R4. Reduced arcing current — which terms are reduced

**Decision** (verified against the golden data, both cases):
- **Voc ≤ 600 V**: `I_arc_min = I_arc × (1 − 0.5·VarCf)`. The energy/AFB equations use **unreduced `I_arc_600`** in the k3 term and **`I_arc_min`** in the k13 term.
- **Voc > 600 V**: each intermediate (`I_arc_600`, `I_arc_2700`, `I_arc_14300`) is multiplied by `(1 − 0.5·VarCf)`. The reduced intermediates are used in **both** k3 and k13 terms, and E/AFB are then interpolated exactly as in the nominal case.
- `VarCf` is evaluated with Voc in **kV**.

**Alternatives considered**: reducing only the final interpolated current. This was rejected because it doesn't reproduce Annex D.1 (D.45–D.47 reduce each intermediate).

---

## R5. Arithmetic: native IEEE-754 doubles vs mathjs BigNumber (deviation from ADR-003)

**Decision**: Use **native `number` arithmetic** for the arc flash engine. Record this as a justified deviation from ADR-003 (see plan Complexity Tracking).

**Rationale**:
- The model is **empirical**: coefficients have 4–6 significant figures and the published reference (the IEEE spreadsheet) itself computes in IEEE-754 doubles. BigNumber can't add accuracy beyond the coefficients and would *diverge* from the reference in the last digits.
- The measured worst-case error with doubles is **2.4e-6 relative** (R2), which is 8,000× tighter than the 2% requirement.
- The model is built on `10^x`, `log10` and 7th-order polynomials. Under BigNumber this becomes ~3× more code with no accuracy gain, and it's harder to review against the standard's equations (a constitution principle: "boring, obvious code").
- Precedent: most recent calculators already use native numbers (`short-circuit`, `generator-sizing`, `harmonic-analysis`, `transformer-sizing`). mathjs is imported in only 11 calculation files.

**Alternatives considered**: mathjs BigNumber (rejected above); mathjs `number` mode (no benefit over native).

**Follow-up**: ADR-003's "ALL calculations" scope no longer matches the codebase. Suggest an ADR amendment (see plan).

---

## R6. Enclosure size correction (Table 7, Eqs. 11–15)

**Decision**: Port the standard's procedure:
- **Shallow** enclosure iff Voc < 600 V **and** height < 508 mm **and** width < 508 mm **and** depth ≤ 203.2 mm. Otherwise **typical**.
- Equivalent width/height per the piecewise rules (< 508 mm → 20 in for typical or 0.03937·dim for shallow; 508–660.4 mm → 0.03937·dim; 660.4–1244.6 mm → Eq. 11/12; > 1244.6 mm → capped Eq. 11/12, and VCB height above 1244.6 mm → 49 in).
- `EES = (W₁ + H₁)/2`. CF = Eq. 14 (typical) or 1/Eq. 15 (shallow). VOA/HOA → CF = 1 and enclosure inputs are hidden.

Annex D checks: D.1 EES 36.316, CF 1.284. D.2 EES 24.016, CF 1.085.

---

## R7. Model applicability ranges (spec FR-008, SC-004)

**Decision**: These are **blocking** validation errors (no result shown):

| Parameter | 208–600 V | 601 V–15 kV |
|-----------|-----------|-------------|
| Voc | 208–600 V | 601–15,000 V |
| I_bf | 0.5–106 kA | 0.2–65 kA |
| Gap G | 6.35–76.2 mm | 19.05–254 mm |
| Working distance D | ≥ 305 mm | ≥ 305 mm |
| Arcing time T | > 0 | > 0 |
| Frequency | 50 or 60 Hz | 50 or 60 Hz |

These are **non-blocking warnings** (the calculation still runs; the standard defines the handling):
- enclosure height/width > 1244.6 mm (capped)
- opening width < 4·G
- T > 2 s (offer the 2 s cap per IEEE 1584-2018 §6.9.1 guidance, user choice)
- reduced-current time < nominal time (spec FR-007)
- 208–240 V sustainability note

**Rationale**: SC-004 forbids silent extrapolation outside the empirical range. Warnings follow the Constitution II red/yellow treatment with clause references.

---

## R8. NFPA 70E-2024 data (PPE categories, table method, approach boundaries)

**Decision**: Encode three datasets in `lib/standards/nfpa70e.ts`.

1. **Incident energy method → PPE category** (from Table 130.7(C)(15)(c) minimum arc ratings):
   - E < 1.2 cal/cm²: no arc-rated PPE category required; non-melting clothing still required.
   - E ≤ 4: Cat 1. E ≤ 8: Cat 2. E ≤ 25: Cat 3. E ≤ 40: Cat 4. E > 40: **DANGER**, no category.
   - Minimum arc ratings: 4 cal/cm² (16.75 J/cm²), 8 (33.5), 25 (104.7), 40 (167.5).
   - Boundaries are **inclusive upper bounds** (E = 4.0 → Cat 1). Tests cover exact edges and ±0.01.
   - Clothing and equipment items are **paraphrased** item names (e.g., "Arc-rated long-sleeve shirt and pants, or coverall"), with a clause citation. Notes and footnotes are not reproduced verbatim (NFPA copyright).

2. **Table method** — spec FR-012. *Correction*: the AC equipment table is **NFPA 70E-2024 Table 130.7(C)(15)(a)**, not (C)(15)(c). Encode 11 AC rows:
   - Cat 1: panelboards ≤ 240 V (≤ 25 kA, ≤ 0.03 s, D ≥ 455 mm, AFB 485 mm)
   - Cat 2: panelboards > 240–600 V (25 kA, 0.03 s, 455 mm, AFB 900 mm); 600 V MCCs (65 kA, 0.03 s, AFB 1.5 m); other 600 V class equipment (65 kA, 0.03 s, AFB 1.5 m)
   - Cat 4: 600 V MCCs (42 kA, 0.33 s, AFB 4.3 m); 600 V switchgear/switchboards (35 kA, 0.5 s, AFB 6 m); NEMA E2 starters 2.3–7.2 kV (35 kA, 0.24 s, D ≥ 910 mm, AFB 12 m); metal-clad switchgear 1–15 kV (35 kA, 0.24 s, 910 mm, 12 m); metal-enclosed interrupter switchgear 1–15 kV (same); other 1–15 kV equipment (same)
   - Note on current-limiting devices ≤ 200 A reducing the category by one (min Cat 1): shown as information only, not applied automatically.

   The table method uses the **nominal-case clearing time** (the time the user would read for the available fault current).

3. **Shock approach boundaries, Table 130.4(E)(a), AC**:

   | Nominal (phase-phase) | LAB movable | LAB fixed | RAB |
   |---|---|---|---|
   | 50–150 V | 10 ft 0 in | 3 ft 6 in | Avoid contact |
   | 151–750 V | 10 ft 0 in | 3 ft 6 in | 1 ft 0 in |
   | 751 V–15 kV | 10 ft 0 in | 5 ft 0 in | 2 ft 2 in |

   Imperial values are authoritative. The 2024 edition revised the **metric** RAB values (rounding up to align with OSHA 1910.269, e.g., 0.30 m → 0.31 m) and added a note that RAB values assume ≤ 900 m elevation.

   **⚠ Data-verification task**: the exact 2024 metric column must be checked against a licensed NFPA 70E-2024 copy before release. The plan stores imperial values as the source of truth and holds metric values in a single table that's easy to correct.

**Sources**: UConn EHS "Adapted from NFPA 70E-2024" tables (Tables 130.7(C)(15)(a)/(c) structure and values); EC&M / e-Hazard / Brainfiller 2024-change summaries (RAB metric revision).

---

## R9. IEC presentation (spec US4, FR-014)

**Decision**: IEC mode uses the **same IEEE 1584-2018 engine**. It changes:
- **Units**: J/cm² primary (cal/cm² secondary, 1 cal = 4.184 J); distances in mm/m.
- **PPE**: "Minimum arc rating (ATPV or ELIM per IEC 61482-1-1) ≥ X J/cm²" + "Garments conforming to IEC 61482-2".
- **Informational note**: IEC 61482-1-2 box-test classes (APC 1 at 4 kA / APC 2 at 7 kA, 500 ms) aren't a direct function of incident energy. The note mentions this and says that selecting them by box-test class needs a separate method (e.g., DGUV-I 203-077). That method is out of scope.
- **Label wording**: "Arc Flash Hazard" layout with the same fields. Signal words are kept (WARNING/DANGER), since ANSI Z535 is used internationally and ISO 7010 W012 is the international equivalent symbol.

**Alternatives considered**: implementing DGUV-I 203-077 (a different hazard model; scope creep — spec Assumptions); hiding IEC mode (breaks the dual-standard consistency required by Constitution IV).

---

## R10. Typical equipment values (spec FR-016, US5)

**Decision**: Pre-fill from IEEE 1584-2018 Tables 8 and 10 (via rwl/arcflash):

| Equipment class | Gap (mm) | H × W × D (mm) | Working distance (mm) |
|---|---|---|---|
| 15 kV switchgear | 152 | 1143 × 762 × 762 | 914.4 |
| 15 kV MCC | 152 | 914.4 × 914.4 × 914.4 | 914.4 |
| 5 kV switchgear (large) | 104 | 914.4 × 914.4 × 914.4 | 914.4 |
| 5 kV switchgear (small) | 104 | 1143 × 762 × 762 | 914.4 |
| 5 kV MCC | 104 | 660.4 × 660.4 × 660.4 | 914.4 |
| LV switchgear | 32 | 508 × 508 × 508 | 609.6 |
| LV MCC / panelboard (shallow, ≤ 203.2 mm deep) | 25 | 355.6 × 304.8 × 100 | 457.2 |
| LV MCC / panelboard (deep) | 25 | 355.6 × 304.8 × 250 | 457.2 |
| Cable junction box (shallow) | 13 | 355.6 × 304.8 × 100 | 457.2 |
| Cable junction box (deep) | 13 | 355.6 × 304.8 × 250 | 457.2 |

Each class also proposes a default electrode configuration (VCB). The user can override any value.

Note: the "15 kV MCC" row's gap in rwl's table key is "152" because of a data-structure typo there (its gap field holds 914.4). Gap = 152 mm per IEEE Table 8. Add a fixture test asserting this.

---

## R11. Project conventions (verified in the current codebase, 2026-10-04)

- Layout per calculator: `types/<calc>.ts`, `lib/calculations/<calc>/`, `lib/validation/<calc>Validation.ts` (Zod 4), `stores/use<Calc>Store.ts` (Zustand 5 + persist, history under `electromate-<calc>-history`, FIFO 50), `components/<calc>/`, `app/<calc>/page.tsx` + `<Calc>Tool.tsx`, `lib/pdfGenerator.<calc>.ts` (jsPDF). Reference: `app/conduit-fill/ConduitFillTool.tsx`, `stores/useConduitFillStore.ts`.
- Tests: Vitest 4, under `__tests__/unit/calculations/<calc>/`.
- Navigation: add to `components/layout/Sidebar.tsx` and `TopNavigation.tsx` (category "Protection & Safety"), plus `app/page.tsx` cards.
- Handlers read state via `useStore.getState()` (stale-closure rule). Numeric inputs use focus/blur local string state.
- `010-motor-starting` is **not merged** into `main`. This feature branches from `main` and has no dependency on it.
