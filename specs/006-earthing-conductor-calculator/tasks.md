# Tasks - Earthing Conductor Calculator

## Phase 1: Core Calculation Engine

### Task 1.1: Standards Research and Validation
**Priority**: P0 - Critical
**Estimate**: 4 hours
**Dependencies**: Access to IEC 60364-5-54 and NEC 250 standards

**Description**: Research and validate calculation formulas, k-values, and requirements from official standards documents.

**Acceptance Criteria**:
- [ ] IEC 60364-5-54 formula verified: S = I × √t / k
- [ ] NEC 250 formula verified and compared with IEC
- [ ] Material k-values documented with sources
- [ ] Temperature coefficients identified
- [ ] Installation method factors documented
- [ ] Safety factor requirements clarified

**Test Cases**:
```typescript
// Test Case 1.1.1: IEC Formula Verification
// Example from IEC 60364-5-54: 25kA, 1s, copper cable
expect(calculateEarthing({
  faultCurrent: 25, faultDuration: 1, material: 'copper', 
  installationType: 'cable', standard: 'IEC'
})).toEqual({ conductorSize: 175, compliance: 'IEC 60364-5-54' })

// Test Case 1.1.2: NEC Formula Verification  
// Example from NEC 250: Same parameters
expect(calculateEarthing({
  faultCurrent: 25, faultDuration: 1, material: 'copper',
  installationType: 'cable', standard: 'NEC'
})).toEqual({ conductorSize: 175, compliance: 'NEC 250' })
```

**Standards References**:
- IEC 60364-5-54 Section 543.1.3
- NEC 250.122 and Table 250.122
- BS 7671 Section 543.1.3

### Task 1.2: Calculation Engine Implementation
**Priority**: P0 - Critical
**Estimate**: 6 hours
**Dependencies**: Task 1.1

**Description**: Implement core calculation engine with proper formula implementation and material constants.

**Acceptance Criteria**:
- [ ] Core calculation function implemented
- [ ] Material constants properly defined
- [ ] Standard size rounding implemented
- [ ] Safety factor application working
- [ ] Input validation with engineering limits
- [ ] Error handling for edge cases

**Test Cases**:
```typescript
// Test Case 1.2.1: Basic Calculation
const result = calculateEarthingConductor({
  voltage: 400,
  faultCurrent: 25,
  faultDuration: 1,
  material: 'copper',
  installationType: 'cable',
  standard: 'IEC'
})
expect(result.conductorSize).toBe(175)
expect(result.kValue).toBe(143)

// Test Case 1.2.2: Safety Factor Application
const resultWithSafety = calculateEarthingConductor({
  ...basicInputs,
  safetyFactor: 20
})
expect(resultWithSafety.conductorSize).toBeGreaterThan(result.conductorSize)

// Test Case 1.2.3: Standard Size Rounding
expect(roundToStandardSize(173.2)).toBe(185) // Next standard size
expect(roundToStandardSize(150.0)).toBe(150) // Exact match
```

**Files to Create**:
- `lib/calculations/earthing/earthingCalculator.ts`
- `lib/calculations/earthing/materialConstants.ts`
- `lib/calculations/earthing/standardSizes.ts`

### Task 1.3: Multi-Standard Support
**Priority**: P0 - Critical
**Estimate**: 3 hours
**Dependencies**: Task 1.2

**Description**: Implement support for both IEC and NEC standards with proper constant switching.

**Acceptance Criteria**:
- [ ] IEC 60364-5-54 calculations working
- [ ] NEC 250 calculations working
- [ ] Standard switching preserves accuracy
- [ ] Different k-values applied correctly
- [ ] Compliance verification implemented
- [ ] Standards comparison available

