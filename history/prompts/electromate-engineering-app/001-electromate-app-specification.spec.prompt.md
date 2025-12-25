---
id: 001
title: ElectroMate Engineering App Specification
stage: spec
date: 2025-12-24
surface: agent
model: claude-sonnet-4-5-20250929
feature: electromate-engineering-app
branch: 001-electromate-engineering-app
user: zubairxshah
command: /sp.specify
labels: ["electrical-engineering", "calculation-tools", "battery-ups", "solar-design", "cable-sizing", "standards-compliance"]
links:
  spec: specs/001-electromate-engineering-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-electromate-engineering-app/spec.md
  - specs/001-electromate-engineering-app/checklists/requirements.md
tests:
  - Validated specification against quality checklist (all items pass)
  - Verified no [NEEDS CLARIFICATION] markers remain
  - Confirmed technology-agnostic success criteria
  - Validated testable acceptance scenarios for 6 user stories
---

## Prompt

Part 1: The App Constitution (System Prompt)

Role: You are a Senior Electrical Systems Engineer and Full-Stack Developer.

Objective: Build a comprehensive, high-precision engineering web app called "ElectroMate."

Standards: All calculations must adhere to IEC 60364 (Electrical Installations), IEEE 485 (Battery Sizing), and BS 7671 (Cable Sizing). For North America standards must adhere to US standards such NEC, NFPA, and all applicable US standards.

UI Principles:

Minimalist "Industrial" Design: Use a clean, data-heavy dashboard (e.g., Tailwind CSS + ShadcnUI).
Instant Feedback: Results should update in real-time as values change.
Validation: Warn users if input values (like discharge rate) are physically impossible or dangerous.
Exportability: Every tool must have a "Download PDF Report" button for professional documentation.
Do not use emojies, rather focus on SVG graphics and images from freekpik or royalty free images available online.
Give the app a professional engineering look with a robust background.
Footer should have developer name "MZS CodeWorks" with an engineering logo next to it.

Part 2: The Core Feature Plan
Use these "Task Cards" to guide the development through Claude Code.

Module 1: Battery & UPS Engine
Battery Backup Calculator: - Inputs: Battery Ah, System DC Voltage ($V_{dc}$), Load ($W$), Efficiency ($\eta$), and Aging Factor.

Formula: $T = \frac{V_{dc} \times \text{Ah} \times \eta}{P_{load}}$
UPS Sizing Tool: - Input: Critical load list (VA/Watts).

Output: Recommended UPS kVA (including a 25% future growth margin).
Battery Type Selector: - A comparison tool for VRLA, Lithium-Ion, and NiCd, showing trade-offs in lifespan, temperature tolerance, and Depth of Discharge (DoD).
Module 2: Solar & Renewable Design
Panel Array Sizer: - Calculate required Peak Sun Hours (PSH) and Performance Ratio (PR).

Output: Number of panels required based on target daily kWh.
Charge Controller Selector: - Match array $V_{oc}$ and $I_{sc}$ to standard MPPT/PWM specs.
Module 3: Cable & Voltage Drop (The "Pro" Tools)
Cable Sizing (Standard-Based): - Inputs: Current ($I$), Length ($L$), Installation Method (Conduit, Tray, Air), and Ambient Temp.

Database: Reference tables for Copper/Aluminum mV/A/m.
Voltage Drop Calculator: - Formula: $V_{drop} = I \times L \times (mV/A/m) / 1000$.

Flagging: Highlight results in Red if drop exceeds 3% (Lighting) or 5% (Power).

Part 3: Recommended Technical Stack
Instruct Claude Code to use this stack for a modern, fast experience. If you have doubt about any formula research properly and verify results and then apply the implentation.

Frontend: Next.js (React) + TypeScript.
Styling: Tailwind CSS + Lucide React (for engineering icons).
Calculations: Math.js for precision floating-point arithmetic.
Charts: Recharts (to visualize battery discharge curves).
Persistence: LocalStorage (to save user projects without needing a login).
Provide Neon postgres database for registered users and use betterAuth for login and signup
We will add premium features later using Openrouter API and task agents having MCP
Backend should be implemented to control AI based tasks

