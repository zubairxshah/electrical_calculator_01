// IEEE 1584-2018 model coefficient tables (Tables 1, 2, 3, 4, 5, 7) and typical
// equipment values (Tables 8 and 10).
//
// Normative source: IEEE Std 1584-2018, "IEEE Guide for Performing Arc-Flash Hazard Calculations".
// Transcribed (by script, not by hand) from two MIT-licensed reference implementations that agree
// value-by-value on Table 1, and verified against 144,000 results from the official IEEE 1584-2018
// spreadsheet (see __tests__/fixtures/arc-flash/README.md):
//   - Tables 1, 3, 4, 5, 7: https://github.com/jgrimard/arc-flash-calculator (ArcFlashCalculatorClass.js)
//   - Table 2:              https://github.com/rwl/arcflash (src/tables/table2.rs)
//   - Tables 8/10:          https://github.com/rwl/arcflash (src/tables/table8_10.rs)

import type { ElectrodeConfig, EquipmentClassId } from '@/types/arc-flash'

export type VoltageLevel = 600 | 2700 | 14300
export type EnclosedConfig = 'VCB' | 'VCBB' | 'HCB'

/** Table 1 — intermediate average arcing current coefficients (Eq. 1) */
export interface Table1Row {
  k1: number; k2: number; k3: number; k4: number; k5: number
  k6: number; k7: number; k8: number; k9: number; k10: number
}

/** Tables 3/4/5 — incident energy and arc flash boundary coefficients (Eqs. 3–6, 7–10) */
export interface EnergyRow extends Table1Row {
  k11: number; k12: number; k13: number
}

/** Table 2 — arcing current variation correction factor (Eq. 2), polynomial in Voc (kV) */
export interface Table2Row {
  k1: number; k2: number; k3: number; k4: number; k5: number; k6: number; k7: number
}

/** Table 7 — enclosure size correction factor coefficients (Eqs. 14, 15) */
export interface Table7Row {
  b1: number; b2: number; b3: number
}

/** Table 1 — intermediate average arcing current at 600 V, 2700 V and 14 300 V */
export const TABLE_1: Record<VoltageLevel, Record<ElectrodeConfig, Table1Row>> = {
  600: {
    VCB: { k1: -0.04287, k2: 1.035, k3: -0.083, k4: 0, k5: 0, k6: -4.783e-9, k7: 0.000001962, k8: -0.000229, k9: 0.003141, k10: 1.092 },
    VCBB: { k1: -0.017432, k2: 0.98, k3: -0.05, k4: 0, k5: 0, k6: -5.767e-9, k7: 0.000002524, k8: -0.00034, k9: 0.01187, k10: 1.013 },
    HCB: { k1: 0.054922, k2: 0.988, k3: -0.11, k4: 0, k5: 0, k6: -5.382e-9, k7: 0.000002316, k8: -0.000302, k9: 0.0091, k10: 0.9725 },
    VOA: { k1: 0.043785, k2: 1.04, k3: -0.18, k4: 0, k5: 0, k6: -4.783e-9, k7: 0.000001962, k8: -0.000229, k9: 0.003141, k10: 1.092 },
    HOA: { k1: 0.111147, k2: 1.008, k3: -0.24, k4: 0, k5: 0, k6: -3.895e-9, k7: 0.000001641, k8: -0.000197, k9: 0.002615, k10: 1.1 },
  },
  2700: {
    VCB: { k1: 0.0065, k2: 1.001, k3: -0.024, k4: -1.557e-12, k5: 4.556e-10, k6: -4.186e-8, k7: 8.346e-7, k8: 0.00005482, k9: -0.003191, k10: 0.9729 },
    VCBB: { k1: 0.002823, k2: 0.995, k3: -0.0125, k4: 0, k5: -9.204e-11, k6: 2.901e-8, k7: -0.000003262, k8: 0.0001569, k9: -0.004003, k10: 0.9825 },
    HCB: { k1: 0.001011, k2: 1.003, k3: -0.0249, k4: 0, k5: 0, k6: 4.859e-10, k7: -1.814e-7, k8: -0.000009128, k9: -0.0007, k10: 0.9881 },
    VOA: { k1: -0.02395, k2: 1.006, k3: -0.0188, k4: -1.557e-12, k5: 4.556e-10, k6: -4.186e-8, k7: 8.346e-7, k8: 0.00005482, k9: -0.003191, k10: 0.9729 },
    HOA: { k1: 0.000435, k2: 1.006, k3: -0.038, k4: 0, k5: 0, k6: 7.859e-10, k7: -1.914e-7, k8: -0.000009128, k9: -0.0007, k10: 0.9981 },
  },
  14300: {
    VCB: { k1: 0.005795, k2: 1.015, k3: -0.011, k4: -1.557e-12, k5: 4.556e-10, k6: -4.186e-8, k7: 8.346e-7, k8: 0.00005482, k9: -0.003191, k10: 0.9729 },
    VCBB: { k1: 0.014827, k2: 1.01, k3: -0.01, k4: 0, k5: -9.204e-11, k6: 2.901e-8, k7: -0.000003262, k8: 0.0001569, k9: -0.004003, k10: 0.9825 },
    HCB: { k1: 0.008693, k2: 0.999, k3: -0.02, k4: 0, k5: -5.043e-11, k6: 2.233e-8, k7: -0.000003046, k8: 0.000116, k9: -0.001145, k10: 0.9839 },
    VOA: { k1: 0.005371, k2: 1.0102, k3: -0.029, k4: -1.557e-12, k5: 4.556e-10, k6: -4.186e-8, k7: 8.346e-7, k8: 0.00005482, k9: -0.003191, k10: 0.9729 },
    HOA: { k1: 0.000904, k2: 0.999, k3: -0.02, k4: 0, k5: 0, k6: 7.859e-10, k7: -1.914e-7, k8: -0.000009128, k9: -0.0007, k10: 0.9981 },
  },
}