**Test Cases**:
```typescript
// Test Case 1.3.1: Standards Comparison
const iecResult = calculateEarthing({...inputs, standard: 'IEC'})
const necResult = calculateEarthing({...inputs, standard: 'NEC'})
expect(iecResult.standard).toBe('IEC')
expect(necResult.standard).toBe('NEC')
// Results should be identical for same k-values
expect(iecResult.conductorSize).toBe(necResult.conductorSize)

// Test Case 1.3.2: Standard-Specific Validation
expect(() => calculateEarthing({
  ...inputs, faultCurrent: 300, standard: 'IEC'
})).not.toThrow() // IEC allows higher currents
```

**Files to Modify**:
- `lib/calculations/earthing/earthingCalculator.ts`
- Add standards switching logic

## Phase 2: User Interface Development

### Task 2.1: Input Form Components
**Priority**: P1 - High
**Estimate**: 4 hours
**Dependencies**: Task 1.3

**Description**: Create responsive input forms with basic and advanced parameter modes.

**Acceptance Criteria**:
- [ ] Basic input form with essential parameters
- [ ] Advanced input form with optional parameters
- [ ] Real-time input validation
- [ ] Unit selection and conversion
- [ ] Standards selection dropdown
- [ ] Material and installation type selection

**Test Cases**:
```typescript
// Test Case 2.1.1: Input Validation
render(<EarthingInputForm />)
const voltageInput = screen.getByLabelText('System Voltage')
fireEvent.change(voltageInput, { target: { value: '-100' } })
expect(screen.getByText('Voltage must be positive')).toBeInTheDocument()

// Test Case 2.1.2: Standards Switching
const standardSelect = screen.getByLabelText('Standard')
fireEvent.change(standardSelect, { target: { value: 'NEC' } })
expect(screen.getByText('NEC 250')).toBeInTheDocument()
```

**Files to Create**:
- `components/earthing/EarthingInputForm.tsx`
- `components/earthing/BasicInputs.tsx`
- `components/earthing/AdvancedInputs.tsx`

### Task 2.2: Results Display Component
**Priority**: P1 - High
**Estimate**: 3 hours
**Dependencies**: Task 2.1

**Description**: Create results display with calculation details and compliance verification.

**Acceptance Criteria**:
- [ ] Conductor size display with units
- [ ] Compliance status with standard reference
- [ ] Safety margin calculation
- [ ] Formula display with values
- [ ] Alternative size recommendations
- [ ] Warning indicators for edge cases

**Test Cases**:
```typescript
// Test Case 2.2.1: Results Display
const mockResult = {
  conductorSize: 185,
  compliance: 'IEC 60364-5-54',
  safetyMargin: 15.2,
  kValue: 143
}
render(<EarthingResults result={mockResult} />)
expect(screen.getByText('185 mm²')).toBeInTheDocument()
expect(screen.getByText('✓ Compliant')).toBeInTheDocument()

// Test Case 2.2.2: Formula Display
expect(screen.getByText(/S = I × √t \/ k/)).toBeInTheDocument()
expect(screen.getByText(/25 × √1 \/ 143/)).toBeInTheDocument()
```

**Files to Create**:
- `components/earthing/EarthingResults.tsx`
- `components/earthing/FormulaDisplay.tsx`
- `components/earthing/ComplianceIndicator.tsx`

### Task 2.3: Main Calculator Integration
**Priority**: P1 - High
**Estimate**: 3 hours
**Dependencies**: Task 2.2

**Description**: Integrate all components into main calculator tool with state management.

**Acceptance Criteria**:
- [ ] State management for all inputs
- [ ] Real-time calculation updates
- [ ] Error boundary implementation
- [ ] Loading states during calculation
- [ ] Responsive layout for mobile/desktop
- [ ] Navigation integration

**Test Cases**:
```typescript
// Test Case 2.3.1: End-to-End Calculation
render(<EarthingCalculatorTool />)
// Fill in basic inputs
fireEvent.change(screen.getByLabelText('Fault Current'), { target: { value: '25' } })
fireEvent.change(screen.getByLabelText('Fault Duration'), { target: { value: '1' } })
fireEvent.click(screen.getByText('Calculate'))
// Verify results appear
expect(screen.getByText(/mm²/)).toBeInTheDocument()

// Test Case 2.3.2: Error Handling
fireEvent.change(screen.getByLabelText('Fault Current'), { target: { value: 'invalid' } })
expect(screen.getByText(/Invalid input/)).toBeInTheDocument()
```

