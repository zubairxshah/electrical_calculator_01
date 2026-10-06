import type { Metadata } from 'next'
import ArcFlashTool from './ArcFlashTool'

export const metadata: Metadata = {
  title: 'Arc Flash Calculator | ElectroMate',
  description:
    'Calculate arcing current, incident energy and arc flash boundary per IEEE 1584-2018, with nominal and reduced arcing current cases, NFPA 70E-2024 PPE categories, arc flash label and PDF report.',
  keywords: [
    'arc flash calculator',
    'incident energy',
    'IEEE 1584-2018',
    'arc flash boundary',
    'NFPA 70E',
    'PPE category',
    'arc flash label',
    'IEC 61482',
  ],
}

export default function ArcFlashPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <ArcFlashTool />
    </main>
  )
}
