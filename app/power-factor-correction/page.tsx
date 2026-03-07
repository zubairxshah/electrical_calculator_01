import type { Metadata } from 'next'
import PowerFactorCorrectionTool from './PowerFactorCorrectionTool'

export const metadata: Metadata = {
  title: 'Power Factor Correction Calculator | ElectroMate',
  description:
    'Calculate capacitor bank sizing for power factor correction. Supports IEC 60831, IEEE 18, and NEC 460 standards with derating, harmonic analysis, and savings estimation.',
  keywords: [
    'power factor correction',
    'capacitor bank sizing',
    'PFC calculator',
    'kVAR calculation',
    'reactive power compensation',
    'IEC 60831',
    'NEC 460',
  ],
}

export default function PowerFactorCorrectionPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <PowerFactorCorrectionTool />
    </main>
  )
}
