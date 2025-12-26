/**
 * UPS Calculations API Route
 * Feature: 001-electromate-engineering-app
 * Task: T075 - Create app/api/calculations/ups/route.ts
 *
 * Provides REST endpoints for UPS sizing calculations:
 * - GET: List user's UPS calculations
 * - POST: Save a new UPS calculation
 *
 * @see specs/001-electromate-engineering-app/contracts/ups.openapi.yaml
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculationSessions } from '@/lib/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

// Input validation schema matching OpenAPI spec
const loadItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  powerVA: z.number().positive().nullable(),
  powerWatts: z.number().positive().nullable(),
  powerFactor: z.number().min(0.1).max(1.0).default(0.8),
  quantity: z.number().int().min(1),
  isCritical: z.boolean().optional().default(true),
}).refine(
  (data) => data.powerVA !== null || data.powerWatts !== null,
  { message: 'Either powerVA or powerWatts must be provided' }
);

const upsInputsSchema = z.object({
  loads: z.array(loadItemSchema).min(1),
  growthMargin: z.number().min(0).max(1.0).default(0.25),
});

const upsResultsSchema = z.object({
  totalLoadVA: z.number(),
  totalLoadWatts: z.number().optional(),
  diversityFactor: z.number(),
  effectiveLoadVA: z.number(),
  withGrowthVA: z.number().optional(),
  loadWithGrowthKVA: z.number().optional(),
  recommendedUPSkVA: z.number().nullable(),
  recommendedUPSKVA: z.number().nullable().optional(),
  numberOfLoads: z.number().optional(),
  growthMargin: z.number().optional(),
  diversityExplanation: z.string().optional(),
  standardUPSSizes: z.array(z.number()).optional(),
});

const createCalculationSchema = z.object({
  inputs: upsInputsSchema,
  results: upsResultsSchema,
  standardsUsed: z.array(z.string()).default(['IEEE 1100-2020', 'IEC 62040-3:2021']),
  projectId: z.string().uuid().optional(),
});

/**
 * GET /api/calculations/ups
 *
 * List UPS calculations for the authenticated user.
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
      eq(calculationSessions.calculationType, 'ups'),
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
    console.error('Failed to fetch UPS calculations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calculations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calculations/ups
 *
 * Save a new UPS calculation.
 * Body: UPSCalculationCreate
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
        calculationType: 'ups',
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
    console.error('Failed to save UPS calculation:', error);
    return NextResponse.json(
      { error: 'Failed to save calculation' },
      { status: 500 }
    );
  }
}
