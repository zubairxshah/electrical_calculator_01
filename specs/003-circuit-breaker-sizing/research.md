# Phase 0 Research: Circuit Breaker Sizing Calculation Standards

**Research Date**: 2025-12-28
**Standards Covered**: NEC 2020, IEC 60364-5-52, IEEE standards
**Focus Areas**: Continuous load factors, derating tables, standard ratings, test case scenarios

---

## 1. NEC 210.20(A) - Continuous Load Requirements

### Regulatory Requirement
Per NEC Article 210.20(A), the overcurrent protective device (circuit breaker) rating for a branch circuit must not be less than 125% of the continuous load current.

### Formula Application
```
Minimum Breaker Size = Load Current × 1.25
```

**Example**:
- Load: 10 kW at 240V single-phase, PF = 0.9
- Load Current: I = P / (V × PF) = 10,000W / (240V × 0.9) = 46.3A
- Minimum Breaker Size: 46.3A × 1.25 = 57.9A
- **Recommended Standard Breaker**: 60A (next available rating ≥ 57.9A)

### Definition of Continuous Load
Per NEC Article 100, a continuous load is one where the maximum current is expected to continue for 3 hours or more.

### Safety Justification
The 125% factor accounts for:
1. **Breaker Trip Calibration Tolerance**: Breakers may not trip precisely at their rating; a margin is required to prevent false tripping
2. **Long-term Safe Operation**: Breakers designed to safely carry rated current indefinitely; continuous operation at rated current may cause heating
3. **Wire Heating Margin**: Conductor insulation life expectancy reduced at sustained rated current; 125% breaker provides margin below conductor ampacity
4. **Demand Factor Integration**: Not all loads operate at absolute peak simultaneously; 125% factor assumes continuous full load

### NEC Cross-References
- **NEC 210.19(A)(1)**: Conductor sizing (ampacity ≥ calculated load current per NEC Table 310.15(B)(16))
- **NEC 240.3**: Branch circuit overcurrent protection (breaker minimum 125%)
- **NEC 210.3**: Branch circuit naming (15A, 20A, 30A, 40A, 50A typical residential)

---

## 2. IEC 60364-5-52 Correction Factors

### Standard Overview
IEC 60364-5-52 defines rules for protecting conductors against thermal effects and current-carrying capacity (Iz) determination for low-voltage electrical installations.

### Correction Factor Concept
Unlike NEC's single 125% safety factor, IEC uses multiple correction factors (Ca, Cg, Cc) that adjust the cable's current-carrying capacity (Iz):

```
Allowable Circuit Current (I) = Iz × Ca × Cg × Cc × ... (other factors)
```

Where:
- **Iz**: Current-carrying capacity of cable in reference conditions
- **Ca**: Temperature correction factor
- **Cg**: Grouping correction factor
- **Cc**: Installation method correction factor
- **Cf**: Frequency correction factor (for AC, usually 1.0)

### Installation Methods (IEC 60364-5-52 Table B.52.1-B.52.5)

| Method | Description | Typical Application |
|--------|-------------|---------------------|
| **A1** | Single cable in free air | Overhead conductors |
| **A2** | Single cable on wall/support | Wall-mounted, in open air |
| **B1** | Multi-cable in conduit in free air | Grouped cables, outdoor |
| **B2** | Multi-cable in conduit on wall | Grouped cables, wall-mounted |
| **C** | Multi-cable in conduit in ground | Underground, in earth |
| **D** | Multi-cable in cable tray | Industrial installations, cable trays |
| **E** | Multi-cable in earthed metallic conduit | Special industrial (EMI protection) |
| **F** | Multi-cable in non-earthed metallic conduit | Special industrial |
| **G** | Multi-cable in open trays (not touching) | Industrial, open arrangement |

### Temperature Correction Factor (Ca)

Cable ampacity ratings are typically published for **20°C ambient or 30°C conductor temperature**. Actual installations often operate at higher ambient temperatures, requiring derating.

**IEC 60364-5-52 Table B.52.15 - Copper Cables (example for common temperatures)**:

| Ambient Temp | Ca Factor |
|--------|-----------|
| 10°C | 1.10 |
| 15°C | 1.05 |
| 20°C | 1.00 (reference) |
| 25°C | 0.95 |
| 30°C | 0.90 |
| 35°C | 0.85 |
| 40°C | 0.80 |
| 45°C | 0.76 |
| 50°C | 0.72 |
| 55°C | 0.68 |
| 60°C | 0.63 |

