---
id: 003
title: Generate tasks for mobile sidebar menu
stage: tasks
date: 2025-12-25
surface: agent
model: claude-sonnet-4-5
feature: 003-mobile-sidebar-menu
branch: 003-mobile-sidebar-menu
user: agent
command: /sp.tasks
labels: ["task-generation", "mobile-navigation", "hamburger-menu", "responsive-layout", "sidebar-overlay"]
links:
  spec: specs/003-mobile-sidebar-menu/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-mobile-sidebar-menu/tasks.md
tests:
  - E2E navigation tests planned (T076-T082)
  - Manual responsive testing defined (T026-T030, T037-T042, T061-T075)
  - Accessibility testing checklist (T051-T060)
---

## Prompt

User invoked: /sp.tasks

Generate comprehensive tasks for the Mobile Sidebar Conversion to Menu feature (003-mobile-sidebar-menu) based on:
- Specification with 3 user stories (US1: Hamburger Menu Navigation P1, US2: Full-Width Calculator Content P1, US3: Smooth Menu Animations P2)
- Implementation plan with overlay/drawer pattern and custom hook state management
- Data model with mobile menu state interfaces and responsive behavior specs
- Research findings on navigation patterns, animation strategies, and accessibility requirements
- Quickstart guide with complete code examples

## Response snapshot

Successfully generated tasks.md with 94 comprehensive tasks organized by user story:

**Structure**:
- Phase 1: Setup (3 tasks) - Verify Next.js/React/Tailwind/Playwright structure
- Phase 2: Foundational (4 tasks) - Create useMobileMenu hook with event listeners
- Phase 3: User Story 1 - Hamburger Menu Navigation P1 (23 tasks) - Mobile menu implementation
- Phase 4: User Story 2 - Full-Width Calculator Content P1 (12 tasks) - Layout padding fixes
- Phase 5: User Story 3 - Smooth Menu Animations P2 (8 tasks) - Animation polish
- Phase 6: Accessibility & Keyboard Navigation (10 tasks) - WCAG compliance
- Phase 7: Polish & Cross-Cutting Concerns (15 tasks) - Testing and validation
- Phase 8: E2E Test Automation (7 tasks) - Playwright test suite
- Phase 9: Constitution Compliance Verification (12 tasks) - Quality assurance

**Key Decisions**:
1. **User Story Organization**: Tasks grouped by user story to enable independent implementation and testing
2. **Critical Task Identified**: T031 (layout padding fix `pl-64` → `md:pl-64`) is the single most important change - solves the "text disappear" issue
3. **Parallel Opportunities**: 24 tasks marked [P] for parallel execution (different files, no dependencies)
4. **MVP Scope**: Phase 1 + 2 + 3 + 4 (User Stories 1 & 2, both P1 priorities) = 42 tasks
5. **Independent Stories**: US1 and US2 can be developed in parallel, though US2 delivers value even without US1
6. **Accessibility Focus**: Dedicated Phase 6 for keyboard navigation and screen reader support

**Task Format**: Strict checklist format maintained throughout:
- `- [ ] T### [P?] [Story] Description with file path`
- All 94 tasks follow required format with IDs, story labels where applicable, and file paths
- Clear dependencies and execution order documented

**Testing Strategy**:
- Manual responsive testing across breakpoints (320px to 2560px)
- E2E automation with Playwright for navigation flows
- Accessibility testing with keyboard and screen readers
- Cross-browser compatibility testing

**Files to Create** (3 new):
- `hooks/useMobileMenu.ts` - Custom hook for sidebar state management
- `components/layout/MobileMenuButton.tsx` - Hamburger menu button component
- `__tests__/e2e/navigation/mobile-menu.spec.ts` - E2E test suite

**Files to Modify** (3 existing):
- `components/layout/Sidebar.tsx` - Add mobile overlay mode with animations
- `app/layout.tsx` - **CRITICAL**: Fix padding (`pl-64` → `md:pl-64`), integrate hook
- `components/layout/Header.tsx` - Add hamburger menu button

**Root Cause Solution**:
The task breakdown clearly identifies T031 as the critical fix:
- Current: Fixed `pl-64` (256px padding) on all screen sizes
- Problem: Mobile (375px) - 256px = only 119px for content → text truncates
- Fix: `md:pl-64` (padding only on ≥768px)
- Result: Mobile (375px) - 32px padding = 343px for content → text fits!

## Outcome

- ✅ Impact: Comprehensive 94-task breakdown enabling independent user story implementation with clear MVP path (US1+US2), critical layout fix identified (T031)
- 🧪 Tests: E2E test suite planned (7 tasks), manual responsive testing across 6+ breakpoints, accessibility validation checklist (10 tasks), constitution compliance verification
- 📁 Files: tasks.md created at specs/003-mobile-sidebar-menu/, 6 component files identified (3 new + 3 modified)
- 🔁 Next prompts: Ready for implementation via /sp.implement, or manual task execution starting with Phase 1 setup
- 🧠 Reflection: Successfully mapped 3 user stories to independent, testable phases. The real insight: US2 (layout fix) is arguably more critical than US1 (hamburger menu) - the one-character change `pl-64` → `md:pl-64` immediately fixes the text truncation problem even without implementing the menu overlay.

## Evaluation notes (flywheel)

- Failure modes observed: None - all design documents were complete and well-structured
- Graders run and results (PASS/FAIL): Format validation PASS (all 94 tasks follow required checklist format), Organization validation PASS (tasks grouped by user story), Dependencies PASS (clear phase and task dependencies documented), Critical path identification PASS (T031 flagged as most important)
- Prompt variant (if applicable): Standard /sp.tasks workflow
- Next experiment (smallest change to try): Consider implementing just T031 (layout padding fix) as emergency hotfix before full hamburger menu implementation - would immediately solve user's "text disappear" problem with minimal risk
