# Research: Lighting Design Calculator

**Feature**: 004-lighting-design
**Date**: 2025-12-29
**Status**: Complete

## Research Summary

This document consolidates technical research for implementing the Lighting Design Calculator. All NEEDS CLARIFICATION items from the Technical Context have been resolved.

---

## 1. Lighting Calculation Standards

### Decision: IESNA Lumen Method for Indoor Lighting
**Rationale**: Industry-standard methodology used globally, well-documented in IESNA Lighting Handbook, compatible with existing ElectroMate accuracy requirements (±5%).

**Alternatives Considered**:
- Point-by-Point Method: More accurate for complex scenarios but computationally intensive, overkill for basic calculations
- Radiosity Method: Used in advanced simulation software (DIALux), requires 3D modeling capabilities beyond MVP scope
- Coefficient of Utilization (CU) Method: Essentially the same as lumen method, different terminology

**Implementation**:
```typescript
// Core formula: N = (E × A) / (F × UF × MF)
function calculateLuminairesRequired(
  requiredIlluminance: number,  // E (lux)
  roomArea: number,              // A (m²)
  luminaireLumens: number,       // F (lm)
  utilizationFactor: number,     // UF (0.5-0.8)
  maintenanceFactor: number      // MF (0.7-0.9)
): number {
  return Math.ceil(
    (requiredIlluminance * roomArea) /
    (luminaireLumens * utilizationFactor * maintenanceFactor)
  );
}
```

### Decision: Both IES RP-8 and CIE 140 for Outdoor Lighting
**Rationale**: Per spec clarification Q2, support both American (IES RP-8) and international (CIE 140) standards for global market coverage.

**Alternatives Considered**:
- IES RP-8 only: Would limit international users
- CIE 140 only: Would limit North American users
- Single unified approach: Standards have different assumptions, unified approach would be non-compliant

**Key Differences**:
| Aspect | IES RP-8 | CIE 140 |
|--------|----------|---------|
| Uniformity metric | Min/Avg ratio | Overall uniformity (Uo) |
| Road classifications | M1-M5 | ME1-ME6 |
| Luminance vs Illuminance | Luminance-based | Both methods |
| Veiling luminance | Included | Calculated separately |

---

## 2. Visual Input Technology Stack

### Decision: Tesseract.js (Local OCR)
**Rationale**: Per spec clarification Q1, prioritize zero per-page costs and accessibility. Tesseract.js runs entirely in-browser with no API calls.

**Alternatives Considered**:
- Google Cloud Vision API: ~$1.50/1000 images, excellent accuracy but ongoing costs
- AWS Textract: ~$1.50/1000 pages, good for documents but recurring fees
- Azure Computer Vision: Similar pricing, adds vendor lock-in
- OpenCV.js + custom rules: Lower-level, requires significant custom development

**Implementation Strategy**:
```typescript
// Browser-based OCR with web workers for non-blocking execution
import Tesseract from 'tesseract.js';

async function extractDimensionsFromImage(imageData: ImageData): Promise<DimensionResult[]> {
  const worker = await Tesseract.createWorker('eng');

  // Pre-process image for better OCR accuracy
  const processedImage = preprocessForDimensions(imageData);

  const { data: { text, confidence } } = await worker.recognize(processedImage);

  await worker.terminate();

  // Parse dimension patterns: "12.5m", "8'-6\"", "3000mm"
  return parseDimensionText(text, confidence);
}
```

**Accuracy Considerations**:
- Best case: Clean architectural drawings with digital annotations → 95%+ accuracy
- Average case: Scanned PDFs with typed dimensions → 85-90% accuracy
- Worst case: Hand-drawn sketches → 60-70% accuracy (requires manual confirmation)

### Decision: pdf.js for PDF Rendering
**Rationale**: Industry-standard PDF renderer maintained by Mozilla, already used by browsers internally, MIT licensed.

**Alternatives Considered**:
- pdf2pic (server-side): Requires Node.js backend, adds complexity
- pdfium: Native library, harder to integrate in browser
- Custom PDF parsing: Reinventing the wheel, error-prone

---

## 3. Utilization Factor (UF) Tables

### Decision: Pre-computed UF Lookup Tables
**Rationale**: UF calculation from first principles (zonal cavity method) is complex and varies by luminaire. Pre-computed tables for common luminaire types provide accurate results with simpler implementation.

