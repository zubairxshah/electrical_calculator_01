/**
 * Motor Breaker Results Display Component
 *
 * Shows calculation results with conditional sections for
 * motor details, HVAC details, IEC category, derating, and alerts.
 *
 * @module MotorBreakerResults
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, AlertTriangle, Info, Zap, Shield, Thermometer } from 'lucide-react';
import type { MotorBreakerCalculationResults } from '@/types/motor-breaker-calculator';

interface MotorBreakerResultsProps {
  results: MotorBreakerCalculationResults;
}

export function MotorBreakerResults({ results }: MotorBreakerResultsProps) {
  const { loadAnalysis, protectionSizing, recommendation, motorDetails, hvacDetails, iecCategoryDetails, deratingFactors, alerts } = results;

  return (
    <div className="space-y-4">
      {/* Load Analysis Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Load Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {loadAnalysis.inputPowerKW !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Input Power</p>
                <p className="text-lg font-semibold">
                  {loadAnalysis.inputPowerKW.toFixed(2)} kW
                  {loadAnalysis.inputPowerHP !== undefined && (
                    <span className="text-sm text-muted-foreground ml-1">
                      ({loadAnalysis.inputPowerHP.toFixed(1)} HP)
                    </span>
                  )}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Full-Load Amps (FLA)</p>
              <p className="text-lg font-semibold">{loadAnalysis.calculatedFLA.toFixed(2)} A</p>
            </div>
          </div>
          <div className="p-2 bg-muted rounded text-sm font-mono">
            {loadAnalysis.formula}
          </div>
        </CardContent>
      </Card>

      {/* Protection Sizing Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Protection Sizing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">FLA</p>
              <p className="font-semibold">{protectionSizing.fla.toFixed(2)} A</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Multiplier</p>
              <p className="font-semibold">{(protectionSizing.multiplier * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Minimum Protection</p>
              <p className="font-semibold">{protectionSizing.minimumAmps.toFixed(1)} A</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{protectionSizing.multiplierSource}</p>
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            {protectionSizing.codeReference}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Breaker Card */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recommended Breaker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-primary">
              {recommendation.recommendedBreakerAmps} A
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline">{recommendation.standard}</Badge>
              {recommendation.tripCurve && (
                <Badge variant="secondary">Trip Curve {recommendation.tripCurve}</Badge>
              )}
              {recommendation.tripType && (
                <Badge variant="secondary">{recommendation.tripType}</Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-2">
            {recommendation.rationale}
          </p>
        </CardContent>
      </Card>

      {/* Motor Details Card (conditional) */}
      {motorDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Motor Protection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {motorDetails.protectionDeviceName && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Protection Device</span>
                <span className="text-sm font-medium">{motorDetails.protectionDeviceName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Multiplier</span>
              <span className="text-sm font-medium">{(motorDetails.multiplier * 100).toFixed(0)}% FLA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Code Reference</span>
              <span className="text-sm font-medium">{motorDetails.codeReference}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HVAC Details Card (conditional) */}
      {hvacDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">HVAC Equipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">MCA (Wire Sizing)</p>
                <p className="font-semibold">{hvacDetails.mca} A</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MOP (Max Protection)</p>
                <p className="font-semibold">{hvacDetails.mop} A</p>
              </div>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">{hvacDetails.breakerSizingBasis}</p>
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              {hvacDetails.codeReference}
            </div>
          </CardContent>
        </Card>
      )}

      {/* IEC Category Details Card (conditional) */}
      {iecCategoryDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">IEC Utilization Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{iecCategoryDetails.category}</Badge>
              <span className="text-sm">{iecCategoryDetails.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Multiplier</span>
              <span className="text-sm font-medium">{(iecCategoryDetails.multiplier * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Recommended Trip Curve</span>
              <Badge variant="outline">Type {iecCategoryDetails.recommendedTripCurve}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mt-2">Typical applications:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {iecCategoryDetails.applications.map((app, i) => (
                  <li key={i}>{app}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Derating Factors Card (conditional) */}
      {deratingFactors?.applied && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Derating Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deratingFactors.temperatureFactor && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{deratingFactors.temperatureFactor.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {deratingFactors.temperatureFactor.ambient}°C ambient
                  </p>
                </div>
                <Badge variant="outline">{deratingFactors.temperatureFactor.factor.toFixed(2)}</Badge>
              </div>
            )}
            {deratingFactors.groupingFactor && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{deratingFactors.groupingFactor.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {deratingFactors.groupingFactor.cableCount} cables
                  </p>
                </div>
                <Badge variant="outline">{deratingFactors.groupingFactor.factor.toFixed(2)}</Badge>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Combined Factor</span>
              <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                {deratingFactors.combinedFactor.toFixed(3)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Adjusted Minimum</span>
              <span className="text-sm font-semibold">{deratingFactors.adjustedBreakerSizeAmps.toFixed(1)} A</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Card (conditional) */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={
                  alert.type === 'error'
                    ? 'p-3 bg-destructive/10 border border-destructive/50 rounded-md flex gap-2'
                    : alert.type === 'warning'
                    ? 'p-3 bg-yellow-50 border border-yellow-200 rounded-md flex gap-2'
                    : 'p-3 bg-blue-50 border border-blue-200 rounded-md flex gap-2'
                }
              >
                {alert.type === 'error' && <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />}
                {alert.type === 'info' && <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                <div>
                  <p className={
                    alert.type === 'error'
                      ? 'text-sm text-destructive'
                      : alert.type === 'warning'
                      ? 'text-sm text-yellow-700'
                      : 'text-sm text-blue-700'
                  }>
                    {alert.message}
                  </p>
                  {alert.codeReference && (
                    <p className="text-xs text-muted-foreground mt-1">{alert.codeReference}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <p className="text-xs text-muted-foreground text-center">
        Calculated at {new Date(results.calculatedAt).toLocaleString()} | v{results.calculationVersion}
      </p>
    </div>
  );
}
