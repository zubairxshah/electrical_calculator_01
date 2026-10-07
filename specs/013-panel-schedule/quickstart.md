# Quickstart & Worked Examples: Panel Schedule

**Feature**: 013-panel-schedule | **Date**: 2026-10-07

## Run

```bash
npm run dev            # http://localhost:3000/panel-schedule
npx vitest run __tests__/unit/calculations/panel-schedule
```

## Worked Example A — 208Y/120 V 3φ 4W, 42 spaces (per-phase loading)

| Ckt | Spaces | Poles | Load | Phases |
|---|---|---|---|---|
| 1 Lighting | 1 | 1 | 1,200 VA | A |
| 2 Receptacles | 2 | 1 | 1,440 VA | A |
| 3 Water heater 208 V | 3, 5 | 2 | 4,800 VA | B 2,400 / C 2,400 |
| 4 Receptacles | 4 | 1 | 1,800 VA | B |
| 6 Copier | 6 | 1 | 1,000 VA | C |
| 7 RTU | 7, 9, 11 | 3 | 15,000 VA | A/B/C 5,000 each |

Expected:
- Phase VA: **A 7,640 · B 9,200 · C 8,400**. Total 25,240 VA. Average 8,413.33 VA.
- Imbalance = max(|7,640 − 8,413.33|, |9,200 − 8,413.33|, |8,400 − 8,413.33|) / 8,413.33 = 786.67 / 8,413.33 = **9.35 %** (≤ 10 % target → OK).
- Phase currents (VA/120): **A 63.67 A · B 76.67 A · C 70.00 A**. Total current 25,240 / (√3 × 208) = **70.06 A**.
- Neutral (1-pole loads only): Ia = 2,640/120 = 22.0, Ib = 1,800/120 = 15.0, Ic = 1,000/120 = 8.333 → I_N = √(484 + 225 + 69.44 − 330 − 125 − 183.33) = **11.84 A**.

## Worked Example B — NEC demand (occupancy "other", 208Y/120 V)

| Category | Connected | Rule | Demand |
|---|---|---|---|
| Lighting (continuous) | 20,000 VA | Table 220.42 other 100% | 20,000 |
| Receptacles | 15,000 VA | Table 220.44: 10,000 + 50 % × 5,000 | 12,500 |
| Motor 10 HP 3φ | 30.8 A × 208 × √3 = 11,096.2 VA | Table 430.250 | 11,096.2 |
| Motor 5 HP 3φ | 16.7 A × 208 × √3 = 6,016.5 VA | Table 430.250 | 6,016.5 |
| Largest motor +25 % | — | 430.24 | 2,774.1 |
| HVAC heating 10,000 / cooling 8,000 | 18,000 VA | 220.60, larger only | 10,000 |
| Continuous +25 % (lighting) | — | 215.2(A)(1) | 5,000 |
| **Total demand** | | | **≈ 67,386.8 VA** |

Design current = 67,386.8 / (√3 × 208) ≈ **187.0 A** → recommended main **200 A** (240.6(A)). On a 225 A bus: OK.

## Worked Example C — Demand table spot checks

- Dwelling lighting 150,000 VA → 3,000 + 35 % × 117,000 + 25 % × 30,000 = **51,450 VA**.
- Warehouse lighting 20,000 VA → 12,500 + 50 % × 7,500 = **16,250 VA**.
- Hospital lighting 60,000 VA → 40 % × 50,000 + 20 % × 10,000 = **22,000 VA**.
- Hotel lighting 120,000 VA → 60 % × 20,000 + 50 % × 80,000 + 35 % × 20,000 = **59,000 VA**.
- Kitchen 4 × 5,000 VA → 80 % = 16,000. Two largest = 10,000 → **16,000 VA**. Kitchen 6 items (8,000, 8,000, 1,000 × 4) = 20,000 × 65 % = 13,000 < two largest 16,000 → **16,000 VA**.
- Receptacles 8,000 VA → **8,000 VA** (below 10 kVA).

## Worked Example D — Balancing

A 208Y/120 V 30-space panel with ten 1-pole circuits of 1,500 VA all placed on phase A spaces (1, 2, 7, 8, 13, 14, 19, 20, 25, 26). Before: A = 15,000, B = C = 0 → imbalance 200 %. After the proposal: the phase VA is in {4,500, 4,500, 6,000} or better (10 circuits cannot split evenly into 3) → imbalance ≤ **20 %**. This is the best achievable result, so the test asserts optimality: max − min ≤ 1,500.

## Manual walkthrough (US1–US5)

1. Open `/panel-schedule`. Choose NEC, 208Y/120 V, 42 spaces, bus 225 A, main 200 A.
2. Enter Example A. Check the phase badges per space and the summary values above.
3. Move circuit 6 to space 8. The phase changes to A and the totals update.
4. Lock circuit 7. Run **Balance**. Check the preview, then accept. Circuit 7 has not moved.
5. Switch to the Demand tab. Enter Example B's categories and confirm ≈ 187 A → 200 A.
6. Export the PDF. Check the header, every space, the totals and the demand table.
7. Reload the page; the panel is restored. Save to history, clear it, then restore.
8. Switch to IEC 230/400 V. The labels become L1/L2/L3, currents use 230 V, and the diversity editor appears.
