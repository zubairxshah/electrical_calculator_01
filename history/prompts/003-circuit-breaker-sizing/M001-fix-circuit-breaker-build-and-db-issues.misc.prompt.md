---
id: "M001"
title: "Fix circuit breaker build and DB issues"
stage: "misc"
date_iso: "2025-12-28"
model: "claude-sonnet-4-5-20250929"
feature: "003-circuit-breaker-sizing"
branch: "main"
user: "zubairxshah"
command: "/sp.implement"
labels: ["build-fix", "database", "zod", "typescript"]
links: "null"
files_yaml: |
  - lib/db.ts
  - lib/validation/breakerValidation.ts
  - lib/calculations/breaker/loadCurrent.ts
  - components/ui/separator.tsx
  - app/api/calculations/cables/route.ts
  - app/api/calculations/solar/route.ts
  - app/api/calculations/ups/route.ts
tests_yaml: |
  - npm run build (verification)
---
# User Prompt

(no explicit prompt - invoked via /sp.implement command during build troubleshooting)

# Response Summary

Fixed multiple build errors preventing circuit breaker sizing calculator from deploying:

1. **Missing Separator component** - Added `components/ui/separator.tsx` with Radix UI dependency
2. **Math.js type error** - Fixed `math.bignumber(math.sqrt(3))` returning Complex type by using string constant for √3
3. **Zod 4.x API compatibility** - Updated all validation schemas from deprecated `required_error`/`invalid_type_error`/`errorMap` to new syntax
4. **Database lazy initialization** - Modified `lib/db.ts` to delay Neon connection until env var is available, preventing build failures
5. **TypeScript type fixes** - Added explicit types to API route callbacks using `$inferSelect`

**Build Status**: ✓ PASSED

Circuit breaker feature now compiles successfully and is ready for Vercel deployment at `/breaker`.
