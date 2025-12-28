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

// Lazy initialization - only create connection if URL is available
let sqlInstance: ReturnType<typeof neon> | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

function getConnection() {
  if (!process.env.NEON_DATABASE_URL) {
    return null
  }
  if (!sqlInstance) {
    sqlInstance = neon(process.env.NEON_DATABASE_URL)
  }
  if (!dbInstance) {
    dbInstance = drizzle(sqlInstance, { schema })
  }
  return dbInstance
}

/**
 * Drizzle ORM instance (lazy)
 */
export const db = new Proxy({} as any, {
  get(target, prop) {
    const instance = getConnection()
    if (!instance) {
      throw new Error('Database not configured. Set NEON_DATABASE_URL environment variable.')
    }
    return (instance as any)[prop]
  }
})

/**
 * Connection health check
 *
 * Verifies database connectivity
 * @returns true if connection successful
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const instance = getConnection()
    if (!instance || !sqlInstance) {
      return false
    }
    await sqlInstance`SELECT 1`
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
