---
id: 001
title: ElectroMate Constitution v1.0.0
stage: constitution
date: 2025-12-24
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 001-electromate-engineering-app
user: zubairxshah
command: /sp.constitution
labels: ["constitution", "governance", "principles", "standards-compliance", "safety", "tdd"]
links:
  spec: specs/001-electromate-engineering-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - .specify/templates/plan-template.md
  - .specify/templates/tasks-template.md
tests:
  - Validated all 7 core principles align with specification requirements
  - Verified no unresolved placeholder tokens remain
  - Confirmed semantic versioning correctly applied (1.0.0 for new constitution)
---

## Prompt

(Empty - user invoked /sp.constitution without additional arguments)

## Response snapshot

Created comprehensive ElectroMate Constitution v1.0.0 establishing foundational governance and engineering principles for the electrical engineering calculation platform.

**7 Core Principles Established**:

1. **Calculation Accuracy (NON-NEGOTIABLE)**: All calculations MUST match published standards within specified tolerances (IEEE 485 ±2%, voltage drop ±0.1%, 100% NEC/IEC ampacity compliance). Rationale: Human safety and professional liability depend on calculation precision.

2. **Safety-First Validation**: System MUST actively warn of dangerous conditions (discharge rates >1C, voltage drops >3%, efficiency >100%, ampacity violations). Real-time validation within 100ms with red highlighting and code references.

3. **Standards Compliance and Traceability**: Every calculation MUST reference applicable standards (IEC 60364, IEEE 485/1100, BS 7671, NEC, IEC 62040, NREL) with version labels and section numbers in PDF reports.

4. **Dual Standards Support (IEC/SI and NEC/North American)**: Support both international and North American standards with unit toggle, voltage system coverage (LV/MV/DC), and maintained accuracy across conversions.

5. **Test-First Development for Critical Calculations**: TDD mandatory for P1 calculations (Battery, UPS, Cable Sizing) with test cases from published standards. Red-Green-Refactor cycle strictly enforced.

6. **Professional Documentation and Exportability**: Every tool MUST provide PDF export suitable for professional submission with inputs, formulas, standards references, timestamps, and disclaimers. 95% cross-browser compatibility required.

7. **Progressive Enhancement and Incremental Value**: Prioritized delivery (P1→P2→P3) with independently testable user stories. Each feature must deliver standalone value.

**Additional Sections**:

- **Engineering Standards Compliance**: Formula verification process, derating factor application procedures, conservative defaults policy
- **Development Workflow**: SDD workflow (specify→clarify→plan→tasks→implement), ADR triggers, PHR requirements, code quality standards, security requirements
- **Governance**: Amendment process with semantic versioning, compliance verification checklist, complexity justification rules, runtime guidance references

**Version Rationale**: 1.0.0 (MAJOR.MINOR.PATCH)
- Initial constitution creation warrants 1.0.0 baseline
- Establishes foundational governance for all future development
- Ratified 2025-12-24

**Sync Impact**:
- ✅ plan-template.md: Updated Constitution Check section with 7 principle-specific checklists (calculation accuracy, safety validation, standards compliance, TDD, professional documentation, progressive enhancement, other principles)
- ✅ tasks-template.md: Added Phase N+1 "Constitution Compliance Verification" with detailed validation tasks for each principle (calculation accuracy, safety, standards, test coverage, documentation, progressive enhancement, security, dual standards)
- ✅ spec-template.md: Already aligned with constitutional principles

## Outcome

- ✅ Impact: Established comprehensive governance framework codifying 7 core engineering principles emphasizing calculation accuracy, safety validation, standards compliance, dual-market support, TDD discipline, professional documentation, and progressive delivery
- 🧪 Tests: Constitution validated for completeness (no placeholder tokens), principle clarity (testable requirements), and consistency with specification design principles
- 📁 Files: constitution.md (257 lines, 7 principles, 3 major sections, governance framework)
- 🔁 Next prompts: /sp.plan (ready to design technical architecture with constitutional principles as constraints)
- 🧠 Reflection: Constitution successfully captures domain-specific requirements for engineering calculation tools (safety-critical, standards-driven, professional use). NON-NEGOTIABLE designation applied appropriately to calculation accuracy and TDD for P1 features. Conservative defaults policy (3% voltage drop, 0.8 aging factor) aligns with specification clarifications. Governance section provides clear amendment process and compliance verification procedures.

## Evaluation notes (flywheel)

- Failure modes observed: None - constitution created cleanly from specification principles and CLAUDE.md guidance
- Graders run and results (PASS/FAIL): Placeholder Validation (PASS - all tokens resolved), Principle Testability (PASS - all principles measurable/verifiable), Governance Completeness (PASS - amendment, versioning, compliance processes defined)
- Prompt variant (if applicable): Standard /sp.constitution workflow with no user arguments (derived principles from spec.md)
- Next experiment (smallest change to try): Consider adding specific performance budgets section if planning phase reveals calculation complexity requiring explicit latency/throughput constraints beyond SC-002's 100ms requirement
