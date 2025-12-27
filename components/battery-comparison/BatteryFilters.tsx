/**
 * Battery Filters Component
 *
 * Filter controls for battery comparison tool
 *
 * @see specs/001-electromate-engineering-app/spec.md#US6
 */

'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { InputField } from '@/components/shared/InputField'
import { APPLICATION_CONTEXTS, type ApplicationContext } from '@/lib/standards/batteryTypes'
import type { FilterState } from './BatteryComparisonTool'

interface BatteryFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}

const categories = ['Lead-Acid', 'Lithium-Ion', 'Nickel-Based', 'Flow'] as const

export function BatteryFilters({ filters, onFiltersChange }: BatteryFiltersProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleCategory = (category: string) => {
    const current = filters.categories
    if (current.includes(category)) {
      updateFilter(
        'categories',
        current.filter((c) => c !== category)
      )
    } else {
      updateFilter('categories', [...current, category])
    }
  }

  return (
    <div className="space-y-6">
      {/* Application Context */}
      <div className="space-y-2">
        <Label>Application Context</Label>
        <Select
          value={filters.application}
          onValueChange={(value) => updateFilter('application', value as ApplicationContext | 'all')}
        >
          <SelectTrigger className="h-12 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none">
            <SelectValue placeholder="Select application" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            {Object.entries(APPLICATION_CONTEXTS).map(([key, context]) => (
              <SelectItem key={key} value={key}>
                {context.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select an application to get ranked recommendations
        </p>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <Label>Battery Categories</Label>
        <div className="flex flex-wrap gap-4">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <label
                htmlFor={`category-${category}`}
                className="text-sm cursor-pointer"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Leave unchecked to show all categories
        </p>
      </div>

      {/* Temperature Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <InputField
            label="Minimum Operating Temperature"
            value={filters.minTemp ?? ''}
            onChange={(value) => updateFilter('minTemp', value ? Number(value) : undefined)}
            type="number"
            unit="°C"
            placeholder="-20"
          />
          <p className="text-xs text-muted-foreground">
            Coldest expected temperature
          </p>
        </div>
        <div className="space-y-2">
          <InputField
            label="Maximum Operating Temperature"
            value={filters.maxTemp ?? ''}
            onChange={(value) => updateFilter('maxTemp', value ? Number(value) : undefined)}
            type="number"
            unit="°C"
            placeholder="45"
          />
          <p className="text-xs text-muted-foreground">
            Hottest expected temperature
          </p>
        </div>
      </div>

      {/* DoD and Cost Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <InputField
            label="Minimum Depth of Discharge"
            value={filters.minDoD ?? ''}
            onChange={(value) => updateFilter('minDoD', value ? Number(value) : undefined)}
            type="number"
            unit="%"
            placeholder="80"
          />
          <p className="text-xs text-muted-foreground">
            Required daily cycling depth
          </p>
        </div>
        <div className="space-y-2">
          <Label>Maximum Initial Cost</Label>
          <Select
            value={filters.maxInitialCost?.toString() ?? 'any'}
            onValueChange={(value) =>
              updateFilter('maxInitialCost', value === 'any' ? undefined : Number(value))
            }
          >
            <SelectTrigger className="h-12 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none">
              <SelectValue placeholder="Any budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Budget</SelectItem>
              <SelectItem value="2">Budget (VRLA level)</SelectItem>
              <SelectItem value="4">Moderate (Li-Ion level)</SelectItem>
              <SelectItem value="6">Premium (LTO level)</SelectItem>
              <SelectItem value="10">Unlimited</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Relative cost index (1-10)
          </p>
        </div>
      </div>

      {/* Priority Checkboxes */}
      <div className="space-y-3">
        <Label>Optimization Priorities</Label>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prioritize-cycle-life"
              checked={filters.prioritizeCycleLife}
              onCheckedChange={(checked: boolean | 'indeterminate') => updateFilter('prioritizeCycleLife', checked === true)}
            />
            <label htmlFor="prioritize-cycle-life" className="text-sm cursor-pointer">
              Prioritize Cycle Life
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prioritize-efficiency"
              checked={filters.prioritizeEfficiency}
              onCheckedChange={(checked: boolean | 'indeterminate') => updateFilter('prioritizeEfficiency', checked === true)}
            />
            <label htmlFor="prioritize-efficiency" className="text-sm cursor-pointer">
              Prioritize Efficiency
            </label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Enable to boost ranking for batteries excelling in these areas
        </p>
      </div>
    </div>
  )
}