**Implementation**:
```typescript
// UF lookup by Room Index and reflectance combination
interface UFTableEntry {
  roomIndexRange: [number, number];
  ceilingReflectance: number;  // 80, 70, 50, 30
  wallReflectance: number;     // 50, 30, 10
  utilizationFactor: number;
}

// Example: LED troffer with symmetric distribution
const ledTrofferUFTable: UFTableEntry[] = [
  { roomIndexRange: [0.6, 0.8], ceilingReflectance: 80, wallReflectance: 50, utilizationFactor: 0.42 },
  { roomIndexRange: [0.8, 1.0], ceilingReflectance: 80, wallReflectance: 50, utilizationFactor: 0.49 },
  { roomIndexRange: [1.0, 1.25], ceilingReflectance: 80, wallReflectance: 50, utilizationFactor: 0.54 },
  { roomIndexRange: [1.25, 1.5], ceilingReflectance: 80, wallReflectance: 50, utilizationFactor: 0.58 },
  // ... more entries
];
```

**UF Table Sources**:
- IESNA Lighting Handbook Table 9.4 (generic luminaire types)
- Manufacturer photometric data (IES files provide CU tables)
- Interpolation for intermediate values

---

## 4. Luminaire Catalog Structure

### Decision: JSON-based Static Catalog with Database Extension
**Rationale**: Static JSON catalog provides fast initial load with 50+ common fixtures. Database (Neon PostgreSQL) stores user-saved custom luminaires.

**Catalog Schema**:
```typescript
interface Luminaire {
  id: string;
  manufacturer: string;
  model: string;
  category: 'troffer' | 'highbay' | 'wallpack' | 'roadway' | 'downlight' | 'strip';

  // Electrical specs
  watts: number;
  lumens: number;
  efficacy: number;  // lm/W

  // Optical specs
  beamAngle: number;       // degrees
  distributionType: 'direct' | 'indirect' | 'direct-indirect';
  maxSHR: number;          // max spacing-to-height ratio

  // UF table reference
  ufTableId: string;

  // Optional
  cri?: number;            // Color Rendering Index
  cct?: number;            // Correlated Color Temperature (K)
  dimmable?: boolean;
  ip Rating?: string;      // e.g., "IP65"
}
```

**Initial Catalog Categories** (50+ fixtures):
- LED Troffers (2x2, 2x4): 10 entries
- LED High-Bay: 8 entries
- LED Downlights: 8 entries
- LED Wall Packs: 6 entries
- LED Strip Lights: 6 entries
- Roadway Luminaires: 8 entries
- Specialty (emergency, decorative): 6 entries

---

## 5. Uniformity Analysis (P2 Feature)

### Decision: Grid-Based Point Calculation
**Rationale**: Calculate illuminance at grid points across room floor to determine min/max/avg and identify problem areas.

**Implementation**:
```typescript
interface UniformityAnalysis {
  gridResolution: number;        // points per meter
  illuminanceGrid: number[][];   // 2D array of lux values

  eMin: number;
  eMax: number;
  eAvg: number;
  uniformityRatio: number;       // Emin/Eavg

  problemAreas: {
    x: number;
    y: number;
    illuminance: number;
    issue: 'under-lit' | 'over-lit';
  }[];
}
```

**Grid Resolution**:
- Default: 1 point per 0.5m (2 points/m²)
- For rooms <20m²: 4 points/m²
- For rooms >100m²: 1 point/m²

**Uniformity Standards**:
| Space Type | Minimum Uniformity (Emin/Eavg) |
|------------|--------------------------------|
| Office | 0.6 |
| Classroom | 0.6 |
| Industrial | 0.4 |
| Warehouse | 0.3 |
| Roadway | 0.35-0.4 (per class) |

---

## 6. PDF Report Structure

### Decision: Follow Breaker Calculator Pattern
**Rationale**: Consistent user experience across ElectroMate tools, reuse pdfGenerator patterns.

**Report Sections**:
1. **Header**: ElectroMate branding, "Lighting Design Calculation", timestamp
2. **Input Summary**: Room dimensions, reflectances, luminaire selection, required illuminance
3. **Calculation Details**: Room Index formula, UF lookup, luminaire count formula
4. **Results Table**: Luminaires required, average illuminance achieved, energy consumption
5. **Layout Diagram**: Room rectangle with luminaire positions (if multiple fixtures)
6. **Recommendations**: Optimization suggestions if uniformity issues detected
7. **Standard References**: "Calculated per IESNA Lighting Handbook, 10th Edition"
8. **Disclaimer**: Professional disclaimer text

---

## 7. Space Type Presets

### Decision: Pre-configured Illuminance Targets
**Rationale**: Reduce user input errors by providing standards-based defaults.

