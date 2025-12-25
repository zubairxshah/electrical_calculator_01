# Feature Specification: Session Memory File for Project Continuity

**Feature Branch**: `001-session-memory-file`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "write memory file so we can start from that point when we start claude code next time"

## Clarifications

### Session 2025-12-25

- Q: Should Claude Code automatically detect and load the session memory file when starting a new session, or should it require an explicit user command? → A: Automatic: Claude Code automatically detects and loads `.claude/session-memory.md` on startup if present
- Q: What is the exact file path where the session memory file should be stored? → A: `.claude/session-memory.md`
- Q: When a user saves the memory file multiple times within the same Claude Code session, what should happen? → A: Overwrite: Each save completely overwrites `.claude/session-memory.md` with the latest state
- Q: Should database URLs and connection strings be excluded from the session memory file? → A: Exclude completely: Database URLs/connection strings are fully excluded from memory files
- Q: How should the system detect and report active development server status? → A: Process detection: Check for common dev server processes (npm, node, python) running on typical ports (3000-3099, 5173, 8000-8080)

## User Scenarios & Testing

### User Story 1 - Save Current Project State (Priority: P1)

A developer working on ElectroMate with Claude Code completes a work session (implementing features, running tests, fixing bugs) and needs to save the current project state so they can resume from exactly where they left off in the next Claude Code session.

**Why this priority**: This is the core value proposition - enabling session continuity. Without this, developers lose context between sessions and must manually re-explain project state, wasting time and risking information loss.

**Independent Test**: Can be fully tested by creating a memory file mid-session, closing Claude Code, reopening it, and verifying that all critical context (completed tasks, current progress, blockers, environment state) is preserved and accessible.

**Acceptance Scenarios**:

1. **Given** a developer has completed 60/155 tasks on ElectroMate and the dev server is running on port 3001, **When** they execute the memory save command, **Then** the system creates a structured memory file containing task completion status, server configuration, environment state, and next recommended actions
2. **Given** the developer has identified specific blockers (e.g., missing .env.local file blocking database setup), **When** the memory file is generated, **Then** it includes a "Blockers" section with actionable descriptions of what's preventing progress
3. **Given** tests have been run with 46/47 passing, **When** the memory save occurs, **Then** the file captures test results, failure details, and references to specific test files needing attention

---

### User Story 2 - Restore Project Context in New Session (Priority: P1)

A developer opens Claude Code for a new work session and needs to quickly restore full project context including what was completed, what's next, known issues, and environment configuration.

**Why this priority**: This is the counterpart to saving - without reliable restoration, the save function has no value. Fast context restoration enables immediate productivity without re-discovery.

**Independent Test**: Can be tested by loading a previously saved memory file at session start and verifying that Claude Code can immediately answer questions about project status, identify next tasks, and reference specific blockers without needing additional context from the developer.

**Acceptance Scenarios**:

1. **Given** a saved memory file exists from a previous session, **When** the developer starts a new Claude Code session and references the memory file, **Then** Claude Code understands the current project state (ElectroMate at 60/155 tasks, Battery Calculator 95% complete, database setup blocked)
2. **Given** the memory file contains test failure information (1 efficiency validation test failing), **When** the developer asks "what needs fixing?", **Then** Claude Code can immediately reference the specific test file and failure without re-running tests
3. **Given** the memory file documents that the dev server is on port 3001, **When** the developer asks about accessing the application, **Then** Claude Code provides the correct URL without needing to check server status

---

### User Story 3 - Quick Status Summary (Priority: P2)

A developer who has been away from the project for days/weeks opens the memory file and needs a concise executive summary of project status without reading the entire document.

**Why this priority**: Reduces cognitive load when returning to a project after a break. A well-structured summary enables faster re-engagement than parsing detailed logs.

**Independent Test**: Can be tested by having a non-context developer read only the summary section and verify they can answer: What's the project? What's done? What's next? What's blocked?

**Acceptance Scenarios**:

