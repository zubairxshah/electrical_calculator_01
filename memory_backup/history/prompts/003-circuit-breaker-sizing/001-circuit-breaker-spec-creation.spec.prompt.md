---
id: 001
title: circuit-breaker-spec-creation
stage: spec
date: 2025-12-28
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-circuit-breaker-sizing
branch: 003-circuit-breaker-sizing
user: developer
command: /sp.specify
labels: ["specification", "circuit-breaker", "nec", "iec", "electrical-engineering"]
links:
  spec: specs/003-circuit-breaker-sizing/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-circuit-breaker-sizing/spec.md
  - specs/003-circuit-breaker-sizing/checklists/requirements.md
tests:
  - Specification quality validation (all checks passed)
---

## Prompt

Before moving on to existing implementation plan, we are adding another feature that is very important for electrical engineers. We are now going to build a circuit breaker sizing tool that'll be added into existing electromate plan. Here I provide you comprehensive prompt for further working: To build a professional-grade Circuit Breaker Sizing Calculator, we need to ensure the tool accounts for the divergence between international standards (IEC) and North American standards (NEC).

Below is a structured plan and a comprehensive prompt designed for a Claude CLI (or similar AI agent) to research, architect, and code the application.

---

## 1. Project Execution Plan

To ensure accuracy, the development will follow these four phases:

* **Phase 1: Research & Mapping:** The AI must scrape current NEC (National Electrical Code) and IEC (International Electrotechnical Commission) documentation to map variables like "Continuous Load" factors () vs. "Diversity Factors."
* **Phase 2: Mathematical Engine:** Development of the core logic to handle 1-phase and 3-phase calculations, power factor adjustments, and voltage drop considerations.
* **Phase 3: UI/UX Development:** A clean interface that toggles between Metric (mm²) and Imperial (AWG/kcmil) and handles both Amperage and Kilowatt inputs.
* **Phase 4: Reporting:** Integration of a PDF generation library (like `jsPDF` or `ReportLab`) to output a formal technical specification sheet.

---

## 2. The Comprehensive Claude CLI Prompt

Copy and paste the following prompt into your Claude CLI environment.

> **System Prompt:** You are a Senior Electrical Engineer and Full-Stack Developer.
> **Task:** Create a "Universal Circuit Breaker & Cable Sizing Tool."
> **Step 1: Research Phase**
> Use your browsing capabilities to verify the following:
> 1. **NEC 210.20(A):** Overcurrent protection requirements for continuous vs. non-continuous loads.
> 2. **IEC 60364:** International standards for cable sizing and breaker selection based on installation methods.
> 3. **Standard Ratings:** Collate standard breaker sizes (e.g., 15A, 20A... up to 4000A) used in both US and EU markets.
>
>
> **Step 2: Technical Requirements**
> * **Inputs:** Voltage (120V, 230V, 400V, 480V), Phase (Single/Three), Power Factor, Load (kW or Amps), and Standard (NEC/IEC).
> * **Formulas to Implement:**
> * Current () from Power ():
> * Single Phase:
> * Three Phase:
>
>
> * **Breaker Sizing:** Apply  sizing for continuous loads per NEC or appropriate correction factors () for IEC.
>
>
>
>
> **Step 3: Feature Set**
> 1. **Load Converter:** Automatically toggle between kW and Amps.
> 2. **Voltage Drop Warning:** Calculate % drop based on user-inputted distance.
> 3. **Smart Recommendation:** Suggest specific breaker types (Type B, C, D for IEC or Thermal-Magnetic vs. Electronic Trip for Industrial).
> 4. **Export Logic:** Generate a PDF report containing: Input Parameters, Calculated Load, Minimum Breaker Size, Suggested Wire Gauge, and Compliance Notes.
>
>
> **Step 4: Implementation**
> Write the tool in Python (using Streamlit for UI) or React. Ensure all code is modular.

---

## 3. Core Methodology to be Implemented

### Calculation Standards Table

| Feature | NEC Standard (Americas) | IEC Standard (EU/Asia) |
| --- | --- | --- |
| **Safety Factor** | 125% for Continuous Loads | Factors based on  (Current carrying capacity) |
| **Standard Voltages** | 120V, 208V, 240V, 480V | 230V, 400V, 690V |
| **Units** | AWG / kcmil / Amperes |  / Amperes |
| **Tripping Curves** | Fixed/Adjustable Trip | Type B, C, D curves |

---

## 4. Logical Workflow for the AI

When Claude builds the tool, it will follow this internal logic to ensure the "Industrial Grade" requirement is met:

