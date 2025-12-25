# Implementation Plan: Mobile Sidebar Conversion to Menu

**Branch**: `003-mobile-sidebar-menu` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-mobile-sidebar-menu/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Convert the fixed sidebar navigation to a collapsible hamburger menu on mobile devices (<768px) to maximize screen space for calculator content. This is a pure UI/layout enhancement that addresses text truncation and space constraints on mobile without affecting desktop behavior or calculation logic. The sidebar will remain fixed on desktop (≥768px) while converting to an overlay/drawer pattern with hamburger menu trigger on mobile.

## Technical Context

**Language/Version**: TypeScript 5.9.3 / React 18 (Next.js 16.1.1)
**Primary Dependencies**: Next.js 16.1.1, Tailwind CSS 3.4, Lucide React (icons), Zustand (existing state management)
**Storage**: Client-side state only (sidebar open/closed state)
**Testing**: Manual responsive testing on real devices and browser DevTools, Playwright for E2E navigation flows
**Target Platform**: Mobile-first web application (iOS Safari 15+, Android Chrome 100+, modern desktop browsers)
**Project Type**: Web (Next.js App Router with client components)
**Performance Goals**: Sidebar animations at 60fps, <300ms transition duration, <100ms interaction response
**Constraints**: No horizontal scrolling on any device, WCAG 2.1 Level AA compliance, 44px minimum touch targets
**Scale/Scope**: Single layout enhancement affecting 3 components (Sidebar, Header, Layout), no new pages or routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Review `.specify/memory/constitution.md` and verify compliance with all applicable principles:

### Calculation Accuracy (if applicable to engineering/calculation features)
- [N/A] All calculation formulas identified with applicable standards (IEEE, IEC, NEC, BS, NREL)
- [N/A] Test cases from published standards documented for accuracy validation
- [N/A] Accuracy tolerance thresholds specified (e.g., ±2% for battery calculations, ±0.1% for voltage drop)
- [N/A] Math.js or equivalent high-precision arithmetic library planned for implementation

**Rationale**: This is a UI/navigation feature with no calculation logic. No formulas or numerical accuracy requirements.

### Safety-First Validation (if applicable to safety-critical features)
- [N/A] Dangerous condition detection rules defined (e.g., discharge rates >1C, voltage drops >3%)
- [N/A] Real-time validation approach specified (target <100ms validation latency)
- [N/A] Warning UI treatment defined (red highlighting, explanatory text with code references)
- [N/A] Edge case validation planned (negative values, impossible conditions, physical limits)

**Rationale**: Layout/navigation change with no safety-critical calculations or data validation. Does not affect warning displays in calculator results.

### Standards Compliance and Traceability (if applicable to regulated domains)
- [N/A] Standard versions specified (e.g., "NEC 2020", "IEC 60364-5-52:2009")
- [N/A] Standard references will be displayed in calculation outputs
- [N/A] PDF reports will include section numbers and formula citations
- [N/A] Version labeling strategy defined for standard updates

**Rationale**: UI/layout feature does not involve engineering standards or calculation references.

### Test-First Development
- [✅] TDD workflow confirmed for critical logic (navigation state management)
- [✅] Test coverage requirements specified (manual responsive testing + E2E navigation flows)
- [N/A] User approval checkpoint planned for test case validation
- [✅] Test framework and tooling selected (Playwright for E2E, manual testing for responsive breakpoints)

**Rationale**: While not calculation-critical, navigation state logic (open/close, backdrop handling) will follow test-first approach. Manual responsive testing required for layout validation across breakpoints.

### Professional Documentation (if applicable to client-facing tools)
- [N/A] PDF export requirements defined (inputs, formulas, references, timestamps)
- [✅] Cross-browser compatibility targets specified (Chrome 100+, Safari 15+, Firefox 100+, Edge 100+)
- [N/A] Disclaimer text prepared for professional submission materials
- [N/A] Intermediate calculation steps approach defined (e.g., "Show Details" mode)

**Rationale**: Navigation enhancement doesn't affect PDF exports. Browser compatibility defined in spec NFRs.

