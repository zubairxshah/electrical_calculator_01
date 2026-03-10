import type { Metadata } from 'next'
import HarmonicAnalysisTool from './HarmonicAnalysisTool'

export const metadata: Metadata = {
  title: 'Harmonic Analysis & THD Calculator | ElectroMate',
  description:
    'Calculate THDi, THDv, TDD, K-Factor, and IEEE 519 / IEC 61000 compliance. Includes load harmonic profiles, filter sizing recommendations, and transformer/cable derating.',
  keywords: [
    'harmonic analysis',
    'THD calculator',
    'THDi',
    'THDv',
    'TDD',
    'IEEE 519',
    'IEC 61000',
    'K-Factor',
    'harmonic filter',
    'power quality',
  ],
}

export default function HarmonicAnalysisPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <HarmonicAnalysisTool />
    </main>
  )
}
