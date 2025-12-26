# Tasks: Mobile Sidebar Conversion to Menu

**Feature**: 003-mobile-sidebar-menu
**Input**: Design documents from `D:\prompteng\elec_calc\specs\003-mobile-sidebar-menu\`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: E2E tests included for navigation flows, manual responsive testing required

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing project structure and dependencies

- [x] T001 Verify Next.js 16.1.1, React, Tailwind CSS 3.4, and Lucide React are installed
- [x] T002 Verify Playwright E2E testing framework is configured in playwright.config.ts
- [x] T003 [P] Verify existing Sidebar, Header, and Layout components in components/layout/ directory

**Checkpoint**: Project structure verified - ready for foundational phase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core mobile menu state management that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create useMobileMenu custom hook in hooks/useMobileMenu.ts
- [x] T005 Add Escape key listener to close sidebar in hooks/useMobileMenu.ts
- [x] T006 Add window resize listener to auto-close on desktop breakpoint in hooks/useMobileMenu.ts
- [x] T007 Add body scroll locking when sidebar open in hooks/useMobileMenu.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Hamburger Menu Navigation on Mobile (Priority: P1) ✅ COMPLETE

**Goal**: Convert sidebar to collapsible hamburger menu on mobile so calculator has maximum screen space and text doesn't get cut off

**Independent Test**: Open calculator on mobile (375px width), verify hamburger menu visible, sidebar hidden by default, tap menu to open sidebar overlay, tap backdrop to close, verify all calculator text visible without truncation

### Implementation for User Story 1

- [x] T008 [P] [US1] Create MobileMenuButton component in components/layout/MobileMenuButton.tsx
- [x] T009 [P] [US1] Add hamburger icon (Menu from lucide-react) with 48x48px touch target in components/layout/MobileMenuButton.tsx
- [x] T010 [P] [US1] Add ARIA labels and aria-expanded attribute to MobileMenuButton in components/layout/MobileMenuButton.tsx
- [x] T011 [US1] Hide MobileMenuButton on desktop using md:hidden class in components/layout/MobileMenuButton.tsx
- [x] T012 [US1] Update Header component to accept mobileMenuOpen and onMobileMenuToggle props in components/layout/Header.tsx
- [x] T013 [US1] Add MobileMenuButton to Header component (left side, mobile only) in components/layout/Header.tsx
- [x] T014 [US1] Update Sidebar component to accept isOpen and onClose props in components/layout/Sidebar.tsx
- [x] T015 [US1] Add responsive classes to hide sidebar on mobile by default in components/layout/Sidebar.tsx
- [x] T016 [US1] Add transform classes for slide-in animation (translate-x-full when closed) in components/layout/Sidebar.tsx
- [x] T017 [US1] Add transition classes (duration-300 ease-in-out) to sidebar in components/layout/Sidebar.tsx
- [x] T018 [US1] Add close button (X icon) visible only on mobile in sidebar header in components/layout/Sidebar.tsx
- [x] T019 [US1] Add onClick={onClose} handler to all navigation links in components/layout/Sidebar.tsx
- [x] T020 [US1] Add semi-transparent backdrop element (bg-black/50) in components/layout/Sidebar.tsx
- [x] T021 [US1] Add onClick handler to backdrop to close sidebar in components/layout/Sidebar.tsx
- [x] T022 [US1] Update app/layout.tsx to import and use useMobileMenu hook
- [x] T023 [US1] Pass isOpen and onClose to Sidebar component in app/layout.tsx
- [x] T024 [US1] Pass mobileMenuOpen and onMobileMenuToggle to Header component in app/layout.tsx
- [x] T025 [US1] Convert app/layout.tsx to client component (add 'use client' directive)
- [x] T026 [US1] Test hamburger menu appears on mobile (<768px) and hides on desktop (≥768px)
- [x] T027 [US1] Test sidebar opens when hamburger clicked and slides in from left
- [x] T028 [US1] Test sidebar closes when backdrop clicked
- [x] T029 [US1] Test sidebar closes when nav link clicked
- [x] T030 [US1] Test sidebar closes when close button (X) clicked

**Checkpoint**: User Story 1 fully functional ✅ - mobile users can access navigation via hamburger menu

---

## Phase 4: User Story 2 - Full-Width Calculator Content on Mobile (Priority: P1) ✅ COMPLETE

**Goal**: Calculator uses full available viewport width when sidebar hidden on mobile, fixing text truncation and overflow issues

**Independent Test**: Open calculator on mobile with sidebar closed, verify all input labels fully visible, all result text displayed completely, no horizontal scrolling required

### Implementation for User Story 2

- [x] T031 [US2] Change main content padding from pl-64 to md:pl-64 in app/layout.tsx
- [x] T032 [US2] Update main content padding from p-6 to p-4 md:p-6 for tighter mobile spacing in app/layout.tsx
- [x] T033 [US2] Update Header padding from px-6 to px-4 md:px-6 in components/layout/Header.tsx
- [x] T034 [US2] Add responsive text sizing to header title (text-base md:text-lg) in components/layout/Header.tsx
- [x] T035 [US2] Hide standards label on very small screens (hidden sm:flex) in components/layout/Header.tsx
- [x] T036 [US2] Hide Anonymous Mode badge on very small screens in components/layout/Header.tsx
- [x] T037 [US2] Test calculator content uses full viewport width on mobile (375px - 32px padding = 343px)
- [x] T038 [US2] Test all input field labels are fully visible without truncation on 320px width
- [x] T039 [US2] Test all result values and dual time format display completely on mobile
- [x] T040 [US2] Verify no horizontal scrolling on any mobile breakpoint (320px, 375px, 414px, 428px)
- [x] T041 [US2] Test layout adapts correctly when rotating device (portrait to landscape)
- [x] T042 [US2] Verify calculator works correctly at 768px breakpoint boundary

**Checkpoint**: User Story 2 fully functional ✅ - calculator uses full width on mobile with no text overflow

---

## Phase 5: User Story 3 - Smooth Menu Animations and Transitions (Priority: P2)

**Goal**: Add smooth, professional animations when opening/closing sidebar menu for polished app-like feel

**Independent Test**: Open/close sidebar menu repeatedly on mobile, verify smooth 60fps animations completing in <300ms with no visual glitches

### Implementation for User Story 3

- [x] T043 [P] [US3] Verify sidebar transform animation uses GPU acceleration (transform not margin/width) in components/layout/Sidebar.tsx
- [x] T044 [P] [US3] Add transition-transform duration-300 ease-in-out classes to sidebar in components/layout/Sidebar.tsx
- [x] T045 [P] [US3] Add transition-opacity duration-250 to backdrop fade animation in components/layout/Sidebar.tsx
- [x] T046 [US3] Test sidebar slide-in animation completes in 300ms or less
- [x] T047 [US3] Test backdrop fade-in animation completes smoothly
- [x] T048 [US3] Test rapid clicking hamburger menu doesn't cause animation glitches
- [x] T049 [US3] Verify animations maintain 60fps using Chrome DevTools Performance panel
- [x] T050 [US3] Test animation reversal when clicking hamburger during slide animation

**Checkpoint**: All user stories should now be independently functional with smooth animations

---

## Phase 6: Accessibility & Keyboard Navigation

**Purpose**: Ensure WCAG 2.1 Level AA compliance and keyboard accessibility

- [x] T051 [P] [US1] Add keyboard event listener for Enter/Space to toggle hamburger button in components/layout/MobileMenuButton.tsx
- [x] T052 [P] [US1] Implement focus trap in open sidebar (Tab cycles through nav links only) in components/layout/Sidebar.tsx
- [x] T053 [P] [US1] Add logic to return focus to hamburger button when sidebar closes in hooks/useMobileMenu.ts
- [x] T054 [US1] Add aria-controls="mobile-sidebar" to hamburger button in components/layout/MobileMenuButton.tsx
- [x] T055 [US1] Add id="mobile-sidebar" and role="navigation" to sidebar in components/layout/Sidebar.tsx
- [x] T056 [US1] Add aria-label="Main navigation" to sidebar in components/layout/Sidebar.tsx
- [x] T057 [US1] Test Tab key cycles through sidebar nav links when open (focus trapped)
- [x] T058 [US1] Test Escape key closes sidebar from any focused element
- [x] T059 [US1] Test focus returns to hamburger button after sidebar closes
- [x] T060 [US1] Test hamburger button is keyboard accessible (Tab to reach, Enter to activate)

**Checkpoint**: Accessibility requirements met - keyboard navigation and screen reader support functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final testing, edge case handling, and cross-browser validation

- [x] T061 [P] Test window resize from mobile to desktop auto-closes sidebar
- [x] T062 [P] Test window resize from desktop to mobile doesn't break layout
- [x] T063 [P] Test sidebar behavior at exactly 768px boundary (should be desktop mode)
- [x] T064 [P] Test body scroll is disabled when sidebar open on mobile
- [x] T065 [P] Test body scroll re-enabled when sidebar closes
- [x] T066 [P] Verify z-index hierarchy (backdrop z-40, sidebar z-50, modals z-60+)
- [x] T067 Test sidebar on real iPhone device (Safari) with various tap interactions
- [x] T068 Test sidebar on real Android device (Chrome) with various tap interactions
- [x] T069 Test sidebar on iPad with both portrait and landscape orientations
- [x] T070 Cross-browser testing: Chrome 100+, Safari 15+, Firefox 100+, Edge 100+ on mobile and desktop
- [x] T071 Verify touch targets meet 44x44px minimum for hamburger and close buttons
- [x] T072 Test with screen reader (NVDA/VoiceOver) and verify announcements
- [x] T073 Verify sidebar overlay respects safe area insets on iPhone X+ (notch compatibility)
- [x] T074 Test edge case: rapid tapping hamburger menu (debounce prevention)
- [x] T075 Verify existing calculator functionality unaffected (battery, inputs, results still work)

---

## Phase 8: E2E Test Automation (Optional but Recommended)

**Purpose**: Automated E2E tests for navigation flows

- [x] T076 [P] Create E2E test file in __tests__/e2e/navigation/mobile-menu.spec.ts
- [x] T077 [P] Write test: Mobile menu opens and closes via hamburger button
- [x] T078 [P] Write test: Sidebar closes when backdrop clicked
- [x] T079 [P] Write test: Sidebar closes when nav link clicked
- [x] T080 [P] Write test: Sidebar auto-closes on window resize to desktop
- [x] T081 [P] Write test: Hamburger menu hidden on desktop viewport
- [x] T082 Run all E2E tests and verify they pass

**Checkpoint**: Automated tests provide regression protection for navigation flows

---

## Phase 9: Constitution Compliance Verification

**Purpose**: Validate implementation against constitutional principles

### Test-First Development Verification
- [x] T083 Review E2E test coverage for navigation flows (hamburger open/close, backdrop, nav links)
- [x] T084 Verify manual responsive testing completed across all breakpoints
- [x] T085 Document any test coverage gaps with justification

### Progressive Enhancement Verification
- [x] T086 Confirm User Story 1 (Hamburger Menu) works independently
- [x] T087 Confirm User Story 2 (Full-Width Content) works independently
- [x] T088 Confirm User Story 3 (Smooth Animations) works as enhancement layer
- [x] T089 Verify P1 user stories (US1, US2) complete before P2 work (US3)

### Code Quality Verification
- [x] T090 [P] Verify no hardcoded magic numbers (all using Tailwind classes)
- [x] T091 [P] Confirm smallest viable diff (no unrelated refactoring)
- [x] T092 [P] Verify desktop behavior unchanged (fixed sidebar still works)
- [x] T093 Verify no calculator logic modifications (pure layout change)
- [x] T094 Confirm zero new dependencies added (using existing libraries only)

**Checkpoint**: Constitution compliance verified - ready for code review and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (Hamburger Menu) - P1: Can start after Phase 2
  - User Story 2 (Full-Width Content) - P1: Can start after Phase 2 (INDEPENDENT of US1)
  - User Story 3 (Smooth Animations) - P2: Can start after Phase 2 (INDEPENDENT of US1/US2)
- **Accessibility (Phase 6)**: Depends on User Story 1 completion (hamburger menu must exist)
- **Polish (Phase 7)**: Depends on all P1 user stories completion
- **E2E Tests (Phase 8)**: Depends on all implementation complete
- **Verification (Phase 9)**: Depends on all implementation and testing complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational (Phase 2) - creates hamburger menu and sidebar overlay
- **User Story 2 (P1)**: Depends only on Foundational (Phase 2) - fixes layout padding (INDEPENDENT of US1)
- **User Story 3 (P2)**: Depends only on Foundational (Phase 2) - adds animation polish (INDEPENDENT of US1/US2)

**IMPORTANT**: User Stories 1 and 2 are both P1 and can be implemented in parallel after Phase 2 completes. However, US2 (layout fix) delivers immediate value even without US1 (hamburger menu).

### Within Each User Story

**User Story 1 (Hamburger Menu)**:
- Component creation (T008-T011) can run in parallel [P]
- Integration tasks (T012-T025) must run sequentially (same files)
- Testing tasks (T026-T030) run after implementation

**User Story 2 (Full-Width Content)**:
- All implementation tasks (T031-T036) are simple edits, some can run in parallel [P]
- Testing tasks (T037-T042) run after implementation

**User Story 3 (Smooth Animations)**:
- All implementation tasks (T043-T045) can run in parallel [P] (different aspects)
- Testing tasks (T046-T050) run after implementation

### Parallel Opportunities

**Foundational Phase**: T004 is the core dependency, T005-T007 are additions to same file (sequential)

**User Story 1**: T008-T011 can run in parallel (creating new component)

**User Story 2**: T031-T036 affect different files or different sections, some parallelizable

**User Story 3**: T043-T045 can run in parallel (different animation aspects)

**Accessibility**: T051-T053, T054-T056 can run in parallel within their groups

**Polish**: Most tasks (T061-T066, T071-T074) can run in parallel (independent testing)

**E2E Tests**: T076-T081 can run in parallel (different test files)

---

## Parallel Example: User Story 1

```bash
# Launch component creation tasks together:
Task: "Create MobileMenuButton component"
Task: "Add hamburger icon with touch target"
Task: "Add ARIA labels"

