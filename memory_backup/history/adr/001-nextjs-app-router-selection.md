# ADR-001: Next.js App Router Selection

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-24
- **Feature:** ElectroMate Engineering Web Application
- **Context:** ElectroMate requires a modern web framework for building interactive electrical engineering calculation tools with real-time validation (<100ms per SC-002), client-side computation (Math.js precision arithmetic), and support for anonymous users (localStorage persistence). The platform will serve professional engineers requiring calculation accuracy, standards compliance (IEEE/IEC/NEC), and PDF report generation suitable for submission to approval authorities.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES - Framework choice impacts all 6 calculator modules, deployment strategy, and scalability
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES - Pages Router, Vite SPA, Remix all evaluated
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES - Affects every component, routing, data fetching, bundle optimization
-->

## Decision

**Use Next.js 15 with App Router architecture**

Components:
- **Framework**: Next.js 15 (App Router, React Server Components)
- **Rendering Strategy**: Strategic Server/Client Component split
  - Server Components: Static UI shells (navigation, layout, footer)
  - Client Components: Interactive calculators (battery, UPS, cables, solar)
- **TypeScript**: TypeScript 5.x for type safety across all components
- **Build Tool**: Turbopack (Next.js 15 default) for fast development builds

## Consequences

### Positive

- **Smaller JavaScript bundles (20-30% reduction)**: Server Components eliminate framework overhead for static UI, improving initial load time
- **Future-proofing**: App Router is Vercel's primary focus area, ensuring long-term support and feature development
- **Modern React features**: Native support for Suspense boundaries, streaming, concurrent rendering
- **Better code organization**: Route-based file structure (`app/battery/`, `app/ups/`) matches calculator modularity, supporting Progressive Enhancement (Constitution Principle VII)
- **Optimized for client-side workload**: ElectroMate calculations run entirely client-side (no SSR overhead), making App Router's bundle optimization more valuable than Pages Router's SSR throughput advantages
- **Independent calculator deployment**: Each route (`/battery`, `/ups`, `/cables`) can be deployed independently (supports P1→P2→P3 incremental delivery)

### Negative

- **App Router less mature**: Smaller community compared to Pages Router, potential edge case bugs, fewer third-party examples
- **Learning curve**: Server Component/Client Component boundary understanding required for all developers
- **Library compatibility**: Some third-party libraries may not support Server Components, requiring "use client" directives
- **Performance trade-off for SSR-heavy apps**: Pages Router shows 2.5x better API throughput in SSR-heavy scenarios, but ElectroMate is client-side-heavy (calculation workload)

## Alternatives Considered

### Alternative A: Next.js Pages Router

**Approach**: Use traditional Pages Router with SSR/SSG architecture

**Why rejected**:
- Performance advantages (2.5x API throughput, 6x concurrent requests) apply to SSR-heavy workloads
- ElectroMate calculations run client-side (Math.js, real-time validation, localStorage) with minimal server interaction
- Pages Router benefits do not align with our workload characteristics
- Larger JavaScript bundles (no Server Component optimization) hurt initial load time
- Losing out on future Next.js innovations (Vercel focusing on App Router)

### Alternative B: Vite + React SPA

**Approach**: Pure client-side single-page application with Vite build tool

**Why rejected**:
- No SEO benefits for marketing pages (landing page needs crawlability)
- No API routes (would need separate backend for BetterAuth integration, calculation persistence)
- Manual routing setup increases complexity (React Router configuration)
- No server-side rendering options for future needs (e.g., server-side PDF generation if client-side proves insufficient)
- Smaller ecosystem for authentication integration compared to Next.js

### Alternative C: Remix

**Approach**: Remix framework with loader/action patterns

**Why rejected**:
- Smaller ecosystem compared to Next.js (fewer libraries, examples, community support)
- Loader/action patterns oriented toward server-side data mutations (not needed for client-side calculations)
- Less mature TypeScript tooling
- Higher learning curve for team without Remix experience
- Fewer deployment options (Vercel, Netlify, Cloudflare all support Next.js better)

## Rationale Summary

Next.js 15 App Router selected because:
1. **Client-side optimization**: ElectroMate workload is client-side-heavy (Math.js calculations, real-time validation), benefiting from App Router's smaller bundles rather than Pages Router's SSR throughput
2. **Modular architecture alignment**: Route-based structure matches calculator modularity (Constitution Principle VII: Progressive Enhancement)
3. **Future-proofing**: Primary Vercel focus ensures long-term support
4. **API route support**: Built-in API routes for BetterAuth, calculation persistence without separate backend
5. **SEO + Performance**: Server Components for static content, Client Components for interactivity achieves best of both worlds

The decision prioritizes bundle size optimization and modern React features over SSR throughput (which we don't need) and Pages Router maturity (which will diminish over time as App Router ecosystem grows).

## References

- Feature Spec: [specs/001-electromate-engineering-app/spec.md](../../specs/001-electromate-engineering-app/spec.md)
- Implementation Plan: [specs/001-electromate-engineering-app/plan.md](../../specs/001-electromate-engineering-app/plan.md)
- Research: [specs/001-electromate-engineering-app/research.md](../../specs/001-electromate-engineering-app/research.md) - Decision 1
- Related ADRs: None
- Evaluator Evidence: Performance benchmarks from [Next.js 15 Router Performance Comparison](https://markaicode.com/nextjs-15-router-performance-comparison/)
