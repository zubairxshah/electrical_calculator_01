// Conduit Fill Calculator — NEC 2020 Chapter 9 + IEC 61386 / BS 7671
// Core calculation logic for conduit/raceway fill compliance

import { create, all } from 'mathjs';
import type {
  ConduitFillInput,
  ConduitFillResult,
  ConductorDetail,
  ConductorEntry,
  ConduitStandard,
  TradeSize,
} from '@/types/conduit-fill';
import {
  getConduitArea,
  getConduitAreaMm2,
  getConductorAreaMm2,
  getFillLimit,
  getAvailableTradeSizes,
  INSULATION_TYPES,
  isIECInsulation,
} from './conduitFillData';

const math = create(all, { number: 'BigNumber', precision: 16 });

/**
 * Calculate conduit fill compliance per NEC Chapter 9.
 *
 * @param input - Conduit type, size, conductor list, and options
 * @returns Fill calculation results with pass/fail and breakdown
 * @throws Error if conductor list is empty or conduit type/size is invalid
 */
export function calculateConduitFill(input: ConduitFillInput): ConduitFillResult {
  if (!input.conductors || input.conductors.length === 0) {
    throw new Error('At least one conductor is required for fill calculation');
  }

  const standard: ConduitStandard = input.standard ?? 'NEC';
  const isIEC = standard === 'IEC';

  // Look up conduit internal area
  const conduitInternalArea = getConduitArea(input.conduitType, input.tradeSize);
  const conduitInternalAreaMm2 = getConduitAreaMm2(input.conduitType, input.tradeSize);

  // Calculate total conductor count and area
  let totalConductorCount = 0;
  let totalConductorArea = math.bignumber(0);
  let totalConductorAreaMm2Bn = math.bignumber(0);

  const tableRefs = new Set<string>();
  if (isIEC) {
    tableRefs.add('BS 7671 / IEC 60364-5-52');
    tableRefs.add('IEC 61386 (Conduit Sizes)');
  } else {
    tableRefs.add('NEC Table 1');
    tableRefs.add('NEC Chapter 9 Table 4');
  }

  const conductorDetails: ConductorDetail[] = input.conductors.map((conductor) => {
    const qty = conductor.quantity;
    totalConductorCount += qty;

    const areaPerConductor = math.bignumber(conductor.areaSqIn);
    const entryTotal = math.multiply(areaPerConductor, math.bignumber(qty));
    totalConductorArea = math.add(totalConductorArea, entryTotal) as math.BigNumber;

    // mm² area
    const areaMm2 = conductor.areaMm2 ?? conductor.areaSqIn * 645.16;
    const entryTotalMm2 = math.multiply(math.bignumber(areaMm2), math.bignumber(qty));
    totalConductorAreaMm2Bn = math.add(totalConductorAreaMm2Bn, entryTotalMm2) as math.BigNumber;

    // Determine table reference for this conductor
    const insulationInfo = INSULATION_TYPES.find((t) => t.id === conductor.insulationType);
    let tableRef: string;
    if (isIEC) {
      tableRef = conductor.insulationType === 'BARE_IEC'
        ? 'BS 7671 Table 54.7'
        : 'BS 7671 Appendix C';
    } else {
      tableRef = conductor.insulationType === 'BARE'
        ? 'NEC Chapter 9 Table 8'
        : conductor.isCompact
          ? 'NEC Chapter 9 Table 5A'
          : 'NEC Chapter 9 Table 5';
    }
    tableRefs.add(tableRef);

    return {
      entryId: conductor.id,
      wireSize: conductor.wireSize,
      insulationType: insulationInfo?.label ?? conductor.insulationType,
      quantity: qty,
      areaPerConductor: conductor.areaSqIn,
      areaPerConductorMm2: areaMm2,
      totalArea: Number(entryTotal.toString()),
      totalAreaMm2: Number(entryTotalMm2.toString()),
      percentOfFill: 0, // filled after total is known
      necTableRef: tableRef,
    };
  });

  const totalAreaNum = Number(totalConductorArea.toString());
  const totalAreaMm2Num = Number(totalConductorAreaMm2Bn.toString());

  // Determine fill limit
  const fillLimit = getFillLimit(totalConductorCount, input.isNipple, standard);

  // Calculate fill percentage
  const fillPercentage = (totalAreaNum / conduitInternalArea) * 100;

  // Calculate allowable fill area and remaining
  const allowableFillArea = conduitInternalArea * (fillLimit / 100);
  const remainingArea = allowableFillArea - totalAreaNum;
  const allowableFillAreaMm2 = conduitInternalAreaMm2 * (fillLimit / 100);
  const remainingAreaMm2 = allowableFillAreaMm2 - totalAreaMm2Num;

  // Pass/fail determination
  const pass = fillPercentage <= fillLimit;

  // Utilization ratio (how much of the allowed fill is used)
  const utilizationRatio = fillPercentage / fillLimit;

  // Fill in per-conductor fill percentages
  conductorDetails.forEach((detail) => {
    detail.percentOfFill = (detail.totalArea / conduitInternalArea) * 100;
  });

  // Add nipple reference if applicable
  if (input.isNipple) {
    tableRefs.add(isIEC ? 'IEC 60364 (Short Run)' : 'NEC 376.22 (Conduit Nipple)');
  }

  return {
    conduitInternalArea,
    conduitInternalAreaMm2,
    totalConductorArea: totalAreaNum,
    totalConductorAreaMm2: totalAreaMm2Num,
    fillPercentage,
    fillLimit,
    totalConductorCount,
    pass,
    remainingArea,
    remainingAreaMm2,
    utilizationRatio,
    conductorDetails,
    necReferences: Array.from(tableRefs),
    minimumConduitSize: null,
    noConduitFits: false,
  };
}

/**
 * Find the minimum conduit trade size that satisfies NEC fill limits.
 *
 * @param conduitType - The conduit type to search
 * @param conductors - List of conductor entries
 * @param isNipple - Whether nipple fill (60%) applies
 * @returns The smallest passing TradeSize, or null if none fits
 */
export function findMinimumConduitSize(
  conduitType: string,
  conductors: ConductorEntry[],
  isNipple: boolean,
  standard: ConduitStandard = 'NEC'
): TradeSize | null {
  if (conductors.length === 0) return null;

  // Calculate total conductor area and count
  let totalCount = 0;
  let totalArea = math.bignumber(0);

  for (const conductor of conductors) {
    totalCount += conductor.quantity;
    const entryArea = math.multiply(
      math.bignumber(conductor.areaSqIn),
      math.bignumber(conductor.quantity)
    );
    totalArea = math.add(totalArea, entryArea) as math.BigNumber;
  }

  const totalAreaNum = Number(totalArea.toString());
  const fillLimit = getFillLimit(totalCount, isNipple, standard);

  // Iterate ascending trade sizes
  const tradeSizes = getAvailableTradeSizes(conduitType as any);

  for (const size of tradeSizes) {
    const allowable = size.internalAreaSqIn * (fillLimit / 100);
    if (totalAreaNum <= allowable) {
      return size;
    }
  }

  return null; // No conduit large enough
}
