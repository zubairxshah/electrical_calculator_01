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
            <p className="mt-1 text-xl font-semibold text-gray-900 capitalize break-words">{result.arresterType}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Recommended Rating</h4>
            <p className="mt-1 text-xl font-semibold text-gray-900">{result.rating} kV</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Compliance Status</h4>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xl font-semibold text-gray-900">
                {compliantCount}/{totalCount} Requirements Met
              </span>
              <div className="flex flex-wrap gap-2">
                <ComplianceBadge
                  standard="IEC"
                  compliant={result.complianceResults
                    .filter(r => r.standard.includes('IEC'))
                    .every(r => r.compliant)}
                />
                <ComplianceBadge
                  standard="NEC"
                  compliant={result.complianceResults
                    .filter(r => r.standard.includes('NEC'))
                    .every(r => r.compliant)}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Installation Recommendation</h4>
            <p className="mt-1 text-base text-gray-900 break-words">{result.installationRecommendation}</p>
          </div>
        </div>
      </div>

      {/* Compliance Results Table */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Compliance Verification</h4>
        <div className="overflow-x-auto max-w-full">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 truncate">
                  Standard
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 truncate">
                  Requirement
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 truncate">
                  Required
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 truncate">
                  Calculated
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 truncate">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {result.complianceResults.map((compliance, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 text-sm text-gray-500 truncate" title={compliance.standard}>
                    {compliance.standard}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate" title={compliance.requirement}>
                    {compliance.requirement.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 truncate">
                    {compliance.requiredValue.toFixed(2)} {compliance.unit}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 truncate">
                    {compliance.calculatedValue.toFixed(2)} {compliance.unit}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
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
        <div className="rounded-md bg-yellow-50 p-4 mb-4 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1 break-words">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="break-words">{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Timestamp */}
      <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
        Calculation performed at: {result.calculationTimestamp.toLocaleString()}
      </div>
    </div>
  );
};

export default ResultsDisplay;