// Harmonic Analysis Calculator
// IEEE 519-2022, IEC 61000-3-2/3-12

import type {
  HarmonicInput,
  HarmonicOrder,
  THDResult,
  TDDResult,
  ComplianceResult,
  FilterRecommendation,
  HarmonicAlert,
  HarmonicAnalysisResults,
  HarmonicOrderResult,
} from '@/types/harmonic-analysis'

import {
  round,
  getVoltageLimits,
  getCurrentLimitRow,
  getIndividualCurrentLimit,
  getIECClassALimit,
} from './harmonicData'

/**
 * Calculate THD from a harmonic spectrum
 */
function calculateTHD(
  harmonics: HarmonicOrder[],
  fundamentalRms: number,
  fundamentalFrequency: number,
  type: 'current' | 'voltage'
): THDResult {
  // Filter out fundamental (order 1) and zero-magnitude entries
  const harmonicOrders = harmonics.filter(h => h.order >= 2 && h.magnitude > 0)

  // THD = sqrt(sum(Ih^2)) / I1 * 100 (already in %)
  const sumSquares = harmonicOrders.reduce((sum, h) => sum + (h.magnitude / 100) ** 2, 0)
  const thd = round(Math.sqrt(sumSquares) * 100, 2)

  // RMS including harmonics: Irms = I1 * sqrt(1 + THD^2/10000)
  const rms = round(fundamentalRms * Math.sqrt(1 + sumSquares), 2)

  // Peak value (worst case - all harmonics in phase)
  const peakFundamental = fundamentalRms * Math.SQRT2
  const peakHarmonics = harmonicOrders.reduce(
    (sum, h) => sum + (fundamentalRms * (h.magnitude / 100) * Math.SQRT2),
    0
  )
  const peakValue = round(peakFundamental + peakHarmonics, 2)

  // Crest factor
  const crestFactor = rms > 0 ? round(peakValue / rms, 3) : 0

  // K-Factor (transformer derating for current harmonics)
  // K = sum(Ih^2 * h^2) where Ih is per-unit of rated current
  let kFactor = 1 // fundamental contributes 1^2 * 1^2 = 1
  if (type === 'current') {
    kFactor += harmonicOrders.reduce(
      (sum, h) => sum + (h.magnitude / 100) ** 2 * h.order ** 2,
      0
    )
    kFactor = round(kFactor, 2)
  }

  // Build per-order results
  const orderResults: HarmonicOrderResult[] = harmonicOrders.map(h => ({
    order: h.order,
    magnitude: h.magnitude,
    frequency: h.order * fundamentalFrequency,
    rmsValue: round(fundamentalRms * (h.magnitude / 100), 3),
    complianceStatus: 'pass' as const, // will be updated during compliance check
    limit: null,
  }))

  return {
    thd,
    rms,
    fundamentalRms,
    crestFactor,
    kFactor,
    peakValue,
    harmonicOrders: orderResults,
  }
}

/**
 * Calculate TDD (Total Demand Distortion) per IEEE 519
 */
function calculateTDD(
  harmonics: HarmonicOrder[],
  maxDemandCurrent: number,
  shortCircuitCurrentKA: number,
  fundamentalCurrent: number
): TDDResult | null {
  if (!maxDemandCurrent || !shortCircuitCurrentKA) return null

  const iscAmps = shortCircuitCurrentKA * 1000
  const iscIlRatio = round(iscAmps / maxDemandCurrent, 1)

  // TDD = sqrt(sum(Ih^2)) / IL * 100
  // Where Ih are actual ampere values, IL is max demand current
  const harmonicOrders = harmonics.filter(h => h.order >= 2 && h.magnitude > 0)
  const sumSquaresAmps = harmonicOrders.reduce((sum, h) => {
    const ihAmps = fundamentalCurrent * (h.magnitude / 100)
    return sum + ihAmps ** 2
  }, 0)

  const tdd = round((Math.sqrt(sumSquaresAmps) / maxDemandCurrent) * 100, 2)

  return {
    tdd,
    iscIlRatio,
    applicableLimitCategory: `Isc/IL = ${iscIlRatio}`,
    limit: 0, // will be set during compliance
    complianceStatus: 'pass',
  }
}

/**
 * Check compliance against IEEE 519 or IEC 61000
 */
