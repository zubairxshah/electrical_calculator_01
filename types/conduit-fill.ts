// Conduit/Raceway Fill Calculator — NEC Chapter 9 + IEC 61386 / BS 7671
// Types for conduit fill compliance calculations

export type ConduitStandard = 'NEC' | 'IEC';

// NEC conduit types
export type NECConduitTypeId = 'EMT' | 'RMC' | 'IMC' | 'PVC40' | 'PVC80' | 'FMC' | 'LFMC';

// IEC/BS EN conduit types (IEC 61386)
export type IECConduitTypeId = 'RIGID_PVC' | 'RIGID_STEEL' | 'FLEXIBLE_PVC' | 'FLEXIBLE_METAL' | 'CORRUGATED';

export type ConduitTypeId = NECConduitTypeId | IECConduitTypeId;

// NEC insulation types
export type NECInsulationTypeId =
  | 'THHN'
  | 'THWN'
  | 'THW'
  | 'XHHW'
  | 'XHHW2'
  | 'RHH_RHW'
  | 'RHW2'
  | 'USE2'
  | 'BARE';

// IEC/BS EN cable insulation types
export type IECInsulationTypeId =
  | 'PVC_V'        // PVC insulated (V-grade, 70°C)
  | 'PVC_V90'      // PVC insulated (V-90, 90°C)
  | 'XLPE_X'       // XLPE cross-linked polyethylene (90°C)
  | 'EPR_R'        // EPR rubber (90°C)
  | 'LSF'          // Low smoke and fume
  | 'SWA'          // Steel wire armoured (overall diameter)
  | 'BARE_IEC';    // Bare conductor

export type InsulationTypeId = NECInsulationTypeId | IECInsulationTypeId;

export type UnitSystem = 'imperial' | 'metric';

export interface ConduitTypeInfo {
  id: ConduitTypeId;
  label: string;
  standard: ConduitStandard;
  description?: string;
}

export interface TradeSize {
  imperial: string;          // NEC: e.g., "3/4", "1-1/2"
  metric: number;            // Metric designator: 21, 41 etc.
  metricLabel?: string;      // IEC display: "20mm", "25mm"
  internalAreaSqIn: number;  // Internal area in sq inches
  internalAreaMm2: number;   // Internal area in mm²
  internalDiameterMm?: number; // For IEC calculations
}

export interface InsulationTypeInfo {
  id: InsulationTypeId;
  label: string;
  standard: ConduitStandard;
  necTable: string;          // e.g., "Table 5", "BS 7671 Table C1"
  description?: string;
}

export interface WireSizeInfo {
  id: string;
  label: string;
  isKcmil: boolean;
  sortOrder: number;
  standard: ConduitStandard;
}

export interface ConductorEntry {
  id: string;
  wireSize: string;
  insulationType: InsulationTypeId;
  quantity: number;
  isCompact: boolean;
  areaSqIn: number;       // Area in sq inches (for both standards — converted)
  areaMm2: number;        // Area in mm²
}

export interface ConduitFillInput {
  standard: ConduitStandard;
  conduitType: ConduitTypeId;
  tradeSize: string;
  conductors: ConductorEntry[];
  isNipple: boolean;
  unitSystem: UnitSystem;
  projectName: string;
  projectRef: string;
}

export interface ConductorDetail {
  entryId: string;
  wireSize: string;
  insulationType: string;
  quantity: number;
  areaPerConductor: number;
  areaPerConductorMm2: number;
  totalArea: number;
  totalAreaMm2: number;
  percentOfFill: number;
  necTableRef: string;
}

export interface ConduitFillResult {
  conduitInternalArea: number;
  conduitInternalAreaMm2: number;
  totalConductorArea: number;
  totalConductorAreaMm2: number;
  fillPercentage: number;
  fillLimit: number;
  totalConductorCount: number;
  pass: boolean;
  remainingArea: number;
  remainingAreaMm2: number;
  utilizationRatio: number;
  conductorDetails: ConductorDetail[];
  necReferences: string[];
  minimumConduitSize: TradeSize | null;
  noConduitFits: boolean;
}

export interface ConduitFillHistoryEntry {
  id: string;
  timestamp: string;
  input: ConduitFillInput;
  result: ConduitFillResult;
  label: string;
}

export interface ConduitFillState extends ConduitFillInput {
  results: ConduitFillResult | null;
  history: ConduitFillHistoryEntry[];
}

export interface ConduitFillActions {
  setStandard: (std: ConduitStandard) => void;
  setConduitType: (type: ConduitTypeId) => void;
  setTradeSize: (size: string) => void;
  addConductor: (entry: Omit<ConductorEntry, 'id' | 'areaSqIn' | 'areaMm2'>) => void;
  updateConductor: (id: string, updates: Partial<ConductorEntry>) => void;
  removeConductor: (id: string) => void;
  setNipple: (isNipple: boolean) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setProjectName: (name: string) => void;
  setProjectRef: (ref: string) => void;
  setResults: (results: ConduitFillResult | null) => void;
  addToHistory: (entry: ConduitFillHistoryEntry) => void;
  loadFromHistory: (id: string) => void;
  clearHistory: () => void;
  reset: () => void;
}
