# Quickstart Guide: ElectroMate Development

**Feature**: ElectroMate Engineering Web Application
**Date**: 2025-12-24
**Audience**: Developers setting up local development environment

## Prerequisites

- **Node.js**: v20.x or later (LTS recommended)
- **npm**: v10.x or later (comes with Node.js)
- **Git**: For version control
- **Code Editor**: VS Code recommended (with TypeScript, Tailwind CSS extensions)
- **PostgreSQL Client**: Optional, for database inspection (Neon provides web UI)

---

## Initial Setup (First Time)

### 1. Clone Repository and Install Dependencies

```bash
# Navigate to project directory
cd D:\prompteng\elec_calc

# Install dependencies
npm install

# Expected key dependencies:
# - next@15.x
# - react@19.x
# - typescript@5.x
# - mathjs@13.x
# - zustand@5.x
# - jspdf@3.x
# - recharts@2.x
# - better-auth@latest
# - drizzle-orm@latest
# - tailwindcss@3.x
```

### 2. Environment Configuration

Create `.env.local` file in project root:

```bash
# Create environment file
touch .env.local

# Or on Windows PowerShell:
New-Item -Path .env.local -ItemType File
```

Add the following environment variables:

```env
# Neon PostgreSQL Connection
NEON_DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/electromate?sslmode=require

# BetterAuth Configuration
BETTER_AUTH_SECRET=<generate-random-secret-min-32-chars>
BETTER_AUTH_URL=http://localhost:3000

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Generate BetterAuth secret**:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 3. Database Setup (Neon PostgreSQL)

```bash
# Push database schema (Drizzle ORM)
npm run db:push

# Optional: Generate Drizzle migrations
npm run db:generate

# Optional: Apply migrations
npm run db:migrate

# Optional: Seed cable tables and standard references
npm run db:seed
```

**Note**: Neon PostgreSQL provides web UI at https://console.neon.tech for database inspection.

### 4. Run Development Server

```bash
# Start Next.js development server
npm run dev

# Server starts on http://localhost:3000
# Open browser and navigate to:
# - http://localhost:3000 (landing page)
# - http://localhost:3000/battery (Battery Calculator - P1)
# - http://localhost:3000/ups (UPS Sizing Tool - P1)
# - http://localhost:3000/cables (Cable Sizing - P1)
```

---

## Development Workflow (TDD - Constitution Principle V)

### Test-First Development for Calculations

**Critical for P1 calculations (Battery, UPS, Cable Sizing)**

#### Step 1: Write Tests (RED)

```bash
# Create test file
touch __tests__/unit/calculations/battery.test.ts
```

```typescript
// __tests__/unit/calculations/battery.test.ts
import { describe, test, expect } from 'vitest'
import { calculateBatteryBackupTime } from '@/lib/calculations/battery/backupTime'

describe('Battery Backup Time (IEEE 485)', () => {
  test('SC-005: Matches IEEE 485 within 2% accuracy', () => {
    // Test case from IEEE 485-2020 Example 4.2.1
    const result = calculateBatteryBackupTime(48, 200, 2000, 0.9, 0.8)

    // Expected: 3.456 hours (IEEE 485 reference)
    expect(result).toBeCloseTo(3.456, 2)

    // Verify within 2% error tolerance
    const errorPercent = Math.abs((result - 3.456) / 3.456) * 100
    expect(errorPercent).toBeLessThan(2)
  })
})
```

**Run tests (should FAIL initially)**:
```bash
npm run test

# Expected output: ❌ FAIL - Module not found: @/lib/calculations/battery/backupTime
```

#### Step 2: Get User Approval

Present test cases to user:
- Verify test scenarios match real-world engineering workflows
- Confirm IEEE 485 Example 4.2.1 is appropriate reference case
- Document approval in test file comment

#### Step 3: Implement Calculation (GREEN)

```bash
# Create implementation file
mkdir -p lib/calculations/battery
touch lib/calculations/battery/backupTime.ts
```

```typescript
// lib/calculations/battery/backupTime.ts
import { math } from '@/lib/mathConfig'

