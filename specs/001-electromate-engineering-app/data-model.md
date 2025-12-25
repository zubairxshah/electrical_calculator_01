# Data Model: ElectroMate Engineering Web Application

**Feature**: ElectroMate Engineering Web Application
**Date**: 2025-12-24
**Phase**: Phase 1 - Design

## Purpose

This document defines the data entities, relationships, validation rules, and state transitions for ElectroMate. The model supports both anonymous users (localStorage) and registered users (PostgreSQL database) with seamless migration between the two.

---

## Entity Overview

| Entity | Purpose | Storage | Lifecycle |
|--------|---------|---------|-----------|
| **User** | Registered user account | PostgreSQL | Persistent (account lifetime) |
| **CalculationSession** | Individual calculation instance | localStorage OR PostgreSQL | 2 years (registered), localStorage quota (anonymous) |
| **BatteryCalculation** | Battery backup time calculation | localStorage OR PostgreSQL | Inherited from CalculationSession |
| **UPSCalculation** | UPS sizing calculation | localStorage OR PostgreSQL | Inherited from CalculationSession |
| **CableCalculation** | Cable sizing/voltage drop calculation | localStorage OR PostgreSQL | Inherited from CalculationSession |
| **SolarCalculation** | Solar array sizing calculation | localStorage OR PostgreSQL | Inherited from CalculationSession |
| **Project** | Container grouping related calculations | PostgreSQL only | Account lifetime |
| **CableTable** | Reference data for cable ampacity | Static (code) | Immutable |
| **StandardReference** | Engineering standard metadata | Static (code) | Versioned |

---

## Core Entities

### User

Represents a registered user account with authentication credentials and profile information.

```typescript
interface User {
  id: string                    // UUID
  email: string                 // Unique, validated
  passwordHash: string          // Hashed with bcrypt (BetterAuth)
  name: string | null           // Optional display name
  createdAt: Date               // Account creation timestamp
  updatedAt: Date               // Last profile update
  emailVerified: boolean        // Email verification status

  // Relationships
  calculations: CalculationSession[]  // All user calculations
  projects: Project[]                 // Optional calculation groupings
}
```

**Validation Rules**:
- `email`: Must be valid email format, unique across all users
- `passwordHash`: Minimum 8 characters (enforced by BetterAuth)
- `name`: Optional, max 100 characters
- `createdAt`: Auto-generated on insert
- `updatedAt`: Auto-updated on modification

**State Transitions**:
1. **Registration**: User created with `emailVerified: false`
2. **Email Verification**: User updates to `emailVerified: true` via email link
3. **Profile Update**: User modifies `name`, `updatedAt` timestamp updated
4. **Account Deletion**: Soft delete (mark as deleted, retain for audit) or hard delete after 30 days

**Database Schema (Drizzle ORM)**:
```typescript
// lib/schema.ts
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  emailVerified: boolean('email_verified').notNull().default(false),
})
```

---

### CalculationSession

Base entity for all calculation types. Stores common metadata and relationships.

```typescript
interface CalculationSession {
  id: string                    // UUID
  userId: string | null         // NULL for anonymous, FK to User for registered
  calculationType: CalculationType  // 'battery' | 'ups' | 'cable' | 'solar'

  // Calculation data (polymorphic - specific to type)
  inputs: Record<string, any>   // Input parameters (voltage, current, etc.)
  results: Record<string, any>  // Calculated results

  // Metadata
  createdAt: Date               // Calculation timestamp
  standardsUsed: string[]       // E.g., ["IEEE 485-2020", "NEC 2020"]
  unitSystem: 'SI' | 'NEC'      // IEC/SI or North American units

  // Optional grouping
  projectId: string | null      // FK to Project (registered users only)

  // Validation status
  warnings: ValidationWarning[] // Safety warnings generated
  isValid: boolean              // Passed all validation checks
}

type CalculationType = 'battery' | 'ups' | 'cable' | 'solar' | 'charge-controller' | 'battery-comparison'

interface ValidationWarning {
  field: string                 // Input field that triggered warning
  message: string               // User-facing warning message
  severity: 'danger' | 'warning' | 'info'
  standardReference: string | null  // E.g., "IEEE 485 Section 4.2"
}
```