### Progressive Enhancement
- [✅] Feature prioritization confirmed (P1: Hamburger Menu, P1: Full-Width Content, P2: Smooth Animations)
- [✅] Each user story independently testable and deployable
- [✅] No dependencies on incomplete higher-priority features
- [✅] Incremental value delivery strategy defined

**Rationale**: User stories are independent. Can deploy basic hamburger menu without animations, or fix layout before adding overlay functionality.

### Other Constitution Principles
- [N/A] Dual standards support planned (if applicable: IEC/SI and NEC/North American units)
- [✅] Security requirements addressed (no user data collection, client-side state only)
- [✅] Code quality standards acknowledged (smallest viable diff, use existing Tailwind patterns)
- [✅] Complexity justifications documented (no new abstractions - using CSS transitions and React state)

**Rationale**: No backend changes, no data persistence. Using existing React/Tailwind patterns. Minimal complexity added.

**GATE STATUS**: ✅ **PASSED** - This is a UI/layout enhancement with no constitution violations. No calculation accuracy, safety validation, or standards compliance requirements apply. Testing and progressive enhancement principles are appropriately followed.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
components/layout/
├── Sidebar.tsx           # MODIFIED: Add responsive behavior, overlay mode, mobile hidden
├── Header.tsx            # MODIFIED: Add hamburger menu button on mobile
├── MobileMenu.tsx        # NEW: Client component managing sidebar open/closed state
└── MobileMenuButton.tsx  # NEW: Hamburger menu button component

app/
└── layout.tsx            # MODIFIED: Conditional sidebar rendering, mobile-friendly spacing

hooks/
└── useMobileMenu.ts      # NEW: Custom hook for sidebar state management

lib/
└── utils/
    └── breakpoints.ts    # NEW: Breakpoint detection utilities (optional)

__tests__/
└── e2e/
    └── navigation/
        └── mobile-menu.spec.ts  # NEW: Playwright tests for mobile menu navigation

specs/003-mobile-sidebar-menu/
├── spec.md                      # Feature specification
├── plan.md                      # This file
├── research.md                  # Research findings
├── data-model.md                # State management and component interfaces
├── quickstart.md                # Implementation guide
└── checklists/
    └── requirements.md          # Specification validation checklist
