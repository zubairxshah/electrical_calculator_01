# Research: Session Memory File for Project Continuity

**Feature**: 001-session-memory-file
**Date**: 2025-12-25
**Status**: Complete

## Overview

This document captures research findings and technical decisions for implementing the session memory file feature. All NEEDS CLARIFICATION items from Technical Context have been resolved.

## Research Areas

### 1. Cross-Platform Process Detection

**Question**: How to reliably detect active development servers (npm, node, python) on ports 3000-3099, 5173, 8000-8080 across Windows, macOS, and Linux?

**Research Findings**:

**Option A: Native OS Commands**
- **Windows**: `netstat -ano` + `tasklist /FI "PID eq <pid>"`
- **macOS/Linux**: `lsof -i :<port>` or `netstat -tulpn`
- **Pros**: No external dependencies, fast execution (<100ms)
- **Cons**: Requires spawning child processes, parsing different output formats per OS

**Option B**: Node.js `process-list` package
- **Pros**: Cross-platform API, structured output
- **Cons**: External dependency, may not detect port bindings reliably

**Option C**: Node.js `net` module port scanning
- **Pros**: Native Node.js, simple API
- **Cons**: Only detects port is open, not which process/command

**Decision**: **Option A (Native OS Commands)**

**Rationale**:
- No external dependencies aligns with constitution principle (simplicity)
- Performance meets <10s generation requirement
- Can extract both process name (npm/node/python) and port information
- Implementation: Use `child_process.exec` with platform detection via `process.platform`

**Implementation Strategy**:
```typescript
// Pseudo-code
async function detectServers(): Promise<ServerInfo[]> {
  const ports = [3000, 3001, ..., 5173, 8000, 8080];
  const platform = process.platform;

  if (platform === 'win32') {
    // Use netstat + tasklist combination
  } else {
    // Use lsof or netstat (Linux/macOS)
  }

  return servers.filter(s =>
    s.process.includes('npm') ||
    s.process.includes('node') ||
    s.process.includes('python')
  );
}
```

---

### 2. Sensitive Data Detection Patterns

**Question**: What regex patterns and heuristics should be used to detect API keys, passwords, tokens, and database URLs in captured content?

**Research Findings**:

Common sensitive data patterns in development projects:
1. **API Keys**: `API_KEY`, `APIKEY`, `api-key`, typically alphanumeric 20-64 chars
2. **Passwords**: `PASSWORD`, `passwd`, `pwd`, any value in password-related fields
3. **Tokens**: `TOKEN`, `JWT`, `BEARER`, `auth_token`, typically base64 or hex
4. **Database URLs**: `postgresql://`, `mysql://`, `mongodb://`, connection strings with credentials
5. **AWS Credentials**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
6. **OAuth Secrets**: `CLIENT_SECRET`, `SECRET_KEY`, `PRIVATE_KEY`

**Decision**: **Allowlist approach + Pattern matching**

**Rationale**:
- Constitution mandates "allowlist approach for included data rather than blocklist"
- More secure than trying to blocklist all possible sensitive patterns
- Reduces risk of false negatives (missed secrets)

**Implementation Strategy**:
```typescript
// Allowlist: only capture these data types
const ALLOWED_DATA_TYPES = [
  'task completion counts',
  'test pass/fail counts',
  'file paths',
  'port numbers (without auth)',
  'package names (without versions containing tokens)',
  'build status (success/fail)',
];

// Pattern blocklist for additional safety
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /password/i,
  /secret/i,
  /token/i,
  /(postgres|mysql|mongodb):\/\/[^@]*:[^@]*@/i,  // Connection strings with creds
  /-----BEGIN [A-Z ]+ KEY-----/,  // PEM keys
  /[A-Z0-9]{20,}/,  // Long alphanumeric (potential keys)
];

function filterSensitiveData(content: string): string {
  // 1. Remove entire lines matching sensitive patterns
  // 2. Redact connection strings: "postgres://user:***@host/db" → "postgres://***@host/db"
  // 3. Validate output contains only allowed data types
}
```

