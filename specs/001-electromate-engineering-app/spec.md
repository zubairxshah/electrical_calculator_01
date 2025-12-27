# Feature Specification: ElectroMate Engineering Web Application

**Feature Branch**: `001-electromate-engineering-app`
**Created**: 2025-12-24
**Status**: Draft
**Input**: User description: "Build a comprehensive, high-precision electrical engineering web app called ElectroMate with battery/UPS calculators, solar design tools, and cable sizing tools following IEC/IEEE/NEC standards"

## Clarifications

### Session 2025-12-24

- Q: How should anonymous users transition to registered accounts? → A: Anonymous users can calculate freely; registration offered when saving calculations or approaching localStorage limits
- Q: Which electrical system voltages should the cable sizing tool support? → A: Comprehensive range - LV, MV distribution voltages, plus specialized DC systems (telecom 48V, data center, solar arrays) with selection options
- Q: How should the system handle diversity factors in UPS load calculations? → A: Calculate diversity automatically using statistical method based on number of loads (per IEEE/IEC guidelines)
- Q: How should the system determine if a circuit is lighting or power for voltage drop threshold enforcement? → A: Always apply the more conservative 3% limit regardless of circuit type (safest approach)
- Q: How long should the system retain calculation history for registered users? → A: Retain calculations for fixed period (2 years) then auto-delete

## User Scenarios & Testing

### User Story 1 - Battery Backup Time Calculator (Priority: P1)

An electrical engineer needs to calculate how long a battery bank will support critical loads during a power outage. They have battery specifications (Ah rating, voltage), load requirements, and need to account for efficiency losses and aging factors.

**Why this priority**: Battery backup calculations are fundamental to UPS and emergency power systems. This is the most common calculation electrical engineers perform for power continuity planning. It delivers immediate value as a standalone tool.

**Independent Test**: Can be fully tested by inputting battery parameters (e.g., 200Ah, 48V DC, 2000W load, 90% efficiency, 0.8 aging factor) and receiving accurate backup time results. Delivers value by eliminating manual calculations and ensuring IEEE 485 compliance.

**Acceptance Scenarios**:

1. **Given** a user has battery specifications (200Ah, 48V DC), **When** they enter a 2000W load with 90% efficiency and 0.8 aging factor, **Then** the system calculates backup time as 3.46 hours using the formula T = (V_dc × Ah × η × aging) / P_load
2. **Given** a user enters invalid data (negative voltage or load exceeding battery capacity), **When** they attempt calculation, **Then** the system displays clear warning messages indicating physically impossible values
3. **Given** a user completes a calculation, **When** they click "Download PDF Report", **Then** the system generates a professional PDF with all inputs, formula used, result, and standard references (IEEE 485)

---

### User Story 2 - UPS Sizing Tool (Priority: P1)

An engineer needs to size a UPS system for critical loads in a data center or industrial facility. They have a list of equipment with VA/Watts ratings and need to determine the minimum UPS capacity with appropriate safety margins.

**Why this priority**: UPS sizing is critical for ensuring reliable power protection. Undersizing leads to system failure; oversizing wastes budget. This tool directly supports purchasing decisions and system design validation.

**Independent Test**: Can be fully tested by creating a load list (e.g., 5 servers at 500W each, 10 network switches at 100W each) and receiving recommended UPS kVA rating with 25% future growth margin. Delivers value by standardizing sizing methodology.

**Acceptance Scenarios**:

1. **Given** a user has multiple loads to protect, **When** they input a list of equipment (VA or Watts), **Then** the system calculates total load, automatically applies diversity factors per IEEE 1100 guidelines based on load count, applies power factor corrections, adds 25% growth margin, and recommends standard UPS sizes (e.g., 10kVA, 20kVA)
2. **Given** calculated UPS requirements, **When** the report is generated, **Then** it includes load breakdown, calculated diversity factor with formula reference (IEEE 1100/IEC 62040), total capacity, growth margin, and recommended UPS models meeting IEC 62040 standards
3. **Given** a user enters both VA and Watts for equipment, **When** they calculate, **Then** the system correctly handles power factor (assuming 0.8 if only one value provided) and warns if power factor is unusual

---

### User Story 3 - Voltage Drop Calculator with Cable Sizing (Priority: P1)

