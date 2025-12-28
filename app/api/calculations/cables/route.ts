/**
 * Cable Calculations API Route
 * Feature: 001-electromate-engineering-app
 * Task: T094 - Create app/api/calculations/cables/route.ts
 *
 * Provides REST endpoints for cable sizing calculations:
 * - GET: List user's cable calculations
 * - POST: Save a new cable calculation
 *
 * @see specs/001-electromate-engineering-app/contracts/cable.openapi.yaml
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculationSessions, type CalculationSession } from '@/lib/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { CONDUCTOR_MATERIALS, INSTALLATION_METHODS, CIRCUIT_TYPES, STANDARDS } from '@/lib/validation/cableValidation';

// Input validation schema matching OpenAPI spec
const cableInputsSchema = z.object({
  systemVoltage: z.number().positive().min(1).max(50000),
  current: z.number().positive().min(0.1).max(10000),
  length: z.number().positive().min(0.1).max(10000),
  conductorMaterial: z.enum(CONDUCTOR_MATERIALS),
  installationMethod: z.enum(INSTALLATION_METHODS),
  ambientTemp: z.number().min(-40).max(90).default(30),
  circuitType: z.enum(CIRCUIT_TYPES).default('single-phase'),
  numberOfConductors: z.number().int().min(1).max(50).default(3),
  insulationRating: z.number().default(75),
  standard: z.enum(STANDARDS).default('IEC'),
});

const cableResultsSchema = z.object({
  recommendedSize: z.object({
    sizeMm2: z.string(),
    sizeAWG: z.string().nullable(),
    formattedSize: z.string(),
  }),
  voltageDrop: z.object({
    voltageDrop: z.number(),
    voltageDropPercent: z.number(),
    isViolation: z.boolean(),
    isDangerous: z.boolean().optional(),
    resistance: z.number().optional(),
    resistanceUnit: z.string().optional(),
    standardReference: z.string().optional(),
  }),
  ampacity: z.object({
    baseAmpacity: z.number(),
    deratedAmpacity: z.number(),
    utilizationPercent: z.number(),
  }),
  deratingFactors: z.object({
    temperatureFactor: z.number(),
    groupingFactor: z.number(),
    totalFactor: z.number(),
    standardReference: z.string().optional(),
  }),
  compliance: z.object({
    isVoltageDropCompliant: z.boolean(),
    isAmpacityCompliant: z.boolean(),
    isFullyCompliant: z.boolean(),
  }),
  warnings: z.array(z.string()).optional(),
  standardReferences: z.array(z.string()).optional(),
});

const createCalculationSchema = z.object({
  inputs: cableInputsSchema,
  results: cableResultsSchema,
  standardsUsed: z.array(z.string()).default(['NEC 2020 Table 310.15(B)(16)', 'IEC 60364-5-52:2009']),
  projectId: z.string().uuid().optional(),
});

/**
 * GET /api/calculations/cables
 *
 * List cable calculations for the authenticated user.
 * Query params:
 * - limit: Max results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    // TODO: Get userId from authenticated session
    // For now, return calculations without user filter (anonymous mode)
    const conditions = [
      eq(calculationSessions.calculationType, 'cable'),
      isNull(calculationSessions.deletedAt),
    ];

    const calculations = await db
      .select()
      .from(calculationSessions)
      .where(and(...conditions))
      .orderBy(desc(calculationSessions.createdAt))
      .limit(limit);

    return NextResponse.json({
      calculations: calculations.map((calc: typeof calculationSessions.$inferSelect) => ({
        id: calc.id,
        userId: calc.userId,
        inputs: calc.inputs,
        results: calc.results,
        createdAt: calc.createdAt.toISOString(),
        standardsUsed: calc.standardsUsed,
        unitSystem: calc.unitSystem,
        projectId: calc.projectId,
        warnings: calc.warnings,
        isValid: calc.isValid,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch cable calculations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calculations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calculations/cables
 *
 * Save a new cable calculation.
 * Body: CableCalculationCreate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = createCalculationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { inputs, results, standardsUsed, projectId } = validationResult.data;

    // TODO: Get userId from authenticated session
    // For now, create without user association (anonymous mode)
    const userId = null;

    // Determine unit system from standard
    const unitSystem = inputs.standard === 'NEC' ? 'NEC' : 'IEC';

    // Insert calculation
    const [calculation] = await db
      .insert(calculationSessions)
      .values({
        userId,
        calculationType: 'cable',
        inputs,
        results,
        standardsUsed,
        unitSystem,
        projectId: projectId ?? null,
        warnings: results.warnings?.map((w) => ({ message: w, severity: 'warning' })) ?? [],
        isValid: results.compliance.isFullyCompliant,
      })
      .returning();

    return NextResponse.json(
      {
        id: calculation.id,
        userId: calculation.userId,
        inputs: calculation.inputs,
        results: calculation.results,
        createdAt: calculation.createdAt.toISOString(),
        standardsUsed: calculation.standardsUsed,
        unitSystem: calculation.unitSystem,
        projectId: calculation.projectId,
        warnings: calculation.warnings,
        isValid: calculation.isValid,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to save cable calculation:', error);
    return NextResponse.json(
      { error: 'Failed to save calculation' },
      { status: 500 }
    );
  }
}
