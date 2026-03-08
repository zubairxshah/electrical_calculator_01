'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { ShortCircuitCalculationResults } from '@/types/short-circuit'

interface Props {
  results: ShortCircuitCalculationResults
}

export default function ShortCircuitResults({ results }: Props) {
  const { impedanceSummary, faultCurrents, asymmetryFactors, breakerAdequacy, alerts } = results

  return (
    <div className="space-y-4">
      {/* Fault Current Summary */}
      <Card className="border-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Fault Current Results
            <Badge variant="outline" className="text-base font-bold">
              {breakerAdequacy.recommendedBreakerRating} rated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {faultCurrents.map((fc, i) => (
              <div key={i} className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{fc.faultTypeLabel}</span>
                  <Badge variant={fc.symmetricalRMSKA > 42 ? 'destructive' : 'secondary'}>
                    {fc.symmetricalRMSKA} kA sym
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <div>Peak: <span className="text-foreground font-medium">{fc.peakKA} kA</span></div>
                  <div>Asym RMS: <span className="text-foreground font-medium">{fc.asymmetricalRMSKA} kA</span></div>
                  <div>Breaking: <span className="text-foreground font-medium">{fc.breakingCurrentKA} kA</span></div>
                  <div>Steady-state: <span className="text-foreground font-medium">{fc.steadyStateKA} kA</span></div>
                  <div className="col-span-2 text-[10px]">{fc.codeReference}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impedance Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">System Impedance Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {impedanceSummary.components.map((comp, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                <span className="text-muted-foreground">{comp.name}</span>
                <span className="font-mono text-xs">
                  R={comp.resistanceOhm.toFixed(5)}  X={comp.reactanceOhm.toFixed(5)}  Z={comp.impedanceOhm.toFixed(5)} ohm
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
              <span>Total</span>
              <span className="font-mono text-xs">
                R={impedanceSummary.totalResistanceOhm.toFixed(5)}  X={impedanceSummary.totalReactanceOhm.toFixed(5)}  Z={impedanceSummary.totalImpedanceOhm.toFixed(5)} ohm
              </span>
            </div>
            <div className="text-xs text-muted-foreground">System X/R Ratio: {impedanceSummary.systemXRRatio}</div>
          </div>
        </CardContent>
      </Card>

      {/* Asymmetry Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Asymmetry & DC Component</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">X/R Ratio:</span> {asymmetryFactors.xrRatio}</div>
            <div><span className="text-muted-foreground">Peak Factor (kp):</span> {asymmetryFactors.peakFactor}</div>
            <div><span className="text-muted-foreground">Asym Factor:</span> {asymmetryFactors.asymmetryFactor}</div>
            <div><span className="text-muted-foreground">DC Time Const:</span> {asymmetryFactors.dcDecayTimeConstant} ms</div>
          </div>
        </CardContent>
      </Card>

      {/* Breaker Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Breaker Interrupting Requirement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Required:</span> <span className="font-semibold">{breakerAdequacy.requiredBreakingCapacityKA} kA</span></div>
            <div><span className="text-muted-foreground">Recommended:</span> <span className="font-semibold">{breakerAdequacy.recommendedBreakerRating}</span></div>
            <div className="col-span-2 text-xs text-muted-foreground">{breakerAdequacy.codeReference}</div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alerts & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-sm p-2 rounded ${
                  alert.type === 'error' ? 'bg-destructive/10 text-destructive' :
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                  'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                }`}
              >
                {alert.type === 'error' ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> :
                 alert.type === 'warning' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> :
                 <Info className="h-4 w-4 mt-0.5 shrink-0" />}
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
