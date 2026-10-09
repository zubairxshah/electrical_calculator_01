/**
 * Demand load, design current and main recommendation (research R4, R5; spec FR-017 – FR-021).
 *
 * NEC mode (NEC 2020): Table 220.42 lighting, 220.44 receptacles, Table 220.56 kitchen,
 * 220.60 non-coincident loads, 430.24 largest motor, 215.2(A)(1) continuous loads.
 * IEC mode: designer per-category diversity factors, optional IEC 61439-2 rated diversity factor.
 */
import type {
  Circuit, DemandResult, DemandRuleApplication, LoadCategory, Occupancy, Panel, PanelWarning, ScheduleResult,
} from '@/types/panel-schedule'
import { recommendStandardBreaker } from '@/lib/standards/breakerRatings'
import { CATEGORY_LABELS, LOAD_CATEGORIES } from './defaults'

const SQRT3 = Math.sqrt(3)

/** Apply tiered demand factors: [[upTo, factor], ...], last tier upTo = Infinity */
function tiered(va: number, tiers: [number, number][]): number {
  let remaining = va
  let prev = 0
  let total = 0
  for (const [upTo, factor] of tiers) {
    const band = Math.min(remaining, upTo - prev)
    if (band <= 0) break
    total += band * factor
    remaining -= band
    prev = upTo
  }
  return total
}

const TABLE_220_42: Record<Occupancy, [number, number][]> = {
  dwelling: [[3000, 1], [120000, 0.35], [Infinity, 0.25]],
  hotel: [[20000, 0.6], [100000, 0.5], [Infinity, 0.35]],
  warehouse: [[12500, 1], [Infinity, 0.5]],
  hospital: [[50000, 0.4], [Infinity, 0.2]],
  other: [[Infinity, 1]],
}

const TABLE_220_42_TEXT: Record<Occupancy, string> = {
  dwelling: 'first 3,000 @100 %, to 120,000 @35 %, rest @25 %',
  hotel: 'first 20,000 @60 %, to 100,000 @50 %, rest @35 %',
  warehouse: 'first 12,500 @100 %, rest @50 %',
  hospital: 'first 50,000 @40 %, rest @20 %',
  other: '100 %',
}

/** NEC Table 220.42 general lighting demand */
export function lightingDemandNec(va: number, occupancy: Occupancy): number {
  return tiered(va, TABLE_220_42[occupancy])
}

/** NEC Table 220.44 non-dwelling receptacle demand: first 10 kVA @100 %, remainder @50 % */
export function receptacleDemandNec(va: number): number {
  return tiered(va, [[10000, 1], [Infinity, 0.5]])
}

/** NEC Table 220.56 demand factor by number of kitchen equipment units */
function kitchenFactor(count: number): number {
  if (count <= 2) return 1
  if (count === 3) return 0.9
  if (count === 4) return 0.8
  if (count === 5) return 0.7
  return 0.65
}

/** NEC 220.56: demand by Table 220.56, but not less than the sum of the two largest units */
export function kitchenDemandNec(vas: number[]): number {
  if (vas.length === 0) return 0
  const total = vas.reduce((a, b) => a + b, 0)
  const twoLargest = [...vas].sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0)
  return Math.max(total * kitchenFactor(vas.length), twoLargest)
}

/** IEC 61439-2 assumed loading (rated diversity factor) by number of main outgoing circuits */
export function iecRatedDiversityFactor(mainCircuits: number): number {
  if (mainCircuits <= 1) return 1
  if (mainCircuits <= 3) return 0.9
  if (mainCircuits <= 5) return 0.8
  if (mainCircuits <= 9) return 0.7
  return 0.6
}

const pct = (f: number) => `${Number((f * 100).toFixed(2))} %`

interface LoadItem {
  circuit: Circuit
  va: number
}

function rule(
  id: string, label: string, reference: string, connectedVA: number, demandVA: number, factorText: string,
): DemandRuleApplication {
  return { id, label, reference, connectedVA, demandVA, factorText }
}

const OTHER_REFS: Partial<Record<LoadCategory, string>> = {
  'water-heater': 'NEC 422.13',
  'ev-charger': 'NEC 625.42',
}

function necRules(panel: Panel, items: LoadItem[]): DemandRuleApplication[] {
  const byCat = new Map<LoadCategory, LoadItem[]>()
  for (const it of items) byCat.set(it.circuit.category, [...(byCat.get(it.circuit.category) ?? []), it])
  const sum = (cat: LoadCategory) => (byCat.get(cat) ?? []).reduce((a, it) => a + it.va, 0)

  const rules: DemandRuleApplication[] = []
  /** demand / connected per category, used for the continuous adder */
  const factor: Partial<Record<LoadCategory, number>> = {}
  const dwelling = panel.occupancy === 'dwelling'

  // General lighting (+ dwelling receptacles per 220.14(J))
  const lighting = sum('lighting')
  const receptacles = sum('receptacle')
  const lightingBase = lighting + (dwelling ? receptacles : 0)
  if (lightingBase > 0) {
    const d = lightingDemandNec(lightingBase, panel.occupancy)
    rules.push(rule(
      'lighting', dwelling ? 'General lighting + receptacles (dwelling)' : 'General lighting',
      'NEC Table 220.42', lightingBase, d, TABLE_220_42_TEXT[panel.occupancy],
    ))
    factor.lighting = d / lightingBase
    if (dwelling) factor.receptacle = d / lightingBase
  }

  if (!dwelling && receptacles > 0) {
    const d = receptacleDemandNec(receptacles)
    rules.push(rule('receptacle', 'Receptacles', 'NEC 220.44', receptacles, d, 'first 10 kVA @100 %, rest @50 %'))
    factor.receptacle = d / receptacles
  }

  const kitchen = byCat.get('kitchen') ?? []
  if (kitchen.length > 0) {
    const connected = sum('kitchen')
    const d = dwelling ? connected : kitchenDemandNec(kitchen.map((k) => k.va))
    rules.push(rule(
      'kitchen', 'Kitchen equipment', dwelling ? 'NEC 220.14' : 'NEC 220.56', connected, d,
      dwelling ? '100 %' : `${kitchen.length} units @${pct(kitchenFactor(kitchen.length))} (≥ two largest)`,
    ))
    factor.kitchen = d / connected
  }

  const heating = sum('hvac-heating')
  const cooling = sum('hvac-cooling')
  if (heating + cooling > 0) {
    const heatingGoverns = heating >= cooling
    rules.push(rule(
      'noncoincident', 'Heating / cooling (non-coincident)', 'NEC 220.60', heating + cooling,
      Math.max(heating, cooling), heatingGoverns ? 'heating governs; cooling omitted' : 'cooling governs; heating omitted',
    ))
    factor['hvac-heating'] = heatingGoverns ? 1 : 0
    factor['hvac-cooling'] = heatingGoverns ? 0 : 1
  }

  const motors = byCat.get('motor') ?? []
  if (motors.length > 0) {
    const connected = sum('motor')
    const largest = Math.max(...motors.map((m) => m.va))
    rules.push(rule('motors', 'Motors', 'NEC 430.24', connected, connected, '100 %'))
    rules.push(rule('largest-motor', 'Largest motor +25 %', 'NEC 430.24', largest, 0.25 * largest, '25 % of largest motor'))
  }

  for (const cat of ['water-heater', 'ev-charger', 'other-continuous', 'other-noncontinuous'] as LoadCategory[]) {
    const connected = sum(cat)
    if (connected <= 0) continue
    rules.push(rule(cat, CATEGORY_LABELS[cat], OTHER_REFS[cat] ?? 'NEC 220.14', connected, connected, '100 %'))
    factor[cat] = 1
  }

  // Continuous loads at 125 %: +25 % of the demand-adjusted VA of continuous, non-motor circuits
  const continuousVA = items
    .filter((it) => it.circuit.continuous && it.circuit.category !== 'motor')
    .reduce((a, it) => a + it.va * (factor[it.circuit.category] ?? 1), 0)
  if (continuousVA > 0) {
    rules.push(rule(
      'continuous', 'Continuous loads +25 %', 'NEC 215.2(A)(1)', continuousVA, 0.25 * continuousVA,
      '25 % of continuous load (after demand factors)',
    ))
  }
  return rules
}

