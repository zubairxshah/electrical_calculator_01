# Phase 0 Research: Battery Calculator Revamp

**Feature**: `011-battery-revamp` | **Date**: 2026-06-21

This document resolves the methodology and the open technical decisions for the sizing engine, data reconciliation, and datasheet handling. There were no `[NEEDS CLARIFICATION]` markers carried from the spec; the items below are the engineering decisions the plan depends on.

---

## D1 — Core sizing method (forward and reverse)

**Decision**: Adopt the standards-based corrected-capacity method in both directions.

- **Reverse (sizing)** — required nameplate capacity for a target backup time:

  `Required_Ah = (Load_W × Runtime_h) / (V_dc × DoD × TempFactor × Efficiency × AgingFactor)`

- **Forward (runtime)** — backup time from installed nameplate capacity:

  `Runtime_h = (Installed_Ah × V_dc × DoD × TempFactor × Efficiency × AgingFactor) / Load_W`

Where, per selected chemistry and conditions:
- **DoD** = usable depth of discharge (fraction), from `batteryTypes.ts.depthOfDischarge.recommended` (override allowed up to `.maximum`).
- **AgingFactor** = remaining-capacity design basis at end of life; default **0.8** (i.e., a 1/0.8 = **1.25** oversize), constitution Conservative Defaults; overridable.
- **Efficiency** = system/round-trip efficiency; default from `batteryTypes.ts.efficiency.roundTrip.typical` (÷100), overridable.
- **TempFactor** = capacity-availability multiplier at the operating temperature (see D2).
- **Rate derating (Peukert)** applied on top for short autonomies (see D3).

**Rationale**: This is the canonical UPS/stationary-battery sizing relationship taught by IEEE 485 and the IEC battery standards and reflected by the reference article and multiple independent calculators. It inverts cleanly, giving the two product modes from one factor set and guaranteeing round-trip self-consistency (SC-005).

**Alternatives considered**:
- *Keep the current energy/load formula* — rejected: ignores chemistry, DoD, temperature, and rate; it is the defect being fixed.
- *Full IEEE 485 cell-sizing worksheet with per-period duty-cycle and K-factor (rate-to-capacity) tables* — deferred: most rigorous but needs per-cell Kt tables we do not yet have digitized; the corrected-capacity method with a Peukert rate term reaches ±2% for the single-load case that covers the vast majority of users. Captured as a future enhancement; the module boundary (`derating.ts`) leaves room to swap in Kt tables later.

**Standards**: IEEE 485-2020 (lead-acid sizing, aging margin); IEC 60896-21/22 (VRLA), IEC 62619 (Li-ion); NEC 2020 Art. 480 (installation/safety, surfaced as warnings, not sizing math).

---

## D2 — Temperature correction

**Decision**: Derive `TempFactor` from each chemistry's `temperature.optimal` band and `temperature.tempCoefficient` (already in `batteryTypes.ts`). At/above the optimal band `TempFactor = 1.0`; below it, reduce available capacity by `tempCoefficient` %/°C of deviation, clamped to a sane floor and accompanied by a warning when the operating temperature is outside the rated `operating` range.

**Rationale**: Lead-acid loses materially capacity at low temperature (the dominant real-world derate); the dataset already carries a per-chemistry coefficient, so no new table is needed. Modeling cold (capacity-reducing) deviation as the corrective case matches IEEE 485 practice of sizing at the lowest expected temperature.

**Alternatives**: Full IEEE 485 Annex temperature-correction table per cell type — deferred for the same reason as the Kt tables; the coefficient method is within tolerance for the supported chemistries and is overridable.

---

## D3 — Discharge-rate (Peukert / C-rate) derating

**Decision**: Compute the effective continuous C-rate from `Load_W / (V_dc × Installed_Ah)` (forward) or from the trial capacity (reverse, solved iteratively), and apply a Peukert-style usable-capacity derate for high rates (short autonomy). Lead-acid uses a Peukert exponent (~1.1–1.3); lithium chemistries are near-flat (exponent ≈ 1.0, minimal derate). Report the resulting recommended/continuous C-rate in the result and warn when it exceeds the chemistry's safe continuous rate.

**Rationale**: UPS autonomies are short, so discharge currents are high and lead-acid delivers well below its C/20 nameplate; ignoring this under-sizes the bank. Lithium's flat behavior is represented by a ~1.0 exponent so the same code path serves all chemistries.

**Alternatives**: Manufacturer rate-vs-capacity tables per model — folded into the datasheet library (D5) where a real curve exists; Peukert is the generic fallback for chemistry-only sizing.

---

## D4 — Chemistry-ID reconciliation (three-way mismatch) + persistence migration

