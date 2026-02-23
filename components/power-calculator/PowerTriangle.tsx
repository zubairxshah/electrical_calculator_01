'use client';

import { PowerTriangleData } from '@/models/PowerCalculationResult';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PowerTriangleProps {
  data: PowerTriangleData;
}

/**
 * Power Triangle Visualization Component
 * Displays the relationship between P, Q, and S using SVG
 */
export function PowerTriangle({ data }: PowerTriangleProps) {
  const { p, q, s, angle, powerFactor } = data;

  // SVG dimensions
  const width = 300;
  const height = 250;
  const padding = 40;
  const maxX = width - padding * 2;
  const maxY = height - padding * 2;

  // Scale factors to fit the triangle in the SVG
  const maxVal = Math.max(p, q, s);
  const scale = maxVal > 0 ? Math.min(maxX / maxVal, maxY / maxVal) * 0.8 : 1;

  // Calculate coordinates
  const originX = padding;
  const originY = height - padding;

  // P (Active Power) - horizontal axis
  const pX = originX + p * scale;
  const pY = originY;

  // Q (Reactive Power) - vertical axis
  const qX = originX + p * scale;
  const qY = originY - q * scale;

  // S (Apparent Power) - hypotenuse endpoint
  const sX = qX;
  const sY = qY;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Power Triangle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <svg
            width={width}
            height={height}
            className="border rounded-lg bg-white"
            viewBox={`0 0 ${width} ${height}`}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e5e5" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#grid)" />

            {/* Axes */}
            <line
              x1={padding}
              y1={originY}
              x2={width - padding}
              y2={originY}
              stroke="#666"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            <line
              x1={originX}
              y1={originY}
              x2={originX}
              y2={padding}
              stroke="#666"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
              </marker>
            </defs>

            {/* P (Active Power) - horizontal */}
            <line
              x1={originX}
              y1={originY}
              x2={pX}
              y2={pY}
              stroke="#22c55e"
              strokeWidth="3"
            />
            <text x={(originX + pX) / 2} y={originY + 20} textAnchor="middle" className="fill-green-600 text-sm font-medium">
              P = {p.toFixed(2)} kW
            </text>

            {/* Q (Reactive Power) - vertical */}
            <line
              x1={qX}
              y1={originY}
              x2={qX}
              y2={qY}
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
            <text x={qX + 10} y={(originY + qY) / 2} className="fill-blue-600 text-sm font-medium">
              Q = {q.toFixed(2)} kVAR
            </text>

            {/* S (Apparent Power) - hypotenuse */}
            <line
              x1={originX}
              y1={originY}
              x2={sX}
              y2={sY}
              stroke="#f97316"
              strokeWidth="3"
            />
            <text x={(originX + sX) / 2 - 10} y={(originY + sY) / 2 - 10} className="fill-orange-600 text-sm font-medium">
              S = {s.toFixed(2)} kVA
            </text>

            {/* Angle arc */}
            <path
              d={`M ${originX + 30} ${originY} A 30 30 0 0 0 ${originX + 30 * Math.cos(-angle * Math.PI / 180)} ${originY + 30 * Math.sin(-angle * Math.PI / 180)}`}
              fill="none"
              stroke="#999"
              strokeWidth="1"
            />
            <text x={originX + 40} y={originY - 10} className="fill-gray-600 text-xs">
              φ = {angle.toFixed(1)}°
            </text>

            {/* Axis labels */}
            <text x={width - padding - 10} y={originY + 20} textAnchor="end" className="fill-gray-600 text-xs">
              Active Power (kW) →
            </text>
            <text x={originX - 10} y={padding} textAnchor="end" className="fill-gray-600 text-xs">
              ↑ Reactive Power (kVAR)
            </text>

            {/* Origin label */}
            <text x={originX - 10} y={originY + 20} textAnchor="end" className="fill-gray-500 text-xs">
              0
            </text>
          </svg>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 rounded"></div>
              <span className="text-green-700">Active (P)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-blue-500 rounded" style={{ borderStyle: 'dashed' }}></div>
              <span className="text-blue-700">Reactive (Q)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-orange-500 rounded"></div>
              <span className="text-orange-700">Apparent (S)</span>
            </div>
          </div>

          {/* Power Factor Display */}
          <div className="mt-4 p-3 bg-muted rounded-lg w-full text-center">
            <div className="text-sm text-muted-foreground">Power Factor</div>
            <div className="text-2xl font-bold">{powerFactor.toFixed(3)}</div>
            <div className="text-xs text-muted-foreground">cos({angle.toFixed(1)}°)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
