'use client'

import { useGeneratorSizingStore } from '@/stores/useGeneratorSizingStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, CheckCircle2, Download, Info, Zap } from 'lucide-react'
import { downloadGeneratorSizingPDF } from '@/lib/pdfGenerator.generatorSizing'

export default function GeneratorResults() {
  const { loads, generatorConfig, siteConditions, fuelConfig, result } = useGeneratorSizingStore()
  if (!result) return null

  const handleExportPDF = async () => {
    await downloadGeneratorSizingPDF({
      loads,
      generatorConfig,
      siteConditions,
      fuelConfig: fuelConfig ?? null,
      result,
    })
  }

  return (
    <div className="space-y-4">
      {/* Main Result */}
      <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Recommended Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-700 dark:text-green-400">
            {result.recommendedGeneratorKva} kVA
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Loading: {result.loadingPercent}% of rated capacity
          </p>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="mt-3">
            <Download className="h-4 w-4 mr-2" />
            Export PDF Report
          </Button>
        </CardContent>
      </Card>

      {/* Load Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Load Summary (Vector Summation)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total kW</p>
              <p className="text-lg font-semibold">{result.totalRunningKw}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total kVAR</p>
              <p className="text-lg font-semibold">{result.totalRunningKvar}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total kVA</p>
              <p className="text-lg font-semibold">{result.totalRunningKva}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Combined PF</p>
              <p className="text-lg font-semibold">{result.combinedPowerFactor}</p>
            </div>
          </div>

          {result.deratingFactor < 1 && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Required kVA (before derating)</p>
                <p className="font-semibold">{result.requiredKvaBeforeDerating}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Required kVA (after derating)</p>
                <p className="font-semibold">{result.requiredKvaAfterDerating}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Derating Factor</p>
                <p className="font-semibold">{result.deratingFactor}</p>
              </div>
            </div>
          )}

          {/* Per-load breakdown */}
          {result.perLoadBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Load Breakdown</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left py-1">Name</th>
                      <th className="text-left py-1">Type</th>
                      <th className="text-right py-1">kW</th>
                      <th className="text-right py-1">kVAR</th>
                      <th className="text-right py-1">kVA</th>
                      <th className="text-right py-1">PF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.perLoadBreakdown.map((item) => (
                      <tr key={item.loadId} className="border-b border-dashed">
                        <td className="py-1">{item.name}</td>
                        <td className="py-1 capitalize">{item.type}</td>
                        <td className="text-right py-1">{item.effectiveKw.toFixed(1)}</td>
                        <td className="text-right py-1">{item.kvar.toFixed(1)}</td>
                        <td className="text-right py-1">{item.kva.toFixed(1)}</td>
                        <td className="text-right py-1">{item.powerFactor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Per IEEE 3006.4 — vector summation of kW and kVAR components
              </p>
            </div>
          )}

          {/* NEC constraints */}
          {result.necConstraints && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium">NEC {result.necConstraints.classification} — {result.necConstraints.description}</p>
              <div className="flex gap-4 mt-1 text-sm">
                {result.necConstraints.startupTimeSeconds && (
                  <span>Startup: {result.necConstraints.startupTimeSeconds}s</span>
                )}
                {result.necConstraints.minFuelDurationHours && (
                  <span>Min fuel: {result.necConstraints.minFuelDurationHours}hr</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {result.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-2 rounded text-sm ${
                  alert.severity === 'error'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                }`}
              >
                {alert.severity === 'error' ? (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                ) : alert.severity === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <div>
                  <p>{alert.message}</p>
                  {alert.standardRef && (
                    <p className="text-xs opacity-75 mt-0.5">Ref: {alert.standardRef}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
