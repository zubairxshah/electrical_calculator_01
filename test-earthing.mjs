import { calculateEarthingConductor } from './lib/calculations/earthing/earthingCalculator.js'

// Test basic calculation
const result = calculateEarthingConductor({
  voltage: 400,
  faultCurrent: 25,
  faultDuration: 1,
  material: 'copper',
  installationType: 'cable',
  standard: 'IEC'
})

console.log('Test Result:')
console.log('Conductor Size:', result.conductorSize, 'mm²')
console.log('Calculated Size:', result.calculatedSize.toFixed(2), 'mm²')
console.log('k-Value:', result.kValue)
console.log('Compliance:', result.compliance)
console.log('Safety Margin:', result.safetyMargin.toFixed(2), '%')
console.log('\nCalculation Steps:')
result.calculationSteps.forEach(step => console.log('  ', step))
console.log('\nAlternatives:', result.alternatives)
if (result.warnings.length > 0) {
  console.log('\nWarnings:')
  result.warnings.forEach(w => console.log('  -', w))
}