**Validation Rules**:
- `calculationType`: Must be one of defined enum values
- `inputs`: Must match schema for specific calculation type (validated with Zod)
- `results`: Must match schema for specific calculation type
- `standardsUsed`: Array of standard references (e.g., "IEEE 485-2020")
- `unitSystem`: Either 'SI' or 'NEC'
- `warnings`: Auto-generated during validation (FR-004)
- `isValid`: `true` if no errors (warnings allowed)

**State Transitions**:
1. **Creation**: User initiates calculation → inputs validated → results computed → warnings generated
2. **Modification**: User updates inputs → re-validation → results recalculated → warnings updated
3. **Save**: Calculation persisted to localStorage (anonymous) or PostgreSQL (registered)
4. **Migration**: Anonymous user registers → localStorage calculations migrated to PostgreSQL
5. **Deletion**: Registered user: soft delete + 30-day warning before permanent deletion (FR-017a)

**Database Schema (Drizzle ORM)**:
```typescript
export const calculationSessions = pgTable('calculation_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  calculationType: text('calculation_type').notNull(),  // enum
  inputs: jsonb('inputs').notNull(),
  results: jsonb('results').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  standardsUsed: text('standards_used').array().notNull(),
  unitSystem: text('unit_system').notNull(),  // 'SI' | 'NEC'
  projectId: uuid('project_id').references(() => projects.id),
  warnings: jsonb('warnings').notNull().default('[]'),
  isValid: boolean('is_valid').notNull().default(true),
})
```

**localStorage Schema** (anonymous users):
```typescript
// Stored in localStorage with key: "electromate-${calculationType}"
interface LocalStorageCalculation {
  calculations: CalculationSession[]  // Array of calculation sessions
  version: number                     // Schema version for migrations
}
```

---

### BatteryCalculation

Specific calculation for battery backup time (IEEE 485).

```typescript
interface BatteryCalculationInputs {
  voltage: number               // DC system voltage (V)
  ampHours: number              // Battery capacity (Ah)
  loadWatts: number             // Load power (W)
  efficiency: number            // System efficiency (0-1)
  agingFactor: number           // Battery aging factor (0-1, default: 0.8)
}

interface BatteryCalculationResults {
  backupTime: number            // Hours of backup (calculated)
  energyStored: number          // Wh = voltage × ampHours × agingFactor
  dischargeRate: number         // C-rate = loadWatts / (voltage × ampHours)
  isDangerous: boolean          // True if C-rate >1C for VRLA
}
```

**Validation Rules** (Zod schema):
```typescript
// lib/validation/batteryValidation.ts
import { z } from 'zod'

export const batteryInputsSchema = z.object({
  voltage: z.number().positive().min(1).max(2000),  // 1V to 2000V
  ampHours: z.number().positive().min(1).max(10000),  // 1Ah to 10000Ah
  loadWatts: z.number().positive().min(1).max(1000000),  // 1W to 1MW
  efficiency: z.number().min(0.1).max(1.0),  // 10% to 100%
  agingFactor: z.number().min(0.5).max(1.0),  // 50% to 100%
})

// Validation warnings
export function validateBatteryInputs(inputs: BatteryCalculationInputs): ValidationResult {
  const warnings: ValidationWarning[] = []

  const dischargeRate = inputs.loadWatts / (inputs.voltage * inputs.ampHours)

  if (dischargeRate > 1.0) {
    warnings.push({
      field: 'loadWatts',
      message: 'Discharge rate >1C exceeds safe limits for VRLA batteries',
      severity: 'danger',
      standardReference: 'IEEE 485-2020 Section 4.2'
    })
  }

  if (inputs.efficiency > 1.0) {
    warnings.push({
      field: 'efficiency',
      message: 'Efficiency >100% is physically impossible',
      severity: 'danger',
      standardReference: null
    })
  }

  return { warnings, isValid: warnings.filter(w => w.severity === 'danger').length === 0 }
}
```

