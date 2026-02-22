'use client';

import React, { useState } from 'react';
import CalculatorForm from '../../src/components/lightning-arrester/CalculatorForm';
import ResultsDisplay from '../../src/components/lightning-arrester/ResultsDisplay';
import ReportPreview from '../../src/components/lightning-arrester/ReportPreview';
import { CalculationParameters } from '../../src/models/CalculationParameters';
import { CalculationResult } from '../../src/models/ComplianceResult';
import { PdfGeneratorService } from '../../src/services/lightning-arrester/pdfGenerator';

const LightningArresterCalculatorPage: React.FC = () => {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculationParams, setCalculationParams] = useState<CalculationParameters | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleCalculationComplete = (calculationResult: CalculationResult) => {
    setResult(calculationResult);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setResult(null);
  };

  const handleGeneratePdf = async () => {
    if (!calculationParams || !result) {
      alert('Please complete a calculation first');
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const pdfService = new PdfGeneratorService();
      const pdfBlob = await pdfService.generateReport(calculationParams, result);

      // Create a download link for the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lightning-arrester-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF report');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleFormSubmit = (params: CalculationParameters) => {
    setCalculationParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Lightning Arrester Calculator
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-3xl mx-auto">
            Calculate appropriate lightning protection devices based on IEC 60099-4 and NEC standards
          </p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Input Parameters</h2>
              <CalculatorForm
                onCalculationComplete={(result) => {
                  handleCalculationComplete(result);
                }}
                onError={handleError}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">About Lightning Arresters</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600">
                  Lightning arresters protect electrical equipment from voltage surges caused by lightning strikes
                  or switching operations. This calculator helps determine the appropriate arrester type and
                  specifications based on IEC 60099-4 and NEC standards.
                </p>
                <h3 className="text-sm font-medium text-gray-900 mt-4">Arrester Types:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                  <li><strong>Conventional Rod</strong>: Traditional air terminals for homes and small structures</li>
                  <li><strong>ESE (Early Streamer Emission)</strong>: Advanced rods with extended coverage radius</li>
                  <li><strong>MOV (Metal-Oxide Varistor)</strong>: Modern surge protection for power systems</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Results and Report */}
          <div className="space-y-6">
            <ResultsDisplay result={result} />

            <ReportPreview
              calculationParams={calculationParams}
              result={result}
              onGeneratePdf={handleGeneratePdf}
              isGenerating={isGeneratingPdf}
            />
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-200 overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Standards Compliance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-md font-medium text-gray-900">IEC 60099-4:2018</h3>
              <p className="text-sm text-gray-600 mt-1">
                Specifies requirements for surge arresters used in three-phase AC systems with a nominal frequency between 48 Hz and 62 Hz.
              </p>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-900">NEC 2020/2023</h3>
              <p className="text-sm text-gray-600 mt-1">
                National Electrical Code requirements for surge protective devices (SPDs) including Type 1 and Type 2 classifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightningArresterCalculatorPage;