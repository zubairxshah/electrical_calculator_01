# Contract: Battery Engine v2 (015)

Extends `specs/011-battery-revamp/contracts/sizing-engine.contract.md`. Public API is unchanged: `calculateBattery(inputs)`, `calculateRuntime`, `sizeForRuntime`.

## Guarantees

- **G1 (scoped)**: Chemistry materially affects the result in cycling mode. In standby at ≤ C/20 and 25 °C, chemistries may legitimately converge (no DoD cap), and differences then come from rate, temperature and end voltage.
- **G2 (kept, extended)**: Sizing→runtime with the unrounded required Ah returns the target time within 1 % for every chemistry × application × loadType.
- **G6**: In standby, `appliedFactors.dod.value === 1` regardless of chemistry; in cycling it equals the chemistry recommendation (or the clamped override).
- **G7**: Battery round-trip efficiency never appears in the sizing product.
- **G8**: `fraction = dod × tempAvail × aging × efficiency / designMargin`; required Ah = P·t / (V·fraction·K_rate).
- **G9**: Lead-acid TCF is the interpolated table value, ≥ 1.00 (no credit above 25 °C), clamped at the table ends with a `temperature-table-clamped` warning. Non-lead-acid chemistries keep the 011 coefficient model unchanged.
- **G10**: With `minLoadVoltage` set, `cellsInSeries = max(1, floor(minLoadVoltage / endVoltagePerCell))`; `voltage-window` warning (severity `error`, so the verdict fails, but the result is still returned) iff `cells × floatV > maxLoadVoltage`.
- **G11**: `charger.requiredAmps = ahRemoved × k / tRecharge + standing`; recommended rating = smallest standard rating ≥ required.
- **G12**: `ventilation.applicable === false` for lithium and flow; otherwise Q = 0.05·n·Igas·C/1000.
- **G13**: Installation checks never change any numeric sizing output.
- **G14**: Every result-affecting input changes the cache key.

## Errors

`BatterySizingError(field, message)` for: unknown chemistry, missing Ah (runtime), missing target (sizing). Voltage-window conflicts and charger issues are warnings, not throws.

## Validation surface (`validateBatteryInputs`)

Errors: efficiency ∉ [0.5, 1]; designMargin ∉ [1, 1.5]; minLoadVoltage ≥ maxLoadVoltage; endVoltagePerCell ≤ 0; rechargeHours ≤ 0 or > 168; rechargeFactor ∉ [1, 1.5]; standingLoadAmps < 0; roomVolumeM3 ≤ 0.
