# Maximum Demand & Diversity Calculator - Implementation Plan

**Feature**: 007-maximum-demand-diversity  
**Status**: 📋 Planning Complete  
**Date**: February 22, 2026

---

## Implementation Strategy

### Phase Approach
We'll implement in 5 phases following the existing ElectroMate patterns:

| Phase | Focus | Priority | Estimated Effort |
|-------|-------|----------|------------------|
| **Phase 1** | Setup & Foundation | P0 | 2 hours |
| **Phase 2** | Core Calculation Engine (US1) | P0 | 4 hours |
| **Phase 3** | Commercial & Industrial (US2, US3) | P0 | 3 hours |
| **Phase 4** | UI Components & Integration | P0 | 3 hours |
| **Phase 5** | PDF Export & Save/Load (US4, US5) | P1 | 3 hours |
| **Final** | Polish & Testing | P1 | 2 hours |

---

## Technical Architecture

### Component Hierarchy

```
app/demand-diversity/page.tsx (Main page)
├── CalculatorForm (Input form)
│   ├── ProjectTypeSelector
│   ├── StandardToggle (IEC/NEC)
│   ├── SystemConfig (voltage, phases, frequency)
│   ├── LoadCategoryInputs (dynamic based on type)
│   └── AdvancedSettings (optional)
├── ResultsDisplay
│   ├── SummaryCard
│   ├── CategoryBreakdownTable
│   ├── ComplianceTable
│   └── Recommendations
├── ReportPreview
│   ├── PreviewCard
│   └── ExportButtons
└── ProjectList (saved projects)
```

### Service Architecture

```
src/services/demand-diversity/
├── calculationEngine.ts (orchestrator)
├── IECFactors.ts (IEC diversity factors)
├── NECFactors.ts (NEC demand factors)
├── validation.ts (input validation)
├── pdfGenerator.ts (PDF generation)
└── projectStorage.ts (save/load)
```

### Data Flow

```
User Input → CalculatorForm → validation.ts → calculationEngine.ts
                                                    ├── IECFactors.ts or NECFactors.ts
                                                    └── Returns DemandCalculationResult
                                                         ↓
                                                ResultsDisplay → UI
                                                         ↓
                                                pdfGenerator.ts → PDF
                                                         ↓
                                                projectStorage.ts → Database
```

---

## Key Technical Decisions

### 1. Calculation Precision
**Decision**: Use Math.js for all calculations  
**Rationale**: Consistent with existing calculators (lightning-arrester, circuit-breaker)  
**Implementation**: `import { math } from '../../lib/math'`

### 2. Standards Factor Storage
**Decision**: Store factors in dedicated constants files  
**Rationale**: Easy to update, clear separation of IEC vs NEC  
**Implementation**: 
- `src/services/demand-diversity/IECFactors.ts`
- `src/services/demand-diversity/NECFactors.ts`

### 3. Dynamic Form Fields
**Decision**: Show/hide load categories based on project type  
**Rationale**: Reduces confusion, shows only relevant inputs  
**Implementation**: Conditional rendering in CalculatorForm

### 4. Project Storage
**Decision**: Use Better Auth database (existing auth system)  
**Rationale**: Leverages existing infrastructure, user-specific storage  
**Implementation**: New table `demand_calculations` with user_id foreign key

### 5. PDF Generation
**Decision**: Client-side jsPDF (same as lightning-arrester)  
**Rationale**: No server load, immediate download, works offline  
**Implementation**: Extend PdfGeneratorService pattern

---

## Database Schema

### New Table: demand_calculations

```sql
CREATE TABLE demand_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(50) NOT NULL, -- residential, commercial, industrial
  standard VARCHAR(10) NOT NULL, -- IEC or NEC
  
  -- System configuration
  voltage INTEGER NOT NULL,
  phases INTEGER NOT NULL, -- 1 or 3
  frequency INTEGER NOT NULL, -- 50 or 60
  
  -- Load data (stored as JSON for flexibility)
  loads JSONB NOT NULL,
  custom_factors JSONB DEFAULT NULL,
  
  -- Results
  total_connected_load DECIMAL(10,3) NOT NULL,
  maximum_demand DECIMAL(10,3) NOT NULL,
  overall_diversity_factor DECIMAL(5,4) NOT NULL,
  category_breakdown JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_demand_calculations_user_id ON demand_calculations(user_id);
CREATE INDEX idx_demand_calculations_created_at ON demand_calculations(created_at);
```

---

## File Structure

```
D:\prompteng\elec_calc\
├── app/
│   └── demand-diversity/
│       └── page.tsx                    # Main page component
├── src/
│   ├── components/
│   │   └── demand-diversity/
│   │       ├── CalculatorForm.tsx
│   │       ├── ResultsDisplay.tsx
│   │       ├── ComplianceTable.tsx
│   │       ├── ReportPreview.tsx
│   │       └── ProjectList.tsx
│   ├── services/
│   │   └── demand-diversity/
│   │       ├── calculationEngine.ts
│   │       ├── IECFactors.ts
│   │       ├── NECFactors.ts
│   │       ├── validation.ts
│   │       ├── pdfGenerator.ts
│   │       └── projectStorage.ts
│   ├── models/
│   │   ├── DemandCalculationParameters.ts
│   │   └── DemandCalculationResult.ts
│   └── constants/
│       └── demandDiversity.ts          # Shared constants
├── specs/
│   └── 007-maximum-demand-diversity/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
└── history/
    └── prompts/
        └── 007-maximum-demand-diversity/
```

