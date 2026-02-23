# Maximum Demand & Diversity Calculator - Quick Reference

**Feature ID**: 007-maximum-demand-diversity  
**Status**: ✅ MVP Complete  
**Path**: `/demand-diversity`  
**Commits**: 5ee3536, 34bc972

---

## Quick Start

### Access
1. **Sidebar**: Power Systems → Maximum Demand
2. **Landing Page**: Calculator grid (marked "New")
3. **Direct URL**: `/demand-diversity`

### Basic Usage (Residential IEC)
1. Enter project name
2. Select Project Type: Residential
3. Select Standard: IEC
4. Enter system voltage (e.g., 230V)
5. Enter load values:
   - Lighting: 10 kW
   - Socket Outlets: 15 kW
   - HVAC: 20 kW
   - Cooking: 8 kW
   - Water Heating: 6 kW
6. Click "Calculate Maximum Demand"
7. View results: 43.6 kW demand (26.1% diversity)

---

## Standards Reference

### IEC 60364-5-52 Diversity Factors

| Load Category | Factor | Notes |
|---------------|--------|-------|
| Lighting | 100% | No diversity |
| Socket Outlets | 40% | 60% diversity applied |
| HVAC | 80% | 20% diversity |
| Cooking | 70% | 30% diversity |
| Water Heating | 100% | Continuous load |
| Other Appliances | 60% | 40% diversity |

### NEC 220.82 Optional Method (Dwelling)

| Load Type | Factor | Notes |
|-----------|--------|-------|
| General Lighting/Receptacles | 100% first 10 kVA, 40% remainder | Tiered |
| Cooking Equipment | 75% | Default factor |
| HVAC | 100% | Largest system only |
| Water Heater | 100% | Full load |
| Dryer | 100% | 5 kW minimum |

---

## Example Calculations

### Example 1: Residential IEC
```
Input:
- Lighting: 10 kW
- Socket Outlets: 15 kW
- HVAC: 20 kW
- Cooking: 8 kW
- Water Heating: 6 kW

Calculation:
10 × 1.00 = 10.0 kW
15 × 0.40 = 6.0 kW
20 × 0.80 = 16.0 kW
8 × 0.70 = 5.6 kW
6 × 1.00 = 6.0 kW
─────────────────────
Connected: 59.0 kW
Demand: 43.6 kW
Diversity: 26.1%
```

### Example 2: Residential NEC
```
Input:
- General Lighting: 15 kW
- Receptacle Loads: 10 kW
- Cooking: 12 kW
- HVAC: 18 kW
- Water Heater: 5 kW
- Dryer: 5 kW

Calculation (NEC 220.82):
General (25 kW): 10 + (15 × 0.4) = 16.0 kW
Cooking (12 kW): 12 × 0.75 = 9.0 kW
HVAC (18 kW): 18 × 1.0 = 18.0 kW
Water (5 kW): 5 × 1.0 = 5.0 kW
Dryer (5 kW): 5 × 1.0 = 5.0 kW
─────────────────────────────────────
Connected: 65.0 kW
Demand: 53.0 kW
```

---

## File Structure

```
src/
├── models/
│   ├── DemandCalculationParameters.ts
│   └── DemandCalculationResult.ts
├── services/demand-diversity/
│   ├── calculationEngine.ts
│   ├── IECFactors.ts
│   ├── NECFactors.ts
│   └── validation.ts
├── components/demand-diversity/
│   ├── CalculatorForm.tsx
│   └── ResultsDisplay.tsx
└── app/demand-diversity/
    └── page.tsx

app/api/demand-diversity/calculate/
└── route.ts
```

---

## API Contract

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
  "categoryBreakdown": [...],
  "complianceChecks": [...],
  "recommendedServiceSize": 200,
  "recommendedBreakerSize": 250,
  "calculationTimestamp": "2026-02-22T...",
  "standardUsed": "IEC 60364-5-52",
  "warnings": []
}
```

---

## Known Limitations (MVP)

1. **Commercial Calculations**: Not yet implemented
2. **Industrial Calculations**: Basic only, motor table not implemented
3. **PDF Export**: Not available
4. **Save/Load**: Projects cannot be saved yet
5. **Unit Tests**: No test coverage yet

---

## Troubleshooting

### Issue: Calculation returns 0
**Cause**: No load values entered  
**Fix**: Enter at least one positive load value

### Issue: Validation errors
**Cause**: Invalid input (negative numbers, out of range)  
**Fix**: Check all inputs are positive numbers within valid ranges

### Issue: Results don't match expected
**Cause**: Wrong standard selected (IEC vs NEC)  
**Fix**: Verify standard matches calculation method expected

---

## Next Development Steps

1. ✅ MVP Complete
2. ⏳ Add commercial project calculations
3. ⏳ Add industrial motor load table
4. ⏳ Implement PDF export
5. ⏳ Add save/load projects
6. ⏳ Add unit tests

---

## Related Documentation

- **Specification**: `specs/007-maximum-demand-diversity/spec.md`
- **Plan**: `specs/007-maximum-demand-diversity/plan.md`
- **Tasks**: `specs/007-maximum-demand-diversity/tasks.md`
- **Session Memory**: `memory_backup/sessions/2026-02-22-maximum-demand-implementation.md`
- **Project Progress**: `memory_backup/PROJECT_PROGRESS_SUMMARY.md`

---

**Quick Reference Created**: February 22, 2026  
**Last Updated**: February 22, 2026
