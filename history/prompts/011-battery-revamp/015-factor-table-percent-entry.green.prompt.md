---
id: 015
title: Factor table percent entry
stage: green
date: 2026-06-22
surface: agent
model: claude-opus-4-8
feature: 011-battery-revamp
branch: 011-battery-revamp
user: zubairxshah
command: (resume) start where we left
labels: ["battery", "ui", "derating", "ux"]
links:
  spec: specs/011-battery-revamp/spec.md
  ticket: null
  adr: history/adr/ (ADR-006)
  pr: null
files:
 - components/battery/FactorTable.tsx
tests:
 - npx vitest run battery (47 passed)
 - npx tsc --noEmit (no battery/FactorTable errors)
---

## Prompt

start where we left

## Response snapshot

Resumed feature 011-battery-revamp. The only uncommitted work was a mid-flight tweak in
`components/battery/FactorTable.tsx`: a `suffix?` prop had been added to `OverrideCell` but
no caller used it, and the placeholder ternary had two identical branches — signs of a
half-finished change. Confirmed intent with the user: edit fraction factors as whole
percentages with a `%` suffix.

Completed the change:
- Fraction rows (DoD, temperature correction, system efficiency, end-of-life aging) now
  display/accept whole percentages; conversion (`× 100` in / `÷ 100` out) happens only at
  the input boundary so the store and Zod schema still hold 0–1 fractions — no
  calculation/schema change.
- Peukert exponent stays a bare number (no suffix).
- Added `clean()` helper to strip float noise (e.g. 0.55 × 100 = 55.0000001).
- Fixed the dead placeholder ternary; updated footer hint to "Enter whole percentages
  (e.g. 50 = 50%); Peukert is a bare exponent."

## Outcome

- ✅ Impact: Derating override cells are friendlier (percent entry) with no change to stored values or sizing math.
- 🧪 Tests: 47 battery tests pass; tsc clean for battery/FactorTable (pre-existing breaker/demand-diversity type errors unrelated).
- 📁 Files: components/battery/FactorTable.tsx
- 🔁 Next prompts: commit + PR for 011-battery-revamp; then layer deferred polish (T048 a11y, T049 reference dialog, T050 lint, T051 manual e2e, T058 cross-browser PDF).
- 🧠 Reflection: A dangling unused prop + a no-op ternary were reliable signals of an interrupted edit; confirming intent before scaling avoided a wrong-direction guess.

## Evaluation notes (flywheel)

- Failure modes observed: none.
- Graders run and results (PASS/FAIL): battery vitest PASS; tsc (battery scope) PASS.
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): commit the change and open the PR.
