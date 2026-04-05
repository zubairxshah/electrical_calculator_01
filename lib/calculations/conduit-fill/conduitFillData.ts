// NEC 2020 Chapter 9 + IEC 61386 / BS 7671 — Conduit Fill Reference Data
// NEC: Tables 1, 4, 5, 5A, 8
// IEC: BS 7671 Appendix C, IEC 61386, BS EN 61534

import type {
  ConduitTypeId,
  ConduitTypeInfo,
  ConduitStandard,
  InsulationTypeId,
  InsulationTypeInfo,
  TradeSize,
  WireSizeInfo,
} from '@/types/conduit-fill';

const SQ_IN_TO_MM2 = 645.16;
const MM2_TO_SQ_IN = 1 / SQ_IN_TO_MM2;

// ─── Metadata ───────────────────────────────────────────────────────────────

export const CONDUIT_TYPES: ConduitTypeInfo[] = [
  // NEC conduit types
  { id: 'EMT', label: 'EMT - Electrical Metallic Tubing', standard: 'NEC', description: 'Thin-wall steel tubing, most common in commercial buildings' },
  { id: 'RMC', label: 'RMC - Rigid Metal Conduit', standard: 'NEC', description: 'Heavy-wall threaded steel, for hazardous and exposed locations' },
  { id: 'IMC', label: 'IMC - Intermediate Metal Conduit', standard: 'NEC', description: 'Medium-wall steel, lighter than RMC, threaded connections' },
  { id: 'PVC40', label: 'PVC Schedule 40', standard: 'NEC', description: 'Non-metallic plastic conduit, standard wall thickness' },
  { id: 'PVC80', label: 'PVC Schedule 80', standard: 'NEC', description: 'Non-metallic plastic conduit, heavy wall for exposed areas' },
  { id: 'FMC', label: 'FMC - Flexible Metal Conduit', standard: 'NEC', description: 'Spiral metal strip, for vibrating equipment connections' },
  { id: 'LFMC', label: 'LFMC - Liquidtight Flexible Metal', standard: 'NEC', description: 'Flexible metal with plastic jacket, for wet locations' },
  // IEC/BS EN conduit types
  { id: 'RIGID_PVC', label: 'Rigid PVC Conduit (BS EN 61386)', standard: 'IEC', description: 'Heavy gauge PVC, standard in UK/EU/international installations' },
  { id: 'RIGID_STEEL', label: 'Steel Conduit (BS EN 61386)', standard: 'IEC', description: 'Galvanised steel, threaded or plain ends' },
  { id: 'FLEXIBLE_PVC', label: 'Flexible PVC Conduit', standard: 'IEC', description: 'Corrugated PVC, for concealed wiring and partitions' },
  { id: 'FLEXIBLE_METAL', label: 'Flexible Metal Conduit', standard: 'IEC', description: 'Spiral steel for equipment connections and tight bends' },
  { id: 'CORRUGATED', label: 'Corrugated Conduit (ENT)', standard: 'IEC', description: 'Lightweight corrugated plastic, embedded in concrete/plaster' },
];