1. **De-rating Factors:** The tool must ask for ambient temperature and "grouping" (how many cables are together), as these significantly lower the breaker's effective capacity in high-rise risers.
2. **Short Circuit Analysis:** For industrial networks, the tool will provide a field for "kA Rating" (Breaking Capacity) to ensure the breaker can handle a fault without exploding.
3. **The Formula for Results:**


 (For NEC Continuous Loads)


 (Where  is nominal rating and  is design current for IEC)

---

**Would you like me to generate the actual Python/Streamlit code for this tool now, or would you prefer the React-base read the guide and let me know what else you need here**

## Response snapshot

I've successfully created a comprehensive specification for the Circuit Breaker Sizing Calculator feature (003-circuit-breaker-sizing). Here's what was completed:

**Feature Structure Created:**
- Branch: `003-circuit-breaker-sizing` (created and checked out)
- Feature number: 003 (next available after 001-electromate-engineering-app and 002-mobile-battery-ui)
- Short name: "circuit-breaker-sizing"

**Specification Document** (specs/003-circuit-breaker-sizing/spec.md):

Created a detailed, technology-agnostic specification with:
- **6 User Stories** prioritized P1-P3:
  - P1: Basic Circuit Breaker Sizing (core functionality)
  - P2: Voltage Drop Analysis
  - P2: Advanced Derating and Environmental Factors
  - P2: Short Circuit Protection Specification
  - P3: Breaker Type and Trip Curve Recommendations
  - P3: PDF Technical Specification Report

- **44 Functional Requirements** (FR-001 through FR-044) organized into categories:
  - Core Calculation Requirements (8 requirements)
  - Standard Breaker Ratings (4 requirements)
  - Voltage Drop Analysis (5 requirements)
  - Derating and Environmental Factors (7 requirements)
  - Short Circuit Protection (4 requirements)
  - Breaker Type Recommendations (4 requirements)
  - User Interface and Interaction (6 requirements)
  - PDF Export (6 requirements)

- **10 Success Criteria** with measurable, technology-agnostic outcomes
- **5 Key Entities** (Circuit Configuration, Environmental Conditions, Breaker Specification, Calculation Results, Project Information)
- **7 Edge Cases** with expected behaviors
- **10 Assumptions**, **12 Out of Scope** items, **6 Dependencies**, and **10 Constraints** documented

**Quality Validation Checklist** (specs/003-circuit-breaker-sizing/checklists/requirements.md):

Created comprehensive validation checklist that verified:
- ✅ Content Quality: No implementation details, user-focused, stakeholder-appropriate
- ✅ Requirement Completeness: Zero [NEEDS CLARIFICATION] markers, all requirements testable
- ✅ Feature Readiness: All acceptance criteria defined, scope clearly bounded
- ✅ **Status: READY FOR PLANNING**

**Key Features of the Specification:**
- Dual standards support (NEC for Americas, IEC for International)
- Single-phase and three-phase calculations
- Load input flexibility (kW or Amperes with automatic conversion)
- Voltage drop analysis with code-compliant warnings
- Advanced derating for temperature and cable grouping
- Short circuit breaking capacity recommendations
- Breaker type guidance (Type B/C/D for IEC, thermal-magnetic vs. electronic for NEC)
- PDF report generation with code references
- Integration opportunity with existing ElectroMate Cable Sizing Calculator

The specification maintains ElectroMate's established patterns (Math.js for precision, Zustand for state, jsPDF for exports, NEC/IEC dual standards) while introducing professional-grade circuit breaker sizing capabilities essential for electrical engineers.

## Outcome

- ✅ Impact: New feature specification created for Circuit Breaker Sizing Calculator with 6 user stories (P1-P3), 44 functional requirements, and complete documentation ready for planning phase
- 🧪 Tests: Specification quality checklist validates all requirements are testable, measurable, and unambiguous (100% validation pass rate)
- 📁 Files: Created spec.md (297 lines) and requirements.md checklist; feature branch 003-circuit-breaker-sizing established
- 🔁 Next prompts: Run `/sp.plan` to create implementation plan, or `/sp.clarify` if any aspects need refinement
- 🧠 Reflection: Successfully adapted user's detailed technical requirements into a business-focused, technology-agnostic specification. Made informed assumptions about defaults (copper conductors, continuous loads, 0.8 PF) and documented them clearly. The specification balances comprehensiveness (industrial-grade features like derating and short circuit analysis) with practical MVP approach (P1 core sizing can function independently). Zero clarification markers needed due to well-defined user input and leveraging existing ElectroMate patterns.

## Evaluation notes (flywheel)

- Failure modes observed: None - specification creation completed successfully without errors or blockers
- Graders run and results (PASS/FAIL): Manual quality validation PASS (all 14 checklist items passed)
- Prompt variant (if applicable): Standard /sp.specify workflow with comprehensive user input
- Next experiment (smallest change to try): Consider creating a template for dual-standard (NEC/IEC) specifications since this is a recurring pattern in ElectroMate features
