# Quickstart: Session Memory File

**Feature**: 001-session-memory-file
**Date**: 2025-12-25

## Overview

The session memory file feature captures your project state (tasks, blockers, tests, environment) to `.claude/session-memory.md`, enabling Claude Code to automatically restore context when you start a new session.

## Installation

No installation required. This feature is built into the ElectroMate project using native Node.js APIs.

## Usage

### Saving Session State

**User Command** (to be implemented by Claude Code CLI):
```bash
/save-session
# or
/snapshot
```

**Expected Output**:
```
✅ Session memory saved to .claude/session-memory.md
📊 Captured: 60/155 tasks, 1 blocker, 46/47 tests passing
⏱️  Generated in 2.3s
```

**What Gets Captured**:
- ✅ Task completion status from `tasks.md`
- ✅ High-priority blockers with actionable resolutions
- ✅ Test results (Vitest unit tests, Playwright E2E tests)
- ✅ Development server status (ports, processes)
- ✅ Dependency and build status
- ✅ Files needing attention (failing tests, type errors, TODOs)
- ✅ Recommended next steps

**What Gets Filtered**:
- ❌ API keys, passwords, tokens
- ❌ Database connection strings with credentials
- ❌ Private keys and certificates
- ❌ AWS access keys and secrets
- ❌ Any sensitive environment variables

### Automatic Context Restoration

**Behavior** (FR-013):
When you start Claude Code, it automatically:
1. Checks for `.claude/session-memory.md` in project root
2. Loads the file if present
3. Restores full project context silently
4. Enables immediate productivity without re-explanation

**Verification**:
Ask Claude Code questions like:
- "What's the current project status?"
- "What tests are failing?"
- "What's blocking progress?"
- "What should I work on next?"

Claude Code will answer immediately using the memory file, without needing additional context from you.

### Manual Review

**Opening the Memory File**:
```bash
# View in any markdown editor
cat .claude/session-memory.md
# or
code .claude/session-memory.md
```

**File Structure**:
```markdown
# Session Memory: ElectroMate

**Generated**: 2025-12-25T14:30:00Z
**Branch**: 001-session-memory-file

## Executive Summary
1. Project description
2. Completion status
3. Current phase
4. Major blocker
5. Next action

## Task Status
[Table showing phase completion]

## Blockers
[High/Medium/Low priority blockers]

## Test Results
[Unit and E2E test summaries]

## Environment State
[Servers, dependencies, build status]

## Files Needing Attention
[List of files requiring fixes]

## Next Steps
[Prioritized action items]
```

## Examples

### Example 1: Mid-Session Save

**Scenario**: You've completed Battery Calculator implementation and want to save progress before taking a break.

```bash
/save-session
```

**Generated Memory File** (excerpt):
```markdown
# Session Memory: ElectroMate

**Generated**: 2025-12-25T14:30:00Z
**Branch**: feature/battery-calculator

## Executive Summary

1. ElectroMate - High-precision electrical engineering calculation platform
2. 60/155 tasks complete (38.7%)
3. Current phase: Core Development - Battery Calculator implementation
4. Major blocker: Database setup blocked by missing .env.local file
5. Next action: Create .env.local from template and configure NEON_DATABASE_URL

## Task Status

**Source**: specs/electromate/tasks.md

| Phase | Completed | Total | Percentage |
|-------|-----------|-------|------------|
| Setup | 5 | 5 | 100.0% |
| Core | 25 | 50 | 50.0% |
| Testing | 10 | 30 | 33.3% |

**Current Task**: T051 - Implement UPS sizing calculator

**Next Tasks**: T052, T053, T054, T055

## Blockers

### High Priority

- **T032**: Missing .env.local file
  - **Required**: NEON_DATABASE_URL environment variable for database connection
  - **Action**: Create .env.local from .env.local.example and populate with Neon PostgreSQL URL

## Test Results

**Last Run**: 2025-12-25T14:15:00Z

### Unit Tests (Vitest)

- **Status**: 46/47 passing (97.9%)
- **Failed**: `__tests__/calculations/efficiency.test.ts:42` - Edge case validation
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
- **Last Install**: 2025-12-24T10:00:00Z
- **Package Manager**: npm

### Build Status

- **Status**: Success
- **Last Build**: 2025-12-24T14:30:00Z
- **Output**: `.next/`

## Next Steps

1. **Immediate**: Create .env.local and resolve T032 blocker
2. **Immediate**: Fix efficiency test failure in __tests__/calculations/efficiency.test.ts:42
3. **Short-term**: Complete Battery Calculator (T051-T055)
4. **Short-term**: Run E2E test suite before merging
5. **Medium-term**: Begin UPS Sizing Calculator implementation
```

### Example 2: Fresh Session Startup