**Calculation Formula** (IEEE 485-2020):
```
T = (V_dc × Ah × η × aging) / P_load

Where:
- T: Backup time (hours)
- V_dc: DC system voltage (V)
- Ah: Battery capacity (Ah)
- η: System efficiency (dimensionless, 0-1)
- aging: Aging factor (dimensionless, 0-1)
- P_load: Load power (W)
```

---

### UPSCalculation

Specific calculation for UPS sizing with diversity factors (IEEE 1100, IEC 62040).

```typescript
interface UPSCalculationInputs {
  loads: LoadItem[]             // Array of equipment loads
  growthMargin: number          // Future growth margin (default: 0.25 = 25%)
  diversityFactorOverride: number | null  // Manual override (null = auto-calculate)
}

interface LoadItem {
  id: string                    // UUID
  name: string                  // Equipment name
  powerVA: number | null        // Apparent power (VA)
  powerWatts: number | null     // Real power (W)
  powerFactor: number           // Power factor (0-1, default: 0.8)
  quantity: number              // Number of identical units
  isCritical: boolean           // Criticality flag
}

interface UPSCalculationResults {
  totalLoadVA: number           // Sum of all loads (VA)
  totalLoadWatts: number        // Sum of all loads (W)
  diversityFactor: number       // Calculated per IEEE 1100
  effectiveLoadVA: number       // Total × diversity
  withGrowthVA: number          // Effective × (1 + growth margin)
  recommendedUPSkVA: number     // Next standard UPS size
  standardUPSSizes: number[]    // Available sizes: [10, 20, 30, 40, 60, 80, 100, 120, 160, 200] kVA
}
```

**Validation Rules**:
```typescript
export const upsInputsSchema = z.object({
  loads: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    powerVA: z.number().positive().nullable(),
    powerWatts: z.number().positive().nullable(),
    powerFactor: z.number().min(0.1).max(1.0),
    quantity: z.number().int().positive().min(1),
    isCritical: z.boolean(),
  })).min(1).refine((loads) => {
    // At least one of powerVA or powerWatts must be specified
    return loads.every(load => load.powerVA !== null || load.powerWatts !== null)
  }),
  growthMargin: z.number().min(0).max(1.0).default(0.25),
  diversityFactorOverride: z.number().min(0.5).max(1.0).nullable(),
})
```

**Diversity Factor Calculation** (IEEE 1100 Emerald Book):
```
For N identical loads:
- N ≤ 3: diversity = 1.0 (no diversity)
- 3 < N ≤ 10: diversity = 0.9 + (0.1 / N)
- N > 10: diversity = 0.85
```

---

### CableCalculation

Specific calculation for cable sizing and voltage drop (NEC/IEC 60364).

```typescript
interface CableCalculationInputs {
  systemVoltage: number         // System voltage (V) - from predefined list
  current: number               // Circuit current (A)
  length: number                // Cable length (meters or feet)
  conductorMaterial: 'copper' | 'aluminum'
  installationMethod: InstallationMethod
  ambientTemp: number           // Ambient temperature (°C or °F)
  circuitType: 'single-phase' | 'three-phase'
  numberOfConductors: number    // For grouping derating
}

type InstallationMethod = 'conduit' | 'cable-tray' | 'direct-burial' | 'free-air'

interface CableCalculationResults {
  selectedCableSize: CableSize  // Recommended cable size
  voltageDrop: number           // Voltage drop (V)
  voltageDropPercent: number    // Percentage of system voltage
  isViolation: boolean          // True if >3% (conservative limit)
  ampacityBeforeDerating: number  // Base ampacity (A)
  ampacityAfterDerating: number   // Derated ampacity (A)
  deratingFactors: DeratingFactors
  alternativeSizes: CableSize[] // Larger cable options if violation
}

interface CableSize {
  sizeMetric: string            // mm² (e.g., "2.5", "4", "6")
  sizeAWG: string | null        // AWG/kcmil (e.g., "14 AWG", "250 kcmil")
  resistance: number            // mV/A/m or Ω/1000ft
  ampacity: number              // Current capacity (A)
  standard: 'IEC' | 'NEC'       // Applicable standard
}

interface DeratingFactors {
  temperatureFactor: number     // Ambient temp adjustment
  groupingFactor: number        // Multiple cables in conduit
  totalFactor: number           // Combined derating
  standardReference: string     // E.g., "NEC 310.15(B)(2)(a)"
}
```