function checkCompliance(
  input: HarmonicInput,
  currentThd: THDResult,
  voltageThd: THDResult | null,
  tddResult: TDDResult | null,
  alerts: HarmonicAlert[]
): ComplianceResult {
  const result: ComplianceResult = {
    standard: input.standard === 'IEEE519' ? 'IEEE 519-2022' : 'IEC 61000-3-2',
    overallStatus: 'compliant',
    currentCompliance: {
      thdStatus: 'pass',
      thdValue: currentThd.thd,
      thdLimit: 0,
      individualViolations: [],
    },
    voltageCompliance: null,
    tddCompliance: tddResult ? { ...tddResult } : null,
  }

  if (input.standard === 'IEEE519') {
    // Voltage THD limits
    const vLimits = getVoltageLimits(input.voltageLevel)

    if (voltageThd) {
      result.voltageCompliance = {
        thdStatus: voltageThd.thd <= vLimits.thd ? 'pass' : 'fail',
        thdValue: voltageThd.thd,
        thdLimit: vLimits.thd,
        individualViolations: [],
      }

      // Check individual voltage harmonics
      for (const h of voltageThd.harmonicOrders) {
        h.limit = vLimits.individualHarmonic
        if (h.magnitude > vLimits.individualHarmonic) {
          h.complianceStatus = 'fail'
          result.voltageCompliance.individualViolations.push({
            order: h.order,
            value: h.magnitude,
            limit: vLimits.individualHarmonic,
          })
        } else if (h.magnitude > vLimits.individualHarmonic * 0.8) {
          h.complianceStatus = 'warning'
        }
      }

      if (result.voltageCompliance.thdStatus === 'fail') {
        result.overallStatus = 'non-compliant'
        alerts.push({
          type: 'error',
          message: `Voltage THD (${voltageThd.thd}%) exceeds IEEE 519 limit (${vLimits.thd}%) for ${vLimits.voltageLevel}`,
        })
      }
    }

    // Current TDD compliance
    if (tddResult && input.shortCircuitCurrentKA && input.maxDemandCurrent) {
      const limitRow = getCurrentLimitRow(tddResult.iscIlRatio, input.voltageLevel)
      tddResult.limit = limitRow.tdd

      if (tddResult.tdd > limitRow.tdd) {
        tddResult.complianceStatus = 'fail'
        result.overallStatus = 'non-compliant'
        alerts.push({
          type: 'error',
          message: `TDD (${tddResult.tdd}%) exceeds IEEE 519 limit (${limitRow.tdd}%) for Isc/IL ratio ${tddResult.iscIlRatio}`,
        })
      } else if (tddResult.tdd > limitRow.tdd * 0.8) {
        tddResult.complianceStatus = 'warning'
        if (result.overallStatus === 'compliant') result.overallStatus = 'marginal'
      }

      // Individual current harmonic limits
      for (const h of currentThd.harmonicOrders) {
        const limit = getIndividualCurrentLimit(h.order, limitRow)
        h.limit = limit
        // Convert to TDD basis: harmonic % of IL
        const hPercentOfIL = (input.fundamentalCurrent * (h.magnitude / 100) / input.maxDemandCurrent) * 100
        if (hPercentOfIL > limit) {
          h.complianceStatus = 'fail'
          result.currentCompliance.individualViolations.push({
            order: h.order,
            value: round(hPercentOfIL, 2),
            limit,
          })
        } else if (hPercentOfIL > limit * 0.8) {
          h.complianceStatus = 'warning'
        }
      }

      result.currentCompliance.thdLimit = limitRow.tdd
      result.currentCompliance.thdStatus = tddResult.complianceStatus
    } else {
      // Without Isc/IL data, use THD as rough compliance indicator
      const roughLimit = vLimits.thd // use voltage THD limit as reference
      result.currentCompliance.thdLimit = roughLimit
      if (currentThd.thd > roughLimit * 3) {
        result.currentCompliance.thdStatus = 'fail'
        if (result.overallStatus === 'compliant') result.overallStatus = 'marginal'
      }
      alerts.push({
        type: 'info',
        message: 'Provide short-circuit current and max demand current for full IEEE 519 TDD compliance analysis.',
      })
    }
  } else {
    // IEC 61000-3-2 compliance
    result.currentCompliance.thdLimit = 100 // IEC doesn't set explicit THD limit, uses individual limits
    for (const h of currentThd.harmonicOrders) {
      const limit = getIECClassALimit(h.order)
      if (limit !== null) {
        h.limit = limit
        // IEC limits are in absolute amps for equipment ≤16A, but we use % for comparison
        if (h.magnitude > limit * 20) {
          h.complianceStatus = 'fail'
          result.currentCompliance.individualViolations.push({
            order: h.order,
            value: h.magnitude,
            limit: round(limit * 20, 2),
          })
        }
      }
    }

    if (result.currentCompliance.individualViolations.length > 0) {
      result.currentCompliance.thdStatus = 'fail'
      result.overallStatus = 'non-compliant'
      alerts.push({
        type: 'error',
        message: `${result.currentCompliance.individualViolations.length} harmonic orders exceed IEC 61000-3-2 Class A limits`,
      })
    }
  }

  if (result.currentCompliance.individualViolations.length > 0 && result.overallStatus === 'compliant') {
    result.overallStatus = 'non-compliant'
  }

  return result
}