**Example**: Cable rated 63A at 30°C ambient, installed at 45°C:
- Derating: 63A × 0.76 = 47.9A (effectively 48A max)

### Grouping Correction Factor (Cg)

When multiple cables run in the same conduit/tray, heat from adjacent cables increases local temperature, reducing effective ampacity.

**IEC 60364-5-52 Table B.52.17 - Grouping Factor (cables in conduit)**:

| Number of Cables | Cg Factor |
|---------|-----------|
| 1 | 1.00 |
| 2 | 0.80 |
| 3 | 0.70 |
| 4 | 0.65 |
| 5-6 | 0.60 |
| 7-8 | 0.57 |
| 9+ | 0.50 |

**Example**: 30A circuit with 5 cables in same conduit:
- Derating: 30A × 0.60 = 18A (breaker must be ≤ 18A for safety)

### Installation Method Correction Factor (Cc)

Installation method affects cooling and heat dissipation of cables.

**IEC 60364-5-52 Table B.52.5-B.52.7 (example)**:

| Installation Method | Typical Cc | Notes |
|--------|---------|--------|
| Method A (open air) | 1.00 | Best cooling, no derating |
| Method B (wall, in conduit) | 0.70-0.85 | Moderate heat dissipation |
| Method C (in ground conduit) | 0.60-0.80 | Limited cooling, requires derating |
| Method D (cable tray) | 0.85-1.00 | Good cooling if spaced properly |

### Combined Derating Example

**Scenario**: 50A load at 400V three-phase, installed in conduit underground (Method C) with 6 other cables, ambient 45°C

**IEC 60364-5-52 Solution**:
1. Load current: 50A
2. Temperature factor: 0.76 (from Ca table for 45°C)
3. Grouping factor: 0.60 (from Cg table for 7 cables)
4. Installation method factor: 0.70 (Method C typical)
5. **Combined derating**: 1 / (0.76 × 0.60 × 0.70) = 1 / 0.32 = 3.125× multiplier needed
6. **Required Iz**: 50A × 3.125 = 156.25A (breaker must be ≥ 156A)

---

## 3. Standard Breaker Ratings Tables

### NEC Standard Breaker Ratings (UL 489)

**Standard ratings per NEC 240.6(A)**: 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000 amperes

**Common residential**: 15A, 20A, 30A, 40A, 50A, 60A, 100A, 200A (main breaker)
**Common commercial**: 100A-400A panels with various branch breaker combinations
**Common industrial**: 500A-4000A mains and feeder breakers

### IEC Standard Breaker Ratings (IEC 60898-1)

**Standard ratings per IEC 60898-1**: 6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000 amperes

**Common residential Europe**: 6A, 10A, 16A, 20A, 25A, 32A
**Common commercial Europe**: 40A-200A in 10A increments
**Common industrial Europe**: 250A-4000A in larger increments

### Key Difference: IEC Steps vs. NEC Steps

| Range | NEC Step | IEC Step | Note |
|-------|----------|----------|------|
| <50A | 5A | 2-3A | IEC finer resolution |
| 50-100A | 10A | 5-10A | Similar spacing |
| 100-400A | 50-100A | 50A | Similar spacing |
| >400A | 100-500A | 100A+ | NEC higher steps |

**Rounding Rule**: Always select the SMALLEST standard rating that is **≥** calculated minimum breaker size.

**Examples**:
- Calculated 47.3A → NEC: 50A | IEC: 50A
- Calculated 52.1A → NEC: 60A | IEC: 63A
- Calculated 158.7A → NEC: 175A | IEC: 160A

---

## 4. Derating Factor Application Methodology

### Derating Decision Tree

```
START: Load Current = I

├─ NEC Standard?
│  └─ Yes → Minimum Breaker = I × 1.25
│           Check for environmental factors (optional)
│           └─ High temperature (>40°C)?
│              └─ Yes → Apply temperature derating to CABLE
│                       Find cable size from NEC Table 310.15(B)(16)
│                       Apply temp factor from NEC Table 310.15(B)(2)(a)
│                       Find next larger cable size that meets I_required
│           └─ Multiple cables grouped?
│              └─ Yes → Apply grouping factor to CABLE ampacity
│                       from NEC Table 310.15(C)(1)
│                       Find next larger cable size
│           └─ Go to BREAKER SELECTION
│
└─ IEC Standard?
   └─ Yes → Allowable I = 1 / (Ca × Cg × Cc) × Load Current
            └─ Get reference Iz from IEC 60364-5-52 Table
            └─ Get Temperature factor Ca
            └─ Get Grouping factor Cg
            └─ Get Installation method factor Cc
            └─ Calculate: Breaker_Min = Load_I / (Ca × Cg × Cc)
            └─ Go to BREAKER SELECTION

BREAKER SELECTION:
├─ Find smallest standard rating ≥ Breaker_Min
├─ Check for short circuit capacity (optional)
│  └─ If fault current specified:
│     └─ Breaker kA rating must be ≥ fault current
│     └─ If not available, increase to next breaker size
└─ RETURN recommended breaker
```

