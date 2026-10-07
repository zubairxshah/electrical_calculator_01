# Verification: Panel Schedule & Phase Load Balancing

**Feature**: 013-panel-schedule | **Date**: 2026-10-08

## Automated

| Check | Result |
|---|---|
| `npx vitest run __tests__/unit/calculations/panel-schedule` | **133 / 133 pass** (9 files) |
| Quickstart Example A (phase VA, currents, imbalance 9.35 %, neutral 11.84 A) | exact (schedule.test.ts) |
| Quickstart Example B (≈ 67,386.8 VA, ≈ 187.0 A → 200 A) | pass, 1e-6 tolerance (demand.test.ts) |
| Quickstart Example C (Table 220.42/220.44/220.56 spot checks) | pass |
| Quickstart Example D (optimal 4/3/3 split, 6 moves) | pass |
| SC-003: 200 seeded random 42-space panels → ≤ 5 % imbalance | ≥ 190 / 200 required, pass; every proposal valid and never worse |
| SC-004: full 84-space panel balanced | ~20 ms (budget 1 s) |
| SC-005: PDF contains every circuit and total, multi-page for 84 spaces | pass (pdf.test.ts) |
| SC-006: invalid placements (overlap, range, poles, delta 1-pole) rejected | pass (placement/validation tests); store rejects invalid edits |
| `npx tsc --noEmit` filtered to new/edited paths | 0 errors |
| `npx next build` | pass; `/panel-schedule` prerendered static |
| `next start` smoke test | `/panel-schedule` serves 200 with title, Add circuit, Balance, Load example; home links to it |

## Open — user checks (release-blocking)

- **T042**: verify NEC 2020 Table 220.42 (dwelling/hotel/warehouse/hospital tiers), Table 220.44, Table 220.56, and Tables 430.248/430.250 values in `lib/standards/motorFlc.ts` against a licensed copy. Verify the IEC 61439-2 assumed-loading (RDF) values.
- **T043**: browser walkthrough (quickstart.md steps 1–8). It includes reload persistence, saved panels restore, balance accept/discard, and the IEC switch. Also check PDF rendering in Chrome, Firefox, Safari and Edge.