/**
 * Generate filter recommendations
 */
function generateFilterRecommendations(
  currentThd: THDResult,
  input: HarmonicInput,
  alerts: HarmonicAlert[]
): FilterRecommendation[] {
  if (!input.calculateFilterSizing) return []

  const recommendations: FilterRecommendation[] = []
  const dominantHarmonics = currentThd.harmonicOrders
    .filter(h => h.magnitude > 3)
    .sort((a, b) => b.magnitude - a.magnitude)

  if (dominantHarmonics.length === 0) {
    alerts.push({ type: 'info', message: 'No significant harmonics to filter.' })
    return []
  }

  const targetThd = input.targetThd || 5
  const currentThdValue = currentThd.thd

  // Passive single-tuned filter for dominant harmonic
  if (dominantHarmonics.length > 0) {
    const target = dominantHarmonics[0]
    const tuningFreq = target.frequency * 0.94 // tune slightly below to avoid resonance
    const estimatedReduction = target.magnitude * 0.7 // ~70% reduction of target harmonic
    const newThd = Math.sqrt(currentThdValue ** 2 - estimatedReduction ** 2)
    const kvar = round(input.fundamentalCurrent * input.systemVoltage * 0.001 * 0.3, 0) // rough sizing

    recommendations.push({
      filterType: 'passive-single',
      targetHarmonics: [target.order],
      estimatedReduction: round(currentThdValue - newThd, 1),
      capacitorKVAR: kvar,
      inductorMH: round((1 / (4 * Math.PI ** 2 * tuningFreq ** 2 * (kvar / (input.systemVoltage ** 2 / 1000)))) * 1000, 3),
      tuningFrequency: round(tuningFreq, 0),
      description: `Passive single-tuned filter targeting ${getOrdinalSuffix(target.order)} harmonic (${target.frequency} Hz)`,
      estimatedCost: 'low',
    })
  }

  // C-type filter for 3rd harmonic heavy loads
  const third = currentThd.harmonicOrders.find(h => h.order === 3 && h.magnitude > 5)
  if (third) {
    recommendations.push({
      filterType: 'passive-c',
      targetHarmonics: [3],
      estimatedReduction: round(third.magnitude * 0.6, 1),
      capacitorKVAR: round(input.fundamentalCurrent * input.systemVoltage * 0.001 * 0.25, 0),
      inductorMH: null,
      tuningFrequency: round(input.fundamentalFrequency * 3 * 0.94, 0),
      description: 'C-type high-pass filter for 3rd harmonic and above — low fundamental losses',
      estimatedCost: 'medium',
    })
  }

  // Active filter recommendation if THD is high
  if (currentThdValue > 20) {
    recommendations.push({
      filterType: 'active',
      targetHarmonics: dominantHarmonics.slice(0, 6).map(h => h.order),
      estimatedReduction: round(currentThdValue - targetThd, 1),
      capacitorKVAR: null,
      inductorMH: null,
      tuningFrequency: null,
      description: `Active harmonic filter (AHF) — targets multiple harmonics, maintains THD ≤${targetThd}%`,
      estimatedCost: 'high',
    })
  }

  // Hybrid filter for very high THD
  if (currentThdValue > 40 && dominantHarmonics.length >= 3) {
    recommendations.push({
      filterType: 'hybrid',
      targetHarmonics: dominantHarmonics.slice(0, 4).map(h => h.order),
      estimatedReduction: round(currentThdValue - targetThd * 0.8, 1),
      capacitorKVAR: round(input.fundamentalCurrent * input.systemVoltage * 0.001 * 0.35, 0),
      inductorMH: null,
      tuningFrequency: round(dominantHarmonics[0].frequency * 0.94, 0),
      description: 'Hybrid filter: passive (dominant harmonic) + active (residual harmonics) — best performance',
      estimatedCost: 'high',
    })
  }

  return recommendations
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * Calculate derating factors due to harmonics
 */
function calculateDerating(currentThd: THDResult): {
  transformerKFactor: number
  transformerDerating: number
  cableDerating: number
  capacitorStress: number
} {
  const kFactor = currentThd.kFactor

  // Transformer derating: approximate capacity reduction
  // For K-rated transformers, no derating needed up to K rating
  // For standard transformers: derating ≈ 1 / sqrt(1 + 0.1 * (K-1))
  const transformerDerating = kFactor > 1
    ? round((1 / Math.sqrt(1 + 0.1 * (kFactor - 1))) * 100, 1)
    : 100

  // Cable derating due to harmonic heating
  // Approximate: additional I²R losses from harmonics
  const harmonicCurrentFactor = currentThd.rms / currentThd.fundamentalRms
  const cableDerating = harmonicCurrentFactor > 1
    ? round((1 / harmonicCurrentFactor) * 100, 1)
    : 100

  // Capacitor voltage stress from harmonics
  // Harmonics cause voltage amplification across capacitors
  const capacitorStress = round((currentThd.thd / 100) * 100 + 100, 1) - 100

  return {
    transformerKFactor: kFactor,
    transformerDerating,
    cableDerating,
    capacitorStress: round(capacitorStress, 1),
  }
}

/**
 * Main calculation entry point
 */
export async function calculateHarmonicAnalysis(
  calcInput: { input: HarmonicInput }
): Promise<HarmonicAnalysisResults> {
  const { input } = calcInput
  const alerts: HarmonicAlert[] = []

  // Calculate current THD
  const currentThd = calculateTHD(
    input.currentHarmonics,
    input.fundamentalCurrent,
    input.fundamentalFrequency,
    'current'
  )

  // Calculate voltage THD (optional)
  let voltageThd: THDResult | null = null
  if (input.calculateVoltageThd && input.voltageHarmonics.length > 0) {
    const vHarmonics = input.voltageHarmonics.filter(h => h.magnitude > 0)
    if (vHarmonics.length > 0) {
      voltageThd = calculateTHD(
        input.voltageHarmonics,
        input.systemVoltage, // use system voltage as fundamental
        input.fundamentalFrequency,
        'voltage'
      )
    }
  }

  // Calculate TDD if IEEE 519 and data available
  let tddResult: TDDResult | null = null
  if (input.standard === 'IEEE519' && input.shortCircuitCurrentKA && input.maxDemandCurrent) {
    tddResult = calculateTDD(
      input.currentHarmonics,
      input.maxDemandCurrent,
      input.shortCircuitCurrentKA,
      input.fundamentalCurrent
    )
  }

  // Compliance check
  const compliance = checkCompliance(input, currentThd, voltageThd, tddResult, alerts)

  // Filter recommendations
  const filterRecommendations = generateFilterRecommendations(currentThd, input, alerts)

  // Derating calculations
  const derating = calculateDerating(currentThd)

  // Generate contextual alerts
  if (currentThd.kFactor > 4) {
    alerts.push({
      type: 'warning',
      message: `High K-Factor (${currentThd.kFactor}). Use K-rated transformer (K-${Math.ceil(currentThd.kFactor / 4) * 4} or higher).`,
    })
  }
  if (currentThd.thd > 50) {
    alerts.push({
      type: 'warning',
      message: 'Very high current THD. Consider multi-pulse drives or active filtering at the source.',
    })
  }
  if (currentThd.crestFactor > 2.0) {
    alerts.push({
      type: 'warning',
      message: `High crest factor (${currentThd.crestFactor}). Check equipment peak current ratings.`,
    })
  }
  if (derating.cableDerating < 85) {
    alerts.push({
      type: 'warning',
      message: `Cable derating to ${derating.cableDerating}% due to harmonic heating. Consider upsizing cables.`,
    })
  }
  if (derating.capacitorStress > 10) {
    alerts.push({
      type: 'info',
      message: `Capacitors may experience ${derating.capacitorStress}% additional voltage stress from harmonics. Use detuned reactors.`,
    })
  }

  // Three-phase triplen harmonic warning
  if (input.systemType === 'three-phase') {
    const triplens = currentThd.harmonicOrders.filter(
      h => h.order % 3 === 0 && h.magnitude > 5
    )
    if (triplens.length > 0) {
      alerts.push({
        type: 'warning',
        message: `Significant triplen harmonics (${triplens.map(t => `${t.order}th: ${t.magnitude}%`).join(', ')}). These add in the neutral conductor — check neutral sizing.`,
      })
    }
  }

  return {
    currentThd,
    voltageThd,
    compliance,
    filterRecommendations,
    alerts,
    derating,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }
}