# Then sequentially integrate:
Task: "Update Header to accept mobile menu props"
Task: "Add MobileMenuButton to Header"
Task: "Update Sidebar to accept props"
Task: "Add responsive classes to Sidebar"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only - Both P1)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 - Hamburger Menu Navigation (T008-T030)
4. **STOP and VALIDATE**: Test hamburger menu on mobile
5. Complete Phase 4: User Story 2 - Full-Width Calculator Content (T031-T042)
6. **STOP and VALIDATE**: Test calculator full-width layout on mobile
7. Deploy/demo MVP with both P1 features

### Incremental Delivery

1. **Foundation** (Phase 1-2) → Hook ready
2. **MVP v1** (Phase 3: US1) → Hamburger menu working → Test → Deploy ✅
3. **MVP v2** (Phase 4: US2) → Full-width layout fixed → Test → Deploy ✅
4. **Enhanced** (Phase 5: US3) → Smooth animations → Test → Deploy ✅
5. **Accessible** (Phase 6) → Keyboard navigation → Test → Deploy ✅
6. Each increment adds value without breaking previous work

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. **Once Phase 2 done, split work**:
   - Developer A: User Story 1 (Hamburger Menu) - T008-T030
   - Developer B: User Story 2 (Full-Width Layout) - T031-T042
   - Developer C: User Story 3 (Smooth Animations) - T043-T050
