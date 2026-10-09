# Quickstart & Worked Examples: PFI Panel kVAR Design

**Feature**: 014-pfi-panel-design | **Date**: 2026-10-10

These are the hand-calculated reference cases. Unit tests assert them, and they double as the manual walkthrough.

## Example A — Stage 1 regression (SC-001)

IEC, 3φ, 415 V, 50 Hz, 100 kW, PF 0.75 → 0.95, delta, automatic, variable, THD 5 %, 35 °C, 0 m.
- Required kVAR = 100 × (tan 41.41° − tan 18.19°) = 100 × (0.88192 − 0.32868) = **55.32 kVAR**
- No derating (combined = 1.0), so the stage 2 target = 55.32 kVAR.
- Snapshot all stage 1 fields before any code change, and assert them unchanged afterwards.

## Example B — Step bank (US2)

Target 300 kVAR, preset 1:2:4, max outputs 6, 400 V, CT 1000/5.
- u = 20 → steps 20/40/80/80/80, total 300, overshoot 0, 5 outputs → 6-output controller.
- Switching levels = 15 (20 … 300 in 20 kVAR increments). Resolution = 20 kVAR.
- C/k = 20,000 / (√3 × 400 × 200) = **0.1443 A**.
- With max outputs 12, the same preset gives u = 10 → 10/20/40×7 = 310 (9 steps, overshoot 10 ≤ u, no warning).

## Example C — Detuning (US3)

400 V, 50 Hz, p = 7 %, step Qeff = 50 kVAR.
- fr = 50 / √0.07 = **189.0 Hz**. Uc = 400 / 0.93 = **430.1 V**. 1.1 × Uc = 473.1 → Ur = **480 V**.
- Xc = 400² / (50,000 × 0.93) = **3.4409 Ω**. XL = 0.07 × Xc = 0.24086 Ω. L = 0.24086 / (2π × 50) = **0.7667 mH**.
- Qr = 50 × 0.93 × (480 / 400)² = **66.96 kVAR**. I = 50,000 / (√3 × 400) = **72.17 A**.
- Recommendation: THD 5 % → none. THD 15 % → 7 %. 3rd harmonic flagged → 14 %.

## Example D — Switchgear (US4)

- **IEC**, 400 V, 50 kVAR step, not detuned: In = 72.17 A. Design current = 1.43 × 72.17 = **103.2 A**. Fuse **125 A** (gG). Contactor frame **115 A**. Cable **35 mm²** (110 A).
- **NEC**, 480 V, 50 kVAR step: In = 60.14 A. Design current = 1.35 × 60.14 = **81.19 A**. OCPD **90 A**. Contactor **95 A**. Cable **4 AWG** (85 A @ 75 °C).
- **Panel** (Example B steps, IEC 400 V): Σ In = 300,000 / (√3 × 400) = 433.0 A. Design current = 619.2 A. Incomer **630 A**. Busbar **630 A**.
- **Override**: a 63 A fuse on the 50 kVAR IEC step → `OVERRIDE_UNDERSIZED` error.

## Manual walkthrough

1. Open `/power-factor-correction`. The stepper shows stages 1–4, and stage 1 is active.
2. Enter Example A and press Calculate. The results match the pre-upgrade values, and the summary strip shows the bank total.
3. Go to Step bank. Auto gives a recommended sequence. Switch to 1:2:4 with 6 outputs and enter CT 1000/5. Check the step table and C/k.
4. Go to Detuning. Set THD to 15 % in stage 1, recalculate, and confirm 7 % is recommended. Tick "significant 3rd harmonic" and confirm 14 %.
5. Go to Switchgear. Check the per-step rows. Override a fuse below the design current and confirm the error. Clear the override.
6. Export the PDF. All four sections and every step row should be present.
7. Reload the page. Inputs and design settings persist. Load an old history entry and confirm no error, with defaults applied.
8. Set voltage to 11,000 V and calculate. Stages 2–4 are disabled with the LV-only note.
