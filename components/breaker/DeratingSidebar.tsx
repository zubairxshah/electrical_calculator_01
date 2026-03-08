/**
 * Derating Sidebar Component
 *
 * Optional sidebar for environmental factor inputs:
 * - Ambient temperature
 * - Number of grouped cables
 * - Installation method (IEC only)
 *
 * Features:
 * - Collapsible sections
 * - Standard-specific fields (IEC installation method)
 * - Real-time validation
 * - Helpful tooltips explaining derating factors
 *
 * @module DeratingSidebar
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { InstallationMethod, InsulationRating, EnclosureType } from '@/types/breaker-calculator';

/**
 * DeratingSidebar Props
 */
export interface DeratingSidebarProps {
  standard: 'NEC' | 'IEC';

  // Environmental Factors
  ambientTemperature?: number;
  groupedCables?: number;
  installationMethod?: InstallationMethod;
  altitude?: number;
  insulationRating?: InsulationRating;
  enclosureType?: EnclosureType;
  harmonicDistortion?: number;

  // Validation Errors
  errors?: Record<string, string>;

  // Change Handlers
  onTemperatureChange: (temp: number | undefined) => void;
  onGroupedCablesChange: (count: number | undefined) => void;
  onInstallationMethodChange: (method: InstallationMethod | undefined) => void;
  onAltitudeChange: (altitude: number | undefined) => void;
  onInsulationRatingChange: (rating: InsulationRating | undefined) => void;
  onEnclosureTypeChange: (type: EnclosureType | undefined) => void;
  onHarmonicDistortionChange: (thd: number | undefined) => void;

  allowClear?: boolean;
}

/**
 * Installation Method Descriptions (IEC)
 */
const INSTALLATION_METHOD_DESCRIPTIONS: Record<InstallationMethod, string> = {
  A1: 'Single cable in free air (best cooling)',
  A2: 'Single cable on wall/support',
  B1: 'Multi-cable in conduit in free air',
  B2: 'Multi-cable in conduit on wall',
  C: 'Multi-cable in conduit in ground (limited cooling)',
  D: 'Multi-cable in cable tray',
  E: 'Multi-cable in earthed metallic conduit',
  F: 'Multi-cable in non-earthed metallic conduit',
  G: 'Multi-cable in open trays (good air circulation)',
};

/**
 * DeratingSidebar Component
 *
 * Optional sidebar for environmental factor configuration
 */
