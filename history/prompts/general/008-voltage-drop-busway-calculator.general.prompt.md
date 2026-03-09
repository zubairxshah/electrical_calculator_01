---
id: 008
title: Voltage Drop Calculator with Busway Support
stage: general
date: 2026-03-09
surface: agent
model: claude-opus-4-6
feature: voltage-drop
branch: main
user: zubairxshah
command: (user request)
labels: ["voltage-drop", "busway", "IEC-61439-6", "calculator", "NEC"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - types/voltage-drop.ts
  - lib/calculations/voltage-drop/voltageDropCalculator.ts
  - lib/calculations/voltage-drop/voltageDropData.ts
  - lib/validation/voltageDropValidation.ts
  - stores/useVoltageDropStore.ts
  - app/voltage-drop/page.tsx
  - app/voltage-drop/VoltageDropTool.tsx
  - components/voltage-drop/VoltageDropInputForm.tsx
  - components/voltage-drop/VoltageDropResults.tsx
  - components/voltage-drop/VoltageDropHistorySidebar.tsx
  - lib/pdfGenerator.voltageDrop.ts
  - components/layout/Sidebar.tsx
  - components/layout/TopNavigation.tsx
tests:
  - none
---

## Prompt

"2 Voltage drop standalone"
followed by:
"also add busaway system in voltage drop"

## Response snapshot

Built standalone Voltage Drop Calculator (#18) with full busway/busbar trunking system support. Features: cable mode (IEC/NEC tables, parallel runs, cable size suggestions) and busway mode (sandwich/non-sandwich, copper/aluminum, 225A-6300A ratings, power factor impact). Includes Zod validation, Zustand store with history, PDF export, visual drop bar. Added to Design & Installation nav category. Build passes clean.

## Outcome

- Impact: New calculator added (18th). Standalone voltage drop with dual cable/busway modes covering IEC 61439-6 and NEC standards.
- Tests: none
- Files: 13 files created/modified (types, calculations, validation, store, pages, components, PDF generator, navigation)
- Next prompts: Add unit tests for voltage drop calculations; consider harmonic derating for busway; add conduit fill calculator
- Reflection: Busway support was added as a follow-up request, integrating smoothly into the existing cable-based architecture by using a mode toggle pattern.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add unit tests for voltageDropCalculator.ts to validate IEC/NEC compliance
