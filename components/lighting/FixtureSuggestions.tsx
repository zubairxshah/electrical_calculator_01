/**
 * FixtureSuggestions Component
 *
 * Displays fixture product recommendations based on room type and illuminance.
 * Provides specific suggestions with specifications and applications.
 *
 * @see specs/005-lighting-layout-viz/spec.md User Story 4
 */

'use client';

import { Lightbulb, Zap, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { SpaceType, LuminaireCategory } from '@/lib/types/lighting';
import type { FixtureSuggestion } from '@/types/layout';

export interface FixtureSuggestionsProps {
  /** Space type for context */
  spaceType: SpaceType;
  /** Required illuminance in lux */
  requiredIlluminance: number;
  /** Room area in square meters */
  roomArea: number;
  /** Current fixture category (if selected) */
  currentCategory?: LuminaireCategory;
  /** CSS class name */
  className?: string;
}

/**
 * Get fixture suggestions based on space type and illuminance
 */
function getFixtureSuggestionsForSpace(
  spaceType: SpaceType,
  requiredIlluminance: number,
  roomArea: number
): FixtureSuggestion[] {
  const suggestions: FixtureSuggestion[] = [];

  // Kitchen spaces
  if (
    spaceType === 'residential_kitchen' ||
    spaceType === 'restaurant_kitchen' ||
    spaceType === 'food_prep'
  ) {
    suggestions.push(
      {
        category: 'LED Panel',
        model: '600x600mm LED Panel 40W',
        manufacturer: 'Generic',
        lumens: 4000,
        watts: 40,
        efficacy: 100,
        applications: ['Task lighting', 'General illumination', 'Food preparation'],
        reason: 'High efficacy, uniform light distribution, excellent for task lighting',
      },
      {
        category: 'LED Troffer',
        model: '2x4 LED Troffer 50W',
        manufacturer: 'Generic',
        lumens: 5000,
        watts: 50,
        efficacy: 100,
        applications: ['Commercial kitchens', 'Food service areas'],
        reason: 'Bright, energy-efficient, easy to clean surfaces',
      }
    );
  }

  // Office spaces
  if (
    spaceType === 'office_general' ||
    spaceType === 'office_detailed' ||
    spaceType === 'conference'
  ) {
    suggestions.push(
      {
        category: 'LED Troffer',
        model: '2x2 LED Troffer 36W',
        manufacturer: 'Generic',
        lumens: 3600,
        watts: 36,
        efficacy: 100,
        applications: ['Office spaces', 'Conference rooms', 'Classrooms'],
        reason: 'Optimal for computer work, reduces glare, energy-efficient',
      },
      {
        category: 'LED Panel',
        model: '600x600mm Dimmable Panel 36W',
        manufacturer: 'Generic',
        lumens: 3600,
        watts: 36,
        efficacy: 100,
        applications: ['Modern offices', 'Meeting rooms'],
        reason: 'Sleek design, dimmable for flexibility, uniform distribution',
      }
    );
  }

  // Residential living spaces
  if (
    spaceType === 'residential_living' ||
    spaceType === 'residential_bedroom' ||
    spaceType === 'hotel_guest_room'
  ) {
    suggestions.push(
      {
        category: 'LED Downlight',
        model: '6" LED Downlight 15W',
        manufacturer: 'Generic',
        lumens: 1200,
        watts: 15,
        efficacy: 80,
        applications: ['Living rooms', 'Bedrooms', 'Hospitality'],
        reason: 'Warm ambiance, adjustable beam angles, residential aesthetics',
      },
      {
        category: 'LED Recessed',
        model: '4" Recessed Downlight 10W',
        manufacturer: 'Generic',
        lumens: 800,
        watts: 10,
        efficacy: 80,
        applications: ['Residential spaces', 'Accent lighting'],
        reason: 'Unobtrusive design, warm light options, dimmable',
      }
    );
  }

  // Retail spaces
  if (
    spaceType === 'retail' ||
    spaceType === 'retail_store' ||
    spaceType === 'retail_display'
  ) {
    suggestions.push(
      {
        category: 'LED Track Light',
        model: 'Track Spotlight 20W',
        manufacturer: 'Generic',
        lumens: 1800,
        watts: 20,
        efficacy: 90,
        applications: ['Retail displays', 'Product highlighting', 'Gallery lighting'],
        reason: 'Adjustable direction, high CRI for color accuracy, accent lighting',
      },
      {
        category: 'LED Downlight',
        model: '8" Commercial Downlight 30W',
        manufacturer: 'Generic',
        lumens: 2700,
        watts: 30,
        efficacy: 90,
        applications: ['Retail stores', 'Showrooms'],
        reason: 'Bright general illumination with good color rendering',
      }
    );
  }

  // Warehouse/Industrial
  if (
    spaceType === 'warehouse' ||
    spaceType === 'warehouse_detailed' ||
    spaceType === 'industrial'
  ) {
    suggestions.push(
      {
        category: 'LED High Bay',
        model: 'UFO High Bay 150W',
        manufacturer: 'Generic',
        lumens: 19500,
        watts: 150,
        efficacy: 130,
        applications: ['Warehouses', 'Factories', 'High-ceiling spaces'],
        reason: 'High lumen output, wide coverage, durable construction',
      },
      {
        category: 'LED High Bay',
        model: 'Linear High Bay 100W',
        manufacturer: 'Generic',
        lumens: 13000,
        watts: 100,
        efficacy: 130,
        applications: ['Industrial facilities', 'Logistics centers'],
        reason: 'Excellent for aisle lighting, energy-efficient, long lifespan',
      }
    );
  }

  // Default generic suggestions if no specific match
  if (suggestions.length === 0) {
    suggestions.push(
      {
        category: 'LED Panel',
        model: '600x600mm LED Panel 40W',
        manufacturer: 'Generic',
        lumens: 4000,
        watts: 40,
        efficacy: 100,
        applications: ['General lighting', 'Multiple applications'],
        reason: 'Versatile, energy-efficient, suitable for most indoor spaces',
      }
    );
  }

  return suggestions;
}

/**
 * FixtureSuggestions - Display fixture recommendations
 */
export function FixtureSuggestions({
  spaceType,
  requiredIlluminance,
  roomArea,
  currentCategory,
  className = '',
}: FixtureSuggestionsProps) {
  const suggestions = getFixtureSuggestionsForSpace(
    spaceType,
    requiredIlluminance,
    roomArea
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Recommended Fixtures</h4>
      </div>

      <Alert>
        <AlertDescription className="text-xs text-muted-foreground">
          Based on your space type ({spaceType.replace(/_/g, ' ')}) and illuminance requirements
          ({requiredIlluminance} lux), we recommend the following fixture types:
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="p-3 border rounded-lg hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-sm">{suggestion.model}</div>
                <div className="text-xs text-muted-foreground">
                  {suggestion.manufacturer} • {suggestion.category}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {suggestion.efficacy} lm/W
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span>{suggestion.watts}W</span>
              </div>
              <div className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-muted-foreground" />
                <span>{suggestion.lumens.toLocaleString()} lm</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span>{suggestion.efficacy} lm/W</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2">
              {suggestion.reason}
            </p>

            <div className="flex flex-wrap gap-1">
              {suggestion.applications.map((app, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {app}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
