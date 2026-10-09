# Research: PFI Panel kVAR Design

**Feature**: 014-pfi-panel-design | **Date**: 2026-10-10

Decisions used by plan.md, data-model.md and the contracts. The baseline is the existing calculator (`lib/calculations/power-factor-correction/pfcCalculator.ts`). It stays unchanged, and stage 1 output is the input to the new design modules.

## R1 — Design target kVAR

- **Decision**: The step bank is sized against the **derated required kVAR**: `target = deratingFactors?.adjustedKVAR ?? correctionSizing.requiredKVAR`. Stage 1's existing `capacitorBank` (standard bank rating, equal steps) stays in the stage 1 results for continuity. The panel design (stages 2–4) supersedes it, and the summary strip uses the stage 2 total.
- **Rationale**: Users keep the stage 1 numbers (FR-002). Sizing steps from the standard bank rating would round twice.
- **Alternative**: Replacing `capacitorBank` was rejected because it breaks SC-001 regression and pre-upgrade history entries.

## R2 — Step sequences and recommendation

- **Decision**: A sequence is a ratio head; the **last ratio repeats** until the bank reaches the target. Presets: `1:1:1` (equal), `1:2:2`, `1:2:4`, `1:1:2:2`, plus `custom` (explicit kVAR list).
  - Step i kVAR = u × r_i, where u (the smallest step) comes from `STANDARD_STEP_SIZES` (5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75, 100). Larger steps are multiples built from standard units.
  - For a preset and a controller limit N (6, 8 or 12 outputs; default 12), choose the **smallest u** such that the step count needed for Σ ≥ target is ≤ N.
  - **Auto-recommend** (default): evaluate all presets and pick, in order, (a) the smallest u (best resolution), (b) overshoot within one smallest step, (c) the fewest steps, (d) the smallest overshoot, (e) preset order `1:2:4`, `1:2:2`, `1:1:2:2`, `1:1:1`.
  - When no standard u fits within 12 steps, use u = ceil(target / (Σ of the 12-step ratios)) rounded up to a multiple of 5 kVAR, and raise a warning.
- **Worked example**: target 300, preset `1:2:4`, N = 6. With u = 20: 20 + 40 + 80 + 80 + 80 = 300 in 5 steps ✓. With u = 15: 15 + 30 + 60 + 60 + 60 + 60 = 285 < 300 in 6 steps ✗. So u = 20.
- **Fixed correction**: one step equal to `selectStandardKVAR(target)` and no controller (FR-010).

## R3 — Switching levels (resolution)

- **Decision**: The number of distinct switching levels is the count of distinct **non-zero subset sums** of the step kVARs, enumerated exactly. With at most 12 steps there are 4,096 subsets, which is negligible. Resolution = smallest step.
- **Rationale**: This is exact for any sequence, including custom ones. The "total ÷ u" shortcut is only valid for binary-compatible sequences.

## R4 — Controller and C/k

- **Decision**: `C/k = Q1 / (√3 · U · k)` (3φ) or `Q1 / (U · k)` (1φ). Q1 is the smallest step in var, U the line voltage, and k = CT primary / CT secondary. The result is in amperes (CT secondary). The controller size is the next of {6, 8, 12} ≥ the outputs used. Fixed banks have no controller.
- **Rationale**: C/k is the reactive current of the smallest step as seen by the controller. Controllers (e.g. per IEC 61921 guidance and common manufacturer manuals) use it as the response threshold. Some manuals suggest setting 0.6–0.7 × this value. That is shown as an info note, not applied.
- **Example**: 20 kVAR, 400 V, 1000/5 → 20,000 / (1.7321 × 400 × 200) = 0.1443 A.

## R5 — Minimum load variation check

- **Decision**: Input `minLoadVariationKVAR` (optional). The default threshold is 10 % of the bank total. Warn when u exceeds it (FR-009). Also warn when total − target > u (overshoot → leading-PF risk at light load).

## R6 — Detuning recommendation (clarified 2026-10-10)

- **Decision**: `thirdHarmonic` flag → 14 %; else THD > 10 % → 7 %; else none. 5.67 % is manual only. The existing `harmonicDistortion` input (THD %) is reused.
- **Rationale**: This is the industry rule chosen by the user. 14 % is needed when the 3rd harmonic is significant because 7 % (fr = 189 Hz) sits too close to 150 Hz.

## R7 — Detuned step equations

All values per step, star-equivalent, with U as the line voltage and f the system frequency.

