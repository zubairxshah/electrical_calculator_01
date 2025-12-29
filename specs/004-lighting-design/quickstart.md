# Quickstart: Lighting Design Calculator

**Feature**: 004-lighting-design
**Date**: 2025-12-29
**Status**: Ready for Implementation

## Overview

This guide provides integration scenarios and quick-start examples for the Lighting Design Calculator feature.

---

## Scenario 1: Basic Indoor Lighting Calculation (P1)

### User Flow
1. Navigate to `/lighting`
2. Enter room dimensions (length, width, height)
3. Set surface reflectances (or accept defaults)
4. Select luminaire from catalog
5. Set required illuminance (or select space type preset)
6. View calculated results
7. Download PDF report

### Code Integration Example

```typescript
// lib/calculations/lighting/lightingCalculator.ts
import { calculateRoomIndex } from './roomIndex';
import { calculateLuminairesRequired } from './lumenMethod';
import { calculateAverageIlluminance } from './averageIlluminance';
import { calculateEnergyConsumption } from './energyConsumption';
import { lookupUtilizationFactor } from '../standards/utilizationFactorTables';

interface LightingCalculationInput {
  room: {
    length: number;      // meters
    width: number;       // meters
    height: number;      // meters
    workPlaneHeight: number;
    ceilingReflectance: number;
    wallReflectance: number;
    floorReflectance: number;
  };
  luminaire: {
    watts: number;
    lumens: number;
    maxSHR: number;
    ufTableId: string;
  };
  designParameters: {
    requiredIlluminance: number;  // lux
    maintenanceFactor: number;
    operatingHoursPerDay: number;
  };
}

export function calculateLighting(input: LightingCalculationInput): LightingCalculationResult {
  const { room, luminaire, designParameters } = input;

  // Step 1: Calculate Room Index
  const mountingHeight = room.height - room.workPlaneHeight;
  const roomIndex = calculateRoomIndex(room.length, room.width, mountingHeight);

  // Step 2: Look up Utilization Factor
  const utilizationFactor = lookupUtilizationFactor(
    luminaire.ufTableId,
    roomIndex.value,
    room.ceilingReflectance,
    room.wallReflectance
  );

  // Step 3: Calculate luminaires required
  const roomArea = room.length * room.width;
  const luminairesRequired = calculateLuminairesRequired(
    designParameters.requiredIlluminance,
    roomArea,
    luminaire.lumens,
    utilizationFactor,
    designParameters.maintenanceFactor
  );

  // Step 4: Calculate average illuminance achieved
  const averageIlluminance = calculateAverageIlluminance(
    Math.ceil(luminairesRequired),
    luminaire.lumens,
    utilizationFactor,
    designParameters.maintenanceFactor,
    roomArea
  );

  // Step 5: Calculate energy consumption
  const totalWatts = Math.ceil(luminairesRequired) * luminaire.watts;
  const energyKwhYear = calculateEnergyConsumption(
    totalWatts,
    designParameters.operatingHoursPerDay
  );

  // Step 6: Validate spacing ratio
  const spacingRatio = calculateSpacingRatio(
    room.length,
    room.width,
    Math.ceil(luminairesRequired),
    mountingHeight
  );

  return {
    roomIndex,
    utilizationFactor,
    luminairesRequired,
    luminairesRounded: Math.ceil(luminairesRequired),
    averageIlluminance,
    totalWatts,
    totalLumens: Math.ceil(luminairesRequired) * luminaire.lumens,
    energyConsumptionKwhYear: energyKwhYear,
    spacingToHeightRatio: spacingRatio,
    shrCompliant: spacingRatio <= luminaire.maxSHR,
    warnings: generateWarnings(input, { spacingRatio, averageIlluminance }),
    recommendations: generateRecommendations(input, { spacingRatio }),
    standardReference: 'IESNA Lighting Handbook, 10th Edition',
    calculatedAt: new Date().toISOString(),
  };
}
```

### Component Integration

```tsx
// app/lighting/LightingDesignTool.tsx
'use client';

import { useState, useCallback } from 'react';
import { useLightingStore } from '@/stores/useLightingStore';
import { calculateLighting } from '@/lib/calculations/lighting/lightingCalculator';
import { LightingInputForm } from '@/components/lighting/LightingInputForm';
import { LightingResults } from '@/components/lighting/LightingResults';
import { useDebounce } from '@/hooks/useDebounce';

export function LightingDesignTool() {
  const store = useLightingStore();
  const [isCalculating, setIsCalculating] = useState(false);

  const debouncedCalculate = useDebounce(async () => {
    if (!store.isReadyToCalculate) return;

    setIsCalculating(true);
    try {
      const results = calculateLighting({
        room: store.room,
        luminaire: store.luminaire,
        designParameters: store.designParameters,
      });
      store.setResults(results);
      store.addToHistory({ room: store.room, luminaire: store.luminaire, results });
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }, 300);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LightingInputForm onInputChange={debouncedCalculate} />
      <LightingResults
        results={store.results}
        isCalculating={isCalculating}
      />
    </div>
  );
}
```

