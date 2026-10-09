'use client'

import { Check } from 'lucide-react'
import type { PFCDesignStage } from '@/types/power-factor-correction'

export const STAGES: { stage: PFCDesignStage; title: string; subtitle: string }[] = [
  { stage: 1, title: 'Required kVAR', subtitle: 'Load & target PF' },
  { stage: 2, title: 'Step bank', subtitle: 'Sequence & controller' },
  { stage: 3, title: 'Detuning', subtitle: 'Reactors & voltage' },
  { stage: 4, title: 'Switchgear', subtitle: 'Contactors, fuses, cables' },
]

interface Props {
  active: PFCDesignStage
  /** Stages 2–4 unlock once stage 1 has results (and the system is LV) */
  designAvailable: boolean
  onChange: (stage: PFCDesignStage) => void
}

export default function DesignStepper({ active, designAvailable, onChange }: Props) {
  return (
    <nav aria-label="Design stages">
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STAGES.map(({ stage, title, subtitle }) => {
          const enabled = stage === 1 || designAvailable
          const current = stage === active
          const complete = enabled && stage < active
          return (
            <li key={stage}>
              <button
                type="button"
                disabled={!enabled}
                aria-current={current ? 'step' : undefined}
                onClick={() => onChange(stage)}
                className={[
                  'w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  current ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                  !enabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    current ? 'bg-primary text-primary-foreground'
                      : complete ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {complete ? <Check className="h-4 w-4" aria-label="completed" /> : stage}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{title}</span>
                  <span className="block text-xs text-muted-foreground truncate">{subtitle}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
