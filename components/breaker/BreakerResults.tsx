/**
 * Breaker Results Display Component
 *
 * Displays calculation results with organized sections:
 * - Load Analysis (calculated current)
 * - Breaker Sizing (minimum and recommended breaker)
 * - Warnings and Alerts (color-coded by severity)
 * - Recommendations (trip curve, cable size, general notes)
 *
 * Features:
 * - Expandable "Calculation Details" section
 * - Color-coded warnings (info/warning/error)
 * - Code section references (NEC/IEC)
 * - Professional formatting suitable for PDF export
 *
 * @module BreakerResults
 */

'use client';

import React, { useState } from 'react';
import { CalculationResults } from '@/types/breaker-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

/**
 * BreakerResults Props
 */
export interface BreakerResultsProps {
  results: CalculationResults;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

/**
 * Get icon and color for alert level
 */
function getAlertIcon(level: 'error' | 'warning' | 'info') {
  switch (level) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-600" />;
  }
}

/**
 * Get background color class for alert level
 */
function getAlertBgClass(level: 'error' | 'warning' | 'info') {
  switch (level) {
    case 'error':
      return 'bg-destructive/10 border-destructive/50';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
  }
}

/**
 * BreakerResults Component
 *
 * Primary results display for breaker sizing calculations
 */
