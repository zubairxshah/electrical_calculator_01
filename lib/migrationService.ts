/**
 * localStorage to Database Migration Service
 *
 * Migrates anonymous user calculations from localStorage to PostgreSQL
 * when user creates an account (FR-016b)
 *
 * @see specs/001-electromate-engineering-app/spec.md#FR-016b
 */

import { db } from './db'
import * as schema from './schema'
import type { CalculationSession } from './types'

export interface MigrationResult {
  success: boolean
  migratedCount: number
  failedCount: number
  errors: string[]
}

/**
 * Migrate localStorage calculations to database
 *
 * @param userId - User ID to associate calculations with
 * @returns Migration result with counts and errors
 *
 * @example
 * // After user signs up
 * const result = await migrateLocalStorageToDatabase(user.id)
 * if (result.success) {
 *   console.log(`Migrated ${result.migratedCount} calculations`)
 *   // Clear localStorage
 *   clearLocalStorageCalculations()
 * }
 */
export async function migrateLocalStorageToDatabase(
  userId: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
  }

  try {
    // Get all calculation types from localStorage
    const calculationTypes = [
      'battery',
      'ups',
      'cable',
      'solar',
      'charge-controller',
      'battery-comparison',
    ]

    for (const type of calculationTypes) {
      const storageKey = `electromate-${type}`
      const data = localStorage.getItem(storageKey)

      if (data) {
        try {
          const parsed = JSON.parse(data)
          const calculations: CalculationSession[] = Array.isArray(parsed)
            ? parsed
            : parsed.calculations || []

          // Insert each calculation into database
          for (const calc of calculations) {
            try {
              await db.insert(schema.calculationSessions).values({
                userId,
                calculationType: type,
                inputs: calc.inputs as any,
                results: calc.results as any,
                standardsUsed: (calc as any).standardsUsed || [],
                unitSystem: (calc as any).unitSystem || 'IEC',
                warnings: (calc as any).warnings || [],
                isValid: (calc as any).isValid ?? true,
                createdAt: new Date((calc as any).timestamp || (calc as any).createdAt || Date.now()),
              })

              result.migratedCount++
            } catch (error) {
              result.failedCount++
              result.errors.push(
                `Failed to migrate ${type} calculation: ${error}`
              )
            }
          }
        } catch (error) {
          result.errors.push(`Failed to parse ${type} localStorage data: ${error}`)
        }
      }
    }

    if (result.failedCount > 0) {
      result.success = false
    }
  } catch (error) {
    result.success = false
    result.errors.push(`Migration failed: ${error}`)
  }

  return result
}

/**
 * Clear all calculations from localStorage
 *
 * Call after successful migration to prevent duplicates
 */
export function clearLocalStorageCalculations(): void {
  const calculationTypes = [
    'battery',
    'ups',
    'cable',
    'solar',
    'charge-controller',
    'battery-comparison',
  ]

  for (const type of calculationTypes) {
    const storageKey = `electromate-${type}`
    localStorage.removeItem(storageKey)
  }
}

/**
 * Get calculation count from localStorage
 *
 * @returns Total number of calculations in localStorage
 */
export function getLocalStorageCalculationCount(): number {
  let count = 0
  const calculationTypes = [
    'battery',
    'ups',
    'cable',
    'solar',
    'charge-controller',
    'battery-comparison',
  ]

  for (const type of calculationTypes) {
    const storageKey = `electromate-${type}`
    const data = localStorage.getItem(storageKey)

    if (data) {
      try {
        const parsed = JSON.parse(data)
        const calculations = Array.isArray(parsed)
          ? parsed
          : parsed.calculations || []
        count += calculations.length
      } catch (error) {
        console.error(`Failed to count ${type} calculations:`, error)
      }
    }
  }

  return count
}

/**
 * Preview calculations that would be migrated
 *
 * @returns Array of calculation metadata for preview
 */
export function previewMigration(): Array<{
  type: string
  count: number
  oldestDate: string | null
  newestDate: string | null
}> {
  const preview: Array<{
    type: string
    count: number
    oldestDate: string | null
    newestDate: string | null
  }> = []

  const calculationTypes = [
    'battery',
    'ups',
    'cable',
    'solar',
    'charge-controller',
    'battery-comparison',
  ]

  for (const type of calculationTypes) {
    const storageKey = `electromate-${type}`
    const data = localStorage.getItem(storageKey)

    if (data) {
      try {
        const parsed = JSON.parse(data)
        const calculations: CalculationSession[] = Array.isArray(parsed)
          ? parsed
          : parsed.calculations || []

        if (calculations.length > 0) {
          const dates = calculations
            .map((c) => new Date((c as any).timestamp || (c as any).createdAt || Date.now()).getTime())
            .sort((a, b) => a - b)

          preview.push({
            type,
            count: calculations.length,
            oldestDate: new Date(dates[0]).toISOString(),
            newestDate: new Date(dates[dates.length - 1]).toISOString(),
          })
        }
      } catch (error) {
        console.error(`Failed to preview ${type} calculations:`, error)
      }
    }
  }

  return preview
}