export function calculateBatteryBackupTime(
  voltage: number,
  ampHours: number,
  loadWatts: number,
  efficiency: number,
  agingFactor: number
): number {
  // Convert to BigNumber for precision
  const V = math.bignumber(voltage)
  const Ah = math.bignumber(ampHours)
  const P = math.bignumber(loadWatts)
  const η = math.bignumber(efficiency)
  const aging = math.bignumber(agingFactor)

  // T = (V × Ah × η × aging) / P (IEEE 485-2020)
  const result = math.divide(
    math.multiply(math.multiply(math.multiply(V, Ah), η), aging),
    P
  )

  return math.number(math.round(result, 3)) // 3 decimal places
}
```

**Run tests (should PASS)**:
```bash
npm run test

# Expected output: ✅ PASS - 1 test passed
```

#### Step 4: Refactor (REFACTOR)

Optimize for performance/clarity while maintaining test passage:
- Add memoization if needed
- Extract common utilities
- Add code comments with standard references

```typescript
// lib/calculations/battery/backupTime.ts
import { math } from '@/lib/mathConfig'

/**
 * Calculate battery backup time per IEEE 485-2020
 *
 * Formula: T = (V_dc × Ah × η × aging) / P_load
 *
 * @param voltage - DC system voltage (V)
 * @param ampHours - Battery capacity (Ah)
 * @param loadWatts - Load power (W)
 * @param efficiency - System efficiency (0-1)
 * @param agingFactor - Battery aging factor (0-1, typical: 0.8)
 * @returns Backup time (hours)
 *
 * @standard IEEE 485-2020 Section 4.2
 */
export function calculateBatteryBackupTime(
  voltage: number,
  ampHours: number,
  loadWatts: number,
  efficiency: number,
  agingFactor: number
): number {
  // Validation: Ensure positive inputs (FR-002)
  if (voltage <= 0) throw new Error('Voltage must be positive')
  if (ampHours <= 0) throw new Error('Amp-hours must be positive')
  if (loadWatts <= 0) throw new Error('Load must be positive')

  // High-precision calculation (Constitution Principle I)
  const V = math.bignumber(voltage)
  const Ah = math.bignumber(ampHours)
  const P = math.bignumber(loadWatts)
  const η = math.bignumber(efficiency)
  const aging = math.bignumber(agingFactor)

  const result = math.divide(
    math.multiply(math.multiply(math.multiply(V, Ah), η), aging),
    P
  )

  return math.number(math.round(result, 3))
}
```

**Run tests again (should still PASS)**:
```bash
npm run test
# Expected: ✅ PASS - All tests passing after refactor
```

---

## Common Development Tasks

### Run Development Server

```bash
npm run dev
# Server: http://localhost:3000
# API: http://localhost:3000/api
```

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (TDD workflow)
npm run test:watch

# Run specific test file
npm run test __tests__/unit/calculations/battery.test.ts

# Run tests with coverage
npm run test:coverage
```

### Type Checking

```bash
# Run TypeScript compiler (no emit)
npm run type-check

# Or use VS Code TypeScript language server (real-time)
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix lint errors automatically
npm run lint:fix

# Format code with Prettier (if configured)
npm run format
```

### Database Operations

```bash
# Push schema changes to database
npm run db:push

# Generate Drizzle migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database UI)
npm run db:studio
```

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run start
```

---

## Project Structure Navigation

### Where to Find Things

**Calculator Components**: `app/{calculator-name}/`
- Example: `app/battery/BatteryCalculator.tsx`

**Calculation Logic**: `lib/calculations/{calculator-name}/`
- Example: `lib/calculations/battery/backupTime.ts`
- Pure functions, no React dependencies (TDD-friendly)

**Validation Logic**: `lib/validation/{calculator-name}Validation.ts`
- Example: `lib/validation/batteryValidation.ts`
- Zod schemas + validation functions

**State Management**: `stores/{calculator-name}Store.ts`
- Example: `stores/batteryStore.ts`
- Zustand stores with localStorage persistence

**Shared Components**: `components/`
- UI components: `components/ui/` (shadcn/ui)
- Charts: `components/charts/`
- Layout: `components/layout/`
- Shared calculator components: `components/shared/`

**Tests**: `__tests__/`
- Unit tests: `__tests__/unit/calculations/`
- Integration tests: `__tests__/integration/`
- E2E tests: `__tests__/e2e/`

---

## Adding a New Calculator (Example: Battery Backup)

### Step 1: Create Route

```bash
# Create route directory
mkdir -p app/battery
```

```typescript
// app/battery/page.tsx (Server Component)
import { Metadata } from 'next'
import { BatteryCalculator } from './BatteryCalculator'

