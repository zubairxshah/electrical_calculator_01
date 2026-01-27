import { NextRequest } from 'next/server';
import { PdfGeneratorService } from '../../../../src/services/lightning-arrester/pdfGenerator';
import { CalculationParameters } from '../../../../src/models/CalculationParameters';
import { CalculationResult } from '../../../../src/models/ComplianceResult';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate required fields
    if (!body.inputParameters || !body.results) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: [
            {
              field: 'inputParameters or results',
              message: 'Both inputParameters and results are required'
            }
          ]
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const inputParameters = body.inputParameters as CalculationParameters;
    const results = body.results as CalculationResult;

    // Generate the PDF report
    const pdfService = new PdfGeneratorService();
    const pdfBlob = await pdfService.generateReport(inputParameters, results);

    // Convert Blob to ArrayBuffer for response
    const arrayBuffer = await pdfBlob.arrayBuffer();

    // Return the PDF as binary response
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="lightning-arrester-report.pdf"',
        'Content-Length': String(arrayBuffer.byteLength)
      }
    });
  } catch (error: any) {
    // Handle any unexpected errors
    return new Response(
      JSON.stringify({
        error: 'PDF generation failed',
        details: error.message || 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}