# Tasks: Battery Calculator Standards Hardening (015)

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/battery-engine.contract.md
**Tests**: TDD required (Constitution V) — write tests first; they must fail before implementation.
**Test path**: `__tests__/unit/calculations/battery/` (only this tree is collected by Vitest).

Format: `- [ ] T### [P?] [US?] Description` — [P] = parallelisable (different files, no dependency).

## Phase 1: Setup & Gates

- [X] T001 Run the baseline battery suite `npx vitest run __tests__/unit/calculations/battery` and record the pass count (expect 45).
- [X] T002 [P] Create `lib/standards/batteryReference.ts` with `LEAD_ACID_TEMP_TABLE`, `STANDARD_CHARGER_RATINGS_A`, `NFPA855_THRESHOLDS_KWH`, `NEC480_DISCONNECT_V`, `NEC706_ESS_MIN_KWH` (values per research D5, D7, D9).
- [X] T003 **GATE (user sign-off)**: approve the IEEE 485 lead-acid temperature table and the "no credit above 25 °C" rule (research D5).
- [X] T004 **GATE (user sign-off)**: approve the per-chemistry nominal/float/end voltages (D6) and the charger factors/max C-rates (D7).
- [X] T005 **GATE (user sign-off)**: approve the I_gas values (D8) and the NEC/NFPA thresholds (D9).
- [X] T006 **GATE (user sign-off)**: approve the standby fixtures S1–S3 and the re-derived fixture C (D11) in `lib/calculations/battery/__tests__/fixtures.ts`.

## Phase 2: Foundational (blocks all stories)

- [X] T007 Add `BATTERY_ELECTRICAL_PROFILES` (electrical, charging, I_gas, usesLeadAcidTempTable) for all 9 chemistries in `lib/standards/batteryReference.ts` — kept out of the shared `BatteryTypeSpec` (also used by Battery Comparison) to keep the diff small (D6–D8).
- [X] T008 Extend `lib/types/calculations.ts`: inputs (`application`, `loadType`, `designMargin`, `minLoadVoltage`, `maxLoadVoltage`, `endVoltagePerCell`, `rechargeHours`, `standingLoadAmps`, `rechargeFactor`, `roomVolumeM3`), `AppliedFactors.designMargin`, `FactorValue.tcf?`, result fields (`application`, `voltageWindow`, `charger`, `ventilation`, `installationChecks`, `bankEnergyKWh`), new warning types.
- [X] T009 Write a FAILING test `__tests__/unit/calculations/battery/cacheKey.test.ts`: changing only `tempFactorOverride`, `peukertExponentOverride`, `designMargin` or `application` changes the result (G14).
- [X] T010 Fix the cache key in `lib/calculations/battery/index.ts` to a sorted full-input serialisation (D10) → T009 green.

**Checkpoint**: types compile (`npx tsc --noEmit`); 45 baseline tests still pass.

## Phase 3: US1 — Correct standby sizing (P1) 🎯 MVP

- [X] T011 [P] [US1] Write a FAILING test `__tests__/unit/calculations/battery/application.test.ts`: G6 (DoD = 1 in standby for all chemistries; chemistry DoD in cycling), G7 (round-trip never used), G8 (fraction formula incl. design margin), loadType defaults (ac 0.95, dc 1.00), standby fixtures S1–S3 within ±2 %, SC-002 (≤ 60 % of the v1 size for 48 V/2 kW/2 h VRLA).
- [X] T012 [P] [US1] Write a FAILING test `__tests__/unit/calculations/battery/roundTrip.test.ts`: G2 across 9 chemistries × 2 applications × 2 load types (≤ 1 %).
- [X] T013 [US1] Update `lib/calculations/battery/derating.ts`: application-aware `dodFactor`, `efficiencyFactor` (conversion, loadType default), new `designMarginFactor`, `resolveBaseFactors` fraction = dod × temp × aging × eff / DM, `assembleAppliedFactors` incl. designMargin.
- [X] T014 [US1] Update the existing fixtures/tests to pin cycling + `efficiency` = the old round-trip value + `designMargin: 1` so A, B, D, E, F remain identical (D11); keep the 011 tests green.
- [X] T015 [US1] Add `application` to the result in `result.ts`; add the "method updated to IEEE 485 standby practice" note to the recommendations when standby.
- [X] T016 [US1] Update `lib/validation/batteryValidation.ts`: efficiency 0.5–1.0, designMargin 1.0–1.5, application/loadType enums.
- [X] T017 [US1] Update `stores/useBatteryStore.ts`: defaults (`application: 'standby'`, `loadType: 'ac'`, `designMargin: 1.1`), persist `version: 2`, migrate (drop v1 `efficiency`, set standby, map `minVoltage` → `minLoadVoltage`); add a migration test `__tests__/unit/calculations/battery/storeMigration.test.ts`.
- [X] T018 [US1] UI `components/battery/BatteryInputForm.tsx`: application selector (Standby/float, Cycling), load type (AC via inverter / DC), design margin input, relabel efficiency as "Conversion efficiency"; use focus/blur local string state for numeric inputs.
- [X] T019 [US1] UI `components/battery/BatteryResults.tsx`: design margin row in the applied factors; DoD row shows "100 % — full discharge to end voltage (IEEE 485)" in standby.

**Checkpoint**: US1 tests green; `npx tsc --noEmit` clean.