export const metadata: Metadata = {
  title: 'Battery Backup Calculator | ElectroMate',
  description: 'Calculate battery backup time per IEEE 485 standards',
}

export default function BatteryPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Battery Backup Time Calculator</h1>
      <BatteryCalculator />
    </div>
  )
}
```

### Step 2: Create Zustand Store

```typescript
// stores/batteryStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BatteryState {
  voltage: number
  ampHours: number
  loadWatts: number
  efficiency: number
  agingFactor: number
  setVoltage: (v: number) => void
  setAmpHours: (ah: number) => void
  setLoadWatts: (w: number) => void
  setEfficiency: (e: number) => void
  setAgingFactor: (a: number) => void
}

export const useBatteryStore = create<BatteryState>()(
  persist(
    (set) => ({
      voltage: 48,
      ampHours: 200,
      loadWatts: 2000,
      efficiency: 0.9,
      agingFactor: 0.8,
      setVoltage: (v) => set({ voltage: v }),
      setAmpHours: (ah) => set({ ampHours: ah }),
      setLoadWatts: (w) => set({ loadWatts: w }),
      setEfficiency: (e) => set({ efficiency: e }),
      setAgingFactor: (a) => set({ agingFactor: a }),
    }),
    { name: 'electromate-battery' }
  )
)
```

### Step 3: Write Tests (TDD - Step 1: RED)

```typescript
// __tests__/unit/calculations/battery.test.ts
import { describe, test, expect } from 'vitest'
import { calculateBatteryBackupTime } from '@/lib/calculations/battery/backupTime'

describe('Battery Backup Time (IEEE 485)', () => {
  test('Matches IEEE 485 within 2%', () => {
    const result = calculateBatteryBackupTime(48, 200, 2000, 0.9, 0.8)
    expect(result).toBeCloseTo(3.456, 2)
  })
})
```

**Run**: `npm run test` → Should FAIL (module doesn't exist yet)

### Step 4: Implement Calculation (TDD - Step 2: GREEN)

```typescript
// lib/calculations/battery/backupTime.ts
import { math } from '@/lib/mathConfig'

export function calculateBatteryBackupTime(
  voltage: number,
  ampHours: number,
  loadWatts: number,
  efficiency: number,
  agingFactor: number
): number {
  const V = math.bignumber(voltage)
  const Ah = math.bignumber(ampHours)
  const P = math.bignumber(loadWatts)
  const η = math.bignumber(efficiency)
  const aging = math.bignumber(agingFactor)

  const result = math.divide(
    math.multiply(math.multiply(math.multiply(V, Ah), η), aging),
    P
  )

  return math.number(math.round(result, 3))
}
```

**Run**: `npm run test` → Should PASS

### Step 5: Create Calculator Component

```typescript
// app/battery/BatteryCalculator.tsx
'use client'

import { useBatteryStore } from '@/stores/batteryStore'
import { calculateBatteryBackupTime } from '@/lib/calculations/battery/backupTime'
import { InputField } from '@/components/shared/InputField'
import { ResultDisplay } from '@/components/shared/ResultDisplay'
import { PDFDownloadButton } from '@/components/shared/PDFDownloadButton'

