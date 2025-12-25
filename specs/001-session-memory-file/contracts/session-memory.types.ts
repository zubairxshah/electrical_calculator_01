/**
 * TypeScript Type Definitions for Session Memory File
 *
 * Feature: 001-session-memory-file
 * Date: 2025-12-25
 *
 * These types define the structured data model for the session memory file system.
 * All types are exported for use in generator.ts, parser.ts, and test files.
 */

// ============================================================================
// Root Structure
// ============================================================================

export interface SessionMemory {
  metadata: SessionMetadata;
  summary: ExecutiveSummary;
  taskStatus: TaskStatus;
  blockers: BlockerEntry[];
  testResults: TestResults;
  environment: EnvironmentState;
  filesNeedingAttention: FileReference[];
  nextSteps: NextStep[];
}

// ============================================================================
// Metadata
// ============================================================================

export interface SessionMetadata {
  /** Project name extracted from package.json or directory name */
  projectName: string;

  /** ISO 8601 timestamp when memory file was generated */
  generatedAt: string;

  /** Current git branch name or "unknown" if not in git repo */
  branch: string;

  /** Time since last save, e.g., "2h 15m" (optional) */
  sessionDuration?: string;

  /** Session memory format version (semantic versioning) */
  version: string;
}

// ============================================================================
// Executive Summary
// ============================================================================

export interface ExecutiveSummary {
  /** One-sentence project description */
  projectDescription: string;

  /** Completion status with fraction and percentage, e.g., "60/155 tasks complete (38.7%)" */
  completionStatus: string;

  /** Current development phase, e.g., "Core Development" */
  currentPhase: string;

  /** Major blocker description or null if no high-priority blockers */
  majorBlocker: string | null;

  /** Next recommended action (imperative verb) */
  nextAction: string;
}

// ============================================================================
// Task Status
// ============================================================================

export interface TaskStatus {
  /** Path to tasks.md file (relative from project root) */
  sourceFile: string;

  /** Task completion breakdown by phase */
  phases: PhaseStatus[];

  /** Currently in-progress task or null if none */
  currentTask: TaskReference | null;

  /** Next 3-5 upcoming tasks */
  nextTasks: TaskReference[];
}

export interface PhaseStatus {
  /** Phase name, e.g., "Setup", "Core", "Testing" */
  name: string;

  /** Number of completed tasks in this phase */
  completed: number;

  /** Total number of tasks in this phase */
  total: number;

  /** Completion percentage (computed: completed / total * 100), rounded to 1 decimal */
  percentage: number;
}

export interface TaskReference {
  /** Task ID, e.g., "T032" */
  id: string;

  /** Task title/description */
  title: string;

  /** Phase this task belongs to */
  phase: string;
}

// ============================================================================
// Blockers
// ============================================================================

export interface BlockerEntry {
  /** Priority level affecting sort order and display */
  priority: 'high' | 'medium' | 'low';

  /** Affected task ID or null if project-wide blocker */
  taskId: string | null;

  /** Short blocker title (max 100 chars) */
  title: string;

  /** Detailed description of the blocker */
  description: string;

  /** Actionable resolution step (imperative verb) */
  requiredAction: string;

  /** ISO 8601 timestamp when blocker was detected (optional) */
  detectedAt?: string;
}

// ============================================================================
// Test Results
// ============================================================================

export interface TestResults {
  /** ISO 8601 timestamp of last test run or null if never run */
  lastRun: string | null;

  /** Unit test suite results (e.g., Vitest) */
  unit: TestSuite;

  /** End-to-end test suite results (e.g., Playwright) */
  e2e: TestSuite;
}

export interface TestSuite {
  /** Test framework name, e.g., "Vitest", "Playwright", "Jest" */
  framework: string;

  /** Overall test suite status */
  status: 'passed' | 'failed' | 'not-run';

  /** Number of passing tests */
  passed: number;

  /** Number of failing tests */
  failed: number;

  /** Total number of tests */
  total: number;

  /** Pass rate percentage (passed / total * 100), rounded to 1 decimal */
  percentage: number;

  /** Details of failed tests (max 20 entries) */
  failures: TestFailure[];

  /** Command to run this test suite, e.g., "npm test" */
  command: string;
}

export interface TestFailure {
  /** Relative path to test file */
  file: string;

  /** Line number where test failure occurred (optional) */
  line?: number;

  /** Name/description of failing test */
  testName: string;

  /** Short error message (first line, max 200 chars, sanitized) */
  message?: string;
}

// ============================================================================
// Environment State
// ============================================================================

export interface EnvironmentState {
  /** Active development servers detected on system */
  servers: ServerInfo[];

  /** Dependency installation status */
  dependencies: DependencyStatus;

  /** Build/compilation status */
  build: BuildStatus;
}

export interface ServerInfo {
  /** Process name: "npm", "node", "python", etc. */
  process: string;

  /** Port number where server is listening */
  port: number;

  /** Full URL to access server (no auth credentials) */
  url: string;

  /** Process ID (optional, if detectable) */
  pid?: number;

  /** Server running status */
  status: 'running' | 'stopped';
}

export interface DependencyStatus {
  /** Overall dependency freshness status */
  status: 'up-to-date' | 'outdated' | 'unknown';

  /** ISO 8601 timestamp of last dependency install or null */
  lastInstall: string | null;

  /** Package manager in use */
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';

  /** Number of outdated packages (optional, if detected) */
  outdatedCount?: number;
}

export interface BuildStatus {
  /** Build result status */
  status: 'success' | 'failed' | 'not-run';

  /** ISO 8601 timestamp of last build or null */
  lastBuild: string | null;

  /** Build output directory, e.g., ".next/", "dist/" (optional) */
  outputDir?: string;

  /** Build error messages (max 10, truncated to 200 chars each) */
  errors?: string[];
}

// ============================================================================
// Files Needing Attention
// ============================================================================

export interface FileReference {
  /** Relative path to file from project root */
  path: string;

  /** Line number of concern (optional) */
  line?: number;

  /** Reason why file needs attention (actionable description) */
  reason: string;

  /** Priority level for triage */
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Next Steps
// ============================================================================

export interface NextStep {
  /** Priority/timeline category */
  priority: 'immediate' | 'short-term' | 'medium-term' | 'long-term';

  /** Actionable description starting with imperative verb */
  action: string;

  /** Optional reference to related file or task ID */
  reference?: string;
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;

  /** Array of validation error messages (empty if valid) */
  errors: string[];

  /** Array of non-critical warnings (optional) */
  warnings?: string[];
}

// ============================================================================
// Parsing
// ============================================================================

export interface ParseError extends Error {
  /** Type of parse error */
  code: 'MISSING_SECTION' | 'INVALID_FORMAT' | 'CORRUPTED_DATA' | 'UNKNOWN';

  /** Section name where error occurred (if applicable) */
  section?: string;

  /** Line number in markdown where error occurred (if applicable) */
  line?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const SESSION_MEMORY_VERSION = '1.0';
export const SESSION_MEMORY_PATH = '.claude/session-memory.md';
export const MAX_FILE_SIZE_BYTES = 50 * 1024; // 50KB
export const MAX_BLOCKERS = 50;
export const MAX_FILES_NEEDING_ATTENTION = 50;
export const MAX_TEST_FAILURES = 20;
export const MAX_NEXT_STEPS = 10;
export const MAX_NEXT_TASKS = 5;
export const MAX_BUILD_ERRORS = 10;
export const MAX_SERVERS = 20;
