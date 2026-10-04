'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronDown, ChevronRight, Info } from 'lucide-react'
import type { ArcFlashResult, CaseResult } from '@/types/arc-flash'

export interface ArcFlashResultsProps {
  result: ArcFlashResult
  isStale: boolean
  /** Formats an energy in J/cm² for display (unit order depends on the selected standard) */
  formatEnergy: (jcm2: number) => string
  /** Formats a distance in mm for display */
  formatDistance: (mm: number) => string
}

const fmt = (n: number | undefined, digits = 3) => (n === undefined ? '—' : n.toFixed(digits))

function CaseCard({
  title,
  subtitle,
  data,
  governs,
  formatEnergy,
  formatDistance,
}: {
  title: string
  subtitle: string
  data: CaseResult
  governs: boolean
  formatEnergy: (j: number) => string
  formatDistance: (mm: number) => string
}) {
  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${governs ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/20' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {governs && <Badge className="bg-orange-600 hover:bg-orange-600">Governs</Badge>}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Arcing current</dt>
        <dd className="font-medium text-right">{data.arcingCurrentKA.toFixed(3)} kA</dd>
        <dt className="text-muted-foreground">Arcing time</dt>
        <dd className="font-medium text-right">{data.arcingTimeMs} ms</dd>
        <dt className="text-muted-foreground">Incident energy</dt>
        <dd className="font-semibold text-right">{formatEnergy(data.incidentEnergyJcm2)}</dd>
        <dt className="text-muted-foreground">Arc flash boundary</dt>
        <dd className="font-semibold text-right">{formatDistance(data.arcFlashBoundaryMm)}</dd>
      </dl>
    </div>
  )
}

export default function ArcFlashResults({ result, isStale, formatEnergy, formatDistance }: ArcFlashResultsProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { nominal, reduced, governing, enclosure } = result

  return (
    <Card className="relative" aria-live="polite">
      <CardHeader>
        <CardTitle>Incident energy & arc flash boundary</CardTitle>
        <p className="text-sm text-muted-foreground">
          Governing result:{' '}
          <span className="font-semibold text-foreground">
            {formatEnergy(governing.incidentEnergyJcm2)}, boundary {formatDistance(governing.arcFlashBoundaryMm)}
          </span>{' '}
          ({result.governingCase === 'reduced' ? 'reduced arcing current case' : 'nominal arcing current case'})
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isStale && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
            <Info className="h-4 w-4 shrink-0" />
            Inputs changed since this result was calculated. Recalculate to update.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <CaseCard
            title="Nominal arcing current"
            subtitle="IEEE 1584-2018 full arcing current"
            data={nominal}
            governs={result.governingCase === 'nominal'}
            formatEnergy={formatEnergy}
            formatDistance={formatDistance}
          />
          <CaseCard
            title="Reduced arcing current"
            subtitle={`Variation-corrected (× ${reduced.intermediates.reductionFactor.toFixed(3)})`}
            data={reduced}
            governs={result.governingCase === 'reduced'}
            formatEnergy={formatEnergy}
            formatDistance={formatDistance}
          />
        </div>

        {result.warnings.length > 0 && (
          <ul className="space-y-2">
            {result.warnings.map((w) => (
              <li
                key={w.code}
                className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                  w.severity === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200'
                    : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
                }`}
              >
                {w.severity === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-label="Warning" />
                ) : (
                  <Info className="h-4 w-4 mt-0.5 shrink-0" aria-label="Note" />
                )}
                <span>
                  {w.message} <span className="opacity-75">({w.clause})</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((s) => !s)}
          >
            {showDetails ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
            Calculation details
          </Button>
          {showDetails && (
            <div className="mt-2 space-y-4 text-sm">
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                <dt className="text-muted-foreground">Model path</dt>
                <dd>{result.modelPath === 'LV' ? '≤ 600 V (Eq. 25)' : '> 600 V (interpolation, Eqs. 16–24)'}</dd>
                <dt className="text-muted-foreground">VarCf</dt>
                <dd>{fmt(result.varCf)}</dd>
                <dt className="text-muted-foreground">Enclosure</dt>
                <dd className="capitalize">{enclosure.type.replace('-', ' ')}</dd>
                <dt className="text-muted-foreground">Correction factor CF</dt>
                <dd>{fmt(enclosure.cf)}</dd>
                {enclosure.type !== 'open-air' && (
                  <>
                    <dt className="text-muted-foreground">Equivalent W × H</dt>
                    <dd>
                      {fmt(enclosure.equivalentWidthIn)} × {fmt(enclosure.equivalentHeightIn)} in
                    </dd>
                    <dt className="text-muted-foreground">EES</dt>
                    <dd>{fmt(enclosure.ees)} in</dd>
                  </>
                )}
              </dl>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1 pr-2">Case</th>
                      <th className="text-right px-2">I_arc 600 V</th>
                      {result.modelPath === 'MV' && (
                        <>
                          <th className="text-right px-2">I_arc 2700 V</th>
                          <th className="text-right px-2">I_arc 14.3 kV</th>
                          <th className="text-right px-2">E 600 / 2700 / 14.3k (J/cm²)</th>
                          <th className="text-right px-2">AFB 600 / 2700 / 14.3k (mm)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[nominal, reduced].map((c) => (
                      <tr key={c.case} className="border-b last:border-0">
                        <td className="py-1 pr-2 capitalize">{c.case}</td>
                        <td className="text-right px-2">{fmt(c.intermediates.iArc600KA)} kA</td>
                        {result.modelPath === 'MV' && (
                          <>
                            <td className="text-right px-2">{fmt(c.intermediates.iArc2700KA)} kA</td>
                            <td className="text-right px-2">{fmt(c.intermediates.iArc14300KA)} kA</td>
                            <td className="text-right px-2">
                              {fmt(c.intermediates.e600Jcm2)} / {fmt(c.intermediates.e2700Jcm2)} /{' '}
                              {fmt(c.intermediates.e14300Jcm2)}
                            </td>
                            <td className="text-right px-2">
                              {fmt(c.intermediates.afb600Mm, 0)} / {fmt(c.intermediates.afb2700Mm, 0)} /{' '}
                              {fmt(c.intermediates.afb14300Mm, 0)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                {result.standardRefs.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
