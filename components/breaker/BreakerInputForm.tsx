/**
 * Breaker Input Form Component
 *
 * Reusable form component for collecting circuit configuration inputs
 * with real-time validation and standard-specific field adjustments.
 *
 * Features:
 * - Standard toggle (NEC/IEC) with immediate recalculation
 * - Voltage input with standard voltage suggestions
 * - Phase selection (single/three-phase)
 * - Load input (kW or Amps mode toggle)
 * - Power factor slider
 * - Unit system toggle (Metric/Imperial)
 * - Real-time validation with error display
 *
 * @module BreakerInputForm
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * BreakerInputForm Props
 */
export interface BreakerInputFormProps {
  // Circuit Configuration
  standard: 'NEC' | 'IEC';
  voltage: number;
  phase: 'single' | 'three';
  loadMode: 'kw' | 'amps';
  loadValue: number;
  powerFactor: number;
  unitSystem: 'metric' | 'imperial';

  // Voltage Drop (Optional)
  circuitDistance?: number;
  conductorMaterial?: 'copper' | 'aluminum';
  conductorSizeValue?: number;
  conductorSizeUnit?: 'AWG' | 'mm²';

  // Short Circuit (Optional)
  shortCircuitCurrentKA?: number;

  // Load Type (Optional)
  loadType?: 'resistive' | 'inductive' | 'mixed' | 'capacitive';

  // Validation Errors
  errors?: Record<string, string>;

  // Change Handlers
  onStandardChange: (standard: 'NEC' | 'IEC') => void;
  onVoltageChange: (voltage: number) => void;
  onPhaseChange: (phase: 'single' | 'three') => void;
  onLoadModeChange: (mode: 'kw' | 'amps') => void;
  onLoadValueChange: (value: number) => void;
  onPowerFactorChange: (pf: number) => void;
  onUnitSystemChange: (system: 'metric' | 'imperial') => void;

  // Voltage Drop Handlers
  onCircuitDistanceChange?: (distance: number | undefined) => void;
  onConductorMaterialChange?: (material: 'copper' | 'aluminum') => void;
  onConductorSizeChange?: (size: number | undefined) => void;

  // Short Circuit Handler
  onShortCircuitCurrentChange?: (current: number | undefined) => void;

  // Load Type Handler
  onLoadTypeChange?: (loadType: 'resistive' | 'inductive' | 'mixed' | 'capacitive' | undefined) => void;

  // Optional: Show/hide advanced options
  showAdvanced?: boolean;
}

/**
 * Standard voltage suggestions based on electrical standard
 */
const STANDARD_VOLTAGES: Record<'NEC' | 'IEC', number[]> = {
  NEC: [120, 208, 240, 277, 480],
  IEC: [230, 400, 690],
};

/**
 * Standard AWG cable sizes (imperial)
 */
const AWG_CABLE_SIZES: number[] = [14, 12, 10, 8, 6, 4, 2, 1, 0, 2/0, 3/0, 4/0];

/**
 * Standard mm² cable sizes (metric)
 */
const MM2_CABLE_SIZES: number[] = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

/**
 * Get cable size display string
 */
function getCableSizeDisplay(value: number | undefined, unit: 'AWG' | 'mm²'): string {
  if (value === undefined) return 'Select cable size';
  if (unit === 'AWG') {
    if (value < 0) {
      const awg = Math.abs(value);
      const gauge = awg === 0 ? '0' : `${awg}/0`;
      return `#${gauge} AWG`;
    }
    return `#${value} AWG`;
  }
  return `${value}mm²`;
}

/**
 * Load type descriptions
 */
const LOAD_TYPE_DESCRIPTIONS: Record<string, string> = {
  resistive: 'Heating, lighting, resistive loads - minimal inrush',
  inductive: 'Motors, transformers, inductive loads - high inrush current',
  mixed: 'Combination of loads - moderate inrush',
  capacitive: 'Capacitor banks, power factor correction - brief inrush',
};

/**
 * BreakerInputForm Component
 *
 * Primary input form for breaker sizing calculator
 */
