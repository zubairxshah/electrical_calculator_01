---
id: 1
title: lightning-arrester-calculator-spec
stage: spec
date: 2026-01-27
surface: agent
model: claude-opus-4-5-20251101
feature: lightning-arrester-calculator
branch: 1-lightning-arrester-calculator
user: user
command: /sp.specify
labels: ["specification", "lightning-protection", "calculator", "compliance"]
link_spec: "specs/1-lightning-arrester-calculator/spec.md"
link_ticket: null
link_adr: null
link_pr: null
files_yaml:
  - "specs/1-lightning-arrester-calculator/spec.md"
  - "specs/1-lightning-arrester-calculator/checklists/requirements.md"
tests_yaml: []
outcome: "Successfully created specification for Lightning Arrester Calculator feature based on user requirements. The spec includes user scenarios, functional requirements, and success criteria for calculating lightning arrester requirements with compliance validation."
evaluation: "Specification is complete with all required sections filled out. Quality checklist confirms no implementation details were included, requirements are testable, and success criteria are measurable."
---

# Prompt

Here's a **detailed specification draft** for the *Electromate* website's **Lightning Arrester Calculator** section. I've structured it so it can serve as both a technical roadmap and a compliance checklist.

---

# ⚡ Electromate – Lightning Arrester Calculator Specification

## 1. Purpose
Provide engineers, contractors, and facility managers with a **standards-compliant calculator** for selecting and validating lightning arresters and surge protection devices (SPDs). The tool must:
- Align with **IEC 60099-4**, **BS EN**, and **NEC 2020/2023** requirements.
- Support multiple arrester types (Conventional, ESE, MOV).
- Offer **scenario-based recommendations** for homes, towers, industries, and traction systems.
- Generate **auditable PDF reports** with test parameters, compliance notes, and installation guidance.

---

## 2. Supported Arrester Types
- **Conventional (Rod) Type**
  - Material: Copper/brass
  - Use case: Homes, small structures

- **Early Streamer Emission (ESE)**
  - Active rods with extended coverage radius
  - Use case: Towers, large buildings, industrial plants

- **Metal-Oxide Varistor (MOV)**
  - Surge protection in modern power systems
  - Use case: Panelboards, substations, traction systems

---

## 3. Key Test Parameters (IEC 60099-4)
- **Lightning Impulse Residual Voltage**
  - Calculator input: arrester rating (kV)
  - Output: expected discharge voltage

- **Power Frequency Withstand (Wet)**
  - Example: 28 kV withstand for 11 kV arrester

- **Temporary Overvoltage (TOV)**
  - Withstand capability for 10 seconds

- **Cantilever Strength**
  - Mechanical strength ≥ 500 kg

---

## 4. NEC 2020/2023 Compliance
- **Mandatory SPD Use**
  - Type 1 or Type 2 required for dwelling units

- **SPD Types**
  - **Type 1**: Line side of service disconnect
  - **Type 2**: Load side of service disconnect

- **Installation Requirements**
  - Location: Service entrance or panelboard
  - Must be UL 1449 4th Edition listed

---

## 5. Calculator Features
- **Inputs**
  - System voltage (kV)
  - Structure type (home, tower, industry, traction)
  - Environmental conditions (humidity, pollution level, altitude)
  - NEC compliance selection (Type 1 / Type 2 SPD)

- **Outputs**
  - Recommended arrester type and rating
  - Compliance check (IEC/NEC)
  - Test parameter validation (Residual Voltage, TOV, Cantilever Strength)
  - Suggested installation location

- **Scenarios**
  - Homes: Conventional rods + NEC Type 1 SPD
  - Towers: ESE rods + NEC Type 2 SPD
  - Industries: MOV arresters + NEC Type 2 SPD
  - Traction systems: MOV arresters with high cantilever strength

---

## 6. Report Generation
- **PDF Export**
  - Inputs summary
  - Recommended arrester type
  - Compliance checklist (IEC/NEC)
  - Test parameter validation results
  - Installation notes and diagrams

---

## 7. Benchmarking
- Compare calculator outputs against:
  - Existing apps (e.g., ABB, Schneider Electric tools)
  - IEC/NEC published examples
  - Real-world case studies

---

## 8. UX/UI Considerations
- **Interactive form** with dropdowns for arrester type and building scenario.
- **Real-time validation** of inputs (e.g., voltage range).
- **Dynamic charts** showing discharge voltage vs. arrester rating.
- **Download button** for PDF report.
- **Compliance badges** (IEC, NEC) displayed when requirements are met.

---

## 9. Future Enhancements
- Integration with **GIS mapping** for lightning density zones.
- **Cost estimation module** for different arrester types.
- **Maintenance scheduling** reminders based on NEC guidelines.

---

✅ This spec ensures *Electromate*'s Lightning Arrester Calculator is **technically robust, standards-compliant, and user-friendly**, while also being auditable and benchmarked against industry tools.

---

Would you like me to **prototype the calculation logic** (e.g., formulas for residual voltage, TOV withstand, etc.) in Python/Excel style so you can validate the workflow before impl

# Response

# Feature Specification: Lightning Arrester Calculator

**Feature Branch**: `1-lightning-arrester-calculator`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Detailed specification draft for the Electromate website's Lightning Arrester Calculator section."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calculate Lightning Arrester Requirements (Priority: P1)

An electrical engineer needs to determine the appropriate lightning arrester type and specifications for a given structure based on system voltage, environmental conditions, and compliance requirements. The user enters parameters and receives recommendations for arrester type, rating, and compliance status.