---

## Standards Implementation Details

### IEC Diversity Factors (Residential)

```typescript
export const IEC_RESIDENTIAL_FACTORS = {
  lighting: { factor: 1.0, clause: 'IEC 60364-5-52', notes: 'No diversity for lighting' },
  socketOutlets: { factor: 0.4, clause: 'IEC 60364-5-52', notes: '60% diversity applied' },
  hvac: { factor: 0.8, clause: 'IEC 60364-5-52', notes: '20% diversity for HVAC' },
  cookingAppliances: { factor: 0.7, clause: 'IEC 60364-5-52', notes: '30% diversity for cooking' },
  waterHeating: { factor: 1.0, clause: 'IEC 60364-5-52', notes: 'Continuous load, no diversity' },
  otherAppliances: { factor: 0.6, clause: 'IEC 60364-5-52', notes: '40% diversity' },
};
```

### NEC Demand Factors (Dwelling - Optional Method)

```typescript
export const NEC_DWELLING_DEMAND_FACTORS = {
  generalLightingReceptacles: {
    firstPortion: { kVA: 10, factor: 1.0 },
    remainder: { factor: 0.4 },
    clause: 'NEC 220.82'
  },
  cookingEquipment: {
    defaultFactor: 0.75,
    clause: 'NEC 220.55'
  },
  hvac: {
    factor: 1.0,
    notes: 'Largest of heating or cooling',
    clause: 'NEC 220.82(C)(1)'
  },
  waterHeater: {
    factor: 1.0,
    clause: 'NEC 220.82(B)'
  },
  dryer: {
    minimum: 5, // kW
    factor: 1.0,
    clause: 'NEC 220.82(B)'
  }
};
```

---

## API Contracts

### POST /api/demand-diversity/calculate

**Request:**
```json
{
  "projectName": "Smith Residence",
  "projectType": "residential",
  "standard": "IEC",
  "voltage": 230,
  "phases": 1,
  "frequency": 50,
  "loads": {
    "lighting": 10,
    "socketOutlets": 15,
    "hvac": 20,
    "cookingAppliances": 8,
    "waterHeating": 6
  }
}
```

**Response:**
```json
{
  "totalConnectedLoad": 59,
  "maximumDemand": 43.6,
  "overallDiversityFactor": 0.261,
  "categoryBreakdown": [
    {
      "category": "lighting",
      "connectedLoad": 10,
      "appliedFactor": 1.0,
      "demandLoad": 10,
      "standardReference": "IEC 60364-5-52"
    }
  ],
  "complianceChecks": [...],
  "recommendedServiceSize": 200,
  "warnings": []
}
```

---

## Testing Strategy

### Unit Tests (Priority: High)
- [ ] IEC factor application accuracy
- [ ] NEC demand factor calculations
- [ ] Residential example matches spec (43.6 kW)
- [ ] Commercial calculations
- [ ] Industrial motor load calculations
- [ ] Edge cases (zero loads, very large loads)

### Integration Tests (Priority: Medium)
- [ ] Full calculation workflow
- [ ] Save/load project round-trip
- [ ] PDF generation with all sections

### E2E Tests (Priority: Medium)
- [ ] User completes residential calculation
- [ ] User saves and reloads project
- [ ] User exports PDF report

---

## Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Calculation latency | <100ms | Input to result display |
| PDF generation | <2s | Click to download |
| Save/load | <500ms | API round-trip |
| Page load | <1s | First contentful paint |

---

## Security Considerations

1. **Input Validation**: All numeric inputs validated server-side
2. **SQL Injection**: Parameterized queries for database
3. **XSS Prevention**: React escapes all outputs by default
4. **Access Control**: Users can only access their own saved projects
5. **Rate Limiting**: API endpoints rate-limited to prevent abuse

---

## Rollout Plan

### Week 1: Core Functionality
- Days 1-2: Phase 1 & 2 (Setup + Residential IEC/NEC)
- Days 3-4: Phase 3 (Commercial & Industrial)
- Day 5: Phase 4 (UI Integration)

### Week 2: Extended Features
- Days 1-2: Phase 5 (PDF + Save/Load)
- Days 3-4: Final Polish & Testing
- Day 5: Documentation & Deployment

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Standards misinterpretation | High | Cross-reference multiple sources, add compliance tests |
| Complex UI for non-experts | Medium | Progressive disclosure, tooltips, examples |
| Performance with large projects | Low | Lazy loading, pagination for many loads |
| Database schema changes | Medium | Version migrations, backward compatibility |

---

## Success Criteria

1. ✅ All 5 user stories implemented
2. ✅ Calculations match examples within ±0.1%
3. ✅ All IEC/NEC references accurate
4. ✅ <100ms calculation time
5. ✅ PDF reports include all required sections
6. ✅ Save/load functionality working
7. ✅ All tests passing (unit + integration)

---

**Plan Author**: AI Assistant  
**Date Created**: February 22, 2026  
**Feature ID**: 007-maximum-demand-diversity  
**Next Step**: Generate task breakdown with `/sp.tasks`
