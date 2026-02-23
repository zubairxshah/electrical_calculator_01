---
id: M003
title: ADR Visual Input OCR Approach
stage: plan
date: 2025-12-29
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-lighting-design
branch: 004-lighting-design
user: developer
command: /sp.adr Visual-input-ocr-approach
labels: ["adr", "ocr", "tesseract", "visual-input", "architecture"]
links:
  spec: specs/004-lighting-design/spec.md
  ticket: null
  adr: history/adr/005-visual-input-ocr-approach.md
  pr: null
files:
  - history/adr/005-visual-input-ocr-approach.md
tests:
  - N/A (ADR documentation)
---

## Prompt

User invoked `/sp.adr Visual-input-ocr-approach` to document the architectural decision for visual input OCR technology selection in the Lighting Design Calculator feature.

## Response snapshot

Created ADR-005: Visual Input OCR Approach documenting the decision to use client-side Tesseract.js + pdf.js for floor plan analysis.

**Key Decision Points**:
- **OCR Engine**: Tesseract.js 5.x (browser-based WebAssembly)
- **PDF Renderer**: pdf.js (Mozilla's PDF library)
- **Processing**: Web Workers for non-blocking 10-30 second operations
- **Freemium**: 3 analyses/month free, unlimited premium

**Alternatives Evaluated**:
1. Google Cloud Vision API (~$1.50/1000 images) - Rejected: per-page costs violate spec Q1
2. AWS Textract (~$1.50/1000 pages) - Rejected: same cost concerns + vendor lock-in
3. Server-Side Tesseract - Rejected: infrastructure costs, breaks anonymous workflow
4. OpenCV.js + custom - Rejected: no OCR, high development complexity

**Rationale**: Tesseract.js satisfies spec requirement Q1 for "zero per-page costs" and "accessibility", keeps floor plans private (never leave browser), enables generous free tier, and achieves 90% accuracy target with user confirmation fallback.

## Outcome

- ✅ Impact: ADR-005 created documenting Visual Input OCR architecture decision
- 🧪 Tests: N/A (documentation)
- 📁 Files: 1 file created (history/adr/005-visual-input-ocr-approach.md)
- 🔁 Next prompts: Run `/sp.tasks` to generate task breakdown, then `/sp.implement`
- 🧠 Reflection: Decision aligns with ADR-004 (client-side PDF generation) philosophy. Tesseract.js accuracy tradeoff acceptable given user confirmation requirement (FR-019).

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Significance test PASS (all 3 criteria met)
- Prompt variant (if applicable): Standard /sp.adr workflow
- Next experiment (smallest change to try): None - proceed to task generation
