'use client'

import { useGeneratorSizingStore } from '@/stores/useGeneratorSizingStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Wand2 } from 'lucide-react'
import { autoSequenceLoads } from '@/lib/calculations/generator-sizing/stepLoading'

export default function StepLoadingPanel() {
  const store = useGeneratorSizingStore()
  const { loads, result } = store

  if (loads.length === 0) return null

  const handleStepChange = (loadId: string, step: string) => {
    const val = step === '' ? null : parseInt(step, 10)
    store.updateLoad(loadId, { stepNumber: val && val > 0 ? val : null })
  }

  const handleAutoSequence = () => {
    const genKva = result?.recommendedGeneratorKva ?? 500
    const sequenced = autoSequenceLoads(loads, genKva)
    for (const load of sequenced) {
      store.updateLoad(load.id, { stepNumber: load.stepNumber })
    }
  }

  const hasSteps = loads.some((l) => l.stepNumber !== null)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Step Loading Sequence</CardTitle>
          <Button variant="outline" size="sm" onClick={handleAutoSequence}>
            <Wand2 className="h-4 w-4 mr-1" />
            Auto-Sequence
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Step assignment per load */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-muted-foreground">
            Assign each load to a step number (leave blank for no step assignment):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {loads.map((load) => (
              <div key={load.id} className="flex items-center gap-2">
                <span className="text-sm flex-1 truncate">{load.name || 'Unnamed'}</span>
                <Input
                  type="number"
                  min={1}
                  className="w-20"
                  placeholder="Step"
                  value={load.stepNumber ?? ''}
                  onChange={(e) => handleStepChange(load.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Step results table */}
        {result && result.stepLoadingSequence.length > 0 && (
          <div className="overflow-x-auto border-t pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2">Step</th>
                  <th className="text-left py-2">Loads</th>
                  <th className="text-right py-2">Incr. kW</th>
                  <th className="text-right py-2">Incr. kVA</th>
                  <th className="text-right py-2">Cum. kW</th>
                  <th className="text-right py-2">Cum. kVA</th>
                  <th className="text-right py-2">Loading %</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.stepLoadingSequence.map((step) => (
                  <tr
                    key={step.stepNumber}
                    className={`border-b ${
                      step.status === 'fail'
                        ? 'bg-red-50 dark:bg-red-950/20'
                        : step.status === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-950/20'
                        : ''
                    }`}
                  >
                    <td className="py-2 font-medium">{step.stepNumber}</td>
                    <td className="py-2 text-xs">{step.loadNames.join(', ')}</td>
                    <td className="text-right py-2 font-mono">{step.incrementalKw.toFixed(1)}</td>
                    <td className="text-right py-2 font-mono">{step.incrementalKva.toFixed(1)}</td>
                    <td className="text-right py-2 font-mono">{step.cumulativeKw.toFixed(1)}</td>
                    <td className="text-right py-2 font-mono">{step.cumulativeKva.toFixed(1)}</td>
                    <td className="text-right py-2 font-mono">{step.generatorLoadingPercent.toFixed(1)}%</td>
                    <td className="text-center py-2">
                      <Badge
                        variant={step.status === 'fail' ? 'destructive' : 'outline'}
                        className={
                          step.status === 'pass' ? 'bg-green-100 text-green-700 border-green-300' :
                          step.status === 'warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                          ''
                        }
                      >
                        {step.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-2">
              Warning if step increment &gt;50% of generator kVA per ISO 8528 / IEEE 3006.4
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
