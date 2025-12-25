/**
 * TypeScript type definitions for electrical engineering standards
 *
 * Supports Constitution Principle III: Standards Compliance
 * Supports Constitution Principle IV: Dual Standards Support (IEC/NEC)
 *
 * Standards Covered:
 * - IEC 60364: Low-voltage electrical installations
 * - IEC 60038: IEC standard voltages
 * - IEEE 485: Recommended practice for sizing lead-acid batteries
 * - IEEE 1100: Recommended practice for powering and grounding electronic equipment
 * - NEC (NFPA 70): National Electrical Code
 * - BS 7671: UK wiring regulations
 *
 * @see specs/001-electromate-engineering-app/spec.md#FR-005
 */

import { StandardsFramework, ConductorMaterial, InstallationMethod } from './calculations'

/**
 * Standard reference with version tracking (Constitution Principle III)
 */
export interface StandardReference {
  /** Standard identifier (e.g., "NEC", "IEC-60364") */
  id: string
  /** Full standard name */
  name: string
  /** Version/year (e.g., "2020", "2023") */
  version: string
  /** Specific section/clause (e.g., "210.19(A)(1)") */
  section?: string
  /** Standard URL or document reference */
  url?: string
  /** Framework (IEC or NEC) */
  framework: StandardsFramework
}

/**
 * Voltage drop limits per standards (Constitution Principle III)
 */
export interface VoltageDropLimits {
  /** Framework */
  framework: StandardsFramework
  /** Branch circuit limit (%) */
  branchCircuit: number
  /** Feeder circuit limit (%) */
  feederCircuit: number
  /** Combined branch + feeder limit (%) */
  combinedLimit: number
  /** Standard reference */
  reference: StandardReference
}

/**
 * NEC voltage drop limits (NEC 210.19(A)(1) Informational Note No. 4)
 */
export const NEC_VOLTAGE_DROP_LIMITS: VoltageDropLimits = {
  framework: 'NEC',
  branchCircuit: 3.0,
  feederCircuit: 2.0,
  combinedLimit: 5.0,
  reference: {
    id: 'NEC',
    name: 'National Electrical Code',
    version: '2020',
    section: '210.19(A)(1) FPN No. 4',
    framework: 'NEC',
  },
}

/**
 * IEC voltage drop limits (IEC 60364-5-52 Table G.52.1)
 */
export const IEC_VOLTAGE_DROP_LIMITS: VoltageDropLimits = {
  framework: 'IEC',
  branchCircuit: 3.0, // Lighting circuits
  feederCircuit: 5.0, // Other uses
  combinedLimit: 5.0,
  reference: {
    id: 'IEC-60364-5-52',
    name: 'IEC 60364-5-52: Selection and erection of electrical equipment - Wiring systems',
    version: '2009-10',
    section: 'Table G.52.1',
    framework: 'IEC',
  },
}

/**
 * Cable ampacity table entry (NEC Table 310.15(B)(16) or IEC 60364-5-52)
 */
export interface CableAmpacityEntry {
  /** Conductor size (AWG for NEC, mm² for IEC) */
  size: string
  /** Ampacity at reference temperature (30°C IEC, 30°C NEC) */
  ampacity: number
  /** Conductor material */
  material: ConductorMaterial
  /** Installation method */
  installationMethod: InstallationMethod
  /** Insulation temperature rating (60°C, 75°C, 90°C) */
  temperatureRating: number
  /** Standard reference */
  reference: StandardReference
}

/**
 * Temperature derating factors (NEC Table 310.15(B)(2)(a), IEC 60364-5-52 Table B.52.14)
 */
export interface TemperatureDeratingFactors {
  /** Ambient temperature (°C) */
  temperature: number
  /** Derating factor for 60°C insulation */
  factor60C?: number
  /** Derating factor for 75°C insulation */
  factor75C?: number
  /** Derating factor for 90°C insulation */
  factor90C: number
  /** Standard reference */
  reference: StandardReference
}

/**
 * Conduit fill derating factors (NEC Table 310.15(B)(3)(a))
 */
export interface ConduitFillDeratingFactors {
  /** Number of current-carrying conductors */
  conductorCount: number
  /** Derating factor (multiplier) */
  factor: number
  /** Standard reference */
  reference: StandardReference
}

/**
 * NEC conduit fill derating (NEC 310.15(B)(3)(a))
 */
