import { NextRequest } from 'next/server';
import { DemandCalculationEngine } from '../../../../src/services/demand-diversity/calculationEngine';
import { DemandValidationService } from '../../../../src/services/demand-diversity/validation';
import { DemandCalculationParameters } from '../../../../src/models/DemandCalculationParameters';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the input parameters
    const validationService = new DemandValidationService();
    const validationErrors = validationService.validate(body as DemandCalculationParameters);

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
    const calculationEngine = new DemandCalculationEngine();
    const result = calculationEngine.calculate(body as DemandCalculationParameters);

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
