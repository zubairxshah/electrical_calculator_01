# Feature Specification: Lighting Design Calculator

**Feature Branch**: `004-lighting-design`
**Created**: 2025-12-28
**Status**: Ready for Planning
**Input**: Professional lighting design calculator for industrial and commercial spaces with manual and visual (PDF/image) input, IES/CIE/ASHRAE compliance calculations, and PDF report generation.

## Executive Summary

A professional-grade lighting design calculator that competes with expensive tools like DIALux by providing accurate, standards-based lighting calculations for indoor and commercial spaces. The tool supports manual parameter input and premium visual input (PDF/floor plan analysis) to automatically extract room dimensions and luminaire positions. Engineers can calculate required luminaires, average illuminance, spacing ratios, and energy consumption while receiving optimization recommendations. Outputs include JSON data for programmatic use and professional PDF reports with diagrams.

## User Scenarios & Testing

### User Story 1 - Basic Indoor Lighting Calculation (Priority: P1)

A commercial electrician needs to determine how many LED panel lights are required for a 12m × 8m office meeting room with 3m ceiling height to achieve 500 lux illuminance. They input room dimensions, surface reflectances, and select an LED luminaire type. The system calculates the required number of fixtures, average illuminance, and provides energy consumption estimates.

**Why this priority**: Core functionality that delivers immediate value. Most users will use this basic calculation workflow. Independent MVP with no dependencies.

**Independent Test**: User inputs room (12×8×3m), reflectance (80/50/20), LED panel (40W, 3600lm), required illuminance (500 lux). System outputs: luminaires required, average lux achieved, energy usage. Can be tested by comparing against manual IES formula calculations.

**Acceptance Scenarios**:

1. **Given** a rectangular room with valid dimensions (1-100m), **when** user inputs all required parameters, **then** system MUST calculate luminaires required within ±5% of IESNA handbook formula results.

2. **Given** luminaire data (type, watts, lumens), **when** user specifies required illuminance (100-1000 lux for offices), **then** system MUST compute average illuminance and number of fixtures.

3. **Given** calculated luminaires, **when** user requests results, **then** system MUST provide energy consumption estimate in kWh/year based on daily operating hours.

---

### User Story 2 - Visual Input from Floor Plans (Priority: P2)

A lighting designer receives a PDF floor plan from an architect and wants to quickly extract room measurements without manual entry. They upload the PDF, and the system uses visual analysis to identify room boundaries, dimensions, and potential luminaire mounting points. The designer reviews extracted data, confirms uncertainties, and proceeds with calculations.

**Why this priority**: Premium feature that differentiates the product from competitors. Automates tedious manual data entry from architectural drawings. Reduces calculation setup time significantly.

**Independent Test**: Upload PDF floor plan with labeled room dimensions. System extracts room geometry (length, width, height), identifies doors/windows for reflectance estimation, and suggests luminaire placement zones. Test by comparing extracted values against ground truth from the PDF.

**Acceptance Scenarios**:

1. **Given** a PDF/image floor plan with readable dimension annotations, **when** user uploads the file, **then** system MUST extract room dimensions within 5% accuracy of labeled values.

2. **Given** extracted room data, **when** analysis encounters ambiguous measurements or missing data, **then** system MUST flag uncertainties for user confirmation before calculation.

3. **Given** confirmed extracted parameters, **when** user proceeds to calculation, **then** system MUST populate calculation form with extracted values.

---

### User Story 3 - Advanced Lighting Simulations (Priority: P2)

An energy efficiency consultant needs detailed lighting analysis for a warehouse retrofit. They perform a calculation and request shadow mapping, uniformity analysis, and comparison against DIALux baseline. The system provides visual heatmaps showing illuminance distribution, identifies over-lit/under-lit areas, and recommends fixture repositioning for optimal uniformity.

**Why this priority**: Professional feature that justifies premium pricing. Provides value beyond basic calculations by helping optimize designs. Differentiates from free online calculators.

