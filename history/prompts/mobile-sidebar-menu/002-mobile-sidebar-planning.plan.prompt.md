---
id: 002
title: Mobile sidebar menu implementation planning
stage: plan
date: 2025-12-25
surface: agent
model: claude-sonnet-4-5
feature: 003-mobile-sidebar-menu
branch: 003-mobile-sidebar-menu
user: agent
command: /sp.plan
labels: ["planning", "architecture", "mobile-navigation", "hamburger-menu", "responsive-layout"]
links:
  spec: specs/003-mobile-sidebar-menu/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-mobile-sidebar-menu/plan.md (NEW)
  - specs/003-mobile-sidebar-menu/research.md (NEW)
  - specs/003-mobile-sidebar-menu/data-model.md (NEW)
  - specs/003-mobile-sidebar-menu/quickstart.md (NEW)
tests:
  - Manual responsive testing defined (mobile/tablet/desktop breakpoints)
  - E2E navigation tests planned (Playwright)
  - Accessibility testing checklist created
---

## Prompt

User invoked: `/sp.plan`

Create implementation plan for Mobile Sidebar Conversion to Menu feature (003-mobile-sidebar-menu) based on specification.

**Context**: User reported that Feature 002 (mobile-responsive calculator inputs) wasn't sufficient because the fixed sidebar still consumes screen space on mobile, causing "text disappear in mobile video" and overall poor mobile experience.

**Root Cause Identified**:
- Current layout: Fixed 256px sidebar always visible
- Main content: Fixed `pl-64` (256px) padding on all screen sizes
- Mobile viewport (375px): 375px - 256px sidebar = only 119px for calculator content
- Result: Text truncation, horizontal scrolling, unusable on mobile

## Response snapshot

**Successfully Created Implementation Plan with Complete Design Artifacts**

### Current State Analysis

**Existing Components**:
- `app/layout.tsx`: Root layout with fixed `pl-64` padding (BROKEN ON MOBILE)
- `components/layout/Sidebar.tsx`: Fixed sidebar, 256px width, always visible
- `components/layout/Header.tsx`: Header with standards toggle, no hamburger menu

**Problem**:
- Sidebar takes 256px on 320px-428px mobile screens
- Leaves only 64px-172px for calculator content
- Causes text overflow and horizontal scrolling

### Architecture Decisions

**Phase 0: Research** ✅ Complete

**6 Key Technical Decisions Made**:

1. **Navigation Pattern**: Overlay/drawer with backdrop
   - Sidebar slides over content (no push)
   - Semi-transparent backdrop behind
   - Maximizes content width on mobile
   - Familiar mobile UX pattern

2. **State Management**: Custom hook with useState
   - `useMobileMenu()` hook returns `{ isOpen, toggle, close }`
   - No global state (Context/Zustand) needed
   - Scoped to layout layer only
   - Handles Escape key and window resize automatically

3. **Responsive Strategy**: Hybrid (CSS + JavaScript)
   - CSS (Tailwind `md:` classes) for visibility
   - JavaScript for edge case handling (resize, Escape key)
   - Progressive enhancement

4. **Animation Approach**: CSS transitions only
   - Transform animations (GPU-accelerated, 60fps)
   - 300ms duration with ease-in-out easing
   - No animation libraries needed (Framer Motion rejected)

5. **Focus Management**: Manual focus trap
   - Tab key cycles through sidebar links only
   - Escape key closes sidebar
   - ARIA labels for screen readers
   - Returns focus to hamburger button on close

6. **Layout Fix**: Conditional responsive padding
   - Change `pl-64` → `md:pl-64` in app/layout.tsx
   - Mobile gets full width (375px - 32px padding = 343px content)
   - Desktop unchanged (1920px - 256px sidebar - 48px padding = 1616px)

### Phase 1: Data Model & Contracts ✅ Complete

**Interfaces Defined**:

1. **MobileMenuState**:
   ```typescript
   interface MobileMenuState {
     isOpen: boolean
     setIsOpen: (open: boolean) => void
     toggle: () => void
     close: () => void
   }
   ```

2. **Enhanced SidebarProps**:
   ```typescript
   interface SidebarProps {
     isOpen?: boolean      // Controls mobile overlay visibility
     onClose?: () => void  // Callback for closing sidebar
   }
   ```

3. **MobileMenuButtonProps**:
   ```typescript
   interface MobileMenuButtonProps {
     onClick: () => void
     isOpen: boolean
     'aria-label'?: string
   }
   ```

