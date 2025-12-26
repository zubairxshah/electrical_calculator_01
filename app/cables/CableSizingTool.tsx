'use client';

/**
 * Cable Sizing Tool Client Component
 * Feature: 001-electromate-engineering-app
 * Task: T093 - Create app/cables/CableSizingTool.tsx
 *
 * Interactive cable sizing calculator with voltage drop calculation,
 * derating factors, and NEC/IEC compliance checking.
 *
 * @see FR-009: Voltage drop >3% red highlighting
 * @see FR-007a: Comprehensive voltage range support
 */

import { useCallback, useEffect, useState } from 'react';
import { useCableStore } from '@/stores/useCableStore';
import { validateCableInputs, SYSTEM_VOLTAGES, formatVoltage } from '@/lib/validation/cableValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { PDFDownloadButton } from '@/components/shared/PDFDownloadButton';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  ThermometerSun,
  Cable,
  RefreshCw,
} from 'lucide-react';

export function CableSizingTool() {
  const {
    systemVoltage,
    current,
    length,
    conductorMaterial,
    installationMethod,
    ambientTemp,
    circuitType,
    numberOfConductors,
    insulationRating,
    standard,
    result,
    isCalculating,
    setSystemVoltage,
    setCurrent,
    setLength,
    setConductorMaterial,
    setInstallationMethod,
    setAmbientTemp,
    setCircuitType,
    setNumberOfConductors,
    setInsulationRating,
    setStandard,
    calculate,
    reset,
  } = useCableStore();

  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateCableInputs> | null>(null);

  // Validate inputs on change
  useEffect(() => {
    const result = validateCableInputs({
      systemVoltage,
      current,
      length,
      conductorMaterial,
      installationMethod,
      ambientTemp,
      circuitType,
      numberOfConductors,
      insulationRating,
      standard,
    });
    setValidationResult(result);
  }, [
    systemVoltage,
    current,
    length,
    conductorMaterial,
    installationMethod,
    ambientTemp,
    circuitType,
    numberOfConductors,
    insulationRating,
    standard,
  ]);

  const handleCalculate = useCallback(() => {
    calculate();
  }, [calculate]);

  const isViolation = result?.voltageDrop?.isViolation ?? false;
  const isDangerous = result?.voltageDrop?.isDangerous ?? false;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <div className="space-y-6">
        {/* Circuit Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Circuit Parameters
            </CardTitle>
            <CardDescription>
              Define circuit voltage, current, and length
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Standard Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="standard">Standard</Label>
                <Select
                  value={standard}
                  onValueChange={(value) => setStandard(value as 'IEC' | 'NEC')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select standard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IEC">IEC (International)</SelectItem>
                    <SelectItem value="NEC">NEC (North America)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="circuit-type">Circuit Type</Label>
                <Select
                  value={circuitType}
                  onValueChange={(value) => setCircuitType(value as 'single-phase' | 'three-phase')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select circuit type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-phase">Single-Phase</SelectItem>
                    <SelectItem value="three-phase">Three-Phase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Voltage Selection */}
            <div className="space-y-2">
              <Label htmlFor="voltage">System Voltage</Label>
              <Select
                value={String(systemVoltage)}
                onValueChange={(value) => setSystemVoltage(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select voltage" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SYSTEM_VOLTAGES).map(([category, voltages]) => (
                    <SelectGroup key={category}>
                      <SelectLabel>{category}</SelectLabel>
                      {voltages.map((v) => (
                        <SelectItem key={v} value={String(v)}>
                          {formatVoltage(v)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current and Length */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current">Current (A)</Label>
                <Input
                  id="current"
                  type="number"
                  min="0.1"
                  max="10000"
                  step="0.1"
                  value={current}
                  onChange={(e) => setCurrent(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">
                  Length ({standard === 'IEC' ? 'meters' : 'feet'})
                </Label>
                <Input
                  id="length"
                  type="number"
                  min="0.1"
                  max="10000"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conductor Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cable className="h-5 w-5" />
              Conductor Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="conductor-material">Conductor Material</Label>
                <Select
                  value={conductorMaterial}
                  onValueChange={(value) => setConductorMaterial(value as 'copper' | 'aluminum')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="copper">Copper</SelectItem>
                    <SelectItem value="aluminum">Aluminum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="installation-method">Installation Method</Label>
                <Select
                  value={installationMethod}
                  onValueChange={(value) =>
                    setInstallationMethod(
                      value as 'conduit' | 'cable-tray' | 'direct-burial' | 'free-air'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conduit">Conduit</SelectItem>
                    <SelectItem value="cable-tray">Cable Tray</SelectItem>
                    <SelectItem value="direct-burial">Direct Burial</SelectItem>
                    <SelectItem value="free-air">Free Air</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="insulation-rating">Insulation Rating (°C)</Label>
                <Select
                  value={String(insulationRating)}
                  onValueChange={(value) => setInsulationRating(parseInt(value) as 60 | 70 | 75 | 90)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60°C</SelectItem>
                    <SelectItem value="70">70°C (PVC)</SelectItem>
                    <SelectItem value="75">75°C</SelectItem>
                    <SelectItem value="90">90°C (XLPE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conductors">Number of Conductors</Label>
                <Input
                  id="conductors"
                  type="number"
                  min="1"
                  max="50"
                  value={numberOfConductors}
                  onChange={(e) => setNumberOfConductors(parseInt(e.target.value) || 3)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThermometerSun className="h-5 w-5" />
              Environmental Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ambient-temp">Ambient Temperature (°C)</Label>
              <Input
                id="ambient-temp"
                type="number"
                min="-40"
                max="90"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(parseFloat(e.target.value) || 30)}
              />
              <p className="text-xs text-gray-500">
                Base reference: 30°C per {standard === 'NEC' ? 'NEC 310.15(B)(2)(a)' : 'IEC 60364-5-52'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleCalculate}
                disabled={isCalculating}
              >
                <Calculator className="mr-2 h-5 w-5" />
                {isCalculating ? 'Calculating...' : 'Calculate Cable Size'}
              </Button>
              <Button variant="outline" size="lg" onClick={reset}>
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {/* Validation Warnings */}
        {validationResult && validationResult.warnings.length > 0 && (
          <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-disc pl-4 space-y-1 text-sm">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index}>
                    {warning.message}
                    {warning.standardReference && (
                      <span className="text-gray-500"> ({warning.standardReference})</span>
                    )}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Card */}
        {result && (
          <Card
            className={
              isDangerous
                ? 'border-red-500 bg-red-50 dark:border-red-800 dark:bg-red-950'
                : isViolation
                ? 'border-orange-500 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
                : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
            }
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-2 ${
                  isDangerous
                    ? 'text-red-700 dark:text-red-300'
                    : isViolation
                    ? 'text-orange-700 dark:text-orange-300'
                    : 'text-green-700 dark:text-green-300'
                }`}
              >
                {isDangerous ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : isViolation ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Cable Sizing Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recommended Size */}
              <div
                className={`rounded-lg p-4 ${
                  isDangerous
                    ? 'bg-red-100 dark:bg-red-900'
                    : isViolation
                    ? 'bg-orange-100 dark:bg-orange-900'
                    : 'bg-white dark:bg-gray-900'
                }`}
              >
                <p className="text-sm text-gray-500">Recommended Cable Size</p>
                <p
                  className={`text-3xl font-bold ${
                    isDangerous
                      ? 'text-red-600 dark:text-red-400'
                      : isViolation
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {result.recommendedSize.formattedSize}
                </p>
              </div>

              {/* Voltage Drop */}
              <div className="space-y-2">
                <h4 className="font-medium">Voltage Drop</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Voltage Drop:</span>
                  <span className="font-medium">{result.voltageDrop.voltageDrop.toFixed(2)} V</span>
                  <span className="text-gray-500">Percentage:</span>
                  <span
                    className={`font-bold ${
                      isDangerous
                        ? 'text-red-600'
                        : isViolation
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {result.voltageDrop.voltageDropPercent.toFixed(2)}%
                  </span>
                  <span className="text-gray-500">Status:</span>
                  <span>
                    {isDangerous ? (
                      <span className="text-red-600 font-bold">DANGEROUS (&gt;10%)</span>
                    ) : isViolation ? (
                      <span className="text-orange-600 font-bold">VIOLATION (&gt;3%)</span>
                    ) : (
                      <span className="text-green-600 font-bold">OK (&le;3%)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Ampacity */}
              <div className="space-y-2">
                <h4 className="font-medium">Ampacity</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Base Ampacity:</span>
                  <span className="font-medium">{result.ampacity.baseAmpacity} A</span>
                  <span className="text-gray-500">Derated Ampacity:</span>
                  <span className="font-medium">{result.ampacity.deratedAmpacity} A</span>
                  <span className="text-gray-500">Utilization:</span>
                  <span
                    className={`font-medium ${
                      result.ampacity.utilizationPercent > 100
                        ? 'text-red-600'
                        : result.ampacity.utilizationPercent > 80
                        ? 'text-orange-600'
                        : ''
                    }`}
                  >
                    {result.ampacity.utilizationPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Derating Factors */}
              <div className="space-y-2">
                <h4 className="font-medium">Derating Factors</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Temperature Factor:</span>
                  <span className="font-medium">{result.deratingFactors.temperatureFactor}</span>
                  <span className="text-gray-500">Grouping Factor:</span>
                  <span className="font-medium">{result.deratingFactors.groupingFactor}</span>
                  <span className="text-gray-500">Total Derating:</span>
                  <span className="font-medium">
                    {(result.deratingFactors.totalFactor * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-4 text-sm">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Standards Reference */}
              <div className="text-xs text-gray-500 border-t pt-2">
                <p>Standards: {result.standardReferences.join(', ')}</p>
                <p className="mt-1">
                  Using 3% limit (suitable for all circuits per NEC/IEC)
                </p>
              </div>

              {/* PDF Export */}
              <PDFDownloadButton
                calculation={{
                  id: `cable-${Date.now()}`,
                  userId: null,
                  calculationType: 'cable',
                  standards: standard,
                  inputs: {
                    systemVoltage,
                    current,
                    length,
                    conductorMaterial,
                    installationMethod,
                    ambientTemp,
                    circuitType,
                    numberOfConductors,
                    insulationRating,
                  },
                  results: result as unknown as Record<string, unknown>,
                  warnings: result.warnings.map((w) => ({
                    field: 'result',
                    message: w,
                    severity: 'warning' as const,
                  })),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }}
                standards={standard}
                filename={`cable-sizing-${Date.now()}.pdf`}
              />
            </CardContent>
          </Card>
        )}

        {/* Info Card (shown when no result) */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                <strong>1. Voltage Drop:</strong> Calculated using V_drop = I × L × R where R is
                the cable resistance from {standard === 'NEC' ? 'NEC Chapter 9 Table 8' : 'IEC 60364-5-52'}.
              </p>
              <p>
                <strong>2. Ampacity:</strong> Base ampacity from{' '}
                {standard === 'NEC' ? 'NEC Table 310.15(B)(16)' : 'IEC 60364-5-52 Table B.52.4'},
                adjusted by derating factors.
              </p>
              <p>
                <strong>3. Derating:</strong> Temperature and grouping factors per{' '}
                {standard === 'NEC' ? 'NEC 310.15(B)(2)(a) and 310.15(C)(1)' : 'IEC 60364-5-52 Tables B.52.14/B.52.17'}.
              </p>
              <p>
                <strong>4. Result:</strong> Smallest cable meeting both voltage drop (&le;3%)
                and ampacity requirements.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CableSizingTool;
