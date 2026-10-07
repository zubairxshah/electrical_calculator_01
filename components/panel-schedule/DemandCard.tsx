'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { DemandResult, LoadCategory, Panel } from '@/types/panel-schedule'
import { CATEGORY_LABELS, IEC_DIVERSITY_HINTS, LOAD_CATEGORIES } from '@/lib/calculations/panel-schedule/defaults'
import NumberField from './NumberField'
import { WarningList } from './PhaseSummaryCard'

interface Props {
  panel: Panel
  demand: DemandResult
  onDiversityChange: (category: LoadCategory, factor: number) => void
  onFieldChange: <K extends keyof Panel>(key: K, value: Panel[K]) => void
}

const va = (v: number) => Math.round(v).toLocaleString()

export default function DemandCard({ panel, demand, onDiversityChange, onFieldChange }: Props) {
  const iec = panel.standard === 'IEC'
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
          <CardTitle>Demand load &amp; main sizing</CardTitle>
          <Badge variant="outline">{iec ? 'IEC 60364 / IEC 61439-2' : 'NEC 2020 Article 220'}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {demand.rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add load circuits to calculate the demand.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left py-1 pr-2">Rule</th>
                    <th className="text-left py-1 pr-2">Reference</th>
                    <th className="text-right py-1 pr-2">Connected (VA)</th>
                    <th className="text-left py-1 pr-2">Factor</th>
                    <th className="text-right py-1">Demand (VA)</th>
                  </tr>
                </thead>
                <tbody>
                  {demand.rules.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-1 pr-2">{r.label}</td>
                      <td className="py-1 pr-2 text-xs text-muted-foreground whitespace-nowrap">{r.reference}</td>
                      <td className="py-1 pr-2 text-right tabular-nums">{va(r.connectedVA)}</td>
                      <td className="py-1 pr-2 text-xs">{r.factorText}</td>
                      <td className="py-1 text-right tabular-nums font-medium">{va(r.demandVA)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-semibold">
                    <td className="py-1" colSpan={2}>Total</td>
                    <td className="py-1 pr-2 text-right tabular-nums">{va(demand.connectedVA)}</td>
                    <td />
                    <td className="py-1 text-right tabular-nums">{va(demand.demandVA)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Design current</dt>
              <dd className="text-2xl font-bold tabular-nums">{demand.designCurrentA.toFixed(1)} A</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Recommended main / feeder OCPD</dt>
              <dd className="text-2xl font-bold tabular-nums">{demand.recommendedMainA ? `${demand.recommendedMainA} A` : '—'}</dd>
              <dd className="text-xs text-muted-foreground">{iec ? 'IEC preferred ratings' : 'NEC 240.6(A) standard rating'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bus ({panel.busRatingA} A)</dt>
              <dd className={`font-semibold ${demand.busOk ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                {demand.busOk ? 'OK' : 'Exceeded'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Main {panel.mainType === 'main-breaker' ? `(${panel.mainRatingA ?? '—'} A)` : '(MLO)'}</dt>
              <dd className={`font-semibold ${demand.mainOk === false ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
                {demand.mainOk === null ? 'n/a — protected upstream' : demand.mainOk ? 'OK' : 'Exceeded'}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Design current = demand VA / (√3 × V_LL) for three-phase, demand VA / V_LL for single-phase.
            {!iec && ' Continuous loads are already included at 125 %, so the main may be selected directly at or above the design current.'}
          </p>
          <WarningList warnings={demand.warnings} />
        </CardContent>
      </Card>

      {iec && (
        <Card>
          <CardHeader><CardTitle>Diversity factors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              IEC 60364 does not tabulate mandatory demand factors. Defaults are 1.0 (no diversity — conservative). Enter
              factors from your design basis; typical ranges are guidance only.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LOAD_CATEGORIES.map((cat) => (
                <NumberField
                  key={cat} id={`div-${cat}`} label={CATEGORY_LABELS[cat]} value={panel.iecDiversity[cat]} step={0.05}
                  hint={IEC_DIVERSITY_HINTS[cat]}
                  error={!(panel.iecDiversity[cat] >= 0 && panel.iecDiversity[cat] <= 1) ? 'Factor must be 0–1' : undefined}
                  onChange={(v) => onDiversityChange(cat, v ?? Number.NaN)}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="iec-rdf" checked={panel.iecApplyRdf} onCheckedChange={(v) => onFieldChange('iecApplyRdf', v === true)} />
                <Label htmlFor="iec-rdf" className="font-normal">Apply assembly rated diversity factor (IEC 61439-2, by number of outgoing circuits)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="iec-motor" checked={panel.iecLargestMotorAdder} onCheckedChange={(v) => onFieldChange('iecLargestMotorAdder', v === true)} />
                <Label htmlFor="iec-motor" className="font-normal">Add 25 % of the largest motor (starting margin)</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