export const INSULATION_TYPES: InsulationTypeInfo[] = [
  // NEC insulation types
  { id: 'THHN', label: 'THHN/THWN-2', standard: 'NEC', necTable: 'NEC Ch.9 Table 5', description: 'Most common US building wire, 90°C dry' },
  { id: 'THWN', label: 'THWN', standard: 'NEC', necTable: 'NEC Ch.9 Table 5', description: '75°C wet/dry rated' },
  { id: 'THW', label: 'THW/THW-2', standard: 'NEC', necTable: 'NEC Ch.9 Table 5', description: 'Thermoplastic heat/moisture resistant' },
  { id: 'XHHW', label: 'XHHW', standard: 'NEC', necTable: 'NEC Ch.9 Table 5', description: 'Cross-linked polyethylene, 75°C wet / 90°C dry' },
  { id: 'XHHW2', label: 'XHHW-2', standard: 'NEC', necTable: 'NEC Ch.9 Table 5', description: 'Cross-linked polyethylene, 90°C wet and dry' },
  { id: 'RHH_RHW', label: 'RHH/RHW', standard: 'NEC', necTable: 'NEC Ch.9 Table 5', description: 'Rubber insulation, heat resistant' },
  { id: 'RHW2', label: 'RHW-2', standard: 'NEC', necTable: 'NEC Ch.9 Table 5', description: 'Rubber insulation, 90°C wet/dry' },
  { id: 'USE2', label: 'USE-2', standard: 'NEC', necTable: 'NEC Ch.9 Table 5', description: 'Underground service entrance cable' },
  { id: 'BARE', label: 'Bare Conductor', standard: 'NEC', necTable: 'NEC Ch.9 Table 8', description: 'Uninsulated grounding conductor' },
  // IEC/BS EN insulation types
  { id: 'PVC_V', label: 'PVC (V) 70°C', standard: 'IEC', necTable: 'BS 7671 Table C1', description: 'Standard PVC insulated cable, single core' },
  { id: 'PVC_V90', label: 'PVC (V-90) 90°C', standard: 'IEC', necTable: 'BS 7671 Table C1', description: 'High-temp PVC insulated cable' },
  { id: 'XLPE_X', label: 'XLPE (X) 90°C', standard: 'IEC', necTable: 'BS 7671 Table C1', description: 'Cross-linked polyethylene, preferred for new installations' },
  { id: 'EPR_R', label: 'EPR (R) 90°C', standard: 'IEC', necTable: 'BS 7671 Table C1', description: 'Ethylene propylene rubber, flexible' },
  { id: 'LSF', label: 'LSF/LSOH', standard: 'IEC', necTable: 'BS 7671 Table C1', description: 'Low smoke and fume / low smoke zero halogen' },
  { id: 'SWA', label: 'SWA (overall)', standard: 'IEC', necTable: 'BS 7671 Table C1', description: 'Steel wire armoured — uses overall cable diameter' },
  { id: 'BARE_IEC', label: 'Bare CPC', standard: 'IEC', necTable: 'BS 7671 Table 54.7', description: 'Bare circuit protective conductor' },
];

// NEC wire sizes
export const NEC_WIRE_SIZES: WireSizeInfo[] = [
  { id: '18', label: '#18 AWG', isKcmil: false, sortOrder: 1, standard: 'NEC' },
  { id: '16', label: '#16 AWG', isKcmil: false, sortOrder: 2, standard: 'NEC' },
  { id: '14', label: '#14 AWG', isKcmil: false, sortOrder: 3, standard: 'NEC' },
  { id: '12', label: '#12 AWG', isKcmil: false, sortOrder: 4, standard: 'NEC' },
  { id: '10', label: '#10 AWG', isKcmil: false, sortOrder: 5, standard: 'NEC' },
  { id: '8', label: '#8 AWG', isKcmil: false, sortOrder: 6, standard: 'NEC' },
  { id: '6', label: '#6 AWG', isKcmil: false, sortOrder: 7, standard: 'NEC' },
  { id: '4', label: '#4 AWG', isKcmil: false, sortOrder: 8, standard: 'NEC' },
  { id: '3', label: '#3 AWG', isKcmil: false, sortOrder: 9, standard: 'NEC' },
  { id: '2', label: '#2 AWG', isKcmil: false, sortOrder: 10, standard: 'NEC' },
  { id: '1', label: '#1 AWG', isKcmil: false, sortOrder: 11, standard: 'NEC' },
  { id: '1/0', label: '1/0 AWG', isKcmil: false, sortOrder: 12, standard: 'NEC' },
  { id: '2/0', label: '2/0 AWG', isKcmil: false, sortOrder: 13, standard: 'NEC' },
  { id: '3/0', label: '3/0 AWG', isKcmil: false, sortOrder: 14, standard: 'NEC' },
  { id: '4/0', label: '4/0 AWG', isKcmil: false, sortOrder: 15, standard: 'NEC' },
  { id: '250', label: '250 kcmil', isKcmil: true, sortOrder: 16, standard: 'NEC' },
  { id: '300', label: '300 kcmil', isKcmil: true, sortOrder: 17, standard: 'NEC' },
  { id: '350', label: '350 kcmil', isKcmil: true, sortOrder: 18, standard: 'NEC' },
  { id: '400', label: '400 kcmil', isKcmil: true, sortOrder: 19, standard: 'NEC' },
  { id: '500', label: '500 kcmil', isKcmil: true, sortOrder: 20, standard: 'NEC' },
  { id: '600', label: '600 kcmil', isKcmil: true, sortOrder: 21, standard: 'NEC' },
  { id: '700', label: '700 kcmil', isKcmil: true, sortOrder: 22, standard: 'NEC' },
  { id: '750', label: '750 kcmil', isKcmil: true, sortOrder: 23, standard: 'NEC' },
  { id: '800', label: '800 kcmil', isKcmil: true, sortOrder: 24, standard: 'NEC' },
  { id: '900', label: '900 kcmil', isKcmil: true, sortOrder: 25, standard: 'NEC' },
  { id: '1000', label: '1000 kcmil', isKcmil: true, sortOrder: 26, standard: 'NEC' },
  { id: '1250', label: '1250 kcmil', isKcmil: true, sortOrder: 27, standard: 'NEC' },
  { id: '1500', label: '1500 kcmil', isKcmil: true, sortOrder: 28, standard: 'NEC' },
  { id: '1750', label: '1750 kcmil', isKcmil: true, sortOrder: 29, standard: 'NEC' },
  { id: '2000', label: '2000 kcmil', isKcmil: true, sortOrder: 30, standard: 'NEC' },
];