function iecRules(panel: Panel, items: LoadItem[]): DemandRuleApplication[] {
  const rules: DemandRuleApplication[] = []
  for (const cat of LOAD_CATEGORIES) {
    const catItems = items.filter((it) => it.circuit.category === cat)
    const connected = catItems.reduce((a, it) => a + it.va, 0)
    if (connected <= 0) continue
    const f = panel.iecDiversity[cat] ?? 1
    rules.push(rule(cat, CATEGORY_LABELS[cat], 'IEC 60364 (designer diversity)', connected, connected * f, `× ${f}`))
  }

  const motors = items.filter((it) => it.circuit.category === 'motor')
  if (panel.iecLargestMotorAdder && motors.length > 0) {
    const largest = Math.max(...motors.map((m) => m.va))
    rules.push(rule('largest-motor', 'Largest motor +25 %', 'Motor starting margin', largest, 0.25 * largest, '25 % of largest motor'))
  }

  if (panel.iecApplyRdf) {
    const subtotal = rules.reduce((a, r) => a + r.demandVA, 0)
    const rdf = iecRatedDiversityFactor(items.length)
    // Expressed as a negative adjustment so the rule rows still sum to the demand total
    rules.push(rule(
      'rdf', `Rated diversity factor (${items.length} circuits)`, 'IEC 61439-2', subtotal, subtotal * rdf - subtotal, `× ${rdf}`,
    ))
  }
  return rules
}

export function calculateDemand(panel: Panel, schedule: ScheduleResult): DemandResult {
  const { system } = schedule
  const byId = new Map(panel.circuits.map((c) => [c.id, c]))
  const items: LoadItem[] = schedule.circuitLoads
    .map((l) => ({ circuit: byId.get(l.circuitId) as Circuit, va: l.va }))
    .filter((it) => it.circuit && it.circuit.kind === 'load' && it.va > 0)

  const rules = panel.standard === 'NEC' ? necRules(panel, items) : iecRules(panel, items)
  const connectedVA = items.reduce((a, it) => a + it.va, 0)
  const demandVA = rules.reduce((a, r) => a + r.demandVA, 0)
  const designCurrentA = demandVA / (system.threePhase ? SQRT3 * system.vLL : system.vLL)
  const recommendedMainA = designCurrentA > 0 ? recommendStandardBreaker(designCurrentA, panel.standard) : null

  const busOk = designCurrentA <= panel.busRatingA + 1e-9
  const mainOk = panel.mainType === 'main-breaker' && panel.mainRatingA !== null
    ? designCurrentA <= panel.mainRatingA + 1e-9
    : null

  const warnings: PanelWarning[] = []
  const a = designCurrentA.toFixed(1)
  if (!busOk) {
    warnings.push({
      code: 'BUS_EXCEEDED', severity: 'error', reference: 'NEC 408.30',
      message: `Design current ${a} A exceeds the ${panel.busRatingA} A bus rating`,
    })
  }
  if (mainOk === false) {
    warnings.push({
      code: 'MAIN_EXCEEDED', severity: 'error', reference: 'NEC 408.36',
      message: `Design current ${a} A exceeds the ${panel.mainRatingA} A main rating`,
    })
  }
  if (designCurrentA > 0 && recommendedMainA === null) {
    warnings.push({
      code: 'MAIN_ABOVE_MAX_RATING', severity: 'error',
      message: `Design current ${a} A is above the largest standard rating — split the load or use parallel feeders`,
    })
  }
  if (panel.standard === 'NEC' && (panel.occupancy === 'hotel' || panel.occupancy === 'hospital')
    && items.some((it) => it.circuit.category === 'lighting')) {
    warnings.push({
      code: 'LIGHTING_FACTOR_NOTE', severity: 'info', reference: 'NEC Table 220.42',
      message: 'Table 220.42 hotel/hospital factors do not apply to areas where all lighting is likely to be used at one time (operating rooms, ballrooms, dining rooms)',
    })
  }

  return { rules, connectedVA, demandVA, designCurrentA, recommendedMainA, busOk, mainOk, warnings }
}