**Voltage Drop Calculation** (NEC/IEC 60364):
```
V_drop = I × L × R_per_unit_length

V_drop% = (V_drop / V_system) × 100

Where:
- V_drop: Voltage drop (V)
- I: Current (A)
- L: Length (meters or feet)
- R_per_unit_length: Cable resistance (mV/A/m or Ω/1000ft)
- V_system: System voltage (V)
```

**Validation Rules**:
- Voltage drop >3%: Warning (conservative NEC/IEC limit for all circuits)
- Voltage drop >10%: Danger (physically dangerous)
- Current exceeds derated ampacity: Danger (overheating risk)

---

### SolarCalculation

Specific calculation for solar array sizing (NREL standards).

```typescript
interface SolarCalculationInputs {
  dailyEnergyKWh: number        // Target daily energy (kWh/day)
  peakSunHours: number          // Location PSH (hours/day)
  panelWattage: number          // Individual panel rating (Wp)
  panelEfficiency: number       // Panel efficiency (0-1)
  performanceRatio: number      // System performance ratio (0-1, typical: 0.75-0.85)
  systemVoltage: number         // DC system voltage (V)
}

interface SolarCalculationResults {
  requiredPanels: number        // Number of panels (rounded up)
  totalArrayPower: number       // Total array power (kWp)
  estimatedDailyGen: number     // Estimated daily generation (kWh/day)
  estimatedAnnualGen: number    // Estimated annual generation (kWh/year)
  arrayAreaM2: number           // Required roof/ground area (m²)
  openCircuitVoltage: number    // Array V_oc (V)
  shortCircuitCurrent: number   // Array I_sc (A)
}
```

**Calculation Formula** (NREL):
```
Required_Panels = Daily_kWh / (Panel_kW × PSH × PR)

Where:
- Daily_kWh: Target daily energy requirement
- Panel_kW: Individual panel power rating (kWp)
- PSH: Peak Sun Hours (location-specific, hours/day)
- PR: Performance Ratio (accounts for losses: temperature, soiling, inverter efficiency)
```

---

### Project (Registered Users Only)

Container for grouping related calculations. Enables engineers to organize calculations by client, site, or project phase.

```typescript
interface Project {
  id: string                    // UUID
  userId: string                // FK to User
  name: string                  // Project name (e.g., "Data Center UPS Upgrade")
  description: string | null    // Optional project description
  createdAt: Date               // Project creation timestamp
  updatedAt: Date               // Last modification timestamp

  // Relationships
  calculations: CalculationSession[]  // All calculations in this project
}
```

**Validation Rules**:
- `name`: Required, max 200 characters
- `description`: Optional, max 1000 characters
- `userId`: Must reference existing user

**Database Schema**:
```typescript
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

---

## Reference Data Entities

### CableTable

Static reference data for cable ampacity and resistance. Stored in code (not database) for fast lookup.

```typescript
interface CableTableEntry {
  sizeMetric: string            // mm² (e.g., "1.5", "2.5", "4", "6", "10")
  sizeAWG: string | null        // AWG/kcmil (e.g., "14 AWG", "12 AWG", "250 kcmil")
  material: 'copper' | 'aluminum'
  resistanceMvAM: number        // Resistance (mV/A/m) for IEC
  resistanceOhmPer1000ft: number // Resistance (Ω/1000ft) for NEC
  ampacity60C: number           // Ampacity at 60°C (A)
  ampacity75C: number           // Ampacity at 75°C (A)
  ampacity90C: number           // Ampacity at 90°C (A)
  standard: 'IEC' | 'NEC' | 'BOTH'
}