// IEC wire sizes (mm²)
export const IEC_WIRE_SIZES: WireSizeInfo[] = [
  { id: '1', label: '1 mm²', isKcmil: false, sortOrder: 1, standard: 'IEC' },
  { id: '1.5', label: '1.5 mm²', isKcmil: false, sortOrder: 2, standard: 'IEC' },
  { id: '2.5', label: '2.5 mm²', isKcmil: false, sortOrder: 3, standard: 'IEC' },
  { id: '4', label: '4 mm²', isKcmil: false, sortOrder: 4, standard: 'IEC' },
  { id: '6', label: '6 mm²', isKcmil: false, sortOrder: 5, standard: 'IEC' },
  { id: '10', label: '10 mm²', isKcmil: false, sortOrder: 6, standard: 'IEC' },
  { id: '16', label: '16 mm²', isKcmil: false, sortOrder: 7, standard: 'IEC' },
  { id: '25', label: '25 mm²', isKcmil: false, sortOrder: 8, standard: 'IEC' },
  { id: '35', label: '35 mm²', isKcmil: false, sortOrder: 9, standard: 'IEC' },
  { id: '50', label: '50 mm²', isKcmil: false, sortOrder: 10, standard: 'IEC' },
  { id: '70', label: '70 mm²', isKcmil: false, sortOrder: 11, standard: 'IEC' },
  { id: '95', label: '95 mm²', isKcmil: false, sortOrder: 12, standard: 'IEC' },
  { id: '120', label: '120 mm²', isKcmil: false, sortOrder: 13, standard: 'IEC' },
  { id: '150', label: '150 mm²', isKcmil: false, sortOrder: 14, standard: 'IEC' },
  { id: '185', label: '185 mm²', isKcmil: false, sortOrder: 15, standard: 'IEC' },
  { id: '240', label: '240 mm²', isKcmil: false, sortOrder: 16, standard: 'IEC' },
  { id: '300', label: '300 mm²', isKcmil: false, sortOrder: 17, standard: 'IEC' },
  { id: '400', label: '400 mm²', isKcmil: false, sortOrder: 18, standard: 'IEC' },
  { id: '500', label: '500 mm²', isKcmil: false, sortOrder: 19, standard: 'IEC' },
  { id: '630', label: '630 mm²', isKcmil: false, sortOrder: 20, standard: 'IEC' },
];

// Backwards-compatible export
export const WIRE_SIZES = NEC_WIRE_SIZES;

// ─── Helper: get standard-specific lists ────────────────────────────────────

export function getConduitTypesForStandard(standard: ConduitStandard): ConduitTypeInfo[] {
  return CONDUIT_TYPES.filter(t => t.standard === standard);
}

export function getInsulationTypesForStandard(standard: ConduitStandard): InsulationTypeInfo[] {
  return INSULATION_TYPES.filter(t => t.standard === standard);
}

export function getWireSizesForStandard(standard: ConduitStandard): WireSizeInfo[] {
  return standard === 'NEC' ? NEC_WIRE_SIZES : IEC_WIRE_SIZES;
}

// ─── NEC Table 1: Fill Percentage Limits ────────────────────────────────────

