# ADR-008: Battery Sizing Method v2 — Application-Aware IEEE 485 Corrections

- **Status:** Accepted
- **Date:** 2026-10-15
- **Feature:** 015-battery-standards
- **Amends:** [ADR-006](./006-battery-sizing-methodology.md) (sizing formula factors only; module structure and chemistry data model unchanged)
- **Context:** A gap review (2026-10-14) found that the ADR-006 formula `Required_Ah = (W × h) / (V × DoD × TempFactor × Efficiency × Aging)` applies the chemistry's cycling DoD and the battery's round-trip efficiency to every design. For IEEE 485 standby (float) service, the DoD cap double-counts the end-of-life aging margin, and round-trip efficiency includes a charge leg that doesn't affect discharge. The result is that lead-acid standby banks were oversized by about 2×. It also had no design margin, and it used a linear temperature coefficient for lead-acid instead of IEEE 485's electrolyte-temperature correction table.

## Decision

- **Application mode**: `standby` (default) sizes to full discharge to the end-of-discharge voltage (DoD = 1). `cycling` keeps the chemistry DoD limit (IEEE 1013 / 1561 practice).
- **Efficiency** means load-side conversion efficiency only (AC via inverter 0.95, DC 1.00). Round-trip efficiency is removed from sizing.
- **Design margin** is a separate factor (default 1.10, range 1.00–1.50) alongside aging (0.80 ≡ ×1.25).
- **Lead-acid temperature** uses the IEEE 485 cell-size correction table, interpolated, with no credit above 25 °C. Other chemistries keep the coefficient model.
- Resulting product: `fraction = DoD × (1/TCF) × Aging × η_conv / DM`; `Required_Ah = P·t / (V·fraction·K_rate)`. Runtime and sizing remain exact inverses.
- **Persisted state** migrates v1 → v2: application defaults to standby, and the v1 `efficiency` (round-trip meaning) is dropped.

## Consequences

### Positive
- Standby sizing follows IEEE 485 practice. Lead-acid UPS/DC banks drop to roughly half the v1 size (SC-002).
- Each factor is explicit, sourced and overridable. The design margin is visible rather than hidden in conservative defaults.
- The temperature correction matches the published table rather than an approximation.

### Negative
- **Results change for returning users** (intended). A note in the results explains the method update.
- In standby at low rates and 25 °C, chemistries can converge on the same Ah. ADR-006's G1 ("chemistry changes the result") is scoped to cycling mode and to cases where rate or temperature differ.
- The `efficiency` field has changed meaning. The migration handles saved state, but any external consumer of the type must be aware.
- The current basis stays at nominal system voltage (not average discharge voltage). The design margin absorbs that difference.

## Alternatives Considered

- **Keep the DoD cap in all modes**: rejected because it causes the 2× oversizing defect.
- **√(round-trip) as discharge efficiency**: rejected because it double-counts against capacity rated to end voltage, and it isn't IEEE 485 practice.
- **Fold the design margin into the aging factor**: rejected because IEEE 485 treats them separately, and merging them hides intent.
- **Full IEEE 485 duty-cycle worksheet with Kt tables**: still deferred (out of scope for 015). The derating module boundary is unchanged, so it can be added later.

## References

- Spec: `specs/015-battery-standards/spec.md`; research D1–D5, D11–D12: `specs/015-battery-standards/research.md`
- IEEE 485-2020; IEEE 1013; IEEE 1561; Tri-Service EWG TP-4 (temperature table cross-check)
