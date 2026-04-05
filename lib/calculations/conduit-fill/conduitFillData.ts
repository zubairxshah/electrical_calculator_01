// NEC 2020 Chapter 9 — Conduit Fill Reference Data
// Tables 1, 4, 5, 5A, 8

import type {
  ConduitTypeId,
  ConduitTypeInfo,
  InsulationTypeId,
  InsulationTypeInfo,
  TradeSize,
  WireSizeInfo,
} from '@/types/conduit-fill';

// ─── Metadata ───────────────────────────────────────────────────────────────

export const CONDUIT_TYPES: ConduitTypeInfo[] = [
  { id: 'EMT', label: 'EMT - Electrical Metallic Tubing' },
  { id: 'RMC', label: 'RMC - Rigid Metal Conduit' },
  { id: 'IMC', label: 'IMC - Intermediate Metal Conduit' },
  { id: 'PVC40', label: 'PVC Schedule 40' },
  { id: 'PVC80', label: 'PVC Schedule 80' },
  { id: 'FMC', label: 'FMC - Flexible Metal Conduit' },
  { id: 'LFMC', label: 'LFMC - Liquidtight Flexible Metal' },
];

export const INSULATION_TYPES: InsulationTypeInfo[] = [
  { id: 'THHN', label: 'THHN/THWN-2', necTable: 'Table 5' },
  { id: 'THWN', label: 'THWN', necTable: 'Table 5' },
  { id: 'THW', label: 'THW/THW-2', necTable: 'Table 5' },
  { id: 'XHHW', label: 'XHHW', necTable: 'Table 5' },
  { id: 'XHHW2', label: 'XHHW-2', necTable: 'Table 5' },
  { id: 'RHH_RHW', label: 'RHH/RHW', necTable: 'Table 5' },
  { id: 'RHW2', label: 'RHW-2', necTable: 'Table 5' },
  { id: 'USE2', label: 'USE-2', necTable: 'Table 5' },
  { id: 'BARE', label: 'Bare Conductor', necTable: 'Table 8' },
];

export const WIRE_SIZES: WireSizeInfo[] = [
  { id: '18', label: '#18 AWG', isKcmil: false, sortOrder: 1 },
  { id: '16', label: '#16 AWG', isKcmil: false, sortOrder: 2 },
  { id: '14', label: '#14 AWG', isKcmil: false, sortOrder: 3 },
  { id: '12', label: '#12 AWG', isKcmil: false, sortOrder: 4 },
  { id: '10', label: '#10 AWG', isKcmil: false, sortOrder: 5 },
  { id: '8', label: '#8 AWG', isKcmil: false, sortOrder: 6 },
  { id: '6', label: '#6 AWG', isKcmil: false, sortOrder: 7 },
  { id: '4', label: '#4 AWG', isKcmil: false, sortOrder: 8 },
  { id: '3', label: '#3 AWG', isKcmil: false, sortOrder: 9 },
  { id: '2', label: '#2 AWG', isKcmil: false, sortOrder: 10 },
  { id: '1', label: '#1 AWG', isKcmil: false, sortOrder: 11 },
  { id: '1/0', label: '1/0 AWG', isKcmil: false, sortOrder: 12 },
  { id: '2/0', label: '2/0 AWG', isKcmil: false, sortOrder: 13 },
  { id: '3/0', label: '3/0 AWG', isKcmil: false, sortOrder: 14 },
  { id: '4/0', label: '4/0 AWG', isKcmil: false, sortOrder: 15 },
  { id: '250', label: '250 kcmil', isKcmil: true, sortOrder: 16 },
  { id: '300', label: '300 kcmil', isKcmil: true, sortOrder: 17 },
  { id: '350', label: '350 kcmil', isKcmil: true, sortOrder: 18 },
  { id: '400', label: '400 kcmil', isKcmil: true, sortOrder: 19 },
  { id: '500', label: '500 kcmil', isKcmil: true, sortOrder: 20 },
  { id: '600', label: '600 kcmil', isKcmil: true, sortOrder: 21 },
  { id: '700', label: '700 kcmil', isKcmil: true, sortOrder: 22 },
  { id: '750', label: '750 kcmil', isKcmil: true, sortOrder: 23 },
  { id: '800', label: '800 kcmil', isKcmil: true, sortOrder: 24 },
  { id: '900', label: '900 kcmil', isKcmil: true, sortOrder: 25 },
  { id: '1000', label: '1000 kcmil', isKcmil: true, sortOrder: 26 },
  { id: '1250', label: '1250 kcmil', isKcmil: true, sortOrder: 27 },
  { id: '1500', label: '1500 kcmil', isKcmil: true, sortOrder: 28 },
  { id: '1750', label: '1750 kcmil', isKcmil: true, sortOrder: 29 },
  { id: '2000', label: '2000 kcmil', isKcmil: true, sortOrder: 30 },
];

