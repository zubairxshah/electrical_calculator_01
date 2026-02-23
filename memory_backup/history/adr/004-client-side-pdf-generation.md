# ADR-004: Client-Side PDF Generation with jsPDF

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-24
- **Feature:** ElectroMate Engineering Web Application
- **Context:** FR-005 requires downloadable PDF reports for all calculation tools. FR-016a requires anonymous user support (calculations without registration). FR-018 requires "MZS CodeWorks" footer branding. SC-003 requires 95% cross-browser PDF rendering success (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). PDF reports must include inputs, formulas, results, standard references (IEEE/IEC/NEC section numbers), calculation timestamp, disclaimer text, and embedded charts (FR-022: battery discharge curves). Engineers submit these reports to clients and approval authorities for code compliance verification, requiring professional formatting suitable for official documentation.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES - PDF generation affects all 6 calculators, anonymous user workflow, backend infrastructure requirements, operational costs
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES - Server-side (Puppeteer), alternative client libraries (pdfmake, react-pdf) evaluated
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES - Every calculator requires PDF export, impacts authentication flow, infrastructure costs, user experience
-->

## Decision

**Use client-side jsPDF 3.x with html2canvas for PDF generation**

Components:
- **PDF Library**: jsPDF 3.x (client-side JavaScript PDF generation)
- **Chart Embedding**: html2canvas (converts Recharts SVG to canvas for PDF embedding)
- **Generation Location**: Client browser (no server-side rendering)
- **Dynamic Import**: Lazy-load jsPDF to reduce initial bundle size
- **Web Worker**: Use Web Worker for PDF generation >1 second to avoid blocking UI
- **Template**: Standardized PDF template (header, inputs, formulas, results, charts, standard references, footer with MZS CodeWorks branding)

Implementation pattern:
```typescript
// lib/pdfGenerator.ts
async function loadJsPDF() {
  const { jsPDF } = await import('jspdf')  // Dynamic import
  await import('jspdf-autotable')           // Table support
  return jsPDF
}

export async function generateCalculationPDF(options: PDFGenerationOptions) {
  const jsPDFConstructor = await loadJsPDF()
  const doc = new jsPDFConstructor('portrait', 'mm', 'a4')
  // ... PDF generation logic ...
  doc.save(`ElectroMate_${type}_${Date.now()}.pdf`)
}
```

## Consequences

### Positive

- **Anonymous user support**: Client-side generation works without backend authentication, enabling FR-016a (calculate freely before registration)
- **Zero infrastructure costs**: No server resources required for PDF generation (serverless, no compute costs)
- **Immediate download**: No upload → server → download round-trip latency (faster user experience)
- **Offline capability**: PDF generation works without internet connection (calculations + PDF export entirely client-side)
- **No backend complexity**: Eliminates need for PDF generation service, queue management, storage, cleanup jobs
- **Scalability**: Client devices handle PDF generation (scales linearly with user count, no server bottleneck)
- **Cross-browser compatibility**: jsPDF tested on all target browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) meeting SC-003 (95% success rate)
- **Mature library**: 2.6M+ weekly downloads, active maintenance, v3.0.4 (2025), extensive documentation

### Negative

- **Client memory constraints**: Large PDFs (>50 calculations, high-res charts) may cause browser out-of-memory errors on low-end devices
- **CPU blocking**: PDF generation (1-2 seconds) can block UI thread without Web Worker implementation
- **Limited typography control**: Client-side rendering has less control over fonts, kerning compared to server-side solutions (Puppeteer with Chrome rendering engine)
- **Chart quality dependency**: Relies on html2canvas for converting Recharts SVG to raster image (potential quality loss if not configured for high DPI)
- **No server-side caching**: Each PDF generated fresh (cannot pre-generate common reports for faster delivery)

## Alternatives Considered

### Alternative A: Server-Side PDF Generation (Puppeteer)

**Approach**: Use Puppeteer (headless Chrome) on server to render HTML → PDF

**Why rejected**:
- **Authentication required**: Server-side generation requires user authentication to fetch calculation data, violating FR-016a (anonymous users calculate freely)
- **Infrastructure costs**: Requires server compute resources (Lambda, EC2, Cloud Run) for running headless Chrome
- **Slower generation**: Network latency (upload inputs → server generates → download PDF) slower than client-side (1-2 seconds)
- **Higher operational complexity**: Need to manage Puppeteer instance lifecycle, browser version updates, memory management, cleanup jobs
- **Scalability bottleneck**: Server must handle concurrent PDF generation requests (potential queue delays during peak usage)
- **Anonymous workflow broken**: Anonymous users cannot export PDFs without registration (conflicts with core product vision)

