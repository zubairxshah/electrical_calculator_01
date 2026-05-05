'use client'

import { useMotorStartingStore } from '@/stores/useMotorStartingStore'

function row(label: string, value: string | number, sub?: string) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b last:border-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-right">
        <div className="font-mono">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  )
}

export default function SingleMethodResults() {
  const { currentResult, selectedMethodId } = useMotorStartingStore()
  if (!currentResult) {
    return <div className="text-center text-muted-foreground p-6">Run analysis first.</div>
  }
  const m = currentResult.comparison.methods.find((x) => x.method === selectedMethodId)
              ?? currentResult.comparison.methods[0]
  if (!m) return null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{m.methodLabel}</h3>
        <p className="text-sm text-muted-foreground">Verdict: {m.verdictBadge.replaceAll('_', ' ')}</p>
      </div>

      <div className="rounded-lg border p-4 space-y-1">
        {row('Starting current (line)', `${m.startingCurrentLineAmps.toFixed(0)} A`, `${m.startingCurrentPctFla.toFixed(0)}% FLA`)}
        {row('Starting current (motor)', `${m.startingCurrentMotorAmps.toFixed(0)} A`)}
        {row('Starting torque', `${m.startingTorquePctRated.toFixed(0)}% rated`)}
        {row('Voltage at motor', `${m.voltageAtMotorPu.toFixed(3)} pu`, `${((1 - m.voltageAtMotorPu) * 100).toFixed(1)}% drop`)}
        {row('Voltage dip at PCC', `${m.voltageDipAtPccPct.toFixed(1)}%`, m.voltageDipPasses1668 ? '✓ within IEEE 1668' : '✗ exceeds limit')}
        {row('Acceleration time', isFinite(m.accelerationTimeSec) ? `${m.accelerationTimeSec.toFixed(2)} s` : '∞')}
        {row('Thermal margin', `${(m.thermalMarginRatio * 100).toFixed(0)}% of t_stall`, m.thermalVerdict)}
        {row('Torque verdict', m.torqueVerdict)}
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Notes & Citations</h4>
        <ul className="text-xs space-y-1 text-muted-foreground">
          {m.methodNotes.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border p-3 text-xs space-y-1 bg-muted/30">
        <div className="font-semibold">Source Impedance (Thevenin at motor terminals)</div>
        <div>
          R + jX (pu): <span className="font-mono">{currentResult.sourceImpedance.zTotalPu.r.toFixed(4)} + j{currentResult.sourceImpedance.zTotalPu.x.toFixed(4)}</span>
        </div>
        <div>
          R + jX (Ω): <span className="font-mono">{currentResult.sourceImpedance.zTotalOhms.r.toFixed(5)} + j{currentResult.sourceImpedance.zTotalOhms.x.toFixed(5)}</span>
        </div>
        <div>Utility: {currentResult.sourceImpedance.utilityAssumed === 'infinite_bus' ? 'Infinite bus assumed' : 'Computed from SC data'}</div>
      </div>
    </div>
  )
}
