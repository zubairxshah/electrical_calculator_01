'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { TransformerCalculationResults } from '@/types/transformer-sizing'

interface Props {
  results: TransformerCalculationResults
}

export default function TransformerSizingResults({ results }: Props) {
  const { loadAnalysis, selection, losses, voltageRegulation, impedance, tapSettings, derating, alerts } = results

  return (
    <div className="space-y-4">
      {/* Selected Transformer */}
      <Card className="border-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Selected Transformer
            <Badge variant="outline" className="text-lg font-bold">{selection.ratedKVA} kVA</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Primary:</span>{' '}
              <span className="font-medium">{selection.ratedPrimaryVoltage.toLocaleString()} V</span>
            </div>
            <div>
              <span className="text-muted-foreground">Secondary:</span>{' '}
              <span className="font-medium">{selection.ratedSecondaryVoltage} V</span>
            </div>
            <div>
              <span className="text-muted-foreground">Loading:</span>{' '}
              <span className={`font-medium ${selection.loadingPercent > 100 ? 'text-destructive' : selection.loadingPercent > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                {selection.loadingPercent}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Margin:</span>{' '}
              <span className="font-medium">{selection.overloadMargin}%</span>
            </div>
            <div className="col-span-2 text-xs text-muted-foreground">{selection.codeReference}</div>
          </div>
        </CardContent>
      </Card>

      {/* Load Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Load Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Load:</span> {loadAnalysis.loadKW} kW / {loadAnalysis.loadKVA} kVA</div>
            <div><span className="text-muted-foreground">PF:</span> {loadAnalysis.loadPowerFactor}</div>
            <div><span className="text-muted-foreground">Demand kVA:</span> {loadAnalysis.demandKVA}</div>
            <div><span className="text-muted-foreground">Design kVA:</span> {loadAnalysis.designKVA}</div>
            <div><span className="text-muted-foreground">Primary I:</span> {loadAnalysis.primaryCurrentA} A</div>
            <div><span className="text-muted-foreground">Secondary I:</span> {loadAnalysis.secondaryCurrentA} A</div>
            <div><span className="text-muted-foreground">Turns Ratio:</span> {loadAnalysis.turnsRatio}</div>
          </div>
        </CardContent>
      </Card>

      {/* Losses & Efficiency */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Losses & Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">No-Load Loss:</span> {losses.noLoadLossW} W</div>
            <div><span className="text-muted-foreground">Full-Load Loss:</span> {losses.fullLoadLossW} W</div>
            <div><span className="text-muted-foreground">Actual Load Loss:</span> {losses.actualLoadLossW} W</div>
            <div><span className="text-muted-foreground">Total Loss:</span> {losses.totalLossW} W</div>
            <div>
              <span className="text-muted-foreground">Efficiency:</span>{' '}
              <span className={`font-medium ${losses.efficiencyPercent >= 97 ? 'text-green-600' : losses.efficiencyPercent >= 95 ? 'text-yellow-600' : 'text-destructive'}`}>
                {losses.efficiencyPercent}%
              </span>
            </div>
            <div><span className="text-muted-foreground">Max Eff. at:</span> {losses.maxEfficiencyLoadPercent}% load</div>
            <div><span className="text-muted-foreground">Max Efficiency:</span> {losses.maxEfficiencyPercent}%</div>
            <div><span className="text-muted-foreground">Annual Loss:</span> {losses.annualEnergyLossKWh.toLocaleString()} kWh</div>
          </div>
        </CardContent>
      </Card>

      {/* Impedance & Short Circuit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Impedance & Short Circuit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">%Z:</span> {impedance.impedancePercent}%</div>
            <div><span className="text-muted-foreground">%R:</span> {impedance.resistancePercent}%</div>
            <div><span className="text-muted-foreground">%X:</span> {impedance.reactancePercent}%</div>
            <div><span className="text-muted-foreground">SC Current:</span> {impedance.shortCircuitKA} kA</div>
          </div>
        </CardContent>
      </Card>

      {/* Voltage Regulation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Voltage Regulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Regulation:</span>{' '}
              <span className={`font-medium ${voltageRegulation.regulationPercent > 5 ? 'text-destructive' : voltageRegulation.regulationPercent > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                {voltageRegulation.regulationPercent}%
              </span>
            </div>
            <div><span className="text-muted-foreground">V Drop:</span> {voltageRegulation.voltageDrop} V</div>
            <div><span className="text-muted-foreground">V at Load:</span> {voltageRegulation.secondaryVoltageAtLoad} V</div>
            <div className="col-span-2 text-xs text-muted-foreground font-mono">{voltageRegulation.regulationFormula}</div>
          </div>
        </CardContent>
      </Card>

      {/* Tap Settings */}
      {tapSettings.tapPosition !== 'none' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tap Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Type:</span> {tapSettings.tapPosition}</div>
              <div><span className="text-muted-foreground">Range:</span> ±{tapSettings.tapRange}%</div>
              <div><span className="text-muted-foreground">Steps:</span> {tapSettings.tapSteps}</div>
              <div><span className="text-muted-foreground">V/Tap:</span> {tapSettings.voltagePerTap} V</div>
              <div><span className="text-muted-foreground">Min V:</span> {tapSettings.minSecondaryVoltage} V</div>
              <div><span className="text-muted-foreground">Max V:</span> {tapSettings.maxSecondaryVoltage} V</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Derating */}
      {derating && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Derating Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Temperature:</span> {(derating.temperatureDerating * 100).toFixed(1)}%</div>
              <div><span className="text-muted-foreground">Altitude:</span> {(derating.altitudeDerating * 100).toFixed(1)}%</div>
              <div><span className="text-muted-foreground">Combined:</span> {(derating.combinedDerating * 100).toFixed(1)}%</div>
              <div><span className="text-muted-foreground">Effective kVA:</span> {derating.effectiveKVA}</div>
              <div className="col-span-2 text-xs text-muted-foreground">{derating.codeReference}</div>
            </div>
          </CardContent>
        </Card>
      )}

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
