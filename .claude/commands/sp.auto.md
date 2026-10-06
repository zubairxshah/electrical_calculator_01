---
description: Run the full SDD pipeline (specify → clarify → plan → tasks → analyze → implement) automatically in one go, pausing only when human judgment is required.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Keep the complete Spec-Driven Development process, but chain the steps automatically instead of waiting for the user between them.

The input may be:
- A feature description → start from step 1.
- `resume` (or empty while on a feature branch with existing artifacts) → detect the furthest completed step from `specs/<feature>/` (spec.md, plan.md, tasks.md, task checkboxes) and continue from the next step.
- `from <step>` (e.g. `from plan`) → start at that step for the current feature.

## Pipeline

Execute each step by following its command file exactly (`.claude/commands/sp.<step>.md`), with the overrides below.

1. **specify** — `.claude/commands/sp.specify.md` with the feature description.
2. **clarify** — `.claude/commands/sp.clarify.md`. Batch ALL clarification questions into a single AskUserQuestion call (max 4 questions, each with a recommended option first). If the spec has no material ambiguities, skip asking and continue.
3. **plan** — `.claude/commands/sp.plan.md`. Derive tech context from the existing codebase and `.claude` memory (Next.js, TypeScript, Zustand, mathjs, Zod, jsPDF, Vitest; `lib/calculations/<feature>/`, `types/`, `stores/`, `components/`, `app/`).
4. **tasks** — `.claude/commands/sp.tasks.md`.
5. **analyze** — `.claude/commands/sp.analyze.md`. Fix any CRITICAL/HIGH findings in the artifacts yourself, then re-check once.
6. **implement** — `.claude/commands/sp.implement.md`. Work user story by user story; run the unit tests (`npx vitest run <path>`) and `npx tsc --noEmit` after each story; mark tasks `[X]` as they complete.

## Overrides for the chained run

- **No per-step PHRs.** Skip the PHR section in every step's command file. Write ONE session-summary PHR at the end (see CLAUDE.md §3).
- **No "next step" handoff prompts.** Do not stop to suggest the next command; just proceed.
- After each step, print a one-line status: `✓ <step> — <artifact path> — <key result>`.

## Pause ONLY when

1. Clarification questions are genuinely needed (step 2), or a new ambiguity arises later that changes the design.
2. An architecturally significant decision passes the ADR test → show the 📋 suggestion and ask for consent.
3. `analyze` reports a CRITICAL issue you cannot resolve without changing user intent.
4. Tests or type-checks keep failing after reasonable attempts to fix them.
5. A destructive or outward-facing action is needed (push, PR, deleting files) — always confirm.

Otherwise, keep going until implementation is complete.

## Completion

1. Report: feature, branch, artifacts produced, tasks completed / total, test results (count, pass/fail), deferred items.
2. Write the single session-summary PHR under `history/prompts/<feature>/`.
3. Offer to commit (do not commit without approval).
