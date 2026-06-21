/**
 * Shared assembly for BatteryCalculatorResult so runtime and sizing produce
 * identical result shapes.
 */

import { toBigNumber } from '@/lib/mathConfig'
import type { BatteryTypeSpec } from '@/lib/standards/batteryTypes'
import type {
  BatteryCalculatorInputs,
  BatteryCalculatorResult,
  AppliedFactors,
  BankConfig,
  BatteryWarning,
  DischargeCurvePoint,
  SizingVerdict,
} from '@/lib/types'

export class BatterySizingError extends Error {
  constructor(public field: string, message: string) {
    super(message)
    this.name = 'BatterySizingError'
  }
}

export interface BuildResultParams {
  inputs: BatteryCalculatorInputs
  profile: BatteryTypeSpec
  backupTimeHours: number
  requiredCapacityAh?: number
  effectiveCapacityAh: number
  dischargeRate: number
  appliedFactors: AppliedFactors
  bankConfig: BankConfig
  verdict: SizingVerdict
  recommendations: string[]
  warnings: BatteryWarning[]
  dischargeCurve: DischargeCurvePoint[]
}

/** Dedupe + order the standards actually applied for this result. */
function standardsApplied(profile: BatteryTypeSpec): string[] {
  const base = ['IEEE 485-2020', 'IEC 60896 / IEC 62619']
  const merged = [...base, ...profile.standardReferences]
  return Array.from(new Set(merged))
}

export function buildBatteryResult(p: BuildResultParams): BatteryCalculatorResult {
  return {
    type: 'battery',
    timestamp: new Date().toISOString(),
    standards: 'IEC',
    inputs: p.inputs,
    mode: p.inputs.mode,
    backupTimeHours: toBigNumber(p.backupTimeHours),
    requiredCapacityAh: p.requiredCapacityAh != null ? toBigNumber(p.requiredCapacityAh) : undefined,
    effectiveCapacityAh: toBigNumber(p.effectiveCapacityAh),
    dischargeRate: toBigNumber(p.dischargeRate),
    appliedFactors: p.appliedFactors,
    bankConfig: p.bankConfig,
    verdict: p.verdict,
    recommendations: p.recommendations,
    standardsApplied: standardsApplied(p.profile),
    dischargeCurve: p.dischargeCurve,
    warnings: p.warnings,
    validations: p.warnings.map((w) => ({
      severity: w.severity,
      field: w.field,
      message: w.message,
      standardReference: w.standardReference,
      recommendation: w.recommendation,
    })),
  }
}
