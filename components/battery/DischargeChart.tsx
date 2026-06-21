/**
 * Discharge curve visualization (US5) — state of charge over the backup period.
 * Uses Recharts (already a project dependency), fed by result.dischargeCurve.
 */

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DischargeCurvePoint } from '@/lib/types'

interface DischargeChartProps {
  data: DischargeCurvePoint[]
}

export function DischargeChart({ data }: DischargeChartProps) {
  if (!data || data.length === 0) return null
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="timeHours"
            tickFormatter={(v) => `${Number(v).toFixed(1)}h`}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(0)}%`, 'State of charge']}
            labelFormatter={(l) => `t = ${Number(l).toFixed(2)} h`}
          />
          <Line
            type="monotone"
            dataKey="socPercent"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