### NEC vs. IEC Derating Comparison

| Factor | NEC Approach | IEC Approach |
|--------|--------|----------|
| **Continuous Load** | Apply 125% to breaker selection directly | No additional factor; design current already accounts for continuous duty |
| **Temperature Derating** | Applied to cable ampacity (NEC 310.15(B)(2)(a)) | Applied to cable (Ca factor) |
| **Grouping Derating** | Applied to cable ampacity (NEC 310.15(C)(1)) | Applied to cable (Cg factor) |
| **Installation Method** | Implicit in ampacity tables | Explicit correction factor (Cc) |
| **Result** | Breaker size determined after cable sizing | Breaker size determined from allowable I equation |

---

## 5. Short Circuit Capacity Determination

### Why Short Circuit Capacity Matters

A circuit breaker's **breaking capacity** (rated interrupting current, RIC) is the maximum fault current it can safely interrupt without catastrophic failure (explosion, Arc flash).

**If breaker breaking capacity < fault current, the breaker will fail during a fault.**

### Determining Fault Current

Fault current depends on:
1. **System source** (utility or generator): typically 10,000-50,000A at utility entrance
2. **Distance from source**: fault current decreases with distance/impedance
3. **Cable impedance**: larger cables = lower impedance = higher fault current
4. **System grounding**: affects available fault current

**Simplified calculation** (not for critical applications):

```
Fault Current (kA) = (System Voltage × 1000) / (R_source + R_cable + R_breaker)
```

### Standard Breaking Capacities (IEC 60898-1 & UL 489)

| Breaker Category | Breaking Capacity | Typical Application |
|--------|-------------|-----------|
| **Residential** | 10 kA | Single-family homes, local distribution |
| **Commercial** | 14-25 kA | Commercial buildings, offices |
| **Industrial** | 35-50 kA | Manufacturing facilities |
| **High-Capacity** | 65-100 kA | Large industrial, utility substations |

### Selection Rule

**Breaker breaking capacity ≥ available fault current at installation point**

**Example**:
- Fault current: 15 kA
- Calculated breaker: 50A
- Options:
  - 50A @ 10 kA breaking capacity → **UNSAFE** (10 < 15)
  - 50A @ 25 kA breaking capacity → **SAFE** (25 > 15)

### Design Considerations

1. **De-rating Near Breaker**: Fault current is highest at breaker location, decreases at load
2. **Cable Size Impact**: Larger cables = lower impedance = higher fault current at breaker
3. **Multiple Paths**: If multiple feeders present, sum their fault currents
4. **Transient Stability**: Some breakers rated for symmetrical vs. asymmetrical fault currents (IEC 60898-1 distinction)

---

## 6. Trip Curve Recommendations

### Trip Curve Purpose

Circuit breakers must distinguish between:
- **Inrush currents** (motor starting, transformer energization): brief, high current, should NOT trip
- **Overload currents** (sustained overload): sustained, should trip to protect wire
- **Short circuit/fault currents**: very high, instantaneous trip required

Trip curves define the time-current relationship: "How long can current stay above rating before breaker trips?"

### IEC 60898-1 Trip Curves

IEC defines trip curves by **instantaneous trip threshold multiple (In)**:

| Type | Trip Range | Application | Example Inrush Tolerance |
|------|---------|----------|-----------|
| **Type B** | 3-5× In | Residential, lighting | Low inrush (good for residential wire protection) |
| **Type C** | 5-10× In | Mixed loads, industrial circuits | Medium inrush (typical commercial) |
| **Type D** | 10-20× In | Motor, transformer circuits | High inrush (motor starting: 6-8× typical) |
| **Type K** | 8-12× In | Industrial circuits with high inrush | Specialized (offshore, mining) |
| **Type Z** | 2-3× In | Electronics, sensitive equipment | Very low inrush (semiconductor protection) |

**Example**: 30A Type C breaker
- Trip threshold: 5-10 × 30A = 150-300A
- Inrush <150A → breaker won't trip (safely passes motor starting)
- Sustained >300A → breaker trips (protects wire and equipment)

