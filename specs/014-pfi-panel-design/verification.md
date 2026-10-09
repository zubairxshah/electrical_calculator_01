# Verification: PFI Panel kVAR Design

**Feature**: 014-pfi-panel-design | **Date**: 2026-10-10

## Automated

| Check | Result |
|---|---|
| `npx vitest run __tests__/unit/calculations/power-factor-correction` | **96 / 96 pass** (7 files) |
| Stage 1 regression (SC-001), 4 cases incl. MV and derated | pass. One deliberate change, see below |
| Example B: 300 kVAR, 1:2:4, 6 outputs → 20/40/80/80/80, 15 levels, C/k 0.1443 A | exact (stepBank.test.ts) |
| Example C: 7 % @ 400 V/50 Hz → 189.0 Hz, Uc 430.1 V, Ur 480 V, L 0.7667 mH, Qr 66.96 kVAR | pass (detuning.test.ts) |
| Example D: IEC 103.2 A → fuse 125 / contactor 115 / 35 mm²; NEC 81.19 A → 90 / 95 / 4 AWG; panel 619.2 A → 630 A incomer and busbar | pass (switchgear.test.ts) |
| Overrides: undersized → `OVERRIDE_UNDERSIZED` error; valid → kept and marked (FR-015a) | pass |
| Persist migration v0 → v1, pre-upgrade history entries load with defaults (FR-004) | pass (store.test.ts) |
| PDF sections: every step row, C/k, fr, incomer, standards, "No detuning applied", override marker, ASCII-only text (FR-018) | pass (pdf.test.ts) |
| `npx tsc --noEmit` filtered to touched paths | 0 errors (324 errors elsewhere in untouched test files) |
| `npx next build` | pass; `/power-factor-correction` prerendered static |
| `next start` smoke test | `/power-factor-correction` serves 200 with the stepper, stage titles and summary strip |

## Deliberate change to stage 1 (SC-001 exception)

`selectCapacitorVoltageRating` compared `rating >= 1.1 × U` in floating point. For U = 400 V, `1.1 × 400 = 440.00000000000006`, so 440 V was skipped and 480 V was returned. The fix adds a 1e-9 tolerance (`capacitorData.ts`). Effect: **400 V systems now get 440 V capacitors** (stage 1 `capacitorBank.ratedVoltage` and the stage 3 non-detuned rating). The other voltages in the snapshot (415, 480, 11,000 V) are unchanged. The snapshot was updated for that one field, with a comment in the test.

## Process note

The test files for each module were written before their implementation, but the separate "Red" run was skipped. The first run of each suite was already against the new module.

## Open — user checks

- **T030**: browser walkthrough (quickstart.md steps 1–8), including the PDF in Chrome/Firefox/Edge, mobile layout of the stepper and the switchgear table, and reload persistence.
- Review the generic rating series in research R8 (contactor AC-6b frames, gG fuses, busbars) against your usual manufacturer.
