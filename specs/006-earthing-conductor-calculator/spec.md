# Earthing Conductor Calculator Specification

## Overview

Build a professional earthing conductor sizing calculator that complies with international standards (BS EN IEC 60364-5-54, NEC 250) and provides accurate, auditable calculations for electrical engineers.

## 1. 🎯 Purpose

To calculate the required **earthing conductor size** (cable, bare copper, or strip) based on user inputs, aligned with international standards (**BS EN IEC, NEC**). The calculator should:
- Accept both **basic inputs** (typical values) and **advanced inputs** (complex engineering parameters)
- Recommend conductor sizes with respect to user requirements
- Generate a **PDF report** summarizing inputs, calculations, and recommendations
- Provide auditable calculations with intermediate steps for transparency
- Support flexible standards switching between BS EN IEC and NEC

## 2. 🖥️ User Inputs

### **Basic Inputs (Typical Values)**
- System Voltage (V) - Range: 1V to 1000kV
- Fault Current (kA) - Range: 0.1kA to 200kA
- Fault Duration (s) - Range: 0.1s to 5s
- Material type (Copper, Aluminum, etc.)
- Installation type (Cable, Bare Copper, Strip)
- Standard selection (BS EN IEC / NEC)

### **Advanced Inputs (Complex Values)**
- Soil resistivity (Ω·m) - Range: 1 to 10,000 Ω·m
- Ambient temperature (°C) - Range: -40°C to +85°C
- Conductor permissible temperature rise (°C) - Range: 100°C to 300°C
- Protective device clearing time (s) - Range: 0.1s to 5s
- Earthing system type (TN-S, TN-C, TT, IT)
- Short-circuit withstand capacity (A²s)
- Safety factor (user-defined %) - Range: 0% to 100%

## 3. ⚙️ Calculation Logic

### **General Formula (IEC 60364-5-54 / NEC 250)**
```
S = (I × √t) / k
```

Where:
- S = Minimum cross-sectional area of conductor (mm²)
- I = Fault current (A)
- t = Fault duration (s)
- k = Material constant (depends on conductor type, insulation, permissible temperature rise)

### **Material Constants (k-values)**
- **Copper (bare)**: ~226 (IEC), ~226 (NEC)
- **Aluminum (bare)**: ~135 (IEC), ~135 (NEC)
- **Copper (PVC insulated)**: ~143 (IEC), ~143 (NEC)
- **Aluminum (PVC insulated)**: ~94 (IEC), ~94 (NEC)

*Values vary by standard; calculator must switch between BS EN IEC and NEC tables*

### **Temperature Correction Factors**
- Account for ambient temperature variations
- Apply conductor temperature rise limits
- Adjust k-values based on installation conditions

## 4. 📊 Outputs

- **Recommended conductor size** (mm² or strip dimensions)
- **Compliance check** (meets BS EN IEC or NEC requirements)
- **Alternative sizes** (if user wants redundancy or cost optimization)
- **Safety margin applied** (percentage above minimum)
- **Notes on assumptions** (temperature rise, soil resistivity, etc.)
- **Formula derivation** with intermediate calculation steps
- **Standard size rounding** to available conductor sizes
- **Cost optimization suggestions** with alternative materials

## 5. 📑 Report Generation (PDF)

### Report Sections:
1. **Title Page** – Project name, date, engineer details
2. **Inputs Summary** – All user-provided values with units
3. **Calculation Steps** – Formula used, intermediate results, constants applied
4. **Results** – Recommended conductor size(s), compliance with selected standard
5. **Comparison Table** – Sizes per BS EN IEC vs NEC (if both selected)
6. **Conclusion & Recommendations** – Final choice with safety margin
7. **Appendix** – Reference standards, equations, assumptions
8. **Professional Disclaimer** – Engineering review requirements

## 6. 🔄 Flexibility

- **Switch Standards**: Toggle between BS EN IEC and NEC with real-time recalculation
- **Material Options**: Copper, Aluminum, Bare, Strip with cost implications
- **User Control**: Allow override of constants (k-values, soil resistivity)
- **Auditability**: Show intermediate steps for transparency
- **Unit Systems**: Support both metric (mm²) and imperial (kcmil) units
- **Installation Methods**: Account for different installation environments

## 7. 🛠️ Example Prompt Flow

**User Prompt (Basic):**
> "Calculate earthing conductor size for copper cable, 400V system, 25kA fault current, 1s duration, using IEC standard."

**Calculator Response:**
- Inputs validated ✓
- Formula applied: S = (25,000 × √1) / 143 = 174.8 mm²
- Standard size rounding: **185 mm² Copper Cable**
- Compliance: IEC 60364-5-54 ✓
- Safety margin: 5.8% above minimum
- PDF report generated ✓

## User Stories

### US-001: Basic Earthing Conductor Sizing
**As an** electrical engineer  
**I want** to calculate earthing conductor size using basic parameters  
**So that** I can quickly size conductors for standard installations  