**Preset Values** (per IESNA recommendations):
```typescript
const spaceTypePresets = {
  office_general: { illuminance: 500, description: 'General office work' },
  office_detailed: { illuminance: 750, description: 'Detailed office work' },
  classroom: { illuminance: 500, description: 'Educational classroom' },
  conference: { illuminance: 300, description: 'Conference/meeting room' },
  corridor: { illuminance: 100, description: 'Corridors and hallways' },
  lobby: { illuminance: 200, description: 'Reception and lobby' },
  warehouse: { illuminance: 200, description: 'General warehouse' },
  warehouse_detailed: { illuminance: 500, description: 'Warehouse with detail work' },
  industrial: { illuminance: 500, description: 'Industrial manufacturing' },
  retail: { illuminance: 500, description: 'Retail sales floor' },
  hospital_exam: { illuminance: 1000, description: 'Medical examination' },
  parking_indoor: { illuminance: 50, description: 'Indoor parking' },
};
```

---

## 8. Unit Conversion

### Decision: Internal SI with Display Toggle
**Rationale**: Consistent with ElectroMate Principle IV (Dual Standards Support).

**Conversions**:
```typescript
const conversions = {
  // Length
  metersToFeet: (m: number) => m * 3.28084,
  feetToMeters: (ft: number) => ft / 3.28084,

  // Area
  sqMetersToSqFeet: (m2: number) => m2 * 10.7639,
  sqFeetToSqMeters: (ft2: number) => ft2 / 10.7639,

  // Illuminance
  luxToFootcandles: (lux: number) => lux * 0.0929,
  footcandlesToLux: (fc: number) => fc / 0.0929,
};
```

---

## 9. Performance Optimization

### Decision: Web Workers for Visual Analysis
**Rationale**: Tesseract.js OCR can take 10-30 seconds; must not block UI thread.

**Implementation**:
```typescript
// OCR processing in web worker
const ocrWorker = new Worker('/workers/ocr-worker.js');

ocrWorker.postMessage({
  type: 'PROCESS_IMAGE',
  imageData: canvasImageData
});

ocrWorker.onmessage = (event) => {
  if (event.data.type === 'OCR_COMPLETE') {
    const { dimensions, confidence } = event.data;
    // Update UI with extracted dimensions
  } else if (event.data.type === 'OCR_PROGRESS') {
    // Update progress indicator
  }
};
```

---

## 10. Test Case Reference Values

### IESNA Handbook Example Validation
**Source**: IESNA Lighting Handbook, 10th Edition, Chapter 9

**Test Case 1**: Standard Office
- Room: 12m × 8m × 3m (ceiling height), work plane at 0.75m
- Mounting height: 3m - 0.75m = 2.25m
- Reflectances: 80/50/20 (ceiling/wall/floor)
- Luminaire: LED Troffer, 3600 lm, 40W
- Required: 500 lux
- Expected Room Index: (12 × 8) / (2.25 × (12 + 8)) = 96 / 45 = 2.13
- Expected UF: ~0.65 (from table for RI=2.13, 80/50/20)
- Expected N: (500 × 96) / (3600 × 0.65 × 0.8) = 48000 / 1872 = 25.6 → 26 luminaires
- Energy: 26 × 40W × 10h × 365 / 1000 = 3,796 kWh/year

**Test Case 2**: Warehouse High-Bay
- Room: 30m × 20m × 8m, work plane at 0m (floor)
- Mounting height: 8m
- Reflectances: 50/30/20
- Luminaire: LED High-Bay, 20000 lm, 150W
- Required: 300 lux
- Expected Room Index: (30 × 20) / (8 × (30 + 20)) = 600 / 400 = 1.5
- Expected UF: ~0.55
- Expected N: (300 × 600) / (20000 × 0.55 × 0.8) = 180000 / 8800 = 20.5 → 21 luminaires

---

## Research Completion Checklist

- [x] Indoor lighting calculation methodology (IESNA Lumen Method)
- [x] Outdoor lighting standards (IES RP-8, CIE 140)
- [x] Visual input technology (Tesseract.js)
- [x] PDF rendering approach (pdf.js)
- [x] Utilization factor tables structure
- [x] Luminaire catalog schema
- [x] Uniformity analysis approach
- [x] PDF report structure
- [x] Space type presets
- [x] Unit conversion approach
- [x] Performance optimization strategy
- [x] Test case reference values

**All NEEDS CLARIFICATION items resolved.** Ready for Phase 1 design.