**Independent Test**: Input room with multiple luminaires (4+). System generates uniformity ratio (min/avg illuminance) and identifies low-uniformity zones. Recommendations reduce shadow regions while maintaining required illuminance. Test by verifying uniformity improves after applying recommendations.

**Acceptance Scenarios**:

1. **Given** calculated lighting design with multiple fixtures, **when** user requests uniformity analysis, **then** system MUST compute min/avg/max illuminance and display uniformity ratio.

2. **Given** non-uniform lighting detected, **when** system generates recommendations, **then** MUST suggest specific repositioning or quantity changes that improve uniformity by at least 10%.

3. **Given** user compares against DIALux reference, **when** both use identical input parameters, **then** system MUST produce results within 10% of DIALux output.

---

### User Story 4 - Outdoor and Roadway Lighting (Priority: P3)

A municipal lighting engineer needs to design roadway lighting for a new street section. They input road width, pole spacing, mounting height, and select roadway luminaires. The system calculates pole spacing requirements per IES RP-8 or CIE 140 standards, provides uniformity metrics, and generates a pole layout diagram.

**Why this priority**: Expands market to municipal/transportation sector. Outdoor lighting follows different standards (IES RP-8, CIE 140) than indoor. Niche but high-value use case.

**Independent Test**: Input roadway (6m wide, 500m length), poles (10m spacing, 12m mounting), LED cobra head luminaire. System outputs: poles required, spacing verification, average lux on road surface, uniformity. Test by comparing against IES RP-8 handbook examples.

**Acceptance Scenarios**:

1. **Given** roadway parameters (width, length, pole spacing, mounting height), **when** user selects outdoor luminaire type, **then** system MUST calculate average illuminance and uniformity per IES RP-8 or CIE 140.

2. **Given** calculated design, **when** user requests pole layout, **then** system MUST generate downloadable diagram showing pole positions and spacing.

---

### User Story 5 - PDF Report Generation (Priority: P1)

A consulting engineer needs to submit lighting design calculations to a client and building authority. After completing calculations, they generate a professional PDF report containing room layout diagram, luminaire schedule, calculation formulas, results tables, and compliance notes with IES/CIE standard references.

**Why this priority**: Essential for professional use. Engineers must document calculations for regulatory approval. Report is the deliverable that creates value.

**Independent Test**: Complete any calculation and generate PDF. Verify report contains: room parameters, luminaire data table, illuminance results, energy consumption, standard references, and disclaimer. PDF opens correctly in standard viewers.

**Acceptance Scenarios**:

1. **Given** completed calculation, **when** user requests PDF report, **then** system MUST generate report within 10 seconds containing all input parameters and results.

2. **Given** PDF report, **when** opened, **then** MUST display luminaire layout diagram, calculation tables, and standard compliance references (IESNA, CIE, ASHRAE as applicable).

3. **Given** premium subscription, **when** user generated report from visual input, **then** PDF MUST include extracted floor plan with marked measurements.

---

### User Story 6 - Luminaire Catalog Management (Priority: P3)

A lighting designer frequently uses specific luminaire types and wants to save their specifications for quick access. They can browse a pre-loaded catalog of common luminaires (with watts, lumens, efficacy data) and save custom fixtures to their account for reuse across projects.

**Why this priority**: Improves workflow efficiency for repeat users. Catalog provides trusted luminaire data without manual entry. Supports professional workflow patterns.

**Independent Test**: User selects LED panel from catalog. System populates wattage (40W), lumens (3600lm), efficacy (90 lm/W). User saves custom fixture with their own data. Custom fixture appears in personal catalog for future projects.

**Acceptance Scenarios**:

1. **Given** system catalog, **when** user browses luminaires, **then** MUST display filtering by type (troffer, high-bay, wall-pack, roadway) with specs visible.

2. **Given** custom luminaire specification, **when** user saves to account, **then** fixture MUST be available in personal catalog for future calculations.

---

### Edge Cases

