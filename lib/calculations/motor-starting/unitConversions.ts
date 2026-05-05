// Motor Starting unit conversions
// Uses mathjs BigNumber internally for round-trip stability.

import { create, all, type BigNumber } from 'mathjs'

const math = create(all, { precision: 32 })

const HP_TO_KW = '0.7457'
const LB_FT2_TO_KG_M2 = '0.0421401'
const LB_FT_TO_NM = '1.355817948'

function toBig(n: number): BigNumber {
  return math.bignumber(n)
}

function fromBig(b: BigNumber): number {
  return Number(b.toString())
}

export function hpToKw(hp: number): number {
  return fromBig(math.multiply(toBig(hp), math.bignumber(HP_TO_KW)) as BigNumber)
}

export function kwToHp(kw: number): number {
  return fromBig(math.divide(toBig(kw), math.bignumber(HP_TO_KW)) as BigNumber)
}

export function lbFt2ToKgM2(i: number): number {
  return fromBig(math.multiply(toBig(i), math.bignumber(LB_FT2_TO_KG_M2)) as BigNumber)
}

export function kgM2ToLbFt2(i: number): number {
  return fromBig(math.divide(toBig(i), math.bignumber(LB_FT2_TO_KG_M2)) as BigNumber)
}

export function rpmToRadPerSec(rpm: number): number {
  return (rpm * 2 * Math.PI) / 60
}

export function radPerSecToRpm(rad: number): number {
  return (rad * 60) / (2 * Math.PI)
}

export function lbFtToNm(t: number): number {
  return fromBig(math.multiply(toBig(t), math.bignumber(LB_FT_TO_NM)) as BigNumber)
}

export function nmToLbFt(t: number): number {
  return fromBig(math.divide(toBig(t), math.bignumber(LB_FT_TO_NM)) as BigNumber)
}

// Synchronous speed for a polyphase induction motor.
export function syncSpeedRpm(poles: number, frequencyHz: number): number {
  return (120 * frequencyHz) / poles
}
