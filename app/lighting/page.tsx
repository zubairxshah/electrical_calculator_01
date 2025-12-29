/**
 * Indoor Lighting Design Calculator Page
 *
 * Next.js Server Component for the lighting calculator route.
 * Provides metadata and renders the client-side calculator tool.
 *
 * Route: /lighting
 */

import type { Metadata } from 'next';
import { LightingDesignTool } from './LightingDesignTool';

export const metadata: Metadata = {
  title: 'Indoor Lighting Design Calculator - ElectroMate',
  description:
    'Professional indoor lighting design calculator using IESNA Lumen Method. Calculate luminaire count, energy consumption, and spacing for optimal illumination.',
  keywords: [
    'lighting calculator',
    'lumen method',
    'IESNA',
    'illuminance calculator',
    'lighting design',
    'luminaire count',
    'room index',
    'utilization factor',
    'maintenance factor',
    'electrical engineering',
  ],
};

/**
 * Indoor Lighting Design Calculator Page Component
 *
 * Server component that renders the lighting calculator interface
 */
export default function LightingCalculatorPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Indoor Lighting Design Calculator</h1>
          <p className="text-lg text-muted-foreground">
            Professional lighting calculations using IESNA Lumen Method
          </p>
        </header>

        {/* Main Calculator Tool */}
        <LightingDesignTool />

        {/* Footer Disclaimer */}
        <footer className="mt-8 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-semibold mb-2">⚠️ Professional Engineering Notice</p>
          <p>
            This calculator is provided for assistance and educational purposes. Final lighting
            designs must be reviewed by qualified lighting designers or Professional Engineers
            where required. Consult IESNA Lighting Handbook and local codes for compliance.
            ElectroMate assumes no liability for design decisions based on these calculations.
          </p>
        </footer>
      </div>
    </main>
  );
}
