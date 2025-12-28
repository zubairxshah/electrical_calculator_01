/**
 * Breaker Sizing Tool - Main Client Component
 *
 * Integrates all breaker calculator components into a cohesive interface:
 * - Input form for circuit configuration
 * - Calculation trigger with debouncing
 * - Results display
 * - Optional derating sidebar
 * - Optional history sidebar
 * - Standard toggle (NEC/IEC)
 * - PDF export functionality
 *
 * @module BreakerSizingTool
 */

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useBreakerStore } from '@/stores/useBreakerStore';
import { BreakerInputForm } from '@/components/breaker/BreakerInputForm';
import { BreakerResults } from '@/components/breaker/BreakerResults';
import { DeratingSidebar } from '@/components/breaker/DeratingSidebar';
import { HistorySidebar } from '@/components/breaker/HistorySidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calculator, Settings, FileText, History } from 'lucide-react';
import { calculateBreakerSizing } from '@/lib/calculations/breaker/breakerCalculator';
import { downloadBreakerPDF } from '@/lib/pdfGenerator.breaker';
import type { BreakerCalculationInput } from '@/lib/calculations/breaker/breakerCalculator';

/**
 * BreakerSizingTool Component
 *
 * Main client component for breaker sizing calculator
 */
export function BreakerSizingTool() {
  // Zustand store
  const store = useBreakerStore();

  // Local state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Sidebar state
  const [showHistory, setShowHistory] = useState(false);

  // Debounce timer ref (T030: 300ms debouncing)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform calculation
   */
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setCalculationError(null);

    try {
      console.log('[BreakerSizingTool] Starting calculation...');

      // Build calculation input from store state
      const input: BreakerCalculationInput = {
        circuit: {
          standard: store.standard,
          voltage: store.voltage,
          phase: store.phase,
          loadMode: store.loadMode,
          loadValue: store.loadValue,
          powerFactor: store.powerFactor,
          unitSystem: store.unitSystem,
        },
        environment:
          store.ambientTemperature || store.groupedCables || store.installationMethod
            ? {
                ambientTemperature: store.ambientTemperature,
                groupedCables: store.groupedCables,
                installationMethod: store.installationMethod,
                circuitDistance: store.circuitDistance,
                conductorMaterial: store.conductorMaterial,
                conductorSize: store.conductorSizeValue
                  ? {
                      value: store.conductorSizeValue,
                      unit: store.conductorSizeUnit!,
                    }
                  : undefined,
              }
            : undefined,
        shortCircuitCurrentKA: store.shortCircuitCurrentKA,
        loadType: store.loadType,
      };

      // Perform calculation
      const results = await calculateBreakerSizing(input);

      // Update store with results
      useBreakerStore.setState({ results });

      console.log('[BreakerSizingTool] Calculation complete');

      // Auto-save to history
      setTimeout(() => {
        store.saveToHistory();
      }, 500);
    } catch (error) {
      console.error('[BreakerSizingTool] Calculation failed:', error);
      setCalculationError(
        error instanceof Error ? error.message : 'Calculation failed. Please check your inputs.'
      );
    } finally {
      setIsCalculating(false);
    }
  }, [store]);

  /**
   * Handle PDF export
   */
  const handleExportPDF = useCallback(async () => {
    if (!store.results) {
      return;
    }

    setIsExportingPDF(true);
    try {
      console.log('[BreakerSizingTool] Generating PDF...');

      await downloadBreakerPDF({
        circuit: {
          standard: store.standard,
          voltage: store.voltage,
          phase: store.phase,
          loadMode: store.loadMode,
          loadValue: store.loadValue,
          powerFactor: store.powerFactor,
          unitSystem: store.unitSystem,
        },
        results: store.results,
        project: store.projectName || store.engineerName || store.projectLocation
          ? {
              projectName: store.projectName,
              projectLocation: store.projectLocation,
              engineerName: store.engineerName,
            }
          : undefined,
      });

      console.log('[BreakerSizingTool] PDF downloaded successfully');
    } catch (error) {
      console.error('[BreakerSizingTool] PDF export failed:', error);
      // Could add error handling UI here
    } finally {
      setIsExportingPDF(false);
    }
  }, [store]);

  /**
   * Debounced auto-calculation
   * T030: Auto-recalculate with 300ms debounce after input changes
   */
  const debouncedCalculate = useCallback(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 300ms
    debounceTimerRef.current = setTimeout(() => {
      handleCalculate();
    }, 300);
  }, [handleCalculate]);

  /**
   * Handle standard change (NEC ↔ IEC)
   * T031: Triggers immediate recalculation (target <500ms)
   */
  const handleStandardChange = useCallback(
    (newStandard: 'NEC' | 'IEC') => {
      const startTime = performance.now();
      console.log(`[BreakerSizingTool] Standard changed to ${newStandard}`);

      store.setStandard(newStandard);

      // If results exist, recalculate immediately (no debounce for standard toggle)
      if (store.results) {
        handleCalculate().then(() => {
          const elapsed = performance.now() - startTime;
          console.log(`[BreakerSizingTool] Standard toggle completed in ${elapsed.toFixed(2)}ms`);

          // Log performance warning if exceeds 500ms target
          if (elapsed > 500) {
            console.warn(`[BreakerSizingTool] Standard toggle took ${elapsed.toFixed(2)}ms (target: <500ms)`);
          }
        });
      }
    },
    [store, handleCalculate]
  );

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-6">
        {/* Input Form Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Circuit Configuration</h2>
              <div className="flex gap-2">
                {/* History Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
                {/* Advanced Settings Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => store.toggleDeratingSidebar()}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {store.showDeratingSidebar ? 'Hide' : 'Show'} Advanced
                </Button>
              </div>
            </div>

            <BreakerInputForm
              standard={store.standard}
              voltage={store.voltage}
              phase={store.phase}
              loadMode={store.loadMode}
              loadValue={store.loadValue}
              powerFactor={store.powerFactor}
              unitSystem={store.unitSystem}
              errors={{}}
              onStandardChange={handleStandardChange}
              onVoltageChange={store.setVoltage}
              onPhaseChange={store.setPhase}
              onLoadModeChange={store.setLoadMode}
              onLoadValueChange={store.setLoadValue}
              onPowerFactorChange={store.setPowerFactor}
              onUnitSystemChange={store.setUnitSystem}
              showAdvanced={true}
            />

            {/* Calculate Button */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="flex-1"
                size="lg"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-5 w-5" />
                    Calculate Breaker Size
                  </>
                )}
              </Button>

              {/* PDF Export Button */}
              {store.results && (
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  size="lg"
                >
                  {isExportingPDF ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>

            {/* Error Display */}
            {calculationError && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/50 rounded-md">
                <p className="text-sm text-destructive font-semibold">Calculation Error</p>
                <p className="text-sm text-destructive mt-1">{calculationError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Display */}
        {store.results && (
          <div>
            <BreakerResults
              results={store.results}
              showDetails={store.showCalculationDetails}
              onToggleDetails={store.toggleCalculationDetails}
            />
          </div>
        )}

        {/* Empty State */}
        {!store.results && !isCalculating && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Calculate</h3>
                <p className="text-muted-foreground">
                  Enter your circuit parameters and click "Calculate Breaker Size" to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar Area */}
      <div className="lg:col-span-1">
        {store.showDeratingSidebar && (
          <DeratingSidebar
            standard={store.standard}
            ambientTemperature={store.ambientTemperature}
            groupedCables={store.groupedCables}
            installationMethod={store.installationMethod}
            errors={{}}
            onTemperatureChange={store.setAmbientTemperature}
            onGroupedCablesChange={store.setGroupedCables}
            onInstallationMethodChange={store.setInstallationMethod}
            allowClear={true}
          />
        )}

        {/* Quick Reference Card */}
        {!store.showDeratingSidebar && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Quick Reference</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold">NEC Standard</p>
                  <p className="text-muted-foreground">
                    125% continuous load factor per Article 210.20(A)
                  </p>
                </div>
                <div>
                  <p className="font-semibold">IEC Standard</p>
                  <p className="text-muted-foreground">
                    Correction factors per IEC 60364-5-52
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Common Voltages</p>
                  <p className="text-muted-foreground">
                    NEC: 120V, 208V, 240V, 480V<br />
                    IEC: 230V, 400V, 690V
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Power Factor</p>
                  <p className="text-muted-foreground">
                    Typical: 0.8-0.95 (industrial)<br />
                    Unity: 1.0 (resistive loads)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>

      {/* History Sidebar - overlay, not part of grid */}
      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