export const NEC_CONDUIT_FILL_DERATING: ConduitFillDeratingFactors[] = [
  { conductorCount: 1, factor: 1.0, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 2, factor: 1.0, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 3, factor: 1.0, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 4, factor: 0.8, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 5, factor: 0.8, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 6, factor: 0.8, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 7, factor: 0.7, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 8, factor: 0.7, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 9, factor: 0.7, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
  { conductorCount: 10, factor: 0.5, reference: { id: 'NEC', name: 'NEC', version: '2020', section: '310.15(B)(3)(a)', framework: 'NEC' } },
]

/**
 * Battery capacity temperature correction factors (IEEE 485-2020 Section 5.2)
 */
export interface BatteryTemperatureCorrection {
  /** Temperature (°C) */
  temperature: number
  /** Capacity correction factor (multiplier, 1.0 at 25°C) */
  factor: number
  /** Standard reference */
  reference: StandardReference
}

/**
 * IEEE 485 battery temperature correction factors
 */
export const IEEE_485_TEMPERATURE_FACTORS: BatteryTemperatureCorrection[] = [
  { temperature: -20, factor: 0.65, reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '5.2', framework: 'IEC' } },
  { temperature: -10, factor: 0.75, reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '5.2', framework: 'IEC' } },
  { temperature: 0, factor: 0.85, reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '5.2', framework: 'IEC' } },
  { temperature: 10, factor: 0.93, reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '5.2', framework: 'IEC' } },
  { temperature: 25, factor: 1.0, reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '5.2', framework: 'IEC' } },
  { temperature: 40, factor: 1.05, reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '5.2', framework: 'IEC' } },
  { temperature: 50, factor: 1.08, reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '5.2', framework: 'IEC' } },
  { temperature: 60, factor: 1.10, reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '5.2', framework: 'IEC' } },
]

/**
 * UPS diversity factors by load type (IEEE 1100-2020 Table 8-2)
 */
export interface UPSDiversityFactor {
  /** Load type description */
  loadType: string
  /** Number of devices */
  deviceCount: number
  /** Diversity factor (0.0-1.0) */
  factor: number
  /** Standard reference */
  reference: StandardReference
}

/**
 * IEEE 1100 UPS diversity factors
 */