export function BreakerInputForm(props: BreakerInputFormProps) {
  const {
    standard,
    voltage,
    phase,
    loadMode,
    loadValue,
    powerFactor,
    unitSystem,
    circuitDistance,
    conductorMaterial = 'copper',
    conductorSizeValue,
    conductorSizeUnit = 'AWG',
    shortCircuitCurrentKA,
    loadType,
    errors = {},
    onStandardChange,
    onVoltageChange,
    onPhaseChange,
    onLoadModeChange,
    onLoadValueChange,
    onPowerFactorChange,
    onUnitSystemChange,
    onCircuitDistanceChange,
    onConductorMaterialChange,
    onConductorSizeChange,
    onShortCircuitCurrentChange,
    onLoadTypeChange,
    showAdvanced = false,
  } = props;

  /**
   * Get standard voltage suggestions for current standard
   */
  const voltageOptions = STANDARD_VOLTAGES[standard];

  /**
   * Get cable size options based on unit system
   */
  const cableSizeOptions = unitSystem === 'imperial' ? AWG_CABLE_SIZES : MM2_CABLE_SIZES;

  /**
   * Handle voltage selection from dropdown
   */
  const handleVoltageSelect = (value: string) => {
    if (value === 'custom') return; // User will enter custom value
    onVoltageChange(parseInt(value, 10));
  };

  /**
   * Handle custom voltage input
   */
  const handleVoltageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onVoltageChange(value);
    }
  };

  /**
   * Handle load value input
   */
  const handleLoadValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onLoadValueChange(value);
    }
  };

  /**
   * Handle power factor slider
   */
  const handlePowerFactorChange = (values: number[]) => {
    onPowerFactorChange(values[0]);
  };

  return (
    <div className="space-y-6">
      {/* Standard Selection */}
      <div className="space-y-2">
        <Label htmlFor="standard">Electrical Standard</Label>
        <Tabs value={standard} onValueChange={(val) => onStandardChange(val as 'NEC' | 'IEC')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="NEC">NEC (USA/Canada)</TabsTrigger>
            <TabsTrigger value="IEC">IEC (International)</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">
          {standard === 'NEC'
            ? 'National Electrical Code (North America)'
            : 'International Electrotechnical Commission (Europe/Asia)'}
        </p>
      </div>

      {/* Voltage Selection */}
      <div className="space-y-2">
        <Label htmlFor="voltage">System Voltage (V)</Label>
        <div className="flex gap-2">
          <Select
            value={voltageOptions.includes(voltage) ? voltage.toString() : 'custom'}
            onValueChange={handleVoltageSelect}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select voltage" />
            </SelectTrigger>
            <SelectContent>
              {voltageOptions.map((v) => (
                <SelectItem key={v} value={v.toString()}>
                  {v}V {v === 240 ? '(Common Residential)' : v === 480 ? '(Commercial)' : ''}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom...</SelectItem>
            </SelectContent>
          </Select>
          <Input
            id="voltage"
            type="number"
            value={voltage}
            onChange={handleVoltageInput}
            min={100}
            max={1000}
            step={1}
            className="w-24"
            aria-label="Custom voltage"
          />
        </div>
        {errors.voltage && <p className="text-sm text-destructive">{errors.voltage}</p>}
      </div>

      {/* Phase Selection */}
      <div className="space-y-2">
        <Label htmlFor="phase">Phase Configuration</Label>
        <Select value={phase} onValueChange={(val) => onPhaseChange(val as 'single' | 'three')}>
          <SelectTrigger id="phase">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single-Phase</SelectItem>
            <SelectItem value="three">Three-Phase</SelectItem>
          </SelectContent>
        </Select>
        {errors.phase && <p className="text-sm text-destructive">{errors.phase}</p>}
      </div>

      {/* Load Input with Mode Toggle */}
      <div className="space-y-2">
        <Label htmlFor="loadValue">Load</Label>
        <div className="flex gap-2">
          <Input
            id="loadValue"
            type="number"
            value={loadValue}
            onChange={handleLoadValueChange}
            min={0.01}
            max={10000}
            step={0.1}
            className="flex-1"
            aria-label="Load value"
          />
          <Tabs value={loadMode} onValueChange={(val) => onLoadModeChange(val as 'kw' | 'amps')}>
            <TabsList>
              <TabsTrigger value="kw">kW</TabsTrigger>
              <TabsTrigger value="amps">Amps</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <p className="text-xs text-muted-foreground">
          {loadMode === 'kw'
            ? 'Enter load power in kilowatts'
            : 'Enter load current in amperes'}
        </p>
        {errors.loadValue && <p className="text-sm text-destructive">{errors.loadValue}</p>}
      </div>

      {/* Power Factor Slider (only show if input mode is kW) */}
      {loadMode === 'kw' && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="powerFactor">Power Factor</Label>
            <span className="text-sm font-medium">{powerFactor.toFixed(2)}</span>
          </div>
          <Slider
            id="powerFactor"
            min={0.5}
            max={1.0}
            step={0.01}
            value={[powerFactor]}
            onValueChange={handlePowerFactorChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5 (Poor)</span>
            <span>0.8 (Typical)</span>
            <span>1.0 (Unity)</span>
          </div>
          {powerFactor < 0.7 && (
            <p className="text-xs text-yellow-600">
              ⚠️ Low power factor. Consider power factor correction to reduce current draw.
            </p>
          )}
          {errors.powerFactor && <p className="text-sm text-destructive">{errors.powerFactor}</p>}
        </div>
      )}

      {/* Unit System Toggle */}
      {showAdvanced && (
        <div className="space-y-2">
          <Label htmlFor="unitSystem">Unit System</Label>
          <Tabs
            value={unitSystem}
            onValueChange={(val) => onUnitSystemChange(val as 'metric' | 'imperial')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="metric">Metric (m, mm²)</TabsTrigger>
              <TabsTrigger value="imperial">Imperial (ft, AWG)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Voltage Drop Calculation Section */}
      {showAdvanced && (
        <div className="space-y-4 rounded-lg border border-muted p-4">
          <h3 className="text-sm font-semibold">Voltage Drop Analysis</h3>

          {/* Circuit Distance */}
          <div className="space-y-2">
            <Label htmlFor="circuitDistance">Circuit Distance ({unitSystem === 'imperial' ? 'ft' : 'm'})</Label>
            <Input
              id="circuitDistance"
              type="number"
              value={circuitDistance ?? ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                onCircuitDistanceChange?.(value);
              }}
              min={0}
              max={unitSystem === 'imperial' ? 500 : 150}
              step={1}
              placeholder="Enter distance"
              aria-label="Circuit distance"
            />
            <p className="text-xs text-muted-foreground">
              Distance from source to load (one-way)
            </p>
            {errors.circuitDistance && <p className="text-sm text-destructive">{errors.circuitDistance}</p>}
          </div>

          {/* Conductor Material */}
          <div className="space-y-2">
            <Label htmlFor="conductorMaterial">Conductor Material</Label>
            <Select
              value={conductorMaterial}
              onValueChange={(val) => onConductorMaterialChange?.(val as 'copper' | 'aluminum')}
            >
              <SelectTrigger id="conductorMaterial">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="copper">Copper (Better conductivity)</SelectItem>
                <SelectItem value="aluminum">Aluminum (Lower cost, lighter)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conductor Size */}
          <div className="space-y-2">
            <Label htmlFor="conductorSize">Conductor Size</Label>
            <div className="flex gap-2">
              <Select
                value={conductorSizeValue?.toString() ?? ''}
                onValueChange={(val) => onConductorSizeChange?.(val ? parseFloat(val) : undefined)}
              >
                <SelectTrigger id="conductorSize" className="flex-1">
                  <SelectValue placeholder="Select conductor size" />
                </SelectTrigger>
                <SelectContent>
                  {cableSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {getCableSizeDisplay(size, conductorSizeUnit)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {conductorSizeUnit === 'AWG' && (
                <div className="flex items-center px-3 py-2 border rounded-md bg-muted text-sm">
                  AWG
                </div>
              )}
              {conductorSizeUnit === 'mm²' && (
                <div className="flex items-center px-3 py-2 border rounded-md bg-muted text-sm">
                  mm²
                </div>
              )}
            </div>
            {errors.conductorSize && <p className="text-sm text-destructive">{errors.conductorSize}</p>}
          </div>
        </div>
      )}

      {/* Short Circuit Current Section */}
      {showAdvanced && (
        <div className="space-y-2">
          <Label htmlFor="shortCircuitCurrent">Available Short Circuit Current (kA) - Optional</Label>
          <Input
            id="shortCircuitCurrent"
            type="number"
            value={shortCircuitCurrentKA ?? ''}
            onChange={(e) => {
              const value = e.target.value ? parseFloat(e.target.value) : undefined;
              onShortCircuitCurrentChange?.(value);
            }}
            min={0.1}
            max={200}
            step={0.1}
            placeholder="Enter short circuit current (optional)"
            aria-label="Short circuit current"
          />
          <p className="text-xs text-muted-foreground">
            Available short circuit current at point of installation. Used to verify breaker interrupting capacity rating.
          </p>
          {errors.shortCircuitCurrent && <p className="text-sm text-destructive">{errors.shortCircuitCurrent}</p>}
        </div>
      )}

      {/* Load Type Section */}
      {showAdvanced && (
        <div className="space-y-2">
          <Label htmlFor="loadType">Load Type - Optional</Label>
          <Select
            value={loadType ?? 'mixed'}
            onValueChange={(val) =>
              onLoadTypeChange?.(val === 'none' ? undefined : (val as 'resistive' | 'inductive' | 'mixed' | 'capacitive'))
            }
          >
            <SelectTrigger id="loadType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mixed">Not specified (Default)</SelectItem>
              <SelectItem value="resistive">Resistive</SelectItem>
              <SelectItem value="inductive">Inductive</SelectItem>
              <SelectItem value="capacitive">Capacitive</SelectItem>
            </SelectContent>
          </Select>
          {loadType && LOAD_TYPE_DESCRIPTIONS[loadType] && (
            <p className="text-xs text-muted-foreground italic">{LOAD_TYPE_DESCRIPTIONS[loadType]}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Load type affects inrush current calculations and breaker trip characteristics.
          </p>
          {errors.loadType && <p className="text-sm text-destructive">{errors.loadType}</p>}
        </div>
      )}

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <h4 className="text-sm font-semibold text-destructive mb-2">Validation Errors:</h4>
          <ul className="text-sm text-destructive space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>• {message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