---

## Scenario 2: Visual Input from Floor Plan (P2)

### User Flow
1. Click "Upload Floor Plan" button
2. Select PDF or image file
3. Wait for OCR processing (~10-30 seconds)
4. Review extracted dimensions with confidence indicators
5. Confirm or correct uncertain values
6. Proceed to calculation with populated values

### Code Integration Example

```typescript
// lib/visual/floorPlanAnalyzer.ts
import Tesseract from 'tesseract.js';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface ExtractionResult {
  rooms: ExtractedRoom[];
  confidence: number;
  processingTimeMs: number;
  uncertainties: Uncertainty[];
}

export async function analyzeFloorPlan(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ExtractionResult> {
  const startTime = performance.now();

  // Step 1: Convert file to image data
  let imageData: ImageData;
  if (file.type === 'application/pdf') {
    imageData = await pdfToImageData(file);
  } else {
    imageData = await imageFileToImageData(file);
  }

  // Step 2: Run OCR
  const worker = await Tesseract.createWorker('eng');

  let ocrResult;
  try {
    ocrResult = await worker.recognize(imageData, {
      tessedit_char_whitelist: '0123456789.,-\'\"mftMFT×xX ',
    });
  } finally {
    await worker.terminate();
  }

  // Step 3: Parse dimensions from text
  const dimensions = parseDimensionPatterns(ocrResult.data.text);

  // Step 4: Identify room boundaries from bounding boxes
  const rooms = identifyRooms(dimensions, ocrResult.data.words);

  // Step 5: Calculate confidence and flag uncertainties
  const uncertainties = identifyUncertainties(rooms, ocrResult.data.confidence);

  return {
    rooms,
    confidence: ocrResult.data.confidence,
    processingTimeMs: performance.now() - startTime,
    uncertainties,
  };
}

// Dimension pattern regex examples:
// "12.5m", "12.5 m", "12.5M"
// "8'-6\"", "8' 6\""
// "3000mm", "3000 mm"
const DIMENSION_PATTERNS = [
  /(\d+\.?\d*)\s*(m|meters?|M)/gi,           // Metric meters
  /(\d+\.?\d*)\s*(mm|millimeters?)/gi,       // Millimeters
  /(\d+)'[\s-]*(\d+)?\"?/g,                  // Imperial feet-inches
  /(\d+\.?\d*)\s*(ft|feet|')/gi,             // Imperial feet
];

function parseDimensionPatterns(text: string): DimensionMatch[] {
  const matches: DimensionMatch[] = [];

  for (const pattern of DIMENSION_PATTERNS) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        raw: match[0],
        value: parseFloat(match[1]),
        unit: match[2] || 'm',
        position: match.index,
      });
    }
  }

  return matches;
}
```

### Component Integration

```tsx
// components/lighting/VisualInputSection.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { analyzeFloorPlan } from '@/lib/visual/floorPlanAnalyzer';
import { useLightingStore } from '@/stores/useLightingStore';

export function VisualInputSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const store = useLightingStore();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await analyzeFloorPlan(file, setProgress);
      setExtractedData(result);

      // If high confidence, auto-populate
      if (result.confidence > 90 && result.uncertainties.length === 0) {
        autoPopulateRoom(result.rooms[0]);
      }
    } catch (error) {
      console.error('Visual analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const autoPopulateRoom = (room: ExtractedRoom) => {
    store.setRoomDimensions(
      room.extractedLength,
      room.extractedWidth,
      room.extractedHeight || 3 // Default if not found
    );
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">Visual Input (Premium)</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.bmp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        variant="outline"
      >
        {isProcessing ? 'Processing...' : 'Upload Floor Plan'}
      </Button>

      {isProcessing && (
        <div className="mt-4">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground mt-1">
            Analyzing floor plan with OCR...
          </p>
        </div>
      )}

      {extractedData && !isProcessing && (
        <ExtractedDataReview
          data={extractedData}
          onConfirm={autoPopulateRoom}
        />
      )}
    </div>
  );
}
```

---

## Scenario 3: PDF Report Generation (P1)

### Code Integration Example