**Acceptance Criteria:**
- [ ] Input system voltage, fault current, fault duration
- [ ] Select material (copper/aluminum) and installation type
- [ ] Choose standard (IEC/NEC)
- [ ] Calculate minimum conductor size per formula S = I × √t / k
- [ ] Display result with compliance verification
- [ ] Show safety margin above minimum requirement

### US-002: Advanced Parameter Configuration
**As a** consulting engineer  
**I want** to specify advanced parameters for complex installations  
**So that** I can account for specific site conditions  

**Acceptance Criteria:**
- [ ] Configure soil resistivity, ambient temperature
- [ ] Set conductor temperature rise limits
- [ ] Apply custom safety factors
- [ ] Account for earthing system type (TN-S, TN-C, TT, IT)
- [ ] Override material k-values if needed
- [ ] Validate all inputs within engineering limits

### US-003: Standards Compliance Verification
**As an** electrical engineer  
**I want** calculations verified against multiple standards  
**So that** I can ensure regulatory compliance  

**Acceptance Criteria:**
- [ ] Support IEC 60364-5-54 calculations
- [ ] Support NEC 250 calculations
- [ ] Display applicable standard references
- [ ] Show formula derivation and constants used
- [ ] Highlight any non-compliance issues
- [ ] Provide alternative solutions if needed

### US-004: Professional Documentation
**As an** electrical engineer  
**I want** to generate professional calculation reports  
**So that** I can submit to authorities and clients  

**Acceptance Criteria:**
- [ ] Generate PDF report with all inputs and results
- [ ] Include calculation steps and formulas
- [ ] Reference applicable standards
- [ ] Add project information and engineer details
- [ ] Include comparison table for different standards
- [ ] Provide recommendations and conclusions

## Technical Requirements

### Calculation Engine
- **Formula**: S = I × √t / k (IEC 60364-5-54, NEC 250)
- **Precision**: ±1% accuracy for conductor sizing
- **Performance**: <100ms calculation time
- **Standards**: IEC 60364-5-54, NEC 250, BS 7671
- **Auditability**: Show all intermediate calculation steps
- **Flexibility**: Allow user override of material constants

### Material Constants (k-values) - Enhanced
- **Copper (bare)**: 226 (IEC), 226 (NEC)
- **Copper (PVC insulated 70°C)**: 143 (IEC), 143 (NEC)
- **Copper (XLPE insulated 90°C)**: 176 (IEC), 176 (NEC)
- **Aluminum (bare)**: 135 (IEC), 135 (NEC)
- **Aluminum (PVC insulated 70°C)**: 94 (IEC), 94 (NEC)
- **Aluminum (XLPE insulated 90°C)**: 116 (IEC), 116 (NEC)
- **Steel**: 52 (IEC), 52 (NEC)

### Input Validation - Enhanced
- **Voltage**: 1V - 1000kV with logarithmic validation
- **Fault Current**: 0.1kA - 200kA with engineering limits
- **Fault Duration**: 0.1s - 5s with protective device coordination
- **Temperature**: -40°C to +85°C ambient, up to 300°C conductor
- **Safety Factor**: 0% - 100% with recommended defaults
- **Soil Resistivity**: 1 - 10,000 Ω·m with typical values database
- **Cross-validation**: Check parameter consistency and engineering feasibility

### Output Requirements - Enhanced
- **Conductor Size**: mm² (metric) or kcmil (imperial) with automatic conversion
- **Standard Sizes**: Round up to IEC 60228 or ANSI/NEMA standard sizes
- **Compliance**: Pass/fail with specific standard clause references
- **Safety Margin**: Percentage above minimum with color coding
- **Alternative Options**: Next size up/down with cost and performance implications
- **Installation Notes**: Specific requirements for chosen installation method
- **Economic Analysis**: Material cost comparison and optimization suggestions

## Standards References - Enhanced

### IEC 60364-5-54 (Low-voltage electrical installations)
- **Section 543.1.3**: Earthing arrangements and protective conductors
- **Formula**: S = I × √t / k with specific k-value tables
- **Material constants**: Table 54.2 - k values for protective conductors
- **Installation methods**: Clause 543.3 - Installation and connection requirements
- **Temperature considerations**: Annex A - Temperature coefficients
- **Verification requirements**: Section 543.7 - Testing and inspection

### NEC 250 (Grounding and Bonding)
- **Section 250.122**: Equipment grounding conductor sizing
- **Table 250.122**: Minimum size equipment grounding conductors
- **Section 250.166**: Size of the direct-current grounding electrode conductor
- **Material specifications**: Section 250.118 - Types of equipment grounding conductors
- **Installation requirements**: Section 250.120 - Equipment grounding conductor installation
- **Bonding requirements**: Section 250.102 - Bonding jumpers and conductors

### BS 7671 (18th Edition) - UK Implementation
- **Section 543**: Protective conductors
- **Regulation 543.1.3**: Cross-sectional areas of protective conductors
- **Table 54.7**: Minimum cross-sectional area of protective conductors
- **Additional safety requirements**: Enhanced protection for special locations
- **Installation method classifications**: Method-specific derating factors
- **Inspection and testing**: Part 6 - Verification requirements

