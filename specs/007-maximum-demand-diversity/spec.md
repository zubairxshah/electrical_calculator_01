# Maximum Demand & Diversity Calculator

**Feature ID**: 007-maximum-demand-diversity  
**Status**: 📝 Specification  
**Priority**: P0 (Core Engineering Feature)  
**Date**: February 22, 2026

---

## Executive Summary

The Maximum Demand & Diversity Calculator enables electrical engineers to accurately calculate maximum demand for electrical installations by applying appropriate demand factors and diversity factors per **IEC 60364** and **NEC Article 220** standards. This is a fundamental calculation required for:
- Service entrance sizing
- Feeder and branch circuit design
- Transformer sizing
- Main breaker selection

---

## User Stories

### User Story 1: Calculate Maximum Demand for Residential Projects (P0)
**As an** electrical engineer  
**I want to** input connected loads for a residential project and apply IEC/NEC diversity factors  
**So that** I can determine the maximum demand for service sizing

**Acceptance Criteria:**
- [ ] User can select project type: Residential
- [ ] User can input connected loads for categories:
  - Lighting load (kW)
  - Socket outlets/receptacles (kW)
  - HVAC systems (kW)
  - Cooking appliances (kW)
  - Water heating (kW)
  - Other appliances (kW)
- [ ] System applies IEC 60364-5-52 diversity factors:
  - Lighting: 100% (no diversity)
  - Socket outlets: 40% (60% diversity)
  - HVAC: 80% (20% diversity)
  - Cooking appliances: 70% (30% diversity)
  - Water heating: 100% (continuous load)
- [ ] System applies NEC Article 220 demand factors:
  - First 3 kVA at 100%
  - Remainder at 35% (dwelling units)
- [ ] Output shows:
  - Total connected load (kW/kVA)
  - Applied diversity factor (%)
  - Maximum demand (kW/kVA)
  - Compliance note with standard clause
- [ ] Example calculation matches expected output (see Practical Examples)

### User Story 2: Calculate Maximum Demand for Commercial Projects (P0)
**As an** electrical engineer  
**I want to** calculate maximum demand for commercial buildings with appropriate demand factors  
**So that** I can size service equipment correctly

**Acceptance Criteria:**
- [ ] User can select project type: Commercial
- [ ] Load categories include:
  - General lighting (kW/m² or total kW)
  - Receptacle loads (kW)
  - HVAC systems (kW)
  - Elevators/escalators (kW)
  - Kitchen equipment (kW)
  - Special equipment (kW)
- [ ] System applies NEC Article 220 commercial demand factors:
  - Lighting: 100% for first 12.5 kVA, then scaling
  - Receptacles: 100% for first 10 kVA, 50% for remainder
  - HVAC: 100% of largest system + 25% of others
  - Kitchen equipment: 65-90% based on quantity
- [ ] IEC commercial factors available:
  - Office buildings: 70-80% overall diversity
  - Retail: 80-90% overall diversity
- [ ] Output includes demand factor breakdown by category

### User Story 3: Calculate Maximum Demand for Industrial Projects (P0)
**As an** electrical engineer  
**I want to** calculate maximum demand for industrial facilities  
**So that** I can design appropriate electrical distribution systems

**Acceptance Criteria:**
- [ ] User can select project type: Industrial
- [ ] Load categories include:
  - Motor loads (kW/kVA with power factor)
  - Process equipment (kW)
  - Lighting (kW)
  - HVAC/ventilation (kW)
  - Welding equipment (kVA)
  - Control systems (kW)
- [ ] System applies industrial demand factors:
  - Motors: 100% of largest + 75% of remainder
  - Continuous loads: 125% factor (NEC)
  - Intermittent loads: 50-75% based on duty cycle
  - Welding equipment: 70-85% based on duty cycle
- [ ] Motor diversity considerations:
  - Not all motors run simultaneously
  - Peak demand vs. average demand
- [ ] Output includes:
  - Connected load
  - Maximum demand
  - Peak vs. average demand
  - Recommended transformer size

### User Story 4: Generate Compliance Report (P1)
**As an** electrical engineer  
**I want to** export a PDF report with calculation details and compliance references  
**So that** I can document my design for approval and audits

**Acceptance Criteria:**
- [ ] PDF includes all input parameters
- [ ] PDF shows calculation breakdown by category
- [ ] PDF includes IEC/NEC clause references
- [ ] PDF includes compliance verification
- [ ] PDF includes engineer signature block
- [ ] PDF generation completes in <2 seconds

### User Story 5: Save and Load Projects (P1)
**As an** electrical engineer  
**I want to** save my calculations and reload them later  
**So that** I can iterate on designs and maintain project records

