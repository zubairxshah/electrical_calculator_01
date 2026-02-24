'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, Activity, TrendingUp, RotateCcw, Layers, Gauge, Waves, CircleDot, Calculator } from 'lucide-react';

/**
 * Basic Electrical Calculations Page
 * 
 * Individual calculator sections for each electrical parameter:
 * - Current (I), Voltage (V), Power (P), Resistance (R)
 * - Reactance (X), Impedance (Z), Ampacity, RMS
 * - Capacitance (C), Inductance (L)
 * - Series/Parallel Combinations
 */

// ============ CURRENT CALCULATOR ============
const CurrentCalculator: React.FC = () => {
  const [voltage, setVoltage] = useState<string>('');
  const [resistance, setResistance] = useState<string>('');
  const [power, setPower] = useState<string>('');
  const [powerFactor, setPowerFactor] = useState<string>('1');
  const [result, setResult] = useState<number | null>(null);

  const calculateCurrent = () => {
    const V = parseFloat(voltage);
    const R = parseFloat(resistance);
    const P = parseFloat(power);
    const PF = parseFloat(powerFactor);

    let I: number | null = null;

    // Method 1: I = V / R (Ohm's Law)
    if (V && R) {
      I = V / R;
    }
    // Method 2: I = P / (V × PF)
    else if (P && V) {
      I = P / (V * PF);
    }
    // Method 3: I = √(P / R)
    else if (P && R) {
      I = Math.sqrt(P / R);
    }

    setResult(I);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Current (I) Calculator
        </CardTitle>
        <CardDescription>Calculate current in amperes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="i-voltage">Voltage (V)</Label>
            <Input
              id="i-voltage"
              type="number"
              placeholder="230"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i-resistance">Resistance (Ω)</Label>
            <Input
              id="i-resistance"
              type="number"
              placeholder="10"
              value={resistance}
              onChange={(e) => setResistance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i-power">Power (W)</Label>
            <Input
              id="i-power"
              type="number"
              placeholder="1000"
              value={power}
              onChange={(e) => setPower(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i-pf">Power Factor</Label>
            <Input
              id="i-pf"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={powerFactor}
              onChange={(e) => setPowerFactor(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={calculateCurrent} className="w-full">
          Calculate Current
        </Button>
        {result !== null && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-800">Result:</div>
            <div className="text-2xl font-bold text-green-900">
              I = {result.toFixed(4)} A
            </div>
            {voltage && resistance && (
              <div className="text-xs text-green-700 mt-1">
                Formula: I = V / R (Ohm's Law)
              </div>
            )}
            {power && voltage && (
              <div className="text-xs text-green-700 mt-1">
                Formula: I = P / (V × cosφ)
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ VOLTAGE CALCULATOR ============
const VoltageCalculator: React.FC = () => {
  const [current, setCurrent] = useState<string>('');
  const [resistance, setResistance] = useState<string>('');
  const [power, setPower] = useState<string>('');
  const [powerFactor, setPowerFactor] = useState<string>('1');
  const [result, setResult] = useState<number | null>(null);

  const calculateVoltage = () => {
    const I = parseFloat(current);
    const R = parseFloat(resistance);
    const P = parseFloat(power);
    const PF = parseFloat(powerFactor);

    let V: number | null = null;

    // Method 1: V = I × R (Ohm's Law)
    if (I && R) {
      V = I * R;
    }
    // Method 2: V = P / (I × PF)
    else if (P && I) {
      V = P / (I * PF);
    }
    // Method 3: V = √(P × R)
    else if (P && R) {
      V = Math.sqrt(P * R);
    }

    setResult(V);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Voltage (V) Calculator
        </CardTitle>
        <CardDescription>Calculate voltage in volts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="v-current">Current (A)</Label>
            <Input
              id="v-current"
              type="number"
              placeholder="10"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-resistance">Resistance (Ω)</Label>
            <Input
              id="v-resistance"
              type="number"
              placeholder="10"
              value={resistance}
              onChange={(e) => setResistance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-power">Power (W)</Label>
            <Input
              id="v-power"
              type="number"
              placeholder="1000"
              value={power}
              onChange={(e) => setPower(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-pf">Power Factor</Label>
            <Input
              id="v-pf"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={powerFactor}
              onChange={(e) => setPowerFactor(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={calculateVoltage} className="w-full">
          Calculate Voltage
        </Button>
        {result !== null && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">Result:</div>
            <div className="text-2xl font-bold text-blue-900">
              V = {result.toFixed(4)} V
            </div>
            {current && resistance && (
              <div className="text-xs text-blue-700 mt-1">
                Formula: V = I × R (Ohm's Law)
              </div>
            )}
            {power && current && (
              <div className="text-xs text-blue-700 mt-1">
                Formula: V = P / (I × cosφ)
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ POWER CALCULATOR ============
const PowerCalculator: React.FC = () => {
  const [voltage, setVoltage] = useState<string>('');
  const [current, setCurrent] = useState<string>('');
  const [resistance, setResistance] = useState<string>('');
  const [powerFactor, setPowerFactor] = useState<string>('1');
  const [result, setResult] = useState<{ active: number; reactive: number; apparent: number } | null>(null);

  const calculatePower = () => {
    const V = parseFloat(voltage);
    const I = parseFloat(current);
    const R = parseFloat(resistance);
    const PF = parseFloat(powerFactor);

    let P = 0, Q = 0, S = 0;

    // Method 1: P = V × I × PF
    if (V && I) {
      S = V * I;
      P = S * PF;
      Q = S * Math.sin(Math.acos(PF));
    }
    // Method 2: P = I² × R
    else if (I && R) {
      P = I * I * R;
      S = P / PF;
      Q = Math.sqrt(S * S - P * P);
    }
    // Method 3: P = V² / R
    else if (V && R) {
      P = (V * V) / R;
      S = P / PF;
      Q = Math.sqrt(S * S - P * P);
    }

    setResult({ active: P, reactive: Q, apparent: S });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Power (P) Calculator
        </CardTitle>
        <CardDescription>Calculate Active, Reactive & Apparent Power</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="p-voltage">Voltage (V)</Label>
            <Input
              id="p-voltage"
              type="number"
              placeholder="230"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-current">Current (A)</Label>
            <Input
              id="p-current"
              type="number"
              placeholder="10"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-resistance">Resistance (Ω)</Label>
            <Input
              id="p-resistance"
              type="number"
              placeholder="10"
              value={resistance}
              onChange={(e) => setResistance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-pf">Power Factor</Label>
            <Input
              id="p-pf"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={powerFactor}
              onChange={(e) => setPowerFactor(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={calculatePower} className="w-full">
          Calculate Power
        </Button>
        {result && (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">Active Power (P):</div>
              <div className="text-xl font-bold text-green-900">
                {result.active.toFixed(2)} W {(result.active / 1000).toFixed(4)} kW
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">Reactive Power (Q):</div>
              <div className="text-xl font-bold text-blue-900">
                {result.reactive.toFixed(2)} VAR {(result.reactive / 1000).toFixed(4)} kVAR
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-800">Apparent Power (S):</div>
              <div className="text-xl font-bold text-orange-900">
                {result.apparent.toFixed(2)} VA {(result.apparent / 1000).toFixed(4)} kVA
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ RESISTANCE CALCULATOR ============
const ResistanceCalculator: React.FC = () => {
  const [voltage, setVoltage] = useState<string>('');
  const [current, setCurrent] = useState<string>('');
  const [power, setPower] = useState<string>('');
  const [resistivity, setResistivity] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const calculateResistance = () => {
    const V = parseFloat(voltage);
    const I = parseFloat(current);
    const P = parseFloat(power);
    const ρ = parseFloat(resistivity);
    const L = parseFloat(length);
    const A = parseFloat(area);

    let R: number | null = null;

    // Method 1: R = V / I (Ohm's Law)
    if (V && I) {
      R = V / I;
    }
    // Method 2: R = V² / P
    else if (V && P) {
      R = (V * V) / P;
    }
    // Method 3: R = P / I²
    else if (P && I) {
      R = P / (I * I);
    }
    // Method 4: R = ρ × L / A (Resistivity formula)
    else if (ρ && L && A) {
      R = (ρ * L) / A;
    }

    setResult(R);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Resistance (R) Calculator
        </CardTitle>
        <CardDescription>Calculate resistance in ohms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Method 1: Ohm's Law</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-voltage">Voltage (V)</Label>
              <Input
                id="r-voltage"
                type="number"
                placeholder="230"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-current">Current (A)</Label>
              <Input
                id="r-current"
                type="number"
                placeholder="10"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Method 2: Power Formula</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-power">Power (W)</Label>
              <Input
                id="r-power"
                type="number"
                placeholder="1000"
                value={power}
                onChange={(e) => setPower(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-voltage2">Voltage (V)</Label>
              <Input
                id="r-voltage2"
                type="number"
                placeholder="230"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Method 3: Resistivity (R = ρL/A)</Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="r-rho">Resistivity ρ (Ω·m)</Label>
              <Input
                id="r-rho"
                type="number"
                placeholder="1.68e-8"
                value={resistivity}
                onChange={(e) => setResistivity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-length">Length (m)</Label>
              <Input
                id="r-length"
                type="number"
                placeholder="100"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-area">Area (m²)</Label>
              <Input
                id="r-area"
                type="number"
                placeholder="1e-6"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button onClick={calculateResistance} className="w-full">
          Calculate Resistance
        </Button>
        {result !== null && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-800">Result:</div>
            <div className="text-2xl font-bold text-red-900">
              R = {result.toFixed(6)} Ω
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ REACTANCE CALCULATOR ============
const ReactanceCalculator: React.FC = () => {
  const [frequency, setFrequency] = useState<string>('50');
  const [inductance, setInductance] = useState<string>('');
  const [capacitance, setCapacitance] = useState<string>('');
  const [result, setResult] = useState<{ xl?: number; xc?: number; net?: number } | null>(null);

  const calculateReactance = () => {
    const f = parseFloat(frequency);
    const L = parseFloat(inductance);
    const C = parseFloat(capacitance);

    const result: { xl?: number; xc?: number; net?: number } = {};

    // Inductive Reactance: X_L = 2πfL
    if (f && L) {
      result.xl = 2 * Math.PI * f * L;
    }

    // Capacitive Reactance: X_C = 1 / (2πfC)
    if (f && C) {
      result.xc = 1 / (2 * Math.PI * f * C);
    }

    // Net Reactance: X = X_L - X_C
    if (result.xl !== undefined && result.xc !== undefined) {
      result.net = result.xl - result.xc;
    } else if (result.xl !== undefined) {
      result.net = result.xl;
    } else if (result.xc !== undefined) {
      result.net = -result.xc;
    }

    setResult(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="h-5 w-5" />
          Reactance (X) Calculator
        </CardTitle>
        <CardDescription>Calculate inductive and capacitive reactance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="x-frequency">Frequency (Hz)</Label>
          <Input
            id="x-frequency"
            type="number"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="x-inductance">Inductance (H)</Label>
          <Input
            id="x-inductance"
            type="number"
            placeholder="0.1"
            value={inductance}
            onChange={(e) => setInductance(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="x-capacitance">Capacitance (F)</Label>
          <Input
            id="x-capacitance"
            type="number"
            placeholder="0.0001"
            value={capacitance}
            onChange={(e) => setCapacitance(e.target.value)}
          />
        </div>
        <Button onClick={calculateReactance} className="w-full">
          Calculate Reactance
        </Button>
        {result && (
          <div className="space-y-2">
            {result.xl !== undefined && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-800">Inductive Reactance (X_L):</div>
                <div className="text-xl font-bold text-purple-900">
                  {result.xl.toFixed(4)} Ω
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  Formula: X_L = 2πfL
                </div>
              </div>
            )}
            {result.xc !== undefined && (
              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="text-sm text-cyan-800">Capacitive Reactance (X_C):</div>
                <div className="text-xl font-bold text-cyan-900">
                  {result.xc.toFixed(4)} Ω
                </div>
                <div className="text-xs text-cyan-700 mt-1">
                  Formula: X_C = 1 / (2πfC)
                </div>
              </div>
            )}
            {result.net !== undefined && (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-sm text-indigo-800">Net Reactance (X):</div>
                <div className="text-xl font-bold text-indigo-900">
                  {result.net.toFixed(4)} Ω {result.net < 0 ? '(capacitive)' : result.net > 0 ? '(inductive)' : ''}
                </div>
                <div className="text-xs text-indigo-700 mt-1">
                  Formula: X = X_L - X_C
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ IMPEDANCE CALCULATOR ============
const ImpedanceCalculator: React.FC = () => {
  const [resistance, setResistance] = useState<string>('');
  const [reactance, setReactance] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const calculateImpedance = () => {
    const R = parseFloat(resistance);
    const X = parseFloat(reactance);

    if (R || X) {
      const Z = Math.sqrt(R * R + X * X);
      setResult(Z);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Impedance (Z) Calculator
        </CardTitle>
        <CardDescription>Calculate total impedance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="z-resistance">Resistance (Ω)</Label>
            <Input
              id="z-resistance"
              type="number"
              placeholder="10"
              value={resistance}
              onChange={(e) => setResistance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="z-reactance">Reactance (Ω)</Label>
            <Input
              id="z-reactance"
              type="number"
              placeholder="15"
              value={reactance}
              onChange={(e) => setReactance(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={calculateImpedance} className="w-full">
          Calculate Impedance
        </Button>
        {result !== null && (
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="text-sm text-indigo-800">Result:</div>
            <div className="text-2xl font-bold text-indigo-900">
              Z = {result.toFixed(4)} Ω
            </div>
            <div className="text-xs text-indigo-700 mt-1">
              Formula: Z = √(R² + X²)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ AMPACITY CALCULATOR ============
const AmpacityCalculator: React.FC = () => {
  const [conductorSize, setConductorSize] = useState<string>('');
  const [material, setMaterial] = useState<string>('copper');
  const [insulation, setInsulation] = useState<string>('90');
  const [standard, setStandard] = useState<string>('IEC');
  const [result, setResult] = useState<number | null>(null);

  // Simplified ampacity tables (A)
  const ampacityTables: Record<string, Record<string, Record<string, Record<string, number>>>> = {
    IEC: {
      copper: { 
        '70': { '1.5': 17.5, '2.5': 24, '4': 32, '6': 41, '10': 57, '16': 76, '25': 101, '35': 126, '50': 153, '70': 196, '95': 238, '120': 276 },
        '90': { '1.5': 19.5, '2.5': 27, '4': 36, '6': 46, '10': 63, '16': 85, '25': 112, '35': 139, '50': 168, '70': 213, '95': 258, '120': 299 } 
      },
      aluminum: { 
        '70': { '16': 59, '25': 78, '35': 97, '50': 119, '70': 151, '95': 185, '120': 213 },
        '90': { '16': 66, '25': 87, '35': 108, '50': 132, '70': 168, '95': 205, '120': 236 } 
      }
    },
    NEC: {
      copper: { 
        '60': { '14': 15, '12': 20, '10': 30, '8': 40, '6': 55, '4': 70, '3': 85, '2': 95, '1': 110 },
        '75': { '14': 20, '12': 25, '10': 35, '8': 50, '6': 65, '4': 85, '3': 100, '2': 115, '1': 130 },
        '90': { '14': 25, '12': 30, '10': 40, '8': 60, '6': 75, '4': 95, '3': 115, '2': 130, '1': 145 } 
      },
      aluminum: { 
        '75': { '12': 20, '10': 30, '8': 40, '6': 50, '4': 65, '3': 75, '2': 90, '1': 100 },
        '90': { '12': 25, '10': 35, '8': 45, '6': 60, '4': 75, '3': 85, '2': 100, '1': 115 } 
      }
    }
  };

  const calculateAmpacity = () => {
    const size = conductorSize;
    const mat = material;
    const ins = insulation;
    const std = standard;

    try {
      const table = ampacityTables[std]?.[mat]?.[ins];
      if (table && size && table[size]) {
        setResult(table[size]);
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Ampacity Calculator
        </CardTitle>
        <CardDescription>Conductor current capacity per NEC/IEC</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amp-standard">Standard</Label>
            <select
              id="amp-standard"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
            >
              <option value="IEC">IEC 60364</option>
              <option value="NEC">NEC Article 310</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amp-material">Material</Label>
            <select
              id="amp-material"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            >
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amp-insulation">Insulation Temp (°C)</Label>
            <select
              id="amp-insulation"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={insulation}
              onChange={(e) => setInsulation(e.target.value)}
            >
              {standard === 'IEC' ? (
                <>
                  <option value="70">70°C (PVC)</option>
                  <option value="90">90°C (XLPE)</option>
                </>
              ) : (
                <>
                  <option value="60">60°C</option>
                  <option value="75">75°C</option>
                  <option value="90">90°C</option>
                </>
              )}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amp-size">
              Conductor Size ({standard === 'IEC' ? 'mm²' : 'AWG'})
            </Label>
            <select
              id="amp-size"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={conductorSize}
              onChange={(e) => setConductorSize(e.target.value)}
            >
              <option value="">Select size</option>
              {standard === 'IEC' ? (
                <>
                  <option value="1.5">1.5 mm²</option>
                  <option value="2.5">2.5 mm²</option>
                  <option value="4">4 mm²</option>
                  <option value="6">6 mm²</option>
                  <option value="10">10 mm²</option>
                  <option value="16">16 mm²</option>
                  <option value="25">25 mm²</option>
                  <option value="35">35 mm²</option>
                  <option value="50">50 mm²</option>
                  <option value="70">70 mm²</option>
                  <option value="95">95 mm²</option>
                  <option value="120">120 mm²</option>
                </>
              ) : (
                <>
                  <option value="14">14 AWG</option>
                  <option value="12">12 AWG</option>
                  <option value="10">10 AWG</option>
                  <option value="8">8 AWG</option>
                  <option value="6">6 AWG</option>
                  <option value="4">4 AWG</option>
                  <option value="3">3 AWG</option>
                  <option value="2">2 AWG</option>
                  <option value="1">1 AWG</option>
                </>
              )}
            </select>
          </div>
        </div>
        <Button onClick={calculateAmpacity} className="w-full" disabled={!conductorSize}>
          Calculate Ampacity
        </Button>
        {result !== null && (
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="text-sm text-emerald-800">Result:</div>
            <div className="text-2xl font-bold text-emerald-900">
              Ampacity = {result} A
            </div>
            <div className="text-xs text-emerald-700 mt-1">
              Per {standard === 'IEC' ? 'IEC 60364-5-52' : 'NEC Article 310.15'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ RMS CALCULATOR ============
const RMSCalculator: React.FC = () => {
  const [peakValue, setPeakValue] = useState<string>('');
  const [rmsType, setRmsType] = useState<string>('voltage');
  const [result, setResult] = useState<number | null>(null);

  const calculateRMS = () => {
    const Vp = parseFloat(peakValue);

    if (Vp) {
      // V_rms = V_peak / √2 for sinusoidal waveforms
      const Vrms = Vp / Math.sqrt(2);
      setResult(Vrms);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="h-5 w-5" />
          RMS Calculator
        </CardTitle>
        <CardDescription>Calculate RMS value from peak</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rms-type">Quantity Type</Label>
          <select
            id="rms-type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={rmsType}
            onChange={(e) => setRmsType(e.target.value)}
          >
            <option value="voltage">Voltage</option>
            <option value="current">Current</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rms-peak">Peak Value ({rmsType === 'voltage' ? 'V' : 'A'})</Label>
          <Input
            id="rms-peak"
            type="number"
            placeholder="325"
            value={peakValue}
            onChange={(e) => setPeakValue(e.target.value)}
          />
        </div>
        <Button onClick={calculateRMS} className="w-full">
          Calculate RMS
        </Button>
        {result !== null && (
          <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <div className="text-sm text-cyan-800">Result:</div>
            <div className="text-2xl font-bold text-cyan-900">
              {rmsType === 'voltage' ? 'V' : 'I'}_rms = {result.toFixed(4)} {rmsType === 'voltage' ? 'V' : 'A'}
            </div>
            <div className="text-xs text-cyan-700 mt-1">
              Formula: {rmsType === 'voltage' ? 'V' : 'I'}_rms = {rmsType === 'voltage' ? 'V' : 'I'}_peak / √2
            </div>
            <div className="text-xs text-cyan-700 mt-1">
              Standard: IEC 60038
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ CAPACITANCE CALCULATOR ============
const CapacitanceCalculator: React.FC = () => {
  const [dielectricConstant, setDielectricConstant] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const calculateCapacitance = () => {
    const εr = parseFloat(dielectricConstant);
    const A = parseFloat(area);
    const d = parseFloat(distance);

    if (εr && A && d) {
      const ε0 = 8.854e-12; // Vacuum permittivity (F/m)
      const C = (ε0 * εr * A) / d;
      setResult(C);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDot className="h-5 w-5" />
          Capacitance (C) Calculator
        </CardTitle>
        <CardDescription>Calculate capacitance from physical parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="c-epsilon">Dielectric Constant (εᵣ)</Label>
          <Input
            id="c-epsilon"
            type="number"
            step="0.1"
            placeholder="3.5 (paper)"
            value={dielectricConstant}
            onChange={(e) => setDielectricConstant(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Air: 1.0, Paper: 3.5, Glass: 5-10, Ceramic: 10-10000
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="c-area">Plate Area (m²)</Label>
            <Input
              id="c-area"
              type="number"
              placeholder="0.01"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-distance">Distance (m)</Label>
            <Input
              id="c-distance"
              type="number"
              placeholder="0.001"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={calculateCapacitance} className="w-full">
          Calculate Capacitance
        </Button>
        {result !== null && (
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div className="text-sm text-teal-800">Result:</div>
            <div className="text-2xl font-bold text-teal-900">
              C = {result.toExponential(4)} F
            </div>
            <div className="text-xs text-teal-700 mt-1">
              {(result * 1e6).toFixed(4)} µF | {(result * 1e9).toFixed(4)} nF | {(result * 1e12).toFixed(4)} pF
            </div>
            <div className="text-xs text-teal-700 mt-1">
              Formula: C = (ε₀ × εᵣ × A) / d
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ INDUCTANCE CALCULATOR ============
const InductanceCalculator: React.FC = () => {
  const [turns, setTurns] = useState<string>('');
  const [crossSectionArea, setCrossSectionArea] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [coreMaterial, setCoreMaterial] = useState<string>('1');
  const [result, setResult] = useState<number | null>(null);

  const calculateInductance = () => {
    const N = parseFloat(turns);
    const A = parseFloat(crossSectionArea);
    const l = parseFloat(length);
    const μr = parseFloat(coreMaterial);

    if (N && A && l && μr) {
      const μ0 = 4 * Math.PI * 1e-7; // Vacuum permeability (H/m)
      const L = (μ0 * μr * N * N * A) / l;
      setResult(L);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDot className="h-5 w-5" />
          Inductance (L) Calculator
        </CardTitle>
        <CardDescription>Calculate inductance of a solenoid coil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="l-turns">Number of Turns (N)</Label>
          <Input
            id="l-turns"
            type="number"
            placeholder="100"
            value={turns}
            onChange={(e) => setTurns(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="l-area">Cross-sectional Area (m²)</Label>
            <Input
              id="l-area"
              type="number"
              placeholder="0.0001"
              value={crossSectionArea}
              onChange={(e) => setCrossSectionArea(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="l-length">Coil Length (m)</Label>
            <Input
              id="l-length"
              type="number"
              placeholder="0.1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="l-mu">Relative Permeability (μᵣ)</Label>
          <Input
            id="l-mu"
            type="number"
            step="1"
            placeholder="1 (air core)"
            value={coreMaterial}
            onChange={(e) => setCoreMaterial(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Air: 1, Iron: 200-5000, Ferrite: 50-2000
          </p>
        </div>
        <Button onClick={calculateInductance} className="w-full">
          Calculate Inductance
        </Button>
        {result !== null && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-sm text-amber-800">Result:</div>
            <div className="text-2xl font-bold text-amber-900">
              L = {result.toExponential(4)} H
            </div>
            <div className="text-xs text-amber-700 mt-1">
              {(result * 1000).toFixed(4)} mH | {(result * 1e6).toFixed(4)} µH
            </div>
            <div className="text-xs text-amber-700 mt-1">
              Formula: L = (μ₀ × μᵣ × N² × A) / l
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ SERIES/PARALLEL CALCULATOR ============
const SeriesParallelCalculator: React.FC = () => {
  const [componentType, setComponentType] = useState<string>('resistor');
  const [values, setValues] = useState<string>('');
  const [result, setResult] = useState<{ series: number; parallel: number } | null>(null);

  const calculateCombination = () => {
    const valueArray = values.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));

    if (valueArray.length > 0) {
      // Series: sum of all values
      const series = valueArray.reduce((sum, val) => sum + val, 0);

      // Parallel: reciprocal of sum of reciprocals
      const reciprocalSum = valueArray.reduce((sum, val) => sum + 1/val, 0);
      const parallel = 1 / reciprocalSum;

      setResult({ series, parallel });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Series/Parallel Combinations
        </CardTitle>
        <CardDescription>Calculate equivalent values for series and parallel connections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sp-type">Component Type</Label>
          <select
            id="sp-type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={componentType}
            onChange={(e) => setComponentType(e.target.value)}
          >
            <option value="resistor">Resistors (Ω)</option>
            <option value="capacitor">Capacitors (F)</option>
            <option value="inductor">Inductors (H)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sp-values">
            Values (comma-separated, e.g., "10, 20, 30")
          </Label>
          <Input
            id="sp-values"
            type="text"
            placeholder="10, 20, 30"
            value={values}
            onChange={(e) => setValues(e.target.value)}
          />
        </div>
        <Button onClick={calculateCombination} className="w-full" disabled={!values}>
          Calculate
        </Button>
        {result && (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">
                {componentType === 'capacitor' ? 'Series (1/C = 1/C₁ + 1/C₂ + ...)' : 'Series (sum)'}:
              </div>
              <div className="text-xl font-bold text-green-900">
                {componentType === 'capacitor' 
                  ? `${(1 / result.series).toExponential(6)} F`
                  : `${result.series.toFixed(6)} ${componentType === 'resistor' ? 'Ω' : 'H'}`
                }
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                {componentType === 'capacitor' ? 'Parallel (C = C₁ + C₂ + ...)' : 'Parallel (reciprocal sum)'}:
              </div>
              <div className="text-xl font-bold text-blue-900">
                {componentType === 'capacitor' 
                  ? `${result.parallel.toExponential(6)} F`
                  : `${result.parallel.toFixed(6)} ${componentType === 'resistor' ? 'Ω' : 'H'}`
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ MAIN PAGE ============
export default function BasicElectricalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Basic Electrical Calculations
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Individual calculators for each electrical parameter with IEC & NEC compliance
          </p>
          
          {/* Standards Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary">IEC 60038</Badge>
            <Badge variant="secondary">IEC 60364</Badge>
            <Badge variant="secondary">NEC Article 220</Badge>
            <Badge variant="secondary">NEC Article 310</Badge>
            <Badge variant="secondary">NEC Article 430</Badge>
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Row 1: Basic Parameters */}
          <CurrentCalculator />
          <VoltageCalculator />
          <PowerCalculator />
          <ResistanceCalculator />
          
          {/* Row 2: Advanced Parameters */}
          <ReactanceCalculator />
          <ImpedanceCalculator />
          <AmpacityCalculator />
          <RMSCalculator />
          
          {/* Row 3: Component Parameters */}
          <CapacitanceCalculator />
          <InductanceCalculator />
          
          {/* Series/Parallel - Full width */}
          <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
            <SeriesParallelCalculator />
          </div>
        </div>

        {/* Formula Reference Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ohm's Law</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block bg-muted p-2 rounded text-sm">V = I × R</code>
              <p className="text-xs text-muted-foreground mt-2">
                Voltage equals current times resistance
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Power Formula</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block bg-muted p-2 rounded text-sm">P = V × I × cosφ</code>
              <p className="text-xs text-muted-foreground mt-2">
                Active power in AC circuits
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Impedance</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block bg-muted p-2 rounded text-sm">Z = √(R² + X²)</code>
              <p className="text-xs text-muted-foreground mt-2">
                Total impedance in AC circuits
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