An engineer designing an electrical distribution system needs to calculate voltage drop across cable runs and select appropriate cable sizes. They must ensure voltage drop stays within acceptable limits (3% for lighting, 5% for power per NEC/IEC 60364).

**Why this priority**: Voltage drop violations cause equipment malfunction, code violations, and safety issues. This is a mandatory calculation for every electrical installation design. Immediate value for compliance verification.

**Independent Test**: Can be fully tested by specifying circuit parameters (50A current, 100m length, copper conductor, conduit installation, 30°C ambient) and receiving cable size recommendation with voltage drop percentage. System flags violations in red.

**Acceptance Scenarios**:

1. **Given** circuit parameters (system voltage from dropdown or custom input, current, length, conductor type, installation method, ambient temperature), **When** user selects a cable size from standard tables (1.5mm² to 630mm²), **Then** the system calculates voltage drop using V_drop = I × L × (mV/A/m) / 1000 and displays result with percentage relative to system voltage
2. **Given** calculated voltage drop, **When** result exceeds 3% (conservative limit applied to all circuits), **Then** the system highlights the result in red with warning message and suggests larger cable sizes that meet the 3% threshold
3. **Given** installation method and ambient temperature, **When** calculating, **Then** the system applies appropriate derating factors per NEC Table 310.15(B)(16) or IEC 60364-5-52 and warns if current exceeds cable ampacity
4. **Given** circuit current exceeds single cable ampacity, **When** user calculates, **Then** the system recommends parallel cable run options (2-6 cables per phase) with cost efficiency ratings and compliance status for each option
5. **Given** a cable size recommendation, **When** results are displayed, **Then** the system shows recommended earth/grounding conductor size per NEC Table 250.122 (for NEC) or IEC 60364-5-54 (for IEC) with the sizing rule applied

---

### User Story 4 - Solar Panel Array Sizing (Priority: P2)

A renewable energy engineer needs to design a solar PV system to meet specific daily energy requirements. They need to calculate the number of panels required based on location-specific solar resources and system performance factors.

**Why this priority**: Solar system sizing is critical for renewable energy projects but less universally needed than battery/UPS/cable tools. This extends ElectroMate into the growing solar market segment.

**Independent Test**: Can be fully tested by specifying energy requirement (e.g., 10 kWh/day), location (Peak Sun Hours = 5), panel specifications (300W, 20% efficiency), and performance ratio (0.75), receiving panel quantity recommendation.

**Acceptance Scenarios**:

1. **Given** daily energy target and location PSH, **When** user inputs panel specifications and performance ratio, **Then** system calculates required panels using: Panels = (Daily_kWh) / (Panel_kW × PSH × PR)
2. **Given** calculated array size, **When** user views results, **Then** system displays total array power, estimated daily generation, annual generation, and roof/ground space requirements
3. **Given** performance ratio below 0.6 or above 0.9, **When** user enters value, **Then** system warns that PR is outside typical range (0.7-0.85 for grid-tied systems)

---

### User Story 5 - MPPT/PWM Charge Controller Selection (Priority: P2)

An off-grid solar system designer needs to match solar array specifications (open-circuit voltage V_oc, short-circuit current I_sc) to appropriate charge controller specifications to ensure safe and efficient operation.

**Why this priority**: Incorrect charge controller selection damages batteries and panels. This complements the solar array sizing tool and is essential for off-grid applications.

**Independent Test**: Can be fully tested by inputting array specifications (8 panels × 40V V_oc = 320V, 8 panels × 9A I_sc = 72A) and receiving controller recommendations with safety margin calculations (V_oc must be <125% of controller rating).

**Acceptance Scenarios**:

1. **Given** array V_oc and I_sc specifications, **When** user requests controller recommendation, **Then** system suggests MPPT or PWM controllers with ratings exceeding array specs by safety margins (typically 20-25%)
2. **Given** battery bank voltage and array voltage, **When** user evaluates MPPT vs PWM, **Then** system recommends MPPT for voltage mismatch >20% and explains efficiency gains
3. **Given** temperature coefficients, **When** calculating, **Then** system adjusts V_oc for coldest expected temperature per manufacturer datasheet guidance

---

### User Story 6 - Battery Type Comparison Tool (Priority: P3)

An engineer selecting batteries for a backup power system needs to compare VRLA, Lithium-Ion, and NiCd technologies across key parameters: lifespan, temperature tolerance, depth of discharge, maintenance requirements, and cost.

