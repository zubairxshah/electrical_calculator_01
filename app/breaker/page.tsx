/**
 * Circuit Breaker Sizing Calculator Page
 *
 * Next.js Server Component for the breaker calculator route.
 * Provides metadata and renders the client-side calculator tool.
 *
 * Route: /breaker
 */

import type { Metadata } from 'next';
import { BreakerSizingTool } from './BreakerSizingTool';

export const metadata: Metadata = {
  title: 'Circuit Breaker Sizing Calculator - ElectroMate',
  description:
    'Professional circuit breaker sizing calculator with NEC and IEC standards support. Calculate breaker ratings with safety factors, derating, and voltage drop analysis.',
  keywords: [
    'circuit breaker calculator',
    'breaker sizing',
    'NEC 210.20(A)',
    'IEC 60364-5-52',
    'electrical calculator',
    'breaker rating',
    'load current',
    'safety factor',
    'electrical engineering',
  ],
};

/**
 * Circuit Breaker Sizing Calculator Page Component
 *
 * Server component that renders the breaker calculator interface
 */
export default function BreakerCalculatorPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Circuit Breaker Sizing Calculator</h1>
          <p className="text-lg text-muted-foreground">
            Professional-grade breaker sizing with NEC and IEC standards compliance
          </p>
        </header>

        {/* Main Calculator Tool */}
        <BreakerSizingTool />

        {/* Footer Disclaimer */}
        <footer className="mt-8 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-semibold mb-2">⚠️ Professional Engineering Notice</p>
          <p>
            This calculator is provided for assistance and educational purposes. Final designs must
            be reviewed and stamped by licensed Professional Engineers where required by law.
            Consult applicable codes (NEC, IEC, local amendments) and equipment specifications.
            ElectroMate assumes no liability for design decisions based on these calculations.
          </p>
        </footer>
      </div>
    </main>
  );
}