```typescript
// lib/pdfGenerator.lighting.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LightingPDFOptions {
  room: Room;
  luminaire: Luminaire;
  designParameters: DesignParameters;
  results: CalculationResults;
  chartElement?: HTMLElement;
  includeFormulas?: boolean;
}

export async function generateLightingPDF(
  options: LightingPDFOptions
): Promise<Blob> {
  const { room, luminaire, designParameters, results, chartElement, includeFormulas = true } = options;

  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Lighting Design Calculation', 105, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, yPos, { align: 'center' });
  yPos += 15;

  // Input Parameters Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Input Parameters', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Room dimensions table
  const roomData = [
    ['Room Length', `${room.length} m`],
    ['Room Width', `${room.width} m`],
    ['Ceiling Height', `${room.height} m`],
    ['Work Plane Height', `${room.workPlaneHeight} m`],
    ['Mounting Height', `${results.roomIndex.mountingHeight.toFixed(2)} m`],
    ['Room Area', `${(room.length * room.width).toFixed(1)} m²`],
  ];

  drawTable(doc, roomData, 20, yPos, 80);
  yPos += roomData.length * 7 + 10;

  // Reflectances
  const reflectanceData = [
    ['Ceiling Reflectance', `${room.ceilingReflectance}%`],
    ['Wall Reflectance', `${room.wallReflectance}%`],
    ['Floor Reflectance', `${room.floorReflectance}%`],
  ];

  drawTable(doc, reflectanceData, 110, yPos - roomData.length * 7 - 10, 80);

  // Luminaire data
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Luminaire Selection', 20, yPos);
  yPos += 8;

  const luminaireData = [
    ['Manufacturer', luminaire.manufacturer],
    ['Model', luminaire.model],
    ['Type', luminaire.category],
    ['Wattage', `${luminaire.watts} W`],
    ['Lumens', `${luminaire.lumens} lm`],
    ['Efficacy', `${luminaire.efficacy.toFixed(1)} lm/W`],
  ];

  drawTable(doc, luminaireData, 20, yPos, 170);
  yPos += luminaireData.length * 7 + 15;

  // Calculation Details
  if (includeFormulas) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculation Details', 20, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('courier', 'normal');

    // Room Index formula
    doc.text(`Room Index (RI) = (L × W) / (H_m × (L + W))`, 25, yPos);
    yPos += 5;
    doc.text(`RI = (${room.length} × ${room.width}) / (${results.roomIndex.mountingHeight.toFixed(2)} × (${room.length} + ${room.width}))`, 25, yPos);
    yPos += 5;
    doc.text(`RI = ${results.roomIndex.value.toFixed(2)}`, 25, yPos);
    yPos += 10;

    // Luminaires formula
    doc.text(`Luminaires Required (N) = (E × A) / (F × UF × MF)`, 25, yPos);
    yPos += 5;
    doc.text(`N = (${designParameters.requiredIlluminance} × ${(room.length * room.width).toFixed(1)}) / (${luminaire.lumens} × ${results.utilizationFactor.toFixed(2)} × ${designParameters.maintenanceFactor})`, 25, yPos);
    yPos += 5;
    doc.text(`N = ${results.luminairesRequired.toFixed(1)} → ${results.luminairesRounded} luminaires`, 25, yPos);
    yPos += 15;
  }

  // Results Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Calculation Results', 20, yPos);
  yPos += 8;

  const resultsData = [
    ['Luminaires Required', `${results.luminairesRounded}`],
    ['Average Illuminance', `${results.averageIlluminance.toFixed(1)} lux`],
    ['Total Power', `${results.totalWatts} W`],
    ['Annual Energy', `${results.energyConsumptionKwhYear.toFixed(0)} kWh/year`],
    ['Spacing/Height Ratio', `${results.spacingToHeightRatio.toFixed(2)}`],
    ['SHR Compliant', results.shrCompliant ? 'Yes' : 'No'],
  ];

  drawTable(doc, resultsData, 20, yPos, 170);
  yPos += resultsData.length * 7 + 15;

  // Warnings
  if (results.warnings.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Warnings', 20, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (const warning of results.warnings) {
      doc.text(`• ${warning.message}`, 25, yPos);
      yPos += 5;
    }
    yPos += 10;
  }

  // Standard Reference
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Reference: ${results.standardReference}`, 20, yPos);
  yPos += 15;

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    'Disclaimer: Calculations are for informational purposes only. Professional engineering review and PE stamp/certification is the user\'s responsibility.',
    20,
    280,
    { maxWidth: 170 }
  );

  return doc.output('blob');
}

