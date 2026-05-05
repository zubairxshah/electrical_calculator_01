import { describe, it, expect } from 'vitest'
import { computeSourceImpedance } from '@/lib/calculations/motor-starting/sourceImpedance'
import type { SourceChain } from '@/types/motor-starting'

function nominalChain(overrides: Partial<SourceChain> = {}): SourceChain {
  return {
    utility: {
      primaryVoltage: 13.8,
      shortCircuitMva: 500,
      xOverR: 10,
      isInfiniteBus: false,
    },
    transformer: {
      ratedKva: 1500,
      primaryVoltageKv: 13.8,
      secondaryVoltageV: 480,
      percentZ: 5.75,
      xOverR: 6,
    },
    cable: {
      sizeId: '4/0',
      material: 'Cu',
      lengthMeters: 50,
      parallelRuns: 1,
      conduitType: 'Steel',
    },
    pccLocation: 'transformer_secondary',
    ...overrides,
  }
}

describe('computeSourceImpedance', () => {
  it('nominal: utility 500 MVA + 1500 kVA / 5.75% xfmr + 4/0 Cu / 50m → transformer-dominant Z', () => {
    const result = computeSourceImpedance(nominalChain())
    // Transformer Z magnitude on its own base = 0.0575 pu; system base = transformer kVA, so 0.0575
    const zTMag = Math.sqrt(result.zTransformerPu.r ** 2 + result.zTransformerPu.x ** 2)
    expect(zTMag).toBeCloseTo(0.0575, 3)
    // Utility on system base = 1500 / (500 × 1000) = 0.003 pu — much smaller
    const zUMag = Math.sqrt(result.zUtilityPu.r ** 2 + result.zUtilityPu.x ** 2)
    expect(zUMag).toBeCloseTo(0.003, 3)
    expect(zUMag).toBeLessThan(zTMag)
    expect(result.utilityAssumed).toBe('computed')
  })

  it('boundary: isInfiniteBus = true makes zUtility = 0', () => {
    const chain = nominalChain({
      utility: { primaryVoltage: 13.8, xOverR: 10, isInfiniteBus: true },
    })
    const result = computeSourceImpedance(chain)
    expect(result.zUtilityPu.r).toBe(0)
    expect(result.zUtilityPu.x).toBe(0)
    expect(result.utilityAssumed).toBe('infinite_bus')
  })

  it('edge: parallelRuns = 2 halves cable R and X', () => {
    const single = computeSourceImpedance(nominalChain())
    const dual = computeSourceImpedance(
      nominalChain({
        cable: {
          sizeId: '4/0',
          material: 'Cu',
          lengthMeters: 50,
          parallelRuns: 2,
          conduitType: 'Steel',
        },
      }),
    )
    expect(dual.zCablePu.r).toBeCloseTo(single.zCablePu.r / 2, 6)
    expect(dual.zCablePu.x).toBeCloseTo(single.zCablePu.x / 2, 6)
  })

  it('error: missing transformer throws Source chain incomplete', () => {
    expect(() =>
      // @ts-expect-error intentionally invalid
      computeSourceImpedance({ utility: nominalChain().utility, cable: nominalChain().cable, pccLocation: 'transformer_secondary' }),
    ).toThrow(/incomplete/i)
  })

  it('Thevenin total Z components are sums of utility + transformer + cable', () => {
    const r = computeSourceImpedance(nominalChain())
    expect(r.zTotalPu.r).toBeCloseTo(r.zUtilityPu.r + r.zTransformerPu.r + r.zCablePu.r, 8)
    expect(r.zTotalPu.x).toBeCloseTo(r.zUtilityPu.x + r.zTransformerPu.x + r.zCablePu.x, 8)
  })

  it('ohmic Z = pu × Z_base where Z_base = V² / S', () => {
    const r = computeSourceImpedance(nominalChain())
    const zBase = (480 * 480) / (1500 * 1000)
    expect(r.zTotalOhms.r).toBeCloseTo(r.zTotalPu.r * zBase, 8)
    expect(r.zTotalOhms.x).toBeCloseTo(r.zTotalPu.x * zBase, 8)
  })
})
