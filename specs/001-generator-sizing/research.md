# Research: Generator Sizing Calculator

**Feature**: 001-generator-sizing | **Date**: 2026-03-31

## R1: Vector Power Summation Method

**Decision**: Use component-wise vector summation (sum kW separately, sum kVAR separately, compute kVA from resultant).

**Rationale**: Arithmetic kVA addition overestimates total demand when loads have different power factors. Vector summation correctly accounts for phase relationships between real and reactive power components. This is the standard method per IEEE 3006.4 Section 5.

**Formula**:
- Per load: kW = rated_kW × quantity × diversity_factor; kVAR = kW × tan(acos(PF))
- Total: kW_total = Σ(kW_i); kVAR_total = Σ(kVAR_i); kVA_total = √(kW_total² + kVAR_total²)

**Alternatives considered**:
- Arithmetic kVA sum: simpler but inaccurate (overestimates by 5-15% in mixed PF loads) — rejected
- Per-load kVA with weighted average PF: approximation only — rejected

## R2: Motor Starting Voltage Dip Calculation

**Decision**: Use the simplified generator voltage dip formula from IEEE 3006.4.

**Rationale**: The simplified method is widely accepted for sizing calculations and avoids requiring detailed generator impedance data beyond Xd''.

**Formula**:
- Starting kVA = Motor HP × LR_kVA_per_HP × starting_method_multiplier
- For NEMA code letters: LR_kVA_per_HP is the midpoint of the code letter range (e.g., Code G = 5.6-6.29, use 5.95)
- Voltage dip % = (Starting kVA / (Generator kVA + Starting kVA)) × 100 (considering Xd'')
- More precise: Vdip% = (Xd'' × Starting_kVA) / (Generator_kVA) × 100, capped at realistic range

**NEMA Code Letter Table** (kVA/HP locked rotor):
| Code | kVA/HP Range | Midpoint |
|------|-------------|----------|
| A | 0 – 3.14 | 1.57 |
| B | 3.15 – 3.54 | 3.35 |
| C | 3.55 – 3.99 | 3.77 |
| D | 4.0 – 4.49 | 4.25 |
| E | 4.5 – 4.99 | 4.75 |
| F | 5.0 – 5.59 | 5.30 |
| G | 5.6 – 6.29 | 5.95 |
| H | 6.3 – 7.09 | 6.70 |
| J | 7.1 – 7.99 | 7.55 |
| K | 8.0 – 8.99 | 8.50 |
| L | 9.0 – 9.99 | 9.50 |
| M | 10.0 – 11.19 | 10.60 |
| N | 11.2 – 12.49 | 11.85 |
| P | 12.5 – 13.99 | 13.25 |
| R | 14.0 – 15.99 | 15.00 |
| S | 16.0 – 17.99 | 17.00 |
| T | 18.0 – 19.99 | 19.00 |
| U | 20.0 – 22.39 | 21.20 |
| V | 22.4+ | 22.40 |

**Starting Method Multipliers**:
| Method | Multiplier | Notes |
|--------|-----------|-------|
| DOL (Direct On Line) | 1.00 | Full LR kVA |
| Star-Delta | 0.33 | 1/3 of DOL |
| Autotransformer 65% | 0.42 | (0.65)² |
| Autotransformer 80% | 0.64 | (0.80)² |
| Soft Starter | 0.50 | Configurable 0.30–0.70 |
| VFD | 0.02–0.50 | Configurable, depends on ramp time |

**Alternatives considered**:
- Full transient simulation: requires detailed generator model — overkill for sizing tool
- Manufacturer-specific curves: not available generically — rejected

## R3: ISO 8528-1 Derating Factors

**Decision**: Use linear approximation from ISO 8528-1 standard derating guidelines.

**Rationale**: ISO 8528-1 provides derating guidance for non-standard site conditions. Linear approximation is standard practice for sizing tools and matches published tables within 2%.

**Formulas**:
- Altitude derating: factor = 1 - (0.035 × (altitude_m - 1000) / 300) for altitude > 1000m
  - Approximately 3.5% per 300m above 1000m
- Temperature derating: factor = 1 - (0.02 × (temp_C - 25) / 5) for temp > 25°C
  - Approximately 2% per 5°C above 25°C
- Combined: derating_factor = altitude_factor × temperature_factor (multiplicative)

**Reference conditions** (ISO 8528-1): 25°C ambient, 1000m altitude, 100kPa barometric pressure

