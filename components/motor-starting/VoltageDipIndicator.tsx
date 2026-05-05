'use client'

import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'

export default function VoltageDipIndicator() {
  const { currentResult } = useMotorStartingStore()
  if (!currentResult) return null
  const { comparison } = currentResult
  const data = comparison.methods.map((m) => ({
    name: m.methodLabel.split(' ')[0],
    fullName: m.methodLabel,
    dip: Number(m.voltageDipAtPccPct.toFixed(2)),
    passes: m.voltageDipPasses1668,
  }))

  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-semibold text-sm mb-3">
        Voltage Dip at PCC vs IEEE 1668 Threshold ({comparison.thresholdAppliedPct}%)
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Dip (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            formatter={(value: unknown, _name: unknown, p: { payload?: { fullName?: string } }) => [
              `${value}%`,
              p?.payload?.fullName ?? 'Dip',
            ]}
          />
          <Bar dataKey="dip">
            {data.map((d, i) => (
              <Cell key={i} fill={d.passes ? '#16a34a' : '#dc2626'} />
            ))}
          </Bar>
          <ReferenceLine y={comparison.thresholdAppliedPct} stroke="#0f172a" strokeDasharray="4 4" label={{ value: 'Threshold', position: 'right', fontSize: 12 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
