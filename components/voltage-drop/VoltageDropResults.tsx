'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import type { VoltageDropCalculationResults } from '@/types/voltage-drop'

interface Props {
  results: VoltageDropCalculationResults
}

export default function VoltageDropResults({ results }: Props) {
  const { result, cableSuggestions, alerts } = results

  const dropColor = result.isDangerous
    ? 'destructive'
    : result.isViolation3Pct
      ? 'secondary'
      : 'default'

  const dropBg = result.isDangerous
    ? 'border-destructive'
    : result.isViolation3Pct
      ? 'border-yellow-500'
      : 'border-primary'

  return (
    <div className="space-y-4">
      {/* Main Result */}
      <Card className={dropBg}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Voltage Drop Result
            <Badge variant={dropColor} className="text-base font-bold">
              {result.voltageDropPercent}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-md p-3 text-center">
              <div className="text-2xl font-bold">{result.voltageDrop} V</div>
              <div className="text-xs text-muted-foreground">Voltage Drop</div>
            </div>
            <div className="border rounded-md p-3 text-center">
              <div className="text-2xl font-bold">{result.receivingEndVoltage} V</div>
              <div className="text-xs text-muted-foreground">Receiving End Voltage</div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conductor</span>
              <span className="font-medium">{result.conductorDescription}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Resistance</span>
              <span className="font-mono text-xs">{result.resistance} {result.resistanceUnit}</span>
            </div>
            {result.reactance !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reactance</span>
                <span className="font-mono text-xs">{result.reactance} {result.resistanceUnit}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Circuit Multiplier</span>
              <span className="font-mono text-xs">{result.circuitMultiplier}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current per Run</span>
              <span className="font-medium">{result.currentPerRun} A</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              {result.isWithinLimit ? (
                <Badge variant="default" className="bg-green-600">Within {result.limitPercent}% limit</Badge>
              ) : (
                <Badge variant="destructive">Exceeds {result.limitPercent}% limit</Badge>
              )}
            </div>
          </div>

          {/* Voltage drop bar visualization */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>0%</span>
              <span>{result.limitPercent}%</span>
              <span>10%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  result.isDangerous ? 'bg-red-500' : result.isViolation3Pct ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(result.voltageDropPercent * 10, 100)}%` }}
              />
              {/* Limit marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                style={{ left: `${result.limitPercent * 10}%` }}
              />
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground mt-2">{result.standardReference}</div>
        </CardContent>
      </Card>

      {/* Cable Suggestions */}
      {cableSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommended Cable Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cableSuggestions.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between text-sm border rounded-md p-2 ${
                    s.isOptimal ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {s.isOptimal && <Badge variant="default" className="text-[10px]">Optimal</Badge>}
                    <span className="font-medium">
                      {s.sizeMm2}mm²{s.sizeAWG ? ` (${s.sizeAWG})` : ''}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.voltageDropPercent}% ({s.voltageDrop}V)
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Optimal = smallest cable meeting the voltage drop limit
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alerts & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm p-2 rounded-md ${
                    alert.type === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : alert.type === 'warning'
                        ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                  }`}
                >
                  {alert.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <span className="text-xs">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
