'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, AlertTriangle } from 'lucide-react';

/**
 * System type for power calculations
 */
export type SystemType = 'single-phase' | 'three-phase';

/**
 * Form values for power calculation
 */
export interface PowerCalculationFormValues {
  systemType: SystemType;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency?: 50 | 60;
}

interface CalculatorFormProps {
  onCalculate: (values: PowerCalculationFormValues) => void;
  isCalculating?: boolean;
  initialValues?: Partial<PowerCalculationFormValues>;
}

/**
 * Power Calculator Form Component
 * Provides input fields for system parameters
 */
export function CalculatorForm({
  onCalculate,
  isCalculating = false,
  initialValues,
}: CalculatorFormProps) {
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<PowerCalculationFormValues>({
    systemType: initialValues?.systemType || 'single-phase',
    voltage: initialValues?.voltage || 230,
    current: initialValues?.current || 20,
    powerFactor: initialValues?.powerFactor || 0.9,
    frequency: (initialValues?.frequency as 50 | 60) || 50,
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.voltage < 100 || formData.voltage > 1000) {
      newErrors.voltage = 'Voltage must be between 100V and 1000V per IEC 60038';
    }

    if (formData.current < 0.1 || formData.current > 10000) {
      newErrors.current = 'Current must be between 0.1A and 10,000A';
    }

    if (formData.powerFactor < 0.1 || formData.powerFactor > 1.0) {
      newErrors.powerFactor = 'Power factor must be between 0.1 and 1.0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const newWarnings: string[] = [];

    if (formData.powerFactor < 0.85) {
      newWarnings.push(`Low power factor (${formData.powerFactor}) - consider correction`);
    }

    if (formData.current > 1000) {
      newWarnings.push(`High current (${formData.current}A) - verify conductor sizing`);
    }

    setWarnings(newWarnings);
    onCalculate(formData);
  };

  const handleReset = () => {
    setFormData({
      systemType: 'single-phase',
      voltage: 230,
      current: 20,
      powerFactor: 0.9,
      frequency: 50,
    });
    setErrors({});
    setWarnings([]);
  };

  const updateField = <K extends keyof PowerCalculationFormValues>(
    field: K,
    value: PowerCalculationFormValues[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* System Type */}
          <div className="space-y-2">
            <Label htmlFor="systemType">System Type</Label>
            <Select
              value={formData.systemType}
              onValueChange={(v) => updateField('systemType', v as SystemType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select system type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-phase">Single-Phase (1Φ)</SelectItem>
                <SelectItem value="three-phase">Three-Phase (3Φ)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Voltage */}
          <div className="space-y-2">
            <Label htmlFor="voltage">Voltage (V)</Label>
            <Input
              id="voltage"
              type="number"
              value={formData.voltage}
              onChange={(e) => updateField('voltage', Number(e.target.value))}
              placeholder="230"
            />
            {errors.voltage && (
              <p className="text-sm text-destructive">{errors.voltage}</p>
            )}
          </div>

          {/* Current */}
          <div className="space-y-2">
            <Label htmlFor="current">Current (A)</Label>
            <Input
              id="current"
              type="number"
              value={formData.current}
              onChange={(e) => updateField('current', Number(e.target.value))}
              placeholder="20"
            />
            {errors.current && (
              <p className="text-sm text-destructive">{errors.current}</p>
            )}
          </div>

          {/* Power Factor */}
          <div className="space-y-2">
            <Label htmlFor="powerFactor">Power Factor (cosφ)</Label>
            <Input
              id="powerFactor"
              type="number"
              step="0.01"
              min="0.1"
              max="1.0"
              value={formData.powerFactor}
              onChange={(e) => updateField('powerFactor', Number(e.target.value))}
              placeholder="0.9"
            />
            {errors.powerFactor && (
              <p className="text-sm text-destructive">{errors.powerFactor}</p>
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency (Hz)</Label>
            <Select
              value={String(formData.frequency)}
              onValueChange={(v) => updateField('frequency', Number(v) as 50 | 60)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 Hz (Europe, Asia, Africa)</SelectItem>
                <SelectItem value="60">60 Hz (North America)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isCalculating}
            >
              <Zap className="mr-2 h-4 w-4" />
              {isCalculating ? 'Calculating...' : 'Calculate Power'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
