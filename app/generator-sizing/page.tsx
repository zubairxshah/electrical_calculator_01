import type { Metadata } from 'next'
import GeneratorSizingTool from './GeneratorSizingTool'

export const metadata: Metadata = {
  title: 'Generator Sizing Calculator | ElectroMate',
  description:
    'Size standby and prime generators per ISO 8528, IEEE 3006.4, NFPA 110, and NEC 700/701/702. Motor starting voltage dip analysis, step loading, altitude/temperature derating, fuel consumption estimation.',
  keywords: [
    'generator sizing',
    'standby generator',
    'prime generator',
    'motor starting',
    'voltage dip',
    'step loading',
    'ISO 8528',
    'IEEE 3006.4',
    'NFPA 110',
    'NEC 700',
    'generator derating',
    'fuel consumption',
  ],
}

export default function GeneratorSizingPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <GeneratorSizingTool />
    </main>
  )
}
