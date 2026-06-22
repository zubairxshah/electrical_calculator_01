---
id: 10
title: Battery Calculator Revamp Spec
stage: spec
date: 2026-06-21
surface: agent
model: claude-opus-4-8
feature: 011-battery-revamp
branch: 011-battery-revamp
user: zubairxshah
command: /sp.specify
labels: ["battery", "sizing", "ieee-485", "iec", "nec", "design-system", "ux", "pdf-export"]
links:
  spec: specs/011-battery-revamp/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/011-battery-revamp/spec.md
 - specs/011-battery-revamp/checklists/requirements.md
 - design-system/foundations/colors.html
 - design-system/foundations/typography.html
 - design-system/foundations/elevation-radius.html
 - design-system/components/calculation-card.html
 - design-system/components/input-field.html
 - design-system/components/result-display.html
 - design-system/components/warning-banner.html
 - design-system/components/buttons.html
 - design-system/components/badges.html
 - design-system/patterns/battery-input-form.html
 - design-system/patterns/battery-results.html
tests:
 - none (specification stage)
---

## Prompt

we are about to update Battery sizing section of the website namely Battery Calculator page, I need to know how we can use Claude Design to revamp our claude website also. We'll then work on the page

[Follow-up clarifications captured via interactive questions:]
- Goal: Build a design system first (then revamp the page).
- Design-system scope: Foundations + Components + Battery patterns.
- Revamp focus: Visual polish & hierarchy, Layout restructure, Re-enable PDF export, New features, AND "updating battery calculation methods formula's sizing tools".
- Calc depth: review https://electrical-world.com/posts/ups-sizing-calculation-battery-runtime-load-analysis (Battery Capacity and Runtime Analysis) and rework the existing calculation to this sizing method — more stringent, following IEEE/IEC and NEC standards; more real-world solved recommendations, better C-rate, DoD, EOL, temperature margin; selecting battery datasheets from different manufacturers or reading an uploaded datasheet via OCR/AI agent; user-friendly so few inputs determine proper sizing.
- Workflow: Yes — write a spec first.

[/sp.specify feature description:]
Battery Calculator revamp — rework the existing Battery sizing engine and page into a stringent, standards-based battery/UPS sizing tool, plus a UI/UX redesign aligned to the new ElectroMate Design System. Adopt the rigorous method Required Capacity (Ah) = [Load(W) × Runtime(h)] / [V_dc × DoD × TempFactor × Efficiency × AgingFactor], supporting both forward runtime and reverse target-runtime sizing; follow IEEE 485 / IEC 60896,62619 / NEC; per-chemistry DoD, EOL aging 1.25, temperature correction, C-rate/Peukert derating; fix the chemistry-unused and chemistry-ID-mismatch defects and wire batteryTypes.ts into the math; output cells/strings, recommended C-rate, DoD, EOL margin, temperature margin and a verdict; datasheet library plus OCR/AI datasheet reading (phase 2); UI revamp with hero metric, side-by-side sticky layout, re-enabled PDF export, aligned to the ElectroMate Design System. Calculator #1 (/battery).

## Response snapshot

Explained that Claude Design (claude.ai/design) is a cloud design-system host, synced one component at a time via the /design-sync skill + DesignSync tool — not an auto-redesign button. Authorized design access, created the "ElectroMate Design System" project (06969dad-9457-4aad-ac9a-b8fe329b5175), and synced 11 preview cards built from the repo's real tokens (globals.css) and shared kit: Foundations (colors, typography, elevation/radius), Components (CalculationCard, InputField, ResultDisplay, WarningBanner, Buttons, Standards Badge), Patterns (Battery input form + results — current layout baseline).

Audited the battery engine and surfaced real defects: (1) chemistry collected but never used in lib/calculations/battery.ts; (2) chemistry IDs in BatteryInputForm.tsx mismatch lib/standards/batteryTypes.ts so the rich dataset can't map; (3) formula skips IEEE 485 corrections (temperature, DoD ceiling, rate derating, design margin). Grounded the new method via web search (article host returns 403).

Created feature 011-battery-revamp off main (recovered from a Windows PowerShell 5.1 Join-Path quirk in create-new-feature.ps1 that aborted after branch+spec creation; created the prompts dir manually). Wrote a full spec with 6 prioritized user stories (P1 chemistry-aware runtime, P1 reverse sizing, P2 few-inputs defaults, P2 datasheet library, P2 redesign+PDF, P3 OCR/AI stretch), 20 functional requirements, key entities, edge cases, 7 measurable success criteria, assumptions, and out-of-scope. Quality checklist passes all items with zero NEEDS CLARIFICATION.

## Outcome

- ✅ Impact: ElectroMate Design System project live on claude.ai/design (11 cards); feature 011-battery-revamp branched off main with a complete, validated spec ready for planning.
- 🧪 Tests: none (specification stage).
- 📁 Files: spec.md, checklists/requirements.md, 11 design-system/*.html preview cards.
- 🔁 Next prompts: /sp.plan for 011-battery-revamp (calculation engine design, chemistry-data wiring, sizing/runtime dual-mode, datasheet library, UI architecture, PDF mapping). Consider /sp.clarify only if planning surfaces gaps.
- 🧠 Reflection: The calc scope (standards-based sizing) is the real risk, not the UI; specifying it first was the right call. Glob times out repo-wide here — prefer scoped PowerShell/Glob paths.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 multi-arg Join-Path fails on Windows PowerShell 5.1 (branch+spec created, prompts dir + JSON output skipped); WebFetch blocked (403) by the reference host; repo-wide Glob/ripgrep times out (large tree).
- Graders run and results (PASS/FAIL): spec quality checklist — PASS (all items, first iteration).
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): patch create-new-feature.ps1 to chain Join-Path calls for PS 5.1 compatibility so the script completes end-to-end.
