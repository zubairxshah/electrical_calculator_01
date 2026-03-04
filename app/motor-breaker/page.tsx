import type { Metadata } from 'next';
import { MotorBreakerSizingTool } from './MotorBreakerSizingTool';

export const metadata: Metadata = {
  title: 'Motor & HVAC Breaker Sizing Calculator | ElectroMate',
  description: 'Size circuit breakers for motors (NEC 430.52), HVAC/compressors (NEC 440 MCA/MOP), DC systems, and IEC utilization categories (AC-1 to AC-4, DC-1 to DC-5).',
  keywords: [
    'motor breaker sizing', 'NEC 430.52', 'NEC 440', 'HVAC MCA MOP',
    'IEC utilization category', 'motor protection', 'DC breaker',
    'circuit breaker calculator', 'motor starter',
  ],
};

export default function MotorBreakerPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Motor & HVAC Breaker Sizing Calculator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Size breakers for motors (NEC 430.52 / IEC 60947), HVAC equipment (NEC 440 MCA/MOP), and DC systems with utilization categories.
          </p>
        </header>

        <MotorBreakerSizingTool />

        <footer className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-semibold mb-1">Disclaimer</p>
          <p>
            This calculator provides guidance based on NEC 2020, IEC 60364, and IEC 60947 standards.
            Results must be verified by a qualified electrical engineer. Equipment nameplate data
            takes precedence over calculated values. Always confirm breaker DC ratings for DC systems.
          </p>
        </footer>
      </div>
    </main>
  );
}
