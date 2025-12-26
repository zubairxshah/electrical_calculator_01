# Tasks: Mobile-Friendly Battery Calculator UI

**Feature**: 002-mobile-battery-ui
**Input**: Design documents from `D:\prompteng\elec_calc\specs\002-mobile-battery-ui\`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included per spec requirements (Vitest for utility functions, manual responsive testing)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and verify existing structure

- [x] T001 Verify Next.js project structure and dependencies (Next.js 15.1.1, React 18, Tailwind CSS 3.4)
- [x] T002 Verify Vitest 4.0.16 configuration for unit tests in vitest.config.ts
- [x] T003 [P] Verify Zustand store exists for battery calculator state management

**Checkpoint**: Project structure verified - ready for foundational phase

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and types that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create time formatting utility function in lib/utils/formatTime.ts
- [x] T005 [P] Create unit tests for time formatting in __tests__/unit/utils/formatTime.test.ts (TDD - write failing tests first)
- [x] T006 Run unit tests and verify time formatting utility passes all test cases (9 test cases from data-model.md)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Enhanced Time Display (Priority: P1) 🎯 MVP

**Goal**: Display backup time in both decimal hours (e.g., "3.456 hours") and human-readable format (e.g., "3 hours 27 minutes")

**Independent Test**: Open battery calculator on any device, input battery parameters (e.g., 12V, 100Ah, 50W load), verify results show "3 hours 27 minutes" format in addition to "3.456 hours"

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Write test case for < 1 minute display in __tests__/unit/utils/formatTime.test.ts
- [x] T008 [P] [US1] Write test case for 0.75 hours → "45 minutes" in __tests__/unit/utils/formatTime.test.ts
- [x] T009 [P] [US1] Write test case for 3.456 hours → "3 hours 27 minutes" in __tests__/unit/utils/formatTime.test.ts
- [x] T010 [P] [US1] Write test case for > 100 hours display in __tests__/unit/utils/formatTime.test.ts
- [x] T011 [P] [US1] Write test case for grammar handling (1 hour vs 2 hours) in __tests__/unit/utils/formatTime.test.ts
- [x] T012 [US1] Run all unit tests and verify they FAIL before implementation

### Implementation for User Story 1

- [x] T013 [US1] Implement formatTimeDisplay function in lib/utils/formatTime.ts per data-model.md specification
- [x] T014 [US1] Add edge case handling for < 1 minute and > 100 hours in lib/utils/formatTime.ts
- [x] T015 [US1] Add grammar handling for singular/plural in lib/utils/formatTime.ts (1 hour vs 2 hours)
- [x] T016 [US1] Run unit tests and verify all tests PASS (achieving Green in TDD cycle)
- [x] T017 [US1] Import formatTimeDisplay utility in components/battery/BatteryResults.tsx
- [x] T018 [US1] Add dual time format display to result output in components/battery/BatteryResults.tsx
- [x] T019 [US1] Test dual time display with various input values (0.5h, 1.5h, 3.456h, 24h, 127h)

**Checkpoint**: At this point, User Story 1 should be fully functional - users see both time formats on all devices

---

## Phase 4: User Story 2 - Mobile-Responsive Layout (Priority: P1)

**Goal**: Make battery calculator fully responsive across all device sizes (320px-2560px) with no horizontal scrolling and touch-friendly controls

**Independent Test**: Open battery calculator on various devices (iPhone SE 375px, iPad 768px, desktop 1920px) and verify all inputs are accessible, readable, and results display properly without horizontal scrolling

### Implementation for User Story 2

- [x] T020 [P] [US2] Add responsive padding classes to calculator container in components/battery/BatteryCalculator.tsx (p-4 md:p-6)
- [x] T021 [P] [US2] Add inputMode="decimal" attribute to all numeric inputs in components/battery/BatteryInputForm.tsx
- [x] T022 [P] [US2] Add mobile-optimized input height (h-12 = 48px) to form inputs in components/battery/BatteryInputForm.tsx
- [x] T023 [US2] Add responsive form grid layout in components/battery/BatteryInputForm.tsx (space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0)
- [x] T024 [US2] Add responsive button layout in components/battery/BatteryCalculator.tsx (flex flex-col sm:flex-row gap-3)
- [x] T025 [US2] Add full-width buttons on mobile (w-full sm:w-auto) in components/battery/BatteryCalculator.tsx
- [x] T026 [US2] Add responsive text sizing to result cards in components/battery/BatteryResults.tsx (text-2xl md:text-3xl lg:text-4xl)
- [x] T027 [US2] Test layout on mobile portrait (375px, 390px, 414px widths) using browser DevTools
- [x] T028 [US2] Test layout on tablet portrait/landscape (768px, 1024px widths) using browser DevTools
- [x] T029 [US2] Test layout on desktop (1280px, 1920px, 2560px widths) using browser DevTools
- [x] T030 [US2] Test orientation change on mobile (portrait to landscape) and verify form state persists
- [x] T031 [US2] Verify no horizontal scrolling at any breakpoint from 320px to 2560px
- [x] T032 [US2] Verify all touch targets meet 44x44px minimum using browser DevTools measurement tools

**Checkpoint**: At this point, User Story 2 should be fully functional - calculator works perfectly on all device sizes

---

## Phase 5: User Story 3 - App-Like Mobile Experience (Priority: P2)

**Goal**: Add visual polish for native app-like feel with smooth interactions, clear typography, and elegant theming

**Independent Test**: Use calculator on mobile device and verify it feels responsive with smooth animations, clear visual hierarchy, appropriate spacing, and professional theming

### Implementation for User Story 3

- [x] T033 [P] [US3] Add smooth transitions to interactive elements in components/battery/BatteryCalculator.tsx (transition-all duration-200)
- [x] T034 [P] [US3] Add enhanced focus states to form inputs in components/battery/BatteryInputForm.tsx (focus:ring-2 focus:ring-primary focus:outline-none)
- [x] T035 [P] [US3] Add card elevation with hover effects in components/battery/BatteryResults.tsx (shadow-sm hover:shadow-md transition-shadow)
- [x] T036 [US3] Add clear visual hierarchy to results display with larger primary text in components/battery/BatteryResults.tsx
- [x] T037 [US3] Add appropriate color coding for warnings with WCAG AA contrast in components/battery/BatteryResults.tsx
- [x] T038 [US3] Test touch interactions on real mobile device (iOS Safari or Android Chrome)
- [x] T039 [US3] Verify focus states are clearly visible on all interactive elements
- [x] T040 [US3] Test animations and transitions perform at 60fps on mobile devices
- [x] T041 [US3] Verify warning messages are readable with sufficient contrast (4.5:1 minimum)
- [x] T042 [US3] Test keyboard navigation and accessibility on desktop browsers

**Checkpoint**: All user stories should now be independently functional with polished mobile experience

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, testing, and documentation

- [x] T043 [P] Test on real iPhone device (Safari 15+) with various input scenarios
- [x] T044 [P] Test on real Android device (Chrome 100+) with various input scenarios
- [x] T045 [P] Test on iPad/tablet device with portrait and landscape orientations
- [x] T046 [P] Verify page load time on 3G connection throttling (target: < 3 seconds)
- [x] T047 [P] Test layout shift (CLS) during page load and verify no significant shifts
- [x] T048 [P] Verify all font sizes meet 16px minimum on mobile devices
- [x] T049 [P] Test safe area insets on iPhone X+ devices (notch compatibility)
- [x] T050 Verify existing battery calculation logic remains unchanged
- [x] T051 Test edge case: very small backup time (< 0.01 hours) displays "< 1 minute"
- [x] T052 Test edge case: very long backup time (> 100 hours) displays full hours and minutes
- [x] T053 Test edge case: device rotation mid-calculation preserves form state
- [x] T054 Test validation errors display correctly on mobile with readable text
- [x] T055 Run complete test suite (npm test) and verify all tests pass
- [x] T056 Manual cross-browser testing on Chrome 100+, Safari 15+, Firefox 100+, Edge 100+
- [x] T057 [P] Update quickstart.md with any implementation learnings or deviations

---

## Phase 7: Constitution Compliance Verification

**Purpose**: Validate implementation against constitutional principles (`.specify/memory/constitution.md`)

### Calculation Accuracy Validation (if applicable)
- [x] T058 Verify time conversion formula accuracy matches data-model.md test cases (9 test cases)
- [x] T059 Confirm existing battery calculation formulas remain unchanged and validated

### Safety Validation (if applicable)
- [x] T060 [P] Verify warning display on mobile has sufficient contrast (WCAG AA: 4.5:1)
- [x] T061 [P] Test warning messages are readable on smallest supported screen (320px)

### Test Coverage Verification
- [x] T062 Review unit test coverage for formatTimeDisplay utility (target: 100% coverage)
- [x] T063 Verify TDD cycle was followed (Red → Green → Refactor) for time formatting utility
- [x] T064 Document manual responsive testing results in test report

### Professional Documentation (if applicable)
- [x] T065 Test cross-browser compatibility and verify 95% compatibility target (Chrome, Safari, Firefox, Edge)
- [x] T066 Verify all responsive breakpoints work correctly across target browsers

### Progressive Enhancement Verification
- [x] T067 Confirm User Story 1 (time display) works independently without responsive changes
- [x] T068 Confirm User Story 2 (responsive layout) works independently without visual polish
- [x] T069 Confirm User Story 3 (app-like polish) works as final enhancement layer
- [x] T070 Verify P1 user stories (US1, US2) complete before P2 work (US3)

### Security & Code Quality (if applicable)
- [x] T071 [P] Verify no secrets or sensitive data in codebase
- [x] T072 [P] Confirm client-side only implementation (no backend changes)
- [x] T073 Verify smallest viable diff approach (minimal changes to existing components)

**Checkpoint**: Constitution compliance verified - ready for code review and deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (Enhanced Time Display) - P1: Can start after Phase 2
  - User Story 2 (Responsive Layout) - P1: Can start after Phase 2 (INDEPENDENT of US1)
  - User Story 3 (App-Like Polish) - P2: Can start after Phase 2 (INDEPENDENT of US1/US2)
- **Polish (Phase 6)**: Depends on desired user stories being complete (minimum: US1 + US2)
- **Verification (Phase 7)**: Depends on all implementation complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - only depends on Foundational (Phase 2)
- **User Story 2 (P1)**: Independent - only depends on Foundational (Phase 2)
- **User Story 3 (P2)**: Independent - only depends on Foundational (Phase 2)

**IMPORTANT**: All three user stories are independent and can be implemented in parallel by different developers after Phase 2 completes.

### Within Each User Story

**User Story 1 (Time Display)**:
- Tests first (T007-T012) → Verify failures (T012) → Implementation (T013-T016) → Integration (T017-T019)

**User Story 2 (Responsive Layout)**:
- All implementation tasks (T020-T026) can run in parallel if different components
- Testing tasks (T027-T032) run after implementation complete

**User Story 3 (Visual Polish)**:
- All implementation tasks (T033-T037) can run in parallel if different components
- Testing tasks (T038-T042) run after implementation complete

### Parallel Opportunities

**Phase 2 (Foundational)**: T004, T005 can run in parallel (different files)

**User Story 1 Tests**: T007, T008, T009, T010, T011 can run in parallel (same file, different test cases)

**User Story 2 Implementation**: T020, T021, T022 can run in parallel (different components or different parts of same file)

**User Story 3 Implementation**: T033, T034, T035 can run in parallel (different components)

**Polish Phase**: Most tasks (T043-T049, T057) can run in parallel (independent testing activities)

**Verification Phase**: T058-T059, T060-T061, T071-T072 can run in parallel within their categories

---

## Parallel Example: User Story 1

```bash
# Launch all test writing tasks together:
Task: "Write test case for < 1 minute display"
Task: "Write test case for 0.75 hours → 45 minutes"
Task: "Write test case for 3.456 hours → 3 hours 27 minutes"
Task: "Write test case for > 100 hours display"
Task: "Write test case for grammar handling"