**Why this priority**: This is the core functionality that delivers the primary value of the calculator - helping engineers select appropriate lightning protection equipment.

**Independent Test**: Can be fully tested by entering various combinations of system voltage, structure type, and environmental conditions, and verifying that the calculator returns appropriate arrester recommendations with compliance validation.

**Acceptance Scenarios**:

1. **Given** user inputs system voltage, structure type, and environmental conditions, **When** user submits the calculation, **Then** system displays recommended arrester type, rating, and compliance status with IEC/NEC standards
2. **Given** user selects different arrester types (Conventional, ESE, MOV), **When** user reviews recommendations, **Then** system validates parameters according to IEC 60099-4 standards
3. **Given** user selects compliance requirement (Type 1 or Type 2 SPD per NEC), **When** user calculates requirements, **Then** system validates compliance with NEC 2020/2023 requirements

---

### User Story 2 - Generate Compliance Report (Priority: P2)

An electrical contractor needs to generate a detailed PDF report of the lightning arrester calculations and compliance verification for documentation and audit purposes. The user clicks a button to export the inputs, recommendations, and compliance validation.

**Why this priority**: Critical for audit trail and professional documentation that engineers and contractors require for compliance purposes.

**Independent Test**: Can be fully tested by performing a calculation and generating a PDF report that contains all input parameters, recommendations, and compliance validation results.

**Acceptance Scenarios**:

1. **Given** calculation results are displayed, **When** user clicks "Export PDF" button, **Then** system generates a PDF report with inputs summary, recommended arrester type, compliance checklist, and validation results
2. **Given** user has completed a calculation, **When** user downloads the report, **Then** PDF contains installation notes and diagrams relevant to the recommended arrester type

---

### User Story 3 - Select Arrester Based on Structure Type (Priority: P3)

A facility manager needs to select appropriate lightning protection for different types of structures (homes, towers, industrial facilities, traction systems) with scenario-based recommendations. The user selects structure type and receives tailored recommendations.

**Why this priority**: Provides value-added recommendations that differentiate this calculator from basic tools by offering scenario-specific advice.

**Independent Test**: Can be tested by selecting different structure types (home, tower, industry, traction) and verifying that the calculator provides appropriate recommendations for each scenario.

**Acceptance Scenarios**:

1. **Given** user selects "Home" structure type, **When** calculation is performed, **Then** system recommends conventional rods with NEC Type 1 SPD
2. **Given** user selects "Tower" structure type, **When** calculation is performed, **Then** system recommends ESE rods with NEC Type 2 SPD
3. **Given** user selects "Industrial" structure type, **When** calculation is performed, **Then** system recommends MOV arresters with NEC Type 2 SPD

---

### Edge Cases

- What happens when user inputs voltage values outside standard ranges?
- How does system handle missing environmental conditions that affect arrester selection?
- What occurs when no compliant arrester type is available for the given parameters?
- How does the system handle invalid combinations of parameters that don't meet safety standards?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate lightning impulse residual voltage based on arrester rating and system voltage inputs
- **FR-002**: System MUST validate power frequency withstand ratings according to IEC 60099-4 standards (e.g., 28 kV withstand for 11 kV arrester)
- **FR-003**: System MUST verify temporary overvoltage (TOV) withstand capability for 10 seconds as per IEC 60099-4
- **FR-004**: System MUST validate cantilever strength requirements (≥ 500 kg) for mechanical installations
- **FR-005**: System MUST support three arrester types: Conventional (rod), Early Streamer Emission (ESE), and Metal-Oxide Varistor (MOV)
- **FR-006**: System MUST validate compliance with NEC 2020/2023 requirements for Type 1 and Type 2 SPD installations
- **FR-007**: Users MUST be able to input environmental conditions (humidity, pollution level, altitude) that affect arrester selection
- **FR-008**: System MUST provide scenario-based recommendations for homes, towers, industrial facilities, and traction systems
- **FR-009**: System MUST generate PDF reports containing inputs summary, recommended arrester type, compliance checklist, and test parameter validation results
- **FR-010**: System MUST provide real-time validation of input parameters (voltage ranges, environmental conditions)
- **FR-011**: System MUST display compliance badges (IEC, NEC) when requirements are met
- **FR-012**: System MUST suggest appropriate installation locations based on NEC requirements (service entrance, panelboard, etc.)

### Key Entities

- **Arrester Type**: Represents different lightning protection devices (Conventional, ESE, MOV) with specific characteristics and use cases
- **Calculation Parameters**: Input values including system voltage, structure type, environmental conditions, and compliance requirements
- **Test Parameters**: Validation criteria according to IEC 60099-4 including residual voltage, withstand ratings, TOV, and cantilever strength
- **Compliance Status**: Verification results indicating adherence to IEC and NEC standards
- **Report Data**: Structured information containing all inputs, calculations, recommendations, and compliance verification for PDF export

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Engineers can complete lightning arrester selection process in under 3 minutes including parameter input and report generation
- **SC-002**: Calculator provides accurate recommendations that comply with IEC 60099-4 and NEC 2020/2023 standards for 95% of valid input combinations
- **SC-003**: 90% of users successfully generate compliant PDF reports containing all required information for audit purposes
- **SC-004**: System provides appropriate arrester type recommendations for 4 different structure scenarios (home, tower, industry, traction) with relevant compliance validation
- **SC-005**: Calculation accuracy matches established industry benchmarks (ABB, Schneider Electric tools) within acceptable tolerance ranges