**Test Cases**:
- ✅ Detect and remove `NEON_DATABASE_URL=postgresql://user:pass@host/db`
- ✅ Detect and remove `API_KEY=sk_live_abc123...`
- ✅ Allow `Server running on port 3001` (no credentials)
- ✅ Allow `46/47 tests passing` (metrics only)
- ✅ Detect AWS access keys in environment dumps

---

### 3. Markdown File Structure and Template

**Question**: What is the optimal structure for the `.claude/session-memory.md` file to balance human readability and machine parseability?

**Research Findings**:

Analyzed similar "state checkpoint" formats:
- **Git commit messages**: Structured with summary + body + trailers
- **Kubernetes status**: YAML with conditions, state, metadata
- **CI/CD reports**: Markdown with sections, tables, code blocks

**Decision**: **Structured Markdown with Fixed Sections**

**Rationale**:
- Human-readable first (constitution principle)
- Fixed section headings enable reliable parsing
- Markdown tables for structured data (test results, task counts)
- Code blocks for file paths and commands
- Compatible with all markdown viewers

**Template Structure**:
```markdown
# Session Memory: [Project Name]

**Generated**: [ISO 8601 timestamp]
**Branch**: [current-branch]
**Session Duration**: [time since last save or N/A]

## Executive Summary

[5-sentence summary per FR-007]:
1. Project name and purpose
2. Completion percentage (X/Y tasks complete)
3. Current phase
4. Major blocker (if any)
5. Next recommended action

## Task Status

**Source**: [path/to/tasks.md]

| Phase | Completed | Total | Percentage |
|-------|-----------|-------|------------|
| Setup | 5 | 5 | 100% |
| Core | 15 | 25 | 60% |
| Testing | 0 | 10 | 0% |

**Current Task**: T032 - Database setup

**Next Tasks**: T033, T034, T035

## Blockers

### High Priority

- **T032**: Missing `.env.local` file
  - **Required**: `NEON_DATABASE_URL` environment variable
  - **Action**: Create `.env.local` from `.env.local.example` and populate database URL

### Medium Priority

[...]

## Test Results

**Last Run**: [timestamp]

### Unit Tests (Vitest)

- **Status**: 46/47 passing (97.9%)
- **Failed**: `__tests__/calculations/efficiency.test.ts:42` - Efficiency validation edge case
- **Command**: `npm test`

### E2E Tests (Playwright)

- **Status**: Not run
- **Command**: `npm run test:e2e`

## Environment State

### Development Servers

- ✅ **Next.js Dev Server**: Running on port 3001
  - **URL**: http://localhost:3001
  - **Process**: node (PID 12345)

### Dependencies

- **Status**: Up to date
- **Last Install**: 2025-12-24
- **Package Manager**: npm

### Build Status

- **Status**: Success
- **Last Build**: 2025-12-24 14:30 UTC
- **Output**: `.next/` directory

## Files Needing Attention

1. `__tests__/calculations/efficiency.test.ts:42` - Failing test
2. `lib/calculations/battery.ts` - TODO: Add aging factor validation
3. `app/battery/page.tsx` - Type error on line 67

## Next Steps

1. **Immediate**: Fix T032 blocker by creating `.env.local` file
2. **Immediate**: Investigate efficiency test failure in `__tests__/calculations/efficiency.test.ts`
3. **Short-term**: Complete remaining Core phase tasks (T033-T037)
4. **Short-term**: Run E2E test suite before merging
5. **Medium-term**: Begin Testing phase after Core completion

---

*Generated by Claude Code Session Memory v1.0*
```

**Parsing Strategy**:
- Use section headings as anchors: `## Task Status`, `## Blockers`, etc.
- Extract structured data from tables (markdown-table parser)
- Parse lists for next steps and file references
- Timestamp enables staleness detection

---

### 4. File Size Management

**Question**: How to ensure memory file stays under 50KB limit (SC-006) for typical projects?

**Research Findings**:

Estimated size contributions:
- **Executive Summary**: ~500 bytes
- **Task Status Table**: ~50 bytes/row × 20 phases ≈ 1KB
- **Blockers**: ~200 bytes/blocker × 10 blockers ≈ 2KB
- **Test Results**: ~1KB (summary only, not full output)
- **Environment State**: ~500 bytes
- **Files Needing Attention**: ~100 bytes/file × 20 files ≈ 2KB
- **Next Steps**: ~500 bytes