export function getFillLimit(conductorCount: number, isNipple: boolean, standard: ConduitStandard = 'NEC'): number {
  if (standard === 'IEC') {
    // BS 7671 / IEC 60364 — space factor 45% for straight runs
    // Reduced to 35% when bends present (we use 45% as default, nipple = 55%)
    return isNipple ? 55 : 45;
  }
  // NEC Table 1
  if (isNipple) return 60;
  if (conductorCount === 1) return 53;
  if (conductorCount === 2) return 31;
  return 40;
}

// ─── NEC Table 4: Conduit Internal Areas (in²) ─────────────────────────────

type ConduitAreaTable = Record<string, number>;

const TABLE_4: Record<string, ConduitAreaTable> = {
  EMT: {
    '1/2': 0.304, '3/4': 0.533, '1': 0.864, '1-1/4': 1.496,
    '1-1/2': 2.036, '2': 3.356, '2-1/2': 5.858, '3': 8.846,
    '3-1/2': 11.545, '4': 12.723,
  },
  RMC: {
    '1/2': 0.314, '3/4': 0.533, '1': 0.916, '1-1/4': 1.526,
    '1-1/2': 2.071, '2': 3.408, '2-1/2': 4.866, '3': 7.499,
    '3-1/2': 9.521, '4': 12.882, '5': 20.212, '6': 29.158,
  },
  IMC: {
    '1/2': 0.342, '3/4': 0.586, '1': 1.000, '1-1/4': 1.647,
    '1-1/2': 2.225, '2': 3.630, '2-1/2': 5.135, '3': 7.922,
    '3-1/2': 10.584, '4': 13.631,
  },
  PVC40: {
    '1/2': 0.285, '3/4': 0.508, '1': 0.916, '1-1/4': 1.534,
    '1-1/2': 2.045, '2': 3.291, '2-1/2': 4.695, '3': 7.268,
    '3-1/2': 9.737, '4': 12.554, '5': 19.761, '6': 28.567,
  },
  PVC80: {
    '1/2': 0.217, '3/4': 0.409, '1': 0.778, '1-1/4': 1.316,
    '1-1/2': 1.766, '2': 2.874, '2-1/2': 4.119, '3': 6.442,
    '3-1/2': 8.688, '4': 11.258, '5': 17.855, '6': 25.598,
  },
  FMC: {
    '3/8': 0.116, '1/2': 0.317, '3/4': 0.533, '1': 0.817,
    '1-1/4': 1.277, '1-1/2': 1.858, '2': 3.269, '2-1/2': 4.909,
    '3': 7.475, '3-1/2': 9.731, '4': 12.692,
  },
  LFMC: {
    '3/8': 0.077, '1/2': 0.196, '3/4': 0.385, '1': 0.614,
    '1-1/4': 1.040, '1-1/2': 1.496, '2': 2.577, '2-1/2': 3.886,
    '3': 6.045, '3-1/2': 7.845, '4': 10.010,
  },
};

// ─── IEC Conduit Internal Areas ─────────────────────────────────────────────
// Based on BS EN 61386 / IEC 61386 standard metric conduit sizes
// Internal diameters (mm) → areas (mm²)

interface IECConduitEntry {
  nominalMm: number;   // Nominal size (e.g., 20, 25, 32)
  internalDiaMm: number; // Internal diameter
  internalAreaMm2: number;
}