**Why this priority**: Battery selection impacts system lifetime cost and reliability but is less frequently performed than sizing calculations. This is a decision-support tool rather than a calculation tool.

**Independent Test**: Can be fully tested by selecting application type (e.g., "UPS - data center") and viewing comparison table showing VRLA (5-7 years, 20-25°C optimal, 50% DoD), Li-Ion (10-15 years, wider temp range, 80% DoD), NiCd (15-20 years, extreme temp tolerance, 80% DoD).

**Acceptance Scenarios**:

1. **Given** user selects application context, **When** they view comparison, **Then** system displays table with lifespan, temperature range, DoD limits, cycle life, maintenance needs, and relative cost index
2. **Given** comparison data, **When** user hovers over technical terms, **Then** system displays tooltips explaining DoD, cycle life, and temperature coefficient impacts
3. **Given** application-specific needs (e.g., "outdoor installation, -20°C to 50°C"), **When** user filters, **Then** system highlights suitable technologies and dims unsuitable options

---

### Edge Cases

- What happens when a user enters zero or negative values for voltage, current, or load?
- How does the system handle cable length exceeding practical limits (e.g., >1000m requiring voltage drop mitigation)?
- What happens when battery discharge rate (C-rate) exceeds manufacturer specifications (e.g., >0.2C for typical VRLA)?
- How does the system respond to solar panel array configurations where series voltage exceeds charge controller limits?
- What happens when ambient temperature corrections reduce cable ampacity below the required circuit current?
- How does the system handle very small loads or currents (e.g., <1A) where voltage drop may be negligible?
- What happens when user tries to export PDF before completing any calculations?
- How does the system handle localization for different measurement units (mm² vs AWG, meters vs feet)?
- What happens when a registered user's calculations approach the 2-year retention limit?
- How does the system handle calculation data when a user's account is deleted?

## Requirements

### Functional Requirements

