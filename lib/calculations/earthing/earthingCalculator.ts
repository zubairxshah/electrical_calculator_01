/**
 * Earthing Conductor Calculator
 * Based on IEC 60364-5-54 and NEC 250
 * Formula: S = I × √t / k
 */

import { getKValue, Material, InstallationType, Standard } from './materialConstants'
import { roundToStandardSize, getAlternativeSizes } from './standardSizes'

export interface EarthingInputs {
  voltage: number
  faultCurrent: number
  faultDuration: number
  material: Material
  installationType: InstallationType
  standard: Standard
  safetyFactor?: number
  ambientTemp?: number
  soilResistivity?: number
}

export interface EarthingResult {
  conductorSize: number
  calculatedSize: number
  kValue: number
  compliance: string
  safetyMargin: number
  formula: string
  calculationSteps: string[]
  alternatives: { smaller?: number; larger?: number }
  warnings: string[]
}

export interface ValidationError {
  field: string
  message: string
}

/**
 * Validate earthing calculation inputs
 */
export function validateEarthingInputs(inputs: EarthingInputs): ValidationError[] {
  const errors: ValidationError[] = []

  if (inputs.voltage < 1 || inputs.voltage > 1000000) {
    errors.push({ field: 'voltage', message: 'Voltage must be between 1V and 1000kV' })
  }

  if (inputs.faultCurrent < 0.1 || inputs.faultCurrent > 200) {
    errors.push({ field: 'faultCurrent', message: 'Fault current must be between 0.1kA and 200kA' })
  }

  if (inputs.faultDuration < 0.1 || inputs.faultDuration > 5) {
    errors.push({ field: 'faultDuration', message: 'Fault duration must be between 0.1s and 5s' })
  }

  if (inputs.safetyFactor !== undefined && (inputs.safetyFactor < 0 || inputs.safetyFactor > 100)) {
    errors.push({ field: 'safetyFactor', message: 'Safety factor must be between 0% and 100%' })
  }

  if (inputs.ambientTemp !== undefined && (inputs.ambientTemp < -40 || inputs.ambientTemp > 85)) {
    errors.push({ field: 'ambientTemp', message: 'Ambient temperature must be between -40°C and 85°C' })
  }

  if (inputs.soilResistivity !== undefined && (inputs.soilResistivity < 1 || inputs.soilResistivity > 10000)) {
    errors.push({ field: 'soilResistivity', message: 'Soil resistivity must be between 1 and 10,000 Ω·m' })
  }

  return errors
}

/**
 * Calculate earthing conductor size
 * Formula: S = I × √t / k
 */
export function calculateEarthingConductor(inputs: EarthingInputs): EarthingResult {
  const errors = validateEarthingInputs(inputs)
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`)
  }

  const faultCurrentAmps = inputs.faultCurrent * 1000
  const kValue = getKValue(inputs.material, inputs.installationType, inputs.standard)
  
  const calculationSteps: string[] = []
  const warnings: string[] = []

  calculationSteps.push(`Formula: S = I × √t / k`)
  calculationSteps.push(`Where: I = ${inputs.faultCurrent} kA = ${faultCurrentAmps} A`)
  calculationSteps.push(`       t = ${inputs.faultDuration} s`)
  calculationSteps.push(`       k = ${kValue} (${inputs.material}, ${inputs.installationType}, ${inputs.standard})`)

  const calculatedSize = (faultCurrentAmps * Math.sqrt(inputs.faultDuration)) / kValue
  calculationSteps.push(`Calculated: S = ${faultCurrentAmps} × √${inputs.faultDuration} / ${kValue}`)
  calculationSteps.push(`           S = ${faultCurrentAmps} × ${Math.sqrt(inputs.faultDuration).toFixed(3)} / ${kValue}`)
  calculationSteps.push(`           S = ${calculatedSize.toFixed(2)} mm²`)

  let finalSize = calculatedSize
  if (inputs.safetyFactor && inputs.safetyFactor > 0) {
    finalSize = calculatedSize * (1 + inputs.safetyFactor / 100)
    calculationSteps.push(`With ${inputs.safetyFactor}% safety factor: ${finalSize.toFixed(2)} mm²`)
  }

  const conductorSize = roundToStandardSize(finalSize)
  calculationSteps.push(`Rounded to standard size: ${conductorSize} mm²`)

  const safetyMargin = ((conductorSize - calculatedSize) / calculatedSize) * 100

  if (inputs.faultCurrent > 100) {
    warnings.push('High fault current detected. Verify protective device coordination.')
  }

  if (inputs.faultDuration > 3) {
    warnings.push('Long fault duration. Consider faster protective device.')
  }

  if (safetyMargin < 5) {
    warnings.push('Low safety margin. Consider next size up for additional protection.')
  }

  const compliance = inputs.standard === 'IEC' 
    ? 'IEC 60364-5-54 Section 543.1.3' 
    : 'NEC 250.122'

  return {
    conductorSize,
    calculatedSize,
    kValue,
    compliance,
    safetyMargin,
    formula: `S = ${faultCurrentAmps} × √${inputs.faultDuration} / ${kValue}`,
    calculationSteps,
    alternatives: getAlternativeSizes(conductorSize),
    warnings
  }
}