const IEC_CONDUIT_DATA: Record<string, IECConduitEntry[]> = {
  RIGID_PVC: [
    { nominalMm: 16, internalDiaMm: 13.5, internalAreaMm2: 143.1 },
    { nominalMm: 20, internalDiaMm: 17.1, internalAreaMm2: 229.7 },
    { nominalMm: 25, internalDiaMm: 21.2, internalAreaMm2: 353.0 },
    { nominalMm: 32, internalDiaMm: 27.0, internalAreaMm2: 572.6 },
    { nominalMm: 40, internalDiaMm: 34.0, internalAreaMm2: 907.9 },
    { nominalMm: 50, internalDiaMm: 42.7, internalAreaMm2: 1431.7 },
    { nominalMm: 63, internalDiaMm: 54.0, internalAreaMm2: 2290.2 },
  ],
  RIGID_STEEL: [
    { nominalMm: 16, internalDiaMm: 15.8, internalAreaMm2: 196.1 },
    { nominalMm: 20, internalDiaMm: 20.0, internalAreaMm2: 314.2 },
    { nominalMm: 25, internalDiaMm: 25.0, internalAreaMm2: 490.9 },
    { nominalMm: 32, internalDiaMm: 31.6, internalAreaMm2: 784.3 },
    { nominalMm: 40, internalDiaMm: 38.4, internalAreaMm2: 1158.2 },
    { nominalMm: 50, internalDiaMm: 50.6, internalAreaMm2: 2010.7 },
    { nominalMm: 63, internalDiaMm: 63.0, internalAreaMm2: 3117.2 },
  ],
  FLEXIBLE_PVC: [
    { nominalMm: 16, internalDiaMm: 12.6, internalAreaMm2: 124.7 },
    { nominalMm: 20, internalDiaMm: 15.8, internalAreaMm2: 196.1 },
    { nominalMm: 25, internalDiaMm: 20.0, internalAreaMm2: 314.2 },
    { nominalMm: 32, internalDiaMm: 25.4, internalAreaMm2: 506.7 },
    { nominalMm: 40, internalDiaMm: 32.0, internalAreaMm2: 804.2 },
    { nominalMm: 50, internalDiaMm: 40.0, internalAreaMm2: 1256.6 },
  ],
  FLEXIBLE_METAL: [
    { nominalMm: 16, internalDiaMm: 12.0, internalAreaMm2: 113.1 },
    { nominalMm: 20, internalDiaMm: 15.0, internalAreaMm2: 176.7 },
    { nominalMm: 25, internalDiaMm: 19.5, internalAreaMm2: 298.6 },
    { nominalMm: 32, internalDiaMm: 24.5, internalAreaMm2: 471.4 },
    { nominalMm: 40, internalDiaMm: 31.0, internalAreaMm2: 754.8 },
    { nominalMm: 50, internalDiaMm: 39.0, internalAreaMm2: 1194.6 },
  ],
  CORRUGATED: [
    { nominalMm: 16, internalDiaMm: 11.7, internalAreaMm2: 107.5 },
    { nominalMm: 20, internalDiaMm: 14.1, internalAreaMm2: 156.1 },
    { nominalMm: 25, internalDiaMm: 18.3, internalAreaMm2: 263.0 },
    { nominalMm: 32, internalDiaMm: 24.3, internalAreaMm2: 463.8 },
    { nominalMm: 40, internalDiaMm: 30.2, internalAreaMm2: 716.3 },
    { nominalMm: 50, internalDiaMm: 38.0, internalAreaMm2: 1134.1 },
    { nominalMm: 63, internalDiaMm: 49.0, internalAreaMm2: 1885.7 },
  ],
};

// ─── NEC Table 5: Conductor Cross-Sectional Areas (in²) ────────────────────

type ConductorAreaTable = Record<string, number>;

const TABLE_5_THHN: ConductorAreaTable = {
  '18': 0.0040, '16': 0.0058, '14': 0.0097, '12': 0.0133, '10': 0.0211,
  '8': 0.0366, '6': 0.0507, '4': 0.0824, '3': 0.0973, '2': 0.1158,
  '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679, '4/0': 0.3237,
  '250': 0.3970, '300': 0.4608, '350': 0.5242, '400': 0.5863, '500': 0.7073,
  '600': 0.8676, '700': 0.9887, '750': 1.0496, '800': 1.1085,
  '900': 1.2272, '1000': 1.3478,
};

const TABLE_5_THWN: ConductorAreaTable = { ...TABLE_5_THHN };

const TABLE_5_THW: ConductorAreaTable = {
  '14': 0.0139, '12': 0.0181, '10': 0.0243,
  '8': 0.0437, '6': 0.0726, '4': 0.1087, '3': 0.1263, '2': 0.1473,
  '1': 0.1901, '1/0': 0.2223, '2/0': 0.2624, '3/0': 0.3117, '4/0': 0.3718,
  '250': 0.4536, '300': 0.5242, '350': 0.5958, '400': 0.6619, '500': 0.7901,
  '600': 0.9676, '700': 1.1010, '750': 1.1652, '800': 1.2272,
  '900': 1.3561, '1000': 1.4784, '1250': 1.8602, '1500': 2.2302,
  '1750': 2.5804, '2000': 2.9578,
};

