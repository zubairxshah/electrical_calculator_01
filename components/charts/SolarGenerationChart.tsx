/**
 * Solar Generation Chart Component
 *
 * Displays monthly energy generation profile using Recharts AreaChart
 *
 * @see specs/001-electromate-engineering-app/spec.md#US4
 */

'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface MonthlyData {
  month: string
  generation: number
}

interface SolarGenerationChartProps {
  data: MonthlyData[]
  targetDaily?: number
}

export function SolarGenerationChart({ data, targetDaily }: SolarGenerationChartProps) {
  // Calculate average for reference line
  const avgGeneration = data.reduce((sum, d) => sum + d.generation, 0) / data.length

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          className="fill-muted-foreground"
          label={{
            value: 'kWh/month',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: 11 },
            className: 'fill-muted-foreground',
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            marginBottom: '4px',
          }}
          itemStyle={{
            color: 'hsl(var(--muted-foreground))',
          }}
          formatter={(value) => value !== undefined ? [`${value.toLocaleString()} kWh`, 'Generation'] : ['', 'Generation']}
        />
        <ReferenceLine
          y={avgGeneration}
          stroke="hsl(var(--primary))"
          strokeDasharray="5 5"
          label={{
            value: `Avg: ${Math.round(avgGeneration)} kWh`,
            position: 'right',
            fill: 'hsl(var(--primary))',
            fontSize: 11,
          }}
        />
        <Area
          type="monotone"
          dataKey="generation"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#solarGradient)"
          activeDot={{
            r: 6,
            stroke: '#f59e0b',
            strokeWidth: 2,
            fill: 'hsl(var(--background))',
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
