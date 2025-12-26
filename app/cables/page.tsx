/**
 * Cable Sizing Page (Server Component)
 * Feature: 001-electromate-engineering-app
 * Task: T092 - Create app/cables/page.tsx
 *
 * Server Component for cable sizing route with metadata.
 *
 * @see User Story 3 - Voltage Drop Calculator with Cable Sizing
 */

import type { Metadata } from 'next';
import { CableSizingTool } from './CableSizingTool';

export const metadata: Metadata = {
  title: 'Cable Sizing & Voltage Drop Calculator | ElectroMate',
  description:
    'Calculate voltage drop and select cable sizes with NEC/IEC compliance. Real-time derating factors, red highlighting for violations >3%.',
  keywords: [
    'cable sizing',
    'voltage drop calculator',
    'NEC Table 310.15',
    'IEC 60364',
    'electrical engineering',
    'conductor ampacity',
    'derating factors',
  ],
  openGraph: {
    title: 'Cable Sizing & Voltage Drop Calculator',
    description:
      'Professional cable sizing tool with NEC and IEC standards compliance',
    type: 'website',
  },
};

export default function CablesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Cable Sizing & Voltage Drop Calculator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Calculate voltage drop and select cable sizes with NEC/IEC compliance.
          Results are highlighted in red when voltage drop exceeds 3%.
        </p>
      </div>

      <CableSizingTool />
    </div>
  );
}
