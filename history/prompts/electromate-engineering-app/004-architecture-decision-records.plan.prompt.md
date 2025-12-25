---
id: 004
title: ElectroMate Architecture Decision Records
stage: plan
date: 2025-12-24
surface: agent
model: claude-sonnet-4-5-20250929
feature: electromate-engineering-app
branch: 001-electromate-engineering-app
user: zubairxshah
command: /sp.adr
labels: ["adr", "architecture", "decisions", "nextjs", "zustand", "mathjs", "jspdf", "safety-critical"]
links:
  spec: specs/001-electromate-engineering-app/spec.md
  ticket: null
  adr: history/adr/001-nextjs-app-router-selection.md, history/adr/002-zustand-state-management.md, history/adr/003-mathjs-high-precision-arithmetic.md, history/adr/004-client-side-pdf-generation.md
  pr: null
files:
  - history/adr/001-nextjs-app-router-selection.md
  - history/adr/002-zustand-state-management.md
  - history/adr/003-mathjs-high-precision-arithmetic.md
  - history/adr/004-client-side-pdf-generation.md
tests:
  - Validated all 4 ADRs pass significance test (impact, alternatives, cross-cutting scope)
  - Verified no over-granular ADRs (decisions properly clustered)
  - Confirmed all ADRs include alternatives considered with rationale
  - Validated consequences include both positive and negative outcomes
---

## Prompt

Next.js App Router Selection
  /sp.adr Zustand State Management Choice
  /sp.adr Math.js High-Precision Arithmetic
  /sp.adr Client-Side PDF Generation

## Response snapshot

Successfully created 4 Architecture Decision Records documenting key architectural decisions from ElectroMate implementation planning phase.

**ADR-001: Next.js App Router Selection**
- **Decision**: Use Next.js 15 with App Router architecture (Server Components for static UI, Client Components for interactive calculators)
- **Context**: Need modern framework for client-side-heavy calculation workload with real-time validation (<100ms)
- **Alternatives Considered**: Pages Router (2.5x better SSR throughput but not applicable), Vite SPA (no API routes/SEO), Remix (smaller ecosystem)
- **Rationale**: Client-side calculations benefit from 20-30% smaller bundles (Server Components), modular route structure supports Progressive Enhancement (P1→P2→P3 independent deployment)
- **Positive Consequences**: Smaller bundles, future-proofing, modern React features, independent calculator deployment
- **Negative Consequences**: Less mature than Pages Router, learning curve for Server/Client boundaries, library compatibility issues

**ADR-002: Zustand State Management with localStorage Persistence**
- **Decision**: Use Zustand 5.x with persist middleware + nuqs for URL state synchronization
- **Context**: Real-time validation requires <100ms response (SC-002), localStorage persistence for anonymous users (FR-015), seamless migration to PostgreSQL on registration (FR-016b)
- **Alternatives Considered**: React Context (>200ms validation, full tree re-renders), Jotai (atom complexity overkill), Redux Toolkit (more boilerplate, 3x larger bundle)
- **Rationale**: Selective re-renders achieve <100ms target, built-in persist middleware, ~1KB bundle, independent stores per calculator
- **Positive Consequences**: Performance target achieved, minimal boilerplate, URL shareability, modular architecture
- **Negative Consequences**: No built-in DevTools, less prescriptive patterns, manual migration logic

**ADR-003: Math.js High-Precision Arithmetic (SAFETY-CRITICAL)**
- **Decision**: Use Math.js with BigNumber type configured for 64-digit precision for ALL calculations
- **Context**: Constitution Principle I (NON-NEGOTIABLE) - calculation accuracy required for safety-critical engineering calculations. Inaccurate calculations cause fire hazards, electrocution, equipment damage, code violations, professional liability.
- **Alternatives Considered**: Native JavaScript (precision errors violate SC-004 ±0.1% accuracy), decimal.js (missing engineering functions), big.js (too minimal)
- **Rationale**: Only arbitrary-precision arithmetic can achieve ±0.1% voltage drop accuracy (SC-004), ±2% battery backup accuracy (SC-005), 100% NEC/IEC ampacity compliance (SC-009). Human safety depends on calculation precision.
- **Positive Consequences**: Accuracy guaranteed, safety compliance, standards validation, professional credibility, audit trail
- **Negative Consequences**: 10x performance overhead, ~100KB bundle size, learning curve, type conversions required