const TABLE_5_XHHW: ConductorAreaTable = {
  '14': 0.0097, '12': 0.0133, '10': 0.0211,
  '8': 0.0366, '6': 0.0507, '4': 0.0824, '3': 0.0973, '2': 0.1158,
  '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679, '4/0': 0.3237,
  '250': 0.3970, '300': 0.4608, '350': 0.5242, '400': 0.5863, '500': 0.7073,
  '600': 0.8676, '700': 0.9887, '750': 1.0496, '800': 1.1085,
  '900': 1.2272, '1000': 1.3478, '1250': 1.7180, '1500': 2.0660,
  '1750': 2.3966, '2000': 2.7483,
};

const TABLE_5_RHH_RHW: ConductorAreaTable = {
  '14': 0.0209, '12': 0.0260, '10': 0.0333,
  '8': 0.0556, '6': 0.0726, '4': 0.1087, '3': 0.1263, '2': 0.1473,
  '1': 0.1901, '1/0': 0.2223, '2/0': 0.2624, '3/0': 0.3117, '4/0': 0.3718,
  '250': 0.4536, '300': 0.5242, '350': 0.5958, '400': 0.6619, '500': 0.7901,
  '600': 0.9676, '700': 1.1010, '750': 1.1652, '800': 1.2272,
  '900': 1.3561, '1000': 1.4784, '1250': 1.8602, '1500': 2.2302,
  '1750': 2.5804, '2000': 2.9578,
};

const TABLE_5: Record<string, ConductorAreaTable> = {
  THHN: TABLE_5_THHN,
  THWN: TABLE_5_THWN,
  THW: TABLE_5_THW,
  XHHW: TABLE_5_XHHW,
  XHHW2: { ...TABLE_5_XHHW },
  RHH_RHW: TABLE_5_RHH_RHW,
  RHW2: { ...TABLE_5_RHH_RHW },
  USE2: { ...TABLE_5_THW },
};

// NEC Table 5A: Compact Conductor Areas (in²)
const TABLE_5A_THHN: ConductorAreaTable = {
  '8': 0.0300, '6': 0.0430, '4': 0.0680, '2': 0.0980,
  '1': 0.1260, '1/0': 0.1530, '2/0': 0.1855, '3/0': 0.2290, '4/0': 0.2780,
  '250': 0.3380, '300': 0.3970, '350': 0.4536, '400': 0.5090, '500': 0.6291,
  '600': 0.7620, '700': 0.8825, '750': 0.9400, '800': 0.9985,
  '900': 1.1140, '1000': 1.2135,
};

const TABLE_5A: Record<string, ConductorAreaTable> = {
  THHN: TABLE_5A_THHN,
  XHHW: { ...TABLE_5A_THHN },
  XHHW2: { ...TABLE_5A_THHN },
};

// NEC Table 8: Bare Conductor Areas (in²)
const TABLE_8_BARE: ConductorAreaTable = {
  '18': 0.0013, '16': 0.0021, '14': 0.0033, '12': 0.0052, '10': 0.0082,
  '8': 0.0131, '6': 0.0270, '4': 0.0424, '3': 0.0530, '2': 0.0670,
  '1': 0.0845, '1/0': 0.1064, '2/0': 0.1342, '3/0': 0.1692, '4/0': 0.2133,
  '250': 0.2600, '300': 0.3120, '350': 0.3640, '400': 0.4160, '500': 0.5200,
  '600': 0.6260, '700': 0.7300, '750': 0.7820, '800': 0.8340,
  '900': 0.9360, '1000': 1.0390, '1250': 1.2960, '1500': 1.5580,
  '1750': 1.8110, '2000': 2.0740,
};

// ─── IEC Cable Overall Areas (mm²) — single core in conduit ────────────────
// Based on BS 7671 Appendix C / manufacturer data
// These are OVERALL cross-sectional areas including insulation

