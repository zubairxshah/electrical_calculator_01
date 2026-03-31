// Fuel Consumption Estimation — ISO 8528-5

import type {
  FuelConfig,
  GeneratorConfig,
  FuelResult,
} from '@/types/generator-sizing'
import { interpolateSfc, litersToGallons } from './generatorData'

/**
 * Estimate fuel consumption rate and required tank volume.
 * Uses standard SFC curves for diesel and natural gas.
 */
export function calculateFuelConsumption(
  generatorKva: number,
  combinedPf: number,
  fuelConfig: FuelConfig,
  generatorConfig: GeneratorConfig
): FuelResult {
  const generatorKw = generatorKva * combinedPf
  const loadKw = generatorKw * (fuelConfig.averageLoadingPercent / 100)

  // Get specific fuel consumption for this loading percentage
  const sfc = interpolateSfc(fuelConfig.averageLoadingPercent, generatorConfig.fuelType)

  // Consumption rate
  // For diesel: L/hr = SFC (L/kW/hr) × kW at load
  // For gas: m³/hr = SFC (m³/kW/hr) × kW at load
  const consumptionRate = sfc * loadKw

  // Total fuel required with 10% reserve
  const baseFuel = consumptionRate * fuelConfig.requiredRuntime
  const reserveVolume = baseFuel * 0.10
  const totalFuel = baseFuel + reserveVolume

  return {
    fuelType: generatorConfig.fuelType,
    consumptionRate: Math.round(consumptionRate * 100) / 100,
    consumptionRateImperial: Math.round(litersToGallons(consumptionRate) * 100) / 100,
    totalFuelRequired: Math.round(totalFuel * 100) / 100,
    totalFuelRequiredImperial: Math.round(litersToGallons(totalFuel) * 100) / 100,
    reserveVolume: Math.round(reserveVolume * 100) / 100,
    runtimeHours: fuelConfig.requiredRuntime,
    loadingPercent: fuelConfig.averageLoadingPercent,
    sfcUsed: Math.round(sfc * 10000) / 10000,
  }
}
