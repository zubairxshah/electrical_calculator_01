'use client';

import { PowerCalculationResult } from '@/models/PowerCalculationResult';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  FileDown,
  Save
} from 'lucide-react';

interface ResultsDisplayProps {
  result: PowerCalculationResult | null;
  onExportPDF?: () => void;
  onSave?: () => void;
}

/**
 * Results Display Component
 * Shows calculation results with compliance information
 */
export function ResultsDisplay({
  result,
  onExportPDF,
  onSave,
}: ResultsDisplayProps) {
  if (!result) {
    return null;
  }

  const {
    activePower,
    reactivePower,
    apparentPower,
    powerFactor,
    phaseAngle,
    systemType,
    formula,
    standardReferences,
    complianceChecks,
    warnings,
  } = result;

  const allCompliant = complianceChecks.every((c) => c.compliant);

  return (
    <div className="space-y-6">
      {/* Main Results Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Power Calculation Results
              </CardTitle>
              <CardDescription>
                {systemType === 'single-phase' ? 'Single-Phase' : 'Three-Phase'} System
              </CardDescription>
            </div>
            <Badge variant={allCompliant ? 'default' : 'destructive'}>
              {allCompliant ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {allCompliant ? 'Compliant' : 'Review Required'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Active Power */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Active Power (P)</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{activePower} kW</div>
              <div className="text-xs text-green-600 mt-1">Real power doing useful work</div>
            </div>

            {/* Reactive Power */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Reactive Power (Q)</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{reactivePower} kVAR</div>
              <div className="text-xs text-blue-600 mt-1">Power stored in fields</div>
            </div>

            {/* Apparent Power */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Apparent Power (S)</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{apparentPower} kVA</div>
              <div className="text-xs text-orange-600 mt-1">Total power supplied</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div>
              <div className="text-sm text-muted-foreground">Power Factor (cosφ)</div>
              <div className="text-lg font-semibold">{powerFactor}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phase Angle (φ)</div>
              <div className="text-lg font-semibold">{phaseAngle}°</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formula Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Formula Applied</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg font-mono text-center">
            {formula}
          </div>
          <div className="mt-2 text-sm text-muted-foreground text-center">
            {systemType === 'single-phase'
              ? 'For single-phase: P = V × I × cosφ, Q = V × I × sinφ, S = V × I'
              : 'For three-phase: P = √3 × V × I × cosφ, Q = √3 × V × I × sinφ, S = √3 × V × I'}
          </div>
        </CardContent>
      </Card>

      {/* Standards References */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Standards References</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {standardReferences.map((ref) => (
              <Badge key={ref} variant="secondary">
                {ref}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceChecks.map((check, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  check.compliant ? 'bg-green-50' : 'bg-amber-50'
                }`}
              >
                {check.compliant ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{check.requirement}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {check.standard} {check.clause ? `(${check.clause})` : ''}
                  </div>
                  {check.details && (
                    <div className="text-xs text-muted-foreground mt-1">{check.details}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <ul className="list-disc list-inside space-y-1 mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {onExportPDF && (
          <Button onClick={onExportPDF} variant="outline" className="flex-1">
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        )}
        {onSave && (
          <Button onClick={onSave} variant="outline" className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Save Calculation
          </Button>
        )}
      </div>
    </div>
  );
}