### NEC Trip Mechanism Recommendations

NEC doesn't explicitly define "trip curves" but describes two common types:

| Type | Description | Application |
|------|----------|----------|
| **Thermal-Magnetic** | Thermal element for overload (slow), magnetic element for fault (fast) | Standard residential, commercial |
| **Electronic Trip** | Microprocessor-based, adjustable thresholds and time delays | Industrial, critical circuits, load shedding |

**Thermal-Magnetic Advantages**:
- Simple, reliable, no power required
- Fixed characteristics (predictable behavior)
- Lower cost

**Electronic Trip Advantages**:
- Adjustable settings (customizable for specific loads)
- Selective coordination capability
- Monitoring and diagnostics
- Remote control options

### Breaker Type Selection Logic

**For Resistive Loads** (heating, lighting, resistive loads):
- Recommendation: Type B (IEC) or Standard Thermal-Magnetic (NEC)
- Rationale: No inrush, steady current, wire protection priority

**For Inductive Loads** (motors, transformers):
- Recommendation: Type C-D (IEC) or Thermal-Magnetic with magnetic adjustment (NEC)
- Rationale: High starting current (6-10× rated), need to allow inrush without nuisance trip
- **Motor Duty**: Type D preferred for motors >3 kW (IEC) or adjustable magnetic (NEC)

**For Mixed Loads**:
- Recommendation: Type C (IEC) or Standard Thermal-Magnetic (NEC)
- Rationale: Compromise between residential and industrial; 5-10× inrush capability

**For Sensitive Loads** (electronics, VFDs, sensitive controls):
- Recommendation: Type Z (IEC, rare) or Electronic Trip (NEC)
- Rationale: Very low inrush tolerance; requires specialized breaker

---

## 7. Voltage Drop Integration

### Voltage Drop Formula

The voltage drop in a circuit depends on:
- **Load current (I)**: measured in amperes
- **Conductor resistance (R)**: measured in ohms, depends on length and wire size
- **Power factor (PF)**: for three-phase, affects reactive component
- **Conductor material**: copper (R) vs. aluminum (1.68× higher R)

**Voltage Drop (DC or resistive)**: VD% = (I × R × L) / (V × 10)

Where:
- I = load current (A)
- R = conductor resistance per 1000 feet (Ω/1000 ft) from NEC Table 8
- L = circuit length (one-way feet)
- V = system voltage (volts)

**Example**: 30A at 240V single-phase, 150 feet, #6 AWG copper (R = 0.396 Ω/1000 ft):
```
VD% = (30 × 0.396 × 150) / (240 × 10) = 1782 / 2400 = 0.7425% ✓ (acceptable, <3%)
```

### NEC Voltage Drop Limits

Per NEC Article 210.19(A) informational note:

- **Branch circuit**: ≤ 3% voltage drop
- **Feeder circuit**: ≤ 3% voltage drop
- **Combined branch + feeder**: ≤ 5% voltage drop

**Rationale**:
- Equipment efficiency drops significantly above 5% voltage drop
- Motor starting torque reduces proportionally to (V²) relationship
- Lighting brightness affected; LEDs may fail

### Voltage Drop Warning Thresholds (for tool)

- **< 1%**: No warning; excellent design
- **1-3%**: INFO warning; acceptable per NEC, but may affect efficiency
- **3-5%**: YELLOW warning; exceeds NEC branch circuit limit; should consider larger cable
- **> 5%**: RED warning; exceeds NEC combined limit; must use larger cable

### Cable Size Recommendation Algorithm

When voltage drop exceeds acceptable limit, recommend next larger cable size:

```
VD% = (I × R × L) / (V × 10)

IF VD% > VD_limit THEN:
    Next_Cable_Size = Current_Size + 1 (AWG) or +mm²
    Recalculate VD% with new resistance
    IF VD% still > limit THEN
        repeat with next larger size
```

**Example**: 50A at 400V three-phase (2-wire), 200 meters, #6 AWG (0.654 Ω/km):
```
VD% = (50 × 0.654 × 0.2) / (400 × 1.73) = 6.54 / 692 = 0.95%
(Acceptable)

IF load increases to 80A:
VD% = (80 × 0.654 × 0.2) / (400 × 1.73) = 10.46 / 692 = 1.51%
(Still acceptable)

IF load increases to 120A:
VD% = (120 × 0.654 × 0.2) / (400 × 1.73) = 15.70 / 692 = 2.27%
(Getting close; recommend larger cable)

Next cable size (#4 AWG, R = 0.411 Ω/km):
VD% = (120 × 0.411 × 0.2) / (400 × 1.73) = 9.86 / 692 = 1.42%
(Acceptable with larger cable)
```