1. **Given** a memory file exists, **When** the developer opens it, **Then** the first section provides a 5-sentence summary covering: project name, completion percentage, current phase, major blocker, and next recommended action
2. **Given** multiple work sessions have occurred, **When** viewing the summary, **Then** it reflects the most recent state (not historical states from earlier saves)

---

### Edge Cases

- **Resolved**: Multiple saves in same session → Each save overwrites `.claude/session-memory.md` with latest state (no versioning within session)
- **Resolved**: Sensitive information exclusion → API keys, passwords, tokens, and database URLs/connection strings are completely excluded from memory files
- **Resolved**: Server detection → Check for common dev server processes (npm, node, python) on ports 3000-3099, 5173, 8000-8080
- How does the system handle incomplete or corrupted memory files during restoration?
- What if environment state has changed significantly between sessions (e.g., database now available, different port)?
- What happens if the memory file is manually edited between sessions?
- How large can the memory file grow before it becomes unwieldy?

## Requirements

### Functional Requirements

- **FR-001**: System MUST generate a structured markdown memory file capturing current project state when requested by the user (overwrites existing file with latest state)
- **FR-002**: Memory file MUST include task completion status with reference to tasks.md (completed/incomplete counts, current phase)
- **FR-003**: Memory file MUST document known blockers with actionable descriptions (e.g., "T032 blocked: requires .env.local with NEON_DATABASE_URL")
- **FR-004**: Memory file MUST capture test results including pass/fail counts, specific failing tests with file references, and test command outputs
- **FR-005**: Memory file MUST record environment state including active servers detected via process scanning (npm, node, python processes on ports 3000-3099, 5173, 8000-8080), installed dependencies, and build status
- **FR-006**: Memory file MUST provide "Next Steps" section with recommended actions prioritized by importance
- **FR-007**: Memory file MUST include a concise executive summary (max 5 sentences) at the top for quick scanning
- **FR-008**: Memory file MUST reference specific file paths for code needing attention (failing tests, type errors, incomplete implementations)
- **FR-009**: Memory file MUST be human-readable markdown suitable for both Claude Code parsing and developer review
- **FR-010**: Memory file MUST be stored at `.claude/session-memory.md` in the project root
- **FR-011**: System MUST exclude sensitive information (API keys, passwords, tokens, database URLs, and connection strings) from memory files
- **FR-012**: Memory file MUST include timestamp of when it was generated
- **FR-013**: System MUST automatically detect and load `.claude/session-memory.md` on Claude Code startup if the file exists in the project root

### Key Entities

- **Session Memory File**: A markdown document containing structured project state information including task status, blockers, test results, environment configuration, and next steps. Persisted to disk for cross-session continuity.

- **Task Status Record**: Subset of tasks.md showing completion counts by phase, current task ID, and percentage complete. Links back to authoritative tasks.md file.

- **Blocker Entry**: Description of impediment preventing progress, including affected task IDs, required resolution actions, and priority level.

- **Test Result Snapshot**: Summary of test execution including framework used (Vitest/Playwright), pass/fail counts, specific failure details with file/line references, and test command for reproduction.

- **Environment State**: Configuration details including server status detected via process scanning (npm, node, python on ports 3000-3099, 5173, 8000-8080), installed dependencies (package.json match), build status (success/fail/not run), and any manual setup steps required.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Developer can generate a complete memory file in under 10 seconds via single command
- **SC-002**: Memory file enables Claude Code to answer "what's the project status?" question in new session without additional context from developer
- **SC-003**: Developer resuming work from memory file reaches productive state (ready to code/test/debug) within 2 minutes vs. 10+ minutes without memory file
- **SC-004**: Memory file accurately captures 100% of critical context: task completion, blockers, test status, environment state
- **SC-005**: 90% of developers can understand project status by reading only the executive summary section
- **SC-006**: Memory file size remains under 50KB for typical projects to ensure fast loading and readability
- **SC-007**: Zero sensitive information (credentials, API keys) leaked into memory files across all test cases