**When Puppeteer would be better**: Applications requiring server-side rendering for security (prevent client inspection), complex PDF layouts (fine typography control), or pre-generated reports (caching).

### Alternative B: pdfmake (Client-Side)

**Approach**: Use pdfmake for declarative client-side PDF generation

**Why rejected**:
- **Less flexible layout**: Complex nested structure syntax harder to maintain for engineering reports (tables, formulas, charts, multi-column layouts)
- **Smaller ecosystem**: Fewer examples, plugins, community support compared to jsPDF (2.6M weekly downloads)
- **Chart embedding complexity**: More difficult to embed Recharts canvas compared to jsPDF's addImage() method
- **Learning curve**: Declarative JSON structure requires different mental model compared to imperative jsPDF API

**When pdfmake would be better**: Applications with highly structured, template-driven reports (invoices, contracts) where declarative approach simplifies maintenance.

### Alternative C: react-pdf (Client-Side)

**Approach**: Use react-pdf for React component-based PDF generation

**Why rejected**:
- **Rendering focus**: react-pdf is primarily for rendering existing PDFs, not generating new ones
- **Limited generation capabilities**: Generation features less mature than jsPDF
- **Dependency on @react-pdf/renderer**: Adds additional dependencies, increases bundle size
- **Less documentation**: Smaller community, fewer examples for complex engineering reports

**When react-pdf would be better**: Applications that need to display existing PDFs (PDF viewer) more than generate new ones.

### Alternative D: Hybrid Approach (Client + Server Fallback)

**Approach**: Generate PDF client-side by default, fall back to server-side for large/complex reports

**Why rejected**:
- **Complexity**: Maintaining two PDF generation code paths doubles implementation and testing effort
- **Inconsistent output**: Client-side and server-side generators may produce different-looking PDFs (confusing users)
- **Server still required**: Need infrastructure for fallback cases (doesn't eliminate server costs)
- **Anonymous users broken in fallback**: Large PDFs force anonymous users to register for server-side generation

**Principle**: Choose one approach and optimize it well rather than maintaining two paths.

## Rationale Summary

Client-side jsPDF selected because:
1. **Anonymous user workflow**: Enables FR-016a (calculate freely without registration) - core product differentiator
2. **Zero infrastructure costs**: No servers needed for PDF generation (reduces operational overhead)
3. **Immediate UX**: No network latency for download (faster than upload → server → download)
4. **Scalability**: Client devices handle generation (no server bottleneck at scale)
5. **Mature ecosystem**: jsPDF is battle-tested (2.6M weekly downloads) with extensive documentation and cross-browser compatibility

**Performance mitigation**: Use Web Workers for PDF generation >1 second to avoid blocking UI. Implement progress indicators for user feedback during generation.

**Quality mitigation**: Configure html2canvas with `scale: 2` for high-DPI chart rendering (print quality). Test PDF output on all target browsers to ensure SC-003 (95% compatibility).

**Memory mitigation**: Implement PDF size limits (max 50 calculations per report), warn users generating very large reports, suggest splitting into multiple PDFs.

## Constitution Compliance

- **Principle VI (Professional Documentation)**: jsPDF enables professional PDF reports suitable for submission to approval authorities with inputs, formulas, standard references, timestamps, disclaimers
- **FR-005**: Downloadable PDF reports for all calculation tools
- **SC-003**: 95% cross-browser rendering success (jsPDF tested on Chrome, Firefox, Safari, Edge)
- **FR-016a**: Anonymous user support (client-side generation works without authentication)

## References

- Feature Spec: [specs/001-electromate-engineering-app/spec.md](../../specs/001-electromate-engineering-app/spec.md) - FR-005, FR-016a, SC-003
- Implementation Plan: [specs/001-electromate-engineering-app/plan.md](../../specs/001-electromate-engineering-app/plan.md) - Complexity Tracking (jsPDF justification)
- Research: [specs/001-electromate-engineering-app/research.md](../../specs/001-electromate-engineering-app/research.md) - Decision 5
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - Principle VI (Professional Documentation)
- Related ADRs: ADR-001 (Next.js App Router - client-side workload alignment), ADR-002 (Zustand - Web Workers for non-blocking PDF generation)
- Evaluator Evidence: [jsPDF npm Package](https://www.npmjs.com/package/jspdf), [PDF Generation Libraries Comparison](https://dmitriiboikov.com/posts/2025/01/pdf-generation-comarison/)
