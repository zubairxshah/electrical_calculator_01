// Conduit/Raceway Fill Calculator — NEC Chapter 9
// Types for conduit fill compliance calculations

export type ConduitTypeId = 'EMT' | 'RMC' | 'IMC' | 'PVC40' | 'PVC80' | 'FMC' | 'LFMC';

export type InsulationTypeId =
  | 'THHN'
  | 'THWN'
  | 'THW'
  | 'XHHW'
  | 'XHHW2'
  | 'RHH_RHW'
  | 'RHW2'
  | 'USE2'
  | 'BARE';

export type UnitSystem = 'imperial' | 'metric';

export interface ConduitTypeInfo {
  id: ConduitTypeId;
  label: string;
}

export interface TradeSize {
  imperial: string;      // e.g., "3/4", "1-1/2"
  metric: number;        // e.g., 21, 41
  internalAreaSqIn: number; // NEC Table 4
}

export interface InsulationTypeInfo {
  id: InsulationTypeId;
  label: string;
  necTable: string;      // "Table 5", "Table 5A", "Table 8"
}

export interface WireSizeInfo {
  id: string;            // e.g., "12", "4/0", "250"
  label: string;         // e.g., "#12 AWG", "4/0 AWG", "250 kcmil"
  isKcmil: boolean;
  sortOrder: number;
}

export interface ConductorEntry {
  id: string;
  wireSize: string;
  insulationType: InsulationTypeId;
  quantity: number;
  isCompact: boolean;
  areaSqIn: number;      // looked up from NEC tables
}

export interface ConduitFillInput {
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
  totalArea: number;
  percentOfFill: number;
  necTableRef: string;
}

export interface ConduitFillResult {
  conduitInternalArea: number;
  totalConductorArea: number;
  fillPercentage: number;
  fillLimit: number;
  totalConductorCount: number;
  pass: boolean;
  remainingArea: number;
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
  setConduitType: (type: ConduitTypeId) => void;
  setTradeSize: (size: string) => void;
  addConductor: (entry: Omit<ConductorEntry, 'id' | 'areaSqIn'>) => void;
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
