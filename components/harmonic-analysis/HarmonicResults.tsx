'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, Info, Zap, Activity, Shield, Filter } from 'lucide-react'
import type { HarmonicAnalysisResults, FilterRecommendation } from '@/types/harmonic-analysis'

interface HarmonicResultsProps {
  results: HarmonicAnalysisResults
}

function StatusBadge({ status }: { status: 'pass' | 'fail' | 'warning' | 'compliant' | 'non-compliant' | 'marginal' }) {
  if (status === 'pass' || status === 'compliant') {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Pass</Badge>
  }
  if (status === 'fail' || status === 'non-compliant') {
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Fail</Badge>
  }
  return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>
}

function ThdGauge({ label, value, limit, unit = '%' }: { label: string; value: number; limit: number; unit?: string }) {
  const pct = limit > 0 ? Math.min((value / limit) * 100, 150) : 0
  const color = pct <= 80 ? 'bg-green-500' : pct <= 100 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={pct > 100 ? 'text-red-600 font-bold' : 'text-foreground font-medium'}>
          {value}{unit} / {limit}{unit}
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

function FilterCard({ filter }: { filter: FilterRecommendation }) {
  const costColors = { low: 'text-green-600', medium: 'text-yellow-600', high: 'text-red-600' }
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm capitalize">{filter.filterType.replace('-', ' ')}</span>
        <Badge variant="outline" className={costColors[filter.estimatedCost]}>
          {filter.estimatedCost} cost
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{filter.description}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span>THD reduction:</span>
        <span className="font-medium">~{filter.estimatedReduction}%</span>
        {filter.targetHarmonics.length > 0 && (
          <>
            <span>Target orders:</span>
            <span className="font-medium">{filter.targetHarmonics.map(h => `h${h}`).join(', ')}</span>
          </>
        )}
        {filter.capacitorKVAR && (
          <>
            <span>Capacitor:</span>
            <span className="font-medium">{filter.capacitorKVAR} kVAR</span>
          </>
        )}
        {filter.tuningFrequency && (
          <>
            <span>Tuning freq:</span>
            <span className="font-medium">{filter.tuningFrequency} Hz</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function HarmonicResults({ results }: HarmonicResultsProps) {
  const { currentThd, voltageThd, compliance, filterRecommendations, alerts, derating } = results

  return (
    <div className="space-y-4">
      {/* Compliance Overview */}
      <Card className={
        compliance.overallStatus === 'compliant'
          ? 'border-green-300 dark:border-green-800'
          : compliance.overallStatus === 'non-compliant'
          ? 'border-red-300 dark:border-red-800'
          : 'border-yellow-300 dark:border-yellow-800'
      }>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {compliance.standard} Compliance
            </CardTitle>
            <StatusBadge status={compliance.overallStatus} />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <ThdGauge
            label="Current THDi"
            value={currentThd.thd}
            limit={compliance.currentCompliance.thdLimit || 8}
          />
          {voltageThd && compliance.voltageCompliance && (
            <ThdGauge
              label="Voltage THDv"
              value={voltageThd.thd}
              limit={compliance.voltageCompliance.thdLimit}
            />
          )}
          {compliance.tddCompliance && (
            <ThdGauge
              label="TDD"
              value={compliance.tddCompliance.tdd}
              limit={compliance.tddCompliance.limit}
            />
          )}
        </CardContent>
      </Card>

      {/* Current THD Summary */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Current Harmonic Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricBox label="THDi" value={`${currentThd.thd}%`} />
            <MetricBox label="RMS Current" value={`${currentThd.rms} A`} />
            <MetricBox label="Fundamental" value={`${currentThd.fundamentalRms} A`} />
            <MetricBox label="K-Factor" value={`${currentThd.kFactor}`} />
            <MetricBox label="Crest Factor" value={`${currentThd.crestFactor}`} />
            <MetricBox label="Peak" value={`${currentThd.peakValue} A`} />
          </div>

          {/* Harmonic Spectrum Bar Chart */}
          {currentThd.harmonicOrders.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Harmonic Spectrum</p>
              <div className="flex items-end gap-1 h-32">
                {currentThd.harmonicOrders.slice(0, 20).map(h => {
                  const maxMag = Math.max(...currentThd.harmonicOrders.map(o => o.magnitude))
                  const heightPct = maxMag > 0 ? (h.magnitude / maxMag) * 100 : 0
                  const barColor = h.complianceStatus === 'fail'
                    ? 'bg-red-500'
                    : h.complianceStatus === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                  return (
                    <div key={h.order} className="flex flex-col items-center flex-1 min-w-0">
                      <span className="text-[9px] text-muted-foreground mb-0.5">{h.magnitude > 0 ? `${h.magnitude}%` : ''}</span>
                      <div className={`w-full rounded-t ${barColor} transition-all`} style={{ height: `${heightPct}%`, minHeight: h.magnitude > 0 ? '2px' : '0' }} />
                      <span className="text-[9px] text-muted-foreground mt-0.5">h{h.order}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Individual Violations */}
          {compliance.currentCompliance.individualViolations.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs">
              <p className="font-medium text-red-700 dark:text-red-400 mb-1">Individual Harmonic Violations:</p>
              {compliance.currentCompliance.individualViolations.map(v => (
                <p key={v.order} className="text-red-600 dark:text-red-400">
                  h{v.order}: {v.value}% exceeds limit of {v.limit}%
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voltage THD */}
      {voltageThd && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Voltage Harmonic Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetricBox label="THDv" value={`${voltageThd.thd}%`} />
              <MetricBox label="RMS Voltage" value={`${voltageThd.rms} V`} />
              <MetricBox label="Crest Factor" value={`${voltageThd.crestFactor}`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Derating */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">Equipment Derating</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricBox label="Transformer K-Factor" value={`K-${Math.ceil(derating.transformerKFactor)}`} />
            <MetricBox
              label="Transformer Capacity"
              value={`${derating.transformerDerating}%`}
              warn={derating.transformerDerating < 85}
            />
            <MetricBox
              label="Cable Derating"
              value={`${derating.cableDerating}%`}
              warn={derating.cableDerating < 85}
            />
            <MetricBox
              label="Capacitor Stress"
              value={`+${derating.capacitorStress}%`}
              warn={derating.capacitorStress > 10}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Recommendations */}
      {filterRecommendations.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {filterRecommendations.map((f, i) => (
              <FilterCard key={i} filter={f} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base">Alerts & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-2 rounded text-xs ${
                  alert.type === 'error'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                }`}
              >
                {alert.type === 'error' ? <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> :
                 alert.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> :
                 <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Standard Reference */}
      <div className="text-xs text-muted-foreground text-center">
        Calculations per {results.compliance.standard} | v{results.version} | {new Date(results.timestamp).toLocaleString()}
      </div>
    </div>
  )
}

function MetricBox({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg border text-center ${warn ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' : 'bg-muted/30'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${warn ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>{value}</p>
    </div>
  )
}
