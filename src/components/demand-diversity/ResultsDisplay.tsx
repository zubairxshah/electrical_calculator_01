import React from 'react';
import { DemandCalculationResult } from '../../models/DemandCalculationResult';

interface ResultsDisplayProps {
  result: DemandCalculationResult | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <p className="text-gray-500 text-center">Enter load parameters and click "Calculate" to see results</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Results</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-700">Total Connected Load</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{result.totalConnectedLoad} kW</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-700">Maximum Demand</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{result.maximumDemand} kW</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm font-medium text-purple-700">Overall Diversity</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{(result.overallDiversityFactor * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendedServiceSize && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Recommended Service Size</p>
              <p className="text-lg font-semibold text-gray-900">{result.recommendedServiceSize} A</p>
            </div>
            {result.recommendedBreakerSize && (
              <div>
                <p className="text-sm text-gray-600">Recommended Breaker Size</p>
                <p className="text-lg font-semibold text-gray-900">{result.recommendedBreakerSize} A</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Category Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Connected (kW)
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factor
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demand (kW)
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {result.categoryBreakdown.map((category, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{category.category}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{category.connectedLoad.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{(category.appliedFactor * 100).toFixed(0)}%</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{category.demandLoad.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{category.standardReference}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-4 text-sm font-bold text-gray-900">Total</td>
                <td className="px-4 py-4 text-sm font-bold text-gray-900">{result.totalConnectedLoad.toFixed(2)}</td>
                <td className="px-4 py-4 text-sm text-gray-500">-</td>
                <td className="px-4 py-4 text-sm font-bold text-gray-900">{result.maximumDemand.toFixed(2)}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{result.standardUsed}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Compliance Checks */}
      {result.complianceChecks && result.complianceChecks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Compliance Verification</h4>
          <div className="space-y-2">
            {result.complianceChecks.map((check, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  check.compliant
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {check.compliant ? (
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{check.standard} - {check.clause}</p>
                    <p className="text-sm text-gray-600 mt-1">{check.requirement}</p>
                    <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-md bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
        Calculation performed at: {result.calculationTimestamp.toLocaleString()}
      </div>
    </div>
  );
};

export default ResultsDisplay;
