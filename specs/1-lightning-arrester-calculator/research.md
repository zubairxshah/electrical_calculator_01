# Research: Lightning Arrester Calculator Implementation

## Decision: Calculation Standards and Formulas
**Rationale**: The calculator must implement formulas that comply with IEC 60099-4 and NEC 2020/2023 standards for lightning arresters and surge protection devices.
**Alternatives considered**:
- Direct implementation of manufacturer-specific formulas
- Simplified approximations
- Comprehensive IEC 60099-4 standard formulas (selected)

**Selected approach**: Implementation of IEC 60099-4 standard formulas for:
- Lightning impulse residual voltage calculations
- Power frequency withstand voltage validation
- Temporary overvoltage (TOV) withstand capability
- Cantilever strength calculations

## Decision: Arrester Type Classifications
**Rationale**: The system must distinguish between three main arrester types with different calculation methodologies.
**Alternatives considered**:
- Generic calculation model with adjustable parameters
- Three distinct calculation engines per arrester type (selected)
- Hybrid approach with shared base calculations

**Selected approach**: Separate calculation engines for:
- Conventional (rod) arresters: Based on physical dimensions and material properties
- ESE (Early Streamer Emission) arresters: Based on advanced protection radius calculations
- MOV (Metal-Oxide Varistor) arresters: Based on clamping voltage and energy absorption

## Decision: Environmental Condition Factors
**Rationale**: Environmental conditions significantly affect arrester performance and selection.
**Alternatives considered**:
- Fixed standard conditions only
- Optional environmental factors
- Required environmental factors with default values (selected)

**Selected approach**: Mandatory environmental inputs with predefined ranges:
- Humidity: 0-100% RH
- Pollution level: Light, Medium, Heavy (IEC classifications)
- Altitude: Up to 2000m (with derating factors beyond 1000m)

## Decision: Compliance Validation Approach
**Rationale**: The system must validate compliance with both IEC and NEC standards.
**Alternatives considered**:
- IEC-only compliance validation
- NEC-only compliance validation
- Dual standard validation with user selection (selected)

**Selected approach**: Dual standard validation allowing user to select applicable standard with clear indication of compliance status for both standards where applicable.

## Decision: PDF Report Format and Content
**Rationale**: Professional documentation must meet industry standards for engineering submissions.
**Alternatives considered**:
- Basic summary reports
- Detailed calculation step reports (selected)
- Interactive online reports only

**Selected approach**: Comprehensive PDF reports including:
- All input parameters with units
- Calculation formulas used with variable definitions
- Intermediate calculation steps
- Standard references and compliance status
- Timestamp and system version
- Professional disclaimer