## Scope

### In Scope

- Markdown-formatted memory file generation
- Capturing task completion status from tasks.md
- Documenting blockers with actionable descriptions
- Recording test results (pass/fail, specific failures)
- Environment state documentation (servers, dependencies, build status)
- Executive summary for quick scanning
- File path references for code needing attention
- Timestamp metadata
- Sensitive information filtering
- Automatic context restoration on Claude Code startup (detects and loads `.claude/session-memory.md` if present)

### Out of Scope

- Automatic memory file generation (triggered manually only)
- Version history of memory files (single file overwrite approach)
- Integration with git commits or PRs
- Automatic detection and fixing of blockers
- Re-running tests or servers from memory file (documentation only)
- Encryption or security beyond sensitive data exclusion
- Memory file synchronization across machines/team members
- Memory file format conversion (markdown only)
- Graphical UI for memory file viewing (text/markdown editors only)

### Assumptions

- Developer has write access to project directory for saving memory files
- Project uses tasks.md format compatible with ElectroMate structure
- Memory files will be used primarily with Claude Code sessions but remain human-readable
- Memory file size will not exceed reasonable limits for typical software projects
- Developers will manually trigger memory file generation at logical stopping points
- Memory files are intended for individual developer use, not team collaboration
- Standard markdown viewers/editors are sufficient for memory file review
- Session continuity is more valuable than perfect state reproduction (memory file provides guidance, not automation)

## Dependencies

### External Dependencies

- None - This is a documentation/state capture feature with no external service dependencies

### Internal Dependencies

- Access to `tasks.md` file for task completion status
- Access to test output (Vitest/Playwright results) if available
- Access to server process status if development servers are running
- Access to `package.json` and lock files for dependency verification
- Read access to project files for identifying code locations needing attention

## Risks

### Technical Risks

- **Risk**: Memory file becomes stale if project state changes significantly between save and restore
  **Mitigation**: Include timestamp prominently; recommend generating new memory file when resuming long-dormant projects

- **Risk**: Sensitive information accidentally included in memory file despite filtering
  **Mitigation**: Implement allowlist approach for included data rather than blocklist; provide clear documentation on what's captured

- **Risk**: Memory file grows too large for practical use on complex projects
  **Mitigation**: Focus on summary information with references to detailed logs rather than embedding full outputs; set size targets

### User Experience Risks

- **Risk**: Developers expect memory file to automatically restore state (run servers, checkout branches) rather than just document it
  **Mitigation**: Clear documentation that memory file is "smart documentation" not "automation"; focus on reducing cognitive load, not eliminating manual setup

- **Risk**: Memory file format becomes inconsistent across different project types, reducing reliability
  **Mitigation**: Use structured markdown with consistent section headings; validate template compliance

## Notes

This feature addresses a common pain point in AI-assisted development: loss of context between sessions. While Claude Code (and similar tools) excel at in-session assistance, they traditionally start each new session with zero project context unless the developer manually re-explains everything.

The session memory file serves as a "project state checkpoint" that bridges sessions by capturing:

1. **Progress**: What's done, what's in progress, completion metrics
2. **Blockers**: What's preventing progress and what's needed to unblock
3. **Quality**: Test results, build status, known issues
4. **Environment**: Server configuration, dependency state
5. **Navigation**: What to work on next

**Key Design Principles**:

- **Human-readable first**: Memory files must be useful to developers directly, not just parseable by AI
- **Documentation over automation**: File documents state; it doesn't restore or execute actions
- **Actionable information**: Every section should answer "what should I do about this?"
- **Reference architecture**: Link to detailed sources (tasks.md, test files) rather than duplicate content
- **Safety-first**: Aggressive filtering of sensitive data to prevent credential leakage

**Success Metric**: If a developer can hand their laptop to a colleague, have the colleague open the memory file, and that colleague can start contributing productively within 5 minutes, the feature succeeds.
