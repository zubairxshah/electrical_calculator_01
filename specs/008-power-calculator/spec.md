# Specification: Active, Reactive & Apparent Power Calculator

**Feature ID**: 008-power-calculator  
**Priority**: P1 (Core Tool)  
**Standards**: IEC 60038, IEC 60364-5-52, NEC Article 220, NEC Article 430

---

## Executive Summary

Professional-grade web application for computing Active Power (P), Reactive Power (Q), and Apparent Power (S) for single-phase and three-phase electrical systems. Includes kVA/kW conversions, power factor corrections, and compliance verification per IEC and NEC standards.

---

## User Stories

### US1: Single-Phase Power Calculation (Priority: P1)

**As an** electrical engineer  
**I want to** calculate active, reactive, and apparent power for single-phase systems  
**So that** I can properly size conductors and protection devices

**Acceptance Criteria:**
- Given voltage (V), current (A), and power factor (cosφ)
- When I calculate for single-phase system
- Then display P (kW), Q (kVAR), S (kVA) with formulas
- And show IEC 60364-5-52 and NEC Article 220 references

**Example:**
```
Input:
- System: Single-phase
- Voltage: 230 V
- Current: 20 A
- Power Factor: 0.9

Output:
- Active Power (P): 4.14 kW
- Reactive Power (Q): 2.00 kVAR
- Apparent Power (S): 4.60 kVA
- Formula: P = V × I × cosφ
```

### US2: Three-Phase Power Calculation (Priority: P1)

**As an** electrical technician  
**I want to** calculate power for three-phase motor loads  
**So that** I can verify motor ratings and conductor sizing

**Acceptance Criteria:**
- Given line voltage (V), line current (A), and power factor
- When I calculate for three-phase system
- Then display P, Q, S using √3 formula
- And show IEC 60364 and NEC Article 430 references

**Example:**
```
Input:
- System: Three-phase
- Voltage: 400 V
- Current: 50 A
- Power Factor: 0.85

Output:
- Active Power (P): 29.44 kW
- Reactive Power (Q): 18.26 kVAR
- Apparent Power (S): 34.64 kVA
- Formula: P = √3 × V × I × cosφ
```

### US3: kVA to kW Conversion (Priority: P1)

**As an** engineer  
**I want to** convert between kVA and kW using power factor  
**So that** I can compare equipment ratings

**Acceptance Criteria:**
- Given apparent power (kVA) and power factor
- When I convert to active power
- Then show kW = kVA × cosφ
- And display power triangle visualization

### US4: Power Factor Correction (Priority: P2)

**As an** energy auditor  
**I want to** calculate required capacitor kVAR for power factor correction  
**So that** I can improve system efficiency

**Acceptance Criteria:**
- Given current PF and target PF
- When I calculate correction requirements
- Then show required capacitor kVAR
- And estimate efficiency improvement

### US5: Compliance Verification (Priority: P1)

**As an** inspector  
**I want to** verify calculations comply with IEC/NEC standards  
**So that** installations meet code requirements

**Acceptance Criteria:**
- Display applicable standard clauses
- Flag power factor < 0.85 as requiring correction
- Warn for unbalanced three-phase loads

---

## Technical Specifications

### Power Formulas

#### Single-Phase Systems
| Quantity | Formula | Unit |
|----------|---------|------|
| Active Power (P) | V × I × cosφ | kW |
| Reactive Power (Q) | V × I × sinφ | kVAR |
| Apparent Power (S) | V × I | kVA |
| Power Factor | cosφ = P/S | dimensionless |

#### Three-Phase Systems
| Quantity | Formula | Unit |
|----------|---------|------|
| Active Power (P) | √3 × V_L × I_L × cosφ | kW |
| Reactive Power (Q) | √3 × V_L × I_L × sinφ | kVAR |
| Apparent Power (S) | √3 × V_L × I_L | kVA |

Where:
- V = Voltage (volts)
- I = Current (amperes)
- cosφ = Power factor
- sinφ = √(1 - cos²φ)
- V_L = Line-to-line voltage
- I_L = Line current

### Standards References

| Standard | Clause | Description |
|----------|--------|-------------|
| IEC 60038 | - | Standard voltages (230V, 400V, etc.) |
| IEC 60364-5-52 | 524 | Current-carrying capacities |
| IEC 60364-1 | - | Fundamental principles |
| NEC Article 220 | - | Branch circuit and feeder calculations |
| NEC Article 430 | - | Motors and motor circuits |
| NEC Article 220.14 | - | Receptacle load calculations |

### Input Validation Rules

