'use client'

import { AlertTriangle } from 'lucide-react'
import type { ArcFlashLabel } from '@/types/arc-flash'
import { formatDistance, formatEnergy } from '@/lib/calculations/arc-flash/units'

export interface ArcFlashLabelPreviewProps {
  label: ArcFlashLabel
}

function ppeText(label: ArcFlashLabel): string {
  if (label.ppeOutcome === 'danger') return 'No PPE category applies — de-energize'
  if (label.ppeOutcome === 'below-threshold') return 'Below 1.2 cal/cm² — non-melting clothing'
  if (label.standard === 'IEC' && label.minArcRatingJcm2 !== null) return `ATPV/ELIM ≥ ${label.minArcRatingJcm2} J/cm²`
  return `PPE Category ${label.ppeOutcome}`
}

/** ANSI Z535-style arc flash label (NFPA 70E-2024 130.5(H)), about 4 × 6 in. */
export default function ArcFlashLabelPreview({ label }: ArcFlashLabelPreviewProps) {
  const danger = label.signalWord === 'DANGER'
  const dist = (mm: number) => formatDistance(mm, label.standard)
  const rows: [string, string][] = [
    ['Arc flash boundary', dist(label.arcFlashBoundaryMm)],
    ['Incident energy', `${formatEnergy(label.incidentEnergyJcm2, label.standard)} at ${dist(label.workingDistanceMm)}`],
    ['PPE', ppeText(label)],
    ['Nominal voltage', `${label.nominalVoltageV} V`],
    ['Limited approach', label.limitedApproachText],
    ['Restricted approach', label.restrictedApproachText],
    ['Equipment ID', label.equipmentId || '—'],
    ['Date', label.date],
  ]

  return (
    <figure
      aria-label={`${label.signalWord} arc flash label: ${rows.map(([k, v]) => `${k} ${v}`).join('; ')}`}
      className="mx-auto w-full max-w-md aspect-[3/2] flex flex-col overflow-hidden rounded-md border-4 border-black bg-white text-black shadow"
    >
      <div
        className={`flex items-center justify-center gap-2 py-2 text-2xl font-black tracking-widest ${
          danger ? 'bg-red-700 text-white' : 'bg-orange-500 text-black'
        }`}
      >
        <AlertTriangle className="h-7 w-7" aria-hidden strokeWidth={2.5} />
        {label.signalWord}
      </div>
      <div className="flex-1 px-4 py-2">
        <p className="text-center font-bold uppercase text-sm mb-1">Arc Flash and Shock Hazard</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-semibold">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </figure>
  )
}
