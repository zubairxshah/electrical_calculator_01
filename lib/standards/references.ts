/**
 * Engineering Standards Reference Data
 *
 * Provides metadata for electrical engineering standards:
 * - IEEE 485: Battery sizing
 * - IEEE 1100: UPS and grounding
 * - NEC 2020: National Electrical Code
 * - IEC 60364: Low-voltage electrical installations
 * - IEC 60038: Standard voltages
 *
 * @see specs/001-electromate-engineering-app/spec.md#FR-005
 */

import type { StandardReference } from '../types'

/**
 * IEEE 485-2020: Recommended Practice for Sizing Lead-Acid Batteries
 */
export const IEEE_485: StandardReference = {
  id: 'IEEE-485',
  name: 'IEEE 485-2020',
  version: '2020',
  framework: 'IEC',
  url: 'https://standards.ieee.org/ieee/485/7524/',
}

/**
 * IEEE 1100-2020: Recommended Practice for Powering and Grounding Electronic Equipment
 */
export const IEEE_1100: StandardReference = {
  id: 'IEEE-1100',
  name: 'IEEE 1100-2020',
  version: '2020',
  framework: 'IEC',
  url: 'https://standards.ieee.org/ieee/1100/7010/',
}

/**
 * NEC 2020: National Electrical Code
 */
export const NEC_2020: StandardReference = {
  id: 'NEC',
  name: 'NFPA 70 (NEC)',
  version: '2020',
  framework: 'NEC',
  url: 'https://www.nfpa.org/codes-and-standards/nfpa-70',
}

/**
 * IEC 60364: Low-voltage electrical installations
 */
export const IEC_60364: StandardReference = {
  id: 'IEC-60364',
  name: 'IEC 60364',
  version: '2023',
  framework: 'IEC',
  url: 'https://webstore.iec.ch/publication/60364',
}

/**
 * IEC 60038: IEC standard voltages
 */
export const IEC_60038: StandardReference = {
  id: 'IEC-60038',
  name: 'IEC 60038',
  version: '2009',
  framework: 'IEC',
  url: 'https://webstore.iec.ch/publication/153',
}

/**
 * IEC 61215: Terrestrial photovoltaic (PV) modules - Design qualification and type approval
 */
export const IEC_61215: StandardReference = {
  id: 'IEC-61215',
  name: 'IEC 61215',
  version: '2016',
  framework: 'IEC',
  url: 'https://webstore.iec.ch/publication/24312',
}

/**
 * IEC 62109: Safety of power converters for use in photovoltaic power systems
 */
export const IEC_62109: StandardReference = {
  id: 'IEC-62109',
  name: 'IEC 62109',
  version: '2024',
  framework: 'IEC',
  url: 'https://webstore.iec.ch/publication/62109',
}

/**
 * All standards registry
 */
export const ALL_STANDARDS: StandardReference[] = [
  IEEE_485,
  IEEE_1100,
  NEC_2020,
  IEC_60364,
  IEC_60038,
  IEC_61215,
  IEC_62109,
]

/**
 * Get standard by ID
 */
export function getStandardById(id: string): StandardReference | undefined {
  return ALL_STANDARDS.find((std) => std.id === id)
}

/**
 * Get standards by framework
 */
export function getStandardsByFramework(framework: 'IEC' | 'NEC'): StandardReference[] {
  return ALL_STANDARDS.filter((std) => std.framework === framework)
}

/**
 * Format standard reference for display
 */
export function formatStandardReference(
  standard: StandardReference,
  includeSection?: string
): string {
  let formatted = `${standard.name} (${standard.version})`

  if (includeSection) {
    formatted += ` - ${includeSection}`
  }

  return formatted
}