// Example entries
const cableTables: CableTableEntry[] = [
  // IEC 60364-5-52 (Copper, Conduit)
  { sizeMetric: "1.5", sizeAWG: "14 AWG", material: "copper", resistanceMvAM: 12.1, resistanceOhmPer1000ft: 3.07, ampacity60C: 15, ampacity75C: 20, ampacity90C: 25, standard: "BOTH" },
  { sizeMetric: "2.5", sizeAWG: "12 AWG", material: "copper", resistanceMvAM: 7.41, resistanceOhmPer1000ft: 1.93, ampacity60C: 20, ampacity75C: 25, ampacity90C: 30, standard: "BOTH" },
  // ... (full table in lib/standards/cableTables.ts)
]
```

**Data Source**: NEC Table 310.15(B)(16), IEC 60364-5-52:2009

---

### StandardReference

Metadata about engineering standards used in calculations.

```typescript
interface StandardReference {
  id: string                    // E.g., "IEEE-485-2020"
  name: string                  // Full standard name
  organization: string          // IEEE, IEC, NEC, BS, NREL
  version: string               // Year or version number
  title: string                 // Standard title
  applicableCalculations: CalculationType[]  // Which calculations use this standard
  url: string | null            // Optional reference URL
}

const standards: StandardReference[] = [
  {
    id: "IEEE-485-2020",
    name: "IEEE 485-2020",
    organization: "IEEE",
    version: "2020",
    title: "Recommended Practice for Sizing Lead-Acid Batteries for Stationary Applications",
    applicableCalculations: ["battery"],
    url: "https://standards.ieee.org/standard/485-2020.html"
  },
  {
    id: "IEEE-1100-2020",
    name: "IEEE 1100-2020",
    organization: "IEEE",
    version: "2020",
    title: "Recommended Practice for Powering and Grounding Electronic Equipment (Emerald Book)",
    applicableCalculations: ["ups"],
    url: "https://standards.ieee.org/standard/1100-2020.html"
  },
  // ... (full list in lib/standards/references.ts)
]
```

---

## Data Relationships

```
User (1) ─────< (N) CalculationSession
User (1) ─────< (N) Project
Project (1) ───< (N) CalculationSession

CalculationSession (polymorphic types):
  - BatteryCalculation (inputs/results specific to battery)
  - UPSCalculation (inputs/results specific to UPS)
  - CableCalculation (inputs/results specific to cables)
  - SolarCalculation (inputs/results specific to solar)
```

**Anonymous User Flow**:
```
localStorage → CalculationSession (userId: null)
```

**Registered User Flow**:
```
User → CalculationSession (userId: <uuid>)
User → Project → CalculationSession (projectId: <uuid>)
```

**Migration Flow** (FR-016b):
```
localStorage CalculationSession (userId: null)
  → User registers
  → localStorage data migrated to PostgreSQL
  → CalculationSession updated (userId: <new-user-uuid>)
  → localStorage cleared
```

---

## State Transitions

### CalculationSession Lifecycle

```
1. DRAFT (unsaved)
   ↓ (user modifies inputs)
2. VALIDATING
   ↓ (validation completes)
3. VALID or INVALID
   ↓ (user clicks "Save" or auto-saves)
4. PERSISTED (localStorage or PostgreSQL)
   ↓ (registered user: 2 years retention)
5. EXPIRING (30-day warning before deletion)
   ↓ (30 days elapsed)
6. DELETED (permanent removal)
```

### User Account Lifecycle

```
1. REGISTERED (emailVerified: false)
   ↓ (user clicks email verification link)
2. VERIFIED (emailVerified: true)
   ↓ (user actively uses account)
3. ACTIVE
   ↓ (user requests deletion)
4. PENDING_DELETION (30-day grace period)
   ↓ (30 days elapsed or user cancels)
