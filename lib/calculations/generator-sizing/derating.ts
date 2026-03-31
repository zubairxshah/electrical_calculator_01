// Altitude and Temperature Derating — ISO 8528-1

import type { SiteConditions, DeratingResult } from '@/types/generator-sizing'

/**
 * Calculate altitude and temperature derating per ISO 8528-1.
 *
 * Reference conditions: 25°C ambient, 1000m altitude.
 * - Altitude: ~3.5% per 300m above 1000m
 * - Temperature: ~2% per 5°C above 25°C
 * - Combined: multiplicative (not additive)
 */
export function calculateDerating(siteConditions: SiteConditions): DeratingResult {
  // Altitude derating
  let altitudeFactor = 1.0
  let altitudeApplied = false
  if (siteConditions.altitude > 1000) {
    altitudeFactor = 1 - (0.035 * (siteConditions.altitude - 1000) / 300)
    altitudeFactor = Math.max(altitudeFactor, 0.1) // floor at 10%
    altitudeApplied = true
  }

  // Temperature derating
  let temperatureFactor = 1.0
  let temperatureApplied = false
  if (siteConditions.ambientTemperature > 25) {
    temperatureFactor = 1 - (0.02 * (siteConditions.ambientTemperature - 25) / 5)
    temperatureFactor = Math.max(temperatureFactor, 0.1) // floor at 10%
    temperatureApplied = true
  }

  // Combined — multiplicative per ISO 8528-1
  const combinedFactor = altitudeFactor * temperatureFactor

  return {
    altitudeFactor: Math.round(altitudeFactor * 10000) / 10000,
    temperatureFactor: Math.round(temperatureFactor * 10000) / 10000,
    combinedFactor: Math.round(combinedFactor * 10000) / 10000,
    altitudeApplied,
    temperatureApplied,
  }
}