const IEC_CABLE_AREAS_MM2: Record<string, ConductorAreaTable> = {
  PVC_V: {
    '1': 8.6, '1.5': 10.2, '2.5': 14.5, '4': 19.6, '6': 26.4,
    '10': 39.6, '16': 58.1, '25': 95.0, '35': 126.7, '50': 176.7,
    '70': 254.5, '95': 346.4, '120': 452.4, '150': 530.9, '185': 660.5,
    '240': 855.3, '300': 1075.2, '400': 1385.4, '500': 1734.9,
  },
  PVC_V90: {
    '1': 9.1, '1.5': 10.8, '2.5': 15.2, '4': 20.4, '6': 27.3,
    '10': 41.9, '16': 61.4, '25': 100.3, '35': 133.0, '50': 185.1,
    '70': 265.9, '95': 363.1, '120': 471.4, '150': 556.0, '185': 690.8,
    '240': 895.0, '300': 1122.7, '400': 1452.2, '500': 1809.6,
  },
  XLPE_X: {
    '1': 7.1, '1.5': 8.6, '2.5': 12.6, '4': 17.3, '6': 22.9,
    '10': 36.3, '16': 52.8, '25': 84.9, '35': 113.1, '50': 153.9,
    '70': 227.0, '95': 314.2, '120': 397.6, '150': 471.4, '185': 594.0,
    '240': 774.4, '300': 962.1, '400': 1256.6, '500': 1590.4,
  },
  EPR_R: {
    '1': 8.0, '1.5': 9.6, '2.5': 13.9, '4': 18.9, '6': 25.5,
    '10': 38.5, '16': 56.7, '25': 91.6, '35': 122.7, '50': 167.4,
    '70': 240.5, '95': 330.1, '120': 415.5, '150': 491.0, '185': 616.0,
    '240': 804.2, '300': 1017.9, '400': 1320.3, '500': 1661.9,
  },
  LSF: {
    '1': 8.3, '1.5': 9.9, '2.5': 14.2, '4': 19.2, '6': 25.9,
    '10': 39.1, '16': 57.4, '25': 92.9, '35': 124.7, '50': 170.9,
    '70': 245.0, '95': 337.0, '120': 427.0, '150': 503.0, '185': 633.0,
    '240': 826.0, '300': 1041.0, '400': 1353.0, '500': 1701.0,
  },
  SWA: {
    '1.5': 38.5, '2.5': 47.8, '4': 56.7, '6': 72.4,
    '10': 100.3, '16': 137.9, '25': 201.1, '35': 254.5, '50': 326.9,
    '70': 437.4, '95': 573.0, '120': 707.0, '150': 813.0, '185': 993.0,
    '240': 1257.0, '300': 1521.0, '400': 1924.0, '500': 2376.0,
  },
  BARE_IEC: {
    '1': 1.0, '1.5': 1.5, '2.5': 2.5, '4': 4.0, '6': 6.0,
    '10': 10.0, '16': 16.0, '25': 25.0, '35': 35.0, '50': 50.0,
    '70': 70.0, '95': 95.0, '120': 120.0, '150': 150.0, '185': 185.0,
    '240': 240.0, '300': 300.0, '400': 400.0, '500': 500.0,
  },
};

// ─── Lookup Functions ───────────────────────────────────────────────────────

export function getConduitArea(conduitType: ConduitTypeId, tradeSize: string): number {
  // NEC conduit types — return in²
  const necTable = TABLE_4[conduitType];
  if (necTable) {
    const area = necTable[tradeSize];
    if (area === undefined) {
      throw new Error(`Trade size ${tradeSize}" not available for ${conduitType}`);
    }
    return area;
  }

  // IEC conduit types — stored in mm², convert to in²
  const iecData = IEC_CONDUIT_DATA[conduitType];
  if (iecData) {
    const entry = iecData.find(e => String(e.nominalMm) === tradeSize);
    if (!entry) {
      throw new Error(`Size ${tradeSize}mm not available for ${conduitType}`);
    }
    return entry.internalAreaMm2 * MM2_TO_SQ_IN;
  }

  throw new Error(`Invalid conduit type: ${conduitType}`);
}

export function getConduitAreaMm2(conduitType: ConduitTypeId, tradeSize: string): number {
  // IEC — direct mm²
  const iecData = IEC_CONDUIT_DATA[conduitType];
  if (iecData) {
    const entry = iecData.find(e => String(e.nominalMm) === tradeSize);
    if (!entry) throw new Error(`Size ${tradeSize}mm not available for ${conduitType}`);
    return entry.internalAreaMm2;
  }
  // NEC — convert
  return getConduitArea(conduitType, tradeSize) * SQ_IN_TO_MM2;
}

