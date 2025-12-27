/**
 * Charge Controller Input Form Component
 *
 * Form inputs with real-time validation for charge controller selection
 *
 * @see specs/001-electromate-engineering-app/spec.md#US5
 */

'use client'

import { useChargeControllerStore } from '@/stores/useChargeControllerStore'
import { InputField } from '@/components/shared/InputField'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ChargeControllerInputForm() {
  const { inputs, setInputs, validation } = useChargeControllerStore()

  const getFieldValidation = (field: string) => {
    if (!validation) return undefined
    const error = validation.errors.find((e) => e.field === field)
    const warning = validation.warnings.find((w) => w.field === field)
    const result = error || warning
    if (!result) return undefined
    return {
      ...result,
      isValid: !error,
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
      {/* Array V_oc */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>
            Array Open-Circuit Voltage (V_oc)
            <span className="text-destructive ml-1">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Total V_oc of your solar array. For panels in series, multiply single panel
                  V_oc by number of panels. Found on panel datasheet under STC conditions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <InputField
          label=""
          value={inputs.arrayVoc}
          onChange={(value) => setInputs({ arrayVoc: Number(value) })}
          type="number"
          unit="V"
          placeholder="160"
          validation={getFieldValidation('arrayVoc')}
          required
        />
        <p className="text-xs text-muted-foreground">
          Sum of panel V_oc values in series string
        </p>
      </div>

      {/* Array I_sc */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>
            Array Short-Circuit Current (I_sc)
            <span className="text-destructive ml-1">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Total I_sc of your array. For parallel strings, multiply single panel I_sc
                  by number of parallel strings. Found on panel datasheet under STC conditions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <InputField
          label=""
          value={inputs.arrayIsc}
          onChange={(value) => setInputs({ arrayIsc: Number(value) })}
          type="number"
          unit="A"
          placeholder="9"
          step="0.1"
          validation={getFieldValidation('arrayIsc')}
          required
        />
        <p className="text-xs text-muted-foreground">
          Sum of parallel string currents
        </p>
      </div>

      {/* Battery Voltage */}
      <div className="space-y-2">
        <Label>
          Battery Bank Voltage
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Select
          value={inputs.batteryVoltage.toString()}
          onValueChange={(value) => setInputs({ batteryVoltage: Number(value) })}
        >
          <SelectTrigger className="h-12 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12V (Small systems)</SelectItem>
            <SelectItem value="24">24V (Medium systems)</SelectItem>
            <SelectItem value="48">48V (Large/Off-grid)</SelectItem>
            <SelectItem value="96">96V (Commercial)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Nominal voltage of your battery bank
        </p>
      </div>

      {/* Array Max Power */}
      <div className="space-y-2">
        <InputField
          label="Array Maximum Power"
          value={inputs.arrayMaxPower}
          onChange={(value) => setInputs({ arrayMaxPower: Number(value) })}
          type="number"
          unit="W"
          placeholder="1200"
          validation={getFieldValidation('arrayMaxPower')}
          required
        />
        <p className="text-xs text-muted-foreground">
          Total rated power of all panels (Pmax sum)
        </p>
      </div>

      {/* Optional: Min Temperature */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Minimum Expected Temperature</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Optional: Enter the coldest temperature your panels will experience.
                  V_oc increases in cold weather, requiring higher controller voltage rating.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <InputField
          label=""
          value={inputs.minTemperature ?? ''}
          onChange={(value) =>
            setInputs({ minTemperature: value ? Number(value) : undefined })
          }
          type="number"
          unit="°C"
          placeholder="-10"
          validation={getFieldValidation('minTemperature')}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to use STC (25°C) values
        </p>
      </div>

      {/* Optional: V_oc Temperature Coefficient */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>V_oc Temperature Coefficient</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Optional: Found on panel datasheet. Typical silicon panels: -0.3%/°C.
                  Enter as decimal (e.g., -0.003 for -0.3%/°C).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <InputField
          label=""
          value={inputs.vocTempCoefficient ?? ''}
          onChange={(value) =>
            setInputs({ vocTempCoefficient: value ? Number(value) : undefined })
          }
          type="number"
          unit="%/°C"
          placeholder="-0.003"
          step="0.001"
          validation={getFieldValidation('vocTempCoefficient')}
        />
        <p className="text-xs text-muted-foreground">
          Default: -0.003 (-0.3%/°C for silicon)
        </p>
      </div>
    </div>
  )
}
