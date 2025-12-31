# Implementation Plan: Interactive Room Layout Visualization for Lighting Design

**Branch**: `005-lighting-layout-viz` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-lighting-layout-viz/spec.md`

## Summary

Add interactive 2D room layout visualization to the existing lighting design calculator. Users will see a visual representation of their room with calculated fixture positions, enabling spatial verification of lighting designs. The feature implements dynamic layout algorithms (1=center, 2=linear, 4=2x2, 6+=multi-row grid) that adapt to room aspect ratio and fixture count. Includes fixture type suggestions, PDF export with layout visualization, and manual repositioning for advanced users. Technical approach uses HTML5 Canvas for rendering, extending the existing Zustand store for layout state, and integrating with the established calculation engine.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with React 19.2.3 (Next.js 16.1.1 App Router)
**Primary Dependencies**: HTML5 Canvas API, React Canvas (optional for complex scenes), existing React components and Zustand store
**Storage**: localStorage persistence via Zustand (extend existing `useLightingStore`), no new backend required
**Testing**: Vitest 4.0.16 with @testing-library/react, Jest Canvas mocking
**Target Platform**: Web application (desktop primary, responsive for tablet)
**Project Type**: Web application extension (integrated into existing ElectroMate lighting calculator)
**Performance Goals**: Canvas render <100ms, layout calculation <50ms, tooltip response <50ms
**Constraints**: Max fixtures 20 (per spec), rectangular rooms only, browser canvas support required
**Scale/Scope**: Visual overlay on existing results section, ~10 new components/modules

## Constitution Check

### Calculation Accuracy (if applicable to engineering/calculation features)
- [x] All calculation formulas identified with applicable standards
  - Layout algorithm: `spacing = 100 / (fixtures + 1)` percentage-based positioning
  - Grid dimensions: columns = ceil(sqrt(fixtures)), rows = ceil(fixtures / columns)
  - Center positioning: (50%, 50%) for single fixture, (50% + offset) for grid
- [x] Test cases from published standards documented
  - ToolsRail.com comparison tests (5% tolerance per spec SC-003)
  - IESNA spacing guidelines fixture spacing approximately equal to mounting height
- [x] Accuracy tolerance thresholds specified
  - Fixture position precision: ±1% of canvas dimensions
  - Grid alignment: ±2% deviation from calculated positions
- [x] Math.js or equivalent not required (integer arithmetic sufficient)

### Safety-First Validation (if applicable to safety-critical features)
- [x] Dangerous condition detection defined
  - Invalid room dimensions (zero or negative values) prevent visualization
  - Zero fixtures calculated show appropriate empty state
  - Very large rooms (>100m) show scaling warning
- [x] Real-time validation (<100ms response)
  - Canvas renders on calculation completion, not continuous
  - Debounced re-render on dimension changes (300ms)
- [x] Warning UI treatment
  - Reuse existing WarningBanner component
  - Layout-specific warnings: overcrowding, edge proximity
- [x] Edge case validation
  - Non-rectangular rooms: display "rectangular only" placeholder
  - Aspect ratio extremes: clamp fixture positions within 10% margin
  - Browser resize: maintain aspect ratio, re-center content

### Standards Compliance and Traceability
- [x] Standard versions referenced in spec
  - IESNA Lighting Handbook 10th Edition (presets)
  - ToolsRail.com methodology comparison baseline
- [x] Standard references in outputs
  - Preset illuminance values cite IESNA in tooltips
  - Layout algorithm explanation in help text
- [x] PDF reports include references
  - Existing lighting PDF generator extended with canvas snapshot

### Test-First Development
- [x] TDD workflow confirmed for layout algorithms
  - LayoutGrid calculation logic (Red-Green-Refactor)
  - Canvas rendering component
- [x] Test coverage specified
  - Nominal: 4m×5m room with 4 fixtures (2×2 grid)
  - Boundary: 1 fixture, 20 fixtures, extreme aspect ratios
  - Edge: 0 fixtures, invalid dimensions, aspect ratio >3:1
- [x] User approval checkpoint
  - Visual layout verification before PDF export

### Professional Documentation (if applicable to client-facing tools)
- [x] PDF export requirements defined
  - Canvas snapshot embedded in existing lighting PDF
  - Fixture positions listed as coordinates
- [x] Cross-browser compatibility
  - Canvas API supported in all modern browsers
  - Fallback message for IE11/unknown browsers
- [x] Disclaimer text
  - Reuse existing professional engineering notice

### Progressive Enhancement
- [x] Feature prioritization confirmed (P1/P2/P3 from spec)
  - P1: Visualization, layout algorithm, accuracy alignment
  - P2: Suggestions, export, presets
  - P3: Manual customization
- [x] Each story independently testable
  - Layout visualization works without suggestions
  - PDF export works without manual customization
- [x] No dependencies on incomplete features
  - P1 features independent; P2/P3 extend P1
- [x] Incremental delivery
  - Phase 1: Basic visualization + layout algorithm
  - Phase 2: Suggestions + PDF export
  - Phase 3: Manual repositioning

### Other Constitution Principles
- [x] Dual standards support (already in project: SI/Imperial toggle)
  - Layout displays both metric and imperial coordinates
- [x] Security requirements addressed
  - No user-generated content requiring sanitization
  - Canvas drawing from trusted calculation data only
- [x] Code quality standards
  - Follow existing component patterns
  - Minimal new dependencies (native Canvas API)

## Project Structure

### Documentation (this feature)

```text
specs/005-lighting-layout-viz/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # [OPTIONAL] Phase 0 research output
├── data-model.md        # [OPTIONAL] Data model documentation
├── quickstart.md        # [OPTIONAL] Developer quickstart
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
app/
└── lighting/
    └── LightingDesignTool.tsx     # Extend with LayoutCanvas tab/content

