/**
 * NEC 430.52 Motor Protection Sizing
 *
 * Provides multiplier table for motor branch-circuit short-circuit
 * and ground-fault protective devices per NEC Table 430.52.
 *
 * @module motorSizing
 */

import type { NECMotorProtectionDevice, NECMotorProtectionData } from '@/types/motor-breaker-calculator';

/**
 * NEC Table 430.52 - Maximum Rating or Setting of Motor Branch-Circuit
 * Short-Circuit and Ground-Fault Protective Devices
 *
 * Values shown are percentages of full-load current (FLA).
 */
export const NEC_MOTOR_PROTECTION_TABLE: Record<NECMotorProtectionDevice, NECMotorProtectionData> = {
  'thermal-magnetic': {
    device: 'thermal-magnetic',
    displayName: 'Thermal-Magnetic Circuit Breaker',
    multiplier: 2.5,  // 250% FLA
    codeReference: 'NEC Table 430.52',
    notes: 'Standard inverse-time breaker. Most common motor protection device. ' +
           'If 250% does not correspond to a standard breaker size, the next higher standard size is permitted.',
  },
  'magnetic-only': {
    device: 'magnetic-only',
    displayName: 'Magnetic-Only Circuit Breaker',
    multiplier: 8.0,  // 800% FLA
    codeReference: 'NEC Table 430.52',
    notes: 'Instantaneous-trip only (no thermal element). Used where motor overload protection ' +
           'is provided separately (e.g., by motor starter overload relay).',
  },
  'dual-element-fuse': {
    device: 'dual-element-fuse',
    displayName: 'Dual-Element Time-Delay Fuse',
    multiplier: 1.75,  // 175% FLA
    codeReference: 'NEC Table 430.52',
    notes: 'Time-delay fuse provides both overload and short-circuit protection. ' +
           'Lower multiplier due to time-delay characteristic that rides through motor starting.',
  },
  'instantaneous-trip': {
    device: 'instantaneous-trip',
    displayName: 'Instantaneous-Trip Circuit Breaker',
    multiplier: 11.0,  // 1100% FLA
    codeReference: 'NEC Table 430.52',
    notes: 'Motor circuit protector (MCP). For motors >1HP only. Must be used with ' +
           'a listed combination motor controller providing overload and short-circuit protection.',
  },
};

/**
 * Get motor protection data for a specific device type
 */
export function getMotorProtectionData(
  device: NECMotorProtectionDevice
): NECMotorProtectionData {
  return NEC_MOTOR_PROTECTION_TABLE[device];
}

/**
 * Get all available motor protection devices
 */
export function getAllMotorProtectionDevices(): NECMotorProtectionData[] {
  return Object.values(NEC_MOTOR_PROTECTION_TABLE);
}

/**
 * Calculate minimum protection size for a motor
 *
 * @param fla - Motor full-load amps
 * @param device - Protection device type
 * @returns Minimum amps for protective device
 */
export function calculateMotorProtectionMinimum(
  fla: number,
  device: NECMotorProtectionDevice
): number {
  const data = NEC_MOTOR_PROTECTION_TABLE[device];
  return fla * data.multiplier;
}
