'use client';

import React, { useState } from 'react';
import CalculatorForm from '../../src/components/demand-diversity/CalculatorForm';
import ResultsDisplay from '../../src/components/demand-diversity/ResultsDisplay';
import { DemandCalculationParameters } from '../../src/models/DemandCalculationParameters';
import { DemandCalculationResult } from '../../src/models/DemandCalculationResult';

const MaximumDemandCalculatorPage: React.FC = () => {
  const [result, setResult] = useState<DemandCalculationResult | null>(null);
  const [calculationParams, setCalculationParams] = useState<DemandCalculationParameters | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculationComplete = (calculationResult: DemandCalculationResult) => {
    setResult(calculationResult);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Maximum Demand & Diversity Calculator
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-3xl mx-auto">
            Calculate maximum demand for electrical installations using IEC 60364 or NEC Article 220 diversity factors
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700 break-words">
                  <span className="font-medium">Error:</span> {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Input Parameters</h2>
              <CalculatorForm
                onCalculationComplete={handleCalculationComplete}
                onError={handleError}
              />
            </div>

            {/* About Section */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">About Demand Calculations</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600">
                  Maximum demand calculations apply diversity factors to account for the fact that not all 
                  electrical loads operate simultaneously. This reduces the required service capacity and 
                  equipment sizing.
                </p>
                
                <h3 className="text-sm font-medium text-gray-900 mt-4">Standards:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <h4 className="text-sm font-medium text-indigo-700">IEC 60364-5-52</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      International standard for electrical installations. Uses diversity factors for 
                      different load categories.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-indigo-700">NEC Article 220</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      National Electrical Code requirements for branch-circuit, feeder, and service 
                      load calculations.
                    </p>
                  </div>
                </div>

                <h3 className="text-sm font-medium text-gray-900 mt-4">Example (Residential IEC):</h3>
                <div className="bg-gray-50 p-3 rounded-lg mt-2">
                  <p className="text-xs text-gray-700 font-mono">
                    Lighting: 10 kW × 100% = 10.0 kW<br/>
                    Sockets: 15 kW × 40% = 6.0 kW<br/>
                    HVAC: 20 kW × 80% = 16.0 kW<br/>
                    Cooking: 8 kW × 70% = 5.6 kW<br/>
                    Water: 6 kW × 100% = 6.0 kW<br/>
                    <strong>Total: 59 kW → Demand: 43.6 kW (26.1% diversity)</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <ResultsDisplay result={result} />

            {/* Standards Reference Card */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 overflow-hidden">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Standards Reference</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900">IEC 60364 Diversity Factors</h4>
                  <table className="mt-2 min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Load Category</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Factor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 text-gray-600">Lighting</td>
                        <td className="px-3 py-2 text-gray-600">100%</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-600">Socket Outlets</td>
                        <td className="px-3 py-2 text-gray-600">40%</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-600">HVAC</td>
                        <td className="px-3 py-2 text-gray-600">80%</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-600">Cooking Appliances</td>
                        <td className="px-3 py-2 text-gray-600">70%</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-600">Water Heating</td>
                        <td className="px-3 py-2 text-gray-600">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900">NEC 220.82 Optional Method (Dwelling)</h4>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>• General Lighting/Receptacles: First 10 kVA @ 100%, remainder @ 40%</li>
                    <li>• Cooking Equipment: 75% demand factor</li>
                    <li>• HVAC: 100% of largest system</li>
                    <li>• Water Heater: 100%</li>
                    <li>• Dryer: 100% (5 kW minimum)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaximumDemandCalculatorPage;
