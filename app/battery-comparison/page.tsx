/**
 * Battery Comparison Page
 *
 * User Story 6: Compare battery technologies across lifespan,
 * temperature tolerance, DoD, cycle life, and maintenance
 *
 * @see specs/001-electromate-engineering-app/spec.md#US6
 */

import { BatteryComparisonTool } from '@/components/battery-comparison/BatteryComparisonTool'

export const metadata = {
  title: 'Battery Technology Comparison - ElectroMate',
  description:
    'Compare VRLA, Lithium-Ion, NiCd, and other battery technologies. Evaluate lifespan, cycle life, temperature tolerance, depth of discharge, maintenance requirements, and costs for your application.',
}

export default function BatteryComparisonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Battery Technology Comparison</h1>
        <p className="mt-2 text-muted-foreground">
          Compare battery chemistries across key performance metrics to select the optimal
          technology for your application
        </p>
      </div>

      <BatteryComparisonTool />
    </div>
  )
}
