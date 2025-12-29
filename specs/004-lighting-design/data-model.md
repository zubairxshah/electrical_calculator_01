# Data Model: Lighting Design Calculator

**Feature**: 004-lighting-design
**Date**: 2025-12-29
**Status**: Complete

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        LightingDesign                           │
│  (Main calculation entity - stored in Zustand/localStorage)     │
├─────────────────────────────────────────────────────────────────┤
│ ◆ room: Room                                                     │
│ ◆ luminaire: Luminaire                                          │
│ ◆ designParameters: DesignParameters                            │
│ ◆ results: CalculationResults                                   │
│ ◇ visualInput?: VisualInputAnalysis                             │
│ ◇ uniformityAnalysis?: UniformityAnalysis                       │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                            Room                                  │
├─────────────────────────────────────────────────────────────────┤
│ length: number (m)                                              │
│ width: number (m)                                               │
│ height: number (m)                                              │
│ workPlaneHeight: number (m, default 0.75)                       │
│ ceilingReflectance: number (%, 0-100)                           │
│ wallReflectance: number (%, 0-100)                              │
│ floorReflectance: number (%, 0-100)                             │
│ spaceType: SpaceType (enum)                                     │
└─────────────────────────────────────────────────────────────────┘
         │
         │ computed
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RoomIndex                                │
├─────────────────────────────────────────────────────────────────┤
│ value: number                                                    │
│ mountingHeight: number (m)                                      │
│ formula: string ("RI = (L×W)/(H_m×(L+W))")                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          Luminaire                               │
│     (Selected from catalog or user-defined)                     │
├─────────────────────────────────────────────────────────────────┤
│ id: string                                                       │
│ manufacturer: string                                             │
│ model: string                                                    │
│ category: LuminaireCategory (enum)                               │
│ watts: number (W)                                                │
│ lumens: number (lm)                                              │
│ efficacy: number (lm/W)                                          │
│ beamAngle: number (degrees)                                      │
│ distributionType: DistributionType (enum)                        │
│ maxSHR: number (max spacing-to-height ratio)                     │
│ cri?: number (Color Rendering Index)                             │
│ cct?: number (Correlated Color Temperature K)                    │
│ dimmable?: boolean                                               │
│ ipRating?: string                                                │
│ ufTableId: string (reference to UF lookup table)                │
│ isCustom?: boolean (user-created vs catalog)                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DesignParameters                             │
├─────────────────────────────────────────────────────────────────┤
│ requiredIlluminance: number (lux)                                │
│ utilizationFactor: number (0.5-0.8)                              │
│ maintenanceFactor: number (0.7-0.9, default 0.8)                │
│ operatingHoursPerDay: number (default 10)                        │
│ standard: LightingStandard (enum)                                │
│ unitSystem: UnitSystem (enum: 'SI' | 'Imperial')                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CalculationResults                            │
├─────────────────────────────────────────────────────────────────┤
│ roomIndex: RoomIndex                                             │
│ utilizationFactor: number (looked up from tables)                │
│ luminairesRequired: number                                       │
│ luminairesRounded: number (ceiling of required)                  │
│ averageIlluminance: number (lux)                                 │
│ totalWatts: number (W)                                           │
│ totalLumens: number (lm)                                         │
│ energyConsumptionKwhYear: number                                 │
│ spacingToHeightRatio: number                                     │
│ shrCompliant: boolean                                            │
│ formulas: CalculationFormula[]                                   │
│ warnings: CalculationWarning[]                                   │
│ recommendations: string[]                                        │
│ standardReference: string                                        │
│ calculatedAt: string (ISO date)                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   VisualInputAnalysis (P2)                       │
├─────────────────────────────────────────────────────────────────┤
│ sourceFile: FileReference                                        │
│ sourceType: 'pdf' | 'image'                                      │
│ extractedRooms: ExtractedRoom[]                                  │
│ overallConfidence: number (0-100%)                               │
│ processingTimeMs: number                                         │
│ uncertainties: Uncertainty[]                                     │
│ analyzedAt: string (ISO date)                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ExtractedRoom                               │
├─────────────────────────────────────────────────────────────────┤
│ boundingBox: { x: number, y: number, width: number, height: number } │
│ extractedLength: number (m)                                      │
│ extractedWidth: number (m)                                       │
│ extractedHeight?: number (m, if found)                           │
│ lengthConfidence: number (0-100%)                                │
│ widthConfidence: number (0-100%)                                 │
│ heightConfidence?: number                                        │
│ label?: string (room name if detected)                           │
│ requiresConfirmation: boolean                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    UniformityAnalysis (P2)                       │
├─────────────────────────────────────────────────────────────────┤
│ gridResolution: number (points per meter)                        │
│ illuminanceGrid: number[][] (2D lux values)                      │
│ eMin: number (lux)                                               │
│ eMax: number (lux)                                               │
│ eAvg: number (lux)                                               │
│ uniformityRatio: number (Emin/Eavg)                              │
│ uniformityCompliant: boolean                                     │
│ requiredUniformity: number (per space type)                      │
│ problemAreas: ProblemArea[]                                      │
│ optimizationSuggestions: OptimizationSuggestion[]                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    RoadwayDesign (P3)                            │
├─────────────────────────────────────────────────────────────────┤
│ roadWidth: number (m)                                            │
│ roadLength: number (m)                                           │
│ poleSpacing: number (m)                                          │
│ mountingHeight: number (m)                                       │
│ overhang: number (m)                                             │
│ tiltAngle: number (degrees)                                      │
│ arrangement: 'single-side' | 'staggered' | 'opposite'            │
│ roadClass: RoadClass (per IES RP-8 or CIE 140)                   │
│ standard: 'IES_RP8' | 'CIE_140'                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   LuminaireCatalog (P3)                          │
│     (Database entity for user-saved luminaires)                  │
├─────────────────────────────────────────────────────────────────┤
│ id: string (UUID)                                                │
│ userId: string (FK to users)                                     │
│ luminaire: Luminaire (embedded)                                  │
│ createdAt: string (ISO date)                                     │
│ updatedAt: string (ISO date)                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Enumerations

