import type { Metadata } from 'next'
import VoltageDropTool from './VoltageDropTool'

export const metadata: Metadata = {
  title: 'Voltage Drop Calculator | ElectroMate',
  description:
    'Calculate voltage drop for cables and busway (busbar trunking) systems. Supports IEC 60364-5-52, NEC Chapter 9, and IEC 61439-6 with cable size recommendations, parallel runs, and sandwich/non-sandwich busway types.',
  keywords: [
    'voltage drop calculator',
    'cable voltage drop',
    'busway voltage drop',
    'busbar trunking',
    'IEC 60364',
    'NEC Chapter 9',
    'IEC 61439-6',
    'conductor sizing',
  ],
}

export default function VoltageDropPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <VoltageDropTool />
    </main>
  )
}
