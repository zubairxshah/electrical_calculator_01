'use client';

/**
 * Lighting Design Tool Component
 *
 * Main client component for the indoor lighting calculator.
 * Implements US1: Basic Indoor Lighting Calculation
 *
 * Features:
 * - Room dimension inputs with validation
 * - Luminaire selection from catalog
 * - Real-time calculation with IESNA Lumen Method
 * - Results display with formula breakdown
 * - Warning and recommendation display
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  Lightbulb,
  Home,
  AlertTriangle,
  Info,
  CheckCircle2,
  Zap,
  Settings2,
  History,
  FileText,
  Download,
} from 'lucide-react';
import { useLightingStore } from '@/stores/useLightingStore';
import { performLightingCalculation } from '@/lib/calculations/lighting/lumenMethod';
import { calculateSimpleLighting } from '@/lib/calculations/lighting/simpleLumenMethod';
import { validateRoom, validateLuminaire, validateDesignParameters } from '@/lib/validation/lightingValidation';
import { SPACE_TYPE_PRESETS, getSpaceTypePreset } from '@/lib/standards/spaceTypePresets';
import { REFLECTANCE_PRESETS, DEFAULT_REFLECTANCES } from '@/lib/standards/reflectanceDefaults';
import { getAllLuminaires, getLuminairesByCategory } from '@/lib/standards/luminaireCatalog';
import { lookupUF } from '@/lib/standards/utilizationFactorTables';
import type { Room, Luminaire, DesignParameters, CalculationResults, CalculationWarning } from '@/lib/types/lighting';
import { SpaceType, LuminaireCategory, LightingStandard, UnitSystem } from '@/lib/types/lighting';
import { downloadLightingPdf } from '@/lib/reports/lightingPdfGenerator';
import { LayoutCanvas } from '@/components/lighting/LayoutCanvas';
import { FixtureSuggestions } from '@/components/lighting/FixtureSuggestions';
import { LayoutToolbar } from '@/components/lighting/LayoutToolbar';
import { calculateFixtureLayout } from '@/lib/calculations/lighting/layoutAlgorithm';
import type { FixturePosition } from '@/lib/types/lighting';

// ============================================================================
// Component
// ============================================================================

export function LightingDesignTool() {
  const store = useLightingStore();
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('room');
  const [layoutCanvasElement, setLayoutCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [useSimpleMethod, setUseSimpleMethod] = useState(true); // Default to simple method

  // Get room from store
  const room: Room = {
    length: store.roomLength,
    width: store.roomWidth,
    height: store.roomHeight,
    workPlaneHeight: store.workPlaneHeight,
    ceilingReflectance: store.ceilingReflectance,
    wallReflectance: store.wallReflectance,
    floorReflectance: store.floorReflectance,
    spaceType: store.spaceType,
  };

  // Get design parameters from store
  const params: DesignParameters = {
    requiredIlluminance: store.requiredIlluminance,
    utilizationFactor: store.utilizationFactor,
    maintenanceFactor: store.maintenanceFactor,
    operatingHoursPerDay: store.operatingHoursPerDay,
    standard: store.standard,
    unitSystem: store.unitSystem,
  };

  // Perform calculation
  const handleCalculate = useCallback(() => {
    if (!store.selectedLuminaire) {
      store.setValidationErrors(['Please select a luminaire']);
      return;
    }

    // Validate inputs
    const roomValidation = validateRoom(room);
    const luminaireValidation = validateLuminaire(store.selectedLuminaire);
    const paramsValidation = validateDesignParameters(params);

    const allErrors = [
      ...roomValidation.errors,
      ...luminaireValidation.errors,
      ...paramsValidation.errors,
    ];

    if (allErrors.length > 0) {
      store.setValidationErrors(allErrors);
      return;
    }

    store.setValidationErrors([]);
    setIsCalculating(true);

    try {
      // Use simple method by default, or complex IESNA method if toggled
      const results = useSimpleMethod
        ? calculateSimpleLighting(room, store.selectedLuminaire, params)
        : performLightingCalculation(room, store.selectedLuminaire, params);

      store.setResults(results);

      // Generate layout positions (Feature: 005-lighting-layout-viz)
      // Use practical count for layout visualization
      const fixtureCount = results.luminairesPractical || results.luminairesRounded;
      if (fixtureCount > 0) {
        const mountingHeight = room.height - room.workPlaneHeight;
        const layoutResult = calculateFixtureLayout({
          roomWidth: room.width,
          roomLength: room.length,
          fixtureCount,
          mountingHeight,
        });
        store.setLayoutPositions(layoutResult.positions);
      } else {
        store.resetLayoutPositions();
      }
    } catch (error) {
      console.error('Calculation error:', error);
      store.setValidationErrors(['Calculation failed. Please check your inputs.']);
    } finally {
      setIsCalculating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, store.selectedLuminaire, params]);

  // Update UF when room parameters change (unless manually overridden)
  useEffect(() => {
    if (!store.isUFManualOverride && store.selectedLuminaire) {
      const mountingHeight = room.height - room.workPlaneHeight;
      const ri =
        (room.length * room.width) /
        (mountingHeight * (room.length + room.width));

      const newUF = lookupUF(
        store.selectedLuminaire.ufTableId,
        ri,
        room.ceilingReflectance,
        room.wallReflectance,
        room.floorReflectance
      );
      store.setUtilizationFactor(newUF, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    room.length,
    room.width,
    room.height,
    room.workPlaneHeight,
    room.ceilingReflectance,
    room.wallReflectance,
    room.floorReflectance,
    store.selectedLuminaire,
    store.isUFManualOverride,
  ]);

  // Update illuminance when space type changes
  useEffect(() => {
    const preset = getSpaceTypePreset(store.spaceType);
    if (preset) {
      store.setRequiredIlluminance(preset.illuminance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.spaceType]);

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {store.validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {store.validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="room">
                <Home className="h-4 w-4 mr-2" />
                Room
              </TabsTrigger>
              <TabsTrigger value="luminaire">
                <Lightbulb className="h-4 w-4 mr-2" />
                Luminaire
              </TabsTrigger>
              <TabsTrigger value="parameters">
                <Settings2 className="h-4 w-4 mr-2" />
                Parameters
              </TabsTrigger>
            </TabsList>

            {/* Room Tab */}
            <TabsContent value="room" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Room Configuration</CardTitle>
                  <CardDescription>
                    Enter room dimensions and surface reflectances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Room Dimensions */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="length">Length (m)</Label>
                      <Input
                        id="length"
                        type="number"
                        min={1}
                        max={100}
                        step={0.1}
                        value={store.roomLength}
                        onChange={(e) => store.setRoomLength(parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (m)</Label>
                      <Input
                        id="width"
                        type="number"
                        min={1}
                        max={100}
                        step={0.1}
                        value={store.roomWidth}
                        onChange={(e) => store.setRoomWidth(parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Ceiling Height (m)</Label>
                      <Input
                        id="height"
                        type="number"
                        min={2}
                        max={20}
                        step={0.1}
                        value={store.roomHeight}
                        onChange={(e) => store.setRoomHeight(parseFloat(e.target.value) || 2)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workPlane">Work Plane Height (m)</Label>
                      <Input
                        id="workPlane"
                        type="number"
                        min={0}
                        max={store.roomHeight - 0.5}
                        step={0.05}
                        value={store.workPlaneHeight}
                        onChange={(e) => store.setWorkPlaneHeight(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* Calculated Values Display */}
                  <div className="flex gap-4 p-3 bg-muted rounded-lg">
                    <div>
                      <span className="text-sm text-muted-foreground">Floor Area:</span>
                      <span className="ml-2 font-mono font-semibold">
                        {(store.roomLength * store.roomWidth).toFixed(1)} m²
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-auto" />
                    <div>
                      <span className="text-sm text-muted-foreground">Mounting Height:</span>
                      <span className="ml-2 font-mono font-semibold">
                        {(store.roomHeight - store.workPlaneHeight).toFixed(2)} m
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Space Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="spaceType">Space Type</Label>
                    <Select
                      value={store.spaceType}
                      onValueChange={(value) => store.setSpaceType(value as SpaceType)}
                    >
                      <SelectTrigger id="spaceType">
                        <SelectValue placeholder="Select space type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPACE_TYPE_PRESETS.map((preset) => (
                          <SelectItem key={preset.type} value={preset.type}>
                            {preset.name} ({preset.illuminance} lux)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Reflectances */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Surface Reflectances</Label>
                      <Select
                        onValueChange={(value) => {
                          const preset = REFLECTANCE_PRESETS.find((p) => p.name === value);
                          if (preset) {
                            store.setReflectances(preset.ceiling, preset.wall, preset.floor);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Load preset..." />
                        </SelectTrigger>
                        <SelectContent>
                          {REFLECTANCE_PRESETS.map((preset) => (
                            <SelectItem key={preset.name} value={preset.name}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Label>Ceiling</Label>
                          <span className="text-sm font-mono">{store.ceilingReflectance}%</span>
                        </div>
                        <Slider
                          value={[store.ceilingReflectance]}
                          min={10}
                          max={90}
                          step={5}
                          onValueChange={([value]) => store.setCeilingReflectance(value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Label>Walls</Label>
                          <span className="text-sm font-mono">{store.wallReflectance}%</span>
                        </div>
                        <Slider
                          value={[store.wallReflectance]}
                          min={10}
                          max={80}
                          step={5}
                          onValueChange={([value]) => store.setWallReflectance(value)}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <Label>Floor</Label>
                          <span className="text-sm font-mono">{store.floorReflectance}%</span>
                        </div>
                        <Slider
                          value={[store.floorReflectance]}
                          min={10}
                          max={50}
                          step={5}
                          onValueChange={([value]) => store.setFloorReflectance(value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Luminaire Tab */}
            <TabsContent value="luminaire" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Luminaire Selection</CardTitle>
                  <CardDescription>
                    Choose a luminaire from the catalog or enter custom specs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2">
                    {Object.values(LuminaireCategory).map((cat) => (
                      <Badge
                        key={cat}
                        variant={store.selectedLuminaire?.category === cat ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const luminaires = getLuminairesByCategory(cat);
                          if (luminaires.length > 0) {
                            store.setSelectedLuminaire(luminaires[0]);
                          }
                        }}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Badge>
                    ))}
                  </div>

                  <Separator />

                  {/* Luminaire Selection */}
                  <div className="space-y-2">
                    <Label>Select Luminaire</Label>
                    <Select
                      value={store.selectedLuminaire?.id || ''}
                      onValueChange={(id) => {
                        const luminaire = getAllLuminaires().find((l) => l.id === id);
                        if (luminaire) {
                          store.setSelectedLuminaire(luminaire);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a luminaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllLuminaires().map((lum) => (
                          <SelectItem key={lum.id} value={lum.id}>
                            {lum.model} - {lum.lumens} lm, {lum.watts}W
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Luminaire Details */}
                  {store.selectedLuminaire && (
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{store.selectedLuminaire.model}</h4>
                          <p className="text-sm text-muted-foreground">
                            {store.selectedLuminaire.manufacturer}
                          </p>
                        </div>
                        <Badge>{store.selectedLuminaire.category}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Power:</span>
                          <span className="ml-2 font-mono">{store.selectedLuminaire.watts}W</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lumens:</span>
                          <span className="ml-2 font-mono">{store.selectedLuminaire.lumens} lm</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Efficacy:</span>
                          <span className="ml-2 font-mono">{store.selectedLuminaire.efficacy} lm/W</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max SHR:</span>
                          <span className="ml-2 font-mono">{store.selectedLuminaire.maxSHR}</span>
                        </div>
                        {store.selectedLuminaire.cri && (
                          <div>
                            <span className="text-muted-foreground">CRI:</span>
                            <span className="ml-2 font-mono">{store.selectedLuminaire.cri}</span>
                          </div>
                        )}
                        {store.selectedLuminaire.cct && (
                          <div>
                            <span className="text-muted-foreground">CCT:</span>
                            <span className="ml-2 font-mono">{store.selectedLuminaire.cct}K</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Parameters Tab */}
            <TabsContent value="parameters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Design Parameters</CardTitle>
                  <CardDescription>
                    Illuminance requirements and calculation factors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Required Illuminance */}
                  <div className="space-y-2">
                    <Label htmlFor="illuminance">Required Illuminance (lux)</Label>
                    <Input
                      id="illuminance"
                      type="number"
                      min={50}
                      max={5000}
                      value={store.requiredIlluminance}
                      onChange={(e) =>
                        store.setRequiredIlluminance(parseInt(e.target.value) || 500)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      IESNA recommended for {getSpaceTypePreset(store.spaceType)?.name || 'selected space'}:{' '}
                      {getSpaceTypePreset(store.spaceType)?.illuminance || 500} lux
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Utilization Factor */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Utilization Factor (UF)</Label>
                        <span className="text-sm font-mono">{store.utilizationFactor.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[store.utilizationFactor * 100]}
                        min={30}
                        max={90}
                        step={1}
                        onValueChange={([value]) => store.setUtilizationFactor(value / 100, true)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {store.isUFManualOverride ? 'Manual override' : 'Auto-calculated from room & luminaire'}
                      </p>
                    </div>

                    {/* Maintenance Factor */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Maintenance Factor (MF)</Label>
                        <span className="text-sm font-mono">{store.maintenanceFactor.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[store.maintenanceFactor * 100]}
                        min={50}
                        max={100}
                        step={5}
                        onValueChange={([value]) => store.setMaintenanceFactor(value / 100)}
                      />
                      <p className="text-xs text-muted-foreground">
                        0.8 = Clean environment, 0.65 = Industrial
                      </p>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="hours">Operating Hours per Day</Label>
                    <Input
                      id="hours"
                      type="number"
                      min={1}
                      max={24}
                      value={store.operatingHoursPerDay}
                      onChange={(e) =>
                        store.setOperatingHoursPerDay(parseInt(e.target.value) || 10)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Calculation Method Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Calculation Method</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={useSimpleMethod ? "default" : "outline"} className="text-xs">
                {useSimpleMethod ? 'Simple' : 'IESNA'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseSimpleMethod(!useSimpleMethod)}
              >
                Switch
              </Button>
            </div>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {useSimpleMethod
                ? 'Simple method: Direct lumen calculation for practical results (recommended for most applications)'
                : 'IESNA method: Professional engineering calculation with UF tables (for detailed design)'}
            </AlertDescription>
          </Alert>

          {/* Calculate Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleCalculate}
            disabled={isCalculating || !store.selectedLuminaire}
          >
            <Calculator className="mr-2 h-5 w-5" />
            {isCalculating ? 'Calculating...' : 'Calculate Lighting Requirements'}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Results Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {store.results ? (
                <div className="space-y-4">
                  {/* Primary Results */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="font-medium">Luminaires Required</span>
                      <span className="text-2xl font-bold text-primary">
                        {store.results.luminairesRounded}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Room Index</div>
                        <div className="font-mono font-semibold">
                          {store.results.roomIndex.value.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground">UF Used</div>
                        <div className="font-mono font-semibold">
                          {store.results.utilizationFactor.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground">Avg. Illuminance</div>
                        <div className="font-mono font-semibold">
                          {store.results.averageIlluminance.toFixed(0)} lux
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="text-muted-foreground">SHR</div>
                        <div className="font-mono font-semibold flex items-center gap-1">
                          {store.results.spacingToHeightRatio.toFixed(2)}
                          {store.results.shrCompliant ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Power & Energy */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Power</span>
                        <span className="font-mono">{store.results.totalWatts} W</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Lumens</span>
                        <span className="font-mono">{store.results.totalLumens.toLocaleString()} lm</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Annual Energy</span>
                        <span className="font-mono">{store.results.energyConsumptionKwhYear.toLocaleString()} kWh/yr</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Power Density</span>
                        <span className="font-mono">
                          {(store.results.totalWatts / (store.roomLength * store.roomWidth)).toFixed(1)} W/m²
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {store.results.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Warnings
                      </h4>
                      {store.results.warnings.map((warning, i) => (
                        <Alert key={i} variant={warning.severity === 'error' ? 'destructive' : 'default'}>
                          <AlertDescription className="text-xs">
                            {warning.message}
                            {warning.recommendation && (
                              <p className="mt-1 text-muted-foreground">
                                Tip: {warning.recommendation}
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {store.results.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        Recommendations
                      </h4>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        {store.results.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />

                  {/* Layout Visualization (Feature: 005-lighting-layout-viz) */}
                  {store.layoutPositions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        Room Layout
                      </h4>

                      <LayoutToolbar
                        isManual={store.isLayoutManual}
                        fixtureCount={store.layoutPositions.length}
                        onReset={() => {
                          store.resetLayoutPositions();
                          // Recalculate auto-layout
                          if (store.results) {
                            const mountingHeight = room.height - room.workPlaneHeight;
                            const layoutResult = calculateFixtureLayout({
                              roomWidth: room.width,
                              roomLength: room.length,
                              fixtureCount: store.results.luminairesRounded,
                              mountingHeight,
                            });
                            store.setLayoutPositions(layoutResult.positions);
                          }
                        }}
                      />

                      <LayoutCanvas
                        roomWidth={room.width}
                        roomLength={room.length}
                        fixturePositions={store.layoutPositions}
                        luminaireLumens={store.selectedLuminaire?.lumens}
                        luminaireWatts={store.selectedLuminaire?.watts}
                        unitSystem={store.unitSystem}
                        containerWidth={500}
                        showGrid={true}
                        onCanvasReady={(canvas) => {
                          setLayoutCanvasElement(canvas);
                        }}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Fixture Suggestions (Feature: 005-lighting-layout-viz US4) */}
                  <FixtureSuggestions
                    spaceType={room.spaceType}
                    requiredIlluminance={store.requiredIlluminance}
                    roomArea={room.width * room.length}
                    currentCategory={store.selectedLuminaire?.category}
                  />

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => store.saveToHistory()}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => store.toggleCalculationDetails()}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (store.results && store.selectedLuminaire) {
                          downloadLightingPdf({
                            room,
                            luminaire: store.selectedLuminaire,
                            designParameters: params,
                            results: store.results,
                            projectInfo: {
                              date: new Date().toLocaleDateString(),
                            },
                            // Include layout visualization (Feature: 005-lighting-layout-viz)
                            layoutCanvas: layoutCanvasElement || undefined,
                            layoutPositions: store.layoutPositions.length > 0 ? store.layoutPositions : undefined,
                          });
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Configure room and luminaire parameters, then click Calculate</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formula Details (expandable) */}
          {store.results && store.showCalculationDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calculation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {store.results.formulas.map((formula, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="font-medium text-sm">{formula.name}</h4>
                    <code className="block text-xs bg-muted p-2 rounded font-mono">
                      {formula.formula}
                    </code>
                    <div className="text-xs text-muted-foreground">
                      {formula.variables.map((v, j) => (
                        <span key={j} className="mr-3">
                          {v.symbol} = {v.value} {v.unit}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm font-semibold">
                      Result: {formula.result} {formula.unit}
                    </div>
                    {i < store.results!.formulas.length - 1 && <Separator />}
                  </div>
                ))}

                <Separator />

                <p className="text-xs text-muted-foreground">
                  Reference: {store.results.standardReference}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
