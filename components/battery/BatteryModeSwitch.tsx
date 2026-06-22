/**
 * Mode switch: runtime (solve backup time) ↔ sizing (solve required capacity).
 * Mirrors the standard switcher pattern used by conduit-fill / motor-starting.
 */

'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BatteryCalcMode } from '@/lib/types'
import { Clock, Battery } from 'lucide-react'

interface BatteryModeSwitchProps {
  mode: BatteryCalcMode
  onChange: (mode: BatteryCalcMode) => void
}

export function BatteryModeSwitch({ mode, onChange }: BatteryModeSwitchProps) {
  return (
    <Tabs value={mode} onValueChange={(v) => onChange(v as BatteryCalcMode)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="runtime" className="gap-2">
          <Clock className="h-4 w-4" />
          Backup time
        </TabsTrigger>
        <TabsTrigger value="sizing" className="gap-2">
          <Battery className="h-4 w-4" />
          Size the bank
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