```

**Structure Decision**: Next.js App Router web application with client-side state management. This is a layout enhancement affecting existing components rather than new feature pages. Changes are isolated to the layout layer (`components/layout/` and `app/layout.tsx`) with no impact on calculator pages or calculation logic.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - Constitution check passed. No complexity justifications required.

This is a straightforward UI/layout enhancement:
- Using existing React state patterns (custom hook + context or simple useState)
- CSS-only animations via Tailwind transitions
- No new abstractions or libraries
- Modifies 3 existing files, adds 2-3 new components
- Standard responsive navigation pattern (hamburger menu + overlay)
- Total implementation: ~200-300 lines of new code

## Phase 0: Research (Technical Unknowns)

*This section will be filled by the `/sp.plan` command after running research agents.*

### Current State Analysis

**Existing Components**:
- `components/layout/Sidebar.tsx`: Fixed sidebar with `w-64` width, `fixed left-0 top-0 h-screen`
- `app/layout.tsx`: Main layout with `pl-64` padding to accommodate fixed sidebar
- `components/layout/Header.tsx`: Header with standards toggle, no hamburger menu

**Current Issues Identified**:
- Sidebar always visible (`fixed` positioning) on all screen sizes
- Main content has fixed `pl-64` (256px) left padding regardless of viewport width
- On mobile (<768px), this leaves ~112px-172px for calculator content (320px-428px viewport minus 256px sidebar)
- Text overflow and horizontal scrolling on narrow screens

### Research Areas

1. **Mobile Navigation Pattern Selection**
   - **Question**: Best practice for sidebar-to-menu conversion in Next.js/React?
   - **Research**: Compare overlay/drawer vs slide-over vs push-content patterns
   - **Decision**: Overlay pattern (sidebar slides over content with backdrop)
   - **Rationale**:
     - Preserves full viewport width for calculator content
     - Familiar mobile pattern (matches iOS/Android conventions)
     - No layout shift when opening/closing menu
     - Easier to implement with CSS transforms

2. **State Management Approach**
   - **Question**: Where to store sidebar open/closed state for mobile menu?
   - **Options**:
     - A. React Context at layout level
     - B. Zustand store (already in project)
     - C. Simple useState in layout component
   - **Decision**: Simple useState with custom hook
   - **Rationale**:
     - State only needed in layout layer (Sidebar + Header + Layout)
     - No need for global state (not accessed by calculator pages)
     - Simpler than Context or Zustand for this isolated use case
     - Custom hook (`useMobileMenu`) can encapsulate open/close logic

3. **Responsive Breakpoint Implementation**
   - **Question**: How to detect and respond to breakpoint changes (768px)?
   - **Options**:
     - A. CSS-only (hide/show via Tailwind responsive classes)
     - B. JavaScript matchMedia API with useEffect
     - C. Hybrid: CSS for styling + JS for state management
   - **Decision**: Hybrid approach (CSS + matchMedia)
   - **Rationale**:
     - CSS handles visual display (hide sidebar on mobile, show hamburger)
     - JavaScript handles state cleanup (close menu if window resized to desktop)
     - Tailwind breakpoints: `md:` prefix for ≥768px

4. **Animation Strategy**
   - **Question**: Best way to animate sidebar slide-in/out on mobile?
   - **Options**:
     - A. CSS transitions with transform: translateX()
     - B. Framer Motion library
     - C. React Spring library
   - **Decision**: CSS transitions only
   - **Rationale**:
     - Simpler, no additional dependencies
     - Tailwind has built-in transition utilities
     - Transform animations are GPU-accelerated (60fps)
     - Meets 250-300ms duration requirement easily

5. **Focus Management and Accessibility**
   - **Question**: How to implement focus trapping in open sidebar overlay?
   - **Research**: WCAG requirements for modal/drawer components
   - **Decision**: Use focus trap pattern with Tab/Escape handling
   - **Implementation**:
     - Trap focus within sidebar when open (Tab cycles through nav links)
     - Escape key closes sidebar
     - Return focus to hamburger button on close
     - ARIA labels: `aria-label="Main navigation menu"`, `aria-expanded` state

6. **Layout Adjustment Strategy**
   - **Question**: How to remove `pl-64` padding on mobile without breaking desktop?
   - **Decision**: Conditional Tailwind classes
   - **Implementation**: `className="flex flex-1 flex-col md:pl-64"` (padding only on ≥768px)

### Research Summary

All technical unknowns resolved. Key decisions:
- **Pattern**: Overlay/drawer with backdrop
- **State**: Custom hook with useState (no Context/Zustand needed)
- **Breakpoint**: CSS (Tailwind `md:` prefix) + JavaScript cleanup
- **Animation**: CSS transitions with transform
- **Focus**: Manual focus trap implementation
- **Layout**: Conditional padding via Tailwind responsive classes

**No blockers identified.** Standard React/Tailwind implementation with no novel patterns or risky dependencies.

## Phase 1: Data Model & Contracts

### Data Model: Mobile Menu State

```typescript
// Mobile menu state management
interface MobileMenuState {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
  close: () => void
}

// Custom hook
function useMobileMenu(): MobileMenuState {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, close])

  // Close when resizing to desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        close()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, close])

  return { isOpen, setIsOpen, toggle, close }
}
```

### Component Interfaces

```typescript
// MobileMenuButton Props
interface MobileMenuButtonProps {
  onClick: () => void
  isOpen: boolean
  'aria-label'?: string
}

// Sidebar Props (Enhanced)
interface SidebarProps {
  isOpen?: boolean          // NEW: controlled open state for mobile
  onClose?: () => void      // NEW: callback when sidebar should close
  isMobile?: boolean        // NEW: flag to determine mobile vs desktop mode
}

