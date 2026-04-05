'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import type { ConduitFillResult, ConduitStandard, UnitSystem } from '@/types/conduit-fill'

interface Props {
  results: ConduitFillResult
  standard: ConduitStandard
  unitSystem: UnitSystem
  onExportPDF?: () => void
  isExportingPDF?: boolean
}

const SQ_IN_TO_MM2 = 645.16

export default function ConduitFillResults({
  results,
  standard,
  unitSystem,
  onExportPDF,
  isExportingPDF,
}: Props) {
  const {
    conduitInternalArea,
    conduitInternalAreaMm2,
    totalConductorArea,
    totalConductorAreaMm2,
    fillPercentage,
    fillLimit,
    totalConductorCount,
    pass,
    remainingArea,
    remainingAreaMm2,
    utilizationRatio,
    conductorDetails,
    necReferences,
    minimumConduitSize,
    noConduitFits,
  } = results

  const isIEC = standard === 'IEC'
  const useMetric = isIEC || unitSystem === 'metric'

  const formatArea = (sqIn: number, mm2?: number) => {
    if (useMetric) {
      const val = mm2 ?? sqIn * SQ_IN_TO_MM2
      return `${val.toFixed(1)} mm²`
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

  const remainingVal = useMetric ? remainingAreaMm2 : remainingArea

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
              <p className="font-semibold">{formatArea(conduitInternalArea, conduitInternalAreaMm2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Conductor Area</span>
              <p className="font-semibold">{formatArea(totalConductorArea, totalConductorAreaMm2)}</p>
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
              <p className={`font-semibold ${remainingVal < 0 ? 'text-destructive' : ''}`}>
                {formatArea(Math.abs(remainingArea), Math.abs(remainingAreaMm2))} {remainingVal < 0 ? 'over' : 'available'}
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
            {isIEC ? (
              <p>
                Minimum size: <strong>{minimumConduitSize.metricLabel ?? minimumConduitSize.imperial + 'mm'}</strong>{' '}
                — Internal area: {formatArea(minimumConduitSize.internalAreaSqIn, minimumConduitSize.internalAreaMm2)}
              </p>
            ) : (
              <p>
                Minimum size: <strong>{minimumConduitSize.imperial}&quot;</strong>{' '}
                (Metric {minimumConduitSize.metric}) — Internal area: {formatArea(minimumConduitSize.internalAreaSqIn, minimumConduitSize.internalAreaMm2)}
              </p>
            )}
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
                  <th className="pb-2">{isIEC ? 'Size (mm²)' : 'Wire Size'}</th>
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
                    <td className="py-1.5">{d.wireSize}{isIEC ? ' mm²' : ''}</td>
                    <td className="py-1.5">{d.insulationType}</td>
                    <td className="py-1.5 text-right">{d.quantity}</td>
                    <td className="py-1.5 text-right">{formatArea(d.areaPerConductor, d.areaPerConductorMm2)}</td>
                    <td className="py-1.5 text-right font-medium">{formatArea(d.totalArea, d.totalAreaMm2)}</td>
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
                  <td className="pt-2 text-right">{formatArea(totalConductorArea, totalConductorAreaMm2)}</td>
                  <td className="pt-2 text-right">{fillPercentage.toFixed(1)}%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{isIEC ? 'IEC / BS EN References' : 'NEC References'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-1 text-muted-foreground">
            {necReferences.map((ref) => (
              <li key={ref}>&#8226; {ref}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3 italic">
            {isIEC
              ? 'Based on BS 7671 18th Edition and IEC 61386. Calculations for informational purposes; verification by a qualified engineer is the user\u2019s responsibility.'
              : 'Based on NEC 2020 Chapter 9. Calculations for informational purposes; PE stamp/certification is user\u2019s responsibility.'}
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
