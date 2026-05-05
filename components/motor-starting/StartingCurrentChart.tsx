'use client'

import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c']

export default function StartingCurrentChart() {
  const { currentResult } = useMotorStartingStore()
  if (!currentResult) return null

  // Build a per-time series per method, plus thermal limit reference.
  const allTimes = new Set<number>()
  currentResult.comparison.methods.forEach((m) =>
    m.currentVsTime.forEach((s) => allTimes.add(Number(s.tSec.toFixed(2)))),
  )
  const sortedTimes = Array.from(allTimes).sort((a, b) => a - b)

  const data = sortedTimes.map((t) => {
    const row: Record<string, number> = { tSec: t }
    currentResult.comparison.methods.forEach((m) => {
      const sample = m.currentVsTime.find((s) => Number(s.tSec.toFixed(2)) === t)
      if (sample) row[m.methodLabel] = sample.iAmps
    })
    return row
  })

  const stallHot =
    currentResult.input.motor.stallTimeHotSec ??
    10 // fall back to a reasonable default for the line marker
  const fla = currentResult.input.motor.ratedCurrent

  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-semibold text-sm mb-3">Starting Current vs Time</h4>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="tSec" label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {currentResult.comparison.methods.map((m, i) => (
            <Line
              key={m.method}
              type="monotone"
              dataKey={m.methodLabel}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
          <ReferenceLine y={fla} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'FLA', position: 'right', fontSize: 12 }} />
          <ReferenceLine x={stallHot} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 't_stall(hot)', position: 'top', fontSize: 12 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