**Files to Create**:
- `app/earthing/EarthingCalculatorTool.tsx`
- `app/earthing/page.tsx`

## Phase 3: Testing and Validation

### Task 3.1: Standards Compliance Testing
**Priority**: P0 - Critical
**Estimate**: 6 hours
**Dependencies**: Task 2.3

**Description**: Comprehensive testing against official standards examples and commercial calculators.

**Acceptance Criteria**:
- [ ] All IEC 60364-5-54 examples pass
- [ ] All NEC 250 examples pass
- [ ] Results match commercial calculators
- [ ] Edge cases handled correctly
- [ ] Performance meets <100ms target
- [ ] Accuracy within ±1% tolerance

**Test Cases**:
```typescript
// Test Case 3.1.1: IEC Standard Examples
const iecExamples = [
  { input: {faultCurrent: 10, duration: 0.5, material: 'copper'}, expected: 35 },
  { input: {faultCurrent: 25, duration: 1.0, material: 'copper'}, expected: 175 },
  { input: {faultCurrent: 50, duration: 0.2, material: 'aluminum'}, expected: 185 }
]
iecExamples.forEach(example => {
  const result = calculateEarthing({...example.input, standard: 'IEC'})
  expect(result.conductorSize).toBe(example.expected)
})

// Test Case 3.1.2: Commercial Calculator Comparison
// Compare with Schneider Electric, ABB, Siemens calculators
const commercialComparison = [
  { schneider: 185, abb: 185, siemens: 185, ourResult: 185 },
  // Add more comparison cases
]
```

**Validation Sources**:
- IEC 60364-5-54 worked examples
- NEC Handbook examples
- Schneider Electric calculator
- ABB calculation tools
- Siemens engineering software

### Task 3.2: Performance and Accuracy Testing
**Priority**: P1 - High
**Estimate**: 3 hours
**Dependencies**: Task 3.1

**Description**: Performance benchmarking and accuracy verification across all supported scenarios.

**Acceptance Criteria**:
- [ ] <100ms calculation response time
- [ ] ±1% accuracy for all test cases
- [ ] Memory usage within limits
- [ ] No memory leaks detected
- [ ] Concurrent user support
- [ ] Error rate <0.1%

**Test Cases**:
```typescript
// Test Case 3.2.1: Performance Benchmarking
const performanceTest = () => {
  const start = performance.now()
  for (let i = 0; i < 1000; i++) {
    calculateEarthing(testInputs)
  }
  const duration = performance.now() - start
  expect(duration / 1000).toBeLessThan(100) // <100ms average
}

// Test Case 3.2.2: Accuracy Verification
const accuracyTest = (knownResults) => {
  knownResults.forEach(test => {
    const result = calculateEarthing(test.input)
    const accuracy = Math.abs(result.conductorSize - test.expected) / test.expected
    expect(accuracy).toBeLessThan(0.01) // <1% error
  })
}
```

**Files to Create**:
- `__tests__/earthing/performance.test.ts`
- `__tests__/earthing/accuracy.test.ts`
- `__tests__/earthing/standards.test.ts`

### Task 3.3: Integration Testing
**Priority**: P1 - High
**Estimate**: 2 hours
**Dependencies**: Task 3.2

**Description**: End-to-end testing of complete user workflows and platform integration.

**Acceptance Criteria**:
- [ ] Complete user workflows tested
- [ ] Navigation integration working
- [ ] Mobile responsiveness verified
- [ ] Accessibility compliance tested
- [ ] Error handling comprehensive
- [ ] PDF generation working

