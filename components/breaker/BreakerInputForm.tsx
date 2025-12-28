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
    errors = {},
    onStandardChange,
    onVoltageChange,
    onPhaseChange,
    onLoadModeChange,
    onLoadValueChange,
    onPowerFactorChange,
    onUnitSystemChange,
    showAdvanced = false,
  } = props;

  /**
   * Get standard voltage suggestions for current standard
   */
  const voltageOptions = STANDARD_VOLTAGES[standard];

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