**Responsive Behavior Matrix**:

| Viewport | Sidebar Display | Hamburger | Main Padding | Overlay |
|----------|----------------|-----------|--------------|---------|
| <768px | Hidden (overlay on tap) | Visible | `pl-0` | Yes (when open) |
| ≥768px | Fixed, always visible | Hidden | `pl-64` | No |

**Animation Specs**:
- Sidebar slide: `transform 300ms cubic-bezier(0.4, 0, 0.2, 1)`
- Backdrop fade: `opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)`
- Both GPU-accelerated for 60fps

### Phase 1: Quickstart Guide ✅ Complete

**6-Step Implementation Plan**:

1. **Create `useMobileMenu` hook**: State management with Escape/resize listeners
2. **Create `MobileMenuButton`**: Hamburger icon component (48x48px touch target)
3. **Enhance `Sidebar`**: Add mobile overlay mode with slide animation
4. **Add Backdrop**: Semi-transparent overlay with click-to-close
5. **Update `app/layout.tsx`**: Use hook, pass state, fix padding
6. **Update `Header`**: Add hamburger button on mobile

**Code Examples Provided**:
- Complete useMobileMenu hook implementation (~50 lines)
- Complete MobileMenuButton component (~20 lines)
- Enhanced Sidebar component with before/after comparison
- Updated layout.tsx with responsive padding fix
- Enhanced Header with hamburger menu integration

### Files to Modify/Create

**New Files** (3):
- `hooks/useMobileMenu.ts` - Custom hook for sidebar state
- `components/layout/MobileMenuButton.tsx` - Hamburger menu button
- `__tests__/e2e/navigation/mobile-menu.spec.ts` - Playwright E2E tests

**Modified Files** (3):
- `components/layout/Sidebar.tsx` - Add mobile overlay mode
- `app/layout.tsx` - Fix padding, integrate hook
- `components/layout/Header.tsx` - Add hamburger button

**Total LOC Estimate**: ~200-300 new lines of code

### Testing Strategy

**Manual Testing**:
- Mobile breakpoints: 320px, 375px, 414px, 428px
- Tablet breakpoints: 768px (boundary), 1024px
- Desktop: 1280px, 1920px
- Orientation changes (portrait/landscape)

**E2E Testing** (Playwright):
- Open/close sidebar via hamburger button
- Close via backdrop click
- Navigation and auto-close
- Keyboard navigation (Tab, Escape)

**Accessibility Testing**:
- Keyboard navigation flow
- Focus trap verification
- Screen reader announcements
- ARIA attribute validation

### Constitution Compliance

**Gate Status**: ✅ PASSED

- [N/A] Calculation Accuracy (no calculations)
- [N/A] Safety Validation (no safety-critical features)
- [N/A] Standards Compliance (no engineering standards)
- [✅] Test-First Development (E2E tests for navigation flows)
- [✅] Progressive Enhancement (P1 → P2 priorities, independent stories)
- [✅] Code Quality (smallest viable diff, existing patterns)

**No violations** - UI/navigation enhancement only.

## Outcome

- ✅ Impact: Complete technical architecture designed for mobile sidebar menu, all unknowns resolved, ready for task generation
- 🧪 Tests: Manual responsive testing defined, E2E navigation tests planned, accessibility checklist created
- 📁 Files: 4 planning artifacts created (plan.md, research.md, data-model.md, quickstart.md)
- 🔁 Next prompts: Ready for `/sp.tasks` to generate implementation task breakdown
- 🧠 Reflection: Root cause correctly identified - fixed sidebar padding was the culprit. Simple one-character fix (`pl-64` → `md:pl-64`) plus overlay pattern solves the mobile space issue. All research decisions favor simplicity (custom hook vs Context, CSS vs animation libraries, manual focus trap vs library).

## Evaluation notes (flywheel)

- Failure modes observed: None - all technical unknowns resolved through research, existing codebase analysis revealed exact problem (fixed padding)
- Graders run and results (PASS/FAIL): Constitution check PASS (N/A for most principles, appropriate for UI feature), Architecture review PASS (standard overlay pattern, no novel abstractions), Complexity check PASS (200-300 LOC, 3 new files, minimal changes)
- Prompt variant (if applicable): Standard /sp.plan workflow with Phase 0 research and Phase 1 design
- Next experiment (smallest change to try): Consider adding optional sidebar width customization (narrow/wide mode) for user preference, or adding swipe gestures for power users (currently out of scope)