/** Table 3 — incident energy / AFB coefficients at 600 V */
export const TABLE_3: Record<ElectrodeConfig, EnergyRow> = {
  VCB: { k1: 0.753364, k2: 0.566, k3: 1.752636, k4: 0, k5: 0, k6: -4.783e-9, k7: 0.000001962, k8: -0.000229, k9: 0.003141, k10: 1.092, k11: 0, k12: -1.598, k13: 0.957 },
  VCBB: { k1: 3.068459, k2: 0.26, k3: -0.098107, k4: 0, k5: 0, k6: -5.767e-9, k7: 0.000002524, k8: -0.00034, k9: 0.01187, k10: 1.013, k11: -0.06, k12: -1.809, k13: 1.19 },
  HCB: { k1: 4.073745, k2: 0.344, k3: -0.370259, k4: 0, k5: 0, k6: -5.382e-9, k7: 0.000002316, k8: -0.000302, k9: 0.0091, k10: 0.9725, k11: 0, k12: -2.03, k13: 1.036 },
  VOA: { k1: 0.679294, k2: 0.746, k3: 1.222636, k4: 0, k5: 0, k6: -4.783e-9, k7: 0.000001962, k8: -0.000229, k9: 0.003141, k10: 1.092, k11: 0, k12: -1.598, k13: 0.997 },
  HOA: { k1: 3.470417, k2: 0.465, k3: -0.261863, k4: 0, k5: 0, k6: -3.895e-9, k7: 0.000001641, k8: -0.000197, k9: 0.002615, k10: 1.1, k11: 0, k12: -1.99, k13: 1.04 },
}

