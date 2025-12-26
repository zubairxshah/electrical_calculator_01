/**
 * UPS Sizing Tool Page
 * Feature: 001-electromate-engineering-app
 * User Story: US2 - UPS Sizing Tool
 *
 * Server Component with metadata
 */

import { Metadata } from 'next';
import { UPSSizingTool } from './UPSSizingTool';

export const metadata: Metadata = {
  title: 'UPS Sizing Tool | ElectroMate',
  description:
    'Calculate UPS sizing with IEEE 1100 diversity factors, automatic growth margins, and standard size recommendations. Professional electrical engineering calculations.',
  keywords: [
    'UPS sizing',
    'uninterruptible power supply',
    'diversity factor',
    'IEEE 1100',
    'power factor',
    'electrical engineering',
    'data center',
    'load calculation',
  ],
};

export default function UPSPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          UPS Sizing Tool
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Calculate UPS capacity requirements with IEEE 1100 diversity factors and
          automatic growth margin. Add your load list to get professional sizing
          recommendations.
        </p>
      </div>

      <UPSSizingTool />

      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Standards Reference
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <strong>IEEE 1100-2020</strong> - Recommended Practice for Powering and
            Grounding Electronic Equipment (Emerald Book)
          </li>
          <li>
            <strong>IEC 62040-3:2021</strong> - Uninterruptible power systems (UPS) -
            Part 3: Method of specifying the performance and test requirements
          </li>
        </ul>
      </div>
    </main>
  );
}