components/
└── lighting/
    ├── LayoutCanvas.tsx           # NEW: Main canvas visualization component
    ├── LayoutGrid.tsx             # NEW: SVG overlay grid for room boundaries
    ├── FixtureMarker.tsx          # NEW: Interactive fixture position markers
    ├── FixtureTooltip.tsx         # NEW: Tooltip on hover showing fixture details
    ├── LayoutToolbar.tsx          # NEW: Controls (reset, export, suggestions)
    └── LayoutPresets.tsx          # NEW: Room type preset selector (P2)

lib/
├── calculations/
│   └── lighting/
│       └── layoutAlgorithm.ts     # NEW: Dynamic layout algorithm (1/2/4/6+ fixtures)
├── types/
│   └── lighting.ts                # EXTEND: Add LayoutConfiguration, FixturePosition types
└── reports/
    └── lightingPdfGenerator.ts    # EXTEND: Add layout snapshot to PDF

stores/
└── useLightingStore.ts            # EXTEND: Add layout state (positions, manual override)

hooks/
└── useCanvas.ts                   # NEW: Canvas rendering hook for fixture drawing

types/
└── layout.ts                      # NEW: Type definitions for layout visualization
```

**Structure Decision**: Extends existing ElectroMate Next.js codebase following established patterns. New components in `components/lighting/`, layout algorithm in `lib/calculations/lighting/`, types in `lib/types/`. Leverages native HTML5 Canvas API without additional dependencies. Zustand store extended for layout persistence.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| HTML5 Canvas | Interactive visualization with fixture markers, tooltips, drag support | Static SVG insufficient for manual repositioning (P3) |
| Layout algorithm module | Reusable grid calculation across canvas and PDF export | Inline calculation scattered, harder to test and maintain |

No significant complexity additions. Canvas API is native browser feature, no new npm dependencies required.

## Implementation Phases

### Phase 1: Core Visualization (P1 User Stories)
**Scope**: User Story 1 (Interactive Visualization) + User Story 2 (Dynamic Layout Algorithm) + User Story 3 (Accuracy)

**Deliverables**:
- `LayoutCanvas` component with HTML5 Canvas rendering
- `layoutAlgorithm.ts` implementing grid-based positioning
- Fixture markers showing calculated positions
- Tooltips on hover with fixture details (lumens, watts, coordinates)
- Room boundaries and grid overlay
- Aspect ratio adaptation for non-square rooms
- Integration with existing `LightingDesignTool` (new layout section in results)
- Layout state in Zustand store for persistence

**Success Criteria**:
- Canvas renders within 2 seconds of calculation completion (SC-001)
- Layout algorithm produces appropriate patterns for 1-20 fixtures (SC-002)
- Calculation results match ToolsRail.com within 5% tolerance (SC-003)
- Interactive response within 100ms (SC-008)

### Phase 2: Enhanced Features (P2 User Stories)
**Scope**: User Story 4 (Fixture Suggestions) + User Story 5 (PDF Export) + User Story 6 (Room Presets)

**Deliverables**:
- Fixture type suggestions panel based on room type and illuminance
- Layout snapshot integration in existing PDF generator
- Room type preset selector with IESNA-aligned illuminance values
- PDF export including room layout visualization (SC-005)
- Preset illuminance values validation against IESNA (SC-004)

**Success Criteria**:
- PDF export with layout visualization <5 seconds (SC-005)
- Preset values align with IESNA recommendations (SC-004)

### Phase 3: Advanced Features (P3 User Stories)
**Scope**: User Story 7 (Manual Repositioning)

**Deliverables**:
- Drag-and-drop fixture repositioning within room boundaries
- Reset to auto-layout button
- Custom position persistence with calculation results

**Success Criteria**:
- Fixture repositioning maintains positions on recalculation
- Reset restores auto-calculated positions

## Key Formulas and Standards

### Dynamic Layout Algorithm

```
// Determine grid dimensions based on fixture count
columns = ceil(sqrt(fixtures))
rows = ceil(fixtures / columns)