### Voltage Drop Data Sources

**NEC Chapter 9, Table 8** (Conductor Properties):
- Lists resistance per 1000 feet (at 75°C) for all AWG sizes
- Copper: standard material
- Aluminum: 1.68× higher resistance for same physical size

**IEC 60228** (Wire Cross-Sectional Standards):
- Lists mm² nominal sizes: 0.5, 0.75, 1.0, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240 mm²
- Resistance values at 20°C (convert to 75°C operating for accurate calculation)

---

## 8. localStorage History Strategy

### Design Rationale

**Why localStorage?**
- Persistent across browser sessions (survives page reload, browser close)
- No backend required (respects user privacy, reduces server load)
- Simple FIFO eviction policy (50-entry limit manageable)
- Supports anonymous users without authentication

**Limitations**:
- ~5MB quota per domain (sufficient for 50 calculations ~5-10kB each)
- Lost if browser data cleared or user switches browser/device
- Not suitable for unlimited history (users expecting cloud sync should register)

### Storage Schema

```typescript
interface CalculationHistoryEntry {
  id: string;                          // UUID for retrieval
  timestamp: ISO8601;                  // When calculated
  standard: 'NEC' | 'IEC';             // Selected standard

  // Circuit Configuration
  voltage: number;                     // Volts
  phase: 'single' | 'three';           // Phase type
  loadInput: number;                   // kW or A (depends on mode)
  loadMode: 'kw' | 'amps';             // Input mode
  powerFactor: number;                 // 0.5-1.0

  // Optional: Environmental Factors
  temperature?: number;                // Ambient °C
  groupedCables?: number;              // Count in conduit
  installationMethod?: 'A1'|'A2'|'B1'|'B2'|'C'|'D'|'E'|'F'|'G';
  circuitDistance?: number;            // Meters or feet

  // Optional: Short Circuit
  shortCircuitCurrent?: number;        // kA

  // Calculation Results
  loadCurrent: number;                 // Calculated A
  safetyFactor: number;                // 1.25 (NEC) or 1.0 (IEC)
  minimumBreakerSize: number;          // Calculated A
  recommendedBreaker: number;          // Standard A

  // Derating (if applied)
  deatingFactors?: {
    temperature: number;               // Ca factor
    grouping: number;                  // Cg factor
    installationMethod: number;        // Cc factor
    combined: number;                  // Product of all
  };

  // Voltage Drop (if calculated)
  voltageDrop?: {
    percentage: number;                // VD%
    warning: boolean;                  // If > 3%
  };

  // Project Info (optional)
  projectName?: string;
  projectLocation?: string;
  engineerName?: string;
  notes?: string;
}
```

### FIFO Eviction Algorithm

```typescript
function saveCalculationToHistory(entry: CalculationHistoryEntry) {
  // 1. Retrieve current history from localStorage
  let history = JSON.parse(
    localStorage.getItem('breaker_calculation_history') || '[]'
  );

  // 2. Check if at capacity (50 entries)
  if (history.length >= 50) {
    // 3a. Remove oldest entry (index 0)
    history.shift();
  }

  // 3b. Add new entry to end
  entry.id = generateUUID();
  entry.timestamp = new Date().toISOString();
  history.push(entry);

  // 4. Save back to localStorage
  localStorage.setItem(
    'breaker_calculation_history',
    JSON.stringify(history)
  );
}
```

### Error Handling

```typescript
function saveCalculationWithFallback(entry: CalculationHistoryEntry) {
  try {
    saveCalculationToHistory(entry);
    logInfo('Calculation saved to history');
  } catch (e) {
    // localStorage full or disabled
    if (e instanceof QuotaExceededError) {
      logWarn('localStorage quota exceeded; history not saved');
      showUserWarning('Calculation history full. Clearing oldest entries...');
      // Aggressively clear: remove 10 oldest entries instead of 1
      let history = JSON.parse(localStorage.getItem('...') || '[]');
      history.splice(0, 10);
      localStorage.setItem('...', JSON.stringify(history));
      // Retry save
      try {
        saveCalculationToHistory(entry);
      } catch {
        logError('Failed to save history even after cleanup');
      }
    } else if (e instanceof SecurityError) {
      logWarn('localStorage not available (may be disabled or in private mode)');
      // Continue without history; calculation still processes
    }
  }
}
```