// Layout Enhancement
// app/layout.tsx receives mobile menu state from useMobileMenu hook
```

### Responsive Behavior Specifications

**Breakpoint: 768px (Tailwind `md`)**

| Viewport | Sidebar Display | Hamburger Menu | Main Content Padding | Overlay/Backdrop |
|----------|----------------|----------------|---------------------|------------------|
| <768px (Mobile) | Hidden by default | Visible | `pl-0` (no padding) | Shown when menu open |
| ≥768px (Desktop) | Fixed, always visible | Hidden | `pl-64` (256px) | None |

**Mobile Menu States**:

| State | Sidebar Position | Backdrop Visible | Focus Trap | Body Scroll |
|-------|-----------------|------------------|------------|-------------|
| Closed | `translate-x-[-100%]` (off-screen left) | No | No | Enabled |
| Opening | `translate-x-0` (sliding in, 300ms) | Fading in | No | Disabled |
| Open | `translate-x-0` (on-screen) | Yes | Yes | Disabled |
| Closing | `translate-x-[-100%]` (sliding out, 300ms) | Fading out | No | Re-enabled |

**Animation Specifications**:

```css
/* Sidebar slide animation */
.sidebar-mobile {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Backdrop fade animation */
.backdrop {
  transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Contracts

**No API contracts** - This is a pure client-side UI enhancement with no backend communication.

**Component Contracts** (interfaces defined in data-model.md section above):
- `useMobileMenu` hook contract
- `MobileMenuButton` component props
- Enhanced `Sidebar` component props

### Quickstart Implementation Summary

**Step 1**: Create `useMobileMenu` custom hook
- Manages `isOpen` state
- Handles Escape key and window resize listeners
- Exports `toggle` and `close` callbacks

**Step 2**: Create `MobileMenuButton` component
- Hamburger icon (3 horizontal lines)
- Hidden on desktop (`md:hidden`)
- 44x44px minimum touch target
- `onClick` triggers `toggle()` from hook

**Step 3**: Enhance `Sidebar` component
- Accept `isOpen` and `onClose` props
- Mobile mode: `fixed inset-0` with conditional `translate-x-[-100%]`
- Add close button (X icon) in mobile mode
- Add click handler on nav links to call `onClose()`
- Desktop mode: unchanged fixed positioning

**Step 4**: Add Backdrop component
- Semi-transparent overlay (`bg-black/50`)
- Only shown when mobile menu open
- `onClick` triggers `close()`
- Fade in/out animation

**Step 5**: Update `app/layout.tsx`
- Use `useMobileMenu` hook
- Pass state to Sidebar and MobileMenuButton
- Update main content padding: `md:pl-64` instead of fixed `pl-64`
- Render backdrop when mobile menu open

**Step 6**: Update `Header` component
- Add `MobileMenuButton` on left side (visible on mobile only)
- Conditional rendering: `<div className="md:hidden">...</div>`

**Testing Checklist**:
- [ ] Hamburger menu visible on <768px, hidden on ≥768px
- [ ] Sidebar hidden on mobile by default
- [ ] Clicking hamburger opens sidebar overlay
- [ ] Clicking backdrop closes sidebar
- [ ] Clicking nav link navigates and closes sidebar
- [ ] Escape key closes sidebar
- [ ] Window resize to desktop auto-closes sidebar
- [ ] Focus trapped in open sidebar
- [ ] No horizontal scroll on mobile
- [ ] Animations smooth at 60fps
- [ ] Touch targets meet 44x44px minimum

## Phase 2: Tasks

**This phase is handled by `/sp.tasks` command** - Do not create tasks.md during `/sp.plan`.

The `/sp.tasks` command will generate a comprehensive, prioritized task breakdown based on this plan, the specification, and the data model.

Expected task structure:
- Phase 1: Setup (verify dependencies, create directories)
- Phase 2: Core Components (useMobileMenu hook, MobileMenuButton, Backdrop)
- Phase 3: Sidebar Enhancement (add mobile mode props and behavior)
- Phase 4: Layout Integration (update app/layout.tsx and Header)
- Phase 5: Testing & Polish (responsive testing, animations, accessibility)
- Phase 6: Constitution Compliance (verify no regressions, cross-browser testing)

## Notes

- **Zero Dependencies Added**: Using existing Next.js, React, Tailwind CSS, and Lucide React
- **Desktop Unchanged**: All changes are additive mobile enhancements, desktop behavior untouched
- **Calculator Logic Unaffected**: This is pure layout/navigation, no calculation modifications
- **Accessibility**: WCAG 2.1 Level AA compliance with keyboard navigation and screen reader support
- **Performance**: CSS-based animations ensure 60fps on mobile devices
- **Smallest Viable Diff**: Modifying 3 existing files, adding 2-3 new components (~200-300 LOC total)