### SpaceType
```typescript
enum SpaceType {
  OFFICE_GENERAL = 'office_general',
  OFFICE_DETAILED = 'office_detailed',
  CLASSROOM = 'classroom',
  CONFERENCE = 'conference',
  CORRIDOR = 'corridor',
  LOBBY = 'lobby',
  WAREHOUSE = 'warehouse',
  WAREHOUSE_DETAILED = 'warehouse_detailed',
  INDUSTRIAL = 'industrial',
  RETAIL = 'retail',
  HOSPITAL_EXAM = 'hospital_exam',
  PARKING_INDOOR = 'parking_indoor',
  CUSTOM = 'custom'
}
```

### LuminaireCategory
```typescript
enum LuminaireCategory {
  TROFFER = 'troffer',
  HIGHBAY = 'highbay',
  DOWNLIGHT = 'downlight',
  WALLPACK = 'wallpack',
  STRIP = 'strip',
  ROADWAY = 'roadway',
  FLOODLIGHT = 'floodlight',
  DECORATIVE = 'decorative',
  EMERGENCY = 'emergency'
}
```

### DistributionType
```typescript
enum DistributionType {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
  DIRECT_INDIRECT = 'direct-indirect',
  SYMMETRIC = 'symmetric',
  ASYMMETRIC = 'asymmetric'
}
```

### LightingStandard
```typescript
enum LightingStandard {
  IESNA = 'IESNA',      // IESNA Lighting Handbook
  IES_RP8 = 'IES_RP8',  // IES RP-8 (Roadway)
  CIE_140 = 'CIE_140',  // CIE 140 (International roadway)
  ASHRAE = 'ASHRAE'     // ASHRAE 90.1 (Energy)
}
```

### UnitSystem
```typescript
enum UnitSystem {
  SI = 'SI',           // meters, lux, m²
  IMPERIAL = 'Imperial' // feet, footcandles, ft²
}
```

### RoadClass (IES RP-8)
```typescript
enum RoadClassIES {
  M1 = 'M1',  // Freeway A
  M2 = 'M2',  // Freeway B
  M3 = 'M3',  // Expressway
  M4 = 'M4',  // Major
  M5 = 'M5'   // Collector
}
```

### RoadClass (CIE 140)
```typescript
enum RoadClassCIE {
  ME1 = 'ME1',  // Highest traffic
  ME2 = 'ME2',
  ME3a = 'ME3a',
  ME3b = 'ME3b',
  ME4a = 'ME4a',
  ME4b = 'ME4b',
  ME5 = 'ME5',
  ME6 = 'ME6'   // Lowest traffic
}
```

---

## Supporting Types

### CalculationFormula
```typescript
interface CalculationFormula {
  name: string;
  formula: string;
  variables: { symbol: string; value: number; unit: string }[];
  result: number;
  unit: string;
}
```

### CalculationWarning
```typescript
interface CalculationWarning {
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  recommendation?: string;
}
```

### ProblemArea
```typescript
interface ProblemArea {
  x: number;
  y: number;
  illuminance: number;
  issue: 'under-lit' | 'over-lit';
  deviation: number;  // % from average
}
```

### OptimizationSuggestion
```typescript
interface OptimizationSuggestion {
  type: 'add_luminaire' | 'remove_luminaire' | 'reposition' | 'change_luminaire';
  description: string;
  expectedImprovement: number;  // % improvement in uniformity
}
```

