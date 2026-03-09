---
id: 007
title: Motor & HVAC Breaker Sizing Tool Implementation
stage: green
date: 2026-03-04
surface: agent
model: claude-opus-4-6
feature: motor-breaker
branch: main
user: zubairxshah
command: implement plan
labels: ["motor-breaker", "NEC-430", "NEC-440", "IEC-60947", "DC-systems", "HVAC"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - types/motor-breaker-calculator.ts
  - lib/calculations/motor-breaker/iecUtilizationCategories.ts
  - lib/calculations/motor-breaker/motorSizing.ts
  - lib/calculations/motor-breaker/hvacSizing.ts
  - lib/calculations/motor-breaker/motorBreakerCalculator.ts
  - lib/validation/motorBreakerValidation.ts
  - stores/useMotorBreakerStore.ts
  - components/motor-breaker/LoadTypeSelector.tsx
  - components/motor-breaker/MotorBreakerInputForm.tsx
  - components/motor-breaker/MotorBreakerResults.tsx
  - components/motor-breaker/MotorBreakerHistorySidebar.tsx
  - app/motor-breaker/page.tsx
  - app/motor-breaker/MotorBreakerSizingTool.tsx
  - lib/pdfGenerator.motorBreaker.ts
  - components/layout/TopNavigation.tsx (modified)
  - components/layout/Sidebar.tsx (modified)
  - app/page.tsx (modified)
tests:
  - Build passes: npx next build (zero TypeScript errors)
---

## Prompt

Implement the following plan:

# Motor & HVAC Breaker Sizing Tool - Implementation Plan

[Full implementation plan for 14 new files and 3 modified files covering motor protection (NEC 430.52), HVAC (NEC 440 MCA/MOP), DC systems, and IEC utilization categories AC-1..AC-4, DC-1..DC-5. 8-phase implementation: Types → Standards Data → Calculation Engine → Validation → Store → Components → Page/Tool/PDF → Navigation.]

## Response snapshot

Implemented all 14 new files and 3 modified files across 8 phases:
1. Types: Complete type system with all interfaces for motor/HVAC/DC/IEC categories
2. Standards Data: NEC 430.52 multiplier table, NEC 440 MCA/MOP logic, IEC utilization categories
3. Calculation Engine: 10-step orchestrator with DC support (I=P/V), HP-to-kW conversion, derating
4. Validation: Zod schemas with warning checks for MOP vs MCA, DC voltage, high HP
5. Store: Zustand with localStorage persistence, separate history key, FIFO 50 entries
6. Components: LoadTypeSelector (card-based), conditional input form, results display, history sidebar
7. Page: Server metadata + client orchestrator + PDF generator
8. Navigation: Added to TopNavigation, Sidebar, and home page grid

Build passed cleanly after fixing two minor type errors (string[] array type, Zod .issues vs .errors).

## Outcome

- ✅ Impact: New calculator page at /motor-breaker with full NEC 430/440 and IEC 60947 support
- 🧪 Tests: Build passes (npx next build), manual test scenarios defined in plan
- 📁 Files: 14 new files, 3 modified files, 17 total
- 🔁 Next prompts: Add unit tests, verify manual test scenarios, consider API route
- 🧠 Reflection: Followed established patterns closely. Two minor TS issues caught by build.

## Evaluation notes (flywheel)

- Failure modes observed: Type inference for string[] array in PDF generator, Zod v4 uses .issues not .errors
- Graders run and results (PASS/FAIL): Build PASS
- Prompt variant (if applicable): Full plan provided upfront
- Next experiment (smallest change to try): Add automated test coverage for calculation engine
