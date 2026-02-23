# ADR-003: Math.js High-Precision Arithmetic for Safety-Critical Calculations

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-24
- **Feature:** ElectroMate Engineering Web Application
- **Context:** ElectroMate is a professional electrical engineering calculation platform where calculation accuracy directly impacts human safety, code compliance, and professional liability. Constitution Principle I (Calculation Accuracy) is marked NON-NEGOTIABLE: all calculations must match published standards within specified tolerances (±2% for battery backup per SC-005, ±0.1% for voltage drop per SC-004, 100% NEC/IEC ampacity compliance per SC-009). Native JavaScript uses IEEE 754 floating-point arithmetic, which introduces precision errors unacceptable for engineering calculations (e.g., `0.1 + 0.2 = 0.30000000000000004`). Engineers submit calculation outputs to approval authorities and clients, requiring verifiable accuracy with traceability to IEEE/IEC/NEC standards.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES - SAFETY-CRITICAL: Calculation errors cause equipment malfunction, fire hazards, electrocution risk, code violations, professional liability
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES - Native JavaScript, decimal.js, big.js all evaluated with precision/performance tradeoffs
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES - Affects all calculation modules (Battery, UPS, Cables, Solar), validation logic, unit conversion, PDF reports
-->

## Decision

**Use Math.js with BigNumber type configured for 64-digit precision**

Components:
- **Library**: Math.js (comprehensive math library with arbitrary-precision support)
- **Number Type**: BigNumber (arbitrary-precision decimal arithmetic)
- **Precision**: 64 significant digits (engineering standard for professional calculations)
- **Scope**: ALL calculation logic (battery backup, voltage drop, UPS sizing, solar array, unit conversions)
- **Configuration**: Global math instance with BigNumber mode (lib/mathConfig.ts)

Implementation pattern:
```typescript
// lib/mathConfig.ts
import { create, all } from 'mathjs'

export const math = create(all, {
  number: 'BigNumber',  // Use BigNumber by default
  precision: 64         // 64 significant digits
})

// All calculations use Math.js
const result = math.divide(
  math.multiply(math.bignumber(voltage), math.bignumber(ampHours)),
  math.bignumber(loadWatts)
)
```

## Consequences

### Positive

