# Developer Quickstart: Circuit Breaker Sizing Calculator

**Target Audience**: Full-stack TypeScript developers
**Prerequisites**: Node.js 18+, familiarity with Next.js 15, React 18, TypeScript
**Estimated Setup Time**: 30 minutes

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Setup Instructions](#setup-instructions)
5. [Running Calculations](#running-calculations)
6. [Testing](#testing)
7. [Common Tasks](#common-tasks)
8. [Debugging](#debugging)
9. [Performance Considerations](#performance-considerations)
10. [Code Quality Standards](#code-quality-standards)

---

## Overview

The Circuit Breaker Sizing Calculator is a Next.js 15 web application providing professional-grade electrical calculations for breaker sizing according to NEC and IEC standards.

**Key Characteristics**:
- **All calculations client-side**: No backend required; works offline
- **High precision**: Math.js BigNumber (64-digit precision)
- **Dual standards**: NEC (Americas) and IEC (International) with complete recalculation on switch
- **Progressive enhancement**: Core breaker sizing (P1) independent from advanced features (P2/P3)
- **Professional output**: PDF export for regulatory submission

**Technology Stack**:
- Next.js 15 (App Router)
- React 18 + TypeScript 5.x
- Zustand 5.x (state management)
- Math.js (precision arithmetic)
- jsPDF + html2canvas (PDF generation)
- Tailwind CSS + shadcn/ui (styling)
- Vitest + React Testing Library (testing)
- Zod (input validation)

---

## Architecture

### High-Level Design

```
User Input (React Components)
    ↓
Input Validation (Zod schemas)
    ↓
Zustand Store (State management)
    ↓
Calculation Engine (Pure functions)
    │
    ├─ Load Current Calculation (NEC/IEC formulas)
    ├─ Safety Factor / Correction Factors
    ├─ Standard Breaker Rating Lookup
    ├─ Derating Factors (optional)
    ├─ Voltage Drop Analysis (optional)
    └─ Short Circuit Analysis (optional)
    ↓
Display Results + Warnings
    ↓
Export/History (localStorage + PDF)
```

### Data Flow

**User Input → Validation → Calculation → Results Display → Storage**

1. **Input**: User enters voltage, load, standard, optional environmental factors
2. **Validation**: Zod schemas check ranges and format
3. **Calculation**: Pure functions compute load current, apply factors, select breaker
4. **Results**: Display with warnings, recommendations, calculation details
5. **Storage**: Save to localStorage (automatic) and optional history (user action)

### Separation of Concerns

- **Components**: UI and user interaction only
- **Hooks**: State management and side effects (Zustand integration)
- **Services**: Pure calculation logic (no component dependencies)
- **Constants**: Standard ratings, derating tables, formulas
- **Utils**: Math helpers, unit conversion, logging, formatting

---

## Project Structure

### Repository Layout

```
src/
├── components/
│   └── calculators/
│       └── breaker-sizing/               # Feature components
│           ├── BreakerSizingCalculator.tsx    # Main orchestrator
│           ├── BreakerInputForm.tsx           # Input collection
│           ├── BreakerResults.tsx             # Results display
│           ├── DeratingSidebar.tsx            # Derating factors (optional)
│           ├── HistorySidebar.tsx             # History panel (optional)
│           ├── PDFReportTemplate.tsx          # PDF layout
│           └── __tests__/
│               ├── BreakerInputForm.test.tsx
│               └── BreakerResults.test.tsx
│
├── services/
│   └── breaker-calculator/
│       ├── calculator.ts                 # Main calculation engine
│       ├── standards.ts                  # NEC/IEC definitions
│       ├── derating.ts                   # Derating calculations
│       ├── voltage-drop.ts               # Voltage drop analysis
│       ├── recommendations.ts            # Breaker type guidance
│       ├── validation.ts                 # Input validation rules
│       └── __tests__/
│           ├── calculator.test.ts
│           ├── standards.test.ts
│           └── derating.test.ts
│
├── hooks/
│   ├── useBreakerCalculation.ts          # Main Zustand store
│   ├── useDeratingSidebar.ts             # Optional derating state
│   ├── useHistoryStorage.ts              # localStorage FIFO history
│   ├── usePDFExport.ts                   # PDF generation
│   └── __tests__/
│       ├── useBreakerCalculation.test.ts
│       └── useHistoryStorage.test.ts
│
├── types/
│   └── breaker-calculator.ts             # TypeScript interfaces
│
├── constants/
│   └── electrical.ts                     # Standards tables, formulas
│
├── utils/
│   ├── math-helpers.ts                   # Math.js wrappers
│   ├── unit-conversion.ts                # Metric/Imperial conversion
│   ├── logger.ts                         # Structured logging
│   ├── formatting.ts                     # Display formatting
│   └── __tests__/
│       ├── math-helpers.test.ts
│       └── unit-conversion.test.ts
│
└── pages/
    └── calculators/
        └── breaker-sizing/
            └── page.tsx                  # Next.js page component

tests/
├── unit/
│   └── services/
│       ├── nec-calculations.test.ts      # NEC formula validation
│       ├── iec-calculations.test.ts      # IEC formula validation
│       └── derating-factors.test.ts      # Derating table verification
│
├── integration/
│   └── breaker-calculator.integration.test.ts  # End-to-end workflow
│
└── e2e/
    └── breaker-sizing.spec.ts            # Playwright full user flow

specs/
└── 003-circuit-breaker-sizing/
    ├── spec.md                           # Feature requirements
    ├── plan.md                           # Implementation plan
    ├── research.md                       # Standards research (NEC/IEC tables)
    ├── data-model.md                     # TypeScript interfaces
    ├── quickstart.md                     # This file
    ├── tasks.md                          # Implementation tasks
    └── contracts/
        └── breaker-api.yaml              # OpenAPI specification
```

### File Ownership

| Module | Owner | Priority | Status |
|--------|-------|----------|--------|
| `calculator.ts` | Core Logic | P1 | Essential |
| `standards.ts` | Constants | P1 | Critical (tables must be verified) |
| `BreakerSizingCalculator.tsx` | UI | P1 | Primary workflow |
| `voltage-drop.ts` | Feature | P2 | Secondary |
| `derating.ts` | Feature | P2 | Secondary |
| `HistorySidebar.tsx` | Feature | P3 | Enhancement |

---

## Setup Instructions

### 1. Clone and Install

```bash
# Navigate to project root
cd /path/to/elec_calc

# Install dependencies (if not already done)
npm install

# Verify Next.js 15 and required packages
npm list next math zustand jspdf
```

### 2. Create Feature Branch

```bash
# Checkout the feature branch (should already exist)
git checkout 003-circuit-breaker-sizing

# Verify branch status
git status
```

### 3. Start Development Server

```bash
# Run Next.js dev server
npm run dev

# Server will start at http://localhost:3000
# Navigate to: http://localhost:3000/calculators/breaker-sizing
```

### 4. Run Tests Locally

```bash
# Unit tests only
npm run test -- breaker-calculator

# Watch mode (re-run on file change)
npm run test -- --watch

# Coverage report
npm run test -- --coverage

# E2E tests (requires running dev server)
npm run test:e2e -- breaker-sizing.spec.ts
```

### 5. Lint and Format

```bash
# Check ESLint
npm run lint

# Format with Prettier
npm run format

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## Running Calculations

### Basic Calculation Example

```typescript
// From a React component or test
import { calculateBreaker } from '@/services/breaker-calculator/calculator';
import { CircuitConfiguration } from '@/types/breaker-calculator';

const circuit: CircuitConfiguration = {
  standard: 'NEC',
  voltage: 240,
  phase: 'single',
  loadMode: 'kw',
  loadValue: 10,
  powerFactor: 0.9,
  unitSystem: 'imperial'
};

const results = calculateBreaker(circuit);
console.log(`Recommended breaker: ${results.breakerSizing.recommendedBreakerAmps}A`);
// Output: Recommended breaker: 60A
```

### Using the Zustand Hook

```typescript
// In a React component
import { useBreakerCalculation } from '@/hooks/useBreakerCalculation';

export function MyCalculator() {
  const { results, setVoltage, setLoadValue, calculate } = useBreakerCalculation();

  const handleCalculate = async () => {
    await calculate();
    console.log('Results:', results);
  };

  return (
    <div>
      <input value={voltage} onChange={(e) => setVoltage(parseFloat(e.target.value))} />
      <input value={loadValue} onChange={(e) => setLoadValue(parseFloat(e.target.value))} />
      <button onClick={handleCalculate}>Calculate</button>
      {results && <p>Breaker: {results.breakerSizing.recommendedBreakerAmps}A</p>}
    </div>
  );
}
```

### Validation Example

```typescript
import { circuitConfigSchema } from '@/utils/validation';

const userInput = {
  standard: 'NEC',
  voltage: 240,
  phase: 'single',
  loadMode: 'kw',
  loadValue: 10,
  powerFactor: 0.9,
  unitSystem: 'imperial'
};

try {
  const validated = circuitConfigSchema.parse(userInput);
  console.log('Valid input:', validated);
} catch (error) {
  console.error('Validation errors:', error.errors);
  // Output: [{
  //   path: ['voltage'],
  //   message: 'Voltage must be at least 100V',
  //   code: 'too_small'
  // }]
}
```

---

## Testing

### Unit Test Example

**File**: `src/services/breaker-calculator/__tests__/calculator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateBreaker } from '../calculator';

describe('NEC Single-Phase Breaker Sizing', () => {
  it('should calculate correct minimum breaker size with 125% factor', () => {
    const result = calculateBreaker({
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'kw',
      loadValue: 10,
      powerFactor: 0.9,
      unitSystem: 'imperial'
    });

    // Expected: I = 10000 / (240 × 0.9) = 46.3A
    // Minimum: 46.3 × 1.25 = 57.9A
    // Recommended: 60A (next standard ≥ 57.9A)
    expect(result.loadAnalysis.calculatedCurrentAmps).toBeCloseTo(46.3, 1);
    expect(result.breakerSizing.minimumBreakerSizeAmps).toBeCloseTo(57.9, 1);
    expect(result.breakerSizing.recommendedBreakerAmps).toBe(60);
  });

  it('should recommend next standard rating up', () => {
    const result = calculateBreaker({
      standard: 'NEC',
      voltage: 240,
      phase: 'single',
      loadMode: 'amps',
      loadValue: 47,
      powerFactor: 1.0,
      unitSystem: 'imperial'
    });

    // Minimum: 47 × 1.25 = 58.75A
    // Should recommend 60A (next standard)
    expect(result.breakerSizing.recommendedBreakerAmps).toBe(60);
  });
});
```

### Running Specific Tests

```bash
# Test single file
npm run test -- calculator.test.ts

# Test matching pattern
npm run test -- --grep "NEC.*Single-Phase"

# Test with coverage
npm run test -- --coverage src/services/breaker-calculator

# Watch mode for development
npm run test -- calculator.test.ts --watch
```

### Test Case Checklist

Before submitting PR, ensure:
- [ ] All 50+ test scenarios from `specs/003-circuit-breaker-sizing/research.md` implemented
- [ ] NEC 210.20(A) reference case passing (10kW @ 240V single-phase → 60A)
- [ ] IEC 60364-5-52 reference case passing (50A @ 400V three-phase with derating)
- [ ] Voltage drop tests matching IEEE 835 examples
- [ ] Edge case tests (unusual voltages, extreme temperatures, short distances)
- [ ] Error handling tests (negative inputs, invalid ranges)
- [ ] Coverage >80% for calculation services

---

## Common Tasks

### Adding a New Standard Rating

**File**: `src/constants/electrical.ts`

```typescript
// Add to NEC_BREAKER_RATINGS
export const NEC_BREAKER_RATINGS = [
  15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100,
  110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450,
  500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000,
  4500  // NEW: Added 4500A (verify in UL 489 standard)
];
```

**Testing**:
```typescript
it('should recommend 4500A for extremely large loads', () => {
  const result = calculateBreaker({
    standard: 'NEC',
    voltage: 480,
    phase: 'three',
    loadMode: 'amps',
    loadValue: 3600,  // 3600 × 1.25 = 4500A
    powerFactor: 1.0
  });
  expect(result.breakerSizing.recommendedBreakerAmps).toBe(4500);
});
```

### Adding Temperature Derating Factor

**File**: `src/constants/electrical.ts`

```typescript
// Add new temperature to NEC table (verify against NEC 310.15(B)(2)(a))
export const NEC_TEMPERATURE_DERATING: Record<number, number> = {
  10: 1.08,
  15: 1.05,
  20: 1.00,  // Reference
  // ... existing values ...
  70: 0.58,  // NEW: Add extreme temperature (verify in standard)
};
```

### Updating Console Logging

**File**: `src/utils/logger.ts`

```typescript
import { logger } from '@/utils/logger';

// Usage in service
export function calculateBreaker(circuit: CircuitConfiguration) {
  logger.debug('Calculator', 'Starting breaker size calculation', { circuit });

  const current = calculateLoadCurrent(circuit);
  logger.debug('Calculator', 'Load current calculated', {
    current,
    formula: 'I = P / (V × PF)'
  });

  if (current > 5000) {
    logger.warn('Calculator', 'Extremely high current triggers warning', {
      current,
      note: 'Verify short circuit capacity'
    });
  }

  return { /* results */ };
}
```

### Adding Breaker Type Recommendation

**File**: `src/services/breaker-calculator/recommendations.ts`

```typescript
export function recommendBreakerType(loadType: string): BreakerTypeRecommendation {
  switch (loadType) {
    case 'resistive':
      return {
        recommendedType: 'Type B',
        rationale: 'Resistive loads have minimal inrush; Type B provides wire protection',
        inrushCapability: '3-5× rated current'
      };
    case 'inductive':  // Motors, transformers
      return {
        recommendedType: 'Type D',
        rationale: 'Motor inrush current typically 6-10×; Type D tolerates 10-20×',
        inrushCapability: '10-20× rated current'
      };
    // ... other cases ...
  }
}
```

---

## Debugging

### Enable Debug Logging

```typescript
// In development, debug logs print to console
// Check browser console: F12 → Console tab

// Or programmatically:
import { logger } from '@/utils/logger';

// Export logs for troubleshooting
const logs = logger.exportLogs();
console.log(JSON.stringify(logs, null, 2));
// Share this with support team
```

### Inspect Calculation State

```typescript
// In React component
import { useBreakerCalculation } from '@/hooks/useBreakerCalculation';

export function DebugPanel() {
  const state = useBreakerCalculation();

  return (
    <details>
      <summary>Debug State</summary>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </details>
  );
}
```

### Test Specific Edge Case

```typescript
// Quick test in console or vitest
import { calculateBreaker } from '@/services/breaker-calculator/calculator';

// Test unusual voltage: 380V (not standard US, but used in some countries)
const result = calculateBreaker({
  standard: 'NEC',
  voltage: 380,  // Edge case: non-standard voltage
  phase: 'three',
  loadMode: 'amps',
  loadValue: 100,
  powerFactor: 0.9
});

console.log('380V calculation:', result);
// Verify: System accepts and calculates correctly
// Expected: I = 100A → 100 × 1.25 = 125A → recommend 125A breaker
```

### Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| **Incorrect breaker recommendation** | Check standards.ts for correct rating table | Verify NEC/IEC rating in specification |
| **Test fails with floating-point** | Math.js precision issue | Use `.toBeCloseTo(expected, decimals)` in tests |
| **localStorage full** | History limit (50) exceeded | Gracefully handle QuotaExceededError |
| **PDF generation hangs** | html2canvas rendering slowdown | Simplify PDF layout; test in different browsers |
| **Calculation very slow (>500ms)** | Math.js operations inefficient | Profile with Chrome DevTools → Performance tab |

---

## Performance Considerations

### Optimization Targets

- **Calculation latency**: <100ms for simple breaker sizing, <150ms for complex derating
- **Input validation**: <50ms response to keystroke
- **PDF generation**: <3 seconds for complete report
- **Standard switch**: <500ms recalculation when toggling NEC↔IEC

### Performance Monitoring

```typescript
// Measure calculation time
console.time('breaker-calculation');
const results = calculateBreaker(circuit);
console.timeEnd('breaker-calculation');
// Output: breaker-calculation: 45.23ms

// Use Performance API for detailed measurement
const start = performance.now();
const results = calculateBreaker(circuit);
const duration = performance.now() - start;
console.log(`Calculation took ${duration.toFixed(2)}ms`);
```

### Math.js Configuration

```typescript
// src/utils/math-helpers.ts
import * as math from 'mathjs';

// Configure precision (64 digits for electrical calculations)
math.config({
  precision: 64,
  predictable: true  // Consistent results across platforms
});

// Use BigNumber for arbitrary precision
const result = math.bignumber('46.30123456789').toString();
```

### Debouncing Input Changes

```typescript
// In component using Zustand store
import { useDebouncedCallback } from 'use-debounce';
import { useBreakerCalculation } from '@/hooks/useBreakerCalculation';

export function BreakerInputForm() {
  const { setLoadValue, calculate } = useBreakerCalculation();

  const debouncedCalculate = useDebouncedCallback(() => {
    calculate();
  }, 300);  // Wait 300ms after last input before calculating

  const handleLoadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoadValue(parseFloat(e.target.value));
    debouncedCalculate();  // Recalculate after debounce
  };

  return <input onChange={handleLoadChange} />;
}
```

---

## Code Quality Standards

### TypeScript Strict Mode

All code must pass:
```bash
npm run type-check
# Should output: "No errors!"
```

### Linting Rules

```bash
npm run lint
# Auto-fix formatting
npm run lint -- --fix
```

### Test Coverage Minimum

- **Services**: >85% (critical calculation logic)
- **Hooks**: >80% (state management)
- **Components**: >70% (UI + integration)
- **Utils**: >90% (shared helpers)

### Code Review Checklist

Before submitting PR:
- [ ] TypeScript compiles without errors: `npm run type-check`
- [ ] Lint passes: `npm run lint`
- [ ] All tests pass: `npm run test`
- [ ] Test coverage meets minimum: `npm run test -- --coverage`
- [ ] No console errors/warnings in browser dev tools
- [ ] Calculation results match reference cases from spec
- [ ] Performance within targets (use Chrome DevTools)
- [ ] PR description references spec and requirements

### Commit Message Format

```
[<type>] <subject>

<body>

Fixes #<issue-number>
Related to spec <feature-id>

Types: feat, fix, refactor, test, docs, perf, chore
```

Examples:
```
[feat] Add temperature derating factor calculation per NEC Table 310.15(B)(2)(a)

Implements temperature-based derating for cables operating above 30°C ambient.
Adds unit tests validating 8 temperature points against NEC standard.

Fixes #345
Related to spec 003-circuit-breaker-sizing
```

---

## Next Steps

1. **Review Specification**: Read `specs/003-circuit-breaker-sizing/spec.md` for feature requirements
2. **Understand Standards**: Study `specs/003-circuit-breaker-sizing/research.md` for NEC/IEC rules
3. **Examine Data Model**: Review `specs/003-circuit-breaker-sizing/data-model.md` for TypeScript interfaces
4. **Check API Contract**: Review `specs/003-circuit-breaker-sizing/contracts/breaker-api.yaml` for calculation interfaces
5. **Run Existing Tests**: Execute `npm run test -- breaker-calculator` to see test examples
6. **Start First Task**: Check `specs/003-circuit-breaker-sizing/tasks.md` for Phase 2 implementation tasks

---

## Getting Help

**Resources**:
- **Spec Documentation**: `specs/003-circuit-breaker-sizing/`
- **Code Examples**: Search for `.test.ts` files in same directory as code
- **Standards References**: `specs/003-circuit-breaker-sizing/research.md`
- **Type Definitions**: `src/types/breaker-calculator.ts`
- **Project Configuration**: `tsconfig.json`, `vitest.config.ts`, `next.config.js`

**Common Reference Files**:
```bash
# View electrical constants and derating tables
cat src/constants/electrical.ts

# View type definitions
cat src/types/breaker-calculator.ts

# View calculation formulas
cat src/services/breaker-calculator/calculator.ts

# View example tests
cat src/services/breaker-calculator/__tests__/calculator.test.ts
```

---

**Last Updated**: 2025-12-28
**Status**: Ready for Phase 2 Implementation
