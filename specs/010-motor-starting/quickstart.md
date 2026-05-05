# Quickstart: Motor Starting Analysis Calculator

**Feature**: 010-motor-starting | **Date**: 2026-05-04 | **Phase**: 1

## For developers picking up the feature

This page shows the smallest path from "I have a motor and a source" to "I see voltage dip, accel time, and a recommended method." Run the dev server and walk the route, or invoke the calculator core programmatically as shown below.

---

## End-to-end manual test (after implementation)

1. `npm run dev`
2. Open `http://localhost:3000/motor-starting`
3. Standard switcher should default to **NEC**.
4. Enter motor:
   - Rated power: **100** HP
   - Rated voltage: **460** V
   - Rated current: **124** A (FLA)
   - Poles: **4**
   - Efficiency: **0.93**, PF: **0.86**
   - Design class: **NEMA B**
   - Code letter: **G** (auto-fills LRA ≈ 783 A)
5. Enter load:
   - Profile: **Quadratic (fan/pump)**
   - Break-away torque: **0.20** × T_rated
   - Inertia (WR²): **45** lb-ft²
6. Enter source chain:
   - Utility: 13.8 kV, **500** MVA SC, X/R **10**
   - Transformer: **1500** kVA, 13.8/0.480 kV, **5.75** %Z, X/R **6**
   - Cable: **4/0 AWG** Cu in steel conduit, **50** m, 1 run
7. Click **Compare Methods**.

**Expected outputs**:
- Source Thevenin Z at motor terminals shows per-unit and ohmic values; dominant component is the transformer.
- DOL row: starting current ≈ 783 A (≈ 632% FLA), voltage dip at PCC ≈ 9–13%, IEEE 1668 verdict ✅, accel time within thermal limit, badge "Acceptable" or "Recommended" if no other method beats it on cost.
- Star-Delta row: starting current ≈ 261 A (≈ 211% FLA), voltage dip ≈ 3–5%, but starting torque ≈ 33% of T_st — pump break-away may pass; calculator should compute and show.
- Autotransformer 65% row: line current ≈ a² × 783 = 331 A, dip ≈ 4–6%, torque ≈ 42% of T_st.
- Soft Starter (default 30% initial, 10 s ramp): peak current ≈ 350% FLA (at the cap), dip rises with V along the ramp; report the worst-case dip.
- VFD: current ≈ FLA, dip ≈ 0%, torque up to 1.5 × T_rated, badge "Recommended" if cost weighting wasn't tilted toward low-cost methods.
- Recommendation paragraph names the lowest-cost passing method with rationale.

8. Click **Export PDF** — a multi-page PDF should download within 10 s.
9. Toggle the standard switcher to **IEC** — units rotate to kW/mm², design-class options change to N/H, citations swap to IEC 60034-12 / IEC 60364-5-52. Numerical results should update but stay within ±1% (round-trip unit conversions).

---

## Programmatic use (calculator core)

```ts
import { analyzeMotorStarting } from '@/lib/calculations/motor-starting/motorStartingCalculator';
import type { MotorStartingInput } from '@/types/motor-starting';

const input: MotorStartingInput = {
  standard: 'NEC',
  motor: {
    ratedPower: 100,
    powerUnit: 'HP',
    ratedVoltage: 460,
    ratedCurrent: 124,
    poles: 4,
    efficiency: 0.93,
    powerFactor: 0.86,
    serviceFactor: 1.15,
    designClass: 'B',
    codeLetter: 'G',
  },
  load: {
    torqueProfile: 'quadratic_fan_pump',
    breakawayTorquePerRated: 0.20,
    inertia: 45,
    inertiaUnit: 'lb_ft2',
  },
  sourceChain: {
    utility: {
      primaryVoltage: 13.8,
      shortCircuitMva: 500,
      xOverR: 10,
      isInfiniteBus: false,
    },
    transformer: {
      ratedKva: 1500,
      primaryVoltageKv: 13.8,
      secondaryVoltageV: 480,
      percentZ: 5.75,
      xOverR: 6,
    },
    cable: {
      sizeId: '4/0',
      material: 'Cu',
      lengthMeters: 50,
      parallelRuns: 1,
      conduitType: 'Steel',
    },
    pccLocation: 'transformer_secondary',
  },
  methodConfigs: [
    { method: 'DOL' },
    { method: 'STAR_DELTA', starDeltaTransition: 'closed' },
    { method: 'AUTOTRANSFORMER', autotransformerTap: 0.65 },
    { method: 'SOFT_STARTER', softStarterRampSec: 10, softStarterInitialVoltagePct: 30, softStarterCurrentLimitPctFla: 350 },
    { method: 'VFD', vfdHasBypass: false },
  ],
  voltageDipScenario: 'transient_motor_start',
  createdAt: new Date().toISOString(),
};

const result = analyzeMotorStarting(input);

console.log(result.comparison.recommendedMethod);
console.log(result.comparison.methods.map(m => `${m.methodLabel}: dip=${m.voltageDipAtPccPct.toFixed(1)}%, accel=${m.accelerationTimeSec.toFixed(2)}s, ${m.verdictBadge}`));
```

---

## Running the unit tests

```bash
npm run test                                    # all tests
npm run test -- motor-starting                  # only motor-starting suite
npm run test -- motor-starting --coverage       # with coverage report
```

Coverage target: ≥ 90 % statements (per spec SC-007). The Conduit Fill suite (63 tests) and Generator Sizing suite (56 tests) are the precedent — aim for similar density per calculation module.

---

## Navigation wiring

After implementation, register the new route in:
- `components/layout/TopNavigation.tsx` — add to **Analysis Tools** dropdown
- `components/layout/Sidebar.tsx` — add to **Analysis Tools** category

Both files share the same category structure; updates should mirror each other (this matches the pattern used when Generator Sizing and Harmonic Analysis were added).

---

## Things to check before opening the PR

- [ ] All five method modules have unit tests with at least nominal + boundary + edge + error cases
- [ ] `motorStartingData.ts` matches NEC 430.7(B) and IEC 60034-12 published values (verify against the standards docs, not from memory)
- [ ] Standard switcher updates labels, units, design-class options, citations within 200 ms
- [ ] PDF export contains: project metadata, inputs, source chain, per-method results, comparison table, current-vs-time chart, voltage-dip indicator, all citations
- [ ] No hardcoded magic numbers outside `motorStartingData.ts`
- [ ] `MEMORY.md` updated to add this calculator to the implemented list and bump the count from 21 → 22
