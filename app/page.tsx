'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Battery, Zap, Cable, Sun, Settings, BookOpen, Shield, Lightbulb, CircuitBoard, Scale } from 'lucide-react';
import { CalculatorGrid } from '@/components/landing/calculator-grid';
import { CalculatorCard } from '@/types/ui';

/**
 * Landing Page
 *
 * Provides:
 * - Feature overview with navigation cards
 * - Quick start guide
 * - Standards compliance information
 */

const calculatorCards: CalculatorCard[] = [
  {
    id: 'battery',
    title: 'Battery Backup Calculator',
    description: 'Calculate backup time and capacity requirements for battery systems using IEEE 485-2020 standards.',
    icon: 'battery',
    href: '/battery',
    priority: 'P1',
    status: 'active',
    category: 'Power Systems',
    isNew: false,
    tags: ['backup', 'capacity', 'IEEE 485'],
  },
  {
    id: 'ups',
    title: 'UPS Sizing Tool',
    description: 'Size UPS systems with diversity factors and battery requirements per IEEE 1100-2020.',
    icon: 'zap',
    href: '/ups',
    priority: 'P1',
    status: 'active',
    category: 'Power Systems',
    isNew: false,
    tags: ['sizing', 'diversity', 'IEEE 1100'],
  },
  {
    id: 'cables',
    title: 'Cable Sizing Calculator',
    description: 'Conductor sizing with voltage drop calculations per NEC 2020 and IEC 60364.',
    icon: 'cable',
    href: '/cables',
    priority: 'P1',
    status: 'active',
    category: 'Design & Installation',
    isNew: false,
    tags: ['voltage drop', 'ampacity', 'NEC 2020'],
  },
  {
    id: 'breaker',
    title: 'Circuit Breaker Sizing',
    description: 'Size circuit breakers with NEC/IEC standards compliance and coordination studies.',
    icon: 'circuitboard',
    href: '/breaker',
    priority: 'P1',
    status: 'active',
    category: 'Power Systems',
    isNew: false,
    tags: ['protection', 'coordination', 'NEC'],
  },
  {
    id: 'earthing',
    title: 'Earthing Conductor Calculator',
    description: 'Calculate earthing conductor sizing per IEC 60364-5-54 and NEC 250.',
    icon: 'zap',
    href: '/earthing',
    priority: 'P1',
    status: 'active',
    category: 'Protection & Safety',
    isNew: false,
    tags: ['grounding', 'bonding', 'IEC 60364'],
  },
  {
    id: 'lightning-arrester',
    title: 'Lightning Arrester Calculator',
    description: 'Surge protection calculations per IEC 60099-4 standards.',
    icon: 'shield',
    href: '/lightning-arrester',
    priority: 'P1',
    status: 'active',
    category: 'Protection & Safety',
    isNew: true,
    tags: ['surge', 'protection', 'IEC 60099'],
  },
  {
    id: 'lighting',
    title: 'Lighting Design Calculator',
    description: 'Indoor lighting calculations per IESNA standards.',
    icon: 'lightbulb',
    href: '/lighting',
    priority: 'P1',
    status: 'active',
    category: 'Design & Installation',
    isNew: false,
    tags: ['illumination', 'lux', 'IESNA'],
  },
  {
    id: 'solar',
    title: 'Solar Array Sizer',
    description: 'Design solar panel arrays for off-grid and grid-tied systems.',
    icon: 'sun',
    href: '/solar',
    priority: 'P2',
    status: 'active',
    category: 'Renewable Energy',
    isNew: false,
    tags: ['photovoltaic', 'energy', 'off-grid'],
  },
  {
    id: 'charge-controller',
    title: 'Charge Controller Selector',
    description: 'Select and size charge controllers for solar installations.',
    icon: 'settings',
    href: '/charge-controller',
    priority: 'P2',
    status: 'active',
    category: 'Renewable Energy',
    isNew: false,
    tags: ['MPPT', 'PWM', 'efficiency'],
  },
  {
    id: 'battery-comparison',
    title: 'Battery Comparison Tool',
    description: 'Compare different battery technologies for your application.',
    icon: 'scale',
    href: '/battery-comparison',
    priority: 'P3',
    status: 'active',
    category: 'Analysis Tools',
    isNew: false,
    tags: ['comparison', 'lithium', 'lead-acid'],
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              ElectroMate Engineering Calculations
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              High-precision electrical engineering tools with standards-compliant calculations
            </p>
          </div>
          <Badge variant="outline" className="h-fit">
            v0.1.0-MVP
          </Badge>
        </div>

        {/* Standards Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">IEEE 485-2020</Badge>
          <Badge variant="secondary">IEEE 1100-2020</Badge>
          <Badge variant="secondary">NEC 2020</Badge>
          <Badge variant="secondary">IEC 60364</Badge>
          <Badge variant="secondary">IEC 60038</Badge>
        </div>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Quick Start</span>
          </CardTitle>
          <CardDescription>
            Get started with professional electrical engineering calculations in seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Select a calculator from the sidebar or cards below</li>
            <li>Choose your standards framework (IEC/SI or NEC/US) in the header</li>
            <li>Enter your system parameters with real-time validation</li>
            <li>Review results with standard references and warnings</li>
            <li>Export professional PDF reports with calculations and charts</li>
          </ol>
          <div className="flex items-center space-x-4 pt-2">
            <Button asChild>
              <Link href="/battery">
                <Battery className="mr-2 h-4 w-4" />
                Start with Battery Calculator
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/documentation">View Documentation</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Calculator Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Calculators</h2>
        <CalculatorGrid calculatorCards={calculatorCards} />
      </div>

      {/* Features Section */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
          <CardDescription>
            Built for professional engineers with accuracy and standards compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold mb-2">High Precision</h3>
              <p className="text-sm text-muted-foreground">
                64-digit BigNumber arithmetic ensures accuracy within ±0.1% for voltage drop and ±2% for battery calculations
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Real-Time Validation</h3>
              <p className="text-sm text-muted-foreground">
                Instant feedback with safety warnings for dangerous conditions, highlighted in red per electrical codes
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Dual Standards</h3>
              <p className="text-sm text-muted-foreground">
                Support for both IEC/SI (international) and NEC/US (North American) standards with seamless unit conversion
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">PDF Export</h3>
              <p className="text-sm text-muted-foreground">
                Professional calculation reports with inputs, formulas, results, charts, and standard references
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Account Required</h3>
              <p className="text-sm text-muted-foreground">
                Calculate anonymously with localStorage persistence, or create an account to sync across devices
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Standards Compliant</h3>
              <p className="text-sm text-muted-foreground">
                All calculations reference specific IEEE, IEC, and NEC standards with version tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
