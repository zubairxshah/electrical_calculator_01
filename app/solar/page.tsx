/**
 * Solar Array Calculator Page
 *
 * User Story 4: Solar panel array sizing per NREL standards
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

import { SolarArrayCalculator } from '@/components/solar/SolarArrayCalculator'

export const metadata = {
  title: 'Solar Array Calculator - ElectroMate',
  description:
    'Calculate solar panel array sizing based on daily energy requirements, peak sun hours, and system performance. Uses NREL standards for accurate sizing.',
}

export default function SolarCalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Solar Array Calculator</h1>
        <p className="mt-2 text-muted-foreground">
          Size your solar PV system based on energy requirements, location, and panel specifications
          using NREL methodology
        </p>
      </div>

      <SolarArrayCalculator />
    </div>
  )
}
