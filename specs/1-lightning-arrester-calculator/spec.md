# Feature Specification: Lightning Arrester Calculator

**Feature Branch**: `1-lightning-arrester-calculator`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Detailed specification draft for the Electromate website's Lightning Arrester Calculator section."

## Clarifications

### Session 2026-01-27

- Q: What voltage ranges should the calculator accept? → A: Allow any voltage input with only warnings for unusual values
- Q: Should environmental conditions be mandatory for calculations? → A: Require users to provide all environmental conditions for accurate calculations
- Q: How should the system handle cases where no compliant arrester type is available? → A: System should suggest the closest available option with compliance warnings
- Q: What information must be included in PDF reports? → A: PDF reports must include all input parameters, calculations, and compliance status
- Q: What validation is required for calculation algorithms? → A: All calculation algorithms must be validated against industry standards

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

- How does system handle unusual voltage values that fall outside typical ranges?
- How does system handle missing environmental conditions? (Addressed: all environmental conditions are required)
- What occurs when no compliant arrester type is available for the given parameters? (Addressed: system suggests closest available option with compliance warnings)
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
- **FR-013**: System MUST allow any voltage input with warnings for unusual values rather than strict range limitations
- **FR-014**: System MUST require all environmental conditions to be provided for accurate calculations
- **FR-015**: When no fully compliant arrester type is available, system MUST suggest the closest available option with compliance warnings
- **FR-016**: PDF reports MUST include all input parameters, calculations, and compliance status for audit purposes
- **FR-017**: All calculation algorithms MUST be validated against industry standards (IEC 60099-4, NEC 2020/2023)

### Key Entities

- **Arrester Type**: Represents different lightning protection devices (Conventional, ESE, MOV) with specific characteristics and use cases
- **Calculation Parameters**: Input values including system voltage, structure type, environmental conditions, and compliance requirements (all environmental conditions required for accurate calculations)
- **Test Parameters**: Validation criteria according to IEC 60099-4 including residual voltage, withstand ratings, TOV, and cantilever strength
- **Compliance Status**: Verification results indicating adherence to IEC and NEC standards
- **Report Data**: Structured information containing all inputs, calculations, and compliance verification for PDF export (includes all input parameters, calculations, and compliance status)
- **Algorithm Validation**: All calculation algorithms must be validated against industry standards (IEC 60099-4, NEC 2020/2023)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Engineers can complete lightning arrester selection process in under 3 minutes including parameter input and report generation
- **SC-002**: Calculator provides accurate recommendations that comply with IEC 60099-4 and NEC 2020/2023 standards for 95% of valid input combinations
- **SC-003**: 90% of users successfully generate compliant PDF reports containing all required information for audit purposes
- **SC-004**: System provides appropriate arrester type recommendations for 4 different structure scenarios (home, tower, industry, traction) with relevant compliance validation
- **SC-005**: Calculation accuracy matches established industry benchmarks (ABB, Schneider Electric tools) within acceptable tolerance ranges