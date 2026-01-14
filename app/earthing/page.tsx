import { Metadata } from 'next'
import { EarthingCalculatorTool } from './EarthingCalculatorTool'

export const metadata: Metadata = {
  title: 'Earthing Conductor Calculator | ElectroMate',
  description: 'Calculate earthing conductor sizes per IEC 60364-5-54 and NEC 250 standards',
}

export default function EarthingPage() {
  return <EarthingCalculatorTool />
}