- **FR-001**: System MUST calculate battery backup time using the formula T = (V_dc × Ah × η × aging_factor) / P_load where all variables are user inputs
- **FR-002**: System MUST validate all numerical inputs to ensure positive non-zero values for voltages, currents, loads, and physical dimensions
- **FR-003**: System MUST provide real-time calculation updates as users modify input values (no submit button required for calculations)
- **FR-004**: System MUST flag dangerous or physically impossible values (e.g., discharge rates >1C for VRLA, voltage drops >10%, efficiency >100%)
- **FR-005**: System MUST generate downloadable PDF reports for all calculation tools including inputs, formulas, results, applicable standards, and calculation timestamp
- **FR-006**: System MUST reference appropriate standards in calculations: IEC 60364 (installations), IEEE 485 (batteries), BS 7671 (cables), NEC (North America)
- **FR-007**: System MUST include cable sizing lookup tables with resistance values (mV/A/m) for copper and aluminum conductors from 1.5mm² to 630mm² (or AWG 14 to 1000 kcmil for North America) to support industrial and generator applications
- **FR-007a**: System MUST support comprehensive voltage range including: Low Voltage AC (120V, 208V, 240V, 277V, 480V, 600V), Medium Voltage distribution (2.4kV, 4.16kV, 13.8kV), and DC systems (12V, 24V, 48V telecom/data center, 125V/250V industrial DC, solar array voltages up to 1500V DC). System MUST provide voltage selection dropdown organized by category (LV AC, MV, DC Systems). System MUST also allow custom voltage input (1V to 50,000V) with AC/DC type selection for non-standard applications
- **FR-007b**: System MUST calculate and recommend parallel cable runs when single cable capacity is insufficient for the circuit current. System MUST display options for 2-6 parallel cables per phase with cable sizes from 25mm² to 630mm² (or equivalent AWG/kcmil). Each parallel option MUST show: cables per phase, current per cable, total ampacity, voltage drop, utilization percentage, compliance status, and cost efficiency rating (1-5 stars)
- **FR-007c**: System MUST calculate and display recommended earth/grounding conductor size based on: (1) NEC Table 250.122 for OCPD-based sizing when using NEC standard, (2) IEC 60364-5-54 simplified method based on phase conductor size when using IEC standard. System MUST display the sizing rule applied and standard reference
- **FR-008**: System MUST apply cable derating factors based on installation method (conduit, cable tray, direct burial, free air) and ambient temperature
- **FR-009**: System MUST highlight voltage drop violations in red when exceeding 3% per NEC 210.19(A) and IEC 60364-5-52 recommendations. System applies conservative 3% limit universally to ensure code compliance for all circuit types (lighting and power). Display informational note: "Using 3% limit (suitable for all circuits per NEC/IEC)"
- **FR-010**: System MUST calculate UPS sizing with automatic 25% future growth margin applied to total load
- **FR-010a**: System MUST calculate and apply diversity factors automatically using statistical methods based on number and type of loads per IEEE 1100 (Emerald Book) and IEC 62040 guidelines. Diversity factor calculation: for N identical loads, diversity = 1.0 for N≤3; diversity = 0.9 + (0.1/N) for 3<N≤10; diversity = 0.85 for N>10. System MUST display calculated diversity factor in results with explanatory tooltip
- **FR-011**: System MUST handle power factor corrections when users provide VA and Watts, assuming 0.8 power factor if only one value provided
- **FR-012**: System MUST calculate solar panel array size using: Required_Panels = Daily_kWh / (Panel_kW × PSH × PR)
- **FR-013**: System MUST recommend charge controllers with safety margins (controller V_oc rating ≥ 125% of array V_oc)
- **FR-014**: System MUST display comparison table for battery technologies showing lifespan, temperature range, DoD, cycle life, and maintenance requirements
- **FR-015**: System MUST persist user calculations in browser localStorage to allow session recovery without requiring user registration
- **FR-016**: System MUST provide user registration and login using BetterAuth for users who want to save calculations permanently
- **FR-016a**: System MUST allow anonymous users to perform calculations without registration, offering registration prompts when user attempts to save calculations or when approaching localStorage capacity limits (typically 4-5MB used)
- **FR-016b**: System MUST provide seamless migration of localStorage calculations to database when anonymous user registers, preserving all calculation history
- **FR-017**: System MUST store registered user calculations in Neon PostgreSQL database with user association
- **FR-017a**: System MUST retain calculation history for registered users for 2 years from calculation creation date. System MUST notify users 30 days before automatic deletion of calculations approaching 2-year retention limit. System MUST provide export functionality allowing users to download calculations before deletion
- **FR-018**: System MUST include professional footer displaying "MZS CodeWorks" with engineering-themed logo
- **FR-019**: System MUST use SVG graphics and royalty-free engineering imagery rather than emoji icons
- **FR-020**: System MUST provide sidebar navigation with links to: Battery, UPS, Solar, and Cables tool sections
- **FR-021**: System MUST support both IEC/SI units (mm², meters, kW) and North American units (AWG, feet, HP) with unit selection toggle
- **FR-022**: System MUST visualize battery discharge curves using charts when displaying battery backup calculations
- **FR-023**: System MUST perform all calculations using high-precision floating-point arithmetic to ensure engineering accuracy

### Key Entities

- **Calculation Session**: Represents a user's calculation instance with inputs, outputs, formula used, timestamp, and standard references. Persisted in localStorage for anonymous users or database for registered users.
- **User Account**: Represents a registered user with authentication credentials, profile information, and saved calculations. Links to multiple Calculation Sessions.
- **Cable Specification**: Lookup table entity containing conductor material (copper/aluminum), cross-sectional area (mm² or AWG), resistance (mV/A/m or Ω/1000ft), current capacity (ampacity), and applicable standard reference.
- **Battery Type**: Reference data for VRLA, Lithium-Ion, and NiCd technologies including typical lifespan, temperature range, recommended DoD, cycle life expectations, and maintenance requirements.
- **Standard Reference**: Links calculations to specific sections of IEC 60364, IEEE 485, BS 7671, NEC, NFPA codes with version numbers and section references.
- **Load Item**: Represents individual equipment in UPS sizing calculations with name, power rating (VA and/or Watts), power factor, quantity, and criticality flag.
- **Solar Panel Specification**: Contains panel parameters including rated power (Wp), efficiency (%), V_oc, V_mp, I_sc, I_mp, and temperature coefficients.
- **Project**: Container for multiple related calculations (optional, for registered users) allowing engineers to group calculations for a specific installation or facility.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can complete a battery backup calculation in under 60 seconds from page load to viewing results
- **SC-002**: System performs real-time calculation updates within 100ms of input value changes
- **SC-003**: 95% of generated PDF reports render correctly across Chrome, Firefox, Safari, and Edge browsers
- **SC-004**: Voltage drop calculations match IEEE/IEC standard tables within 0.1% accuracy
- **SC-005**: Battery backup time calculations match IEEE 485 methodology within 2% for standard test cases
- **SC-006**: System successfully handles 100 concurrent users performing calculations without performance degradation
- **SC-007**: Anonymous users can save and retrieve at least 50 calculation sessions in localStorage
- **SC-008**: Registered users can store calculations in database (retained for 2 years) and retrieve calculation history within 2 seconds
- **SC-009**: Cable sizing recommendations comply with NEC Table 310.15(B)(16) and IEC 60364-5-52 ampacity limits with 100% accuracy
- **SC-010**: UPS sizing recommendations include appropriate safety margins (25% growth + diversity factors) in 100% of calculations
- **SC-011**: Solar array sizing calculations account for temperature derating and soiling losses per NREL standards
- **SC-012**: System displays clear warnings for dangerous conditions (e.g., excessive discharge rates) in 100% of applicable scenarios
- **SC-013**: Users can export professional PDF reports suitable for submission to approval authorities or clients
- **SC-014**: 90% of users successfully navigate to desired tool (Battery/UPS/Solar/Cables) within 10 seconds
- **SC-015**: System maintains calculation accuracy across both SI units (IEC) and North American units (NEC) with automatic conversion

