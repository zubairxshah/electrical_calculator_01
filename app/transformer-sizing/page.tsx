import type { Metadata } from 'next'
import TransformerSizingTool from './TransformerSizingTool'

export const metadata: Metadata = {
  title: 'Transformer Sizing Calculator | ElectroMate',
  description:
    'Calculate transformer kVA rating, losses, impedance, voltage regulation, and tap settings. Supports IEC 60076, IEEE C57, and NEC 450 standards with temperature and altitude derating.',
  keywords: [
    'transformer sizing',
    'kVA rating calculator',
    'transformer losses',
    'voltage regulation',
    'impedance calculation',
    'IEC 60076',
    'IEEE C57',
    'NEC 450',
  ],
}

export default function TransformerSizingPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <TransformerSizingTool />
    </main>
  )
}