### Retrieval and Comparison

```typescript
// Load history for display
function loadCalculationHistory(): CalculationHistoryEntry[] {
  try {
    return JSON.parse(
      localStorage.getItem('breaker_calculation_history') || '[]'
    ).sort((a, b) => {
      // Sort by timestamp, newest first
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  } catch {
    logError('Failed to load history');
    return [];
  }
}

// Retrieve specific calculation
function getCalculationById(id: string): CalculationHistoryEntry | null {
  const history = loadCalculationHistory();
  return history.find(entry => entry.id === id) || null;
}

// Delete calculation from history
function deleteCalculation(id: string) {
  let history = JSON.parse(localStorage.getItem('...') || '[]');
  history = history.filter((entry: any) => entry.id !== id);
  localStorage.setItem('...', JSON.stringify(history));
  logInfo(`Deleted calculation: ${id}`);
}
```

---

## 9. Console Logging Structure

### Logging Rationale

Console logging enables:
1. **Developer debugging**: Troubleshoot calculation errors, edge cases
2. **User support**: Customers share console logs with support team for diagnosis
3. **Performance monitoring**: Identify slow calculations or validation delays
4. **Audit trail**: Record validation failures, warnings generated

### Log Format Specification

```typescript
interface LogEntry {
  timestamp: ISO8601;                  // When occurred
  level: 'DEBUG'|'INFO'|'WARN'|'ERROR';  // Severity
  component: string;                  // Module (e.g., 'BreakerCalculator', 'DeratingSidebar')
  message: string;                    // Primary message
  context?: Record<string,any>;       // Additional data
}
```

### Log Levels and Usage

**ERROR**: Calculation failures, validation errors, critical issues
```typescript
logger.error('BreakerCalculator', 'Invalid voltage input', {
  userInput: 1500,
  validRange: [100, 1000],
  error: 'exceeds maximum 1000V'
});
```

**WARN**: Edge cases, unusual parameters, performance concerns
```typescript
logger.warn('DeratingSidebar', 'Extreme temperature triggers special equipment need', {
  ambientTemp: 65,
  note: 'Breaker may require forced-air cooling'
});
```

**INFO**: Normal calculation flow, mode switches, standard changes
```typescript
logger.info('BreakerCalculator', 'Standard switched', {
  from: 'NEC',
  to: 'IEC',
  recalculationTime: '45ms'
});
```

**DEBUG**: Detailed calculation steps (for developers only; disabled in production)
```typescript
logger.debug('Calculator', 'Load current calculation', {
  power: 10000,
  voltage: 240,
  phase: 'single',
  powerFactor: 0.9,
  calculatedCurrent: 46.3,
  formula: 'I = P / (V × PF)'
});
```

### Implementation

```typescript
// logger.ts
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logBuffer: LogEntry[] = [];

  log(level: LogLevel, component: string, message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      context
    };

    // Store in buffer (limit to 100 entries to prevent memory bloat)
    this.logBuffer.push(entry);
    if (this.logBuffer.length > 100) {
      this.logBuffer.shift();
    }

    // Console output (with filtering)
    if (this.isDevelopment || level !== LogLevel.DEBUG) {
      const color = this.getColorForLevel(level);
      console.log(
        `%c[${entry.timestamp}] [${level}] [${component}] ${message}`,
        `color: ${color}; font-weight: bold;`,
        context || ''
      );
    }
  }

  debug(component: string, message: string, context?: any) {
    this.log(LogLevel.DEBUG, component, message, context);
  }

  info(component: string, message: string, context?: any) {
    this.log(LogLevel.INFO, component, message, context);
  }

  warn(component: string, message: string, context?: any) {
    this.log(LogLevel.WARN, component, message, context);
  }

  error(component: string, message: string, context?: any) {
    this.log(LogLevel.ERROR, component, message, context);
  }

  // For user support: export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '#888';
      case LogLevel.INFO: return '#00A';
      case LogLevel.WARN: return '#FA0';
      case LogLevel.ERROR: return '#F00';
    }
  }
}

export const logger = new Logger();
```

### Sensitive Data Filtering

Logs MUST NOT contain:
- Project names or customer identifiers
- Engineer names or contact info
- Proprietary load information
- Specific equipment details that could identify a site

Logs CAN contain:
- Voltage values
- Phase type (single/three)
- Load current (anonymized)
- Standard selection (NEC/IEC)
- Calculation timing and validation results

---

## 10. 50+ Test Case Scenarios

