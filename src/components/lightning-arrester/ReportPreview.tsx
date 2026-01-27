import React from 'react';
import { CalculationResult } from '../../models/ComplianceResult';
import { CalculationParameters } from '../../models/CalculationParameters';
import { PdfGeneratorService } from '../../services/lightning-arrester/pdfGenerator';

interface ReportPreviewProps {
  calculationParams: CalculationParameters | null;
  result: CalculationResult | null;
  onGeneratePdf: () => void;
  isGenerating: boolean;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  calculationParams,
  result,
  onGeneratePdf,
  isGenerating
}) => {
  const pdfService = new PdfGeneratorService();

  // Generate a preview of the report
  const generatePreview = () => {
    if (!calculationParams || !result) {
      return (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">Complete a calculation to generate a report preview</p>
        </div>
      );
    }

    const preview = pdfService.generatePreview(calculationParams, result);

    // Render the preview HTML
    return (
      <div
        className="report-preview-container p-4 bg-white rounded-lg border border-gray-200"
        dangerouslySetInnerHTML={{ __html: preview }}
      />
    );
  };

  // Generate summary information
  const generateSummary = () => {
    if (!calculationParams || !result) {
      return null;
    }

    const summaryInfo = pdfService.generateSummary(calculationParams, result);

    return (
      <div className="summary-card bg-blue-50 p-4 rounded-lg mb-6">
        <h4 className="text-md font-medium text-blue-900 mb-2">Report Summary</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Compliance Score:</span> {summaryInfo.complianceScore.toFixed(1)}%
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Critical Issues:</span> {summaryInfo.criticalIssues}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Structure Type:</span> {calculationParams.structureType}
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Recommended:</span> {result.arresterType} ({result.rating} kV)
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h3>

      {generateSummary()}

      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-2">Preview</h4>
        {generatePreview()}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {calculationParams && result
            ? "Ready to generate PDF report"
            : "Complete a calculation to enable PDF generation"}
        </div>

        <button
          onClick={onGeneratePdf}
          disabled={!calculationParams || !result || isGenerating}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            calculationParams && result && !isGenerating
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            "Generate PDF Report"
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportPreview;