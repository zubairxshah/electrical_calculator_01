'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Info } from 'lucide-react'
import { calculateEarthingConductor, EarthingInputs, EarthingResult } from '@/lib/calculations/earthing/earthingCalculator'
import { EarthingInputForm } from '@/components/earthing/EarthingInputForm'
import { EarthingResults } from '@/components/earthing/EarthingResults'

export function EarthingCalculatorTool() {
  const [inputs, setInputs] = useState<EarthingInputs>({
    voltage: 400,
    faultCurrent: 25,
    faultDuration: 1,
    material: 'copper',
    installationType: 'cable',
    standard: 'IEC'
  })
  
  const [result, setResult] = useState<EarthingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    try {
      setError(null)
      const calculationResult = calculateEarthingConductor(inputs)
      setResult(calculationResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed')
      setResult(null)
    }
  }

  const handleInputChange = (newInputs: Partial<EarthingInputs>) => {
    setInputs(prev => ({ ...prev, ...newInputs }))
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Earthing Conductor Calculator</h1>
        <p className="text-muted-foreground">
          Calculate earthing conductor sizes per IEC 60364-5-54 and NEC 250 standards
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          This calculator uses the formula S = I × √t / k to determine minimum earthing conductor size.
          Results comply with IEC 60364-5-54 Section 543.1.3 and NEC 250.122.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <EarthingInputForm 
            inputs={inputs}
            onChange={handleInputChange}
            onCalculate={handleCalculate}
          />
        </div>

        <div>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && <EarthingResults result={result} inputs={inputs} />}

          {!result && !error && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Enter parameters and click Calculate to see results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-12">
                  No calculation performed yet
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
