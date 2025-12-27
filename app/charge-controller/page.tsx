/**
 * Charge Controller Selection Page
 *
 * User Story 5: MPPT/PWM charge controller selection per IEC 62109
 *
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

import { ChargeControllerTool } from '@/components/charge-controller/ChargeControllerTool'

export const metadata = {
  title: 'Charge Controller Selection - ElectroMate',
  description:
    'Select the right MPPT or PWM charge controller for your solar array. Calculate safety margins, compare controller types, and get sizing recommendations per IEC 62109.',
}

export default function ChargeControllerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Charge Controller Selection</h1>
        <p className="mt-2 text-muted-foreground">
          Match your solar array to the appropriate MPPT or PWM charge controller with proper safety
          margins per IEC 62109 standards
        </p>
      </div>

      <ChargeControllerTool />
    </div>
  )
}
