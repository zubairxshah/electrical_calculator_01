/**
 * Battery Comparison Tool Component
 *
 * Main component for comparing battery technologies with filtering
 * and application context selection
 *
 * @see specs/001-electromate-engineering-app/spec.md#US6
 */

'use client'

import { useState, useMemo } from 'react'
import { CalculationCard } from '@/components/shared/CalculationCard'
import { BatteryComparisonTable } from './BatteryComparisonTable'
import { BatteryFilters } from './BatteryFilters'
import { BatteryDetailCard } from './BatteryDetailCard'
import { GlossaryDialog } from './GlossaryDialog'
import {
  ALL_BATTERY_TYPES,
  APPLICATION_CONTEXTS,
  getRecommendations,
  type ApplicationContext,
  type BatteryTypeSpec,
  type BatteryRecommendation,
} from '@/lib/standards/batteryTypes'
import { Button } from '@/components/ui/button'
import { BookOpen, RotateCcw } from 'lucide-react'

export interface FilterState {
  application: ApplicationContext | 'all'
  minTemp: number | undefined
  maxTemp: number | undefined
  minDoD: number | undefined
  maxInitialCost: number | undefined
  prioritizeCycleLife: boolean
  prioritizeEfficiency: boolean
  categories: string[]
}

const defaultFilters: FilterState = {
  application: 'all',
  minTemp: undefined,
  maxTemp: undefined,
  minDoD: undefined,
  maxInitialCost: undefined,
  prioritizeCycleLife: false,
  prioritizeEfficiency: false,
  categories: [],
}

export function BatteryComparisonTool() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [selectedBattery, setSelectedBattery] = useState<BatteryTypeSpec | null>(null)
  const [showGlossary, setShowGlossary] = useState(false)

  // Calculate recommendations based on filters
  const recommendations = useMemo<BatteryRecommendation[]>(() => {
    if (filters.application === 'all') {
      // Return all batteries with basic scoring
      return ALL_BATTERY_TYPES.map((battery) => ({
        battery,
        score: 50,
        reasons: [],
      }))
    }

    return getRecommendations(filters.application, {
      minTemp: filters.minTemp,
      maxTemp: filters.maxTemp,
      minDoD: filters.minDoD,
      maxInitialCost: filters.maxInitialCost,
      prioritizeCycleLife: filters.prioritizeCycleLife,
      prioritizeEfficiency: filters.prioritizeEfficiency,
    })
  }, [filters])

  // Filter by category if selected
  const filteredRecommendations = useMemo(() => {
    if (filters.categories.length === 0) {
      return recommendations
    }
    return recommendations.filter((rec) => filters.categories.includes(rec.battery.category))
  }, [recommendations, filters.categories])

  const resetFilters = () => {
    setFilters(defaultFilters)
    setSelectedBattery(null)
  }

  const standardsUsed = ['IEEE 1188-2005', 'IEEE 1106-2015', 'IEC 62619', 'IEC 60896']

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <CalculationCard
        title="Application & Requirements"
        description="Select your application context and requirements to get tailored recommendations"
        standardsUsed={standardsUsed}
        className="p-4 md:p-6"
      >
        <BatteryFilters filters={filters} onFiltersChange={setFilters} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="gap-2 transition-all duration-200 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowGlossary(true)}
            className="gap-2 transition-all duration-200 active:scale-95"
          >
            <BookOpen className="h-4 w-4" />
            Glossary
          </Button>
        </div>
      </CalculationCard>

      {/* Application Context Info */}
      {filters.application !== 'all' && (
        <CalculationCard
          title={APPLICATION_CONTEXTS[filters.application].name}
          description={APPLICATION_CONTEXTS[filters.application].description}
          className="p-4 md:p-6"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">Key Priorities:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {APPLICATION_CONTEXTS[filters.application].priorities.map((priority, index) => (
                <li key={index}>{priority}</li>
              ))}
            </ul>
          </div>
        </CalculationCard>
      )}

      {/* Comparison Table */}
      <CalculationCard
        title="Battery Technology Comparison"
        description={`Comparing ${filteredRecommendations.length} battery types${filters.application !== 'all' ? ' ranked by suitability' : ''}`}
        className="p-4 md:p-6"
      >
        <BatteryComparisonTable
          recommendations={filteredRecommendations}
          showScores={filters.application !== 'all'}
          onSelectBattery={setSelectedBattery}
          selectedBatteryId={selectedBattery?.id}
        />
      </CalculationCard>

      {/* Selected Battery Detail */}
      {selectedBattery && (
        <BatteryDetailCard
          battery={selectedBattery}
          onClose={() => setSelectedBattery(null)}
        />
      )}

      {/* Glossary Dialog */}
      <GlossaryDialog open={showGlossary} onOpenChange={setShowGlossary} />

      {/* Disclaimer */}
      <CalculationCard title="Important Notes" className="p-4 md:p-6">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Data Sources:</strong> Specifications are based on industry averages and may
            vary by manufacturer. Always verify with manufacturer datasheets for specific products.
          </p>
          <p>
            <strong>Application Suitability:</strong> Recommendations are general guidelines. Actual
            suitability depends on specific system requirements, installation conditions, and local
            regulations.
          </p>
          <p>
            <strong>Standards Reference:</strong> Data compiled from IEEE 1188-2005 (VRLA), IEEE
            1106-2015 (NiCd), IEC 62619 (Li-ion safety), and manufacturer documentation.
          </p>
        </div>
      </CalculationCard>
    </div>
  )
}