**Acceptance Criteria:**
- [ ] User can save calculation with project name
- [ ] User can load saved calculations
- [ ] User can duplicate existing projects
- [ ] User can delete saved projects
- [ ] Calculations persist across sessions

---

## Standards Compliance

### IEC 60364 References

| Standard | Clause | Subject | Diversity Factor |
|----------|--------|---------|------------------|
| IEC 60364-5-52 | 524 | Current-carrying capacities | Reference for cable sizing after demand calc |
| IEC 60364-4-43 | 433 | Overload protection | Coordination with demand calculations |
| IEC 60364-1 | 131 | Fundamental principles | Basis for diversity application |
| IEC 60050 | 826 | Electrical installations | Definitions |

**IEC Default Diversity Factors (Residential):**
| Load Category | Diversity Factor | Applied Factor | Notes |
|--------------|------------------|----------------|-------|
| Lighting | 0% | 100% | No diversity applied |
| Socket Outlets | 60% | 40% | General purpose outlets |
| HVAC | 20% | 80% | Air conditioning, heating |
| Cooking | 30% | 70% | Ranges, ovens, cooktops |
| Water Heating | 0% | 100% | Continuous load |
| Other Appliances | 40% | 60% | Washers, dryers, etc. |

### NEC Article 220 References

| Standard | Clause | Subject | Demand Factor |
|----------|--------|---------|---------------|
| NEC 220.12 | - | General Lighting | Table 220.12 unit loads |
| NEC 220.42 | - | Dwelling Lighting | 100% first 3kVA, 35% remainder |
| NEC 220.44 | - | Receptacle Loads | 100% first 10kVA, 50% remainder |
| NEC 220.50 | - | Motor Loads | 125% largest + 100% others |
| NEC 220.55 | - | Cooking Equipment | Table 220.55 demand factors |
| NEC 220.82 | - | Optional Dwelling Calc | Specific method for dwellings |
| NEC 220.84 | - | Multi-family Dwelling | Table 220.84 demand factors |

**NEC Demand Factors (Dwelling Units - Optional Method):**
| Load Type | First Portion | Remainder |
|-----------|---------------|-----------|
| General Lighting/Receptacles | 100% (first 10 kVA) | 40% |
| Cooking Equipment | Per Table 220.55 | - |
| HVAC | 100% (largest of heating/cooling) | - |
| Water Heater | 100% | - |
| Dryer | 100% (5kW minimum) | - |

---

## Technical Architecture

### Components

| Component | File Path | Purpose |
|-----------|-----------|---------|
| CalculatorForm | `src/components/demand-diversity/CalculatorForm.tsx` | Input form with dynamic fields |
| ResultsDisplay | `src/components/demand-diversity/ResultsDisplay.tsx` | Results with breakdown |
| ComplianceTable | `src/components/demand-diversity/ComplianceTable.tsx` | Standards compliance display |
| ReportPreview | `src/components/demand-diversity/ReportPreview.tsx` | PDF preview |
| ProjectList | `src/components/demand-diversity/ProjectList.tsx` | Saved projects list |

### Services

| Service | File Path | Purpose |
|---------|-----------|---------|
| calculationEngine | `src/services/demand-diversity/calculationEngine.ts` | Core calculation logic |
| IECFactors | `src/services/demand-diversity/IECFactors.ts` | IEC diversity factors |
| NECFactors | `src/services/demand-diversity/NECFactors.ts` | NEC demand factors |
| validation | `src/services/demand-diversity/validation.ts` | Input validation |
| pdfGenerator | `src/services/demand-diversity/pdfGenerator.ts` | PDF report generation |
| projectStorage | `src/services/demand-diversity/projectStorage.ts` | Save/load projects |

### Models

| Model | File Path | Purpose |
|-------|-----------|---------|
| DemandCalculationParameters | `src/models/DemandCalculationParameters.ts` | Input parameters |
| DemandCalculationResult | `src/models/DemandCalculationResult.ts` | Calculation results |
| LoadCategory | `src/models/LoadCategory.ts` | Load category definitions |
| ProjectData | `src/models/ProjectData.ts` | Saved project structure |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/demand-diversity/calculate` | POST | Perform demand calculation |
| `/api/demand-diversity/save` | POST | Save project |
| `/api/demand-diversity/load/:id` | GET | Load saved project |
| `/api/demand-diversity/list` | GET | List saved projects |
| `/api/demand-diversity/delete/:id` | DELETE | Delete project |
| `/api/demand-diversity/generate-report` | POST | Generate PDF report |

---

## Data Models

### DemandCalculationParameters

```typescript
interface DemandCalculationParameters {
  projectName: string;
  projectType: 'residential' | 'commercial' | 'industrial';
  standard: 'IEC' | 'NEC';
  voltage: number; // System voltage (V)
  phases: 1 | 3; // Single or three-phase
  frequency: 50 | 60; // Hz
  
