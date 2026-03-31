'use client'

import { useGeneratorSizingStore } from '@/stores/useGeneratorSizingStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STARTING_METHOD_LABELS } from '@/lib/calculations/generator-sizing/generatorData'

export default function MotorStartingPanel() {
  const { result } = useGeneratorSizingStore()
  if (!result || result.motorStartingAnalysis.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motor Starting Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-left py-2">Motor</th>
                <th className="text-right py-2">HP</th>
                <th className="text-left py-2">Starting</th>
                <th className="text-right py-2">Starting kVA</th>
                <th className="text-right py-2">Voltage Dip</th>
                <th className="text-center py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.motorStartingAnalysis.map((ms) => (
                <tr
                  key={ms.loadId}
                  className={`border-b ${
                    !ms.passesThreshold
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : ms === result.worstCaseVoltageDip
                      ? 'bg-yellow-50 dark:bg-yellow-950/20'
                      : ''
                  }`}
                >
                  <td className="py-2">
                    {ms.motorName}
                    {ms === result.worstCaseVoltageDip && (
                      <Badge variant="outline" className="ml-2 text-xs">Worst Case</Badge>
                    )}
                  </td>
                  <td className="text-right py-2">{ms.motorHp ?? '—'}</td>
                  <td className="py-2 text-xs">
                    {STARTING_METHOD_LABELS[ms.startingMethod]} (×{ms.startingMethodMultiplier})
                  </td>
                  <td className="text-right py-2 font-mono">{ms.startingKva.toFixed(1)}</td>
                  <td className="text-right py-2 font-mono">
                    <span className={!ms.passesThreshold ? 'text-red-600 font-bold' : ''}>
                      {ms.voltageDipPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center py-2">
                    {ms.passesThreshold ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        PASS
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        FAIL (&gt;{ms.threshold}%)
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Voltage dip = (Xd&apos;&apos; &times; Starting kVA / Generator kVA) &times; 100 — per IEEE 3006.4.
          Threshold: {result.motorStartingAnalysis[0]?.threshold ?? 15}% per NFPA 110.
        </p>
      </CardContent>
    </Card>
  )
}
