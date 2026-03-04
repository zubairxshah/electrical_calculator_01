/**
 * Load Type Selector Component
 *
 * Card-based selector for General / Motor / HVAC load types.
 *
 * @module LoadTypeSelector
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Zap, Settings, Wind } from 'lucide-react';
import type { MotorBreakerLoadType } from '@/types/motor-breaker-calculator';

interface LoadTypeSelectorProps {
  value: MotorBreakerLoadType;
  onChange: (type: MotorBreakerLoadType) => void;
}

const loadTypes: {
  value: MotorBreakerLoadType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'general',
    label: 'General',
    description: 'Standard continuous loads',
    icon: Zap,
  },
  {
    value: 'motor',
    label: 'Motor',
    description: 'NEC 430.52 / IEC categories',
    icon: Settings,
  },
  {
    value: 'hvac',
    label: 'HVAC',
    description: 'NEC 440 MCA/MOP',
    icon: Wind,
  },
];

export function LoadTypeSelector({ value, onChange }: LoadTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {loadTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;

        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-background'
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6 mb-1',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                isSelected ? 'text-primary' : 'text-foreground'
              )}
            >
              {type.label}
            </span>
            <span className="text-xs text-muted-foreground text-center mt-0.5">
              {type.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