**Test Cases**:
```typescript
// Test Case 3.3.1: Complete User Workflow
test('Complete earthing calculation workflow', async () => {
  render(<EarthingCalculatorTool />)
  
  // Basic inputs
  await userEvent.type(screen.getByLabelText('System Voltage'), '400')
  await userEvent.type(screen.getByLabelText('Fault Current'), '25')
  await userEvent.selectOptions(screen.getByLabelText('Standard'), 'IEC')
  
  // Calculate
  await userEvent.click(screen.getByText('Calculate'))
  
  // Verify results
  expect(screen.getByText(/185 mm²/)).toBeInTheDocument()
  expect(screen.getByText(/Compliant/)).toBeInTheDocument()
  
  // PDF generation
  await userEvent.click(screen.getByText('Download PDF'))
  // Verify PDF download initiated
})

// Test Case 3.3.2: Mobile Responsiveness
test('Mobile layout works correctly', () => {
  Object.defineProperty(window, 'innerWidth', { value: 375 })
  render(<EarthingCalculatorTool />)
  // Verify mobile layout elements
})
```

**Files to Create**:
- `__tests__/earthing/integration.test.ts`
- `__tests__/earthing/accessibility.test.ts`

## Phase 4: Documentation and Reporting

### Task 4.1: PDF Report Generation
**Priority**: P1 - High
**Estimate**: 4 hours
**Dependencies**: Task 3.3

**Description**: Implement professional PDF report generation with complete calculation documentation.

**Acceptance Criteria**:
- [ ] Professional report layout
- [ ] Complete input parameter summary
- [ ] Step-by-step calculation display
- [ ] Standards references included
- [ ] Compliance verification shown
- [ ] Engineer signature block
- [ ] Project information fields

**Test Cases**:
```typescript
// Test Case 4.1.1: PDF Generation
const reportData = {
  inputs: mockInputs,
  results: mockResults,
  project: { name: 'Test Project', engineer: 'John Doe' }
}
const pdf = generateEarthingReport(reportData)
expect(pdf).toBeDefined()
expect(pdf.pages).toBeGreaterThan(0)

// Test Case 4.1.2: Report Content Verification
const pdfText = extractTextFromPDF(pdf)
expect(pdfText).toContain('Earthing Conductor Calculation')
expect(pdfText).toContain('IEC 60364-5-54')
expect(pdfText).toContain('185 mm²')
```

**Files to Create**:
- `lib/reports/earthingPdfGenerator.ts`
- `components/earthing/PDFReportButton.tsx`

### Task 4.2: Help Documentation
**Priority**: P2 - Medium
**Estimate**: 2 hours
**Dependencies**: Task 4.1

**Description**: Create comprehensive help documentation and standards reference.

**Acceptance Criteria**:
- [ ] User guide for basic calculations
- [ ] Advanced features documentation
- [ ] Standards reference section
- [ ] Formula explanations
- [ ] Troubleshooting guide
- [ ] FAQ section

**Files to Create**:
- `docs/earthing-calculator-guide.md`
- `components/earthing/HelpPanel.tsx`

## Validation and Testing Summary

### Standards Verification Checklist
- [ ] IEC 60364-5-54 examples verified
- [ ] NEC 250 examples verified
- [ ] BS 7671 compatibility checked
- [ ] Professional engineer review completed
- [ ] Commercial calculator comparison done

### Performance Validation Checklist
- [ ] <100ms calculation response time achieved
- [ ] ±1% accuracy verified across all test cases
- [ ] Memory usage optimized
- [ ] Concurrent user support tested
- [ ] Error handling comprehensive

### User Experience Validation Checklist
- [ ] Mobile responsiveness verified
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Professional PDF reports generated
- [ ] Help documentation complete
- [ ] Integration with ElectroMate platform seamless

### Success Metrics
- **Calculation Accuracy**: 100% of test cases within ±1%
- **Performance**: <100ms average response time
- **Standards Compliance**: Verified by professional engineer
- **User Satisfaction**: Positive feedback from beta testers
- **Platform Integration**: Seamless ElectroMate integration