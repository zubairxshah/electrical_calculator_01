'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { EarthingResult, EarthingInputs } from '@/lib/calculations/earthing/earthingCalculator'
import { Separator } from '@/components/ui/separator'
import { EarthingPDFButton } from './EarthingPDFButton'

interface EarthingResultsProps {
  result: EarthingResult
  inputs: EarthingInputs
}

export function EarthingResults({ result, inputs }: EarthingResultsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Calculation Results
              </CardTitle>
              <CardDescription>
                Earthing conductor sizing per {inputs.standard} standard
              </CardDescription>
            </div>
            <EarthingPDFButton data={{ inputs, results }} size="sm" variant="outline" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 p-6 rounded-lg border-2 border-primary/20">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Recommended Conductor Size</p>
              <p className="text-5xl font-bold text-primary">{result.conductorSize}</p>
              <p className="text-xl text-muted-foreground mt-1">mm²</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Calculated Size</p>
              <p className="text-lg font-semibold">{result.calculatedSize.toFixed(2)} mm²</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Safety Margin</p>
              <p className="text-lg font-semibold">{result.safetyMargin.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">k-Value</p>
              <p className="text-lg font-semibold">{result.kValue}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Material</p>
              <p className="text-lg font-semibold capitalize">{inputs.material}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium">Compliance Verified</p>
            </div>
            <p className="text-sm text-muted-foreground">{result.compliance}</p>
          </div>

          {result.alternatives.smaller || result.alternatives.larger ? (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Alternative Sizes</p>
                <div className="flex gap-2">
                  {result.alternatives.smaller && (
                    <Badge variant="outline">{result.alternatives.smaller} mm²</Badge>
                  )}
                  <Badge variant="default">{result.conductorSize} mm² (Selected)</Badge>
                  {result.alternatives.larger && (
                    <Badge variant="outline">{result.alternatives.larger} mm²</Badge>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {result.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Warnings:</p>
            <ul className="list-disc list-inside space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Calculation Details
          </CardTitle>
          <CardDescription>
            Step-by-step calculation breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            {result.calculationSteps.map((step, index) => (
              <div key={index} className="text-muted-foreground">
                {step}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