- **Non-rectangular rooms**: L-shaped rooms, irregular floor plans - system provides area-based estimation or requests manual zone breakdown
- **High ceilings (>10m)**: Special mounting height factors, potential for high-bay fixtures with different light distribution
- **Mixed reflectivity surfaces**: Rooms with floor-to-ceiling glass walls, industrial environments with varying surface conditions
- **Zero or negative dimensions**: Validation rejects invalid inputs with helpful error messages
- **Unrealistically high illuminance requirements**: Warn if required illuminance exceeds recommended levels for the space type
- **Premium feature without subscription**: Visual input access restricted, clear upsell messaging
- **Unsupported PDF/image formats**: Error message with supported formats list

---

## Requirements

### Functional Requirements

#### Input & Configuration

- **FR-001**: System MUST accept manual room dimensions (length, width, height) in meters or feet
- **FR-002**: System MUST accept surface reflectances as percentages for ceiling, walls, and floor (0-100%)
- **FR-003**: System MUST provide luminaire type selection from catalog with watts, lumens, efficacy data
- **FR-004**: System MUST accept required illuminance in lux (50-5000 lux range) with space-type presets
- **FR-005**: System MUST accept mounting height, spacing parameters, and layout constraints
- **FR-006**: System MUST accept Utilization Factor (UF) and Maintenance Factor (MF) with reasonable defaults (UF: 0.5-0.8, MF: 0.7-0.9)
- **FR-007**: System MUST accept images (PNG, JPG, BMP) and PDF files for floor plan upload. Visual analysis available to all users with monthly limits (see Subscription Model for limits).

#### Calculations

- **FR-008**: System MUST calculate Room Index (RI) = (L × W) / (H × (L + W)) for rectangular rooms
- **FR-009**: System MUST calculate luminaires required using lumen method: N = (E × A) / (F × UF × MF)
- **FR-010**: System MUST compute average illuminance: Eavg = (N × F × UF × MF) / A
- **FR-011**: System MUST calculate spacing-to-mounting-height ratio (SHR) and validate against luminaire distribution
- **FR-012**: System MUST compute energy consumption: kWh/year = (Total Watts × Operating Hours × 365) / 1000
- **FR-013**: System MUST apply ballast/lamp efficiency adjustments (0.85-0.95 factor for fluorescent/HID)
- **FR-014**: System MUST implement outdoor/roadway lighting calculations per both IES RP-8 (American) and CIE 140 (International) standards, allowing user to select applicable standard.

#### Visual Analysis (Premium)

- **FR-015**: System MUST accept PDF files and common image formats (PNG, JPG) for floor plan upload
- **FR-016**: System MUST implement visual analysis using local OCR (Tesseract.js) with custom image processing rules, prioritizing accessibility and zero per-page costs. Cloud ML services available as future enhancement for premium tier.
- **FR-017**: System MUST extract room dimensions from floor plan with at least 90% confidence on readable plans
- **FR-018**: System MUST identify luminaire mounting locations and suggest placement zones
- **FR-019**: System MUST flag ambiguous measurements, missing dimensions, and unclear elements for user confirmation
- **FR-020**: Premium feature access MUST be controlled by subscription status

#### Output & Reporting

- **FR-021**: System MUST output JSON structure with RoomDimensions, SurfaceReflectances, LuminaireData, AverageIlluminance, TotalLumens, EnergyConsumption
- **FR-022**: System MUST provide text commentary with formulas, intermediate values, and standard references
- **FR-023**: System MUST generate PDF report with layout diagrams, calculation tables, and compliance notes
- **FR-024**: System MUST reference applicable standards in outputs (IESNA, CIE, IEC, ASHRAE as applicable)
- **FR-025**: System MUST include professional disclaimer in PDF reports

#### Advanced Analysis

- **FR-026**: System MUST compute uniformity ratio (Emin/Eavg) for multi-fixture layouts
- **FR-027**: System MUST provide shadow mapping visualization showing illuminance distribution
- **FR-028**: System MUST generate optimization recommendations for improved uniformity or energy efficiency
- **FR-029**: System MUST provide DIALux comparison using parameter-based approximation, allowing users to validate against reference designs with similar inputs.

### Key Entities