export function DeratingSidebar(props: DeratingSidebarProps) {
  const {
    standard,
    ambientTemperature,
    groupedCables,
    installationMethod,
    altitude,
    insulationRating,
    enclosureType,
    harmonicDistortion,
    errors = {},
    onTemperatureChange,
    onGroupedCablesChange,
    onInstallationMethodChange,
    onAltitudeChange,
    onInsulationRatingChange,
    onEnclosureTypeChange,
    onHarmonicDistortionChange,
    allowClear = true,
  } = props;

  /**
   * Handle temperature slider change
   */
  const handleTemperatureChange = (values: number[]) => {
    onTemperatureChange(values[0]);
  };

  /**
   * Handle grouped cables input
   */
  const handleGroupedCablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      onGroupedCablesChange(undefined);
    } else {
      onGroupedCablesChange(value);
    }
  };

  /**
   * Handle installation method selection
   */
  const handleInstallationMethodChange = (value: string) => {
    if (value === 'none') {
      onInstallationMethodChange(undefined);
    } else {
      onInstallationMethodChange(value as InstallationMethod);
    }
  };

  /**
   * Clear all derating factors
   */
  const handleClearAll = () => {
    onTemperatureChange(undefined);
    onGroupedCablesChange(undefined);
    onInstallationMethodChange(undefined);
    onAltitudeChange(undefined);
    onInsulationRatingChange(undefined);
    onEnclosureTypeChange(undefined);
    onHarmonicDistortionChange(undefined);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Environmental Factors</span>
          {allowClear && (
            <button
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All
            </button>
          )}
        </CardTitle>
        <CardDescription>Optional derating factors for cable ampacity adjustment</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ambient Temperature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="ambientTemp" className="flex items-center gap-2">
              Ambient Temperature
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Temperature correction factor applied per{' '}
                      {standard === 'NEC'
                        ? 'NEC Table 310.15(B)(2)(a)'
                        : 'IEC 60364-5-52 Table B.52.15'}
                      . Higher temperatures reduce cable current-carrying capacity.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            {ambientTemperature !== undefined && (
              <span className="text-sm font-medium">{ambientTemperature}°C</span>
            )}
          </div>

          <Slider
            id="ambientTemp"
            min={-40}
            max={70}
            step={5}
            value={ambientTemperature !== undefined ? [ambientTemperature] : [30]}
            onValueChange={handleTemperatureChange}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-40°C</span>
            <span>30°C (Ref)</span>
            <span>70°C</span>
          </div>

          {ambientTemperature !== undefined && ambientTemperature > 60 && (
            <p className="text-xs text-yellow-600">
              ⚠️ Extreme temperature. Special equipment may be required.
            </p>
          )}

          {errors.ambientTemperature && (
            <p className="text-sm text-destructive">{errors.ambientTemperature}</p>
          )}
        </div>

        <Separator />

        {/* Grouped Cables */}
        <div className="space-y-3">
          <Label htmlFor="groupedCables" className="flex items-center gap-2">
            Grouped Cables
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Number of current-carrying conductors in same conduit/raceway. Grouping factor
                    applied per{' '}
                    {standard === 'NEC'
                      ? 'NEC Table 310.15(C)(1)'
                      : 'IEC 60364-5-52 Table B.52.17'}
                    . More cables = higher heat retention = lower capacity.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          <Input
            id="groupedCables"
            type="number"
            value={groupedCables ?? ''}
            onChange={handleGroupedCablesChange}
            placeholder="Enter number (1-100)"
            min={1}
            max={100}
            step={1}
          />

          {groupedCables !== undefined && groupedCables > 20 && (
            <p className="text-xs text-blue-600">
              ℹ️ More than 20 cables: Derating factor {standard === 'NEC' ? '0.35' : '0.40'}
            </p>
          )}

          {errors.groupedCables && (
            <p className="text-sm text-destructive">{errors.groupedCables}</p>
          )}
        </div>

        {/* Installation Method (IEC Only) */}
        {standard === 'IEC' && (
          <>
            <Separator />

            <div className="space-y-3">
              <Label htmlFor="installationMethod" className="flex items-center gap-2">
                Installation Method
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Installation configuration affects heat dissipation (Cc factor per IEC
                        60364-5-52 Table B.52.5-B.52.7). Free air = best cooling, underground =
                        limited cooling.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>

              <Select
                value={installationMethod || 'none'}
                onValueChange={handleInstallationMethodChange}
              >
                <SelectTrigger id="installationMethod">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (not specified)</SelectItem>
                  {(Object.keys(INSTALLATION_METHOD_DESCRIPTIONS) as InstallationMethod[]).map(
                    (method) => (
                      <SelectItem key={method} value={method}>
                        Method {method} - {INSTALLATION_METHOD_DESCRIPTIONS[method]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              {errors.installationMethod && (
                <p className="text-sm text-destructive">{errors.installationMethod}</p>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Altitude */}
        <div className="space-y-3">
          <Label htmlFor="altitude" className="flex items-center gap-2">
            Altitude (m)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Above 1000m (3300ft), reduced air density decreases cooling capacity.
                    Per {standard === 'NEC' ? 'NEC 110.40' : 'IEC 60947-1 Annex B'}.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="altitude"
            type="number"
            value={altitude ?? ''}
            onChange={(e) => onAltitudeChange(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="0 (sea level)"
            min={0}
            max={5000}
            step={100}
          />
          {altitude !== undefined && altitude > 1000 && (
            <p className="text-xs text-yellow-600">
              ⚠️ Altitude &gt;1000m: derating factor will be applied
            </p>
          )}
        </div>

        <Separator />

        {/* Insulation Rating */}
        <div className="space-y-3">
          <Label htmlFor="insulationRating" className="flex items-center gap-2">
            Cable Insulation Rating
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Insulation temperature rating affects temperature derating factors.
                    Higher rating = less derating at elevated temperatures.
                    Note: termination temperature (often 60°C or 75°C) may limit actual capacity.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select
            value={insulationRating?.toString() ?? 'auto'}
            onValueChange={(val) => onInsulationRatingChange(val === 'auto' ? undefined : (parseInt(val) as 60 | 75 | 90))}
          >
            <SelectTrigger id="insulationRating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (90°C default)</SelectItem>
              <SelectItem value="60">60°C (TW, UF)</SelectItem>
              <SelectItem value="75">75°C (THW, THWN, XHHW)</SelectItem>
              <SelectItem value="90">90°C (THWN-2, XHHW-2, XLPE)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Enclosure Type */}
        <div className="space-y-3">
          <Label htmlFor="enclosureType" className="flex items-center gap-2">
            Enclosure Type
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Enclosed panels have higher internal temperature than ambient.
                    Temperature rise is added to ambient for derating calculation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select
            value={enclosureType ?? 'none'}
            onValueChange={(val) => onEnclosureTypeChange(val === 'none' ? undefined : (val as any))}
          >
            <SelectTrigger id="enclosureType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Open / Not Enclosed</SelectItem>
              <SelectItem value="NEMA-1">NEMA 1 (Indoor, +10°C)</SelectItem>
              <SelectItem value="NEMA-3R">NEMA 3R (Outdoor rain-tight, +10°C)</SelectItem>
              <SelectItem value="NEMA-4">NEMA 4 (Watertight, +15°C)</SelectItem>
              <SelectItem value="NEMA-4X">NEMA 4X (Corrosion-resistant, +15°C)</SelectItem>
              <SelectItem value="NEMA-12">NEMA 12 (Industrial dust-tight, +15°C)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Harmonic Distortion */}
        <div className="space-y-3">
          <Label htmlFor="harmonicDistortion" className="flex items-center gap-2">
            Harmonic Distortion (THD %)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Total Harmonic Distortion from non-linear loads (VFDs, LEDs, computers).
                    High THD causes additional heating and requires neutral oversizing per NEC 210.4(D).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="harmonicDistortion"
            type="number"
            value={harmonicDistortion ?? ''}
            onChange={(e) => onHarmonicDistortionChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0 (no harmonics)"
            min={0}
            max={50}
            step={1}
          />
          {harmonicDistortion !== undefined && harmonicDistortion > 15 && (
            <p className="text-xs text-yellow-600">
              ⚠️ THD &gt;15%: neutral oversizing and detuned filters recommended
            </p>
          )}
        </div>

        {/* Derating Summary (if any factors applied) */}
        {(ambientTemperature !== undefined ||
          groupedCables !== undefined ||
          installationMethod !== undefined ||
          altitude !== undefined ||
          enclosureType !== undefined ||
          harmonicDistortion !== undefined) && (
          <>
            <Separator />
            <div className="p-3 bg-muted/50 rounded-md space-y-2">
              <p className="text-xs font-semibold">Applied Derating Factors:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {ambientTemperature !== undefined && (
                  <li>• Temperature: {ambientTemperature}°C (Ca factor will be applied)</li>
                )}
                {groupedCables !== undefined && (
                  <li>
                    • Grouping: {groupedCables} cable{groupedCables > 1 ? 's' : ''} (Cg factor
                    will be applied)
                  </li>
                )}
                {installationMethod !== undefined && (
                  <li>• Installation: Method {installationMethod} (Cc factor will be applied)</li>
                )}
                {altitude !== undefined && altitude > 1000 && (
                  <li>• Altitude: {altitude}m (Ca factor will be applied)</li>
                )}
                {enclosureType !== undefined && (
                  <li>• Enclosure: {enclosureType} (temperature rise added)</li>
                )}
                {harmonicDistortion !== undefined && harmonicDistortion > 5 && (
                  <li>• Harmonics: {harmonicDistortion}% THD (Ch factor will be applied)</li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">How Derating Works:</p>
          <p>
            Environmental factors reduce cable current-carrying capacity. The breaker size must be
            increased to compensate:
          </p>
          <p className="italic">
            Adjusted Breaker = Load Current ÷ (Ca × Cg × Cc)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
