import type { Metadata } from 'next'
import ConduitFillTool from './ConduitFillTool'

export const metadata: Metadata = {
  title: 'Conduit Fill Calculator | ElectroMate',
  description:
    'Calculate conduit and raceway fill compliance per NEC 2020 Chapter 9. Supports EMT, RMC, IMC, PVC, FMC, LFMC with automatic minimum conduit size recommendation and nipple fill (60%) support.',
  keywords: [
    'conduit fill calculator',
    'NEC Chapter 9',
    'raceway fill',
    'conduit sizing',
    'EMT conduit',
    'PVC conduit',
    'wire fill',
    'conductor fill',
  ],
}

export default function ConduitFillPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <ConduitFillTool />
    </main>
  )
}