### Additional Standards
- **IEC 60228**: Conductors of insulated cables (standard sizes)
- **IEC 61936-1**: Power installations exceeding 1 kV a.c.
- **IEEE 80**: Guide for Safety in AC Substation Grounding
- **IEEE 142**: Recommended Practice for Grounding of Industrial and Commercial Power Systems

## Non-Functional Requirements

### Performance
- **Calculation Speed**: <100ms response time
- **Accuracy**: ±1% for conductor sizing
- **Reliability**: 99.9% uptime for calculations
- **Scalability**: Handle 1000+ concurrent users

### Security
- **Input Validation**: Prevent injection attacks
- **Data Privacy**: No storage of calculation data
- **Error Handling**: Safe error messages
- **Audit Trail**: Log calculation requests

### Usability
- **Responsive Design**: Mobile and desktop support
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Internationalization**: Support metric and imperial units
- **Help System**: Context-sensitive guidance

## Success Criteria

### Functional Success
- [ ] Accurate calculations per IEC and NEC standards
- [ ] Professional PDF report generation
- [ ] Real-time input validation and feedback
- [ ] Support for both basic and advanced use cases

### Technical Success
- [ ] <100ms calculation response time
- [ ] Zero critical security vulnerabilities
- [ ] 99.9% calculation accuracy verification
- [ ] Full test coverage for all calculation paths

### Business Success
- [ ] Positive feedback from electrical engineers
- [ ] Integration with existing ElectroMate platform
- [ ] Compliance with professional engineering standards
- [ ] Adoption by consulting firms and contractors

## Constraints

### Technical Constraints
- Must integrate with existing Next.js application
- Use TypeScript for type safety
- Follow existing UI/UX patterns
- Maintain performance standards

### Regulatory Constraints
- Must comply with IEC 60364-5-54
- Must comply with NEC 250
- Must provide auditable calculations
- Must include proper disclaimers

### Business Constraints
- Development timeline: 1 week
- No additional third-party dependencies
- Must work offline (client-side calculations)
- Professional engineering accuracy required

## Risks and Mitigation

### Technical Risks
- **Risk**: Calculation accuracy errors
- **Mitigation**: Extensive testing against known standards
- **Risk**: Performance degradation
- **Mitigation**: Optimize calculation algorithms

### Business Risks
- **Risk**: Standards compliance issues
- **Mitigation**: Verify against official standards documents
- **Risk**: Professional liability concerns
- **Mitigation**: Include appropriate disclaimers

## Dependencies

### Internal Dependencies
- ElectroMate platform architecture
- Existing UI component library
- PDF generation system
- Input validation framework

### External Dependencies
- IEC 60364-5-54 standard
- NEC 250 standard
- BS 7671 standard
- Professional engineering review

## Acceptance Testing - Enhanced

### Test Scenarios
1. **Basic Calculation (IEC)**: 400V, 25kA, 1s, copper cable, IEC → Expected: 185 mm²
2. **Basic Calculation (NEC)**: 480V, 30kA, 0.5s, copper cable, NEC → Expected: 150 mm²
3. **Advanced Calculation**: Custom parameters with soil resistivity and temperature factors
4. **Standards Comparison**: Same inputs with IEC vs NEC showing differences
5. **Edge Cases**: Minimum/maximum input values with boundary testing
6. **Error Handling**: Invalid inputs and boundary conditions
7. **Material Comparison**: Copper vs Aluminum with cost implications
8. **Installation Types**: Cable vs Bare vs Strip conductor sizing
9. **Safety Factor Impact**: 0%, 20%, 50% safety factors comparison
10. **Temperature Effects**: High ambient temperature impact on sizing

### Verification Methods - Enhanced
- **Standards Examples**: Test against official worked examples from IEC 60364-5-54 and NEC 250
- **Commercial Calculator Comparison**: 
  - Schneider Electric Ecodial Advanced Calculation
  - ABB DOC (Design of Electrical Installations)
  - Siemens SIMARIS design
  - ETAP PowerStation
  - SKM PowerTools
- **Professional Engineer Review**: Independent verification by licensed PE
- **Automated Test Suite**: Continuous integration testing
- **Performance Benchmarking**: Response time and accuracy metrics
- **Cross-Platform Testing**: Desktop, tablet, mobile responsiveness
- **Accessibility Testing**: WCAG 2.1 AA compliance verification

### Commercial Tool Benchmarking
1. **Schneider Electric Calculator**
   - Test identical inputs across 20 scenarios
   - Document any differences with explanations
   - Verify k-value consistency

2. **ABB Calculation Tools**
   - Cross-reference IEC calculations
   - Validate material constant applications
   - Compare safety margin approaches

3. **Independent Verification**
   - Third-party engineering consultant review
   - University electrical engineering department validation
   - Professional engineering society feedback