**ADR-004: Client-Side PDF Generation with jsPDF**
- **Decision**: Use client-side jsPDF 3.x with html2canvas for chart embedding, dynamic import for bundle optimization, Web Workers for non-blocking generation
- **Context**: FR-005 requires PDF reports for all calculators, FR-016a requires anonymous user support, SC-003 requires 95% cross-browser compatibility, engineers submit reports to approval authorities
- **Alternatives Considered**: Puppeteer server-side (requires authentication, infrastructure costs), pdfmake (less flexible layouts), react-pdf (rendering focus not generation), hybrid approach (double complexity)
- **Rationale**: Client-side generation enables anonymous workflow, zero infrastructure costs, immediate download, offline capability
- **Positive Consequences**: Anonymous support, no backend costs, immediate UX, scalability, cross-browser compatibility
- **Negative Consequences**: Client memory limits, CPU blocking without Web Workers, limited typography control, chart quality dependency

**Significance Validation**:
All 4 ADRs pass significance test:
- ✅ Impact: Long-term architectural consequences (framework lock-in, performance characteristics, safety-critical precision, user workflow)
- ✅ Alternatives: Multiple viable options evaluated with explicit tradeoffs documented
- ✅ Cross-cutting: Each decision affects multiple components/modules (not isolated details)

**Clustering Validation**:
- ADR-001: Framework decision (not separate ADRs for Next.js + routing + rendering)
- ADR-002: State management cluster (Zustand + persist + nuqs as integrated solution)
- ADR-003: Precision calculation cluster (Math.js + BigNumber + 64-digit config)
- ADR-004: PDF generation cluster (jsPDF + html2canvas + Web Workers + dynamic import)

**Constitution Alignment**:
All ADRs directly support constitutional principles:
- ADR-001: Principle VII (Progressive Enhancement - modular routes)
- ADR-002: Principle II (Safety-First Validation - <100ms real-time validation)
- ADR-003: Principle I (Calculation Accuracy: NON-NEGOTIABLE)
- ADR-004: Principle VI (Professional Documentation - PDF export)

## Outcome

- ✅ Impact: Created 4 comprehensive ADRs documenting architecturally significant decisions affecting framework architecture, state management, calculation precision (safety-critical), and professional documentation workflows
- 🧪 Tests: All ADRs validated against significance test (impact + alternatives + cross-cutting scope), clustering validation (no over-granular ADRs), consequence completeness (positive and negative outcomes documented)
- 📁 Files: ADR-001 (Next.js), ADR-002 (Zustand), ADR-003 (Math.js - safety-critical), ADR-004 (jsPDF)
- 🔁 Next prompts: /sp.tasks (generate task breakdown with ADR references), review ADRs with team, update plan.md if needed
- 🧠 Reflection: ADR creation successfully captured rationale for 4 key architectural decisions with emphasis on safety-critical calculation precision (ADR-003: Math.js NON-NEGOTIABLE per Constitution). All decisions support constitutional principles (Progressive Enhancement, Safety-First Validation, Calculation Accuracy, Professional Documentation). ADRs provide permanent record for future questioning ("Why Math.js instead of native?", "Why client-side PDF?", "Why Zustand over Context?") with documented alternatives and consequences.

## Evaluation notes (flywheel)

- Failure modes observed: None - all 4 ADRs pass significance test and clustering validation
- Graders run and results (PASS/FAIL): Significance Test (PASS - all 4 decisions have long-term impact, alternatives, cross-cutting scope), Clustering Validation (PASS - no over-granular ADRs, decisions properly grouped), Consequences Completeness (PASS - all ADRs document positive and negative outcomes), Alternatives Documentation (PASS - each ADR lists 2-4 alternatives with rejection rationale)
- Prompt variant (if applicable): User provided 4 decision titles explicitly (Next.js, Zustand, Math.js, PDF), indicating they reviewed plan.md and identified key decisions requiring formal documentation
- Next experiment (smallest change to try): Consider adding "Superseded By" section to ADR template if future decisions override current choices (e.g., if Math.js performance proves insufficient and we switch to native + selective precision)
