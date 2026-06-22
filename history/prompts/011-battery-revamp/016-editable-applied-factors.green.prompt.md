---
id: 016
title: Editable applied factors card
stage: green
date: 2026-06-22
surface: agent
model: claude-opus-4-8
feature: 011-battery-revamp
branch: main
user: zubairxshah
command: (chat) make derating factors manually insertable
labels: ["battery", "ui", "derating", "ux", "overrides"]
links:
  spec: specs/011-battery-revamp/spec.md
  ticket: null
  adr: history/adr/ (ADR-006)
  pr: null
files:
 - components/battery/BatteryResults.tsx
 - components/battery/BatteryInputForm.tsx
 - components/battery/OverrideCell.tsx (new)
 - components/battery/FactorTable.tsx (deleted)
tests:
 - npx vitest run battery (47 passed)
 - npx tsc --noEmit (no battery-related errors)
 - npm run build (succeeded; /battery prerenders)
---

## Prompt

Applied factors are showing same as before, but I cannot manually insert these factors as I intended for users, you need to add fields to add these factors manually if user wants

## Response snapshot

Traced the full path: the override fields already existed and the engine read every
override (derating.ts), and the store recomputes live on each setInputs. The real problem
was discoverability — editing lived in a collapsed ghost-button section ("Show derating
factors & overrides") in the input form, separate from the read-only "Applied Factors"
results card the user was looking at.

Confirmed direction with the user (chose: make the Applied Factors card editable in place,
single source). Implemented:
- Extracted OverrideCell into a shared component (components/battery/OverrideCell.tsx) with
  optional in-field suffix + cleanNum() float-noise stripper.
- Made the Applied Factors card rows editable via EditableFactorRow: DoD, temperature,
  efficiency, aging entered as whole percentages (% suffix, scaled ×100 in / ÷100 out so the
  store keeps 0–1 fractions); Peukert edited as a bare exponent with a "→ X% rate derate
  applied" caption (the card's displayed derate is computed from the exponent, not entered).
- Blank field = datasheet/standard default; source badge flips to USER; added Reset link.
- Removed the redundant hidden table from the input form and deleted FactorTable.tsx; the
  advanced toggle now only carries sizing-mode bank-configuration fields.

Committed and pushed to main (0a31117) for the live site.

## Outcome

- ✅ Impact: Derating factors are now obviously user-editable where they're displayed; live recompute of capacity/backup/verdict.
- 🧪 Tests: 47 battery tests pass; tsc clean (battery); production build succeeds.
- 📁 Files: BatteryResults.tsx, BatteryInputForm.tsx, +OverrideCell.tsx, -FactorTable.tsx
- 🔁 Next prompts: optional min/max guard rails on override inputs; layer remaining deferred polish (a11y, reference dialog, lint, manual e2e, cross-browser PDF).
- 🧠 Reflection: The bug report was a discoverability problem, not a math bug — verifying the engine/store path first avoided "fixing" working code and pointed at UI placement.

## Evaluation notes (flywheel)

- Failure modes observed: feature existed but was hidden behind a low-contrast toggle far from where users expected it.
- Graders run and results (PASS/FAIL): battery vitest PASS; tsc (battery) PASS; build PASS.
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): add inline validation hints (e.g. clamp DoD to chemistry max) on the override inputs.