**Decision**: Make `lib/standards/batteryTypes.ts` `BatteryChemistry` (8 values: `VRLA-AGM`, `VRLA-GEL`, `Li-Ion-LFP`, `Li-Ion-NMC`, `Li-Ion-LTO`, `NiCd`, `NiFe`, `Flow-Vanadium`) the **single source of truth**. Update the Zod enum in `batterySchema.ts` and the form options to this set. Add `lib/standards/batteryChemistryMap.ts` mapping **legacy IDs → canonical**:

| Legacy (schema/form) | Canonical |
|---|---|
| `VRLA-AGM` | `VRLA-AGM` |
| `VRLA-Gel` | `VRLA-GEL` |
| `FLA` | `VRLA-GEL` *(closest flooded-lead-acid proxy; flag to add a dedicated FLA profile)* |
| `LiFePO4` | `Li-Ion-LFP` |
| `Li-ion` | `Li-Ion-NMC` |
| `NiCd` | `NiCd` |

**Persistence migration is required**: the store persists `inputs` to `localStorage` under `electromate-battery`. Existing users hold legacy chemistry strings that would fail the new Zod enum. Add a Zustand `persist` `version` bump + `migrate(persistedState, fromVersion)` that rewrites `inputs.chemistry` through the map and backfills new fields with defaults.

**Rationale**: One canonical vocabulary eliminates the defect class permanently and unlocks the rich dataset; the migration prevents the redesign from breaking returning users' saved state.

**Alternatives**: Adopt the schema's 6-value set as canonical — rejected: it is the smaller, less-documented list and would discard NMC/LTO/NiFe/Flow profiles already authored. *Open item flagged to user*: whether to author a dedicated **flooded lead-acid (FLA)** profile rather than proxying it to `VRLA-GEL` (low effort, improves correctness for a common chemistry).

---

## D5 — Manufacturer datasheet library (P2) and OCR extraction (P3)

**Decision**: Ship a curated, code-defined library (`lib/datasheets/library.ts`) of real models, each referencing a canonical chemistry and carrying nominal voltage, nameplate Ah, rate characteristics, and temperature behavior; selecting one pre-fills inputs (marked datasheet-sourced) and can override the generic chemistry curve. Defer automated extraction to P3 using the **already-installed** `tesseract.js` (image OCR) and `pdfjs-dist` (PDF text/render); extraction runs client-side, presents detected parameters for explicit user confirmation before applying, and always falls back to manual entry.

**Rationale**: The library makes sizing concrete against procurable products and is a prerequisite for OCR (it defines the parameter schema OCR targets). Because tesseract.js/pdfjs-dist are present in `package.json`, OCR adds no new dependency — only feature code — so it is a low-risk phase-2 layer rather than a hard research unknown.

**Alternatives**: Remote datasheet API/scraping — rejected: out of scope, adds network/PII/availability concerns the constitution flags; client-side parsing keeps calculation data local.

---

## D6 — UI/visualization stack

**Decision**: Reuse the existing shared kit and Design System patterns (CalculationCard, InputField, ResultDisplay, WarningBanner). Add a `BatteryModeSwitch` (Radix Tabs, mirroring the conduit-fill/motor-starting standard switcher), a `DatasheetPicker` (Radix Select + optional upload), and a `DischargeChart` using **Recharts** (already a dependency) fed by the now-populated `dischargeCurve` points. Desktop layout: two-column with a sticky results panel; reflow to one column on mobile. PDF via a new `pdfGenerator.battery.ts` following the established per-calculator generator pattern (jsPDF + html2canvas).

**Rationale**: Maximum reuse, zero new UI dependencies, and visual consistency with the rest of the product and the new Claude Design system project.

**Alternatives**: A charting lib other than Recharts — rejected, Recharts is already used across the app.

---

## Resolved unknowns summary

| Topic | Decision |
|---|---|
| Sizing formula | Corrected-capacity, bidirectional (D1) |
| Temperature | Per-chemistry coefficient method (D2) |
| Rate derating | Peukert exponent, chemistry-aware (D3) |
| Chemistry IDs | `batteryTypes.ts` canonical + legacy map + persist migration (D4) |
| Datasheets | Curated library now (P2), client-side OCR later (P3) |
| UI/charts | Shared kit + Radix Tabs + Recharts + jsPDF (D6) |

## Open items to confirm during `/sp.tasks` or implementation
1. Author a dedicated **FLA (flooded lead-acid)** chemistry profile vs. proxy to `VRLA-GEL` (recommend: author it — small, improves accuracy).
2. Confirm IEEE 485 worked-example fixture values for the ±2% accuracy tests (user approval checkpoint per constitution Principle V).
3. Peukert exponent defaults per chemistry (propose: lead-acid 1.2, NiCd/NiFe 1.1, Li-ion/Flow 1.02) — to be pinned with the test fixtures.