3. **Integration**: Developer A completes first (US1 enables mobile menu), then accessibility work
4. **Together**: Phase 6-9 (Accessibility, Polish, E2E, Verification)

---

## Summary

**Total Tasks**: 94 tasks
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 4 tasks (BLOCKING)
- Phase 3 (User Story 1 - P1): 23 tasks
- Phase 4 (User Story 2 - P1): 12 tasks
- Phase 5 (User Story 3 - P2): 8 tasks
- Phase 6 (Accessibility): 10 tasks
- Phase 7 (Polish): 15 tasks
- Phase 8 (E2E Tests): 7 tasks
- Phase 9 (Verification): 12 tasks

**Parallel Opportunities**: 24 tasks marked [P] can run in parallel with other tasks

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 + Phase 4 = User Stories 1 & 2 (both P1) = **42 tasks**

**Independent Test Criteria**:
- **US1**: Hamburger menu visible on mobile, sidebar opens/closes via menu, backdrop dismissal works
- **US2**: Calculator uses full width on mobile (343px vs 119px), all text visible, no horizontal scroll
- **US3**: Animations smooth at 60fps, transitions complete in <300ms

**Critical Tasks**:
- **T004**: useMobileMenu hook (enables all mobile menu functionality)
- **T031**: Layout padding fix (pl-64 → md:pl-64) - **SOLVES TEXT TRUNCATION ISSUE**
- **T015-T016**: Sidebar responsive hiding/showing

---

## Notes

- [P] tasks = different files or independent sections, no dependencies within phase
- [Story] label maps task to specific user story for traceability (US1, US2, US3)
- Each user story is independently completable and testable
- Manual responsive testing required (DevTools + real devices)
- E2E tests optional but recommended for regression protection
- Minimum viable product: User Story 1 + User Story 2 (both P1 features)
- User Story 3 can be deferred if time-constrained (P2 priority)
- **Most Important Task**: T031 (layout padding fix) - this single change solves the "text disappear" issue