### Test Case Organization

Test cases are organized by category, covering nominal, boundary, edge, and error conditions for both NEC and IEC standards.

### Category 1: Basic NEC Breaker Sizing (Single-Phase)

| # | Load (kW) | Voltage | PF | Expected Current | Expected Min Breaker | Expected Recommended | Notes |
|---|-----------|---------|----|--------------------|---------------------|---------------------|----|
| 1 | 2.0 | 120V | 1.0 | 16.7A | 20.8A | **20A** | Basic residential |
| 2 | 5.0 | 120V | 0.95 | 55.3A | 69.1A | **70A** | Higher load |
| 3 | 10.0 | 240V | 0.9 | 46.3A | 57.9A | **60A** | Reference case |
| 4 | 15.0 | 240V | 0.85 | 73.5A | 91.9A | **100A** | Near standard gap |
| 5 | 5.0 | 208V | 0.9 | 26.9A | 33.6A | **40A** | Common commercial |
| 6 | 7.5 | 208V | 0.95 | 41.0A | 51.3A | **50A** | Mixed load |
| 7 | 3.0 | 480V | 1.0 | 6.25A | 7.8A | **10A** (IEC) or **15A** (NEC) | High voltage, low current |

### Category 2: Basic NEC Breaker Sizing (Three-Phase)

| # | Load (kW) | Voltage | PF | Expected Current | Expected Min Breaker | Expected Recommended | Notes |
|---|-----------|---------|----|--------------------|---------------------|---------------------|----|
| 8 | 10.0 | 208V | 0.9 | 33.6A | 42.0A | **50A** | Three-phase baseline |
| 9 | 25.0 | 208V | 0.85 | 80.3A | 100.4A | **110A** | Boundary: just over 100A |
| 10 | 50.0 | 400V | 0.9 | 80.3A | 100.4A | **110A** | Common industrial 400V |
| 11 | 75.0 | 400V | 0.9 | 120.4A | 150.5A | **150A** | Larger industrial |
| 12 | 100.0 | 480V | 0.9 | 133.8A | 167.3A | **175A** | High-rise riser |

### Category 3: IEC Standard Sizing

| # | Load (A) | Voltage | Notes | Expected Recommended | Correction Factors |
|---|----------|---------|-------|---------------------|----|
| 13 | 16A | 230V single | Residential baseline | **16A** | None (Ca=1.0, Cg=1.0) |
| 14 | 32A | 230V single | Moderate load | **32A** | None |
| 15 | 50A | 400V three | Industrial baseline | **50A** | None |
| 16 | 80A | 400V three | High load | **80A** | None |

### Category 4: Temperature Derating (NEC)

| # | Load | Base Ampacity | Ambient Temp | Expected Derating | Notes |
|---|------|----------------|--------|---------|--------|
| 17 | 30A @ 120V | 30A | 40°C | 30A × 0.8 = 24A | Per NEC 310.15(B)(2)(a) |
| 18 | 50A @ 240V | 50A | 50°C | 50A × 0.66 = 33A | Extreme heat |
| 19 | 20A @ 120V | 20A | 10°C | 20A × 1.08 = 21.6A | Cold environment (unusual) |

### Category 5: Grouping Derating (NEC)

| # | Cable Size | Base Ampacity | Grouped | Expected Derating | Notes |
|---|----------|------------|---------|---------|---------|
| 20 | #6 AWG | 65A | 3 cables | 65A × 0.7 = 45.5A | NEC Table 310.15(C)(1) |
| 21 | #2 AWG | 130A | 6 cables | 130A × 0.6 = 78A | Heavier grouping |
| 22 | #1/0 AWG | 170A | 9+ cables | 170A × 0.5 = 85A | Severe grouping |

### Category 6: Combined Derating (NEC + IEC)

| # | Load | Temp | Grouping | Expected Breaker Size | Notes |
|---|------|------|----------|--------|---------|
| 23 | 50A @ 240V | 50°C | 4 cables | 50A × 1.25 × 1.41 (inverse derating) = 88A → 90A | Multiple factors combined |
| 24 | 100A @ 400V 3-phase | 45°C | 7 cables | IEC: Apply Ca=0.76, Cg=0.57 combined | Complex industrial |

### Category 7: Voltage Drop Analysis

