'use client';

/**
 * UPS Sizing Tool Client Component
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Interactive UPS sizing calculator with load list management
 */

import { useState, useCallback, useEffect } from 'react';
import { useUPSStore } from '@/stores/useUPSStore';
import { validateUPSInputs, createEmptyLoadItem, LOAD_PRESETS } from '@/lib/validation/upsValidation';
import type { LoadItem } from '@/lib/validation/upsValidation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PDFDownloadButton } from '@/components/shared/PDFDownloadButton';
import { Plus, Trash2, Calculator, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export function UPSSizingTool() {
  const {
    loads,
    growthMargin,
    result,
    addLoad,
    updateLoad,
    removeLoad,
    clearLoads,
    setGrowthMargin,
    calculate,
  } = useUPSStore();

  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateUPSInputs> | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newLoad, setNewLoad] = useState<LoadItem>(createEmptyLoadItem());

  // Validate inputs on change
  useEffect(() => {
    if (loads.length > 0) {
      const result = validateUPSInputs({ loads, growthMargin, targetRedundancy: 'none' });
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [loads, growthMargin]);

  const handleAddLoad = useCallback(() => {
    if (newLoad.name && (newLoad.powerVA || newLoad.powerWatts)) {
      addLoad(newLoad);
      setNewLoad(createEmptyLoadItem());
    }
  }, [newLoad, addLoad]);

  const handleAddPreset = useCallback((preset: typeof LOAD_PRESETS[number]) => {
    addLoad({
      name: preset.name,
      powerVA: preset.powerVA,
      powerWatts: null,
      powerFactor: 0.8,
      quantity: preset.quantity,
    });
    setShowPresets(false);
  }, [addLoad]);

  const handleCalculate = useCallback(() => {
    calculate();
  }, [calculate]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <div className="space-y-6">
        {/* Add Load Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Load
            </CardTitle>
            <CardDescription>
              Add equipment loads to calculate UPS requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="load-name">Equipment Name</Label>
                <Input
                  id="load-name"
                  value={newLoad.name}
                  onChange={(e) => setNewLoad({ ...newLoad, name: e.target.value })}
                  placeholder="e.g., Server Rack 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="load-quantity">Quantity</Label>
                <Input
                  id="load-quantity"
                  type="number"
                  min="1"
                  value={newLoad.quantity}
                  onChange={(e) => setNewLoad({ ...newLoad, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="load-va">Power (VA)</Label>
                <Input
                  id="load-va"
                  type="number"
                  min="1"
                  value={newLoad.powerVA ?? ''}
                  onChange={(e) => setNewLoad({
                    ...newLoad,
                    powerVA: e.target.value ? parseInt(e.target.value) : null,
                    powerWatts: null,
                  })}
                  placeholder="or enter Watts below"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="load-watts">Power (Watts)</Label>
                <Input
                  id="load-watts"
                  type="number"
                  min="1"
                  value={newLoad.powerWatts ?? ''}
                  onChange={(e) => setNewLoad({
                    ...newLoad,
                    powerWatts: e.target.value ? parseInt(e.target.value) : null,
                    powerVA: null,
                  })}
                  placeholder="or enter VA above"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="power-factor">Power Factor (0.1 - 1.0)</Label>
              <Input
                id="power-factor"
                type="number"
                min="0.1"
                max="1"
                step="0.05"
                value={newLoad.powerFactor}
                onChange={(e) => setNewLoad({ ...newLoad, powerFactor: parseFloat(e.target.value) || 0.8 })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddLoad} disabled={!newLoad.name || (!newLoad.powerVA && !newLoad.powerWatts)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Load
              </Button>
              <Button variant="outline" onClick={() => setShowPresets(!showPresets)}>
                Quick Presets
              </Button>
            </div>

            {showPresets && (
              <div className="grid gap-2 sm:grid-cols-2">
                {LOAD_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left"
                    onClick={() => handleAddPreset(preset)}
                  >
                    {preset.name} ({preset.powerVA} VA)
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Load List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Load List ({loads.length} items)</span>
              {loads.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearLoads}>
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loads.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No loads added yet. Add equipment above to begin sizing.
              </p>
            ) : (
              <div className="space-y-2">
                {loads.map((load, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{load.name}</p>
                      <p className="text-sm text-gray-500">
                        {load.quantity}x @ {load.powerVA ?? `${load.powerWatts}W (PF ${load.powerFactor})`}
                        {load.powerVA && ` VA`}
                        {' = '}
                        {((load.powerVA ?? (load.powerWatts ?? 0) / (load.powerFactor ?? 0.8)) * load.quantity).toLocaleString()} VA total
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLoad(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sizing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="growth-margin">Growth Margin (%)</Label>
              <Select
                value={String(growthMargin * 100)}
                onValueChange={(value) => setGrowthMargin(parseInt(value) / 100)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select growth margin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (No Growth)</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="25">25% (Recommended)</SelectItem>
                  <SelectItem value="30">30%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                IEEE 1100 recommends 20-30% growth margin for future expansion
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCalculate}
              disabled={loads.length === 0}
            >
              <Calculator className="mr-2 h-5 w-5" />
              Calculate UPS Size
            </Button>
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
              <ul className="mt-2 list-disc pl-4 space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Card */}
        {result && (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-5 w-5" />
                UPS Sizing Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recommended Size */}
              <div className="rounded-lg bg-white p-4 dark:bg-gray-900">
                <p className="text-sm text-gray-500">Recommended UPS Size</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {result.recommendedUPSKVA ? `${result.recommendedUPSKVA} kVA` : 'Exceeds Standard Sizes'}
                </p>
                {!result.recommendedUPSKVA && (
                  <p className="mt-2 text-sm text-yellow-600">
                    Consider parallel UPS configuration for loads exceeding 200 kVA
                  </p>
                )}
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Connected Load:</span>
                  <span className="font-medium">{result.totalLoadVA.toLocaleString()} VA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Number of Loads:</span>
                  <span className="font-medium">{result.numberOfLoads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Diversity Factor (IEEE 1100):</span>
                  <span className="font-medium">{result.diversityFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Effective Load:</span>
                  <span className="font-medium">{result.effectiveLoadVA.toLocaleString()} VA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Growth Margin:</span>
                  <span className="font-medium">{(result.growthMargin * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Required Capacity:</span>
                  <span className="font-bold">{result.loadWithGrowthKVA.toFixed(2)} kVA</span>
                </div>
              </div>

              {/* Diversity Explanation */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {result.diversityExplanation}
                </AlertDescription>
              </Alert>

              {/* PDF Export */}
              <PDFDownloadButton
                calculation={{
                  id: `ups-${Date.now()}`,
                  userId: null,
                  calculationType: 'ups',
                  standards: 'IEC',
                  inputs: { loads, growthMargin },
                  results: result as unknown as Record<string, unknown>,
                  warnings: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }}
                standards="IEC"
                filename={`ups-sizing-${Date.now()}.pdf`}
              />
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
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
                <strong>1. Add Loads:</strong> Enter each piece of equipment with its power
                consumption in VA or Watts.
              </p>
              <p>
                <strong>2. Diversity Factor:</strong> IEEE 1100 diversity factors account for
                the fact that not all loads operate at peak simultaneously.
              </p>
              <p>
                <strong>3. Growth Margin:</strong> 25% growth margin recommended for future
                expansion without UPS upgrade.
              </p>
              <p>
                <strong>4. Recommendation:</strong> System recommends the smallest standard
                UPS size that meets your requirements.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