5. DELETED (hard delete) OR ACTIVE (cancellation)
```

---

## Data Migration Strategy

### localStorage → PostgreSQL Migration

When anonymous user registers (FR-016b):

```typescript
// lib/migrationService.ts
export async function migrateLocalStorageToDatabase(userId: string) {
  const storageKeys = ['electromate-battery', 'electromate-ups', 'electromate-cable', 'electromate-solar']

  for (const key of storageKeys) {
    const data = localStorage.getItem(key)
    if (!data) continue

    const { calculations } = JSON.parse(data) as LocalStorageCalculation

    // Bulk insert to PostgreSQL
    await db.calculationSessions.createMany({
      data: calculations.map(calc => ({
        ...calc,
        userId,  // Associate with new user
        id: crypto.randomUUID(),  // Generate new ID
      }))
    })

    // Clear localStorage after successful migration
    localStorage.removeItem(key)
  }
}
```

### Schema Versioning

localStorage schema includes version number for migrations:

```typescript
interface LocalStorageCalculation {
  calculations: CalculationSession[]
  version: number  // Current: 1
}

// Migration example (v1 → v2)
function migrateLocalStorageV1ToV2(data: any): LocalStorageCalculation {
  if (data.version === 1) {
    return {
      calculations: data.history,  // Renamed field
      version: 2
    }
  }
  return data
}
```

---

## Performance Considerations

### localStorage Quota Management

- **Typical quota**: 5-10MB per origin
- **Warning threshold**: 4MB (80% of 5MB)
- **SC-007 requirement**: Support 50+ calculation sessions

**Calculation size estimate**:
- Battery calculation: ~1KB (inputs + results + metadata)
- UPS calculation: ~2KB (multiple load items)
- Cable calculation: ~1.5KB (ampacity tables, derating)
- Solar calculation: ~1KB

**50 sessions storage**: ~75KB (well under 4MB limit)

### Database Indexes

```typescript
// Drizzle ORM indexes for query performance
export const calculationSessions = pgTable('calculation_sessions', {
  // ... columns ...
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  projectIdIdx: index('project_id_idx').on(table.projectId),
}))
```

**Query patterns**:
- Fetch calculations by user: `WHERE userId = ?` (indexed)
- Fetch calculations by project: `WHERE projectId = ?` (indexed)
- Fetch recent calculations: `ORDER BY createdAt DESC` (indexed)

---

## Data Retention Policy (FR-017a)

**Registered Users**:
- Calculations retained for **2 years** from creation date
- **30-day warning** before automatic deletion
- Email notification sent at 30-day mark
- User can export calculations before deletion

**Implementation**:
```typescript
// Background job (runs daily)
async function enforceRetentionPolicy() {
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  // Find calculations older than 2 years
  const oldCalculations = await db.calculationSessions.findMany({
    where: {
      createdAt: { lt: twoYearsAgo },
      deletionWarningsentAt: null,
    }
  })

  // Send deletion warnings
  for (const calc of oldCalculations) {
    await sendDeletionWarningEmail(calc.userId, calc.id)
    await db.calculationSessions.update({
      where: { id: calc.id },
      data: { deletionWarningSentAt: new Date() }
    })
  }

  // Delete calculations where warning sent >30 days ago
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  await db.calculationSessions.deleteMany({
    where: {
      deletionWarningSentAt: { lt: thirtyDaysAgo }
    }
  })
}
```

---

## Security Considerations

**Input Validation**: All user inputs validated with Zod schemas before database insertion

**SQL Injection Prevention**: Drizzle ORM uses parameterized queries (no raw SQL)

**Data Encryption**: Neon PostgreSQL provides encryption at rest and in transit (TLS 1.2+)

**Authentication**: BetterAuth manages password hashing (bcrypt), session tokens (JWT)

**Authorization**: API routes verify user ownership before returning calculation data

---

## Summary

This data model supports:
- ✅ Anonymous users with localStorage persistence (FR-015)
- ✅ Registered users with PostgreSQL storage (FR-017)
- ✅ Seamless migration between anonymous → registered (FR-016b)
- ✅ 2-year retention policy with deletion warnings (FR-017a)
- ✅ Modular calculation types (Battery, UPS, Cable, Solar)
- ✅ Optional project grouping for organization
- ✅ Standards compliance tracking (IEEE/IEC/NEC references)
- ✅ Safety validation warnings (Constitution Principle II)

**Next Steps**: Generate API contracts (OpenAPI specs) for calculation endpoints.

---

**Document Status**: Complete
**Last Updated**: 2025-12-24
**Next Phase**: Generate API contracts (contracts/ directory)
