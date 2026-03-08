import type { Metadata } from 'next'
import ShortCircuitTool from './ShortCircuitTool'

export const metadata: Metadata = {
  title: 'Short Circuit Analysis Calculator | ElectroMate',
  description:
    'Calculate fault currents including 3-phase, single-line-to-ground, line-to-line, and double-line-to-ground faults. Supports IEC 60909, IEEE 551, and NEC 110.9 with impedance modeling, asymmetry factors, and breaker adequacy.',
  keywords: [
    'short circuit analysis',
    'fault current calculator',
    'IEC 60909',
    'IEEE 551',
    'NEC 110.9',
    'breaker interrupting capacity',
    'X/R ratio',
    'asymmetry factor',
  ],
}

export default function ShortCircuitPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <ShortCircuitTool />
    </main>
  )
}