export function getConductorArea(
  wireSize: string,
  insulationType: InsulationTypeId,
  isCompact: boolean
): number {
  // NEC Bare — Table 8
  if (insulationType === 'BARE') {
    const area = TABLE_8_BARE[wireSize];
    if (area === undefined) throw new Error(`Bare conductor area not found for size ${wireSize}`);
    return area;
  }

  // IEC types — stored in mm², convert to in²
  const iecTable = IEC_CABLE_AREAS_MM2[insulationType];
  if (iecTable) {
    const areaMm2 = iecTable[wireSize];
    if (areaMm2 === undefined) throw new Error(`Cable area not found for ${insulationType} ${wireSize} mm²`);
    return areaMm2 * MM2_TO_SQ_IN;
  }

  // NEC Compact — Table 5A
  if (isCompact) {
    const compactTable = TABLE_5A[insulationType];
    if (!compactTable) throw new Error(`Compact data not available for ${insulationType}`);
    const area = compactTable[wireSize];
    if (area === undefined) throw new Error(`Compact area not found for ${insulationType} ${wireSize}`);
    return area;
  }

  // NEC Standard — Table 5
  const table = TABLE_5[insulationType];
  if (!table) throw new Error(`Invalid insulation type: ${insulationType}`);
  const area = table[wireSize];
  if (area === undefined) throw new Error(`Conductor area not found for ${insulationType} ${wireSize}`);
  return area;
}

export function getConductorAreaMm2(
  wireSize: string,
  insulationType: InsulationTypeId,
  isCompact: boolean
): number {
  // IEC types — direct mm²
  const iecTable = IEC_CABLE_AREAS_MM2[insulationType];
  if (iecTable) {
    const areaMm2 = iecTable[wireSize];
    if (areaMm2 === undefined) throw new Error(`Cable area not found for ${insulationType} ${wireSize} mm²`);
    return areaMm2;
  }
  if (insulationType === 'BARE_IEC') {
    const table = IEC_CABLE_AREAS_MM2['BARE_IEC'];
    const a = table?.[wireSize];
    if (a === undefined) throw new Error(`Bare IEC conductor not found for ${wireSize} mm²`);
    return a;
  }
  // NEC — convert
  return getConductorArea(wireSize, insulationType, isCompact) * SQ_IN_TO_MM2;
}

export function getAvailableTradeSizes(conduitType: ConduitTypeId): TradeSize[] {
  const necMetricMap: Record<string, number> = {
    '3/8': 12, '1/2': 16, '3/4': 21, '1': 27, '1-1/4': 35, '1-1/2': 41,
    '2': 53, '2-1/2': 63, '3': 78, '3-1/2': 91, '4': 103, '5': 129, '6': 155,
  };

  // NEC conduit types
  const necTable = TABLE_4[conduitType];
  if (necTable) {
    return Object.entries(necTable)
      .map(([imperial, area]) => ({
        imperial,
        metric: necMetricMap[imperial] ?? 0,
        internalAreaSqIn: area,
        internalAreaMm2: area * SQ_IN_TO_MM2,
      }))
      .sort((a, b) => a.internalAreaSqIn - b.internalAreaSqIn);
  }

  // IEC conduit types
  const iecData = IEC_CONDUIT_DATA[conduitType];
  if (iecData) {
    return iecData.map(e => ({
      imperial: String(e.nominalMm),
      metric: e.nominalMm,
      metricLabel: `${e.nominalMm}mm`,
      internalAreaSqIn: e.internalAreaMm2 * MM2_TO_SQ_IN,
      internalAreaMm2: e.internalAreaMm2,
      internalDiameterMm: e.internalDiaMm,
    })).sort((a, b) => a.internalAreaMm2 - b.internalAreaMm2);
  }

  throw new Error(`Invalid conduit type: ${conduitType}`);
}

export function hasCompactData(insulationType: InsulationTypeId, wireSize: string): boolean {
  if (insulationType === 'BARE' || insulationType === 'BARE_IEC') return false;
  const table = TABLE_5A[insulationType];
  if (!table) return false;
  return wireSize in table;
}

export function isIECInsulation(insulationType: InsulationTypeId): boolean {
  return insulationType in IEC_CABLE_AREAS_MM2;
}
