import React from 'react';
import { CalculationResult } from '../../models/ComplianceResult';
import ComplianceBadge from './ComplianceBadge';

interface ResultsDisplayProps {
  result: CalculationResult | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <p className="text-gray-500 text-center">Enter parameters and click "Calculate" to see results</p>
      </div>
    );
  }

  // Count compliant and non-compliant results
  const compliantCount = result.complianceResults.filter(cr => cr.compliant).length;
  const totalCount = result.complianceResults.length;

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Results</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Recommended Arrester Type</h4>
            <p className="mt-1 text-xl font-semibold text-gray-900 capitalize">{result.arresterType}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Recommended Rating</h4>
            <p className="mt-1 text-xl font-semibold text-gray-900">{result.rating} kV</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Compliance Status</h4>
            <div className="mt-1 flex items-center">
              <span className="text-xl font-semibold text-gray-900">
                {compliantCount}/{totalCount} Requirements Met
              </span>
              <div className="ml-4 flex space-x-2">
                <ComplianceBadge standard="IEC" compliant={true} />
                <ComplianceBadge standard="NEC" compliant={true} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Installation Recommendation</h4>
            <p className="mt-1 text-base text-gray-900">{result.installationRecommendation}</p>
          </div>
        </div>
      </div>

      {/* Compliance Results Table */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Compliance Verification</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Standard
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requirement
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calculated Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {result.complianceResults.map((compliance, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {compliance.standard}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {compliance.requirement.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {compliance.requiredValue.toFixed(2)} {compliance.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {compliance.calculatedValue.toFixed(2)} {compliance.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        compliance.compliant
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {compliance.compliant ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warnings Section */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-md bg-yellow-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
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

      {/* Calculation Timestamp */}
      <div className="text-xs text-gray-500 mt-4">
        Calculation performed at: {result.calculationTimestamp.toLocaleString()}
      </div>
    </div>
  );
};

export default ResultsDisplay;