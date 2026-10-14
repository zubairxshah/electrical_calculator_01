# Research: Battery Calculator Standards Hardening (015)

**Date**: 2026-10-14 · **Spec**: [spec.md](./spec.md)

Sources: the standards titles are primary; the numeric values were cross-checked against secondary sources (vendor/utility worksheets, Tri-Service EWG TP-4, EN 50272-2 summaries). Every value table below is **APPROVED BY USER 2026-10-15** (gating tasks T003–T006) before fixtures go Green (Constitution Principle V).

## D1 — Application mode decides whether DoD is applied

- **Decision**: Standby/float (default) → DoD factor = 1.00, source `default`, cite "IEEE 485-2020 — capacity to end-of-discharge voltage". Cycling → the chemistry's recommended DoD (existing behaviour, override + clamp).
- **Rationale**: IEEE 485 sizes float-service lead-acid to deliver the duty cycle down to the minimum cell voltage at end of life. The ×1.25 aging factor is the margin, so a DoD cap on top double-counts. DoD limits come from cycle-life practice (IEEE 1013 / IEEE 1561, off-grid PV).
- **Alternatives**: Keep the DoD cap everywhere (rejected: about 2× oversizing, which is the defect). Use a chemistry-specific standby DoD (rejected: not how IEEE 485 is written).

## D2 — Efficiency: conversion only

- **Decision**: The `efficiency` input now means load-side conversion efficiency. The default depends on the new `loadType`: `ac` (via inverter/UPS) = 0.95, `dc` = 1.00. Round-trip efficiency is no longer used in sizing (it stays in the dataset for comparison/charger context).
- **Rationale**: Round-trip includes the charge leg, which doesn't affect discharge energy. The battery's own discharge loss is already inside its rated Ah to the end voltage.
- **Migration**: The persisted v1 `efficiency` meant round-trip, so drop it (`undefined` → new default). Bump to persist `version: 2`.
- **Alternatives**: Use √(round-trip) as the discharge efficiency (rejected: double-counts against rated capacity; not IEEE 485 practice).

## D3 — Design margin

- **Decision**: A new factor `designMargin`, default 1.10, range 1.00–1.50, applied as a capacity multiplier (available fraction = 1/designMargin). It is separate from aging (0.8 ≡ ×1.25).
- **Rationale**: IEEE 485 adds a design margin for load growth and less-than-optimum conditions. Practice is 1.10–1.15, and some utilities use 1.05.

## D4 — Combined method

The IEEE 485-style required capacity for a single constant load:

```
I_load      = P_load / (η_conv × V_sys)                              [A]
Ah_required = I_load × t × TCF × DM × AF / (DoD × K_rate)            [Ah]
```

- TCF = temperature correction factor (cell-size multiplier ≥ 1 when cold); DM = design margin; AF = 1/aging (1.25); DoD = 1 in standby; K_rate = Peukert availability (≤ 1).
- Internally the existing structure is kept: `fraction = DoD × (1/TCF) × aging × η_conv × (1/DM)`, so runtime and sizing remain exact inverses (G2).
- V_sys stays the nominal system voltage (as today). For a constant-power load, the average discharge voltage is about 0.95–0.98 × nominal for lead-acid. That difference is covered by the design margin and documented in the reference guide; using end voltage would be over-conservative by about 12 %.

## D5 — Lead-acid temperature table (IEEE 485 Table 1, cell-size correction)

Applies to FLA, VRLA-AGM and VRLA-GEL. Interpolate linearly; clamp outside the range and warn.

| °C | °F | TCF |  | °C | °F | TCF |
|---|---|---|---|---|---|---|
| −3.9 | 25 | 1.520 |  | 25.0 | 77 | 1.000 |
| −1.1 | 30 | 1.430 |  | 26.7 | 80 | 0.980 |
| 1.7 | 35 | 1.350 |  | 29.4 | 85 | 0.960 |
| 4.4 | 40 | 1.300 |  | 32.2 | 90 | 0.940 |
| 7.2 | 45 | 1.250 |  | 35.0 | 95 | 0.930 |
| 10.0 | 50 | 1.190 |  | 37.8 | 100 | 0.910 |
| 12.8 | 55 | 1.150 |  | 40.6 | 105 | 0.890 |
| 15.6 | 60 | 1.110 |  | 43.3 | 110 | 0.880 |
| 18.3 | 65 | 1.080 |  | 46.1 | 115 | 0.870 |
| 21.1 | 70 | 1.040 |  | 48.9 | 120 | 0.860 |
| 23.9 | 75 | 1.011 |  | 51.7 | 125 | 0.850 |

- **Decision (conservative default)**: Take no credit above 25 °C, so TCF = max(1.00, table). High temperature shortens life rather than reliably adding capacity. The full table is still stored.
- **Sign-off item**: confirm the values, and confirm "no credit above 25 °C".

## D6 — Electrical profile per chemistry (V/cell)

