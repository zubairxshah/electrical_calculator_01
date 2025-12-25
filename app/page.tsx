import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Battery, Zap, Cable, Sun, Settings, BookOpen } from 'lucide-react'

/**
 * Landing Page
 *
 * Provides:
 * - Feature overview with navigation cards
 * - Quick start guide
 * - Standards compliance information
 */

const calculators = [
  {
    title: 'Battery Backup Calculator',
    description: 'Calculate backup time and capacity requirements for battery systems using IEEE 485-2020 standards.',
    icon: Battery,
    href: '/battery',
    priority: 'P1',
    features: [
      'Backup time calculation',
      'Discharge rate analysis',
      'Temperature compensation',
      'Battery aging factors',
    ],
  },
  {
    title: 'UPS Sizing Tool',
    description: 'Size UPS systems with diversity factors and battery requirements per IEEE 1100-2020.',
    icon: Zap,
    href: '/ups',
    priority: 'P1',
    features: [
      'VA/Watt sizing',
      'Diversity factors',
      'Battery capacity',
      'Growth planning',
    ],
  },
  {
    title: 'Cable Sizing Calculator',
    description: 'Conductor sizing with voltage drop calculations per NEC 2020 and IEC 60364.',
    icon: Cable,
    href: '/cables',
    priority: 'P1',
    features: [
      'Voltage drop analysis',
      'Ampacity derating',
      'AWG/mm² sizing',
      'Temperature effects',
    ],
  },
  {
    title: 'Solar Array Sizer',
    description: 'Design solar panel arrays for off-grid and grid-tied systems.',
    icon: Sun,
    href: '/solar',
    priority: 'P2',
    features: [
      'Array configuration',
      'Energy yield',
      'Battery bank sizing',
      'String calculations',
    ],
  },
  {
    title: 'Charge Controller Selector',
    description: 'Select and size charge controllers for solar installations.',
    icon: Settings,
    href: '/charge-controller',
    priority: 'P2',
    features: [
      'PWM vs MPPT',
      'Current ratings',
      'Voltage matching',
      'Efficiency analysis',
    ],
  },
]

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

      {/* Calculator Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Calculators</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {calculators.map((calculator) => {
            const Icon = calculator.icon
            return (
              <Card key={calculator.href} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge
                      variant={calculator.priority === 'P1' ? 'default' : 'secondary'}
                    >
                      {calculator.priority}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{calculator.title}</CardTitle>
                  <CardDescription>{calculator.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {calculator.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <span className="mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link href={calculator.href}>
                      Open Calculator
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
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
