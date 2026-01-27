import { NextRequest } from 'next/server';
import { LightningArresterCalculationEngine } from '../../../../src/services/lightning-arrester/calculationEngine';
import { LightningArresterValidationService } from '../../../../src/services/lightning-arrester/validation';
import { CalculationParameters } from '../../../../src/models/CalculationParameters';
import { CalculationResult } from '../../../../src/models/ComplianceResult';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the input parameters
    const validationService = new LightningArresterValidationService();
    const validationErrors = validationService.validate(body as CalculationParameters);

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input parameters',
          details: validationErrors.map(field => ({
            field: 'request_body',
            message: field
          }))
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Perform the calculation
    const calculationEngine = new LightningArresterCalculationEngine();
    const result: CalculationResult = calculationEngine.calculate(body as CalculationParameters);

    // Return the result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    // Handle any unexpected errors
    return new Response(
      JSON.stringify({
        error: 'Calculation failed',
        details: error.message || 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}