// ─── NEC Table 1: Fill Percentage Limits ────────────────────────────────────

export function getFillLimit(conductorCount: number, isNipple: boolean): number {
  if (isNipple) return 60;
  if (conductorCount === 1) return 53;
  if (conductorCount === 2) return 31;
  return 40;
}

// ─── NEC Table 4: Conduit Internal Areas (in²) ─────────────────────────────
// Source: NEC 2020 Chapter 9 Table 4

type ConduitAreaTable = Record<string, number>;

const TABLE_4: Record<ConduitTypeId, ConduitAreaTable> = {
  EMT: {
    '1/2': 0.304,
    '3/4': 0.533,
    '1': 0.864,
    '1-1/4': 1.496,
    '1-1/2': 2.036,
    '2': 3.356,
    '2-1/2': 5.858,
    '3': 8.846,
    '3-1/2': 11.545,
    '4': 12.723,
  },
  RMC: {
    '1/2': 0.314,
    '3/4': 0.533,
    '1': 0.916,
    '1-1/4': 1.526,
    '1-1/2': 2.071,
    '2': 3.408,
    '2-1/2': 4.866,
    '3': 7.499,
    '3-1/2': 9.521,
    '4': 12.882,
    '5': 20.212,
    '6': 29.158,
  },
  IMC: {
    '1/2': 0.342,
    '3/4': 0.586,
    '1': 1.000,
    '1-1/4': 1.647,
    '1-1/2': 2.225,
    '2': 3.630,
    '2-1/2': 5.135,
    '3': 7.922,
    '3-1/2': 10.584,
    '4': 13.631,
  },
  PVC40: {
    '1/2': 0.285,
    '3/4': 0.508,
    '1': 0.916,
    '1-1/4': 1.534,
    '1-1/2': 2.045,
    '2': 3.291,
    '2-1/2': 4.695,
    '3': 7.268,
    '3-1/2': 9.737,
    '4': 12.554,
    '5': 19.761,
    '6': 28.567,
  },
  PVC80: {
    '1/2': 0.217,
    '3/4': 0.409,
    '1': 0.778,
    '1-1/4': 1.316,
    '1-1/2': 1.766,
    '2': 2.874,
    '2-1/2': 4.119,
    '3': 6.442,
    '3-1/2': 8.688,
    '4': 11.258,
    '5': 17.855,
    '6': 25.598,
  },
  FMC: {
    '3/8': 0.116,
    '1/2': 0.317,
    '3/4': 0.533,
    '1': 0.817,
    '1-1/4': 1.277,
    '1-1/2': 1.858,
    '2': 3.269,
    '2-1/2': 4.909,
    '3': 7.475,
    '3-1/2': 9.731,
    '4': 12.692,
  },
  LFMC: {
    '3/8': 0.077,
    '1/2': 0.196,
    '3/4': 0.385,
    '1': 0.614,
    '1-1/4': 1.040,
    '1-1/2': 1.496,
    '2': 2.577,
    '2-1/2': 3.886,
    '3': 6.045,
    '3-1/2': 7.845,
    '4': 10.010,
  },
};

// ─── NEC Table 5: Conductor Cross-Sectional Areas (in²) ────────────────────
// Source: NEC 2020 Chapter 9 Table 5
// Keyed by insulation type → wire size → area in sq inches

type ConductorAreaTable = Record<string, number>;

// THHN/THWN-2 — most common building wire
const TABLE_5_THHN: ConductorAreaTable = {
  '18': 0.0040, '16': 0.0058, '14': 0.0097, '12': 0.0133, '10': 0.0211,
  '8': 0.0366, '6': 0.0507, '4': 0.0824, '3': 0.0973, '2': 0.1158,
  '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679, '4/0': 0.3237,
  '250': 0.3970, '300': 0.4608, '350': 0.5242, '400': 0.5863, '500': 0.7073,
  '600': 0.8676, '700': 0.9887, '750': 1.0496, '800': 1.1085,
  '900': 1.2272, '1000': 1.3478,
};

