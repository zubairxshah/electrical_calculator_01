---
id: 12
title: Battery Sizing Methodology ADR
stage: plan
date: 2026-06-21
surface: agent
model: claude-opus-4-8
feature: 011-battery-revamp
branch: 011-battery-revamp
user: zubairxshah
command: /sp.adr battery-sizing-methodology
labels: ["adr", "battery", "sizing", "ieee-485", "chemistry-data", "persistence-migration", "peukert"]
links:
  spec: specs/011-battery-revamp/spec.md
  ticket: null
  adr: history/adr/006-battery-sizing-methodology.md
  pr: null
files:
 - history/adr/006-battery-sizing-methodology.md
tests:
 - none (architecture decision record)
---

## Prompt

/sp.adr battery-sizing-methodology

(Workflow: analyze plan.md and planning artifacts, extract architecturally significant decision clusters, check existing ADRs, apply significance test, create ADRs for qualifying clusters, report.)

## Response snapshot

Loaded planning context via check-prerequisites.ps1 (FEATURE_DIR = specs/011-battery-revamp). Scanned history/adr/ — found 5 existing ADRs. Key overlap analysis:
- ADR-003 (mathjs), ADR-004 (client-side PDF), ADR-002 (Zustand) — referenced, not duplicated.
- ADR-005 (Visual Input OCR Approach) ALREADY establishes client-side Tesseract.js + pdf.js as a cross-cutting platform pattern. Read it in full and confirmed the datasheet OCR (P3) is a direct application → referenced rather than creating a new OCR ADR (avoids over-granular duplication).

Identified exactly ONE qualifying NEW decision cluster: the battery sizing methodology + chemistry data model. It passes all three significance tests (architecture/platform impact, multiple alternatives with tradeoffs, cross-cutting across calculations/schema/validation/types/store/PDF).

No PowerShell create-adr script exists (only adr-template.md), so created agent-natively: read template, wrote history/adr/006-battery-sizing-methodology.md (next sequential ID).

ADR-006 clusters: (1) bidirectional corrected-capacity sizing formula; (2) per-chemistry derating (DoD, temperature coefficient, EOL aging 0.8, Peukert exponent) sourced from batteryTypes.ts; (3) batteryTypes.ts as single source of truth + legacy→canonical ID map; (4) Zustand persist version+migrate for localStorage chemistry IDs; (5) pure-module engine structure. Documented 5 alternatives (A keep formula, B full IEEE 485 Kt worksheet [deferred], C schema-as-source [rejected], D per-model rate tables [enhancement], E no-migration [rejected]) with positive+negative consequences and constitution compliance.

## Outcome

- ✅ Impact: ADR-006 created and Accepted — the sizing methodology, canonical chemistry model, and persistence-migration contract are now a permanent reviewable record.
- 🧪 Tests: none (ADR).
- 📁 Files: history/adr/006-battery-sizing-methodology.md.
- 🔁 Next prompts: /sp.tasks to generate the TDD task breakdown; confirm the 3 open items (FLA profile, IEEE 485 fixture values, Peukert defaults) at task time.
- 🧠 Reflection: Reusing ADR-005 for OCR kept the ADR set clustered (1 new, 4 referenced) instead of over-granular — the significance test correctly collapsed PDF/OCR/math/state into references.

## Evaluation notes (flywheel)

- Failure modes observed (checked against): over-granular ADRs — avoided (collapsed OCR/PDF/math/Zustand into references to ADR-002/003/004/005); missing alternatives — avoided (5 alternatives with rationale).
- Graders run and results (PASS/FAIL): significance checklist — PASS (clusters multiple components; ≥1 alternative with rationale; pros+cons for chosen and alternatives; concise but sufficient).
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): when Kt tables are digitized, add a follow-up ADR (or supersede note) recording the move from the Peukert approximation to the formal IEEE 485 worksheet.