# Then after tests fail, implement the function:
Task: "Implement formatTimeDisplay function"
Task: "Add edge case handling"
Task: "Add grammar handling"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only - Both P1)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 - Enhanced Time Display (T007-T019)
4. **STOP and VALIDATE**: Test dual time format independently
5. Complete Phase 4: User Story 2 - Mobile-Responsive Layout (T020-T032)
6. **STOP and VALIDATE**: Test responsive layout on multiple devices
7. Deploy/demo MVP with P1 features

### Incremental Delivery

1. **Foundation** (Phase 1-2) → Foundation ready
2. **MVP v1** (Phase 3: US1) → Time display enhancement → Test → Deploy ✅
3. **MVP v2** (Phase 4: US2) → Add responsive layout → Test → Deploy ✅
4. **Enhanced** (Phase 5: US3) → Add visual polish → Test → Deploy ✅
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. **Once Phase 2 done, split work**:
   - Developer A: User Story 1 (Time Display) - T007-T019
   - Developer B: User Story 2 (Responsive Layout) - T020-T032
   - Developer C: User Story 3 (Visual Polish) - T033-T042
3. **Integration**: Each developer tests their story independently
4. **Together**: Phase 6 (Polish) + Phase 7 (Verification)

---

## Summary

**Total Tasks**: 73 tasks
- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 3 tasks (BLOCKING)
- Phase 3 (User Story 1 - P1): 13 tasks (6 tests + 7 implementation)
- Phase 4 (User Story 2 - P1): 13 tasks
- Phase 5 (User Story 3 - P2): 10 tasks
- Phase 6 (Polish): 15 tasks
- Phase 7 (Verification): 16 tasks

**Parallel Opportunities**: 28 tasks marked [P] can run in parallel with other tasks in their phase

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 + Phase 4 = User Stories 1 & 2 (both P1)

**Independent Test Criteria**:
- **US1**: Open calculator, enter values, see both time formats displayed
- **US2**: Open on mobile/tablet/desktop, verify no horizontal scroll, all controls accessible
- **US3**: Use on mobile, verify smooth interactions and professional appearance

---

## Notes

- [P] tasks = different files or independent sections, no dependencies within phase
- [Story] label maps task to specific user story for traceability (US1, US2, US3)
- Each user story is independently completable and testable
- TDD approach: Write failing tests before implementation for User Story 1
- Manual testing required for responsive design (User Story 2) and UX polish (User Story 3)
- Commit after each logical group of tasks (e.g., after completing all tests for US1)
- Stop at any checkpoint to validate story independently before proceeding
- Minimum viable product: User Story 1 + User Story 2 (both P1 features)
- User Story 3 can be deferred if time-constrained (P2 priority)
