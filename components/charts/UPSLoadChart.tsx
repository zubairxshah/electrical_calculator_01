'use client';

/**
 * UPS Load Chart Component
 * Feature: 001-electromate-engineering-app
 * Task: T074 - Create components/charts/UPSLoadChart.tsx
 *
 * Displays a bar chart showing load breakdown by equipment type
 * using Recharts per ADR-004 for professional PDF exports.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import type { LoadItem } from '@/lib/validation/upsValidation';

interface UPSLoadChartProps {
  loads: LoadItem[];
  totalLoadVA: number;
  showPercentage?: boolean;
  chartType?: 'bar' | 'pie';
  className?: string;
}

// Professional engineering color palette
const CHART_COLORS = [
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#0891b2', // cyan-600
  '#4f46e5', // indigo-600
  '#be185d', // pink-700
  '#0d9488', // teal-600
  '#9333ea', // purple-600
];

interface ChartDataItem {
  name: string;
  loadVA: number;
  loadKVA: number;
  percentage: number;
  quantity: number;
  powerFactor: number;
  fill: string;
  [key: string]: string | number;
}

export function UPSLoadChart({
  loads,
  totalLoadVA,
  showPercentage = true,
  chartType = 'bar',
  className = '',
}: UPSLoadChartProps) {
  const chartData = useMemo<ChartDataItem[]>(() => {
    return loads.map((load, index) => {
      // Calculate VA per item
      let itemVA = load.powerVA ?? 0;
      if (!itemVA && load.powerWatts) {
        itemVA = load.powerWatts / (load.powerFactor ?? 0.8);
      }
      const totalItemVA = itemVA * load.quantity;

      return {
        name: load.name.length > 15 ? `${load.name.substring(0, 15)}...` : load.name,
        loadVA: totalItemVA,
        loadKVA: totalItemVA / 1000,
        percentage: totalLoadVA > 0 ? (totalItemVA / totalLoadVA) * 100 : 0,
        quantity: load.quantity,
        powerFactor: load.powerFactor ?? 0.8,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
  }, [loads, totalLoadVA]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataItem }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-gray-800">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Load: {data.loadVA.toLocaleString()} VA ({data.loadKVA.toFixed(2)} kVA)
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quantity: {data.quantity}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Power Factor: {data.powerFactor.toFixed(2)}
          </p>
          {showPercentage && (
            <p className="text-sm font-medium text-blue-600">
              {data.percentage.toFixed(1)}% of total
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataItem }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-gray-800">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.loadKVA.toFixed(2)} kVA ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loads.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg ${className}`}>
        <p className="text-gray-500">Add loads to see the distribution chart</p>
      </div>
    );
  }

  if (chartType === 'pie') {
    return (
      <div className={`h-80 ${className}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="loadVA"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percentage }) =>
                percentage > 5 ? `${name} (${percentage.toFixed(0)}%)` : ''
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={`h-80 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
          <XAxis
            type="number"
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            label={{ value: 'Load (VA)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="loadVA"
            name="Load (VA)"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Stacked Load Chart showing breakdown by power component
 */
interface UPSStackedLoadChartProps {
  loads: LoadItem[];
  diversityFactor: number;
  growthMargin: number;
  className?: string;
}

interface StackedChartData {
  name: string;
  connectedLoad: number;
  effectiveLoad: number;
  withGrowth: number;
}

export function UPSStackedLoadChart({
  loads,
  diversityFactor,
  growthMargin,
  className = '',
}: UPSStackedLoadChartProps) {
  const chartData = useMemo<StackedChartData[]>(() => {
    // Calculate total connected load
    let totalConnectedVA = 0;
    loads.forEach((load) => {
      let itemVA = load.powerVA ?? 0;
      if (!itemVA && load.powerWatts) {
        itemVA = load.powerWatts / (load.powerFactor ?? 0.8);
      }
      totalConnectedVA += itemVA * load.quantity;
    });

    const effectiveLoad = totalConnectedVA * diversityFactor;
    const withGrowth = effectiveLoad * (1 + growthMargin);

    return [
      {
        name: 'Connected Load',
        connectedLoad: totalConnectedVA / 1000,
        effectiveLoad: 0,
        withGrowth: 0,
      },
      {
        name: 'After Diversity',
        connectedLoad: 0,
        effectiveLoad: effectiveLoad / 1000,
        withGrowth: 0,
      },
      {
        name: 'With Growth',
        connectedLoad: 0,
        effectiveLoad: 0,
        withGrowth: withGrowth / 1000,
      },
    ];
  }, [loads, diversityFactor, growthMargin]);

  if (loads.length === 0) {
    return null;
  }

  return (
    <div className={`h-48 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(value) => `${value.toFixed(0)}`}
            label={{ value: 'kVA', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)} kVA`, '']}
          />
          <Bar dataKey="connectedLoad" name="Connected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="effectiveLoad" name="Effective" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="withGrowth" name="With Growth" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default UPSLoadChart;
