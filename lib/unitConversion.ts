/**
 * Unit Conversion Functions for Dual Standards Support
 *
 * Supports Constitution Principle IV: Dual Standards Support (IEC/NEC)
 * - IEC: SI units (mm², meters, °C)
 * - NEC: North American units (AWG, feet, °F)
 *
 * All conversions use Math.js BigNumber for precision
 *
 * @see specs/001-electromate-engineering-app/spec.md#FR-005
 */

import { math, toBigNumber, toNumber, round } from './mathConfig'

/**
 * AWG to mm² cross-sectional area conversion
 *
 * Formula: Area (mm²) = (π/4) × (0.127 × 92^((36-AWG)/39))²
 * Reference: NEC Chapter 9, Table 8
 *
 * @param awg - AWG wire size (4/0=0000, 3/0=000, 2/0=00, 1/0=0, 1-40)
 * @returns Cross-sectional area in mm²
 *
 * @example
 * awgToMm2(12) // 3.31 mm²
 * awgToMm2("4/0") // 107.2 mm²
 */
export function awgToMm2(awg: number | string): number {
  let awgNum: number

  // Handle AWG format: 4/0, 3/0, 2/0, 1/0
  if (typeof awg === 'string') {
    const match = awg.match(/^(\d+)\/0$/)
    if (match) {
      awgNum = -parseInt(match[1]) + 1 // 4/0 = -3, 3/0 = -2, 2/0 = -1, 1/0 = 0
    } else {
      awgNum = parseInt(awg)
    }
  } else {
    awgNum = awg
  }

  // AWG formula: diameter (mm) = 0.127 * 92^((36-AWG)/39)
  const exponent = math.divide(math.subtract(36, awgNum), 39)
  const diameterMm = math.multiply(0.127, math.pow(92, exponent))

  // Area = π/4 * diameter²
  const areaMm2 = math.multiply(
    math.divide(math.pi, 4),
    math.pow(diameterMm, 2)
  )

  return toNumber(round(areaMm2 as math.BigNumber, 2))
}

/**
 * mm² to AWG wire size conversion (finds nearest standard AWG)
 *
 * @param mm2 - Cross-sectional area in mm²
 * @returns Nearest standard AWG size as string (e.g., "12", "4/0")
 *
 * @example
 * mm2ToAwg(3.31) // "12"
 * mm2ToAwg(107.2) // "4/0"
 */
export function mm2ToAwg(mm2: number): string {
  // Standard AWG sizes from 4/0 to 40
  const awgSizes = [
    { awg: '4/0', mm2: 107.2 },
    { awg: '3/0', mm2: 85.0 },
    { awg: '2/0', mm2: 67.4 },
    { awg: '1/0', mm2: 53.5 },
    { awg: '1', mm2: 42.4 },
    { awg: '2', mm2: 33.6 },
    { awg: '3', mm2: 26.7 },
    { awg: '4', mm2: 21.2 },
    { awg: '5', mm2: 16.8 },
    { awg: '6', mm2: 13.3 },
    { awg: '7', mm2: 10.5 },
    { awg: '8', mm2: 8.37 },
    { awg: '9', mm2: 6.63 },
    { awg: '10', mm2: 5.26 },
    { awg: '11', mm2: 4.17 },
    { awg: '12', mm2: 3.31 },
    { awg: '13', mm2: 2.62 },
    { awg: '14', mm2: 2.08 },
    { awg: '15', mm2: 1.65 },
    { awg: '16', mm2: 1.31 },
    { awg: '17', mm2: 1.04 },
    { awg: '18', mm2: 0.823 },
    { awg: '19', mm2: 0.653 },
    { awg: '20', mm2: 0.518 },
    { awg: '22', mm2: 0.324 },
    { awg: '24', mm2: 0.205 },
    { awg: '26', mm2: 0.129 },
    { awg: '28', mm2: 0.0804 },
    { awg: '30', mm2: 0.0509 },
  ]

  // Find nearest AWG by minimum difference
  let nearest = awgSizes[0]
  let minDiff = Math.abs(mm2 - nearest.mm2)

  for (const size of awgSizes) {
    const diff = Math.abs(mm2 - size.mm2)
    if (diff < minDiff) {
      minDiff = diff
      nearest = size
    }
  }

  return nearest.awg
}

/**
 * Meters to feet conversion
 *
 * @param meters - Length in meters
 * @returns Length in feet
 *
 * @example
 * metersToFeet(100) // 328.08 feet
 */
export function metersToFeet(meters: number): number {
  const metersBN = toBigNumber(meters)
  const feetBN = math.multiply(metersBN, 3.28084)
  return toNumber(round(feetBN as math.BigNumber, 2))
}

/**
 * Feet to meters conversion
 *
 * @param feet - Length in feet
 * @returns Length in meters
 *
 * @example
 * feetToMeters(328.08) // 100 meters
 */
export function feetToMeters(feet: number): number {
  const feetBN = toBigNumber(feet)
  const metersBN = math.divide(feetBN, 3.28084)
  return toNumber(round(metersBN as math.BigNumber, 2))
}

/**
 * Celsius to Fahrenheit conversion
 *
 * Formula: °F = (°C × 9/5) + 32
 *
 * @param celsius - Temperature in °C
 * @returns Temperature in °F
 *
 * @example
 * celsiusToFahrenheit(25) // 77°F
 * celsiusToFahrenheit(-40) // -40°F
 */
export function celsiusToFahrenheit(celsius: number): number {
  const celsiusBN = toBigNumber(celsius)
  const fahrenheitBN = math.add(
    math.multiply(celsiusBN, math.divide(9, 5)),
    32
  )
  return toNumber(round(fahrenheitBN as math.BigNumber, 1))
}