  // Load categories (all in kW)
  loads: {
    lighting?: number;
    socketOutlets?: number;
    hvac?: number;
    cookingAppliances?: number;
    waterHeating?: number;
    otherAppliances?: number;
    // Commercial specific
    generalLighting?: number;
    receptacleLoads?: number;
    elevators?: number;
    kitchenEquipment?: number;
    specialEquipment?: number;
    // Industrial specific
    motorLoads?: MotorLoad[];
    processEquipment?: number;
    weldingEquipment?: number;
    controlSystems?: number;
  };
  
  // Optional overrides
  customFactors?: {
    [category: string]: number; // Override default diversity factor
  };
}

interface MotorLoad {
  name: string;
  power: number; // kW
  powerFactor: number; // 0-1
  dutyCycle: 'continuous' | 'intermittent' | 'short-time';
  isLargest: boolean;
}
```

### DemandCalculationResult

```typescript
interface DemandCalculationResult {
  // Summary
  totalConnectedLoad: number; // kW
  maximumDemand: number; // kW
  overallDiversityFactor: number; // 0-1
  powerFactor: number; // Calculated or assumed
  
  // By category breakdown
  categoryBreakdown: CategoryResult[];
  
  // Compliance
  complianceChecks: ComplianceCheck[];
  
  // Recommendations
  recommendedServiceSize: number; // Amperes
  recommendedBreakerSize: number; // Amperes
  recommendedCableSize?: string; // AWG or mm²
  
  // Metadata
  calculationTimestamp: Date;
  standardUsed: string;
  warnings: string[];
}

interface CategoryResult {
  category: string;
  connectedLoad: number; // kW
  appliedFactor: number; // 0-1
  demandLoad: number; // kW
  standardReference: string;
}

interface ComplianceCheck {
  standard: string;
  clause: string;
  requirement: string;
  compliant: boolean;
  details: string;
}
```

---

## Practical Examples

### Example 1: Residential Project (IEC)

**Input:**
```json
{
  "projectType": "residential",
  "standard": "IEC",
  "loads": {
    "lighting": 10,
    "socketOutlets": 15,
    "hvac": 20,
    "cookingAppliances": 8,
    "waterHeating": 6
  }
}
```

**Expected Output:**
```
Total Connected Load: 59 kW

Category Breakdown:
- Lighting:          10 kW × 100% = 10.0 kW
- Socket Outlets:    15 kW × 40%  = 6.0 kW
- HVAC:              20 kW × 80%  = 16.0 kW
- Cooking:            8 kW × 70%  = 5.6 kW
- Water Heating:      6 kW × 100% = 6.0 kW

Maximum Demand: 43.6 kW
Overall Diversity Factor: 26.1%

Compliance: IEC 60364-5-52
```

### Example 2: Residential Project (NEC Optional Method)

**Input:**
```json
{
  "projectType": "residential",
  "standard": "NEC",
  "loads": {
    "generalLighting": 15,
    "receptacleLoads": 10,
    "cookingAppliances": 12,
    "hvac": 18,
    "waterHeating": 5,
    "dryer": 5
  }
}
```

**Expected Output:**
```
Total Connected Load: 65 kW

NEC Optional Method Calculation:
- General Lighting/Receptacles: 25 kW
  - First 10 kVA @ 100% = 10.0 kW
  - Remainder 15 kVA @ 40% = 6.0 kW
- Cooking Equipment: 12 kW × 75% = 9.0 kW
- HVAC: 18 kW × 100% = 18.0 kW (largest system)
- Water Heater: 5 kW × 100% = 5.0 kW
- Dryer: 5 kW × 100% = 5.0 kW

Maximum Demand: 53.0 kW
Compliance: NEC Article 220.82
```

### Example 3: Commercial Office Building

**Input:**
```json
{
  "projectType": "commercial",
  "standard": "NEC",
  "loads": {
    "generalLighting": 50,
    "receptacleLoads": 30,
    "hvac": 80,
    "elevators": 25,
    "kitchenEquipment": 15
  }
}
```

**Expected Output:**
```
Total Connected Load: 200 kW

Category Breakdown:
- General Lighting:     50 kW × 100% = 50.0 kW (first 12.5 kVA)
                                               75% = 28.1 kW (remainder)
- Receptacle Loads:     30 kW × 100% = 10.0 kW (first 10 kVA)
                                               50% = 10.0 kW (remainder)
