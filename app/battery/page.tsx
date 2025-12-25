/**
 * Battery Backup Calculator Page
 *
 * User Story 1: Battery backup time calculation per IEEE 485-2020
 */

import { BatteryCalculator } from '@/components/battery/BatteryCalculator'

export const metadata = {
  title: 'Battery Backup Calculator - ElectroMate',
  description:
    'Calculate battery backup time for DC systems using IEEE 485-2020 standards. Supports VRLA, FLA, Lithium-ion, and NiCd batteries.',
}

export default function BatteryCalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Battery Backup Calculator</h1>
        <p className="mt-2 text-muted-foreground">
          Calculate backup time and capacity requirements for battery systems using IEEE 485-2020
          standards
        </p>
      </div>

      <BatteryCalculator />
    </div>
  )
}