### Uncertainty
```typescript
interface Uncertainty {
  field: string;
  extractedValue: number | string;
  confidence: number;
  reason: string;
  suggestedAction: string;
}
```

### FileReference
```typescript
interface FileReference {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dataUrl?: string;  // For preview
}
```

---

## Validation Rules

### Room
| Field | Rule | Error Message |
|-------|------|---------------|
| length | 1-100 m | "Room length must be between 1 and 100 meters" |
| width | 1-100 m | "Room width must be between 1 and 100 meters" |
| height | 2-20 m | "Ceiling height must be between 2 and 20 meters" |
| workPlaneHeight | 0 to height-0.5 | "Work plane must be below ceiling" |
| ceilingReflectance | 0-100% | "Reflectance must be 0-100%" |
| wallReflectance | 0-100% | "Reflectance must be 0-100%" |
| floorReflectance | 0-100% | "Reflectance must be 0-100%" |

### Luminaire
| Field | Rule | Error Message |
|-------|------|---------------|
| watts | > 0, ≤ 5000 | "Wattage must be between 1 and 5000W" |
| lumens | > 0, ≤ 100000 | "Lumens must be between 1 and 100,000" |
| efficacy | 1-250 lm/W | "Efficacy must be realistic (1-250 lm/W)" |
| beamAngle | 10-180° | "Beam angle must be 10-180 degrees" |
| maxSHR | 0.5-2.5 | "SHR must be between 0.5 and 2.5" |

### DesignParameters
| Field | Rule | Error Message |
|-------|------|---------------|
| requiredIlluminance | 50-5000 lux | "Illuminance must be 50-5000 lux" |
| utilizationFactor | 0.3-0.9 | "UF must be between 0.3 and 0.9" |
| maintenanceFactor | 0.5-1.0 | "MF must be between 0.5 and 1.0" |
| operatingHoursPerDay | 1-24 | "Operating hours must be 1-24" |

---

## State Transitions

### LightingDesign State Machine
```
[Empty] --input room--> [Room Configured]
                           │
                           │--select luminaire
                           ▼
                     [Luminaire Selected]
                           │
                           │--set parameters
                           ▼
                     [Ready to Calculate]
                           │
                           │--calculate()
                           ▼
                     [Results Available]
                           │
                     ┌─────┴─────┐
                     │           │
              modify inputs   export PDF
                     │           │
                     ▼           ▼
            [Ready to Calculate] [PDF Generated]
```

### VisualInputAnalysis State Machine
```
[No File] --upload--> [Processing]
                          │
                    ┌─────┴─────┐
                    │           │
               success       failure
                    │           │
                    ▼           ▼
            [Extracted]    [Error]
                    │
              ┌─────┴─────┐
              │           │
        all confident  uncertainties
              │           │
              ▼           ▼
        [Auto-Populate] [Needs Confirmation]
                              │
                       user confirms
                              │
                              ▼
                        [Auto-Populate]
```

---

## Database Schema (PostgreSQL - Neon)

### user_luminaires Table
```sql
CREATE TABLE user_luminaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  watts DECIMAL(10,2) NOT NULL,
  lumens DECIMAL(10,2) NOT NULL,
  efficacy DECIMAL(6,2) NOT NULL,
  beam_angle DECIMAL(5,2),
  distribution_type VARCHAR(50),
  max_shr DECIMAL(4,2),
  cri INTEGER,
  cct INTEGER,
  dimmable BOOLEAN DEFAULT false,
  ip_rating VARCHAR(10),
  uf_table_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_luminaires_user_id ON user_luminaires(user_id);
CREATE INDEX idx_user_luminaires_category ON user_luminaires(category);
```

### lighting_designs Table (Future - for saved designs)
```sql
CREATE TABLE lighting_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  design_data JSONB NOT NULL,  -- Full LightingDesign object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lighting_designs_user_id ON lighting_designs(user_id);
```

---

## localStorage Schema (Zustand Persist)

### lighting-calculator-storage
```typescript
interface PersistedState {
  // Current design state
  room: Partial<Room>;
  luminaire: Partial<Luminaire> | null;
  designParameters: Partial<DesignParameters>;
  results: CalculationResults | null;

  // UI state
  showUniformityAnalysis: boolean;
  showHistorySidebar: boolean;

  // History (FIFO, max 50 entries)
  calculationHistory: HistoryEntry[];

  // Premium features
  visualAnalysisCount: number;  // Monthly counter for freemium limit
  lastVisualAnalysisReset: string;  // ISO date for monthly reset
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  room: Room;
  luminaire: Luminaire;
  results: CalculationResults;
  thumbnail?: string;  // Base64 preview
}
```