export function BatteryCalculator() {
  const { voltage, ampHours, loadWatts, efficiency, agingFactor, setVoltage, setAmpHours, setLoadWatts, setEfficiency, setAgingFactor } = useBatteryStore()

  const backupTime = calculateBatteryBackupTime(voltage, ampHours, loadWatts, efficiency, agingFactor)

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Battery Voltage (V)"
          value={voltage}
          onChange={setVoltage}
          type="number"
        />
        <InputField
          label="Capacity (Ah)"
          value={ampHours}
          onChange={setAmpHours}
          type="number"
        />
        <InputField
          label="Load Power (W)"
          value={loadWatts}
          onChange={setLoadWatts}
          type="number"
        />
        <InputField
          label="Efficiency (%)"
          value={efficiency * 100}
          onChange={(v) => setEfficiency(v / 100)}
          type="number"
        />
        <InputField
          label="Aging Factor"
          value={agingFactor}
          onChange={setAgingFactor}
          type="number"
          step={0.1}
        />
      </div>

      <ResultDisplay
        title="Backup Time"
        value={`${backupTime.toFixed(2)} hours`}
        standard="IEEE 485-2020"
      />

      <PDFDownloadButton calculationType="battery" />
    </div>
  )
}
```

### Step 6: Test in Browser

```bash
npm run dev
# Navigate to http://localhost:3000/battery
# Verify:
# - Inputs update in real-time
# - Results calculated correctly
# - localStorage persistence works (refresh page)
# - PDF download generates report
```

---

## Key Development Patterns

### Pattern 1: Math.js for All Calculations

```typescript
import { math } from '@/lib/mathConfig'

// ✅ CORRECT: Use Math.js BigNumber
const result = math.divide(math.bignumber(10), math.bignumber(3))
// Returns: 3.333... (precise)

// ❌ INCORRECT: Native JavaScript
const result = 10 / 3
// Returns: 3.3333333333333335 (IEEE 754 error)
```

### Pattern 2: Real-Time Validation

```typescript
import { useValidation } from '@/hooks/useValidation'
import { validateBatteryInputs } from '@/lib/validation/batteryValidation'

export function BatteryCalculator() {
  const state = useBatteryStore()

  // Real-time validation with 300ms debounce
  const validation = useValidation(state, validateBatteryInputs, 300)

  return (
    <div>
      {validation.warnings.map(warning => (
        <WarningBanner
          key={warning.field}
          message={warning.message}
          severity={warning.severity}
          standardRef={warning.standardReference}
        />
      ))}
      {/* Calculator inputs... */}
    </div>
  )
}
```

### Pattern 3: Unit Conversion (SI ↔ NEC)

```typescript
import { convertLength, convertCableSize } from '@/lib/unitConversion'

// User toggles between SI and NEC units
const [unitSystem, setUnitSystem] = useState<'SI' | 'NEC'>('SI')

// Convert cable length
const displayLength = unitSystem === 'SI'
  ? `${length} m`
  : `${convertLength(length, 'meters', 'feet').toFixed(1)} ft`

// Convert cable size
const displaySize = unitSystem === 'SI'
  ? `${cableSize.sizeMetric} mm²`
  : `${cableSize.sizeAWG}`
```

### Pattern 4: PDF Generation

```typescript
import { generateCalculationPDF } from '@/lib/pdfGenerator'

async function handleDownloadPDF() {
  await generateCalculationPDF({
    calculationType: 'battery',
    inputs: {
      'Battery Voltage (V)': voltage,
      'Capacity (Ah)': ampHours,
      // ...
    },
    results: {
      'Backup Time (hours)': backupTime.toFixed(2),
      // ...
    },
    standardReferences: ['IEEE 485-2020'],
  })
}
```

---

## Debugging Tips

### Debug Math.js Calculations

```typescript
// Enable Math.js debug logging
import { math } from '@/lib/mathConfig'