**Scenario**: You open Claude Code the next day.

**Claude Code Behavior**:
```
🔄 Loading session context from .claude/session-memory.md...
✅ Context restored: ElectroMate (60/155 tasks, 1 blocker, 46/47 tests)
```

**You**: "What should I work on?"

**Claude Code**: "Based on the session memory, you have one high-priority blocker:

**T032 - Missing .env.local file**: You need to create `.env.local` from `.env.local.example` and configure `NEON_DATABASE_URL` for database connection. This is blocking database setup.

Additionally, there's one failing test:
- `__tests__/calculations/efficiency.test.ts:42` - Edge case validation

I recommend resolving the .env.local blocker first since it affects database-dependent features."

*(No context re-explanation needed!)*

## Best Practices

### When to Save

✅ **Good times to save**:
- End of work session (natural stopping point)
- After completing a major milestone (feature done, tests passing)
- Before switching branches or working on different features
- Before taking a break (lunch, meetings, end of day)

❌ **Avoid saving**:
- In the middle of a failing build (not representative state)
- During active debugging (too transient)
- Multiple times per hour (unnecessary churn)

### Staleness Warning

Memory files include a timestamp. If you haven't saved recently:
- Claude Code may warn: "⚠️  Session memory is 3 days old. Consider running /save-session to update."
- Manually regenerate: `/save-session` to capture current state

### Version Control

**Recommendation**: Add `.claude/session-memory.md` to `.gitignore`

**Rationale**:
- Session memory is personal state, not team-shared
- Different developers may be at different points in the project
- Prevents merge conflicts on developer-specific state

**.gitignore entry**:
```gitignore
# Claude Code session memory (personal state)
.claude/session-memory.md
```

**Exception**: If your team wants shared snapshots, commit intentionally with descriptive commit messages:
```bash
git add .claude/session-memory.md
git commit -m "Session snapshot: Battery Calculator 95% complete"
```

## Troubleshooting

### Problem: Memory file not being loaded automatically

**Check**:
1. File exists at `.claude/session-memory.md` (exact path from project root)
2. File is valid markdown (not corrupted)
3. Claude Code is started from project root directory

**Workaround**: Manually reference the file:
```
"Please review .claude/session-memory.md for project status"
```

### Problem: Memory file contains stale information

**Solution**: Regenerate the memory file:
```bash
/save-session
```

This overwrites the existing file with current state.

### Problem: Memory file too large (>50KB)

**Cause**: Large project with many tasks/tests

**Solution**: The generator automatically truncates:
- Max 50 blockers
- Max 50 files needing attention
- Max 20 test failures
- Max 10 next steps

If still exceeding 50KB, file will be truncated progressively with "... and X more" indicators.

### Problem: Sensitive data accidentally captured

**Prevention**: The generator includes allowlist-based filtering for:
- API keys (`API_KEY`, `APIKEY`)
- Passwords (`PASSWORD`, `PASSWD`)
- Tokens (`TOKEN`, `JWT`, `BEARER`)
- Database URLs with credentials (`postgresql://user:pass@...`)
- AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)

**If it happens**:
1. Delete `.claude/session-memory.md` immediately
2. Regenerate: `/save-session`
3. Report the pattern that slipped through (for filter improvement)

## Architecture Notes

### How It Works

1. **Generation Phase**:
   - Collector modules scan project files (tasks.md, test outputs, package.json)
   - Process detection identifies active servers via OS commands (netstat/lsof)
   - Sensitive data filter sanitizes all captured content
   - Markdown serializer generates structured output
   - File written to `.claude/session-memory.md` (overwrites existing)

2. **Loading Phase** (Claude Code CLI internal):
   - Check for `.claude/session-memory.md` on startup
   - Parse markdown into structured data
   - Load into Claude Code context
   - User can immediately query project state

### Performance

- **Generation**: <10 seconds (SC-001)
- **Loading**: <100ms (instant context restoration)
- **File Size**: <50KB (SC-006)

### Compatibility

- **Cross-platform**: Works on Windows, macOS, Linux
- **No dependencies**: Uses only Node.js native APIs (fs, path, child_process)
- **Markdown standard**: Any markdown viewer can read the file

## Next Steps

- **Implement**: Follow `tasks.md` to build the feature
- **Test**: Run unit and E2E tests to validate behavior
- **Integrate**: Add `/save-session` command to Claude Code CLI
- **Document**: Update Claude Code user guide with session memory feature

---

**Related Documentation**:
- [spec.md](./spec.md) - Full feature specification
- [plan.md](./plan.md) - Implementation plan and architecture
- [data-model.md](./data-model.md) - TypeScript type definitions
- [contracts/session-memory.types.ts](./contracts/session-memory.types.ts) - Type contracts
