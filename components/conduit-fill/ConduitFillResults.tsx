'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import type { ConduitFillResult, UnitSystem, TradeSize } from '@/types/conduit-fill'

interface Props {
  results: ConduitFillResult
  unitSystem: UnitSystem
  onExportPDF?: () => void
  isExportingPDF?: boolean
}

const SQ_IN_TO_MM2 = 645.16

export default function ConduitFillResults({
  results,
  unitSystem,
  onExportPDF,
  isExportingPDF,
}: Props) {
  const {
    conduitInternalArea,
    totalConductorArea,
    fillPercentage,
    fillLimit,
    totalConductorCount,
    pass,
    remainingArea,
    utilizationRatio,
    conductorDetails,
    necReferences,
    minimumConduitSize,
    noConduitFits,
  } = results

  const formatArea = (sqIn: number) => {
    if (unitSystem === 'metric') {
      return `${(sqIn * SQ_IN_TO_MM2).toFixed(1)} mm²`
    }
    return `${sqIn.toFixed(4)} in²`
  }

  // Status colors
  const isWarning = !pass ? false : utilizationRatio > 0.8
  const statusColor = !pass ? 'destructive' : isWarning ? 'secondary' : 'default'
  const borderClass = !pass
    ? 'border-destructive'
    : isWarning
      ? 'border-yellow-500'
      : 'border-green-500'

  const StatusIcon = !pass ? XCircle : isWarning ? AlertTriangle : CheckCircle2

  // Fill bar width (capped at 100% for display)
  const fillBarWidth = Math.min(fillPercentage, 100)
  const fillBarColor = !pass
    ? 'bg-destructive'
    : isWarning
      ? 'bg-yellow-500'
      : 'bg-green-500'

  return (
    <div className="space-y-4">
      {/* Main Result Card */}
      <Card className={borderClass}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              Conduit Fill Result
            </span>
            <Badge variant={statusColor} className="text-base font-bold">
              {pass ? 'PASS' : 'FAIL'} — {fillPercentage.toFixed(1)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Visual Fill Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>0%</span>
              <span>Fill Limit: {fillLimit}%</span>
              <span>100%</span>
            </div>
            <div className="relative h-6 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${fillBarColor} transition-all rounded-full`}
                style={{ width: `${fillBarWidth}%` }}
              />
              {/* Fill limit marker */}
              <div
                className="absolute inset-y-0 w-0.5 bg-foreground/60"
                style={{ left: `${fillLimit}%` }}
              />
            </div>
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Conduit Area</span>
              <p className="font-semibold">{formatArea(conduitInternalArea)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Conductor Area</span>
              <p className="font-semibold">{formatArea(totalConductorArea)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fill Percentage</span>
              <p className="font-semibold">{fillPercentage.toFixed(2)}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fill Limit</span>
              <p className="font-semibold">{fillLimit}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Conductors</span>
              <p className="font-semibold">{totalConductorCount}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining Area</span>
              <p className={`font-semibold ${remainingArea < 0 ? 'text-destructive' : ''}`}>
                {formatArea(Math.abs(remainingArea))} {remainingArea < 0 ? 'over' : 'available'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minimum Size Recommendation */}
      {minimumConduitSize && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Minimum Conduit Size Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Minimum size: <strong>{minimumConduitSize.imperial}&quot;</strong>{' '}
              (Metric {minimumConduitSize.metric}) — Internal area: {formatArea(minimumConduitSize.internalAreaSqIn)}
            </p>
          </CardContent>
        </Card>
      )}

      {noConduitFits && (
        <Card className="border-yellow-500">
          <CardContent className="pt-4 text-sm">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <strong>No single conduit is sufficient.</strong>
            </div>
            <p className="mt-1 text-muted-foreground">Consider parallel conduit runs to accommodate this conductor fill.</p>
          </CardContent>
        </Card>
      )}

      {/* Conductor Breakdown Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conductor Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">Wire Size</th>
                  <th className="pb-2">Insulation</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Area/ea</th>
                  <th className="pb-2 text-right">Total Area</th>
                  <th className="pb-2 text-right">% of Fill</th>
                  <th className="pb-2">Table</th>
                </tr>
              </thead>
              <tbody>
                {conductorDetails.map((d) => (
                  <tr key={d.entryId} className="border-b border-muted">
                    <td className="py-1.5">{d.wireSize}</td>
                    <td className="py-1.5">{d.insulationType}</td>
                    <td className="py-1.5 text-right">{d.quantity}</td>
                    <td className="py-1.5 text-right">{formatArea(d.areaPerConductor)}</td>
                    <td className="py-1.5 text-right font-medium">{formatArea(d.totalArea)}</td>
                    <td className="py-1.5 text-right">{d.percentOfFill.toFixed(1)}%</td>
                    <td className="py-1.5 text-xs text-muted-foreground">{d.necTableRef}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="pt-2" colSpan={2}>Total</td>
                  <td className="pt-2 text-right">{totalConductorCount}</td>
                  <td className="pt-2"></td>
                  <td className="pt-2 text-right">{formatArea(totalConductorArea)}</td>
                  <td className="pt-2 text-right">{fillPercentage.toFixed(1)}%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* NEC References */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">NEC References</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {necReferences.map((ref) => (
              <li key={ref}>• {ref}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Based on NEC 2020 Chapter 9. Calculations for informational purposes; PE stamp/certification is user&apos;s responsibility.
          </p>
        </CardContent>
      </Card>

      {/* Export Button */}
      {onExportPDF && (
        <div className="flex justify-end">
          <button
            onClick={onExportPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent disabled:opacity-50"
          >
            {isExportingPDF ? 'Generating PDF...' : 'Export PDF Report'}
          </button>
        </div>
      )}
    </div>
  )
}
