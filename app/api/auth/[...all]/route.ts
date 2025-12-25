/**
 * BetterAuth API Routes
 *
 * Catch-all route handler for BetterAuth endpoints:
 * - POST /api/auth/sign-up
 * - POST /api/auth/sign-in
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 */

import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