- HVAC:                 80 kW × 100% = 80.0 kW (largest system)
- Elevators:            25 kW × 90%  = 22.5 kW (diversity for multiple)
- Kitchen Equipment:    15 kW × 75%  = 11.3 kW (4 units)

Maximum Demand: 211.9 kW
Overall Diversity Factor: -6% (negative = no diversity benefit)
Compliance: NEC Article 220.42, 220.44, 220.50
```

---

## User Interface Design

### Input Form Layout

```
┌─────────────────────────────────────────────────────────┐
│  Maximum Demand & Diversity Calculator                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Project Name: [________________________]               │
│                                                         │
│  Project Type:  [Residential ▼]                         │
│  Standard:      [IEC ▼]  [NEC ▼] (toggle)               │
│  System Voltage: [230] V  [1 ▼] Phase  [50] Hz         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Load Categories (kW)                            │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ☐ Lighting              [____] kW               │   │
│  │ ☐ Socket Outlets        [____] kW               │   │
│  │ ☐ HVAC Systems          [____] kW               │   │
│  │ ☐ Cooking Appliances    [____] kW               │   │
│  │ ☐ Water Heating         [____] kW               │   │
│  │ ☐ Other Appliances      [____] kW               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Advanced Settings ▼]                                  │
│  - Custom diversity factors                             │
│  - Power factor correction                              │
│  - Future expansion allowance                           │
│                                                         │
│  [Calculate]  [Reset]  [Save Project]                   │
└─────────────────────────────────────────────────────────┘
```

### Results Display Layout

```
┌─────────────────────────────────────────────────────────┐
│  Calculation Results                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Summary:                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Total Connected Load:    59.0 kW                 │  │
│  │ Maximum Demand:          43.6 kW                 │  │
│  │ Overall Diversity:       26.1%                   │  │
│  │ Recommended Service:     200 A @ 230V            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Category Breakdown:                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Category        │ Load │ Factor │ Demand │ Ref  │  │
│  │─────────────────┼──────┼────────┼────────┼──────│  │
│  │ Lighting        │ 10.0 │ 100%   │ 10.0   │ IEC  │  │
│  │ Socket Outlets  │ 15.0 │ 40%    │ 6.0    │ IEC  │  │
│  │ HVAC            │ 20.0 │ 80%    │ 16.0   │ IEC  │  │
│  │ Cooking         │ 8.0  │ 70%    │ 5.6    │ IEC  │  │
│  │ Water Heating   │ 6.0  │ 100%   │ 6.0    │ IEC  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Compliance: ✓ IEC 60364-5-52 Compliant                │
│                                                         │
│  [Generate PDF Report]  [Save Project]                  │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Constraints

### Technical Constraints
1. **Precision**: All calculations must use Math.js for high-precision arithmetic
2. **Performance**: Calculation latency <100ms
3. **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)
4. **Responsive**: Mobile-first design, works on tablets and desktops

### Standards Constraints
1. **IEC Factors**: Must reference specific IEC clauses
2. **NEC Factors**: Must reference specific NEC articles
3. **Validation**: Must warn if inputs exceed standard limits
4. **Audit Trail**: All calculations must be traceable

### Security Constraints
1. **Input Validation**: All inputs sanitized server-side
2. **Data Storage**: Projects encrypted at rest
3. **Access Control**: Role-based access (engineer, technician, admin)

---

## Testing Requirements

### Unit Tests
- [ ] Demand factor calculations for all project types
- [ ] Diversity factor application accuracy
- [ ] Edge cases (zero loads, maximum loads)
- [ ] Standard switching (IEC ↔ NEC)

### Integration Tests
- [ ] Full calculation workflow
- [ ] Save/load project functionality
- [ ] PDF generation with all sections

### Validation Tests
- [ ] IEC residential example matches spec (36.6 kW)
- [ ] NEC dwelling optional method matches examples
- [ ] Commercial calculations match NEC requirements

---

## Out of Scope (Future Phases)
- Harmonic analysis
- Power factor correction calculations
- Generator sizing
- UPS sizing integration
- Real-time monitoring integration
- Multi-building campus calculations

---

## Success Criteria

1. **Accuracy**: Calculations match hand calculations within ±0.1%
2. **Compliance**: All IEC/NEC references verified against standards
3. **Performance**: <100ms calculation time
4. **Usability**: Engineers can complete calculation in <2 minutes
5. **Documentation**: Complete PDF reports with clause references

---

**Specification Author**: AI Assistant  
**Date Created**: February 22, 2026  
**Feature ID**: 007-maximum-demand-diversity  
**Priority**: P0
