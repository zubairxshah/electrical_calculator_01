# Lightning Arrester Calculator - High-Rise Building Enhancement Specification

**Feature**: Lightning Arrester Calculator - High-Rise Structure Type
**Status**: ✅ **COMPLETE**
**Date**: February 22, 2026

---

## Executive Summary

This specification adds **high-rise building** as a new structure type to the lightning arrester calculator, with research-backed engineering parameters for buildings exceeding 23 meters (75 feet) in height. The enhancement includes:

1. New `highrise` structure type with specialized arrester recommendations
2. Enhanced cantilever strength calculations for tall buildings
3. Wind load considerations per IEC 62305 and ASCE 7
4. Fix for IEC/NEC compliance badge display bug

---

## Background & Research

### High-Rise Building Definition

Per international standards:
- **NFPA 101/IFC**: Building > 75 feet (23 meters) above fire department access
- **IBC (International Building Code)**: Building with occupied floor > 75 feet above lowest fire access
- **Typical floors**: 7+ stories for residential, 5+ for commercial

### Lightning Protection Challenges for High-Rise Buildings

1. **Increased Strike Probability**: Buildings >100m have significantly higher lightning strike frequency
2. **Side Flash Risk**: Lightning can strike building sides, not just the roof
3. **Wind Loads**: Higher wind speeds at elevation affect arrester mounting
4. **Cantilever Strength**: Arresters must withstand greater mechanical stress
5. **Grounding Complexity**: Multiple down conductors required

### Standards Referenced

| Standard | Title | Relevance |
|----------|-------|-----------|
| **IEC 62305-1** | Risk management | High-rise specific risk assessment |
| **IEC 62305-2** | Physical damage to structures | Protection of tall structures |
| **IEC 62305-3** | Physical damage to life | Safety requirements |
| **IEC 60099-4** | Surge arresters | Arrester selection and rating |
| **NFPA 780** | Lightning Protection Systems | US standard for tall buildings |
| **ASCE 7-16** | Wind Loads | Wind load calculations |
| **NEC Article 280** | Surge Arresters | Installation requirements |

---

## Technical Requirements

### 1. New Structure Type: `highrise`

#### Arrester Type Recommendation
- **Primary**: ESE (Early Streamer Emission) for roof protection
- **Secondary**: MOV for electrical system protection
- **Rationale**: ESE provides wider protection radius for tall structures

#### SPD Type
- **Type**: Type 1 (line side) - mandatory for high-rise
- **Rationale**: High-rise buildings require service entrance protection

#### Material
- **Primary**: Copper (superior conductivity, corrosion resistance)
- **Alternative**: Copper-bonded steel for structural elements

#### Cantilever Strength Requirement
- **Minimum**: 1000 kg (vs. 500 kg for standard structures)
- **Rationale**: Higher wind loads at elevation per ASCE 7-16

### 2. Enhanced Calculation Parameters

#### Wind Load Factor
```
WindLoadFactor = 1.0 + (BuildingHeight - 23m) × 0.02
```
- Base height: 23 meters (75 feet threshold)
- Additional 2% load per meter above threshold
- Applied to cantilever strength requirement

#### Altitude Correction (Enhanced)
```
AltitudeFactor = 1.0 + ((Altitude - 1000m) / 100) × 0.015
```
- Increased derating rate (1.5% per 100m vs. 1%)
- Accounts for reduced air density at high elevations

#### Pollution Level Multiplier (High-Rise Specific)
| Pollution Level | Standard Factor | High-Rise Factor |
|-----------------|-----------------|------------------|
| Light | 1.0 | 1.2 |
| Medium | 1.5 | 1.8 |
| Heavy | 2.0 | 2.5 |

**Rationale**: High-rise buildings experience more pollution accumulation at height

### 3. New Compliance Checks

#### IEC 62305-2: Risk Assessment
- **Requirement**: Building risk index calculation
- **Formula**: `RiskIndex = (StrikeFrequency × DamageFactor) / ProtectionLevel`
- **Threshold**: RiskIndex < 1.0 for acceptable protection

#### Wind Load Compliance
- **Requirement**: Cantilever strength ≥ BaseStrength × WindLoadFactor
- **Base**: 500 kg minimum
- **High-Rise**: 1000 kg minimum (for buildings >23m)

