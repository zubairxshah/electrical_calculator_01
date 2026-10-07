import type { Metadata } from 'next'
import PanelScheduleTool from './PanelScheduleTool'

export const metadata: Metadata = {
  title: 'Panel Schedule & Load Balancing | ElectroMate',
  description:
    'Build a panelboard schedule with standard two-column numbering, per-phase VA and current, imbalance and neutral estimate, automatic phase balancing, NEC 2020 Article 220 demand loads or IEC diversity, main breaker recommendation and PDF export.',
  keywords: [
    'panel schedule',
    'panelboard schedule',
    'load balancing',
    'phase balancing',
    'NEC 220 demand load',
    'NEC 408',
    'IEC 60364',
    'distribution board schedule',
  ],
}

export default function PanelSchedulePage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <PanelScheduleTool />
    </main>
  )
}
