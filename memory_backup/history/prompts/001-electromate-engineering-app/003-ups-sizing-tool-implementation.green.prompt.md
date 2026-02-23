---
id: 003
title: UPS Sizing Tool Implementation
stage: green
date: 2025-12-27
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-electromate-engineering-app
branch: main
user: agent
command: /sp.implement
labels: ["implementation", "ups", "ieee-1100", "tdd"]
links:
  spec: specs/001-electromate-engineering-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - __tests__/unit/calculations/ups.test.ts
  - lib/calculations/ups/diversityFactor.ts
  - lib/calculations/ups/powerFactor.ts
  - lib/calculations/ups/sizing.ts
  - lib/calculations/ups/index.ts
  - lib/validation/upsValidation.ts
  - stores/useUPSStore.ts
  - app/ups/page.tsx
  - app/ups/UPSSizingTool.tsx
tests:
  - __tests__/unit/calculations/ups.test.ts (14 tests)
  - __tests__/unit/calculations/battery.test.ts (16 tests)
---

## Prompt

/sp.implement

User selected feature: 001-electromate-engineering-app for implementation.

## Response snapshot

Implemented Phase 4 - UPS Sizing Tool (User Story 2) following TDD approach:

### TDD Red Phase - Tests Written First
1. **T063-T065**: Created comprehensive test suite in `__tests__/unit/calculations/ups.test.ts`:
   - IEEE 1100 diversity factor tests (N≤3, 3<N≤10, N>10 cases)
   - Power factor conversion tests (VA ↔ W with 0.8 default)
   - UPS sizing tests with 25% growth margin
   - 14 tests total, all passing

### TDD Green Phase - Implementation
2. **T066**: `lib/calculations/ups/diversityFactor.ts`
   - Implements IEEE 1100 diversity formula
   - N≤3: 1.0, 3<N≤10: 0.9+0.1/N, N>10: 0.85

3. **T067**: `lib/calculations/ups/powerFactor.ts`
   - VA ↔ W conversions with configurable power factor
   - Default 0.8 PF per IEEE 1100 guidelines
   - Validation for unusual power factors

4. **T068**: `lib/calculations/ups/sizing.ts`
   - Complete UPS sizing calculation
   - Standard sizes: [10, 20, 30, 40, 60, 80, 100, 120, 160, 200] kVA
   - Returns null for loads exceeding 200 kVA (parallel config needed)

5. **T069-T070**: `lib/validation/upsValidation.ts`
   - Zod schema for LoadItem validation
   - Warnings for unusual power factors (<0.7 or >0.95)
   - High load warnings (>200 kVA)
   - Load presets for quick entry

6. **T071**: `stores/useUPSStore.ts`
   - Zustand store with localStorage persistence
   - Key: "electromate-ups"
   - Load list management (add/update/remove)

7. **T072-T073**: `app/ups/page.tsx` and `UPSSizingTool.tsx`
   - Server component with SEO metadata
   - Client component with full calculator UI
   - Load presets, validation, results display

8. **T076-T078**: PDF integration, navigation, tests verified

### Files Created/Modified
- 9 new files created
- 30 tests passing (14 UPS + 16 battery)

### Remaining Tasks (T074-T075)
- T074: UPSLoadChart.tsx (chart visualization)
- T075: API route for UPS calculations

## Outcome

- ✅ Impact: UPS Sizing Tool (US2) core functionality implemented with IEEE 1100 compliance
- 🧪 Tests: 30/30 passing (14 UPS + 16 battery tests)
- 📁 Files: 9 new files created, 1 modified (tasks.md)
- 🔁 Next prompts: Complete T074 (chart), T075 (API), then proceed to Phase 5 (Cable Sizing)
- 🧠 Reflection: TDD approach ensured IEEE 1100 calculations are accurate before UI was built

## Evaluation notes (flywheel)

- Failure modes observed: TypeScript import issues with existing battery tests (fixed)
- Graders run and results (PASS/FAIL): Vitest - PASS (30/30)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add Recharts visualization for load breakdown