| Quantity | Formula |
|---|---|
| Tuning frequency | `fr = f / √p` (7 %: 189.0 Hz @ 50, 226.8 Hz @ 60; 5.67 %: 210.0 / 252.0; 14 %: 133.6 / 160.4) |
| Capacitor terminal voltage | `Uc = U / (1 − p)` |
| Capacitor rated voltage | next of `CAPACITOR_VOLTAGE_RATINGS` ≥ `1.1 × Uc` (IEC 60831-1 permits 1.1 Un for 8 h/24 h, so the margin keeps continuous operation inside the rating) |
| Capacitor reactance | `Xc = U² / (Qeff · (1 − p))` |
| Reactor reactance / inductance | `XL = p · Xc`, `L = XL / (2πf)` (mH per phase) |
| Capacitor rated kVAR | `Qr = Ur² / Xc = Qeff · (1 − p) · (Ur / U)²` |
| Step current (fundamental) | `I = Qeff / (√3 · U)` |

- **Worked example**: 400 V, 50 Hz, 7 %, Qeff = 50 kVAR. Uc = 430.1 V, 1.1 × Uc = 473.1 → Ur = 480 V. Xc = 3.4409 Ω, XL = 0.24086 Ω, L = 0.7667 mH. Qr = 66.96 kVAR. I = 72.17 A.
- **Non-detuned**: Ur = existing `selectCapacitorVoltageRating(U)` (≥ 1.1 U), and Qr = Qeff · (Ur / U)², so the capacitor delivers Qeff at U. This keeps the convention consistent: the step table always lists **effective kVAR at U**, and the rated nameplate kVAR is a derived column.
- Reactor thermal and linearity ratings are out of scope (resonance/thermal excluded). An info note gives the typical linearity requirement (≈ 1.6–1.8 × In) without computing it.

## R8 — Switchgear sizing

| Item | IEC (IEC 61921, 60831-1, 60947-4-1) | NEC (NEC 460) |
|---|---|---|
| Design current factor | 1.3 × 1.1 = **1.43** × In | **1.35** × In (460.8(A)) |
| Contactor (AC-6b, capacitor duty) | next frame ≥ design current | next frame ≥ design current |
| Protection | gG fuse or MCCB: next standard ≥ design current (IEC fuse series / `IEC_BREAKER_RATINGS`) | fuse or CB: next of `NEC_BREAKER_RATINGS` (240.6(A)) ≥ design current |
| Step cable | copper, `IEC_COPPER_AMPACITY` 70 °C PVC column (`ampacity75C` key = B1) ≥ design current | copper, `NEC_COPPER_AMPACITY` 75 °C column (110.14(C)) ≥ design current |
| Incomer / busbar | Σ step In × 1.43 → next breaker rating / next busbar rating | Σ In × 1.35 → next 240.6(A) rating / next busbar rating |

- **Contactor frames (generic AC-6b capacitor-duty current classes)**: 12, 18, 25, 32, 40, 50, 65, 80, 95, 115, 150, 185, 225, 265, 330, 400 A. Steps above 400 A raise an error and suggest splitting the step.
- **Contactor type note**: non-detuned → "capacitor-duty with damping (inrush-limiting) resistors". Detuned → "standard capacitor-duty; inrush limited by reactor".
- **IEC gG fuse series**: 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250 A. Protection type is a user choice (fuse | MCCB), default fuse under IEC and CB under NEC.
- **Busbar series**: 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000 A.
- **Detuned steps**: In uses the fundamental effective current (R7). The 1.43 factor covers harmonic content within the scope here.
- **Worked example (IEC, non-detuned, 400 V, 50 kVAR)**: In = 72.17 A → 103.2 A → fuse 125 A, contactor 115 A, cable 35 mm² (110 A).
- **Worked example (NEC, 480 V, 50 kVAR)**: In = 60.14 A → 81.19 A → OCPD 90 A, contactor 95 A, cable 4 AWG (85 A @ 75 °C).
- **Overrides (FR-015a)**: a per-step override for contactor A, protection A and cable size. An override below the computed minimum (rating < design current, or cable ampacity < design current) gives an `OVERRIDE_UNDERSIZED` error.

## R9 — Voltage scope

- **Decision**: Stages 2–4 are enabled only for U ≤ 1,000 V. For MV, the stepper shows stages 2–4 disabled with a note (spec edge case).

## R10 — Arithmetic and patterns

- **Decision**: Native `number` arithmetic per **ADR-007** (default policy). Display rounding only.
- **Pattern**: The new pure modules sit beside the existing ones in `lib/calculations/power-factor-correction/`. The design is computed synchronously from (stage 1 results + design inputs) in a selector/`useMemo`, so stages 2–4 update instantly (SC-004) without pressing Calculate. Numeric inputs use focus/blur local string state. Handlers read `usePowerFactorCorrectionStore.getState()` (stale-closure feedback), and the touched handlers in `PowerFactorCorrectionTool.tsx` are fixed in passing.
- **Persistence**: Zustand persist `version: 1` with `migrate` adding design defaults. History entries gain an optional `design` field, and entries without it load with defaults (FR-004).
