import type { Metadata } from 'next'
import MotorStartingTool from './MotorStartingTool'

export const metadata: Metadata = {
  title: 'Motor Starting Analysis Calculator | ElectroMate',
  description:
    'Analyze and compare 5 motor starting methods (DOL, Star-Delta, Autotransformer, Soft Starter, VFD) with voltage-dip evaluation per IEEE 1668, source impedance chain, and acceleration-time vs thermal-limit checks. NEC 430 + IEC 60034-12 + IEEE 3002.7-2018.',
  keywords: [
    'motor starting',
    'voltage dip',
    'DOL',
    'star delta',
    'autotransformer',
    'soft starter',
    'VFD',
    'IEEE 3002.7',
    'IEEE 1668',
    'NEC 430',
    'IEC 60034-12',
    'NEMA code letter',
    'locked rotor',
    'acceleration time',
    'thermal limit',
  ],
}

export default function MotorStartingPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <MotorStartingTool />
    </main>
  )
}
