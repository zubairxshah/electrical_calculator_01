import { NextRequest, NextResponse } from 'next/server';
import { PowerCalculationEngine } from '@/services/power-calculator/calculationEngine';
import { PowerValidationService } from '@/services/power-calculator/validation';
import { PowerCalculationParameters } from '@/models/PowerCalculationParameters';

/**
 * POST /api/power-calculator/calculate
 * 
 * Calculate active, reactive, and apparent power for single-phase or three-phase systems.
 * 
 * Request body:
 * - systemType: 'single-phase' | 'three-phase'
 * - voltage: number (100-1000V)
 * - current: number (0.1-10000A)
 * - powerFactor: number (0.1-1.0)
 * - frequency?: 50 | 60
 * 
 * Response:
 * - activePower: number (kW)
 * - reactivePower: number (kVAR)
 * - apparentPower: number (kVA)
 * - powerFactor: number
 * - phaseAngle: number (degrees)
 * - systemType: string
 * - formula: string
 * - standardReferences: string[]
 * - complianceChecks: ComplianceCheck[]
 * - warnings: string[]
 * - calculationTimestamp: string
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { systemType, voltage, current, powerFactor, frequency } = body;

    if (!systemType || !voltage || !current || !powerFactor) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['systemType', 'voltage', 'current', 'powerFactor'],
        },
        { status: 400 }
      );
    }

    // Build parameters
    const params: PowerCalculationParameters = {
      systemType,
      voltage: Number(voltage),
      current: Number(current),
      powerFactor: Number(powerFactor),
      frequency: frequency ? (Number(frequency) as 50 | 60) : undefined,
    };

    // Validate inputs
    const validator = new PowerValidationService();
    const validationResult = validator.validate(params);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validationResult.errors,
        },
        { status: 400 }
      );
    }

    // Perform calculation
    const engine = new PowerCalculationEngine();
    const result = engine.calculate(params);

    // Return success response
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Power calculation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/power-calculator/calculate
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'Power Calculator API',
    description: 'Calculate active, reactive, and apparent power for electrical systems',
    endpoints: {
      POST: {
        path: '/api/power-calculator/calculate',
        description: 'Calculate power parameters',
        body: {
          systemType: "'single-phase' | 'three-phase'",
          voltage: 'number (100-1000V)',
          current: 'number (0.1-10000A)',
          powerFactor: 'number (0.1-1.0)',
          frequency: '50 | 60 (optional)',
        },
      },
    },
    standards: ['IEC 60038', 'IEC 60364-5-52', 'NEC Article 220', 'NEC Article 430'],
  });
}
