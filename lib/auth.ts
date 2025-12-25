/**
 * BetterAuth Configuration
 *
 * Provides authentication with:
 * - Email/password authentication
 * - Session management
 * - Email verification
 * - Password reset
 *
 * @see https://betterauth.com/docs
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './schema'

/**
 * BetterAuth instance
 *
 * Configured with Drizzle adapter for PostgreSQL storage
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // MVP: Allow immediate login, add verification in P2
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  user: {
    additionalFields: {
      name: {
        type: 'string',
        required: false,
      },
    },
  },

  advanced: {
    cookieName: 'electromate-auth',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
})

/**
 * Auth API handler type
 *
 * Export for Next.js API routes
 */
export type AuthAPI = typeof auth

/**
 * Session type helper
 */
export type Session = Awaited<ReturnType<typeof auth.api.getSession>>
