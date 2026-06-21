/**
 * Battery Backup Calculator Page
 *
 * User Story 1: Battery backup time calculation per IEEE 485-2020
 */

import { BatteryCalculator } from '@/components/battery/BatteryCalculator'

export const metadata = {
  title: 'Battery Sizing Calculator - ElectroMate',
  description:
    'Standards-based battery sizing (IEEE 485 / IEC 60896,62619). Solve backup time or required capacity with per-chemistry DoD, temperature, aging, and Peukert derating. Supports VRLA AGM/Gel, flooded lead-acid, LiFePO4, NMC, LTO, NiCd, NiFe, and flow batteries.',
}

export default function BatteryCalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Battery Sizing Calculator</h1>
        <p className="mt-2 text-muted-foreground">
          Solve backup time or required capacity with chemistry-aware, standards-based derating
          (IEEE 485-2020, IEC 60896/62619)
        </p>
      </div>

      <BatteryCalculator />
    </div>
  )
}
