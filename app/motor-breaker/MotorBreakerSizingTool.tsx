/**
 * Motor & HVAC Breaker Sizing Tool - Main Client Component
 *
 * Orchestrates input form, calculation, results display,
 * history sidebar, and PDF export.
 *
 * @module MotorBreakerSizingTool
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMotorBreakerStore } from '@/stores/useMotorBreakerStore';
import { MotorBreakerInputForm } from '@/components/motor-breaker/MotorBreakerInputForm';
import { MotorBreakerResults } from '@/components/motor-breaker/MotorBreakerResults';
import { MotorBreakerHistorySidebar } from '@/components/motor-breaker/MotorBreakerHistorySidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calculator, FileText, History } from 'lucide-react';
import { calculateMotorBreakerSizing } from '@/lib/calculations/motor-breaker/motorBreakerCalculator';
import { downloadMotorBreakerPDF } from '@/lib/pdfGenerator.motorBreaker';
import type { MotorBreakerInput, MotorBreakerEnvironment } from '@/types/motor-breaker-calculator';

export function MotorBreakerSizingTool() {
  const store = useMotorBreakerStore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setCalculationError(null);

    try {
      const input: MotorBreakerInput = {
        standard: store.standard,
        systemType: store.systemType,
        loadType: store.loadType,
        voltage: store.voltage,
        inputMode: store.inputMode,
        powerValue: store.powerValue,
        powerUnit: store.powerUnit,
        fla: store.fla,
        powerFactor: store.powerFactor,
        protectionDevice: store.protectionDevice,
        utilizationCategory: store.utilizationCategory,
        mca: store.mca,
        mop: store.mop,
      };

      const environment: MotorBreakerEnvironment | undefined =
        store.ambientTemperature !== undefined || store.groupedCables !== undefined || store.installationMethod !== undefined
          ? {
              ambientTemperature: store.ambientTemperature,
              groupedCables: store.groupedCables,
              installationMethod: store.installationMethod,
            }
          : undefined;

      const results = await calculateMotorBreakerSizing({ input, environment });

      useMotorBreakerStore.setState({ results });

      setTimeout(() => {
        store.saveToHistory();
      }, 500);
    } catch (error) {
      setCalculationError(
        error instanceof Error ? error.message : 'Calculation failed. Please check your inputs.'
      );
    } finally {
      setIsCalculating(false);
    }
  }, [store]);

  const handleExportPDF = useCallback(async () => {
    if (!store.results) return;

    setIsExportingPDF(true);
    try {
      await downloadMotorBreakerPDF({
        input: {
          standard: store.standard,
          systemType: store.systemType,
          loadType: store.loadType,
          voltage: store.voltage,
          inputMode: store.inputMode,
          powerValue: store.powerValue,
          powerUnit: store.powerUnit,
          fla: store.fla,
          powerFactor: store.powerFactor,
          protectionDevice: store.protectionDevice,
          utilizationCategory: store.utilizationCategory,
          mca: store.mca,
          mop: store.mop,
        },
        results: store.results,
        project: store.projectName || store.engineerName
          ? {
              projectName: store.projectName,
              projectLocation: store.projectLocation,
              engineerName: store.engineerName,
            }
          : undefined,
      });
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExportingPDF(false);
    }
  }, [store]);

  const handleStandardChange = useCallback(
    (newStandard: 'NEC' | 'IEC') => {
      store.setStandard(newStandard);
      if (store.results) {
        handleCalculate();
      }
    },
    [store, handleCalculate]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Motor & HVAC Configuration</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </div>

              <MotorBreakerInputForm
                standard={store.standard}
                systemType={store.systemType}
                loadType={store.loadType}
                voltage={store.voltage}
                inputMode={store.inputMode}
                powerValue={store.powerValue}
                powerUnit={store.powerUnit}
                fla={store.fla}
                powerFactor={store.powerFactor}
                protectionDevice={store.protectionDevice}
                utilizationCategory={store.utilizationCategory}
                mca={store.mca}
                mop={store.mop}
                showEnvironmental={store.showEnvironmental}
                ambientTemperature={store.ambientTemperature}
                groupedCables={store.groupedCables}
                installationMethod={store.installationMethod}
                errors={{}}
                onStandardChange={handleStandardChange}
                onSystemTypeChange={store.setSystemType}
                onLoadTypeChange={store.setLoadType}
                onVoltageChange={store.setVoltage}
                onInputModeChange={store.setInputMode}
                onPowerValueChange={store.setPowerValue}
                onPowerUnitChange={store.setPowerUnit}
                onFLAChange={store.setFLA}
                onPowerFactorChange={store.setPowerFactor}
                onProtectionDeviceChange={store.setProtectionDevice}
                onUtilizationCategoryChange={store.setUtilizationCategory}
                onMCAChange={store.setMCA}
                onMOPChange={store.setMOP}
                onToggleEnvironmental={store.toggleEnvironmental}
                onAmbientTemperatureChange={store.setAmbientTemperature}
                onGroupedCablesChange={store.setGroupedCables}
                onInstallationMethodChange={store.setInstallationMethod}
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

          {/* Results */}
          {store.results && (
            <MotorBreakerResults results={store.results} />
          )}

          {/* Empty State */}
          {!store.results && !isCalculating && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Calculate</h3>
                  <p className="text-muted-foreground">
                    Configure your motor, HVAC, or general load parameters and click "Calculate Breaker Size".
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Quick Reference */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Quick Reference</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold">NEC 430.52 Motor Protection</p>
                  <p className="text-muted-foreground">
                    Thermal-magnetic: 250% FLA<br />
                    Dual-element fuse: 175% FLA<br />
                    Magnetic-only: 800% FLA<br />
                    Instantaneous trip: 1100% FLA
                  </p>
                </div>
                <div>
                  <p className="font-semibold">NEC 440 HVAC</p>
                  <p className="text-muted-foreground">
                    Wire: sized for MCA<br />
                    Breaker: largest standard ≤ MOP
                  </p>
                </div>
                <div>
                  <p className="font-semibold">IEC Utilization Categories</p>
                  <p className="text-muted-foreground">
                    AC-1: 100% (resistive)<br />
                    AC-2: 150% (slip-ring)<br />
                    AC-3: 100% (squirrel-cage)<br />
                    AC-4: 120% (jog/reverse)
                  </p>
                </div>
                <div>
                  <p className="font-semibold">DC Categories</p>
                  <p className="text-muted-foreground">
                    DC-1/2/4: 100-150%<br />
                    DC-3/5: 250% (severe duty)
                  </p>
                </div>
                <div>
                  <p className="font-semibold">HP to kW</p>
                  <p className="text-muted-foreground">
                    1 HP = 0.7457 kW
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Sidebar */}
      <MotorBreakerHistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
