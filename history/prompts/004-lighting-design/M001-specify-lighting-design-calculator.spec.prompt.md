---
id: M001
title: Specify lighting design calculator
stage: spec
date: 2025-12-28
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-lighting-design
branch: 004-lighting-design
user: Claude Code
command: sp.specify
labels: ["lighting-design","specification","dialux-competitor"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-lighting-design/spec.md
  - specs/004-lighting-design/checklists/requirements.md
tests:
  - spec quality checklist validated
---

## Prompt

[Previous conversation context - user provided feature description via Claude CLI system prompt]

Feature description: "Build a comprehensive, high-precision electrical engineering web app called ElectroMate with battery/UPS calculators, solar design tools, and cable sizing tools following IEC/IEEE/NEC standards"

Lighting Design Calculator specification from conversation.

## Response snapshot

Created comprehensive lighting design calculator specification with 6 user stories:

1. **User Story 1 - Basic Indoor Lighting Calculation (P1)**: Lumen method calculations for rectangular rooms
2. **User Story 2 - Visual Input from Floor Plans (P2)**: PDF/image upload with Tesseract.js OCR
3. **User Story 3 - Advanced Lighting Simulations (P2)**: Uniformity analysis, shadow mapping
4. **User Story 4 - Outdoor and Roadway Lighting (P3)**: IES RP-8 and CIE 140 standards
5. **User Story 5 - PDF Report Generation (P1)**: Professional reports with diagrams
6. **User Story 6 - Luminaire Catalog Management (P3)**: Pre-loaded and custom fixtures

Resolved 3 clarification questions:
- Visual Input: Local Tesseract.js OCR (zero cost)
- Outdoor Standards: Both IES RP-8 and CIE 140 (global)
- Subscription: Unlimited basic, 3 visual analyses/month free

Status: Ready for Planning

## Outcome

- ✅ Impact: Created comprehensive spec for DIALux competitor lighting design tool with manual and visual input
- 🧪 Tests: Spec quality checklist validated (all 13 items complete)
- 📁 Files: 2 files created (spec.md ~260 lines, requirements.md checklist)
- 🔁 Next prompts: /sp.plan to create technical architecture, then /sp.tasks for implementation plan
- 🧠 Reflection: Specification covers indoor/outdoor lighting, manual/visual input, dual standards (IES/CIE), PDF reports, luminaire catalog. Freemium model prioritizes accessibility with zero-cost local OCR.

## Evaluation notes (flywheel)

- Failure modes observed: PowerShell script error when creating feature directories - created manually
- Graders run and results (PASS/FAIL): Spec quality checklist PASS - all requirements met
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add lumen efficacy database during planning phase
