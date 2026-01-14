'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EarthingInputs } from '@/lib/calculations/earthing/earthingCalculator'

interface EarthingInputFormProps {
  inputs: EarthingInputs
  onChange: (inputs: Partial<EarthingInputs>) => void
  onCalculate: () => void
}

export function EarthingInputForm({ inputs, onChange, onCalculate }: EarthingInputFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Parameters</CardTitle>
        <CardDescription>
          Enter system parameters for earthing conductor sizing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="voltage">System Voltage (V)</Label>
              <Input
                id="voltage"
                type="number"
                value={inputs.voltage}
                onChange={(e) => onChange({ voltage: parseFloat(e.target.value) })}
                placeholder="400"
              />
              <p className="text-xs text-muted-foreground">Range: 1V to 1000kV</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faultCurrent">Fault Current (kA)</Label>
              <Input
                id="faultCurrent"
                type="number"
                value={inputs.faultCurrent}
                onChange={(e) => onChange({ faultCurrent: parseFloat(e.target.value) })}
                placeholder="25"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">Range: 0.1kA to 200kA</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faultDuration">Fault Duration (s)</Label>
              <Input
                id="faultDuration"
                type="number"
                value={inputs.faultDuration}
                onChange={(e) => onChange({ faultDuration: parseFloat(e.target.value) })}
                placeholder="1"
                step="0.1"
              />
              <p className="text-xs text-muted-foreground">Range: 0.1s to 5s</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Conductor Material</Label>
              <Select
                value={inputs.material}
                onValueChange={(value) => onChange({ material: value as any })}
              >
                <SelectTrigger id="material">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="copper">Copper</SelectItem>
                  <SelectItem value="aluminum">Aluminum</SelectItem>
                  <SelectItem value="steel">Steel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installationType">Installation Type</Label>
              <Select
                value={inputs.installationType}
                onValueChange={(value) => onChange({ installationType: value as any })}
              >
                <SelectTrigger id="installationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cable">Cable (Insulated)</SelectItem>
                  <SelectItem value="bare">Bare Conductor</SelectItem>
                  <SelectItem value="strip">Strip Conductor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="standard">Standard</Label>
              <Select
                value={inputs.standard}
                onValueChange={(value) => onChange({ standard: value as any })}
              >
                <SelectTrigger id="standard">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IEC">IEC 60364-5-54</SelectItem>
                  <SelectItem value="NEC">NEC 250</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="safetyFactor">Safety Factor (%)</Label>
              <Input
                id="safetyFactor"
                type="number"
                value={inputs.safetyFactor ?? ''}
                onChange={(e) => onChange({ safetyFactor: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0"
                step="1"
              />
              <p className="text-xs text-muted-foreground">
                Additional margin above minimum requirement (0-100%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambientTemp">Ambient Temperature (°C)</Label>
              <Input
                id="ambientTemp"
                type="number"
                value={inputs.ambientTemp || ''}
                onChange={(e) => onChange({ ambientTemp: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">Range: -40°C to 85°C (optional)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="soilResistivity">Soil Resistivity (Ω·m)</Label>
              <Input
                id="soilResistivity"
                type="number"
                value={inputs.soilResistivity || ''}
                onChange={(e) => onChange({ soilResistivity: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">Range: 1 to 10,000 Ω·m (optional)</p>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={onCalculate} className="w-full mt-6" size="lg">
          Calculate Conductor Size
        </Button>
      </CardContent>
    </Card>
  )
}
