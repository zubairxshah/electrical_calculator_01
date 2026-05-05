// Source-impedance Thevenin assembly: utility + transformer + cable, on a common per-unit base.
// Reference: IEEE 3002.7-2018 §7, IEEE Red Book (Std 141).

import type {
  ImpedanceComplex,
  SourceChain,
  ThevenZResult,
} from '@/types/motor-starting'
import { getCableImpedance } from './motorStartingData'

interface DecomposedZ {
  r: number
  x: number
}

function decomposeFromMagAndXOverR(magnitude: number, xOverR: number): DecomposedZ {
  // |Z|² = R² + X² and X = (X/R) × R  →  R = |Z| / √(1 + (X/R)²)
  const denom = Math.sqrt(1 + xOverR * xOverR)
  const r = magnitude / denom
  const x = r * xOverR
  return { r, x }
}

export interface ComputeSourceImpedanceOptions {
  /** Override base kVA (default = transformer.ratedKva). */
  baseKva?: number
  /** Override base voltage in V (default = transformer.secondaryVoltageV). */
  baseVoltageV?: number
}

export function computeSourceImpedance(
  chain: SourceChain,
  baseKvaArg?: number,
  baseVoltageVArg?: number,
): ThevenZResult {
  if (!chain || !chain.transformer) {
    throw new Error('Source chain incomplete')
  }
  const transformer = chain.transformer
  const baseKva = baseKvaArg ?? transformer.ratedKva
  const baseVoltageV = baseVoltageVArg ?? transformer.secondaryVoltageV
  if (baseKva <= 0 || baseVoltageV <= 0) {
    throw new Error('Source chain incomplete')
  }

  const notes: string[] = []

  // Utility (per-unit on system base)
  let zUtilityPu: ImpedanceComplex = { r: 0, x: 0 }
  let utilityAssumed: 'computed' | 'infinite_bus' = 'computed'
  if (chain.utility.isInfiniteBus) {
    zUtilityPu = { r: 0, x: 0 }
    utilityAssumed = 'infinite_bus'
  } else {
    const xOverRu = chain.utility.xOverR > 0 ? chain.utility.xOverR : 10
    let utilityZmag: number | null = null

    if (chain.utility.shortCircuitMva && chain.utility.shortCircuitMva > 0) {
      // Z_u_pu = S_base / S_sc; baseKva and shortCircuitMva normalized to same units (kVA).
      utilityZmag = baseKva / (chain.utility.shortCircuitMva * 1000)
    } else if (chain.utility.shortCircuitAmps && chain.utility.shortCircuitAmps > 0) {
      // Convert SC current at primary to MVA: S_sc = √3 × V_primary_kV × I_sc(A) / 1000  → MVA
      const scMva =
        (Math.sqrt(3) * chain.utility.primaryVoltage * chain.utility.shortCircuitAmps) / 1000
      utilityZmag = baseKva / (scMva * 1000)
      // Sanity-check disagreement if both provided
      if (chain.utility.shortCircuitMva && chain.utility.shortCircuitMva > 0) {
        const diff = Math.abs(scMva - chain.utility.shortCircuitMva) / chain.utility.shortCircuitMva
        if (diff > 0.05) {
          notes.push(`Utility SC MVA and SC amps disagree by ${(diff * 100).toFixed(1)}%`)
        }
      }
    } else {
      // No utility data and not flagged infinite bus → assume infinite bus, with warning
      utilityAssumed = 'infinite_bus'
      notes.push('No utility short-circuit data — infinite bus assumed')
    }

    if (utilityZmag !== null) {
      zUtilityPu = decomposeFromMagAndXOverR(utilityZmag, xOverRu)
    }
  }

  // Transformer (per-unit on its own base, scaled to system base)
  const xOverRt = transformer.xOverR > 0 ? transformer.xOverR : 6
  const zTOnOwnBase = transformer.percentZ / 100
  const zTOnSystemBase = (zTOnOwnBase * baseKva) / transformer.ratedKva
  const zTransformerPu = decomposeFromMagAndXOverR(zTOnSystemBase, xOverRt)

  // Cable (ohms → pu)
  const zBaseOhms = (baseVoltageV * baseVoltageV) / (baseKva * 1000)
  let zCablePu: ImpedanceComplex = { r: 0, x: 0 }
  if (chain.cable && chain.cable.lengthMeters > 0) {
    const lookup = getCableImpedance(chain.cable.sizeId, chain.cable.material, chain.cable.conduitType)
    if (!lookup) {
      notes.push(`Cable impedance not found for ${chain.cable.sizeId} ${chain.cable.material} ${chain.cable.conduitType}`)
    } else {
      const parallelRuns = chain.cable.parallelRuns > 0 ? chain.cable.parallelRuns : 1
      const rOhms = (lookup.rPerMeterOhms * chain.cable.lengthMeters) / parallelRuns
      const xOhms = (lookup.xPerMeterOhms * chain.cable.lengthMeters) / parallelRuns
      zCablePu = { r: rOhms / zBaseOhms, x: xOhms / zBaseOhms }
    }
  }

  const zTotalPu: ImpedanceComplex = {
    r: zUtilityPu.r + zTransformerPu.r + zCablePu.r,
    x: zUtilityPu.x + zTransformerPu.x + zCablePu.x,
  }
  const zTotalOhms: ImpedanceComplex = {
    r: zTotalPu.r * zBaseOhms,
    x: zTotalPu.x * zBaseOhms,
  }

  // Numeric overflow guard — only triggers on absurd inputs.
  if (!isFinite(zTotalPu.r) || !isFinite(zTotalPu.x)) {
    throw new Error('Numeric overflow in source chain')
  }

  return {
    baseKva,
    baseVoltageV,
    zUtilityPu,
    zTransformerPu,
    zCablePu,
    zTotalPu,
    zTotalOhms,
    utilityAssumed,
    notes: notes.length > 0 ? notes : undefined,
  }
}
