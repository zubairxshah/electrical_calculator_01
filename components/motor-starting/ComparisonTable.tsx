'use client'

import { Badge } from '@/components/ui/badge'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'
import type { MethodResult, VerdictBadge } from '@/types/motor-starting'

const BADGE_COLORS: Record<VerdictBadge, string> = {
  recommended: 'bg-green-600 text-white',
  acceptable: 'bg-blue-500 text-white',
  excessive_dip: 'bg-red-600 text-white',
  insufficient_torque: 'bg-orange-600 text-white',
  thermal_risk: 'bg-yellow-600 text-white',
  not_applicable: 'bg-gray-400 text-white',
}

const BADGE_LABELS: Record<VerdictBadge, string> = {
  recommended: 'Recommended',
  acceptable: 'Acceptable',
  excessive_dip: 'Excessive Dip',
  insufficient_torque: 'Insufficient Torque',
  thermal_risk: 'Thermal Risk',
  not_applicable: 'Not Applicable',
}

function formatTime(t: number): string {
  if (!isFinite(t)) return '∞'
  return `${t.toFixed(2)} s`
}

export default function ComparisonTable() {
  const { currentResult, selectedMethodId, setSelectedMethodId } = useMotorStartingStore()
  if (!currentResult) {
    return <div className="text-center text-muted-foreground p-6">Run analysis to see comparison.</div>
  }
  const { comparison } = currentResult

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 bg-muted/40">
        <div className="text-sm font-semibold mb-1">Recommendation</div>
        <p className="text-sm leading-relaxed">{comparison.recommendationRationale}</p>
        <div className="text-xs text-muted-foreground mt-2">
          Threshold applied: <span className="font-mono">{comparison.thresholdAppliedPct}%</span> ({comparison.thresholdScenario})
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left p-3">Method</th>
              <th className="text-right p-3">Start I (% FLA)</th>
              <th className="text-right p-3">Start T (% rated)</th>
              <th className="text-right p-3">Dip @ PCC</th>
              <th className="text-right p-3">Accel</th>
              <th className="text-left p-3">Cost</th>
              <th className="text-left p-3">Complexity</th>
              <th className="text-left p-3">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {comparison.methods.map((m) => (
              <Row
                key={m.method}
                m={m}
                isRecommended={m.method === comparison.recommendedMethod}
                isSelected={m.method === selectedMethodId}
                onClick={() => setSelectedMethodId(m.method)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ m, isRecommended, isSelected, onClick }: {
  m: MethodResult; isRecommended: boolean; isSelected: boolean; onClick: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-t hover:bg-muted/30 ${
        isRecommended ? 'bg-green-50 dark:bg-green-950/30' : ''
      } ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
    >
      <td className="p-3 font-medium">{m.methodLabel}</td>
      <td className="p-3 text-right font-mono">{m.startingCurrentPctFla.toFixed(0)}%</td>
      <td className="p-3 text-right font-mono">{m.startingTorquePctRated.toFixed(0)}%</td>
      <td className="p-3 text-right font-mono">{m.voltageDipAtPccPct.toFixed(1)}%</td>
      <td className="p-3 text-right font-mono">{formatTime(m.accelerationTimeSec)}</td>
      <td className="p-3 capitalize">{m.qualitativeCost.replace('_', ' ')}</td>
      <td className="p-3 capitalize">{m.qualitativeComplexity}</td>
      <td className="p-3">
        <Badge className={BADGE_COLORS[m.verdictBadge]}>
          {BADGE_LABELS[m.verdictBadge]}
        </Badge>
      </td>
    </tr>
  )
}
