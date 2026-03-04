/**
 * Motor Breaker Input Form Component
 *
 * Conditional form sections based on load type + standard combination.
 * Pure presentational - receives values and handlers as props.
 *
 * @module MotorBreakerInputForm
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { LoadTypeSelector } from './LoadTypeSelector';
import { getAllMotorProtectionDevices } from '@/lib/calculations/motor-breaker/motorSizing';
import { getUtilizationCategoriesBySystem } from '@/lib/calculations/motor-breaker/iecUtilizationCategories';
import type {
  MotorBreakerLoadType,
  SystemType,
  MotorBreakerInputMode,
  PowerUnit,
  NECMotorProtectionDevice,
  IECUtilizationCategory,
  InstallationMethod,
} from '@/types/motor-breaker-calculator';

interface MotorBreakerInputFormProps {
  // Core
  standard: 'NEC' | 'IEC';
  systemType: SystemType;
  loadType: MotorBreakerLoadType;

  // Electrical
  voltage: number;
  inputMode: MotorBreakerInputMode;
  powerValue: number;
  powerUnit: PowerUnit;
  fla: number;
  powerFactor: number;

  // Motor NEC
  protectionDevice: NECMotorProtectionDevice;

  // Motor IEC
  utilizationCategory: IECUtilizationCategory;

  // HVAC
  mca: number;
  mop: number;

  // Environmental
  showEnvironmental: boolean;
  ambientTemperature?: number;
  groupedCables?: number;
  installationMethod?: InstallationMethod;

  // Errors
  errors: Record<string, string>;

  // Handlers
  onStandardChange: (standard: 'NEC' | 'IEC') => void;
  onSystemTypeChange: (systemType: SystemType) => void;
  onLoadTypeChange: (loadType: MotorBreakerLoadType) => void;
  onVoltageChange: (voltage: number) => void;
  onInputModeChange: (mode: MotorBreakerInputMode) => void;
  onPowerValueChange: (value: number) => void;
  onPowerUnitChange: (unit: PowerUnit) => void;
  onFLAChange: (fla: number) => void;
  onPowerFactorChange: (pf: number) => void;
  onProtectionDeviceChange: (device: NECMotorProtectionDevice) => void;
  onUtilizationCategoryChange: (cat: IECUtilizationCategory) => void;
  onMCAChange: (mca: number) => void;
  onMOPChange: (mop: number) => void;
  onToggleEnvironmental: () => void;
  onAmbientTemperatureChange: (temp: number | undefined) => void;
  onGroupedCablesChange: (count: number | undefined) => void;
  onInstallationMethodChange: (method: InstallationMethod | undefined) => void;
}

export function MotorBreakerInputForm(props: MotorBreakerInputFormProps) {
  const {
    standard, systemType, loadType,
    voltage, inputMode, powerValue, powerUnit, fla, powerFactor,
    protectionDevice, utilizationCategory,
    mca, mop,
    showEnvironmental, ambientTemperature, groupedCables, installationMethod,
    errors,
    onStandardChange, onSystemTypeChange, onLoadTypeChange,
    onVoltageChange, onInputModeChange, onPowerValueChange, onPowerUnitChange,
    onFLAChange, onPowerFactorChange,
    onProtectionDeviceChange, onUtilizationCategoryChange,
    onMCAChange, onMOPChange,
    onToggleEnvironmental, onAmbientTemperatureChange, onGroupedCablesChange, onInstallationMethodChange,
  } = props;

  const isHVACNEC = loadType === 'hvac' && standard === 'NEC';
  const isMotorNEC = loadType === 'motor' && standard === 'NEC';
  const isMotorIEC = (loadType === 'motor' || loadType === 'hvac') && standard === 'IEC';
  const isDC = systemType === 'dc';
  const showPowerFactor = !isDC && inputMode === 'power' && !isHVACNEC;

  // Filter utilization categories by AC/DC
  const iecSystemFilter = isDC ? 'dc' : 'ac';
  const availableCategories = getUtilizationCategoriesBySystem(iecSystemFilter);

  return (
    <div className="space-y-6">
      {/* Standard Toggle */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Standard</Label>
        <Tabs value={standard} onValueChange={(v) => onStandardChange(v as 'NEC' | 'IEC')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="NEC">NEC (North America)</TabsTrigger>
            <TabsTrigger value="IEC">IEC (International)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* System Type */}
      <div>
        <Label className="text-sm font-medium mb-2 block">System Type</Label>
        <Select value={systemType} onValueChange={(v) => onSystemTypeChange(v as SystemType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="three-phase-ac">Three-Phase AC</SelectItem>
            <SelectItem value="single-phase-ac">Single-Phase AC</SelectItem>
            <SelectItem value="dc">DC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Load Type */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Load Type</Label>
        <LoadTypeSelector value={loadType} onChange={onLoadTypeChange} />
      </div>

      <Separator />

      {/* HVAC NEC: MCA/MOP fields */}
      {isHVACNEC && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Enter MCA and MOP values from the equipment nameplate per NEC 440.
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Voltage (V)</Label>
            <Input
              type="number"
              value={voltage}
              onChange={(e) => onVoltageChange(Number(e.target.value))}
              min={12}
              max={1000}
            />
            {errors.voltage && <p className="text-sm text-destructive mt-1">{errors.voltage}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">MCA (A)</Label>
              <Input
                type="number"
                value={mca}
                onChange={(e) => onMCAChange(Number(e.target.value))}
                min={0}
                step={0.1}
                placeholder="Minimum Circuit Ampacity"
              />
              {errors.mca && <p className="text-sm text-destructive mt-1">{errors.mca}</p>}
            </div>
            <div>
              <Label className="text-sm font-medium">MOP (A)</Label>
              <Input
                type="number"
                value={mop}
                onChange={(e) => onMOPChange(Number(e.target.value))}
                min={0}
                step={1}
                placeholder="Max Overcurrent Protection"
              />
              {errors.mop && <p className="text-sm text-destructive mt-1">{errors.mop}</p>}
            </div>
          </div>
        </div>
      )}

      {/* General & Motor: Voltage, Power/FLA, PF fields */}
      {!isHVACNEC && (
        <div className="space-y-4">
          {/* Voltage */}
          <div>
            <Label className="text-sm font-medium">Voltage (V)</Label>
            <Input
              type="number"
              value={voltage}
              onChange={(e) => onVoltageChange(Number(e.target.value))}
              min={12}
              max={1000}
            />
            {errors.voltage && <p className="text-sm text-destructive mt-1">{errors.voltage}</p>}
          </div>

          {/* Input Mode Toggle */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Input Mode</Label>
            <Tabs value={inputMode} onValueChange={(v) => onInputModeChange(v as MotorBreakerInputMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="power">Power</TabsTrigger>
                <TabsTrigger value="fla">Direct FLA</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Power Input */}
          {inputMode === 'power' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Power Value</Label>
                  <Input
                    type="number"
                    value={powerValue}
                    onChange={(e) => onPowerValueChange(Number(e.target.value))}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div className="w-24">
                  <Label className="text-sm font-medium">Unit</Label>
                  <Select value={powerUnit} onValueChange={(v) => onPowerUnitChange(v as PowerUnit)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kw">kW</SelectItem>
                      <SelectItem value="hp">HP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.powerValue && <p className="text-sm text-destructive">{errors.powerValue}</p>}
            </div>
          )}

          {/* FLA Input */}
          {inputMode === 'fla' && (
            <div>
              <Label className="text-sm font-medium">Full-Load Amps (FLA)</Label>
              <Input
                type="number"
                value={fla}
                onChange={(e) => onFLAChange(Number(e.target.value))}
                min={0}
                step={0.1}
                placeholder="Enter motor FLA from nameplate"
              />
              {errors.fla && <p className="text-sm text-destructive mt-1">{errors.fla}</p>}
            </div>
          )}

          {/* Power Factor */}
          {showPowerFactor && (
            <div>
              <div className="flex justify-between">
                <Label className="text-sm font-medium">Power Factor</Label>
                <span className="text-sm text-muted-foreground">{powerFactor.toFixed(2)}</span>
              </div>
              <Slider
                value={[powerFactor]}
                onValueChange={([v]) => onPowerFactorChange(v)}
                min={0.5}
                max={1.0}
                step={0.01}
                className="mt-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Motor NEC: Protection Device */}
      {isMotorNEC && (
        <div>
          <Label className="text-sm font-medium">Protection Device Type</Label>
          <Select
            value={protectionDevice}
            onValueChange={(v) => onProtectionDeviceChange(v as NECMotorProtectionDevice)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getAllMotorProtectionDevices().map((d) => (
                <SelectItem key={d.device} value={d.device}>
                  {d.displayName} ({(d.multiplier * 100).toFixed(0)}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Motor/HVAC IEC: Utilization Category */}
      {isMotorIEC && (
        <div>
          <Label className="text-sm font-medium">Utilization Category</Label>
          <Select
            value={utilizationCategory}
            onValueChange={(v) => onUtilizationCategoryChange(v as IECUtilizationCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((cat) => (
                <SelectItem key={cat.category} value={cat.category}>
                  {cat.category} — {cat.description} ({(cat.multiplier * 100).toFixed(0)}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Environmental Section (collapsible) */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleEnvironmental}
          className="w-full justify-between"
        >
          <span>Environmental Factors</span>
          {showEnvironmental ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showEnvironmental && (
          <div className="space-y-4 mt-3 p-3 border rounded-md">
            <div>
              <Label className="text-sm font-medium">Ambient Temperature (°C)</Label>
              <Input
                type="number"
                value={ambientTemperature ?? ''}
                onChange={(e) => onAmbientTemperatureChange(
                  e.target.value ? Number(e.target.value) : undefined
                )}
                min={-40}
                max={70}
                placeholder="30°C default"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Grouped Cables</Label>
              <Input
                type="number"
                value={groupedCables ?? ''}
                onChange={(e) => onGroupedCablesChange(
                  e.target.value ? Number(e.target.value) : undefined
                )}
                min={1}
                max={20}
                placeholder="Number of cables"
              />
            </div>
            {standard === 'IEC' && (
              <div>
                <Label className="text-sm font-medium">Installation Method</Label>
                <Select
                  value={installationMethod ?? ''}
                  onValueChange={(v) => onInstallationMethodChange(
                    v ? v as InstallationMethod : undefined
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Single cable in free air</SelectItem>
                    <SelectItem value="B1">B1 - Multi-cable in conduit (free air)</SelectItem>
                    <SelectItem value="B2">B2 - Multi-cable in conduit (wall)</SelectItem>
                    <SelectItem value="C">C - Multi-cable in conduit (ground)</SelectItem>
                    <SelectItem value="D">D - Multi-cable in cable tray</SelectItem>
                    <SelectItem value="E">E - Earthed metallic conduit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