## Phase 4: US2 — Voltage window & cell count (P1)

- [X] T020 [P] [US2] Write a FAILING test `__tests__/unit/calculations/battery/voltageWindow.test.ts`: G10 (125 V/105 V lead-acid → 60 cells; float conflict warning; fallback to block count with `source: 'block'`; chemistry default end voltage; override).
- [X] T021 [US2] Create `lib/calculations/battery/voltageWindow.ts` (cells, nominal/float/end bank V).
- [X] T022 [US2] Wire it into `runtime.ts`/`sizing.ts` (cellsInSeries from the window when given), add `voltage-window` warning in `assess.ts`, `voltageWindow` in the result.
- [X] T023 [US2] Validation: min < max, end voltage > 0 and < nominal cell V.
- [X] T024 [US2] UI: voltage window inputs (min/max load V, end V/cell with the chemistry default as placeholder) and a results card (cells, nominal/float/end bank V, source note).

## Phase 5: US3 — IEEE 485 temperature table (P2)

- [X] T025 [P] [US3] Write a FAILING test `__tests__/unit/calculations/battery/temperatureTable.test.ts`: G9 (25 °C → 1.00; table points exact; interpolation; clamp + warning; > 25 °C → 1.00; non-lead-acid unchanged); fixture C re-derived.
- [X] T026 [US3] Implement the table lookup in `derating.ts` (`leadAcidTcf`), `temperature.tcf`, the `temperature-table-clamped` warning in `assess.ts`.
- [X] T027 [US3] UI: show TCF next to the temperature factor in the results.

## Phase 6: US4 — Charger sizing (P2)

- [X] T028 [P] [US4] Write a FAILING test `__tests__/unit/calculations/battery/charger.test.ts`: G11 (200 Ah, 1.10, 8 h, 10 A → 37.5 A → 40 A rating), chemistry default factor, override, charge-rate warning, > 500 A rounding.
- [X] T029 [US4] Create `lib/calculations/battery/charger.ts`; wire it into both modes; `charge-rate` warning.
- [X] T030 [US4] Validation (rechargeHours, rechargeFactor, standingLoadAmps); UI inputs + a charger results card.

## Phase 7: US5 — Ventilation (P3)

- [X] T031 [P] [US5] Write a FAILING test `__tests__/unit/calculations/battery/ventilation.test.ts`: G12 (VRLA 24 cells 200 Ah → Q float = 0.05×24×1×200/1000 = 0.24 m³/h, boost 1.92 m³/h; FLA; NiCd; lithium n/a; ACH with room volume).
- [X] T032 [US5] Create `lib/calculations/battery/ventilation.ts`; wire it into the result.
- [X] T033 [US5] Validation (roomVolumeM3); UI room-volume input + a ventilation results card.

## Phase 8: US6 — Installation checks (P3)

- [X] T034 [P] [US6] Write a FAILING test `__tests__/unit/calculations/battery/installationChecks.test.ts`: NEC 480.7 > 60 V; NEC 480.10 lead-acid/nickel; NEC 706 > 1 kWh; NFPA 855 per-chemistry threshold; G13 (sizing numbers identical with/without checks).
- [X] T035 [US6] Create `lib/calculations/battery/installationChecks.ts`; `bankEnergyKWh` and `installationChecks` in the result.
- [X] T036 [US6] UI: an "Installation checks" card (info vs warning styling, clause cited).

## Phase 9: US7 — Polish (P3)

- [X] T037 [P] [US7] Write `__tests__/unit/calculations/battery/defaults.test.ts` (011-T030): every factor (dod, temperature, aging, efficiency, designMargin, peukert, rechargeFactor) is `source: 'default'` when unspecified and `'user'` when overridden, and the override changes the result.
- [X] T038 [P] [US7] Create `components/battery/BatteryReferenceDialog.tsx` (pattern of `components/conduit-fill/ConduitFillReferenceDialog.tsx`): method, factors with defaults/ranges, standards list; a header button in `BatteryCalculator.tsx` (011-T049).
- [X] T039 [US7] Write `__tests__/unit/calculations/battery/a11y.test.tsx` (testing-library, jsdom): every input/select in `BatteryInputForm` has an accessible name; results region has `aria-live`. Then do the accessibility pass on `components/battery/*` (011-T048): labels/`htmlFor`, `aria-describedby` for errors, `aria-live="polite"` on results, visible focus rings, radiogroup semantics for selectors.
- [X] T040 [US7] Extend `lib/pdfGenerator.battery.ts`: application, all factors incl. design margin/TCF, voltage window, charger, ventilation, installation checks (FR-030).

## Phase 10: Final

- [X] T041 Full battery suite + `npx tsc --noEmit` + `npm run build`.
- [X] T042 Tick the 011 deferred tasks T030/T048/T049 in `specs/011-battery-revamp/tasks.md` with a pointer to 015.
- [ ] T043 **USER**: manual walkthrough of `quickstart.md` steps 1–12 incl. the PDF.

## Dependencies

- T003–T006 gate the Green steps of the fixture-dependent tests (T011, T025, T028, T031, T034); the Red tests may be written before sign-off.
- Phase 2 → all stories. US1 → US2 (shares runtime/sizing wiring). US3–US6 are independent of each other after US1. US7 (T040 PDF) is last.

## MVP

Phases 1–4 (US1 + US2): correct standby sizing and the voltage window.
