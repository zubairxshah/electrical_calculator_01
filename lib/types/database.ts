/**
 * TypeScript type definitions for database schema
 *
 * Aligns with data-model.md Drizzle schema definitions
 * Supports BetterAuth + Neon PostgreSQL integration
 *
 * @see specs/001-electromate-engineering-app/data-model.md
 */

import { InferSelectModel, InferInsertModel, Table } from 'drizzle-orm'
import { CalculationType, StandardsFramework, ValidationResult } from './calculations'

/**
 * User entity (from Better Auth)
 *
 * Note: Better Auth automatically manages user table schema
 * These types align with Better Auth v1.4.9 defaults
 */
export interface User {
  /** UUID primary key */
  id: string
  /** Email address (unique) */
  email: string
  /** Hashed password (bcrypt) */
  passwordHash: string
  /** Full name (optional) */
  name?: string | null
  /** Email verified timestamp */
  emailVerifiedAt?: Date | null
  /** Account creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
}

/**
 * Session entity (from Better Auth)
 */
export interface Session {
  /** Session token (UUID) */
  id: string
  /** User ID foreign key */
  userId: string
  /** Session expiration timestamp */
  expiresAt: Date
  /** Session creation timestamp */
  createdAt: Date
}

/**
 * Calculation session entity (custom)
 *
 * Stores individual calculation results for:
 * - Anonymous users (userId = null, temporary localStorage)
 * - Authenticated users (userId = UUID, persisted to database)
 */
export interface CalculationSession {
  /** UUID primary key */
  id: string
  /** User ID foreign key (null for anonymous) */
  userId: string | null
  /** Calculation type */
  calculationType: CalculationType
  /** Standards framework used */
  standards: StandardsFramework
  /** Calculation title/name (optional, user-provided) */
  title?: string | null
  /** Raw input data (JSON) */
  inputs: Record<string, unknown>
  /** Raw result data (JSON) */
  results: Record<string, unknown>
  /** Validation warnings (JSON array) */
  warnings: ValidationResult[]
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
  /** Soft delete timestamp (for 2-year retention per FR-020) */
  deletedAt?: Date | null
}

/**
 * Saved calculation collection (custom)
 *
 * Allows users to group related calculations (e.g., "Office Building Project")
 */
export interface CalculationCollection {
  /** UUID primary key */
  id: string
  /** User ID foreign key */
  userId: string
  /** Collection name */
  name: string
  /** Description (optional) */
  description?: string | null
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
}

/**
 * Many-to-many junction table: collections ↔ calculations
 */
export interface CalculationCollectionItem {
  /** UUID primary key */
  id: string
  /** Collection ID foreign key */
  collectionId: string
  /** Calculation session ID foreign key */
  calculationId: string
  /** Sort order within collection */
  sortOrder: number
  /** Added to collection timestamp */
  addedAt: Date
}

/**
 * User preferences (custom)
 *
 * Stores per-user settings for default standards, units, etc.
 */
export interface UserPreferences {
  /** User ID (primary key, one-to-one with users) */
  userId: string
  /** Default standards framework */
  defaultStandards: StandardsFramework
  /** Default voltage system for quick calculations */
  defaultVoltage?: number | null
  /** Conservative mode (apply stricter limits) */
  conservativeMode: boolean
  /** Show informational hints */
  showInfoMessages: boolean
  /** Email notification preferences (future) */
  emailNotifications: boolean
  /** Last update timestamp */
  updatedAt: Date
}

/**
 * PDF export log (custom)
 *
 * Tracks PDF generation for analytics and troubleshooting
 */
export interface PDFExportLog {
  /** UUID primary key */
  id: string
  /** User ID foreign key (null for anonymous) */
  userId: string | null
  /** Calculation session ID foreign key */
  calculationId: string
  /** File size (bytes) */
  fileSizeBytes: number
  /** Generation time (ms) */
  generationTimeMs: number
  /** Browser user agent */
  userAgent?: string | null
  /** Export timestamp */
  exportedAt: Date
}

/**
 * Audit log (custom)
 *
 * Tracks significant user actions for security and compliance
 */
export interface AuditLog {
  /** UUID primary key */
  id: string
  /** User ID foreign key (null for anonymous) */
  userId: string | null
  /** Action type */
  action: 'calculation_created' | 'calculation_updated' | 'calculation_deleted' | 'pdf_exported' | 'login' | 'logout' | 'account_created' | 'account_deleted'
  /** Entity type affected */
  entityType?: string | null
  /** Entity ID affected */
  entityId?: string | null
  /** Additional metadata (JSON) */
  metadata?: Record<string, unknown> | null
  /** IP address */
  ipAddress?: string | null
  /** Action timestamp */
  createdAt: Date
}

/**
 * Type utilities for Drizzle ORM
 *
 * These will be used with actual Drizzle schemas in lib/schema.ts
 */

/**
 * Inferred select type (for reading from database)
 * Usage: type UserSelect = InferSelectModel<typeof usersTable>
 */
export type SelectModel<T extends Table> = InferSelectModel<T>

/**
 * Inferred insert type (for writing to database)
 * Usage: type UserInsert = InferInsertModel<typeof usersTable>
 */
export type InsertModel<T extends Table> = InferInsertModel<T>

/**
 * Database transaction type
 */
export type Transaction = any // Will be properly typed when Drizzle schema is created

/**
 * Query result with pagination
 */
export interface PaginatedResult<T> {
  /** Result items */
  items: T[]
  /** Total count (before pagination) */
  total: number
  /** Current page (1-indexed) */
  page: number
  /** Items per page */
  pageSize: number
  /** Total pages */
  totalPages: number
  /** Has next page */
  hasNext: boolean
  /** Has previous page */
  hasPrev: boolean
}

/**
 * Query filters for calculation sessions
 */
export interface CalculationSessionFilters {
  /** Filter by user ID */
  userId?: string
  /** Filter by calculation type */
  calculationType?: CalculationType
  /** Filter by standards framework */
  standards?: StandardsFramework
  /** Filter by date range (created after) */
  createdAfter?: Date
  /** Filter by date range (created before) */
  createdBefore?: Date
  /** Include soft-deleted items */
  includeDeleted?: boolean
}

/**
 * Sort options for queries
 */
export interface SortOptions {
  /** Field to sort by */
  field: string
  /** Sort direction */
  direction: 'asc' | 'desc'
}

/**
 * Migration metadata (for tracking Drizzle migrations)
 */
export interface MigrationMeta {
  /** Migration ID */
  id: number
  /** Migration hash */
  hash: string
  /** Applied timestamp */
  created_at: Date
}