Part 4: Implementation Workflow (for Claude Code)
Phase 1 (The Shell): "Create the layout with a sidebar containing links to: Battery, UPS, Solar, and Cables."
Phase 2 (Logic): "Implement the Battery Backup Calculator using the data from the 'https://www.solidstatecontrolsinc.com/knowledgecenter/~/media/85b8e51754c446bda1f38449f444471c.ashx"
and solar panel calculations use this guide "https://www.cedengineering.com/userfiles/R08-002%20-%20Design%20and%20Sizing%20of%20Solar%20Photovoltaic%20Systems%20-%20US.pdf"
Phase 3 (Precision): "Add the Voltage Drop tool with a lookup table for standard cable sizes (1.5sq.mm to 500sq.mm)."
Phase 4 (Reporting): "Integrate jspdf to generate professional calculation sheets."

"Initialize a Next.js project using Tailwind CSS. Create a 'Battery Backup Calculator' component that uses the formula: (V * Ah * Efficiency) / Load."

## Response snapshot

Successfully created comprehensive specification for ElectroMate electrical engineering calculation platform:

**Feature Branch**: 001-electromate-engineering-app

**Specification Highlights**:
- 6 prioritized user stories (P1: Battery/UPS/Cables, P2: Solar tools, P3: Battery comparison)
- 23 functional requirements with clear MUST statements
- 15 measurable success criteria (technology-agnostic)
- Comprehensive scope definition (13 in-scope items, 18 out-of-scope items, 11 assumptions)
- Standards compliance: IEC 60364, IEEE 485, BS 7671, NEC
- Key features: real-time calculations, PDF reporting, dual unit support (SI/North American)

**User Stories**:
1. Battery Backup Time Calculator (P1) - IEEE 485 compliant backup time calculations
2. UPS Sizing Tool (P1) - Load list management with 25% growth margin
3. Voltage Drop Calculator with Cable Sizing (P1) - Standards-based ampacity and voltage drop
4. Solar Panel Array Sizing (P2) - PSH and performance ratio based sizing
5. MPPT/PWM Charge Controller Selection (P2) - Safety margin recommendations
6. Battery Type Comparison Tool (P3) - VRLA vs Li-Ion vs NiCd comparison

**Architecture Decisions Deferred**: Technology stack (Next.js, React, Tailwind) intentionally omitted from spec to maintain technology-agnostic requirements. Implementation decisions will be made during planning phase.

**Validation Results**: All specification quality checks passed
- Content quality: Focus on user value, business needs, stakeholder language
- Requirement completeness: Zero clarification markers, all requirements testable
- Feature readiness: Measurable outcomes, independently testable user stories
- Ready to proceed to /sp.plan for technical architecture design

## Outcome

- ✅ Impact: Created production-ready specification for comprehensive electrical engineering calculation platform covering battery/UPS systems, solar design, and cable sizing with standards compliance (IEC/IEEE/NEC)
- 🧪 Tests: Specification validated against quality checklist (all 14 items pass); 6 user stories with detailed acceptance scenarios; 8 edge cases identified
- 📁 Files: spec.md (318 lines), requirements.md checklist (complete validation), feature branch 001-electromate-engineering-app created
- 🔁 Next prompts: /sp.clarify (if stakeholder questions arise) or /sp.plan (to design technical architecture and implementation strategy)
- 🧠 Reflection: Successfully balanced comprehensive feature scope with clear prioritization. Specification demonstrates strong domain expertise in electrical engineering while maintaining technology-agnostic language. Key strength: dual standard support (IEC/SI and NEC) without premature implementation decisions.

## Evaluation notes (flywheel)

- Failure modes observed: None - specification passed all quality validation checks on first iteration
- Graders run and results (PASS/FAIL): Content Quality (PASS), Requirement Completeness (PASS), Feature Readiness (PASS), Technology-Agnostic Criteria (PASS)
- Prompt variant (if applicable): Standard /sp.specify workflow with detailed user input including technical stack preferences (appropriately omitted from spec)
- Next experiment (smallest change to try): Consider adding performance benchmarks section if planning phase reveals calculation complexity requiring performance optimization strategy
