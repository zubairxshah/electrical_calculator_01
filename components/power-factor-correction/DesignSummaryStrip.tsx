'use client'

import type { PFCPanelDesign } from '@/types/power-factor-correction'

interface Props {
  design: PFCPanelDesign
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold truncate">{value}</dd>
    </div>
  )
}

/** Persistent one-line summary of the current panel design (FR-003) */
export default function DesignSummaryStrip({ design }: Props) {
  const bank = design.stepBank
  const steps = bank && bank.steps.length > 0
    ? `${bank.steps.length} × ${bank.preset ?? (bank.controller ? 'custom' : 'fixed')}`
    : '—'
  const tuning = design.detuning
    ? design.detuning.applied !== null ? `${design.detuning.applied} %` : 'none'
    : '—'
  const incomer = design.switchgear?.incomerA ? `${design.switchgear.incomerA} A` : '—'

  return (
    <dl
      aria-label="Panel design summary"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border bg-muted/30 px-4 py-3"
    >
      <Item label="Installed kVAR" value={bank && bank.steps.length > 0 ? `${bank.totalKVAR.toFixed(1)} kVAR` : '—'} />
      <Item label="Steps" value={steps} />
      <Item label="Detuning" value={tuning} />
      <Item label="Main incomer" value={incomer} />
    </dl>
  )
}
