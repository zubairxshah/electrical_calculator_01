/**
 * Drizzle ORM Schema for ElectroMate
 *
 * Defines PostgreSQL tables for:
 * - User authentication (via BetterAuth)
 * - Calculation sessions (battery, UPS, cable, solar)
 * - Projects (calculation groupings)
 * - Audit logs
 *
 * @see specs/001-electromate-engineering-app/data-model.md
 */

import { pgTable, uuid, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Users table
 *
 * Managed by BetterAuth but defined here for Drizzle relations
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  emailVerified: boolean('email_verified').notNull().default(false),
})

/**
 * Calculation sessions table
 *
 * Polymorphic storage for all calculation types:
 * - battery: Battery backup time calculations
 * - ups: UPS sizing calculations
 * - cable: Cable sizing and voltage drop
 * - solar: Solar array sizing
 * - charge-controller: Charge controller selection
 * - battery-comparison: Battery type comparison
 */
export const calculationSessions = pgTable('calculation_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  calculationType: text('calculation_type').notNull(), // 'battery' | 'ups' | 'cable' | 'solar' | 'charge-controller' | 'battery-comparison'

  // Polymorphic data (JSON)
  inputs: jsonb('inputs').notNull(), // Calculation inputs
  results: jsonb('results').notNull(), // Calculation results

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  standardsUsed: text('standards_used').array().notNull().default([]), // ["IEEE 485-2020", "NEC 2020"]
  unitSystem: text('unit_system').notNull().default('IEC'), // 'IEC' | 'NEC'

  // Optional grouping
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),

  // Validation status
  warnings: jsonb('warnings').notNull().default('[]'), // ValidationWarning[]
  isValid: boolean('is_valid').notNull().default(true),

  // Soft delete (2-year retention per FR-020)
  deletedAt: timestamp('deleted_at'),
})

/**
 * Projects table
 *
 * Groups related calculations (e.g., "Office Building Electrical Design")
 * Registered users only
 */
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * User preferences table
 *
 * Stores per-user default settings
 */
export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  defaultStandards: text('default_standards').notNull().default('IEC'), // 'IEC' | 'NEC'
  defaultVoltage: integer('default_voltage'), // Quick calculation default
  conservativeMode: boolean('conservative_mode').notNull().default(false), // Stricter limits
  showInfoMessages: boolean('show_info_messages').notNull().default(true),
  emailNotifications: boolean('email_notifications').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * PDF export log table
 *
 * Tracks PDF generation for analytics and troubleshooting
 */
export const pdfExportLogs = pgTable('pdf_export_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  calculationId: uuid('calculation_id').notNull().references(() => calculationSessions.id, { onDelete: 'cascade' }),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  generationTimeMs: integer('generation_time_ms').notNull(),
  userAgent: text('user_agent'),
  exportedAt: timestamp('exported_at').notNull().defaultNow(),
})

/**
 * Audit log table
 *
 * Tracks significant user actions for security and compliance
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // 'calculation_created' | 'calculation_updated' | 'calculation_deleted' | 'pdf_exported' | 'login' | 'logout' | 'account_created' | 'account_deleted'
  entityType: text('entity_type'), // 'calculation' | 'project' | 'user'
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'), // Additional action-specific data
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * Relations
 *
 * Define foreign key relationships for Drizzle ORM
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  calculations: many(calculationSessions),
  projects: many(projects),
  preferences: one(userPreferences),
  auditLogs: many(auditLogs),
}))

export const calculationSessionsRelations = relations(calculationSessions, ({ one }) => ({
  user: one(users, {
    fields: [calculationSessions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [calculationSessions.projectId],
    references: [projects.id],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  calculations: many(calculationSessions),
}))

export const pdfExportLogsRelations = relations(pdfExportLogs, ({ one }) => ({
  user: one(users, {
    fields: [pdfExportLogs.userId],
    references: [users.id],
  }),
  calculation: one(calculationSessions, {
    fields: [pdfExportLogs.calculationId],
    references: [calculationSessions.id],
  }),
}))

/**
 * Type exports for use in application code
 */
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type CalculationSession = typeof calculationSessions.$inferSelect
export type NewCalculationSession = typeof calculationSessions.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type UserPreferences = typeof userPreferences.$inferSelect
export type NewUserPreferences = typeof userPreferences.$inferInsert
export type PDFExportLog = typeof pdfExportLogs.$inferSelect
export type NewPDFExportLog = typeof pdfExportLogs.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
