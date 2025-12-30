# Feature Specification: Interactive Room Layout Visualization for Lighting Design

**Feature Branch**: `005-lighting-layout-viz`
**Created**: 2025-12-30
**Status**: Draft
**Input**: User description: "research this website thoroughly and learn its features and calculation accuracy apply it to Lighting design section for accurate result and practical approach, this website also shows a room layout and how to put fixture in it, we need similar approach, reasearch write a paper and we'll plan it properly and implement. Here is the link to research and work something proper and accurate https://www.toolsrail.com/interior-design/light-fixture-calculator.php"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Room Layout Visualization (Priority: P1)

As a user designing lighting for a room, I want to see a visual representation of my room layout with fixture placements, so I can understand how fixtures will be distributed and ensure proper coverage.

**Why this priority**: Visual layout is the core differentiator that makes the tool practical and usable. Without visualization, users cannot verify that their lighting design makes sense spatially. This is the primary enhancement requested by the user.

**Independent Test**: Can be tested by entering room dimensions, calculating fixtures, and verifying that an interactive canvas shows fixture positions that match the calculated count.

**Acceptance Scenarios**:

1. **Given** a user enters room dimensions (4m x 5m), **when** they calculate lighting requirements, **then** the system displays an interactive room layout canvas with fixture positions marked.

2. **Given** the calculation returns 4 fixtures, **when** the layout is rendered, **then** 4 fixture markers are shown in appropriate positions within the room boundaries.

3. **Given** the user has a non-square room (3m x 6m), **when** fixtures are calculated, **then** the layout adapts fixture positions based on room aspect ratio.

4. **Given** the user hovers over a fixture marker, **when** they view the tooltip, **then** they see fixture details (lumens, watts, position coordinates).

---

### User Story 2 - Dynamic Layout Algorithm (Priority: P1)

As a user, I want the fixture layout to automatically adapt based on the number of fixtures and room shape, so that I get practical placement recommendations without manual configuration.

**Why this priority**: Automatic layout ensures users get sensible placements immediately without requiring design expertise. This directly addresses the "practical approach" requirement from the user.

**Independent Test**: Can be tested by calculating for different fixture counts (1, 2, 4, 8+) and verifying the layout algorithm produces appropriate grid patterns for each case.

**Acceptance Scenarios**:

1. **Given** a single fixture is calculated, **when** the layout renders, **then** the fixture is centered in the room.

2. **Given** 2 fixtures are calculated for a rectangular room, **when** the layout renders, **then** fixtures are placed linearly along the longer axis.

3. **Given** 4 fixtures are calculated, **when** the layout renders, **then** a 2x2 grid arrangement is shown.

4. **Given** 6 fixtures are calculated for a 4m x 6m room, **when** the layout renders, **then** a 2x3 grid arrangement is shown with proper spacing.

5. **Given** more than 4 fixtures are needed, **when** the layout renders, **then** fixtures are arranged in a multi-row grid that maintains aspect ratio.

---

### User Story 3 - Fixture Count Comparison with Industry Standards (Priority: P1)

As a user, I want the lighting calculations to match industry-standard websites like ToolsRail.com, so that I can trust the accuracy of the results for professional use.

**Why this priority**: The user specifically requested research and alignment with external tools. Calculation accuracy is fundamental to the tool's credibility and usefulness.

**Independent Test**: Can be tested by comparing calculation results for identical inputs against ToolsRail.com and other reference calculators.

**Acceptance Scenarios**:

1. **Given** a 4m x 4m bedroom at 100 lux, **when** calculation is performed, **then** the result matches ToolsRail.com within 5% tolerance.

2. **Given** a 3m x 5m kitchen at 300 lux, **when** calculation is performed, **then** the required lumens and fixture count match reference calculators.

3. **Given** a user selects different room types (Living, Bedroom, Kitchen, Office), **when** illuminance is calculated, **then** preset values align with IESNA recommendations shown in reference tools.

4. **Given** various fixture types (LED, Fluorescent), **when** efficiency is considered, **then** total wattage calculations match industry-standard formulas.

---

### User Story 4 - Fixture Type Suggestions and Recommendations (Priority: P2)

