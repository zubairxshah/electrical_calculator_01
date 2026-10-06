// Unit conversion and display formatting for the Arc Flash calculator.
// Internal values are SI (mm, J/cm², ms); NEC mode shows imperial first, IEC mode metric first.

import type { ArcFlashStandard } from '@/types/arc-flash'

export const MM_PER_IN = 25.4
export const J_PER_CAL = 4.184

export const mmToIn = (mm: number) => mm / MM_PER_IN
export const inToMm = (inches: number) => inches * MM_PER_IN
export const jToCal = (j: number) => j / J_PER_CAL
export const calToJ = (cal: number) => cal * J_PER_CAL

/** "3 ft 5 in" — rounded to the nearest inch */
export function feetInches(mm: number): string {
  const totalIn = Math.round(mmToIn(mm))
  return `${Math.floor(totalIn / 12)} ft ${totalIn % 12} in`
}

export function formatDistance(mm: number, standard: ArcFlashStandard): string {
  const rounded = Math.round(mm)
  if (standard === 'IEC') return `${rounded} mm (${(mm / 1000).toFixed(2)} m)`
  return `${feetInches(mm)} (${rounded} mm)`
}

export function formatEnergy(jcm2: number, standard: ArcFlashStandard): string {
  const j = `${jcm2.toFixed(2)} J/cm²`
  const cal = `${jToCal(jcm2).toFixed(2)} cal/cm²`
  return standard === 'IEC' ? `${j} (${cal})` : `${cal} (${j})`
}

export function formatTime(ms: number): string {
  return `${Number(ms.toFixed(1))} ms`
}