- **Calculation accuracy guaranteed**: Math.js BigNumber eliminates floating-point precision errors, meeting Constitution Principle I (NON-NEGOTIABLE) and all accuracy success criteria (SC-004: ±0.1%, SC-005: ±2%, SC-009: 100% compliance)
- **Safety compliance**: Accurate calculations prevent dangerous designs (under-sized cables causing fires, under-sized UPS causing equipment damage, incorrect battery sizing causing system failures)
- **Standards validation**: High precision enables validation against published IEEE/IEC/NEC test cases within specified tolerances
- **Professional credibility**: Engineers can confidently submit calculation outputs to approval authorities knowing calculations match standards exactly
- **Unit conversion accuracy**: Math.js preserves precision during SI ↔ NEC conversions (mm² ↔ AWG, meters ↔ feet) per SC-015
- **Comprehensive math functions**: Built-in powers, logarithms, trigonometry support complex calculations (discharge curves using Peukert's Law, solar derating calculations)
- **Audit trail**: Calculation precision enables exact reproduction of results for code compliance verification

### Negative

- **Performance overhead**: BigNumber arithmetic ~10x slower than native JavaScript. Simple calculation (battery backup time) takes ~5ms with Math.js vs ~0.5ms with native.
- **Larger bundle size**: Math.js adds ~100KB to bundle (minified). Acceptable for professional engineering tool but impacts initial load time.
- **Learning curve**: Developers must understand BigNumber API (math.bignumber(), math.multiply(), math.divide() instead of native operators)
- **Type conversions required**: Must explicitly convert between BigNumber and native numbers (math.number() for display, math.bignumber() for calculations)
- **Debugging complexity**: BigNumber values harder to inspect in console compared to native numbers (require math.format() for readable output)

## Alternatives Considered

### Alternative A: Native JavaScript Arithmetic

**Approach**: Use native JavaScript number type (IEEE 754 double-precision floating-point)

**Why rejected**:
- **Precision errors**: `0.1 + 0.2 = 0.30000000000000004` demonstrates inherent floating-point inaccuracy
- **Standards violation**: Cannot achieve ±0.1% voltage drop accuracy (SC-004) with floating-point rounding errors
- **Safety risk**: Precision errors in cable sizing calculations could result in under-sized conductors (fire/electrocution hazard)
- **Professional liability**: Engineers cannot defend calculations in code compliance reviews if results don't exactly match published standards
- **Constitution violation**: Violates Principle I (Calculation Accuracy: NON-NEGOTIABLE)

**Example failure case**:
```javascript
// Native JavaScript voltage drop calculation
const voltageDrop = (50 * 100 * 0.0187) / 1000  // Current × Length × Resistance
// Expected: 0.0935V
// Actual: 0.09350000000000001V
// Error compounds across multiple calculations
```

### Alternative B: decimal.js

**Approach**: Use decimal.js for arbitrary-precision decimal arithmetic

**Why rejected**:
- **Missing engineering functions**: decimal.js provides precision but lacks built-in powers, logarithms, trigonometry needed for discharge curves (Peukert's Law), solar derating (temperature coefficients)
- **No unit support**: Would require separate unit conversion library with additional precision loss risk
- **Incomplete solution**: Would need Math.js or additional libraries anyway for comprehensive calculations
- **More complexity**: Managing two libraries (decimal.js + supplementary math) vs one comprehensive solution (Math.js)

**When decimal.js would be better**: Financial calculations requiring only basic arithmetic (add, subtract, multiply, divide). Not suitable for engineering with complex formulas.

### Alternative C: big.js

**Approach**: Use big.js minimalist arbitrary-precision library

**Why rejected**:
- **Too minimal**: Only basic arithmetic (add, subtract, multiply, divide). Missing powers, roots, logarithms, trigonometry.
- **No unit support**: No built-in unit conversion capabilities
- **Limited precision control**: Less flexible precision configuration compared to Math.js
- **Incomplete for engineering**: Would require extensive custom implementations of engineering formulas

**When big.js would be better**: Minimalist projects requiring only basic arbitrary-precision arithmetic with smallest bundle size. Not suitable for comprehensive engineering platform.

### Alternative D: Hybrid Approach (Native + Math.js selectively)

**Approach**: Use native JavaScript for non-critical calculations, Math.js only for final results

**Why rejected**:
- **Complexity**: Developers must decide when to use native vs Math.js, creating inconsistency and potential errors
- **Precision loss**: Intermediate calculations using native arithmetic introduce errors that compound in final result
- **Testing complexity**: Must test both native and Math.js code paths, doubling test surface area
- **Constitution violation risk**: Easy to accidentally use native arithmetic in critical calculation (human error)

**Principle**: Use Math.js universally for all calculations to eliminate precision risk. Use native numbers only for non-computational display logic (UI animations, progress bars).

## Rationale Summary

Math.js selected because:
1. **Safety-critical requirement**: Constitution Principle I (NON-NEGOTIABLE) requires calculation accuracy. Human safety depends on correct calculations (cable sizing, voltage drop, battery backup).
2. **Standards compliance**: Only arbitrary-precision arithmetic can achieve ±0.1% accuracy required to match IEEE/IEC/NEC published tables
3. **Comprehensive solution**: Math.js provides both precision AND engineering functions (powers, logarithms, trigonometry) in single library
4. **Professional credibility**: Engineers can confidently submit outputs to approval authorities knowing calculations exactly match standards
5. **Long-term maintainability**: Mature library (10+ years), active development, 14K+ GitHub stars, used in scientific computing and DeFi (where precision is equally critical)

**Performance mitigation**: Use debounced validation (300ms), Web Workers for complex calculations, and memoization to offset 10x arithmetic overhead. <100ms validation target achievable with optimizations.

**Constitution Compliance**: This decision directly implements Principle I (Calculation Accuracy: NON-NEGOTIABLE) and is foundational to all other principles (Safety-First Validation, Standards Compliance, Professional Documentation all depend on calculation accuracy).

## References

- Feature Spec: [specs/001-electromate-engineering-app/spec.md](../../specs/001-electromate-engineering-app/spec.md) - SC-004, SC-005, SC-009 (accuracy requirements)
- Implementation Plan: [specs/001-electromate-engineering-app/plan.md](../../specs/001-electromate-engineering-app/plan.md) - Complexity Tracking (Math.js justification)
- Research: [specs/001-electromate-engineering-app/research.md](../../specs/001-electromate-engineering-app/research.md) - Decision 3
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - Principle I (Calculation Accuracy: NON-NEGOTIABLE)
- Related ADRs: ADR-002 (Zustand - performance optimizations offset Math.js overhead)
- Evaluator Evidence: [Math.js Documentation: Numbers and Precision](https://mathjs.org/docs/datatypes/numbers.html), [Overcoming JavaScript Numeric Precision Issues](https://avioconsulting.com/blog/overcoming-javascript-numeric-precision-issues/)