As a user, I want to receive specific fixture product recommendations based on my calculation, so that I know what type of fixtures to purchase for my project.

**Why this priority**: This enhances the practical value of the tool by providing actionable purchasing guidance, moving beyond calculations to implementation support.

**Independent Test**: Can be tested by calculating for different room types and verifying that appropriate fixture suggestions are displayed.

**Acceptance Scenarios**:

1. **Given** a kitchen calculation at 300 lux, **when** results are displayed, **then** LED panel lights and under-cabinet fixtures are suggested.

2. **Given** an office calculation, **when** results are displayed, **then** troffer lights and linear LED fixtures are suggested.

3. **Given** a bedroom calculation, **when** results are displayed, **then** recessed downlights and decorative fixtures are suggested.

4. **Given** the user clicks on a suggestion, **when** they view details, **then** they see specifications (lumens, watts, efficacy, typical applications).

---

### User Story 5 - Layout Export and Documentation (Priority: P2)

As a user, I want to export my lighting design layout as part of a PDF report, so that I can use it for professional documentation and client presentations.

**Why this priority**: The user mentioned needing a "practical approach" for implementation. PDF export with layout visualization makes the tool useful for professional work.

**Independent Test**: Can be tested by generating a PDF report and verifying the layout visualization is included.

**Acceptance Scenarios**:

1. **Given** a completed lighting calculation, **when** the user clicks "Export PDF", **then** a PDF is generated containing the room layout with fixture positions.

2. **Given** the PDF report is generated, **when** opened, **then** it includes fixture count, positions, and specifications in a professional format.

3. **Given** the user is on a mobile device, **when** PDF is generated, **then** the layout is responsive and readable on smaller screens.

---

### User Story 6 - Room Type Presets with Accurate Lux Values (Priority: P2)

As a user, I want room-type presets that provide accurate illuminance values based on industry standards, so that I don't need to manually look up recommended lux levels.

**Why this priority**: ToolsRail.com and other references provide clear preset values. Aligning with these provides familiarity and reduces user error.

**Independent Test**: Can be tested by comparing preset lux values against IESNA/industry standards.

**Acceptance Scenarios**:

1. **Given** the user selects "Living Room", **when** illuminance is displayed, **then** the value is 100-150 lux (per IESNA residential guidelines).

2. **Given** the user selects "Kitchen", **when** illuminance is displayed, **then** the value is 300-400 lux (per IESNA kitchen guidelines).

3. **Given** the user selects "Office", **when** illuminance is displayed, **then** the value is 300-500 lux (per IESNA office guidelines).

4. **Given** the user selects "Workshop", **when** illuminance is displayed, **then** the value is 500-750 lux (per IESNA task lighting guidelines).

---

### User Story 7 - Interactive Fixture Placement Customization (Priority: P3)

As an advanced user, I want to manually adjust fixture positions on the layout, so that I can customize the design based on architectural constraints or aesthetic preferences.

**Why this priority**: Lower priority as most users will accept automatic layouts, but advanced users need customization for professional projects.

**Independent Test**: Can be tested by dragging fixture markers and verifying positions update.

**Acceptance Scenarios**:

1. **Given** a calculated layout with 4 fixtures, **when** the user drags a fixture, **then** it moves to the new position within room boundaries.

2. **Given** fixtures have been manually repositioned, **when** the user calculates again, **then** custom positions are preserved.

3. **Given** the user wants to reset to automatic layout, **when** they click "Reset Layout", **then** fixtures return to calculated positions.

---

### Edge Cases

