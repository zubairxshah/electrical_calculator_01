# Quickstart: Arc Flash Calculator

**Feature**: `012-arc-flash` | **Date**: 2026-10-04

Use these steps to check the feature end to end once it's implemented.

## 1. Run the tests

```bash
npx vitest run __tests__/unit/calculations/arc-flash
```

Expected: every test passes, including:
- `annexD.test.ts`: D.1 (4.16 kV) and D.2 (480 V), all published values
- `golden.test.ts`: 2,000-row IEEE spreadsheet subset, ≤ 0.01% error, both cases
- `errata.test.ts`: 600 V uses the LV path; VOA MV reduced case
- `ppe.test.ts`: 1.2/4/8/25/40 cal/cm² edges, table method, approach boundaries
- `validation.test.ts`: every blocking range and warning code

## 2. Build

```bash
npx next build
```

Expected: zero TypeScript errors, and the `/arc-flash` route is listed.

## 3. Manual walkthrough (`npm run dev` → http://localhost:3000/arc-flash)

**A. Annex D.2 (LV, reduced case governs)**

| Field | Value |
|---|---|
| Voltage | 480 V |
| Bolted fault | 45 kA |
| Configuration | VCB |
| Gap | 32 mm |
| Working distance | 609.6 mm (24 in) |
| Enclosure H × W × D | 610 × 610 × 254 mm |
| Arcing time, nominal | 61.3 ms |
| Arcing time, reduced | 319 ms |

Expected:

| Case | Arcing current | Energy | Boundary |
|---|---|---|---|
| Nominal | 28.793 kA | 11.585 J/cm² (2.77 cal/cm²) | 1029 mm |
| Reduced | 25.244 kA | 53.156 J/cm² (12.70 cal/cm²) | 2669 mm |

The reduced case is marked "governs". The PPE category is **3** (minimum 25 cal/cm²).

**B. Annex D.1 (MV)**: 4160 V, 15 kA, VCB, gap 104 mm, D = 914.4 mm, H × W × D = 1143 × 762 × 508 mm, nominal 197 ms, reduced 223 ms.

Expected:

| Quantity | Value |
|---|---|
| Arcing current, nominal | 12.979 kA |
| Energy, reduced (governs) | 13.343 J/cm² (3.19 cal/cm²) |
| Boundary | 1704 mm |
| PPE | Category 1 |
| Enclosure correction factor | 1.284 (under calculation details) |

**C. DANGER state**: use D.2 with the reduced time set to 1500 ms. Expected: E > 40 cal/cm², a DANGER banner, a DANGER label and no PPE category.

**D. Out-of-range**: voltage 480 V with a 120 kA fault. Expected: a field error that cites the 0.5–106 kA limit, and no result.

**E. Standard toggle**: switch NEC → IEC on case A. Expected: the numbers are identical, J/cm² becomes primary, and the PPE text changes to "Minimum arc rating (ATPV/ELIM per IEC 61482-1-1) ≥ 53.2 J/cm²; garments per IEC 61482-2" instead of "Category 3".

**F. Table method**: choose "Panelboard ≤ 240 V" at 208 V, 20 kA, 25 ms, D = 457.2 mm. Expected: Cat 1, boundary 485 mm. Then change the fault to 30 kA. Expected: "Table method not applicable — available fault current exceeds 25 kA".

**G. History**: run A and B, then reload. Both appear in the sidebar, and selecting one restores it.

**H. PDF**: export case A. Check that every input, both case results, the PPE section, the label and the references are present.
