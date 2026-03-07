'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, AlertTriangle, Info, Zap, TrendingDown, Battery } from 'lucide-react'
import type { PFCCalculationResults } from '@/types/power-factor-correction'

interface Props {
  results: PFCCalculationResults
}

export default function PowerFactorCorrectionResults({ results }: Props) {
  const { loadAnalysis, correctionSizing, capacitorBank, deratingFactors, savings, alerts } = results

  return (
    <div className="space-y-4">
      {/* Main Recommendation */}
      <Card className="border-primary bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Battery className="h-5 w-5" />
            Capacitor Bank Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-3">
            <p className="text-4xl font-bold text-primary">{capacitorBank.totalKVAR} kVAR</p>
            <p className="text-sm text-muted-foreground mt-1">
              {capacitorBank.capacitorType === 'standard' ? 'Standard' : capacitorBank.capacitorType === 'detuned' ? 'Detuned' : 'Heavy-Duty'} Capacitor Bank
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
            <span className="text-muted-foreground">Correction Steps:</span>
            <span className="font-medium text-right">
              {capacitorBank.numberOfSteps} × {capacitorBank.kvarPerStep} kVAR
            </span>
            <span className="text-muted-foreground">Connection:</span>
            <span className="font-medium text-right">{capacitorBank.connectionType === 'delta' ? 'Delta (Δ)' : 'Star (Y)'}</span>
            <span className="text-muted-foreground">Rated Voltage:</span>
            <span className="font-medium text-right">{capacitorBank.ratedVoltage} V</span>
            <span className="text-muted-foreground">Rated Current:</span>
            <span className="font-medium text-right">{capacitorBank.ratedCurrent} A</span>
            <span className="text-muted-foreground">Capacitance/Phase:</span>
            <span className="font-medium text-right">{capacitorBank.capacitancePerPhase} µF</span>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {capacitorBank.dischargeResistors && <Badge variant="outline">Discharge Resistors</Badge>}
            {capacitorBank.fusedProtection && <Badge variant="outline">Fused Protection</Badge>}
            <Badge variant="secondary">{capacitorBank.codeReference.split(',')[0]}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Load Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Load Analysis (Before Correction)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Active Power:</span>
            <span className="font-medium text-right">{loadAnalysis.activePowerKW} kW</span>
            <span className="text-muted-foreground">Reactive Power:</span>
            <span className="font-medium text-right">{loadAnalysis.currentReactivePowerKVAR} kVAR</span>
            <span className="text-muted-foreground">Apparent Power:</span>
            <span className="font-medium text-right">{loadAnalysis.currentApparentPowerKVA} kVA</span>
            <span className="text-muted-foreground">Power Factor:</span>
            <span className="font-medium text-right">{loadAnalysis.currentPowerFactor}</span>
            <span className="text-muted-foreground">Phase Angle:</span>
            <span className="font-medium text-right">{loadAnalysis.currentPhaseAngleDeg}°</span>
            <span className="text-muted-foreground">Line Current:</span>
            <span className="font-medium text-right">{loadAnalysis.currentLineCurrent} A</span>
          </div>
        </CardContent>
      </Card>

      {/* Correction Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            After Correction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Required kVAR:</span>
            <span className="font-medium text-right">{correctionSizing.requiredKVAR} kVAR</span>
            <span className="text-muted-foreground">Corrected Reactive:</span>
            <span className="font-medium text-right">{correctionSizing.correctedReactivePowerKVAR} kVAR</span>
            <span className="text-muted-foreground">Corrected Apparent:</span>
            <span className="font-medium text-right">{correctionSizing.correctedApparentPowerKVA} kVA</span>
            <span className="text-muted-foreground">Corrected PF:</span>
            <span className="font-medium text-right text-green-600 dark:text-green-400 font-bold">{correctionSizing.correctedPowerFactor}</span>
            <span className="text-muted-foreground">Corrected Current:</span>
            <span className="font-medium text-right">{correctionSizing.correctedLineCurrent} A</span>
            <span className="text-muted-foreground">Current Reduction:</span>
            <span className="font-medium text-right text-green-600 dark:text-green-400">
              {correctionSizing.currentReduction} A ({correctionSizing.currentReductionPercent}%)
            </span>
          </div>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground font-mono">{correctionSizing.formula}</p>
        </CardContent>
      </Card>

      {/* Savings Estimate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Estimated Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">kVA Reduction:</span>
            <span className="font-medium text-right">{savings.kvaReduction} kVA</span>
            <span className="text-muted-foreground">Current Saved:</span>
            <span className="font-medium text-right">{savings.currentReductionAmps} A</span>
            <span className="text-muted-foreground">I²R Loss Reduction:</span>
            <span className="font-medium text-right">{savings.estimatedLossReductionPercent}%</span>
            <span className="text-muted-foreground">Demand Charge Saving:</span>
            <span className="font-medium text-right">{savings.demandChargeSavingPercent}%</span>
            <span className="text-muted-foreground">Penalty Avoidance:</span>
            <span className="font-medium text-right">
              {savings.penaltyAvoidance ? (
                <Badge variant="default" className="bg-green-600">Yes</Badge>
              ) : (
                <Badge variant="outline">N/A</Badge>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Derating Factors */}
      {deratingFactors && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Derating Factors Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">Temperature:</span>
              <span className="font-medium text-right">{deratingFactors.temperatureDerating}</span>
              <span className="text-muted-foreground">Altitude:</span>
              <span className="font-medium text-right">{deratingFactors.altitudeDerating}</span>
              <span className="text-muted-foreground">Harmonic:</span>
              <span className="font-medium text-right">{deratingFactors.harmonicDerating}</span>
              <span className="text-muted-foreground">Combined:</span>
              <span className="font-medium text-right font-bold">{deratingFactors.combinedDerating}</span>
              <span className="text-muted-foreground">Adjusted kVAR:</span>
              <span className="font-medium text-right">{deratingFactors.adjustedKVAR} kVAR</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes & Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-sm p-2 rounded ${
                  alert.type === 'error'
                    ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
                    : 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                }`}
              >
                {alert.type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                {alert.type === 'info' && <Info className="h-4 w-4 mt-0.5 shrink-0" />}
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <p className="text-xs text-muted-foreground text-center">
        Calculated at {new Date(results.timestamp).toLocaleString()} | v{results.version}
      </p>
    </div>
  )
}
