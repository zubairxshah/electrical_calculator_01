---
id: 003
title: Generator Sizing Implementation Plan
stage: plan
date: 2026-03-31
surface: agent
model: claude-opus-4-6
feature: 001-generator-sizing
branch: 001-generator-sizing
user: zubairxshah
command: /sp.plan
labels: ["generator", "plan", "architecture", "iso-8528", "ieee-3006", "data-model", "contracts"]
links:
  spec: specs/001-generator-sizing/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-generator-sizing/plan.md
  - specs/001-generator-sizing/research.md
  - specs/001-generator-sizing/data-model.md
  - specs/001-generator-sizing/contracts/calculation-modules.md
  - specs/001-generator-sizing/quickstart.md
tests:
  - null
---

## Prompt

/sp.plan — Generate implementation plan for generator sizing calculator feature.

## Response snapshot

Generated complete implementation plan with 5 artifacts:
- **plan.md**: Technical context (TypeScript/Next.js 16.1, mathjs, Zustand, jsPDF), constitution check (all gates pass), project structure (15 source files following established calculator pattern), no complexity violations.
- **research.md**: 8 research decisions — vector power summation (R1), motor starting voltage dip via IEEE 3006.4 (R2), ISO 8528-1 derating linear approximation (R3), standard SFC fuel curves (R4), commercial generator ratings for 50/60Hz (R5), greedy step loading algorithm (R6), NEC 700/701/702 constraint pre-fill (R7), dual unit conversion with internal metric storage (R8).
- **data-model.md**: 5 input entities (LoadItem, GeneratorConfig, SiteConditions, FuelConfig) + 4 output entities (SizingResult, MotorStartingResult, StepResult, FuelResult) + 12 enums.
- **contracts/calculation-modules.md**: 6 pure function modules with typed signatures — loadSummation, motorStarting, stepLoading, derating, fuelConsumption, generatorCalculator (orchestrator) + generatorData (constants/tables).
- **quickstart.md**: 3-phase development sequence (P1→P2→P3), reference files, test targets.
- Agent context updated via update-agent-context.ps1.

## Outcome

- ✅ Impact: Complete architectural plan ready for task generation
- 🧪 Tests: N/A (planning phase — test framework Vitest identified)
- 📁 Files: 5 plan artifacts created, CLAUDE.md updated with tech context
- 🔁 Next prompts: `/sp.tasks` to generate task breakdown with test cases
- 🧠 Reflection: No NEEDS CLARIFICATION items — all technical decisions resolved via research. Architecture follows established ElectroMate pattern exactly (no new abstractions). Calculation modules split by user story for independent testability.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Constitution check — PASS (all gates)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
