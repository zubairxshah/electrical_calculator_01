/**
 * Solar Calculations API Route
 * Feature: 001-electromate-engineering-app
 * Task: T106 - Create app/api/calculations/solar/route.ts
 *
 * Provides REST endpoints for solar array sizing calculations:
 * - GET: List user's solar calculations
 * - POST: Save a new solar calculation
 *
 * @see specs/001-electromate-engineering-app/contracts/solar.openapi.yaml
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculationSessions } from '@/lib/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

// Input validation schema matching OpenAPI spec
const solarInputsSchema = z.object({
  dailyEnergyKWh: z.number().min(0.1).max(100000),
  peakSunHours: z.number().min(1).max(12),
  panelWattage: z.number().min(50).max(1000),
  performanceRatio: z.number().min(0.5).max(1.0),
  panelEfficiency: z.number().min(0.05).max(0.30).optional().default(0.20),
  systemVoltage: z.number().min(12).max(1500).optional(),
});

const solarResultsSchema = z.object({
  requiredPanels: z.number().int().min(1),
  totalArrayPower: z.number().positive(),
  estimatedDailyGen: z.number().positive(),
  estimatedAnnualGen: z.number().positive(),
  arrayAreaM2: z.number().positive().optional(),
  openCircuitVoltage: z.number().positive().optional(),
  shortCircuitCurrent: z.number().positive().optional(),
});

const createCalculationSchema = z.object({
  inputs: solarInputsSchema,
  results: solarResultsSchema,
  standardsUsed: z.array(z.string()).default(['NREL', 'IEC 61215']),
  projectId: z.string().uuid().optional(),
});

/**
 * GET /api/calculations/solar
 *
 * List solar calculations for the authenticated user.
 * Query params:
 * - projectId: Filter by project
 * - limit: Max results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    // TODO: Get userId from authenticated session
    // For now, return calculations without user filter (anonymous mode)
    const conditions = [
      eq(calculationSessions.calculationType, 'solar'),
      isNull(calculationSessions.deletedAt),
    ];

    if (projectId) {
      conditions.push(eq(calculationSessions.projectId, projectId));
    }

    const calculations = await db
      .select()
      .from(calculationSessions)
      .where(and(...conditions))
      .orderBy(desc(calculationSessions.createdAt))
      .limit(limit);

    return NextResponse.json({
      calculations: calculations.map((calc) => ({
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
    console.error('Failed to fetch solar calculations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calculations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calculations/solar
 *
 * Save a new solar calculation.
 * Body: SolarCalculationCreate
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

    // Insert calculation
    const [calculation] = await db
      .insert(calculationSessions)
      .values({
        userId,
        calculationType: 'solar',
        inputs,
        results,
        standardsUsed,
        unitSystem: 'IEC',
        projectId: projectId ?? null,
        warnings: [],
        isValid: true,
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
    console.error('Failed to save solar calculation:', error);
    return NextResponse.json(
      { error: 'Failed to save calculation' },
      { status: 500 }
    );
  }
}