/** Table 4 — incident energy / AFB coefficients at 2700 V */
export const TABLE_4: Record<ElectrodeConfig, EnergyRow> = {
  VCB: { k1: 2.40021, k2: 0.165, k3: 0.354202, k4: -1.557e-12, k5: 4.556e-10, k6: -4.186e-8, k7: 8.346e-7, k8: 0.00005482, k9: -0.003191, k10: 0.9729, k11: 0, k12: -1.569, k13: 0.9778 },
  VCBB: { k1: 3.870592, k2: 0.185, k3: -0.736618, k4: 0, k5: -9.204e-11, k6: 2.901e-8, k7: -0.000003262, k8: 0.0001569, k9: -0.004003, k10: 0.9825, k11: 0, k12: -1.742, k13: 1.09 },
  HCB: { k1: 3.486391, k2: 0.177, k3: -0.193101, k4: 0, k5: 0, k6: 4.859e-10, k7: -1.814e-7, k8: -0.000009128, k9: -0.0007, k10: 0.9881, k11: 0.027, k12: -1.723, k13: 1.055 },
  VOA: { k1: 3.880724, k2: 0.105, k3: -1.906033, k4: -1.557e-12, k5: 4.556e-10, k6: -4.186e-8, k7: 8.346e-7, k8: 0.00005482, k9: -0.003191, k10: 0.9729, k11: 0, k12: -1.515, k13: 1.115 },
  HOA: { k1: 3.616266, k2: 0.149, k3: -0.761561, k4: 0, k5: 0, k6: 7.859e-10, k7: -1.914e-7, k8: -0.000009128, k9: -0.0007, k10: 0.9981, k11: 0, k12: -1.639, k13: 1.078 },
}

/** Table 5 — incident energy / AFB coefficients at 14300 V */
export const TABLE_5: Record<ElectrodeConfig, EnergyRow> = {
  VCB: { k1: 3.825917, k2: 0.11, k3: -0.999749, k4: -1.557e-12, k5: 4.556e-10, k6: -4.186e-8, k7: 8.346e-7, k8: 0.00005482, k9: -0.003191, k10: 0.9729, k11: 0, k12: -1.568, k13: 0.99 },
  VCBB: { k1: 3.644309, k2: 0.215, k3: -0.585522, k4: 0, k5: -9.204e-11, k6: 2.901e-8, k7: -0.000003262, k8: 0.0001569, k9: -0.004003, k10: 0.9825, k11: 0, k12: -1.677, k13: 1.06 },
  HCB: { k1: 3.044516, k2: 0.125, k3: 0.245106, k4: 0, k5: -5.043e-11, k6: 2.233e-8, k7: -0.000003046, k8: 0.000116, k9: -0.001145, k10: 0.9839, k11: 0, k12: -1.655, k13: 1.084 },
  VOA: { k1: 3.405454, k2: 0.12, k3: -0.93245, k4: -1.557e-12, k5: 4.556e-10, k6: -4.186e-8, k7: 8.346e-7, k8: 0.00005482, k9: -0.003191, k10: 0.9729, k11: 0, k12: -1.534, k13: 0.979 },
  HOA: { k1: 2.04049, k2: 0.177, k3: 1.005092, k4: 0, k5: 0, k6: 7.859e-10, k7: -1.914e-7, k8: -0.000009128, k9: -0.0007, k10: 0.9981, k11: -0.05, k12: -1.633, k13: 1.151 },
}

/** Table 7 — "typical" enclosure correction (Eq. 14) */
export const TABLE_7_TYPICAL: Record<EnclosedConfig, Table7Row> = {
  VCB: { b1: -0.000302, b2: 0.03441, b3: 0.4325 },
  VCBB: { b1: -0.0002976, b2: 0.032, b3: 0.479 },
  HCB: { b1: -0.0001923, b2: 0.01935, b3: 0.6899 },
}

/** Table 7 — "shallow" enclosure correction (Eq. 15) */
export const TABLE_7_SHALLOW: Record<EnclosedConfig, Table7Row> = {
  VCB: { b1: 0.002222, b2: -0.02556, b3: 0.6222 },
  VCBB: { b1: -0.002778, b2: 0.1194, b3: -0.2778 },
  HCB: { b1: -0.0005556, b2: 0.03722, b3: 0.4778 },
}

/**
 * Table 2 — arcing current variation correction factor.
 * VOA k7 = 0.33696 is verified against the IEEE spreadsheet data (exact match on all LV rows);
 * the value 0.334627 that appears in some public sources is a typo — do not "correct" it.
 */