// THWN — similar to THHN but different for some sizes
const TABLE_5_THWN: ConductorAreaTable = {
  '14': 0.0097, '12': 0.0133, '10': 0.0211,
  '8': 0.0366, '6': 0.0507, '4': 0.0824, '3': 0.0973, '2': 0.1158,
  '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679, '4/0': 0.3237,
  '250': 0.3970, '300': 0.4608, '350': 0.5242, '400': 0.5863, '500': 0.7073,
  '600': 0.8676, '700': 0.9887, '750': 1.0496, '800': 1.1085,
  '900': 1.2272, '1000': 1.3478,
};

// THW/THW-2 — larger insulation
const TABLE_5_THW: ConductorAreaTable = {
  '14': 0.0139, '12': 0.0181, '10': 0.0243,
  '8': 0.0437, '6': 0.0726, '4': 0.1087, '3': 0.1263, '2': 0.1473,
  '1': 0.1901, '1/0': 0.2223, '2/0': 0.2624, '3/0': 0.3117, '4/0': 0.3718,
  '250': 0.4536, '300': 0.5242, '350': 0.5958, '400': 0.6619, '500': 0.7901,
  '600': 0.9676, '700': 1.1010, '750': 1.1652, '800': 1.2272,
  '900': 1.3561, '1000': 1.4784, '1250': 1.8602, '1500': 2.2302,
  '1750': 2.5804, '2000': 2.9578,
};

// XHHW — same as THHN for most sizes
const TABLE_5_XHHW: ConductorAreaTable = {
  '14': 0.0097, '12': 0.0133, '10': 0.0211,
  '8': 0.0366, '6': 0.0507, '4': 0.0824, '3': 0.0973, '2': 0.1158,
  '1': 0.1562, '1/0': 0.1855, '2/0': 0.2223, '3/0': 0.2679, '4/0': 0.3237,
  '250': 0.3970, '300': 0.4608, '350': 0.5242, '400': 0.5863, '500': 0.7073,
  '600': 0.8676, '700': 0.9887, '750': 1.0496, '800': 1.1085,
  '900': 1.2272, '1000': 1.3478, '1250': 1.7180, '1500': 2.0660,
  '1750': 2.3966, '2000': 2.7483,
};

// XHHW-2 — same dimensions as XHHW
const TABLE_5_XHHW2: ConductorAreaTable = { ...TABLE_5_XHHW };

// RHH/RHW — larger insulation
const TABLE_5_RHH_RHW: ConductorAreaTable = {
  '14': 0.0209, '12': 0.0260, '10': 0.0333,
  '8': 0.0556, '6': 0.0726, '4': 0.1087, '3': 0.1263, '2': 0.1473,
  '1': 0.1901, '1/0': 0.2223, '2/0': 0.2624, '3/0': 0.3117, '4/0': 0.3718,
  '250': 0.4536, '300': 0.5242, '350': 0.5958, '400': 0.6619, '500': 0.7901,
  '600': 0.9676, '700': 1.1010, '750': 1.1652, '800': 1.2272,
  '900': 1.3561, '1000': 1.4784, '1250': 1.8602, '1500': 2.2302,
  '1750': 2.5804, '2000': 2.9578,
};

// RHW-2 — same as RHH/RHW
const TABLE_5_RHW2: ConductorAreaTable = { ...TABLE_5_RHH_RHW };

// USE-2 — same as THHN for common sizes
const TABLE_5_USE2: ConductorAreaTable = {
  '14': 0.0139, '12': 0.0181, '10': 0.0243,
  '8': 0.0437, '6': 0.0726, '4': 0.1087, '3': 0.1263, '2': 0.1473,
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
  XHHW2: TABLE_5_XHHW2,
  RHH_RHW: TABLE_5_RHH_RHW,
  RHW2: TABLE_5_RHW2,
  USE2: TABLE_5_USE2,
};

// ─── NEC Table 5A: Compact Conductor Areas (in²) ───────────────────────────
// Compact stranding — smaller OD than standard for same conductor size
// Only available for certain sizes (typically #8 and larger)

const TABLE_5A_THHN: ConductorAreaTable = {
  '8': 0.0300, '6': 0.0430, '4': 0.0680, '2': 0.0980,
  '1': 0.1260, '1/0': 0.1530, '2/0': 0.1855, '3/0': 0.2290, '4/0': 0.2780,
  '250': 0.3380, '300': 0.3970, '350': 0.4536, '400': 0.5090, '500': 0.6291,
  '600': 0.7620, '700': 0.8825, '750': 0.9400, '800': 0.9985,
  '900': 1.1140, '1000': 1.2135,
};

