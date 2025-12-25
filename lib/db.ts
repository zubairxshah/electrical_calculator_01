/**
 * Neon PostgreSQL Database Client Configuration
 *
 * Uses Drizzle ORM with @neondatabase/serverless for:
 * - Type-safe database queries
 * - Serverless-optimized connection pooling
 * - Edge runtime compatibility
 *
 * @see specs/001-electromate-engineering-app/plan.md#database
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

/**
 * Neon HTTP client
 *
 * Uses HTTP API for serverless edge functions (faster cold starts than TCP)
 */
const sql = neon(process.env.NEON_DATABASE_URL!)

/**
 * Drizzle ORM instance
 *
 * Provides type-safe query builder with full schema access
 */
export const db = drizzle(sql, { schema })

/**
 * Connection health check
 *
 * Verifies database connectivity
 * @returns true if connection successful
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

/**
 * Transaction wrapper
 *
 * Executes multiple operations atomically
 *
 * @example
 * await transaction(async (tx) => {
 *   const user = await tx.insert(schema.users).values({...}).returning()
 *   await tx.insert(schema.userPreferences).values({ userId: user[0].id })
 * })
 */
export async function transaction<T>(
  callback: Parameters<typeof db.transaction>[0]
): Promise<T> {
  return await db.transaction(callback) as Promise<T>
}

export default db