export const TABLE_2: Record<ElectrodeConfig, Table2Row> = {
  VCB: { k1: 0, k2: -0.0000014269, k3: 0.000083137, k4: -0.0019382, k5: 0.022366, k6: -0.12645, k7: 0.30226 },
  VCBB: { k1: 1.138e-6, k2: -6.0287e-5, k3: 0.0012758, k4: -0.013778, k5: 0.080217, k6: -0.24066, k7: 0.33524 },
  HCB: { k1: 0, k2: -3.097e-6, k3: 0.00016405, k4: -0.0033609, k5: 0.033308, k6: -0.16182, k7: 0.34627 },
  VOA: { k1: 9.5606e-7, k2: -5.1543e-5, k3: 0.0011161, k4: -0.01242, k5: 0.075125, k6: -0.23584, k7: 0.33696 },
  HOA: { k1: 0, k2: -3.1555e-6, k3: 0.0001682, k4: -0.0034607, k5: 0.034124, k6: -0.1599, k7: 0.34629 },
}

/** Table 6 — enclosure constants A and B for Eqs. 11 and 12 */
export const ENCLOSURE_CONSTANTS: Record<EnclosedConfig, { A: number; B: number }> = {
  VCB: { A: 4, B: 20 },
  VCBB: { A: 10, B: 24 },
  HCB: { A: 10, B: 22 },
}

export const ENERGY_TABLES: Record<VoltageLevel, Record<ElectrodeConfig, EnergyRow>> = {
  600: TABLE_3,
  2700: TABLE_4,
  14300: TABLE_5,
}

export interface TypicalEquipment {
  id: Exclude<EquipmentClassId, 'custom'>
  label: string
  gapMm: number
  heightMm: number
  widthMm: number
  depthMm: number
  workingDistanceMm: number
  defaultConfig: ElectrodeConfig
}

/**
 * Typical gaps, enclosure sizes and working distances (IEEE 1584-2018 Tables 8 and 10).
 * LV "shallow" depth ≤ 203.2 mm is represented as 100 mm and "deep" as 250 mm — only the
 * shallow/deep distinction matters to the model.
 */
export const TYPICAL_EQUIPMENT: TypicalEquipment[] = [
  { id: 'kv15-switchgear', label: '15 kV switchgear', gapMm: 152, heightMm: 1143, widthMm: 762, depthMm: 762, workingDistanceMm: 914.4, defaultConfig: 'VCB' },
  { id: 'kv15-mcc', label: '15 kV MCC', gapMm: 152, heightMm: 914.4, widthMm: 914.4, depthMm: 914.4, workingDistanceMm: 914.4, defaultConfig: 'VCB' },
  { id: 'kv5-switchgear-large', label: '5 kV switchgear (large)', gapMm: 104, heightMm: 914.4, widthMm: 914.4, depthMm: 914.4, workingDistanceMm: 914.4, defaultConfig: 'VCB' },
  { id: 'kv5-switchgear-small', label: '5 kV switchgear (small)', gapMm: 104, heightMm: 1143, widthMm: 762, depthMm: 762, workingDistanceMm: 914.4, defaultConfig: 'VCB' },
  { id: 'kv5-mcc', label: '5 kV MCC', gapMm: 104, heightMm: 660.4, widthMm: 660.4, depthMm: 660.4, workingDistanceMm: 914.4, defaultConfig: 'VCB' },
  { id: 'lv-switchgear', label: 'LV switchgear', gapMm: 32, heightMm: 508, widthMm: 508, depthMm: 508, workingDistanceMm: 609.6, defaultConfig: 'VCB' },
  { id: 'lv-mcc-panel-shallow', label: 'LV MCC / panelboard (shallow)', gapMm: 25, heightMm: 355.6, widthMm: 304.8, depthMm: 100, workingDistanceMm: 457.2, defaultConfig: 'VCB' },
  { id: 'lv-mcc-panel-deep', label: 'LV MCC / panelboard (deep)', gapMm: 25, heightMm: 355.6, widthMm: 304.8, depthMm: 250, workingDistanceMm: 457.2, defaultConfig: 'VCB' },
  { id: 'cable-jb-shallow', label: 'Cable junction box (shallow)', gapMm: 13, heightMm: 355.6, widthMm: 304.8, depthMm: 100, workingDistanceMm: 457.2, defaultConfig: 'VCB' },
  { id: 'cable-jb-deep', label: 'Cable junction box (deep)', gapMm: 13, heightMm: 355.6, widthMm: 304.8, depthMm: 250, workingDistanceMm: 457.2, defaultConfig: 'VCB' },
]