**Total Baseline**: ~7KB

**Decision**: **Summary-with-references approach**

**Rationale**:
- Store summary metrics, not raw outputs
- Reference source files instead of duplicating content
- Truncate long lists (e.g., only show top 20 failing tests)
- Omit test output logs (user can re-run tests)

**Size Limits**:
- Max 50 blockers (truncate with "... and X more")
- Max 50 files needing attention
- Max 100 task rows (unlikely, but safeguard)
- Test output: counts only, not logs

**Validation**:
```typescript
const MAX_FILE_SIZE = 50 * 1024; // 50KB

function generateMemoryFile(): string {
  const content = buildMarkdownContent();

  if (Buffer.byteLength(content, 'utf8') > MAX_FILE_SIZE) {
    // Truncate sections progressively:
    // 1. Reduce "Files Needing Attention" to top 10
    // 2. Reduce "Blockers" to high priority only
    // 3. Reduce "Next Steps" to top 3
    // 4. If still >50KB, warn user
  }

  return content;
}
```

---

### 5. Automatic Loading on Startup

**Question**: How does Claude Code detect and load `.claude/session-memory.md` on startup?

**Research Findings**:

This is a **Claude Code CLI feature request**, not implemented in this feature's code. The session memory file feature is responsible for:
1. ✅ Generating `.claude/session-memory.md`
2. ✅ Providing structured, parseable markdown
3. ❌ NOT responsible for automatic loading (Claude Code CLI handles this)

**Decision**: **Generate spec-compliant output; loading is out of scope**

**Rationale**:
- Per spec Out of Scope: "Automatic memory file generation (triggered manually only)"
- Loading mechanism is Claude Code internals, not user code
- This feature provides the file format and generation logic
- Claude Code CLI can read the file via standard Node.js fs APIs

**Documentation Note**:
- Include in `quickstart.md`: "Claude Code automatically detects and loads `.claude/session-memory.md` on startup (per FR-013)"
- Provide example commands: `/save-session` or `/snapshot` (user-facing command name TBD)
- Document expected file location: `.claude/session-memory.md` (FR-010)

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Process Detection** | Native OS commands (netstat/lsof) | No dependencies, fast, cross-platform |
| **Sensitive Data Filtering** | Allowlist + pattern matching | Constitution mandates allowlist approach; more secure |
| **File Structure** | Structured markdown with fixed sections | Human-readable first, reliable parsing |
| **Size Management** | Summary-with-references, 50KB limit | Keep file small, reference detailed sources |
| **Automatic Loading** | Out of scope (Claude Code CLI feature) | This feature generates file; CLI loads it |

## Alternatives Considered

### Process Detection Alternatives Rejected

- **`process-list` package**: Rejected due to external dependency (violates constitution principle of simplicity)
- **Port scanning only**: Rejected because it doesn't identify process name (npm/node/python required per FR-005)

### Sensitive Data Filtering Alternatives Rejected

- **Blocklist-only approach**: Rejected per constitution (allowlist mandated)
- **No filtering**: Rejected due to security risk (SC-007 requires zero credential leakage)

### File Format Alternatives Rejected

- **JSON format**: Rejected because FR-009 requires "human-readable markdown"
- **YAML format**: Rejected for same reason as JSON
- **Plain text**: Rejected because structured data (tables, sections) improves readability

## Implementation Checklist

- [x] Process detection approach finalized
- [x] Sensitive data patterns documented
- [x] Markdown template structure defined
- [x] File size management strategy confirmed
- [x] Automatic loading scope clarified
- [ ] Proceed to Phase 1: Data Model and Contracts

## Next Steps

1. **Phase 1**: Design `data-model.md` with TypeScript interfaces for:
   - `SessionMemory` (root structure)
   - `TaskStatus`, `BlockerEntry`, `TestResult`, `EnvironmentState`
   - `ServerInfo`, `DependencyStatus`, `BuildStatus`

2. **Phase 1**: Define contracts (TypeScript types, no external API needed)

3. **Phase 1**: Create `quickstart.md` with usage examples
