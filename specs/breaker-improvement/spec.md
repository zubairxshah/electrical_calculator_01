# Breaker Calculator Enhancement Specification

## Overview
Enhance the existing breaker calculator to address identified issues with voltage drop analysis, short circuit current considerations, and provide improved recommendations for real-world applications.

## Current State Analysis
- Voltage drop analysis is partially implemented but not well-integrated
- Short circuit current considerations are basic
- Missing safety factors and real-world examples
- Need for market-available breaker size recommendations

## Objectives
1. Fully integrate voltage drop analysis with breaker sizing
2. Enhance short circuit current evaluation
3. Add safety factors based on industry standards
4. Provide market-available breaker size recommendations
5. Improve user interface for better usability

## Requirements

### Functional Requirements
1. **Voltage Drop Integration**
   - Calculate voltage drop based on circuit parameters
   - Automatically recommend cable size if voltage drop exceeds limits
   - Integrate voltage drop analysis with breaker sizing recommendations
   - Support both single-phase and three-phase calculations

2. **Short Circuit Current Analysis**
   - Evaluate fault current vs breaker interrupting capacity
   - Provide recommendations for adequate breaking capacity
   - Account for different system configurations
   - Include safety margins for fault current calculations

3. **Safety Factors & Derating**
   - Apply appropriate safety factors based on load type
   - Include temperature and grouping derating factors
   - Account for altitude and other environmental factors
   - Follow industry standards (NEC, IEC, IEEE)

4. **Market-Available Recommendations**
   - Provide only commercially available breaker sizes
   - Include common brands/models if possible
   - Show price ranges where available
   - Include lead times for special orders

5. **Enhanced User Interface**
   - Clear visualization of all calculated parameters
   - Interactive graphs/charts for voltage drop
   - Clear error and warning messages
   - Responsive design for all devices

### Non-Functional Requirements
1. **Performance**: Calculations should complete within 500ms
2. **Accuracy**: Results should comply with relevant electrical codes
3. **Reliability**: Handle edge cases and invalid inputs gracefully
4. **Security**: No external dependencies for core calculations

## Technical Specifications

### Voltage Drop Calculations
- Formula: VD% = (2 × L × I × R) / (1000 × V) × 100 for single-phase
- Formula: VD% = (√3 × L × I × R) / (1000 × V) × 100 for three-phase
- Limits: 3% for branch circuits, 5% total (NEC 210.19(A))
- Cable resistance values from NEC Chapter 9, Table 8

### Short Circuit Analysis
- Compare available fault current with breaker interrupting capacity (ICU/ICS)
- Minimum safety margin: 125% of available fault current
- Consider both symmetrical and asymmetrical fault conditions
- Account for motor contribution in industrial settings

### Safety Factors
- Continuous loads: 125% (NEC 210.20(A))
- Motor starting: 250% for motor branch circuits (NEC 430.52)
- Transformer primary: 125% for 2-wire, 300% for 3-wire (NEC 450.3(A))
- Ambient temperature derating per NEC Table 310.15(B)(2)(a)
- Conduit fill derating per NEC Table 310.15(B)(3)(a)

## Acceptance Criteria
1. All voltage drop calculations are accurate per NEC/IEC standards
2. Short circuit current analysis prevents undersized breakers
3. Safety factors are properly applied based on load type
4. Market-available recommendations are accurate and current
5. User interface provides clear, understandable results
6. Performance requirements are met
7. Error handling prevents incorrect calculations

## Constraints
- Must comply with current electrical codes (NEC 2020, IEC 60898-1)
- Calculations must be performed client-side (no server dependencies)
- Maintain backward compatibility with existing API
- Support both metric and imperial units

## Risks
- Incorrect code interpretations could lead to unsafe recommendations
- Outdated breaker availability data could cause ordering issues
- Complex calculations may impact performance on older devices
- International standards variations may cause confusion