| # | Current | Voltage | Distance | Wire Size | Expected VD% | Expected Warning | Notes |
|---|---------|---------|----------|-----------|-------|---------|---------|
| 25 | 20A | 240V single | 100 ft | #12 AWG | 2.0% | None | Good design |
| 26 | 40A | 240V single | 100 ft | #8 AWG | 1.5% | None | Acceptable |
| 27 | 50A | 240V single | 200 ft | #10 AWG | 4.2% | YELLOW WARN | Exceeds 3% |
| 28 | 30A | 240V single | 300 ft | #6 AWG | 3.5% | YELLOW WARN | At limit |
| 29 | 100A | 400V 3-phase | 100m | 16mm² | 4.1% | YELLOW WARN | Industrial, over limit |
| 30 | 50A | 400V 3-phase | 50m | 10mm² | 1.2% | None | Good design |

### Category 8: Short Circuit Capacity

| # | Breaker Size | Fault Current | Breaking Capacity | Safe? | Notes |
|---|-------------|---------|----------|-------|---------|
| 31 | 50A | 10 kA | 10 kA | ✓ YES | Adequate |
| 32 | 50A | 25 kA | 10 kA | ✗ NO | Unsafe - breaker will fail |
| 33 | 100A | 35 kA | 35 kA | ✓ YES | Industrial, barely adequate |
| 34 | 200A | 50 kA | 50 kA | ✓ YES | Large industrial |
| 35 | 30A | 5 kA | 10 kA | ✓ YES | Residential, safe margin |

### Category 9: Breaker Type Recommendations

| # | Load Type | Standard | Inrush | Recommended Type | Notes |
|---|-----------|----------|--------|-----------------|---------|
| 36 | Lighting | IEC | Minimal | **Type B** | No inrush |
| 37 | Heating | IEC | Minimal | **Type B** | Resistive load |
| 38 | Mixed load | IEC | Moderate | **Type C** | 5-10× inrush tolerance |
| 39 | Motor 5.5 kW | IEC | 6-8× | **Type D** | High inrush, 10-20× tolerance |
| 40 | Motor 7.5 kW | NEC | 6-8× | Adjustable magnetic trip | Similar to Type D in NEC |
| 41 | Transformer | IEC | 8-12× | **Type D** | Transformer inrush |

### Category 10: Edge Cases (Unusual Inputs)

| # | Parameter | Value | Expected Behavior | Notes |
|---|-----------|-------|---------|---------|
| 42 | Voltage | 380V | Accepts; calculates correctly | Not standard but used in some countries |
| 43 | Voltage | 415V | Accepts; calculates correctly | Common in EU/Asia |
| 44 | Voltage | 1000V (limit) | Accepts; calculates correctly | At upper limit |
| 45 | Voltage | 50V (below range) | ERROR - below 100V minimum | Input validation |
| 46 | Power Factor | 0.5 (low) | Calculates; warns about PF correction | Very low, industrial |
| 47 | Power Factor | 0.95 | Standard commercial | No warning |
| 48 | Temperature | -20°C | Accepts; may apply upgrade derating | Cold climate |
| 49 | Temperature | 70°C (max) | Accepts; strong warning for special equipment | Extreme heat |
| 50 | Distance | 0.5m (very short) | Accepts; VD% negligible (<0.1%) | Suppresses warning |
| 51 | Distance | 500m (very long) | Accepts; calculates large VD%, recommends larger cable | Rural/underground |
| 52 | Load | 0.001 kW (very small) | Calculates; unusual but valid | Precision test |
| 53 | Load | 10,000 kW (very large) | Calculates; likely exceeds standard breaker ratings | Unusual utility-scale |

### Test Case Validation Criteria

Each test case is validated by:
1. **Formula verification**: Manual calculation using published formulas
2. **Standard reference**: Comparison to NEC tables, IEC 60364 examples
3. **Peer review**: Electrical engineering professional review
4. **Boundary analysis**: Verify behavior at rating limits and transitions

---

## Standards Summary Table

| Standard | Continuous Load Factor | Temperature Derating | Grouping Derating | Installation Method | Breaker Ratings | Typical Usage |
|----------|----------|----------|----------|----------|----------|----------|
| **NEC 2020** | 125% | Yes (Table 310.15(B)(2)(a)) | Yes (Table 310.15(C)(1)) | Implicit in ampacity | 15-4000A (gaps) | USA, Canada |
| **IEC 60364-5-52** | No explicit | Yes (Ca factor) | Yes (Cg factor) | Explicit (Cc factor) | 6-4000A (finer steps) | Europe, Asia, International |

---

**Research Status**: COMPLETE
**Last Updated**: 2025-12-28
**Ready for Phase 1**: Yes - All standards documented, test cases defined, reference calculations established
