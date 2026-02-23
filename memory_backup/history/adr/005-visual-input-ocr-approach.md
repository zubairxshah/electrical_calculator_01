# ADR-005: Visual Input OCR Approach

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-29
- **Feature:** 004-lighting-design (Lighting Design Calculator)
- **Context:** The Lighting Design Calculator requires visual input functionality (FR-007, FR-015-FR-019) that allows users to upload PDF floor plans and images to automatically extract room dimensions. This premium feature differentiates ElectroMate from competitors by reducing manual data entry time. The spec clarification Q1 explicitly decided to prioritize "zero per-page costs" and "accessibility" over accuracy, rejecting cloud API solutions. The feature must process floor plans client-side within 30 seconds (spec constraint), extract dimensions with 90%+ accuracy on readable plans (SC-003), and support a freemium model (3 visual analyses/month free, unlimited for premium).

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES - Affects client-side processing strategy, bundle size (~2.5MB), freemium business model, premium feature architecture
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES - Cloud APIs (Google Vision, AWS Textract, Azure), OpenCV.js, server-side processing evaluated
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES - Impacts bundle optimization, Web Worker strategy, subscription system, error handling patterns
-->

## Decision

**Use client-side Tesseract.js + pdf.js for visual floor plan analysis**

Components:
- **OCR Engine**: Tesseract.js 5.x (browser-based OCR via WebAssembly)
- **PDF Renderer**: pdf.js (Mozilla's PDF renderer for converting PDFs to images)
- **Processing Architecture**: Web Workers (non-blocking execution for 10-30 second OCR operations)
- **Image Preprocessing**: Canvas-based contrast enhancement, noise reduction before OCR
- **Dimension Parsing**: Custom regex patterns for metric (12.5m, 3000mm) and imperial (8'-6") formats
- **Confidence Scoring**: Per-dimension confidence scores with uncertainty flags for ambiguous values
- **Freemium Gating**: localStorage counter with monthly reset, premium API validation

Implementation pattern:
```typescript
// lib/visual/floorPlanAnalyzer.ts
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

export async function analyzeFloorPlan(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> {
  // 1. Render PDF/image to canvas (pdf.js for PDFs)
  const imageData = file.type === 'application/pdf'
    ? await pdfToCanvas(file)
    : await imageToCanvas(file);

  // 2. Run OCR in Web Worker (non-blocking)
  const worker = await Tesseract.createWorker('eng');
  const { data } = await worker.recognize(imageData);
  await worker.terminate();

  // 3. Parse dimension patterns with confidence scoring
  return parseDimensions(data.text, data.confidence);
}
```

## Consequences

### Positive

- **Zero per-page costs**: No API charges regardless of usage volume (spec requirement Q1)
- **Privacy**: User floor plans never leave the browser (no cloud transmission of potentially sensitive building data)
- **Offline capability**: Visual analysis works without internet connection after initial Tesseract.js download
- **Predictable performance**: No network latency variability (consistent 10-30 second processing time)
- **Anonymous user support**: Works without authentication, consistent with existing anonymous calculation workflow (ADR-004)
- **Bundle efficiency**: Tesseract.js (~2MB) + pdf.js (~500KB) loaded dynamically only when feature is used
- **Web Worker isolation**: OCR processing runs off main thread, keeping UI responsive during analysis

### Negative

- **Lower accuracy ceiling**: Tesseract.js achieves ~90% accuracy vs ~98% for cloud APIs on clean documents
- **Large bundle addition**: ~2.5MB additional download when feature first used (mitigated by dynamic import)
- **Client CPU intensive**: 10-30 seconds of CPU-bound processing can drain mobile device batteries
- **Limited image preprocessing**: Browser-based preprocessing less sophisticated than cloud computer vision
- **No continuous improvement**: Cloud APIs improve over time with new models; Tesseract.js requires manual updates
- **Worst-case accuracy drops**: Hand-drawn sketches, rotated images, low-resolution scans may achieve <70% accuracy

## Alternatives Considered

### Alternative A: Google Cloud Vision API

**Approach**: Send floor plan images to Google Cloud Vision for OCR and document analysis

**Pricing**: ~$1.50 per 1,000 images (DOCUMENT_TEXT_DETECTION)

**Why rejected**:
- **Per-page costs violate spec Q1**: Explicit requirement for "zero per-page costs" to prioritize accessibility
- **Cost scaling risk**: High-volume users could generate significant API costs (100 analyses/user/month = $0.15/user)
- **Freemium model complexity**: Difficult to offer free tier without absorbing API costs
- **Privacy concerns**: Uploading floor plans to cloud may concern enterprise customers (building security data)
- **Latency variability**: Network round-trip adds 2-5 seconds plus processing time

**When Cloud Vision would be better**: Applications where accuracy is critical (legal documents, financial records), where per-page costs are acceptable, or where server-side processing is already established.

### Alternative B: AWS Textract

**Approach**: Use AWS Textract's AnalyzeDocument API for structured document extraction

**Pricing**: ~$1.50 per 1,000 pages (standard processing)

**Why rejected**:
- Same cost concerns as Google Cloud Vision
- **AWS vendor lock-in**: Adds AWS dependency to otherwise cloud-agnostic architecture
- **Document focus**: Optimized for structured documents (forms, tables) rather than architectural drawings
- **Additional infrastructure**: Requires AWS credentials management, IAM roles

### Alternative C: Server-Side Tesseract (Node.js)

**Approach**: Run Tesseract OCR on server via Node.js wrapper

**Why rejected**:
- **Infrastructure costs**: Requires server compute for CPU-intensive OCR (Lambda timeout issues, EC2 costs)
- **Breaks anonymous workflow**: Server-side processing requires authentication to track usage
- **Network latency**: Upload → process → download slower than client-side
- **Scalability bottleneck**: Server must handle concurrent OCR requests (queue delays during peak)

**When server-side would be better**: Applications with existing backend infrastructure where client compute limitations are a concern.

### Alternative D: OpenCV.js + Custom Pattern Matching

**Approach**: Use OpenCV.js for image processing with custom dimension detection algorithms

**Why rejected**:
- **Development complexity**: Requires building custom dimension recognition from scratch
- **No text recognition**: OpenCV provides image processing but not OCR capability
- **Higher risk**: Unproven approach compared to established Tesseract.js

## Rationale Summary

Tesseract.js + pdf.js selected because:
1. **Spec compliance**: Explicitly satisfies Q1 requirement for "zero per-page costs" and "accessibility"
2. **Privacy preservation**: Floor plans (potentially sensitive building data) never leave user's browser
3. **Consistent with ADR-004**: Extends client-side processing philosophy established for PDF generation
4. **Freemium enablement**: No marginal costs per analysis enables generous free tier (3/month)
5. **Acceptable accuracy tradeoff**: 90% accuracy on readable plans acceptable given user confirmation step (FR-019)

**Accuracy mitigation**: Implement confidence scoring and uncertainty flags. Require user confirmation for any dimension with <85% confidence. Provide manual entry fallback.

**Performance mitigation**: Use Web Workers for non-blocking execution. Implement progress indicators (FR-019). Downsample large images to 2000px max dimension before OCR.

**Bundle size mitigation**: Dynamic import Tesseract.js and pdf.js only when visual input feature accessed. Show loading indicator during first-time download.

## Constitution Compliance

- **Principle IV (Dual Standards)**: Support both metric (m, mm) and imperial (ft, in) dimension formats
- **Principle V (Test-First)**: Test cases include OCR accuracy validation against known floor plan samples
- **FR-015-FR-019**: Visual analysis requirements satisfied by this architecture
- **SC-003**: 90% accuracy target on readable plans achievable with Tesseract.js

## References

- Feature Spec: [specs/004-lighting-design/spec.md](../../specs/004-lighting-design/spec.md) - FR-007, FR-015-FR-019, SC-003, Q1 clarification
- Implementation Plan: [specs/004-lighting-design/plan.md](../../specs/004-lighting-design/plan.md) - Complexity Tracking (Tesseract.js justification)
- Research: [specs/004-lighting-design/research.md](../../specs/004-lighting-design/research.md) - Section 2 (Visual Input Technology Stack)
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - Principle IV, V
- Related ADRs: ADR-004 (Client-Side PDF Generation - consistent client-side processing philosophy)
- Evaluator Evidence: [Tesseract.js npm](https://www.npmjs.com/package/tesseract.js), [pdf.js Documentation](https://mozilla.github.io/pdf.js/)