## Scope

### In Scope

- Battery backup time calculator with efficiency and aging factors
- UPS sizing tool with load list management and growth margins
- Cable sizing and voltage drop calculator with standards-based tables
- Solar panel array sizing calculator with PSH and performance ratio
- Charge controller selection tool matching array specifications
- Battery technology comparison tool (VRLA, Li-Ion, NiCd)
- PDF report generation for all calculation types
- Real-time input validation and dangerous condition warnings
- Anonymous user session persistence via localStorage
- Registered user accounts with database-backed calculation history
- Responsive web interface optimized for desktop and tablet
- Support for both IEC/SI and NEC/North American standards and units
- Professional engineering-focused UI with industrial design aesthetic

### Out of Scope

- Mobile-native applications (iOS/Android apps)
- Offline functionality (requires internet connection)
- 3D visualization of electrical installations
- Automated CAD drawing generation
- Integration with external ERP or project management systems
- Multi-language internationalization (English only initially)
- Advanced features requiring AI/OpenRouter API integration (deferred to future phases)
- MCP (Model Context Protocol) task agents (deferred to premium features)
- Transient analysis or power system simulation
- Arc flash hazard calculations
- Short circuit analysis
- Load flow analysis
- Harmonic analysis
- Equipment specification database or procurement features
- Collaboration features (multi-user editing, comments, approvals)
- Version control for calculation revisions
- Integration with manufacturer datasheets or product catalogs

### Assumptions

- Users have basic electrical engineering knowledge and understand standard terminology (V_oc, DoD, PSH, power factor)
- Users are responsible for verifying that calculations meet local code requirements and authority having jurisdiction (AHJ) approval
- Cable resistance tables will be pre-populated from published standards; users will not input custom resistance values
- Battery aging factor defaults to 0.8 but users can adjust based on manufacturer recommendations
- Solar Peak Sun Hours (PSH) must be user-provided; system will not auto-fetch location-based solar resource data
- System ambient temperature defaults to 30°C (86°F) but users can adjust for specific installation conditions
- Power factor defaults to 0.8 for inductive loads when not specified
- PDF reports are for informational purposes; professional engineer (PE) stamp/certification is user's responsibility
- Users have modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) with JavaScript enabled
- Database backups and disaster recovery are handled by Neon PostgreSQL infrastructure
- User authentication security relies on BetterAuth library best practices

## Dependencies

### External Systems

- **Neon PostgreSQL Database**: Cloud-hosted database for registered user accounts and saved calculations
- **BetterAuth**: Authentication library for user registration, login, and session management
- **Browser localStorage API**: For anonymous user calculation persistence
- **jsPDF Library**: For generating PDF reports from calculation results

### External Data Sources

- IEC 60364 standard tables for cable ampacity and voltage drop
- IEEE 485 methodology for battery sizing calculations
- NEC Table 310.15(B)(16) for conductor ampacity (North American standards)
- BS 7671 cable sizing tables
- Standard cable resistance values (mV/A/m) for copper and aluminum conductors