- **Room**: Length, width, height, surface reflectances, room index, space type category
- **Luminaire**: Type, lamp watts, total lumens, efficacy, quantity, lumen contribution, spacing ratio
- **LightingDesign**: Room reference, luminaires, required illuminance, calculated results, energy consumption
- **VisualInputAnalysis**: Source file reference, extracted rooms array, uncertainty flags, confidence scores
- **LuminaireCatalog**: Manufacturer, model, type category, specifications, efficacy data
- **UserDesign**: Saved lighting designs linked to user account with custom parameters

### Success Criteria

#### Measurable Outcomes

- **SC-001**: Engineers can complete basic lighting calculation in under 60 seconds (from page load to results)
- **SC-002**: Calculation accuracy within ±5% of IESNA Lighting Handbook formula results for standard rectangular rooms
- **SC-003**: Visual input dimension extraction achieves ≥90% accuracy on PDF floor plans with clear dimension annotations
- **SC-004**: PDF report generation completes within 10 seconds for standard calculations
- **SC-005**: Energy consumption estimates within ±10% of actual measured values based on operating hour inputs
- **SC-006**: Uniqueness score: 80% of users report value over existing free online lighting calculators (surveys)
- **SC-007**: Conversion rate: 15% of visual input users upgrade to premium within 30 days
- **SC-008**: 95% of calculation results pass spot-check verification against manual IES formula calculations

---

## Assumptions

1. Luminaire catalog initially includes 50+ common LED fixtures across categories; users can add custom fixtures
2. Utilization Factor calculated using lumen method with standard coefficients (IESNA Table approach)
3. Maintenance Factor defaults to 0.8 (industry standard for LED fixtures with 5-year cleaning cycle)
4. Operating hours default to 10 hours/day for commercial spaces; user can specify
5. Standards compliance references IESNA LM-79, CIE 140, ASHRAE 90.1 for energy
6. Visual analysis quality depends on PDF resolution and dimension annotation clarity
7. All calculations use SI units internally; imperial conversion available for input/output
8. No real-time fixture pricing integration; estimates based on generic costs

---

## Out of Scope

- Real-time pricing from luminaire manufacturers or distributors
- Photorealistic rendering of lit spaces
- Daylighting/sunlight integration analysis
- Emergency lighting calculations (separate standard NFPA 101)
- Control system integration (dimmable fixtures, occupancy sensors)
- Thermal analysis for LED fixtures
- Warranty or maintenance scheduling
- Direct ordering from luminaire suppliers
- Regulatory permit generation specific to jurisdictions
- 3D modeling integration (Revit, SketchUp)

---

## Dependencies

1. PDF rendering library (pdf.js or similar) for visual analysis
2. Image processing library for dimension extraction
3. Tesseract.js for local OCR/pattern recognition (zero per-page cost, browser-based)
4. jsPDF for report generation
5. Math.js for precision calculations (consistent with existing ElectroMate tools)

---

## Constraints

1. Visual analysis limited to 2D floor plans (no 3D models)
2. Maximum room dimensions: 100m × 100m × 50m for calculations
3. PDF file size limit: 10MB for visual analysis uploads
4. Calculation results precision: ±0.1 lux for illuminance, ±1 lumen for total lumens
5. Premium features require subscription; free tier has monthly calculation limits
6. Response time limits: calculation <2s, PDF generation <10s, visual analysis <30s

---

## Clarifications Resolved

All 3 clarification questions have been resolved based on project goals (accessible low cost, industry standard, competitive).

| Question | Decision | Rationale |
|----------|----------|-----------|
| Q1: Visual Input Stack | Local OCR (Tesseract.js) | Zero per-page cost, browser-based, prioritizes accessibility; cloud as future premium enhancement |
| Q2: Outdoor Standards | Both IES RP-8 and CIE 140 | Global coverage, supports both American and international markets |
| Q3: Subscription Model | Unlimited basic, visual 3/month | Accessible freemium model; visual analysis limited to encourage upgrades |

**Decision Summary**:
- Visual analysis: Local Tesseract.js processing, no API costs
- Standards: IES RP-8 (American) + CIE 140 (International)
- Freemium: Unlimited basic calculations, 3 visual analyses/month free