function drawTable(doc: jsPDF, data: string[][], x: number, y: number, width: number) {
  const rowHeight = 7;
  const colWidth = width / 2;

  doc.setFontSize(9);

  data.forEach((row, i) => {
    doc.setFont('helvetica', 'normal');
    doc.text(row[0], x, y + i * rowHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(row[1], x + colWidth, y + i * rowHeight);
  });
}
```

---

## Scenario 4: Uniformity Analysis (P2)

### Code Integration Example

```typescript
// lib/calculations/lighting/uniformityRatio.ts
import { toBigNumber, toNumber } from '@/lib/mathConfig';

interface UniformityInput {
  room: { length: number; width: number };
  luminaires: {
    count: number;
    lumens: number;
    distribution: 'symmetric' | 'asymmetric';
  };
  mountingHeight: number;
  utilizationFactor: number;
  maintenanceFactor: number;
}

interface GridPoint {
  x: number;
  y: number;
  illuminance: number;
}

export function analyzeUniformity(input: UniformityInput): UniformityAnalysis {
  const { room, luminaires, mountingHeight, utilizationFactor, maintenanceFactor } = input;

  // Generate calculation grid
  const resolution = getGridResolution(room.length * room.width);
  const gridPoints: GridPoint[] = [];

  const pointsX = Math.ceil(room.length * resolution);
  const pointsY = Math.ceil(room.width * resolution);

  for (let i = 0; i < pointsX; i++) {
    for (let j = 0; j < pointsY; j++) {
      const x = (i + 0.5) / resolution;
      const y = (j + 0.5) / resolution;

      // Calculate illuminance at this point using inverse square law
      // Simplified: assumes uniform luminaire distribution
      const illuminance = calculatePointIlluminance(
        x, y,
        room, luminaires, mountingHeight,
        utilizationFactor, maintenanceFactor
      );

      gridPoints.push({ x, y, illuminance });
    }
  }

  // Calculate statistics
  const illuminances = gridPoints.map(p => p.illuminance);
  const eMin = Math.min(...illuminances);
  const eMax = Math.max(...illuminances);
  const eAvg = illuminances.reduce((a, b) => a + b, 0) / illuminances.length;

  const uniformityRatio = eMin / eAvg;

  // Identify problem areas (deviation > 20% from average)
  const problemAreas = gridPoints
    .filter(p => Math.abs(p.illuminance - eAvg) / eAvg > 0.2)
    .map(p => ({
      x: p.x,
      y: p.y,
      illuminance: p.illuminance,
      issue: p.illuminance < eAvg ? 'under-lit' : 'over-lit' as const,
      deviation: ((p.illuminance - eAvg) / eAvg) * 100,
    }));

  return {
    gridResolution: resolution,
    illuminanceGrid: reshapeToGrid(gridPoints, pointsX, pointsY),
    eMin,
    eMax,
    eAvg,
    uniformityRatio,
    uniformityCompliant: uniformityRatio >= 0.6, // Office standard
    requiredUniformity: 0.6,
    problemAreas,
    optimizationSuggestions: generateOptimizationSuggestions(problemAreas, uniformityRatio),
  };
}

function getGridResolution(area: number): number {
  if (area < 20) return 4;      // 4 points/m² for small rooms
  if (area > 100) return 1;     // 1 point/m² for large spaces
  return 2;                      // 2 points/m² default
}
```

---

## Test Commands

```bash
# Run all lighting calculator tests
npm test -- lighting

# Run specific test file
npm test -- roomIndex.test.ts

# Watch mode during development
npm test -- --watch lighting

# Generate coverage report
npm test:coverage -- lighting

# Run E2E tests
npm test:e2e -- lighting
```

---

## Development Checklist

### Phase 1 (MVP)
- [ ] Create `/app/lighting/page.tsx` route
- [ ] Implement `lib/calculations/lighting/` modules
- [ ] Create `components/lighting/` UI components
- [ ] Add `stores/useLightingStore.ts` with persist
- [ ] Implement `lib/pdfGenerator.lighting.ts`
- [ ] Write unit tests for all calculation modules
- [ ] Add navigation link in Sidebar

### Phase 2 (Premium)
- [ ] Integrate Tesseract.js for OCR
- [ ] Implement pdf.js for PDF rendering
- [ ] Create `VisualInputSection` component
- [ ] Implement uniformity analysis
- [ ] Add premium feature gating

### Phase 3 (Extended)
- [ ] Add roadway lighting calculations
- [ ] Implement luminaire catalog management
- [ ] Create database tables for user luminaires
- [ ] Add API routes for catalog CRUD