- What happens when room dimensions are invalid (zero or negative values)?
- How does system handle when calculated fixture count is zero?
- What occurs when room dimensions exceed practical limits (very large rooms)?
- How does the system handle conflicting manual overrides vs. auto-calculated values?
- What happens when browser window is resized during layout visualization?
- How does the system handle fixtures that cannot be placed due to room geometry?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an interactive room layout canvas showing calculated fixture positions based on room dimensions and count.
- **FR-002**: System MUST implement a dynamic layout algorithm that adapts fixture placement to room aspect ratio and fixture count.
- **FR-003**: System MUST calculate fixture positions using grid-based algorithms: 1=center, 2=linear, 4=2x2, 6+=multi-row grid.
- **FR-004**: System MUST match calculation results (lumens, fixture count) with industry-standard references within 5% tolerance.
- **FR-005**: System MUST provide preset illuminance values for room types matching IESNA recommendations.
- **FR-006**: System MUST generate fixture position markers that scale proportionally with room dimensions.
- **FR-007**: System MUST display fixture details on hover including lumens, watts, and position coordinates.
- **FR-008**: System MUST export PDF reports including the room layout visualization.
- **FR-009**: System MUST provide fixture type suggestions based on room type and illuminance requirements.
- **FR-010**: System MUST allow manual repositioning of fixtures within room boundaries.
- **FR-011**: System MUST persist layout configurations with calculation results for future reference.
- **FR-012**: System MUST calculate horizontal and vertical spacing as percentage of room dimensions: `spacing = 100 / (fixtures + 1)`.

### Key Entities

- **RoomLayout**: Represents the visual room representation with dimensions, aspect ratio, and boundaries for fixture placement.
- **FixtureMarker**: Represents a fixture position on the layout including coordinates (x, y), fixture specifications, and interaction state.
- **LayoutGrid**: Represents the calculated grid arrangement for fixture placement based on fixture count and room shape.
- **FixtureSuggestion**: Represents recommended fixture types for a given room type including specifications and use cases.
- **CalculationResult**: Extends existing result to include layout configuration and fixture positions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view fixture layout visualization within 2 seconds of calculation completion.
- **SC-002**: Layout algorithm produces appropriate grid patterns for all fixture counts from 1 to 20 fixtures.
- **SC-003**: Calculation results match industry-standard calculators (ToolsRail.com, LumenCalculator.com) within 5% tolerance for identical inputs.
- **SC-004**: Preset illuminance values align with IESNA Lighting Handbook recommendations for all supported room types.
- **SC-005**: PDF export with layout visualization completes within 5 seconds for standard room configurations.
- **SC-006**: 90% of users can understand and use the layout visualization without additional guidance.
- **SC-007**: Fixture placement recommendations meet spacing guidelines (fixtures spaced approximately equal to mounting height distance).
- **SC-008**: Interactive layout responds to user interactions (hover, drag) within 100ms.

### Research Notes

This specification is based on research from ToolsRail.com Light Fixture Calculator (https://www.toolsrail.com/interior-design/light-fixture-calculator.php), which provides:
- Room layout visualization with dynamic fixture positioning
- Grid-based layout algorithms adapting to room proportions
- Preset room types with IESNA-aligned illuminance values
- Fixture type suggestions with efficiency ratings
- Layout recommendation engine with room-type-specific guidance

Key formulas from research:
- Required Lumens = Room Area × Lux Level
- Number of Fixtures = Required Lumens ÷ Lumens per Fixture
- Horizontal Spacing = 100 / (columns + 1) as percentage of room width
- Vertical Spacing = 100 / (rows + 1) as percentage of room height

## Assumptions

1. Room dimensions are rectangular (L × W) - no irregular shapes in initial implementation.
2. Fixtures are assumed to be ceiling-mounted at standard height for layout calculations.
4. Layout visualization uses a fixed-aspect canvas that scales to fit the display area.
5. Users have basic understanding of lighting terminology (lux, lumens, fixtures).
6. PDF generation uses existing jsPDF library in the project.
7. Layout interactions use standard drag-and-drop without complex constraints.
8. Default ceiling height of 2.75m is used for spacing calculations unless user specifies otherwise.

## Dependencies

- Existing lighting calculation engine in `lib/calculations/lighting/lumenMethod.ts`
- Existing luminaire catalog in `lib/standards/luminaireCatalog.ts`
- Existing PDF generation in `lib/reports/lightingPdfGenerator.ts`
- React state management via Zustand in `stores/useLightingStore.ts`

## Out of Scope

- 3D room visualization (2D only for initial release)
- Drag-and-drop from catalog to layout (manual repositioning only)
- Automatic electrical wiring diagrams
- Cost estimation for fixtures
- Integration with smart home systems
- Mobile-specific optimized layout view
- Voice-controlled layout adjustments