**Alternatives considered**:
- Caterpillar/Cummins proprietary curves: manufacturer-specific, not generic — rejected
- Polynomial fit to ISO curves: marginal accuracy gain, added complexity — rejected

## R4: Fuel Consumption Estimation

**Decision**: Use standard specific fuel consumption (SFC) curves for diesel and natural gas.

**Rationale**: Generic SFC values provide adequate planning-level estimates per ISO 8528-5. Manufacturer-specific data varies ±10%, so generic curves are appropriate for sizing.

**Diesel consumption** (approximate, per ISO 8528-5):
| Load % | L/kW/hr |
|--------|---------|
| 25% | 0.30 |
| 50% | 0.24 |
| 75% | 0.21 |
| 100% | 0.20 |

**Natural gas consumption** (approximate):
| Load % | m³/kW/hr |
|--------|----------|
| 25% | 0.42 |
| 50% | 0.34 |
| 75% | 0.30 |
| 100% | 0.28 |

**Tank sizing**: Volume = consumption_rate × kW_rating × load_% × runtime_hours × 1.10 (10% reserve)

**Alternatives considered**:
- Manufacturer data sheets: too specific, not generic — out of scope
- Energy balance thermodynamic model: academic precision, overkill for sizing tool — rejected

## R5: Standard Generator Ratings (kVA)

**Decision**: Use common commercial generator kVA ratings available across major manufacturers.

**Rationale**: These ratings represent the most commonly available generator sizes from Caterpillar, Cummins, Kohler, and other major manufacturers for both 50Hz and 60Hz applications.

**60Hz ratings (kVA)**: 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 125, 150, 175, 200, 250, 300, 350, 400, 500, 600, 750, 800, 1000, 1250, 1500, 1750, 2000, 2500, 3000

**50Hz ratings (kVA)**: 15, 20, 25, 30, 40, 50, 63, 75, 100, 125, 150, 200, 250, 315, 400, 500, 630, 750, 800, 1000, 1250, 1500, 1600, 2000, 2500, 3000

**Selection algorithm**: Find next standard rating ≥ (required kVA / derating_factor / loading_limit)

## R6: Step Loading Auto-Sequence Algorithm

**Decision**: Priority-based greedy sequencing per IEEE 3006.4 guidance.

**Rationale**: IEEE 3006.4 recommends starting the largest motors first (when generator has most reserve capacity for transient), then adding large resistive loads, then smaller loads. Each step increment should not exceed 50% of generator rated kVA.

**Algorithm**:
1. Sort motors by starting kVA descending
2. Sort non-motor loads by kW descending
3. Assign largest motor to step 1
4. For each remaining load, assign to current step if cumulative increment ≤ 50% of generator kVA; otherwise start new step
5. Place motors before resistive loads of similar size

**Alternatives considered**:
- Optimal bin-packing: NP-hard, overcomplicated for typical 5-15 step sequences — rejected
- User-only manual assignment: doesn't guide engineers, misses IEEE 3006.4 value — rejected as sole option (kept as alternative to auto-sequence)

## R7: NEC Emergency Classification Constraints

**Decision**: Pre-fill constraints from NEC articles, allow user override.

| Classification | NEC Article | Startup Time | Min Fuel Duration | Notes |
|---------------|-------------|-------------|-------------------|-------|
| Emergency | 700 | 10 seconds | 2 hours (min) | Life safety, legally required |
| Legally Required Standby | 701 | 60 seconds | 2 hours (min) | Required by code but not life safety |
| Optional Standby | 702 | No requirement | User-defined | Convenience, business continuity |

**Rationale**: These are directly from NEC 2020 Articles 700.12, 701.12, and 702.12. Pre-filling saves engineers from memorizing code requirements while allowing override for jurisdiction-specific amendments.

## R8: Unit Conversion Strategy

**Decision**: Dual input per field using a unit toggle adjacent to each numeric input.

**Key conversions**:
| Metric | Imperial | Factor |
|--------|----------|--------|
| kW | HP | 1 HP = 0.7457 kW |
| meters | feet | 1 m = 3.281 ft |
| °C | °F | °F = °C × 9/5 + 32 |
| liters | gallons (US) | 1 gal = 3.785 L |
| liters/hr | gallons/hr | 1 gal/hr = 3.785 L/hr |

**Implementation**: Store internally in metric (kW, m, °C, L). Convert on display/input. Each field gets a small unit toggle (kW/HP, m/ft, etc.).

**Rationale**: Aligns with ElectroMate's existing dual-standard approach. Internal metric storage avoids rounding errors from repeated conversions.