const result = math.divide(math.bignumber(10), math.bignumber(3))
console.log(math.format(result, { precision: 14 }))
// Output: 3.3333333333333
```

### Debug localStorage Persistence

```bash
# Open browser DevTools
# Application tab → Local Storage → http://localhost:3000
# Look for keys: electromate-battery, electromate-ups, etc.
```

### Debug PDF Generation

```typescript
// Log PDF generation performance
const startTime = performance.now()
await generateCalculationPDF(options)
const duration = performance.now() - startTime
console.log(`PDF generated in ${duration}ms`) // Target: <2000ms
```

### Debug Real-Time Validation

```typescript
// Log validation performance (SC-002 target: <100ms)
const validation = useValidation(state, validator, 300)

useEffect(() => {
  const startTime = performance.now()
  const result = validator(state)
  const duration = performance.now() - startTime

  if (duration > 100) {
    console.warn(`Validation took ${duration}ms (target: <100ms)`)
  }
}, [state])
```

---

## Troubleshooting

### Issue: "Module not found: mathjs"

**Solution**:
```bash
npm install mathjs
```

### Issue: "localStorage is not defined (SSR)"

**Solution**: Ensure component uses "use client" directive

```typescript
'use client'  // Add at top of file

export function BatteryCalculator() {
  // localStorage is available in Client Components only
}
```

### Issue: "Database connection failed"

**Solution**: Verify `.env.local` has correct `NEON_DATABASE_URL`

```bash
# Test connection
npm run db:push
# Should succeed if credentials correct
```

### Issue: "Math.js precision errors"

**Solution**: Verify Math.js configured with BigNumber mode

```typescript
// lib/mathConfig.ts
export const math = create(all, {
  number: 'BigNumber',  // ← Must be 'BigNumber', not 'number'
  precision: 64
})
```

### Issue: "PDF not downloading in Safari"

**Solution**: Use `document.createElement('a')` method

```typescript
// lib/pdfGenerator.ts
const blob = doc.output('blob')
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = `ElectroMate_${type}_${Date.now()}.pdf`
link.click()
URL.revokeObjectURL(url)
```

---

## Code Standards (Constitution Compliance)

### 1. No Hardcoded Secrets

```typescript
// ❌ WRONG
const dbUrl = "postgresql://user:password@..."

// ✅ CORRECT
const dbUrl = process.env.NEON_DATABASE_URL
```

### 2. Smallest Viable Diff

Only modify files directly related to current task. Avoid refactoring unrelated code.

### 3. Code References

When discussing code in PRs or documentation:

```
// ✅ CORRECT: Reference with file:line
See calculation in lib/calculations/battery/backupTime.ts:45

// ❌ WRONG: Vague reference
See the battery calculation function
```

### 4. Test Coverage

All P1 calculations (Battery, UPS, Cable Sizing) MUST have:
- Nominal case tests (typical inputs)
- Boundary case tests (min/max values)
- Edge case tests (zero, very large numbers)
- Error case tests (negative values, impossible conditions)

---

## Useful Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Run production build
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint errors

# Testing
npm run test             # Run all tests
npm run test:watch       # TDD watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright E2E tests

# Database
npm run db:push          # Push schema to Neon
npm run db:generate      # Generate migrations
npm run db:migrate       # Apply migrations
npm run db:studio        # Open Drizzle Studio

# Utilities
npm run clean            # Clean .next, node_modules
npm run reset            # Clean + reinstall dependencies
```

---

## Getting Help

- **Constitution**: `.specify/memory/constitution.md` (project principles)
- **Specification**: `specs/001-electromate-engineering-app/spec.md` (feature requirements)
- **Implementation Plan**: `specs/001-electromate-engineering-app/plan.md` (this planning document)
- **Data Model**: `specs/001-electromate-engineering-app/data-model.md` (entity definitions)
- **API Contracts**: `specs/001-electromate-engineering-app/contracts/` (OpenAPI specs)

**Community Resources**:
- Next.js Documentation: https://nextjs.org/docs
- Math.js Documentation: https://mathjs.org/docs
- Zustand Documentation: https://docs.pmnd.rs/zustand
- BetterAuth Documentation: https://better-auth.com
- Drizzle ORM Documentation: https://orm.drizzle.team

---

**Document Status**: Complete
**Last Updated**: 2025-12-24
**Next Steps**: Run `/sp.tasks` to generate task breakdown for implementation