// Calculate spacing as percentage of room dimension
horizontalSpacing = 100 / (columns + 1)  // percent of room width
verticalSpacing = 100 / (rows + 1)        // percent of room height

// Fixture position (column, row) -> percentage coordinates
x_percent = horizontalSpacing * (col + 1)
y_percent = verticalSpacing * (row + 1)

// Center offset for asymmetric grids
if fixtures_per_row > 1:
  x_offset = (fixtures_per_row - columns) * horizontalSpacing / 2
  x_percent += x_offset
```

### Fixture Count to Layout Pattern Mapping

| Fixtures | Pattern | Grid Dimensions | Description |
|----------|---------|-----------------|-------------|
| 1 | Center | 1×1 | Single fixture at room center |
| 2 | Linear | 1×2 or 2×1 | Two fixtures along longer axis |
| 3-4 | Rectangular | 2×2 (max) | 3=2×2 with one position empty, 4=full 2×2 |
| 5-8 | Rectangular | rows×columns | Optimal rectangle (e.g., 6=2×3, 8=2×4) |
| 9+ | Near-square | rows≈columns | Grid maintaining aspect ratio |

### Coordinate Conversion

```
// Canvas pixel position from percentage
pixelX = canvasWidth * x_percent / 100
pixelY = canvasHeight * y_percent / 100

// Real-world position from percentage
realX = roomWidth * x_percent / 100
realY = roomLength * y_percent / 100  // Room length typically Y axis in floor plans
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Canvas rendering performance on large rooms | Low | Medium | Downscale canvas for rendering, display at native size |
| Layout algorithm edge cases (prime numbers) | Low | Low | Test fixtures=7,11,13,17,19 explicitly |
| Browser canvas support (accessibility) | Very Low | Low | Detect canvas support, show static SVG fallback |
| PDF canvas snapshot quality | Medium | Medium | Use high-resolution canvas for export (2x display size) |
| Drag-and-drop conflicts with touch devices | Medium | Low | Use pointer events, test on tablet simulators |

## Dependencies for Implementation

### No new npm packages required

All functionality provided by:
- HTML5 Canvas API (native browser)
- React event system (existing)
- Zustand state management (existing)
- jsPDF for PDF export (existing)

### Existing packages utilized:
- `zustand` - state management (already in project)
- `jspdf` - PDF generation (already in project)
- `@testing-library/react` - component testing (already in project)

## Next Steps

After plan approval:
1. Run `/sp.tasks` to generate detailed task breakdown with test cases
2. Begin Phase 1 implementation following TDD
3. Validate layout algorithm against ToolsRail.com reference outputs
4. Test canvas rendering across target browsers (Chrome, Firefox, Safari, Edge)

## Appendix: Component Integration Points

### Integration with LightingDesignTool

```
Results Card (existing)
├── Primary Results (existing)
├── Warnings (existing)
├── Recommendations (existing)
├── Actions (existing)
└── NEW: Layout Visualization Section
    ├── LayoutCanvas (renders when results.luminaires > 0)
    ├── Fixture markers (calculated positions)
    ├── Tooltip (on hover)
    └── LayoutToolbar (reset, export suggestions)
```

### Integration with useLightingStore

```typescript
// Extend existing interface
interface LightingCalculatorState {
  // ... existing fields ...

  // NEW: Layout state
  layoutPositions: FixturePosition[];  // Calculated or manual positions
  isLayoutManual: boolean;              // True if user dragged fixtures
}

interface LightingCalculatorActions {
  // ... existing actions ...

  // NEW: Layout actions
  setLayoutPositions: (positions: FixturePosition[]) => void;
  resetLayoutPositions: () => void;
  updateFixturePosition: (index: number, x: number, y: number) => void;
}
```

### Integration with lightingPdfGenerator

```typescript
// Extend existing downloadLightingPdf options
interface PdfOptions {
  // ... existing fields ...
  layoutCanvas?: HTMLCanvasElement;  // Optional canvas snapshot
  layoutPositions?: FixturePosition[];  // For coordinate table
}
```
