/**
 * Motor Full-Load Current — NEC 2020 Tables 430.248 and 430.250
 *
 * NEC 430.6(A)(1): table values (not nameplate) are used for conductor and
 * overcurrent device sizing, and therefore for panel load calculations.
 *
 * Values transcribed from NEC 2020. Verification against a licensed copy is
 * tracked as a release-blocking user task (specs/013-panel-schedule T042).
 *
 * @module motorFlc
 */

type SinglePhaseColumn = 115 | 200 | 208 | 230
type ThreePhaseColumn = 200 | 208 | 230 | 460 | 575

/** Table 430.248 — Full-Load Currents in Amperes, Single-Phase AC Motors */
export const NEC_TABLE_430_248: Record<number, Partial<Record<SinglePhaseColumn, number>>> = {
  [1 / 6]: { 115: 4.4, 200: 2.5, 208: 2.4, 230: 2.2 },
  0.25: { 115: 5.8, 200: 3.3, 208: 3.2, 230: 2.9 },
  [1 / 3]: { 115: 7.2, 200: 4.1, 208: 4.0, 230: 3.6 },
  0.5: { 115: 9.8, 200: 5.6, 208: 5.4, 230: 4.9 },
  0.75: { 115: 13.8, 200: 7.9, 208: 7.6, 230: 6.9 },
  1: { 115: 16, 200: 9.2, 208: 8.8, 230: 8 },
  1.5: { 115: 20, 200: 11.5, 208: 11, 230: 10 },
  2: { 115: 24, 200: 13.8, 208: 13.2, 230: 12 },
  3: { 115: 34, 200: 19.6, 208: 18.7, 230: 17 },
  5: { 115: 56, 200: 32.2, 208: 30.8, 230: 28 },
  7.5: { 115: 80, 200: 46, 208: 44, 230: 40 },
  10: { 115: 100, 200: 57.5, 208: 55, 230: 50 },
}

/** Table 430.250 — Full-Load Current, Three-Phase AC Motors (induction, squirrel cage and wound rotor) */
export const NEC_TABLE_430_250: Record<number, Partial<Record<ThreePhaseColumn, number>>> = {
  0.5: { 200: 2.5, 208: 2.4, 230: 2.2, 460: 1.1, 575: 0.9 },
  0.75: { 200: 3.7, 208: 3.5, 230: 3.2, 460: 1.6, 575: 1.3 },
  1: { 200: 4.8, 208: 4.6, 230: 4.2, 460: 2.1, 575: 1.7 },
  1.5: { 200: 6.9, 208: 6.6, 230: 6.0, 460: 3.0, 575: 2.4 },
  2: { 200: 7.8, 208: 7.5, 230: 6.8, 460: 3.4, 575: 2.7 },
  3: { 200: 11.0, 208: 10.6, 230: 9.6, 460: 4.8, 575: 3.9 },
  5: { 200: 17.5, 208: 16.7, 230: 15.2, 460: 7.6, 575: 6.1 },
  7.5: { 200: 25.3, 208: 24.2, 230: 22, 460: 11, 575: 9 },
  10: { 200: 32.2, 208: 30.8, 230: 28, 460: 14, 575: 11 },
  15: { 200: 48.3, 208: 46.2, 230: 42, 460: 21, 575: 17 },
  20: { 200: 62.1, 208: 59.4, 230: 54, 460: 27, 575: 22 },
  25: { 200: 78.2, 208: 74.8, 230: 68, 460: 34, 575: 27 },
  30: { 200: 92, 208: 88, 230: 80, 460: 40, 575: 32 },
  40: { 200: 120, 208: 114, 230: 104, 460: 52, 575: 41 },
  50: { 200: 150, 208: 143, 230: 130, 460: 65, 575: 52 },
  60: { 200: 177, 208: 169, 230: 154, 460: 77, 575: 62 },
  75: { 200: 221, 208: 211, 230: 192, 460: 96, 575: 77 },
  100: { 200: 285, 208: 273, 230: 248, 460: 124, 575: 99 },
  125: { 200: 359, 208: 343, 230: 312, 460: 156, 575: 125 },
  150: { 200: 414, 208: 396, 230: 360, 460: 180, 575: 144 },
  200: { 200: 552, 208: 528, 230: 480, 460: 240, 575: 192 },
  250: { 230: 602, 460: 302, 575: 242 },
  300: { 230: 722, 460: 361, 575: 289 },
  350: { 230: 828, 460: 414, 575: 336 },
  400: { 230: 954, 460: 477, 575: 382 },
  450: { 230: 1030, 460: 515, 575: 412 },
  500: { 230: 1180, 460: 590, 575: 472 },
}

/** System nominal voltage → table motor-voltage column (NEC 430.248/430.250 headnotes) */
const SINGLE_PHASE_COLUMN: Record<number, SinglePhaseColumn> = {
  115: 115, 120: 115, 200: 200, 208: 208, 230: 230, 240: 230,
}
const THREE_PHASE_COLUMN: Record<number, ThreePhaseColumn> = {
  200: 200, 208: 208, 230: 230, 240: 230, 460: 460, 480: 460, 575: 575, 600: 575,
}

function findRow<T>(table: Record<number, T>, hp: number): T | undefined {
  const key = Object.keys(table).find((k) => Math.abs(Number(k) - hp) < 1e-6)
  return key === undefined ? undefined : table[Number(key)]
}

/**
 * Table full-load current for a motor, or null when the HP or voltage is not tabulated.
 * @param phases 1 for single-phase motors (Table 430.248), 3 for three-phase (Table 430.250)
 * @param systemV nominal system voltage the motor is connected at (e.g. 120, 208, 240, 480)
 */
export function necMotorFlc(hp: number, phases: 1 | 3, systemV: number): number | null {
  if (phases === 1) {
    const col = SINGLE_PHASE_COLUMN[systemV]
    if (col === undefined) return null
    return findRow(NEC_TABLE_430_248, hp)?.[col] ?? null
  }
  const col = THREE_PHASE_COLUMN[systemV]
  if (col === undefined) return null
  return findRow(NEC_TABLE_430_250, hp)?.[col] ?? null
}
