# Verification Record: Arc Flash Calculator (012-arc-flash)

Recorded 2026-10-07 for the PR description (tasks T048–T054).

## T048 / T050 — Accuracy (Constitution Principle I)

Full IEEE 1584-2018 spreadsheet data set (144,000 rows × nominal and reduced cases), via
`node scripts/arc-flash/verify-full-golden.mjs`:

| Quantity | Max relative error | CSV line |
|---|---|---|
| nominal I_arc | 1.44e-15 | 11522 |
| nominal E | 2.43e-6 | 16258 |
| nominal AFB | 1.34e-6 | 16162 |
| reduced I_arc | 4.33e-15 | 124034 |
| reduced E | 2.43e-6 | 16162 |
| reduced AFB | 1.34e-6 | 16578 |

Target ≤ 1e-4: **PASS** (matches the 2.4e-6 measured in research).

- `annexD.test.ts`, `golden.test.ts` (2,000-row subset) and `errata.test.ts` pass.
- `ieee1584Tables.ts` cites jgrimard/arc-flash-calculator (Tables 1, 3, 4, 5, 7) and rwl/arcflash (Tables 2, 8/10), and carries the VOA k7 = 0.33696 note.

## T049 — Regression run and build

- Arc flash suite: 11 files, 144 tests, all pass (the `fullGolden.test.ts` env-gated file is skipped in CI).
- Whole repo `npx vitest run`: 1,081 passed, 1 skipped, **11 failed**. All failures are pre-existing and outside this feature: `earthing/*` (6), lighting (4), `validation/breakerValidation` (1). The branch modifies no files used by those suites.
- `npx next build`: compiled successfully; `/arc-flash` prerendered as static.
- `/arc-flash` served by `next start` returns 200 and includes the PPE method, equipment class, reference guide and PDF export controls.
- Quickstart §3A, §3B, §3C and §3F are automated as end-to-end tests in `ppe.test.ts` (calculator → PPE), §3E in `units.test.ts` and `pdf.test.ts`, and §3G in `store.test.ts`.
- **Pending (manual, in a browser):** the interactive click-through of §3A–§3H, including opening the PDF.

## T053 — Test-first record (Principle V)

- US1 Red run and the user's approval of the test expectations: PHR `history/prompts/012-arc-flash/005-implement-setup-and-red-tests.red.prompt.md`.
- US4 `units.test.ts` was run Red (module missing) before `units.ts` existed. US3 `pdf.test.ts` was written before `label.ts` and `pdfGenerator.arcFlash.ts`.
- `store.test.ts` (US5) passed on its first run because the store actions it tests were built early in T019 to satisfy the shared types (noted in tasks.md T042).
- Coverage gaps (justified): presentational React components have no component tests. They are thin views over tested pure modules, and the repo has no React Testing Library setup for Vitest.

## T054 — ADR follow-up

No ADR has been written for "native arithmetic for empirical models" (a deviation from ADR-003 mathjs; see plan Complexity Tracking and research R5). **Open item:** run `/sp.adr native-arithmetic-for-empirical-models` if a formal record is wanted.

## Release blockers

- **T031 (human):** confirm the NFPA 70E-2024 Table 130.4(E)(a) metric values and the 10 Table 130.7(C)(15)(a) rows against a licensed copy.
- **T051 / T052 (manual):** in a browser, check the visual DANGER state and the validation response time, and open the PDF in Chrome, Firefox and Edge.
