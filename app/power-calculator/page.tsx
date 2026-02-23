'use client';

import { useState } from 'react';
import { CalculatorForm, PowerCalculationFormValues } from '@/components/power-calculator/CalculatorForm';
import { ResultsDisplay } from '@/components/power-calculator/ResultsDisplay';
import { PowerTriangle } from '@/components/power-calculator/PowerTriangle';
import { PowerCalculationEngine } from '@/services/power-calculator/calculationEngine';
import { PowerCalculationResult } from '@/models/PowerCalculationResult';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, BookOpen, FileText } from 'lucide-react';

/**
 * Power Calculator Page
 * 
 * Professional tool for calculating Active, Reactive, and Apparent Power
 * for single-phase and three-phase electrical systems.
 */
export default function PowerCalculatorPage() {
  const [result, setResult] = useState<PowerCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const engine = new PowerCalculationEngine();

  const handleCalculate = async (values: PowerCalculationFormValues) => {
    setIsCalculating(true);

    try {
      // Call API endpoint
      const response = await fetch('/api/power-calculator/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Calculation failed');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      console.error('Calculation error:', error);
      // Could show error toast here
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export PDF', result);
  };

  const handleSave = () => {
    // TODO: Implement save calculation
    console.log('Save calculation', result);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Power Calculator
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Calculate Active (P), Reactive (Q), and Apparent (S) Power
            </p>
          </div>
          <Badge variant="outline" className="h-fit">
            IEC & NEC Compliant
          </Badge>
        </div>

        {/* Standards Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">IEC 60038</Badge>
          <Badge variant="secondary">IEC 60364-5-52</Badge>
          <Badge variant="secondary">NEC Article 220</Badge>
          <Badge variant="secondary">NEC Article 430</Badge>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            About Power Calculations
          </CardTitle>
          <CardDescription>
            Understanding the relationship between Active, Reactive, and Apparent Power
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Active Power (P)
              </h3>
              <p className="text-sm text-green-700 mt-2">
                Real power that performs useful work, measured in kilowatts (kW).
                This is the power consumed by resistive loads.
              </p>
              <code className="block mt-2 text-xs bg-white p-2 rounded">
                P = V × I × cosφ
              </code>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reactive Power (Q)
              </h3>
              <p className="text-sm text-blue-700 mt-2">
                Power stored in magnetic/electric fields, measured in kVAR.
                Required for inductive loads like motors and transformers.
              </p>
              <code className="block mt-2 text-xs bg-white p-2 rounded">
                Q = V × I × sinφ
              </code>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Apparent Power (S)
              </h3>
              <p className="text-sm text-orange-700 mt-2">
                Total power supplied to the circuit, measured in kVA.
                Vector sum of active and reactive power.
              </p>
              <code className="block mt-2 text-xs bg-white p-2 rounded">
                S = V × I
              </code>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Power Factor</h4>
            <p className="text-sm text-muted-foreground">
              The ratio of Active Power to Apparent Power (cosφ = P/S).
              A power factor of 1.0 (unity) indicates all power is being used effectively.
              Values below 0.85 may require power factor correction.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input Form */}
        <div className="space-y-6">
          <CalculatorForm
            onCalculate={handleCalculate}
            isCalculating={isCalculating}
          />

          {/* Example Calculations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Example Calculations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm mb-2">Single-Phase Example</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Voltage: 230 V</div>
                  <div>Current: 20 A</div>
                  <div>Power Factor: 0.9</div>
                  <div className="pt-2 border-t mt-2">
                    <strong>Results:</strong> P = 4.14 kW, Q = 2.00 kVAR, S = 4.60 kVA
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium text-sm mb-2">Three-Phase Example</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Voltage: 400 V</div>
                  <div>Current: 50 A</div>
                  <div>Power Factor: 0.85</div>
                  <div className="pt-2 border-t mt-2">
                    <strong>Results:</strong> P = 29.44 kW, Q = 18.26 kVAR, S = 34.64 kVA
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {result ? (
            <>
              <ResultsDisplay
                result={result}
                onExportPDF={handleExportPDF}
                onSave={handleSave}
              />
              <PowerTriangle data={engine.getPowerTriangleData(result)} />
            </>
          ) : (
            <Card className="h-full min-h-[400px]">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your system parameters and click Calculate</p>
                  <p className="text-sm mt-2">Results will appear here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