/**
 * Fahrenheit to Celsius conversion
 *
 * Formula: °C = (°F - 32) × 5/9
 *
 * @param fahrenheit - Temperature in °F
 * @returns Temperature in °C
 *
 * @example
 * fahrenheitToCelsius(77) // 25°C
 * fahrenheitToCelsius(-40) // -40°C
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  const fahrenheitBN = toBigNumber(fahrenheit)
  const celsiusBN = math.multiply(
    math.subtract(fahrenheitBN, 32),
    math.divide(5, 9)
  )
  return toNumber(round(celsiusBN as math.BigNumber, 1))
}

/**
 * Watts to horsepower conversion
 *
 * 1 HP = 746 watts (mechanical horsepower)
 *
 * @param watts - Power in watts
 * @returns Power in HP
 *
 * @example
 * wattsToHp(746) // 1 HP
 * wattsToHp(2000) // 2.68 HP
 */
export function wattsToHp(watts: number): number {
  const wattsBN = toBigNumber(watts)
  const hpBN = math.divide(wattsBN, 746)
  return toNumber(round(hpBN as math.BigNumber, 2))
}

/**
 * Horsepower to watts conversion
 *
 * @param hp - Power in HP
 * @returns Power in watts
 *
 * @example
 * hpToWatts(1) // 746 watts
 */
export function hpToWatts(hp: number): number {
  const hpBN = toBigNumber(hp)
  const wattsBN = math.multiply(hpBN, 746)
  return toNumber(round(wattsBN as math.BigNumber, 0))
}

/**
 * kVA to kW conversion (requires power factor)
 *
 * Formula: kW = kVA × power factor
 *
 * @param kva - Apparent power in kVA
 * @param powerFactor - Power factor (0-1, typically 0.8)
 * @returns Real power in kW
 *
 * @example
 * kvaToKw(10, 0.8) // 8 kW
 */
export function kvaToKw(kva: number, powerFactor: number): number {
  const kvaBN = toBigNumber(kva)
  const pfBN = toBigNumber(powerFactor)
  const kwBN = math.multiply(kvaBN, pfBN)
  return toNumber(round(kwBN as math.BigNumber, 2))
}

/**
 * kW to kVA conversion (requires power factor)
 *
 * Formula: kVA = kW / power factor
 *
 * @param kw - Real power in kW
 * @param powerFactor - Power factor (0-1, typically 0.8)
 * @returns Apparent power in kVA
 *
 * @example
 * kwToKva(8, 0.8) // 10 kVA
 */
export function kwToKva(kw: number, powerFactor: number): number {
  const kwBN = toBigNumber(kw)
  const pfBN = toBigNumber(powerFactor)
  const kvaBN = math.divide(kwBN, pfBN)
  return toNumber(round(kvaBN as math.BigNumber, 2))
}

/**
 * Amps to watts conversion (DC or single-phase AC)
 *
 * Formula: W = V × I × PF (for AC) or W = V × I (for DC, PF=1)
 *
 * @param amps - Current in amperes
 * @param voltage - Voltage
 * @param powerFactor - Power factor (default 1.0 for DC)
 * @returns Power in watts
 *
 * @example
 * ampsToWatts(10, 48, 1.0) // 480 watts (DC)
 * ampsToWatts(10, 120, 0.8) // 960 watts (AC with PF=0.8)
 */
export function ampsToWatts(amps: number, voltage: number, powerFactor: number = 1.0): number {
  const ampsBN = toBigNumber(amps)
  const voltageBN = toBigNumber(voltage)
  const pfBN = toBigNumber(powerFactor)
  const wattsBN = math.multiply(math.multiply(voltageBN, ampsBN), pfBN)
  return toNumber(round(wattsBN as math.BigNumber, 2))
}

/**
 * Watts to amps conversion (DC or single-phase AC)
 *
 * Formula: I = W / (V × PF)
 *
 * @param watts - Power in watts
 * @param voltage - Voltage
 * @param powerFactor - Power factor (default 1.0 for DC)
 * @returns Current in amperes
 *
 * @example
 * wattsToAmps(480, 48, 1.0) // 10 amps (DC)
 * wattsToAmps(960, 120, 0.8) // 10 amps (AC with PF=0.8)
 */
export function wattsToAmps(watts: number, voltage: number, powerFactor: number = 1.0): number {
  const wattsBN = toBigNumber(watts)
  const voltageBN = toBigNumber(voltage)
  const pfBN = toBigNumber(powerFactor)
  const ampsBN = math.divide(wattsBN, math.multiply(voltageBN, pfBN))
  return toNumber(round(ampsBN as math.BigNumber, 2))
}

/**
 * Three-phase watts to amps conversion
 *
 * Formula: I = W / (√3 × V × PF)
 *
 * @param watts - Power in watts
 * @param voltage - Line-to-line voltage
 * @param powerFactor - Power factor
 * @returns Current in amperes per phase
 *
 * @example
 * wattsToAmpsThreePhase(10000, 400, 0.85) // 17.0 amps per phase
 */
export function wattsToAmpsThreePhase(watts: number, voltage: number, powerFactor: number): number {
  const wattsBN = toBigNumber(watts)
  const voltageBN = toBigNumber(voltage)
  const pfBN = toBigNumber(powerFactor)
  const sqrt3 = math.sqrt(3)
  const ampsBN = math.divide(wattsBN, math.multiply(math.multiply(sqrt3, voltageBN), pfBN))
  return toNumber(round(ampsBN as math.BigNumber, 2))
}