| Chemistry | Nominal | Float | End of discharge | Notes |
|---|---|---|---|---|
| FLA | 2.00 | 2.25 | 1.75 | IEEE 485 common end voltage |
| VRLA-AGM | 2.00 | 2.27 | 1.75 | short UPS runtimes often 1.67 (user override) |
| VRLA-GEL | 2.00 | 2.27 | 1.75 | |
| Li-Ion-LFP | 3.20 | 3.40 | 2.80 | BMS cut-off typically 2.5–2.8 |
| Li-Ion-NMC | 3.65 | 4.10 | 3.00 | |
| Li-Ion-LTO | 2.30 | 2.65 | 1.80 | |
| NiCd | 1.20 | 1.42 | 1.14 | IEEE 1115 common end voltage |
| NiFe | 1.20 | 1.45 | 1.00 | |
| Flow-Vanadium | 1.40 | 1.55 | 1.10 | stack-level; manufacturer data preferred |

Cells in series with a window: `n = floor(V_min / V_end)` (minimum 1). Check that `n × V_float ≤ V_max`. Without a window, keep the existing block-based count.

## D7 — Charger (IEEE 946 approach)

```
Ah_removed = P_load × t / (η_conv × V_sys)
I_charger  = Ah_removed × k_recharge / t_recharge + I_standing
```

| Family | k_recharge | Max charge C-rate |
|---|---|---|
| Lead-acid (FLA/AGM/GEL) | 1.10 | 0.20 (FLA) / 0.25 (VRLA) |
| NiCd / NiFe | 1.40 | 0.20 |
| Li-ion LFP / NMC | 1.05 | 0.50 |
| Li-ion LTO | 1.05 | 2.00 |
| Flow-Vanadium | 1.25 | 0.25 |

- Default t_recharge = 8 h. Standard ratings: 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500 A. Above 500 A, round up to the next 100 A.
- The max-rate warning compares (I_charger − I_standing) / C_bank against the maximum C-rate.

## D8 — Ventilation (EN 50272-2 / IEC 62485-2)

`Q = 0.05 × n × I_gas × C_rt / 1000` m³/h (v = 0.05 m³/Ah includes the dilution factor to stay below 4 % H₂ and a safety factor of 5).

| Type | I_gas float (mA/Ah) | I_gas boost (mA/Ah) |
|---|---|---|
| Vented lead-acid (FLA) | 5 | 20 |
| VRLA (AGM/GEL) | 1 | 8 |
| Vented NiCd / NiFe | 5 | 50 |
| Lithium / flow | n/a | n/a |

- n = total cells (series cells per string × strings; block-based count × cells per block, where cells per block = block V / nominal cell V). C_rt = per-string rated Ah (the formula counts each cell's capacity).

## D9 — Installation checks (warnings only)

| Check | Condition | Severity |
|---|---|---|
| NEC 480.7 disconnect | bank nominal > 60 V DC | info |
| NEC 480.10 ventilation | lead-acid / nickel | info |
| NEC 706 ESS scope | energy > 1 kWh (3.6 MJ) | info |
| NFPA 855 threshold | energy > lead-acid 70 kWh, NiCd/NiFe 70 kWh, Li-ion 20 kWh, flow 20 kWh | warning |

Energy = nameplate bank Ah × nominal bank V / 1000. Editions cited: NEC 2020, NFPA 855-2023.

## D10 — Cache key defect

`cacheKey` in `lib/calculations/battery/index.ts` leaves out `tempFactorOverride` and `peukertExponentOverride`. Replace it with a stable serialisation of the whole input object (sorted keys), so new fields can't be forgotten.

## D11 — Effect on existing fixtures (SC-003)

The 011 fixtures (A–F) are recalculated in **cycling** mode with `efficiency` pinned to the old round-trip value and `designMargin: 1.0`. Under those settings fixtures A, B, D, E and F stay identical, which proves no regression in the shared math. **Fixture C (VRLA-AGM at 0 °C) changes by design**: the linear model gave a temperature factor of 0.60 (1 − 0.02 × 20), while the IEEE 485 table gives TCF ≈ 1.399, so the available fraction is 0.715. Its expected values are re-derived and re-approved at T006. New standby fixtures are added at T006.

## D12 — Standby fixtures (for T006 sign-off)

All at ≤ C/20 (Peukert = 1), aging 0.80, design margin 1.10, standby (DoD = 1).

| ID | Inputs | Hand calculation | Expected Ah |
|---|---|---|---|
| S1 | 48 V, 240 W, 20 h, VRLA-AGM, 25 °C, DC load (η 1.00) | 240×20/48 = 100 Ah × 1.10 / 0.80 | **137.50** |
| S2 | as S1 but AC load (η 0.95), 10 °C (TCF 1.19) | 240×20/(48×0.95) = 105.26 × 1.19 × 1.10 / 0.80 | **172.24** |
| S3 | as S1 but NiCd at 0 °C (coefficient 0.2 %/°C below 15 °C → 0.97) | 100 / 0.97 × 1.10 / 0.80 | **141.75** |
| C′ | 011 fixture C (runtime 48 V, 200 Ah, 480 W, VRLA-AGM, 0 °C), cycling, η pinned 0.85, DM 1.00; TCF(0 °C) = 1.3986 → avail 0.7150 | 200×48×(0.5×0.7150×0.8×0.85)/480 | **4.862 h** (was 4.08 h) |