export function BreakerResults(props: BreakerResultsProps) {
  const { results, showDetails: externalShowDetails, onToggleDetails } = props;
  const [internalShowDetails, setInternalShowDetails] = useState(false);

  // Use external control if provided, otherwise internal state
  const showDetails = externalShowDetails !== undefined ? externalShowDetails : internalShowDetails;
  const handleToggle = onToggleDetails || (() => setInternalShowDetails(!internalShowDetails));

  const { loadAnalysis, breakerSizing, recommendations, alerts, voltageDropAnalysis, deratingFactors } = results;

  return (
    <div className="space-y-6">
      {/* Load Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Load Analysis
          </CardTitle>
          <CardDescription>Calculated load current and safety factors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Calculated Load Current</p>
              <p className="text-2xl font-bold">{loadAnalysis.calculatedCurrentAmps.toFixed(1)} A</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Continuous Load Factor</p>
              <p className="text-2xl font-bold">{loadAnalysis.continuousLoadFactor.toFixed(2)}×</p>
              <p className="text-xs text-muted-foreground mt-1">
                {loadAnalysis.continuousLoadFactor > 1 ? 'NEC 125% safety factor' : 'IEC standard'}
              </p>
            </div>
          </div>

          {/* Expandable Calculation Details */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="w-full justify-between"
            >
              <span>Calculation Details</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showDetails && (
              <div className="mt-3 p-4 bg-muted/50 rounded-md space-y-2">
                <p className="text-sm">
                  <strong>Formula:</strong> {loadAnalysis.formula}
                </p>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Voltage:</strong> {loadAnalysis.components.voltage}V
                  </p>
                  <p>
                    <strong>Phase:</strong> {loadAnalysis.components.phase}
                  </p>
                  {loadAnalysis.components.power && (
                    <p>
                      <strong>Power:</strong> {loadAnalysis.components.power} kW
                    </p>
                  )}
                  {loadAnalysis.components.powerFactor && (
                    <p>
                      <strong>Power Factor:</strong> {loadAnalysis.components.powerFactor}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Breaker Sizing Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Circuit Breaker</CardTitle>
          <CardDescription>
            Per {breakerSizing.recommendedStandard} standard breaker ratings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Minimum Required</p>
              <p className="text-xl font-semibold">
                {breakerSizing.minimumBreakerSizeAmps.toFixed(1)} A
              </p>
            </div>
            <div className="border-l-2 border-primary pl-4">
              <p className="text-sm text-muted-foreground">Recommended Standard Size</p>
              <p className="text-3xl font-bold text-primary">
                {breakerSizing.recommendedBreakerAmps} A
              </p>
            </div>
          </div>

          {/* Primary Breaker Specification */}
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Primary Recommendation</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Rating:</span>{' '}
                <strong>{recommendations.primaryBreaker.ratingAmps}A</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Breaking Capacity:</span>{' '}
                <strong>{recommendations.primaryBreaker.breakingCapacityKA} kA</strong>
              </div>
              {recommendations.primaryBreaker.tripCurve && (
                <div>
                  <span className="text-muted-foreground">Trip Curve:</span>{' '}
                  <Badge variant="outline">Type {recommendations.primaryBreaker.tripCurve}</Badge>
                </div>
              )}
              {recommendations.primaryBreaker.tripType && (
                <div>
                  <span className="text-muted-foreground">Trip Type:</span>{' '}
                  <Badge variant="outline">{recommendations.primaryBreaker.tripType}</Badge>
                </div>
              )}
            </div>

            {/* T034: Enhanced Code References Display */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs font-semibold text-blue-900 mb-1">
                📋 Code Reference
              </p>
              <p className="text-xs text-blue-800">
                <strong>Per {recommendations.primaryBreaker.codeSection}</strong>
              </p>
              {breakerSizing.recommendedStandard === 'NEC' && (
                <p className="text-xs text-blue-700 mt-1">
                  Continuous loads require 125% overcurrent protection per NEC Article 210.20(A).
                  Breaker rating must not be less than 125% of continuous load current.
                </p>
              )}
              {breakerSizing.recommendedStandard === 'IEC' && (
                <p className="text-xs text-blue-700 mt-1">
                  Current-carrying capacity determined per IEC 60364-5-52.
                  Correction factors (Ca, Cg, Cc) applied for environmental conditions.
                </p>
              )}
            </div>
          </div>

          {/* Alternative Breakers (if any) */}
          {recommendations.alternativeBreakers && recommendations.alternativeBreakers.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Alternative Options</h4>
                <div className="space-y-2">
                  {recommendations.alternativeBreakers.map((breaker, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-muted/30 rounded-md text-sm flex justify-between items-center"
                    >
                      <span>
                        <strong>{breaker.ratingAmps}A</strong> breaker ({breaker.breakingCapacityKA} kA)
                      </span>
                      {breaker.tripCurve && <Badge variant="secondary">Type {breaker.tripCurve}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Voltage Drop Analysis */}
      {voltageDropAnalysis && voltageDropAnalysis.performed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Voltage Drop Analysis
            </CardTitle>
            <CardDescription>
              Per NEC 210.19(A) - Branch circuit limit: 3%, Combined limit: 5%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Voltage Drop</p>
                <p className={`text-2xl font-bold ${
                  voltageDropAnalysis.status === 'exceed-limit' ? 'text-red-600' :
                  voltageDropAnalysis.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {voltageDropAnalysis.voltageDropPercent.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Voltage Drop</p>
                <p className="text-xl font-semibold">{voltageDropAnalysis.voltageDrop.toFixed(2)} V</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Circuit Distance</p>
                <p className="text-xl font-semibold">{voltageDropAnalysis.circuitDistance}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`p-3 rounded-md ${
              voltageDropAnalysis.status === 'exceed-limit' ? 'bg-red-50 border border-red-200' :
              voltageDropAnalysis.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
            }`}>
              <p className="font-semibold">{voltageDropAnalysis.assessment}</p>
            </div>

            {/* Cable Recommendation */}
            {voltageDropAnalysis.recommendedCableSize && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-semibold text-blue-900">Cable Recommendation</p>
                <p className="text-sm text-blue-800">
                  Use <strong>{voltageDropAnalysis.recommendedCableSize}</strong> to reduce voltage drop
                  {voltageDropAnalysis.recommendedVDPercent && ` to ${voltageDropAnalysis.recommendedVDPercent.toFixed(2)}%`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Derating Factors */}
      {deratingFactors && deratingFactors.applied && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-600" />
              Derating Factors Applied
            </CardTitle>
            <CardDescription>Environmental adjustments to breaker sizing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Temperature Factor */}
            {deratingFactors.temperatureFactor && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{deratingFactors.temperatureFactor.label}</p>
                  <p className="text-lg font-semibold">
                    {(deratingFactors.temperatureFactor.factor * 100).toFixed(0)}%
                  </p>
                </div>
                {deratingFactors.temperatureFactor.ambient !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Ambient: {deratingFactors.temperatureFactor.ambient}°C
                  </p>
                )}
                {deratingFactors.temperatureFactor.codeReference && (
                  <p className="text-xs text-muted-foreground">
                    Per {deratingFactors.temperatureFactor.codeReference}
                  </p>
                )}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${deratingFactors.temperatureFactor.factor * 100}%` }}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* Grouping Factor */}
            {deratingFactors.groupingFactor && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{deratingFactors.groupingFactor.label}</p>
                  <p className="text-lg font-semibold">
                    {(deratingFactors.groupingFactor.factor * 100).toFixed(0)}%
                  </p>
                </div>
                {deratingFactors.groupingFactor.cableCount !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {deratingFactors.groupingFactor.cableCount} current-carrying conductors
                  </p>
                )}
                {deratingFactors.groupingFactor.codeReference && (
                  <p className="text-xs text-muted-foreground">
                    Per {deratingFactors.groupingFactor.codeReference}
                  </p>
                )}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${deratingFactors.groupingFactor.factor * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Combined Factor */}
            <Separator />
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-purple-900">Combined Derating Factor</p>
                <p className="text-xl font-bold text-purple-700">
                  {(deratingFactors.combinedFactor * 100).toFixed(0)}%
                </p>
              </div>
              <p className="text-sm text-purple-800 mt-1">
                Adjusted breaker size: <strong>{deratingFactors.adjustedBreakerSizeAmps.toFixed(1)} A</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings and Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Alerts and Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-md border ${getAlertBgClass(alert.type)} space-y-1`}
              >
                <div className="flex items-start gap-2">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{alert.message}</p>
                    {alert.codeReference && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reference: {alert.codeReference}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations and Guidance */}
      <Card>
        <CardHeader>
          <CardTitle>Engineering Recommendations</CardTitle>
          <CardDescription>Professional guidance for breaker and cable selection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Breaker Type Guidance */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Breaker Type</h4>
            <p className="text-sm">
              <strong>{recommendations.breakerTypeGuidance.recommendedType}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              {recommendations.breakerTypeGuidance.rationale}
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Inrush Capability:</strong> {recommendations.breakerTypeGuidance.inrushCapability}
            </p>
          </div>

          {/* Cable Guidance (if applicable) */}
          {recommendations.cableGuidance && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Cable Sizing</h4>
                <p className="text-sm">
                  <strong>Minimum Size:</strong> {recommendations.cableGuidance.minimumSize}
                </p>
                {recommendations.cableGuidance.recommendedSize && (
                  <p className="text-sm">
                    <strong>Recommended Size:</strong> {recommendations.cableGuidance.recommendedSize}
                  </p>
                )}
                {recommendations.cableGuidance.rationale && (
                  <p className="text-sm text-muted-foreground">
                    {recommendations.cableGuidance.rationale}
                  </p>
                )}
              </div>
            </>
          )}

          {/* General Notes */}
          {recommendations.generalNotes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Additional Notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {recommendations.generalNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Calculation Metadata */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>
          Calculated: {new Date(results.calculatedAt).toLocaleString()} | Version:{' '}
          {results.calculationVersion}
        </p>
        <p className="italic">
          This calculation is provided for assistance and educational purposes. Final designs must
          be reviewed by licensed Professional Engineers where required by law.
        </p>
      </div>
    </div>
  );
}
