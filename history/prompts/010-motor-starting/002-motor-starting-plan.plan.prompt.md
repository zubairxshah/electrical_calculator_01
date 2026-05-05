---
id: 002
title: Motor Starting Analysis Plan
stage: plan
date: 2026-05-04
surface: agent
model: claude-opus-4-7
feature: 010-motor-starting
branch: 010-motor-starting
user: zubairxshah
command: /sp.plan
labels: [motor-starting, planning, IEEE-3002.7, NEC-430, IEC-60034-12, IEEE-1668, source-impedance, dual-standard]
links:
  spec: specs/010-motor-starting/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/010-motor-starting/plan.md
  - specs/010-motor-starting/research.md
  - specs/010-motor-starting/data-model.md
  - specs/010-motor-starting/contracts/calculator-api.md
  - specs/010-motor-starting/quickstart.md
  - CLAUDE.md
tests:
  - none (planning stage)
---

## Prompt

/sp.plan (no user-supplied input — plan executed against `specs/010-motor-starting/spec.md`).

## Response snapshot

Filled the four-artifact planning bundle for Motor Starting Analysis:

**plan.md** — TypeScript 5.x / Next.js 16.1 / mathjs / Vitest stack matching existing calculators. Constitution check passes all seven principles with checkboxes ticked. Source layout mirrors Generator Sizing/Conduit Fill: `app/motor-starting/` + `components/motor-starting/` + `lib/calculations/motor-starting/methods/{dol,starDelta,autotransformer,softStarter,vfd}.ts` + Zustand store + Zod validation + jsPDF generator + per-method Vitest suites. Complexity Tracking documents two justified design choices (separate module per method; mathjs BigNumber for source-chain math).

**research.md** — Resolves 10 Phase-0 questions:
- R1 per-unit Thevenin method per IEEE 3002.7 §7.2
- R2 series-sum complex impedances; defaults from IEEE C37.010
- R3 NEMA Code Letter table (NEC 430.7(B), letters A–V) and IEC Design N/H defaults
- R4 method-specific multipliers — DOL (1, 1), Y-Δ (⅓, ⅓), Autotrans (a², a²) with line-side a² subtlety, Soft Starter (linear V ramp w/ current cap), VFD (≈ FLA, full T)
- R5 quasi-static IEEE 3002.7 acceleration-time integration with three-point motor torque curve
- R6 NEMA MG 1 typical t_stall by HP range, user-overridable
- R7 IEEE 1668 dip thresholds (10% steady, 20% transient, 5% sensitive)
- R8 mathjs unit conversions (HP↔kW, AWG↔mm², lb-ft²↔kg-m²)
- R9 Recharts (existing dependency) for current-vs-time and voltage-dip visuals
- R10 three published reference cases (IEEE 3002.7 Annex C, Beeman Ex 6-3, NEMA MG 1 50 HP) as Vitest fixtures

**data-model.md** — Six reference entities (NemaCodeLetter, IecDesignClass, NemaDesignClass, ThermalLimitDefault, Ieee1668Threshold, CableImpedance) plus eight input entities (Motor, Load, UtilitySource, Transformer, CableSegment, SourceChain, MethodConfig, MotorStartingInput) and four computed entities (ThevenZResult, MethodResult, ComparisonResult, MotorStartingResult). Zod validation rules and Zustand state shape captured.

**contracts/calculator-api.md** — Function-level contracts for `analyzeMotorStarting` (top-level orchestrator), `computeSourceImpedance`, five method modules with uniform `AnalyzeMethodFn` signature, `computeVoltageDip`, `computeAccelerationTime`, `buildComparison`, lookup helpers, and unit conversions. Performance contract: ≤ 50 ms per method, ≤ 2 s for full comparison. Test contract: nominal + boundary + edge + error per exported function, ≥ 90% statement coverage.

**quickstart.md** — Manual end-to-end walkthrough (100 HP NEMA Code G motor, 1500 kVA / 5.75% transformer, 4/0 AWG / 50 m feeder), programmatic invocation example with full `MotorStartingInput` literal, test commands, and a pre-PR checklist.

**CLAUDE.md** — `update-agent-context.ps1 -AgentType claude` ran successfully, recording the motor-starting tech stack.

Post-design constitution re-check: all seven principles still pass; no violations introduced by the design. No architectural decisions cross-cut the platform — all methodology choices (per-unit chain, separate method modules, quasi-static accel integration) are localized to this feature and documented in research.md / Complexity Tracking, so no ADR suggestion was warranted.

## Outcome

- ✅ Impact: Plan + research + data-model + contracts + quickstart all written. Branch on `010-motor-starting`, no commits yet. Ready for `/sp.tasks`.
- 🧪 Tests: none (planning stage)
- 📁 Files: plan.md, research.md, data-model.md, contracts/calculator-api.md, quickstart.md, CLAUDE.md updated
- 🔁 Next prompts: `/sp.tasks` to generate dependency-ordered task breakdown; consider running `/sp.adr` only if a cross-cutting decision surfaces during task generation
- 🧠 Reflection: Heavier engineering content than prior calculators (per-unit math, complex impedance, quasi-static integration). Worth budgeting extra time at task-generation stage to write test fixtures from IEEE 3002.7 Annex C precisely — small input transcription errors there will look like calculator bugs and waste cycles.

## Evaluation notes (flywheel)

- Failure modes observed: none in this run.
- Graders run and results (PASS/FAIL): plan.md constitution-check section — PASS (all 28 checkboxes ticked across 7 principle groups).
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): when `/sp.tasks` runs, consider grouping tests by method to make TDD red-green-refactor cycles more focused — single test file per method module, not one giant test file.