| Parameter | Min | Max | Unit | Notes |
|-----------|-----|-----|------|-------|
| Voltage | 100 | 1000 | V | Per IEC 60038 |
| Current | 0.1 | 10000 | A | |
| Power Factor | 0.1 | 1.0 | - | Lagging (inductive) |
| Frequency | 50 | 60 | Hz | Standard values |

### Output Precision

| Quantity | Decimal Places | Unit |
|----------|---------------|------|
| Active Power | 2 | kW |
| Reactive Power | 2 | kVAR |
| Apparent Power | 2 | kVA |
| Power Factor | 3 | - |
| Phase Angle | 2 | degrees |

---

## User Interface Requirements

### Input Form
- System type selector (Single-phase / Three-phase)
- Voltage input with unit selector (V)
- Current input with unit selector (A)
- Power factor input (0.1 - 1.0)
- Optional: Frequency selector (50/60 Hz)
- Calculate button
- Reset button

### Results Display
- Power triangle visualization (P, Q, S vector diagram)
- Numerical results card with units
- Formula breakdown section
- Compliance badges (IEC/NEC)
- Export to PDF button
- Save calculation button

### Visual Design
- Professional engineering aesthetic
- Color-coded results (P=green, Q=blue, S=orange)
- Responsive layout (desktop/tablet)
- Dark/light mode support

---

## API Contract

### POST /api/power-calculator/calculate

**Request:**
```json
{
  "systemType": "single-phase" | "three-phase",
  "voltage": 230,
  "current": 20,
  "powerFactor": 0.9,
  "frequency": 50
}
```

**Response:**
```json
{
  "activePower": 4.14,
  "reactivePower": 2.00,
  "apparentPower": 4.60,
  "powerFactor": 0.9,
  "phaseAngle": 25.84,
  "systemType": "single-phase",
  "formula": "P = V × I × cosφ",
  "standardReferences": ["IEC 60364-5-52", "NEC Article 220"],
  "complianceChecks": [
    {
      "standard": "IEC 60364-5-52",
      "requirement": "Power factor within acceptable range",
      "compliant": true
    }
  ],
  "warnings": [],
  "calculationTimestamp": "2026-02-23T..."
}
```

---

## Acceptance Tests

### AT-001: Single-Phase Reference Case
```
Given: V=230V, I=20A, PF=0.9, System=Single-phase
When: Calculate button clicked
Then:
  - Active Power = 4.14 kW (±0.01)
  - Reactive Power = 2.00 kVAR (±0.01)
  - Apparent Power = 4.60 kVA (±0.01)
  - Formula displayed: P = V × I × cosφ
  - Standard: IEC 60364-5-52 shown
```

### AT-002: Three-Phase Reference Case
```
Given: V=400V, I=50A, PF=0.85, System=Three-phase
When: Calculate button clicked
Then:
  - Active Power = 29.44 kW (±0.01)
  - Reactive Power = 18.26 kVAR (±0.01)
  - Apparent Power = 34.64 kVA (±0.01)
  - Formula displayed: P = √3 × V × I × cosφ
  - Standard: NEC Article 430 shown
```

### AT-003: Low Power Factor Warning
```
Given: PF=0.7 (below 0.85 threshold)
When: Calculate button clicked
Then:
  - Warning displayed: "Low power factor detected"
  - Recommendation: "Consider power factor correction"
```

### AT-004: kVA to kW Conversion
```
Given: S=100 kVA, PF=0.8
When: Convert to kW
Then:
  - P = 80 kW
  - Formula: kW = kVA × cosφ displayed
```

---

## Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Calculation latency | <50ms | Client-side |
| Page load time | <1s | First contentful paint |
| PDF generation | <2s | Export function |
| API response | <100ms | Server-side |

---

## Security Requirements

- Input validation on client and server
- No SQL injection vectors (parameterized queries)
- Rate limiting on API endpoint
- HTTPS required for production

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| mathjs | ^15.1.0 | High-precision calculations |
| jspdf | ^3.0.4 | PDF export |
| recharts | ^2.x | Power triangle visualization |
| lucide-react | ^0.562.0 | Icons |

---

## Out of Scope (Post-MVP)

- Power factor correction capacitor sizing (Phase 2)
- Harmonic analysis (Phase 3)
- Three-phase unbalanced load analysis (Phase 3)
- Historical data tracking (Phase 2)
- Multi-user collaboration (Phase 3)

---

**Spec Author**: AI Assistant  
**Date Created**: February 23, 2026  
**Review Status**: Ready for Implementation  
**Feature Lead**: TBD