const TABLE_5A_XHHW: ConductorAreaTable = {
  '8': 0.0300, '6': 0.0430, '4': 0.0680, '2': 0.0980,
  '1': 0.1260, '1/0': 0.1530, '2/0': 0.1855, '3/0': 0.2290, '4/0': 0.2780,
  '250': 0.3380, '300': 0.3970, '350': 0.4536, '400': 0.5090, '500': 0.6291,
  '600': 0.7620, '700': 0.8825, '750': 0.9400, '800': 0.9985,
  '900': 1.1140, '1000': 1.2135,
};

const TABLE_5A: Record<string, ConductorAreaTable> = {
  THHN: TABLE_5A_THHN,
  XHHW: TABLE_5A_XHHW,
  XHHW2: TABLE_5A_XHHW,
};

// ─── NEC Table 8: Bare Conductor Areas (in²) ───────────────────────────────

const TABLE_8_BARE: ConductorAreaTable = {
  '18': 0.0013, '16': 0.0021, '14': 0.0033, '12': 0.0052, '10': 0.0082,
  '8': 0.0131, '6': 0.0270, '4': 0.0424, '3': 0.0530, '2': 0.0670,
  '1': 0.0845, '1/0': 0.1064, '2/0': 0.1342, '3/0': 0.1692, '4/0': 0.2133,
  '250': 0.2600, '300': 0.3120, '350': 0.3640, '400': 0.4160, '500': 0.5200,
  '600': 0.6260, '700': 0.7300, '750': 0.7820, '800': 0.8340,
  '900': 0.9360, '1000': 1.0390, '1250': 1.2960, '1500': 1.5580,
  '1750': 1.8110, '2000': 2.0740,
};

// ─── Lookup Functions ───────────────────────────────────────────────────────

export function getConduitArea(conduitType: ConduitTypeId, tradeSize: string): number {
  const table = TABLE_4[conduitType];
  if (!table) {
    throw new Error(`Invalid conduit type: ${conduitType}`);
  }
  const area = table[tradeSize];
  if (area === undefined) {
    throw new Error(`Trade size ${tradeSize}" not available for ${conduitType}`);
  }
  return area;
}

export function getConductorArea(
  wireSize: string,
  insulationType: InsulationTypeId,
  isCompact: boolean
): number {
  // Bare conductor — use Table 8
  if (insulationType === 'BARE') {
    const area = TABLE_8_BARE[wireSize];
    if (area === undefined) {
      throw new Error(`Bare conductor area not found for size ${wireSize}`);
    }
    return area;
  }

  // Compact conductor — use Table 5A
  if (isCompact) {
    const compactTable = TABLE_5A[insulationType];
    if (!compactTable) {
      throw new Error(`Compact conductor data not available for insulation type ${insulationType}`);
    }
    const area = compactTable[wireSize];
    if (area === undefined) {
      throw new Error(`Compact conductor area not found for ${insulationType} ${wireSize}`);
    }
    return area;
  }

  // Standard conductor — use Table 5
  const table = TABLE_5[insulationType];
  if (!table) {
    throw new Error(`Invalid insulation type: ${insulationType}`);
  }
  const area = table[wireSize];
  if (area === undefined) {
    throw new Error(`Conductor area not found for ${insulationType} ${wireSize}`);
  }
  return area;
}

export function getAvailableTradeSizes(conduitType: ConduitTypeId): TradeSize[] {
  const table = TABLE_4[conduitType];
  if (!table) {
    throw new Error(`Invalid conduit type: ${conduitType}`);
  }

  const metricMap: Record<string, number> = {
    '3/8': 12, '1/2': 16, '3/4': 21, '1': 27, '1-1/4': 35, '1-1/2': 41,
    '2': 53, '2-1/2': 63, '3': 78, '3-1/2': 91, '4': 103, '5': 129, '6': 155,
  };

  return Object.entries(table)
    .map(([imperial, area]) => ({
      imperial,
      metric: metricMap[imperial] ?? 0,
      internalAreaSqIn: area,
    }))
    .sort((a, b) => a.internalAreaSqIn - b.internalAreaSqIn);
}

/**
 * Check if compact conductor data is available for a given insulation type and wire size.
 */
export function hasCompactData(insulationType: InsulationTypeId, wireSize: string): boolean {
  if (insulationType === 'BARE') return false;
  const table = TABLE_5A[insulationType];
  if (!table) return false;
  return wireSize in table;
}
