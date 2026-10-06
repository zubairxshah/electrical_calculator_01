'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, AlertTriangle, CheckCircle2, HardHat, Info, ShieldAlert } from 'lucide-react'
import type { PpeAssessment, PpeOutcome } from '@/types/arc-flash'
import { TABLE_130_7_C_15_A, TABLE_METHOD_NOTE } from '@/lib/standards/nfpa70e'

export interface PpeAssessmentCardProps {
  ppe: PpeAssessment
  /** Governing incident energy (J/cm²) the outcome was derived from */
  governingEnergyJcm2: number
  isStale: boolean
  formatEnergy: (jcm2: number) => string
  formatDistance: (mm: number) => string
}

const CATEGORY_STYLES: Record<1 | 2 | 3 | 4, string> = {
  1: 'bg-yellow-100 border-yellow-400 text-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-100',
  2: 'bg-orange-100 border-orange-400 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100',
  3: 'bg-orange-200 border-orange-600 text-orange-950 dark:bg-orange-900/50 dark:text-orange-50',
  4: 'bg-red-100 border-red-500 text-red-900 dark:bg-red-950/40 dark:text-red-100',
}

function OutcomeBanner({
  outcome,
  ppe,
  governingEnergyJcm2,
  formatEnergy,
}: {
  outcome: PpeOutcome
  ppe: PpeAssessment
  governingEnergyJcm2: number
  formatEnergy: (jcm2: number) => string
}) {
  if (outcome === 'danger') {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-lg border-2 border-red-700 bg-red-700 p-4 text-white">
        <AlertCircle className="h-8 w-8 shrink-0" aria-hidden />
        <div>
          <p className="text-lg font-bold tracking-wide">DANGER — no PPE category applies</p>
          <p className="text-sm">
            Incident energy {formatEnergy(governingEnergyJcm2)} exceeds 40 cal/cm². De-energize the equipment
            (establish an electrically safe work condition) or reduce the hazard, e.g. with faster clearing time.
          </p>
        </div>
      </div>
    )
  }

  if (outcome === 'below-threshold') {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <Info className="h-6 w-6 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Below 1.2 cal/cm² — no arc-rated PPE category required</p>
          <p className="text-sm">Wear non-melting clothing. Shock protection is still required inside the approach boundaries.</p>
        </div>
      </div>
    )
  }

  if (ppe.iecRequirement) {
    return (
      <div className={`flex items-start gap-3 rounded-lg border-2 p-4 ${CATEGORY_STYLES[outcome]}`}>
        <HardHat className="h-7 w-7 shrink-0" aria-hidden />
        <div className="space-y-1">
          <p className="text-lg font-bold">Minimum arc rating (ATPV/ELIM) ≥ {ppe.iecRequirement.minArcRatingJcm2.toFixed(1)} J/cm²</p>
          <p className="text-sm">{ppe.iecRequirement.text}</p>
          <p className="text-xs opacity-80">{ppe.iecRequirement.note}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 rounded-lg border-2 p-4 ${CATEGORY_STYLES[outcome]}`}>
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-md border-2 border-current bg-white/60 dark:bg-black/20">
        <span className="text-[10px] font-semibold uppercase leading-none">Cat</span>
        <span className="text-3xl font-bold leading-none">{outcome}</span>
      </div>
      <div>
        <p className="text-lg font-bold">
          <HardHat className="inline h-5 w-5 mr-1 -mt-1" aria-hidden />
          PPE Category {outcome}
        </p>
        <p className="text-sm">
          Minimum arc rating {ppe.minArcRatingCalcm2} cal/cm² ({ppe.minArcRatingJcm2} J/cm²)
          {ppe.tableMethod?.applicable ? ' — from the PPE category table method' : ' — from the incident energy analysis'}
        </p>
      </div>
    </div>
  )
}

export default function PpeAssessmentCard({
  ppe,
  governingEnergyJcm2,
  isStale,
  formatEnergy,
  formatDistance,
}: PpeAssessmentCardProps) {
  const ab = ppe.approachBoundaries
  const table = ppe.tableMethod
  const tableRow = table ? TABLE_130_7_C_15_A.find((r) => r.id === table.rowId) : undefined
  // In IEC mode the ATPV/ELIM requirement replaces the NFPA category clothing list
  const showItems = !ppe.iecRequirement && (ppe.clothing.length > 0 || ppe.equipment.length > 0)

  return (
    <Card aria-live="polite">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" aria-hidden /> PPE assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isStale && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
            <Info className="h-4 w-4 shrink-0" />
            Inputs changed — recalculate to update the PPE assessment.
          </div>
        )}

        <OutcomeBanner
          outcome={ppe.outcome}
          ppe={ppe}
          governingEnergyJcm2={governingEnergyJcm2}
          formatEnergy={formatEnergy}
        />

        {table && (
          <div
            className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
              table.applicable
                ? 'border-green-200 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-200'
                : 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200'
            }`}
          >
            {table.applicable ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            )}
            <div className="space-y-1">
              <p className="font-medium">
                Table method {table.applicable ? 'applies' : 'not applicable'}: {tableRow?.label}
              </p>
              {table.applicable ? (
                <p>
                  Category {table.category}, arc flash boundary {formatDistance(table.afbMm)} (from the table).
                </p>
              ) : (
                <>
                  <ul className="list-disc pl-5">
                    {table.failedLimits.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <p>The incident energy analysis result is used instead.</p>
                </>
              )}
              <p className="text-xs opacity-80">{TABLE_METHOD_NOTE}</p>
            </div>
          </div>
        )}

        {showItems && (
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Arc-rated clothing</h4>
              <ul className="list-disc pl-5 space-y-0.5">
                {ppe.clothing.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Protective equipment</h4>
              <ul className="list-disc pl-5 space-y-0.5">
                {ppe.equipment.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {showItems && (
          <p className="text-xs text-muted-foreground">
            Item names are paraphrased — consult NFPA 70E-2024 Table 130.7(C)(15)(c) for the full wording and notes.
          </p>
        )}

        <div>
          <h4 className="font-semibold text-sm mb-1">Shock approach boundaries</h4>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Limited approach — exposed movable conductor</dt>
            <dd className="text-right font-medium">
              {ab.limitedMovableText} ({Math.round(ab.limitedMovableMm)} mm)
            </dd>
            <dt className="text-muted-foreground">Limited approach — exposed fixed circuit part</dt>
            <dd className="text-right font-medium">
              {ab.limitedFixedText} ({Math.round(ab.limitedFixedMm)} mm)
            </dd>
            <dt className="text-muted-foreground">Restricted approach</dt>
            <dd className="text-right font-medium">
              {ab.restricted === 'avoid-contact' ? 'Avoid contact' : `${ab.restrictedText} (${Math.round(ab.restricted)} mm)`}
            </dd>
          </dl>
        </div>

        <p className="text-xs text-muted-foreground">References: {ppe.references.join(' · ')}</p>
      </CardContent>
    </Card>
  )
}