### Internal Dependencies

- Foundation UI components (sidebar, navigation, input forms) must be completed before tool-specific calculators
- Calculation engine with Math.js must be implemented before any calculator tool
- PDF generation framework must be functional before adding "Download PDF" buttons
- User registration/authentication system must be completed before database-backed calculation storage
- Unit conversion functions must be implemented to support both SI and North American unit systems

## Risks

### Technical Risks

- **Risk**: Formula accuracy discrepancies between different standards (IEC vs NEC vs IEEE)
  **Mitigation**: Clearly label which standard applies to each calculation; allow users to select standard; validate against published examples

- **Risk**: Browser localStorage limitations (typically 5-10MB) may restrict number of saved calculations for anonymous users
  **Mitigation**: Implement storage quota monitoring; warn users approaching limit; prompt registration for unlimited storage

- **Risk**: PDF generation performance issues with complex reports or charts
  **Mitigation**: Use web workers for PDF generation to avoid blocking UI; implement progress indicators; optimize chart rendering

- **Risk**: Floating-point precision errors in calculations leading to small inaccuracies
  **Mitigation**: Use Math.js library for arbitrary-precision arithmetic; implement rounding rules per engineering standards; validate critical calculations against known test cases

### Compliance Risks

- **Risk**: Calculations may not account for all local code amendments and exceptions
  **Mitigation**: Include disclaimer that users must verify compliance with local AHJ requirements; clearly state which standard version is implemented

- **Risk**: Standards documents (IEC, IEEE, NEC) may be updated, making calculations outdated
  **Mitigation**: Version calculations with standard references (e.g., "NEC 2020"); plan for periodic updates; allow users to select standard version if multiple are supported

### User Experience Risks

- **Risk**: Engineers may distrust automated calculations without understanding underlying methodology
  **Mitigation**: Display formulas and intermediate calculation steps; provide references to standard sections; include "Show Calculation Details" option

- **Risk**: Complex tools (voltage drop, solar sizing) may overwhelm users with too many input parameters
  **Mitigation**: Use progressive disclosure; provide sensible defaults; include "Quick Mode" and "Advanced Mode" options; add contextual help tooltips

## Future Enhancements

- AI-powered calculation assistants using OpenRouter API for natural language input (e.g., "Size UPS for small office with 10 computers")
- MCP task agents for automated code compliance checking across multiple jurisdictions
- Integration with manufacturer databases for automatic equipment specification lookup
- 3D cable route visualization showing voltage drop along path
- Arc flash hazard analysis per IEEE 1584
- Short circuit current calculations per IEC 60909
- Harmonic analysis for non-linear loads
- Load flow analysis for distribution networks
- Collaboration features: shared projects, comments, approval workflows
- Mobile apps (iOS/Android) with offline calculation capability
- Multi-language support (Spanish, Chinese, French, German)
- Integration with CAD tools for automated drawing annotation
- Equipment lifecycle cost analysis comparing battery technologies
- Automated report templates for submittal packages
- Version control and calculation revision history
- API for integration with third-party engineering tools

## Notes

This specification defines ElectroMate as a comprehensive electrical engineering calculation platform focused on high-accuracy, standards-compliant tools for battery/UPS systems, solar design, and cable sizing. The tool prioritizes user experience with real-time calculations, clear validation warnings, and professional PDF reporting suitable for engineering documentation.

The phased priority approach (P1 for battery/UPS/cables, P2 for solar, P3 for battery comparison) allows incremental delivery of value while building toward a complete platform. Each user story is independently testable and delivers standalone value, supporting agile development and early user feedback.

The specification intentionally avoids implementation details (Next.js, React, Tailwind) to maintain technology-agnostic requirements while acknowledging that technical stack decisions will be made during planning phase. Success criteria focus on measurable user outcomes and calculation accuracy rather than internal system metrics.

Key design principles:
1. **Accuracy First**: All calculations must match published standards within specified tolerances
2. **Safety Warnings**: System must actively warn users of dangerous or code-violating conditions
3. **Professional Output**: PDF reports must be suitable for submission to clients and approval authorities
4. **Progressive Enhancement**: Start with core calculations (P1), expand to renewable energy (P2), add decision-support tools (P3)
5. **Dual Standard Support**: Accommodate both international (IEC/SI) and North American (NEC) engineering practices
