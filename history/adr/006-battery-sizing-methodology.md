# ADR-006: Battery Sizing Methodology & Chemistry Data Model

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2026-06-21
- **Feature:** 011-battery-revamp (Battery Calculator Revamp)
- **Context:** The existing Battery Calculator (`/battery`, calculator #1) computes backup time with a first-order `usableEnergy / load` formula that **ignores the selected chemistry entirely** — two very different chemistries return identical answers, violating Constitution Principle I (Calculation Accuracy, IEEE 485 within 2%). Compounding this, chemistry is identified by **three mismatched vocabularies**: the Zod schema enum (`VRLA-Gel/FLA/LiFePO4/Li-ion`), the form options, and the authoritative reference dataset `lib/standards/batteryTypes.ts` (`VRLA-GEL/Li-Ion-LFP/Li-Ion-NMC/Li-Ion-LTO/NiFe/Flow-Vanadium`), so the rich per-chemistry data (DoD, temperature coefficient, round-trip efficiency, cycle life) cannot even be looked up. The revamp must produce standards-defensible sizing in **two directions** (runtime from installed capacity, and required capacity for a target backup time), follow IEEE 485 / IEC 60896,62619 / NEC, and remain approachable (few inputs → correct result). Because the Zustand store **persists inputs to `localStorage`**, any change to the chemistry vocabulary risks breaking returning users' saved state.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES — defines the calculation engine, the canonical chemistry data model, and a persisted-state migration contract that every future battery-related feature depends on.
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES — corrected-capacity vs. full IEEE 485 Kt worksheet; canonical-dataset vs. schema-as-source; Peukert vs. manufacturer rate tables.
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES — spans calculations, schema, validation, types, store persistence, datasheet library, and PDF output.
-->

## Decision

Adopt an integrated **chemistry-aware, bidirectional corrected-capacity sizing methodology** with a single canonical chemistry data model:

- **Sizing method (bidirectional)**: `Required_Ah = (Load_W × Runtime_h) / (V_dc × DoD × TempFactor × Efficiency × AgingFactor)`, algebraically inverted to solve runtime from installed capacity. One factor set drives both product modes, guaranteeing round-trip self-consistency (size → runtime ≥ target).
- **Derating factors, per chemistry, sourced from `batteryTypes.ts`**: usable **DoD** (recommended, override-clamped to max), **temperature correction** from the per-chemistry `tempCoefficient` and optimal band, **EOL aging** default 0.8 (≡ 1.25 oversize, Constitution Conservative Defaults), system **efficiency** from `roundTrip.typical`, and a **Peukert exponent** (new per-chemistry field) for discharge-rate derating of short autonomies.
- **Single source of truth for chemistry**: `lib/standards/batteryTypes.ts` `BatteryChemistry` (8 canonical IDs) becomes authoritative. The Zod schema, form, and types align to it. A new `lib/standards/batteryChemistryMap.ts` maps legacy IDs → canonical and carries display labels.
- **Persisted-state migration**: the Zustand `persist` config gains a `version` bump and a `migrate()` that rewrites stored legacy `chemistry` values through the map and backfills new fields (`mode`, `temperature`, etc.), so existing `localStorage` state loads without error.
- **Engine structure**: promote the monolithic `lib/calculations/battery.ts` to a pure-function module `lib/calculations/battery/` (`runtime`, `sizing`, `derating`, `bankConfig`, `dischargeCurve`), mirroring the motor-starting calculator, so each unit is independently testable under the TDD gate.
- **Outputs**: bank configuration (cells/blocks in series, strings in parallel), applied-factor breakdown with source (default/user/datasheet) and standard references, and a plain-language pass/marginal/fail verdict.

## Consequences

### Positive

- **Fixes the core defect**: chemistry now materially changes results (SC-001); two chemistries with different usable DoD or rate behavior can no longer return identical answers.
- **One vocabulary, permanently**: eliminates the three-way mismatch and unlocks the already-authored reference dataset; zero unmapped chemistry options (SC-002).
- **Two products from one engine**: bidirectional formula yields runtime and sizing modes with guaranteed round-trip consistency (SC-005), with no duplicated math.
- **Standards-defensible & traceable**: each factor carries an IEEE 485 / IEC citation surfaced in UI and PDF (Constitution Principle III).
- **Testable**: pure, single-concern modules align with the TDD-NON-NEGOTIABLE gate for P1 calculators; contract guarantees G1–G5 are directly unit-testable.
- **Safe upgrade for returning users**: the persist migration prevents the redesign from corrupting or rejecting saved state.

### Negative

- **Approximation vs. the formal worksheet**: the Peukert/coefficient approach is an engineering approximation of IEEE 485's per-cell Kt (rate-to-capacity) and temperature-correction tables; accuracy is targeted at ±2% for the common single-load case but will diverge for complex multi-period duty cycles until Kt tables are digitized.
- **New per-chemistry parameter to maintain**: the Peukert exponent must be curated per chemistry and validated against fixtures (defaults proposed: lead-acid 1.2, NiCd/NiFe 1.1, lithium/flow 1.02).
- **Migration is a permanent compatibility surface**: the legacy→canonical map and persist `version` must be retained indefinitely to honor old `localStorage` payloads.
- **Refactor blast radius within the feature**: touching schema, validation, types, store, and calculations together is a larger diff than a formula-only patch (contained to battery files; no unrelated calculators touched).

## Alternatives Considered

### Alternative A — Keep the current energy/load formula, just add chemistry as a multiplier
**Why rejected**: A single lumped multiplier cannot represent the distinct, interacting effects of DoD ceiling, temperature, and rate derating, nor support reverse sizing or bank configuration. It would paper over, not fix, the accuracy defect.

### Alternative B — Full IEEE 485 cell-sizing worksheet (per-period duty cycle + Kt rate-to-capacity tables + Annex temperature tables)
**Why rejected (deferred)**: The most rigorous option and the long-term target, but it requires digitizing per-cell-type Kt and temperature-correction tables that the product does not yet hold. The corrected-capacity method with a Peukert rate term reaches the ±2% tolerance for the single-load case that covers the vast majority of users. The `derating.ts` module boundary is deliberately shaped so Kt tables can replace the approximation later without changing the public engine API.

### Alternative C — Treat the Zod schema's 6-value enum as the source of truth (smaller change)
**Why rejected**: The schema list is the smaller, less-documented, differently-spelled vocabulary; adopting it would discard the already-authored NMC/LTO/NiFe/Vanadium-Flow profiles and their standards-referenced data. The richer dataset is the correct authority.

### Alternative D — Per-model manufacturer rate-vs-capacity tables instead of a generic Peukert exponent
**Why rejected as the default (adopted as an enhancement)**: Real rate curves are more accurate but only exist for specific models. They are incorporated through the datasheet library when present; the per-chemistry Peukert exponent remains the necessary fallback for generic chemistry-only sizing.

### Alternative E — No persisted-state migration (reset stored inputs on load)
**Why rejected**: Silently discarding returning users' saved configuration is a poor experience and risks confusing data loss; an explicit `migrate()` is low-cost and preserves continuity.

## Rationale Summary

The corrected-capacity bidirectional method with chemistry data as the single source of truth is the smallest change that makes the calculator *correct* and *defensible* while enabling both runtime and sizing modes from one engine. It deliberately accepts a bounded approximation (Peukert vs. formal Kt tables) in exchange for shipping a standards-citing, ±2%-accurate engine now, with a clean upgrade path to the full IEEE 485 worksheet. The canonical data model plus persistence migration turns a latent three-way inconsistency into one maintained vocabulary without breaking existing users.

## Constitution Compliance

- **Principle I (Calculation Accuracy)**: ±2% vs IEEE 485 worked-example fixtures; round-trip self-consistency exact within rounding.
- **Principle II (Safety-First Validation)**: chemistry-limit, temperature-range, and over-rate warnings added on the existing <100ms validation path.
- **Principle III (Standards Compliance & Traceability)**: per-factor IEEE 485 / IEC citations in results and PDF.
- **Principle V (Test-First, NON-NEGOTIABLE for P1)**: pure single-concern modules; contract guarantees G1–G5 unit-tested; fixture values require user approval before Green.
- **Conservative Defaults**: aging 0.8, temperature 25°C, DoD from recommended (not maximum).

## References

- Feature Spec: [specs/011-battery-revamp/spec.md](../../specs/011-battery-revamp/spec.md)
- Implementation Plan: [specs/011-battery-revamp/plan.md](../../specs/011-battery-revamp/plan.md)
- Research (decisions D1–D6): [specs/011-battery-revamp/research.md](../../specs/011-battery-revamp/research.md)
- Data Model & Contracts: [specs/011-battery-revamp/data-model.md](../../specs/011-battery-revamp/data-model.md), [contracts/sizing-engine.contract.md](../../specs/011-battery-revamp/contracts/sizing-engine.contract.md), [contracts/chemistry-data.contract.md](../../specs/011-battery-revamp/contracts/chemistry-data.contract.md)
- Related ADRs: ADR-003 (mathjs high-precision arithmetic — used by the engine), ADR-004 (client-side PDF generation — `pdfGenerator.battery.ts`), ADR-005 (Visual Input OCR Approach — datasheet OCR P3 reuses Tesseract.js + pdf.js), ADR-002 (Zustand state management — persist `migrate` extends it)
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) — Principles I, II, III, V, Conservative Defaults
- Evaluator Evidence: [PHR #11 (plan)](../prompts/011-battery-revamp/011-battery-revamp-plan.plan.prompt.md)