#### Side Flash Protection
- **Requirement**: Additional arresters for buildings >60m
- **Check**: Building height > 60m → Warning for side flash protection

### 4. Compliance Badge Fix

**Bug**: Compliance badges in ResultsDisplay.tsx hardcoded to `compliant={true}`

**Fix**: Calculate actual compliance from results:
```typescript
const iecCompliant = result.complianceResults
  .filter(r => r.standard.includes('IEC'))
  .every(r => r.compliant);
const necCompliant = result.complianceResults
  .filter(r => r.standard.includes('NEC'))
  .every(r => r.compliant);
```

---

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/models/CalculationParameters.ts` | Add `highrise` to STRUCTURE_TYPES |
| `src/constants/standards.ts` | Add HIGHRISE recommendations, wind load constants |
| `src/services/lightning-arrester/calculationEngine.ts` | Add highrise case, wind load calc, enhanced cantilever |
| `src/components/lightning-arrester/ResultsDisplay.tsx` | Fix compliance badge bug |
| `src/components/lightning-arrester/CalculatorForm.tsx` | Add highrise option to dropdown |

### New Constants

```typescript
export const HIGHRISE_SPECIFIC = {
  MIN_HEIGHT_METERS: 23,      // 75 feet threshold
  SIDE_FLASH_HEIGHT: 60,      // Height requiring side flash protection
  BASE_CANTILEVER_KG: 1000,   // Minimum cantilever strength
  WIND_LOAD_FACTOR_PER_M: 0.02, // 2% per meter above threshold
  ALTITUDE_DERATING_ENHANCED: 0.015, // 1.5% per 100m
};
```

### Calculation Flow for High-Rise

```
1. Determine arrester type → ESE (for roof) + MOV (for electrical)
2. Calculate base rating → systemVoltage × 1.35 (high-rise multiplier)
3. Apply altitude correction → Enhanced derating factor
4. Apply pollution correction → High-rise pollution factors
5. Apply wind load factor → Based on building height
6. Round to standard rating → Select next higher standard class
7. Perform compliance checks → Including wind load, cantilever
8. Generate warnings → Side flash, high altitude, etc.
```

---

## Test Scenarios

### Test Case 1: Standard High-Rise (30 floors)
- **Input**: 33kV, highrise, 50% humidity, medium pollution, 100m altitude
- **Expected**: 
  - Arrester: ESE
  - Rating: 52 kV (with factors applied)
  - Cantilever: ≥1000 kg
  - Wind load factor: 1.14 (for ~30m above threshold)

### Test Case 2: Super High-Rise (80 floors, 300m)
- **Input**: 33kV, highrise, 60% humidity, heavy pollution, 500m altitude
- **Expected**:
  - Arrester: ESE
  - Rating: 72.5 kV (with all factors)
  - Cantilever: ≥1500 kg (wind load adjusted)
  - Warning: Side flash protection required

### Test Case 3: Compliance Badge Display
- **Input**: Any configuration with failing compliance check
- **Expected**: Badge shows "Non-Compliant" in red (not hardcoded green)

---

## Success Criteria

1. ✅ `highrise` structure type available in dropdown
2. ✅ ESE arrester recommended for high-rise structures
3. ✅ Cantilever strength ≥1000 kg for high-rise
4. ✅ Wind load factor applied correctly
5. ✅ Side flash warning for buildings >60m
6. ✅ Compliance badges show actual status (green/red)
7. ✅ All existing tests pass
8. ✅ New tests for high-rise scenarios pass

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incorrect wind load calculation | High | Use conservative factors, add safety margin |
| Missing side flash warning | Medium | Clear warning message, reference standards |
| Compliance badge regression | Low | Add test coverage for badge display |
| Breaking existing structure types | Medium | Isolate highrise logic, test all types |

---

## References

1. **IEC 62305-1:2010**: Protection against lightning - Part 1: General principles
2. **IEC 62305-2:2010**: Protection against lightning - Part 2: Risk management
3. **NFPA 780 (2020)**: Standard for the Installation of Lightning Protection Systems
4. **ASCE 7-16**: Minimum Design Loads for Buildings and Other Structures
5. **IEEE Std 1410**: Guide for Improving the Lightning Performance of Electric Power Overhead Distribution Lines

---

**Specification Author**: Claude Code
**Date Created**: February 22, 2026
**Feature ID**: lightning-arrester-highrise-enhancement