export const IEEE_1100_DIVERSITY_FACTORS: UPSDiversityFactor[] = [
  { loadType: 'Computer workstations', deviceCount: 1, factor: 1.0, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
  { loadType: 'Computer workstations', deviceCount: 5, factor: 0.8, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
  { loadType: 'Computer workstations', deviceCount: 10, factor: 0.7, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
  { loadType: 'Computer workstations', deviceCount: 20, factor: 0.6, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
  { loadType: 'Computer workstations', deviceCount: 50, factor: 0.5, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
  { loadType: 'Servers/critical equipment', deviceCount: 1, factor: 1.0, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
  { loadType: 'Servers/critical equipment', deviceCount: 5, factor: 0.9, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
  { loadType: 'Servers/critical equipment', deviceCount: 10, factor: 0.85, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
  { loadType: 'Servers/critical equipment', deviceCount: 20, factor: 0.8, reference: { id: 'IEEE-1100', name: 'IEEE 1100', version: '2020', section: 'Table 8-2', framework: 'IEC' } },
]

/**
 * Minimum voltage cutoff by battery chemistry (IEEE 485-2020, IEC 61056)
 */
export interface BatteryMinVoltage {
  /** Battery chemistry */
  chemistry: string
  /** Minimum voltage per cell (V) */
  minVoltagePerCell: number
  /** Recommended end-of-discharge voltage per cell (V) */
  recommendedEODV: number
  /** Standard reference */
  reference: StandardReference
}

/**
 * Battery chemistry voltage limits
 */
export const BATTERY_MIN_VOLTAGES: BatteryMinVoltage[] = [
  {
    chemistry: 'VRLA-AGM',
    minVoltagePerCell: 1.67,
    recommendedEODV: 1.75,
    reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '4.3', framework: 'IEC' },
  },
  {
    chemistry: 'VRLA-Gel',
    minVoltagePerCell: 1.67,
    recommendedEODV: 1.75,
    reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '4.3', framework: 'IEC' },
  },
  {
    chemistry: 'FLA',
    minVoltagePerCell: 1.75,
    recommendedEODV: 1.80,
    reference: { id: 'IEEE-485', name: 'IEEE 485', version: '2020', section: '4.3', framework: 'IEC' },
  },
  {
    chemistry: 'LiFePO4',
    minVoltagePerCell: 2.5,
    recommendedEODV: 2.8,
    reference: { id: 'IEC-61056', name: 'IEC 61056', version: '2020', framework: 'IEC' },
  },
  {
    chemistry: 'Li-ion',
    minVoltagePerCell: 2.7,
    recommendedEODV: 3.0,
    reference: { id: 'IEC-61056', name: 'IEC 61056', version: '2020', framework: 'IEC' },
  },
  {
    chemistry: 'NiCd',
    minVoltagePerCell: 1.0,
    recommendedEODV: 1.1,
    reference: { id: 'IEC-61056', name: 'IEC 61056', version: '2020', framework: 'IEC' },
  },
]

/**
 * Standard voltage systems (IEC 60038, NEC Article 100)
 */
export interface StandardVoltage {
  /** Nominal voltage (V) */
  nominal: number
  /** Minimum voltage (V) */
  min: number
  /** Maximum voltage (V) */
  max: number
  /** Voltage system classification */
  classification: 'LV-AC' | 'LV-DC' | 'MV-AC' | 'MV-DC' | 'HV'
  /** Framework */
  framework: StandardsFramework
  /** Common use cases */
  useCases: string[]
  /** Standard reference */
  reference: StandardReference
}

/**
 * Common standard voltages
 */
export const STANDARD_VOLTAGES: StandardVoltage[] = [
  // IEC low voltage AC
  { nominal: 230, min: 207, max: 253, classification: 'LV-AC', framework: 'IEC', useCases: ['Single-phase residential'], reference: { id: 'IEC-60038', name: 'IEC 60038', version: '2009', framework: 'IEC' } },
  { nominal: 400, min: 360, max: 440, classification: 'LV-AC', framework: 'IEC', useCases: ['Three-phase industrial'], reference: { id: 'IEC-60038', name: 'IEC 60038', version: '2009', framework: 'IEC' } },
  // NEC low voltage AC
  { nominal: 120, min: 108, max: 132, classification: 'LV-AC', framework: 'NEC', useCases: ['Single-phase residential'], reference: { id: 'NEC', name: 'NEC', version: '2020', section: 'Article 100', framework: 'NEC' } },
  { nominal: 208, min: 187, max: 229, classification: 'LV-AC', framework: 'NEC', useCases: ['Three-phase commercial'], reference: { id: 'NEC', name: 'NEC', version: '2020', section: 'Article 100', framework: 'NEC' } },
  { nominal: 240, min: 216, max: 264, classification: 'LV-AC', framework: 'NEC', useCases: ['Single-phase heavy appliances'], reference: { id: 'NEC', name: 'NEC', version: '2020', section: 'Article 100', framework: 'NEC' } },
  { nominal: 480, min: 432, max: 528, classification: 'LV-AC', framework: 'NEC', useCases: ['Three-phase industrial'], reference: { id: 'NEC', name: 'NEC', version: '2020', section: 'Article 100', framework: 'NEC' } },
  // Common DC voltages
  { nominal: 12, min: 10.5, max: 14.4, classification: 'LV-DC', framework: 'IEC', useCases: ['Automotive, small solar'], reference: { id: 'IEC-60038', name: 'IEC 60038', version: '2009', framework: 'IEC' } },
  { nominal: 24, min: 21, max: 28.8, classification: 'LV-DC', framework: 'IEC', useCases: ['Telecommunications, solar'], reference: { id: 'IEC-60038', name: 'IEC 60038', version: '2009', framework: 'IEC' } },
  { nominal: 48, min: 42, max: 57.6, classification: 'LV-DC', framework: 'IEC', useCases: ['Telecom, data centers, UPS'], reference: { id: 'IEC-60038', name: 'IEC 60038', version: '2009', framework: 'IEC' } },
  { nominal: 110, min: 96, max: 132, classification: 'LV-DC', framework: 'IEC', useCases: ['Railways, industrial'], reference: { id: 'IEC-60038', name: 'IEC 60038', version: '2009', framework: 'IEC' } },
]

/**
 * Solar panel temperature coefficient types (IEC 61215)
 */
export interface SolarTemperatureCoefficient {
  /** Panel type */
  panelType: string
  /** Power temperature coefficient (%/°C) */
  powerCoeff: number
  /** Voltage temperature coefficient (%/°C) */
  voltageCoeff: number
  /** Current temperature coefficient (%/°C) */
  currentCoeff: number
  /** Standard reference */
  reference: StandardReference
}

/**
 * Typical solar panel temperature coefficients
 */
export const SOLAR_TEMPERATURE_COEFFICIENTS: SolarTemperatureCoefficient[] = [
  { panelType: 'monocrystalline', powerCoeff: -0.4, voltageCoeff: -0.35, currentCoeff: 0.05, reference: { id: 'IEC-61215', name: 'IEC 61215', version: '2016', framework: 'IEC' } },
  { panelType: 'polycrystalline', powerCoeff: -0.45, voltageCoeff: -0.38, currentCoeff: 0.05, reference: { id: 'IEC-61215', name: 'IEC 61215', version: '2016', framework: 'IEC' } },
  { panelType: 'thin-film', powerCoeff: -0.25, voltageCoeff: -0.28, currentCoeff: 0.04, reference: { id: 'IEC-61646', name: 'IEC 61646', version: '2008', framework: 'IEC' } },
  { panelType: 'bifacial', powerCoeff: -0.35, voltageCoeff: -0.32, currentCoeff: 0.05, reference: { id: 'IEC-61215', name: 'IEC 61215', version: '2016', framework: 'IEC' } },
]
