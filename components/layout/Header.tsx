'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MobileMenuButton } from './MobileMenuButton'

/**
 * Header Component
 *
 * Provides:
 * - Unit system toggle (IEC/SI ↔ NEC/Imperial) per Constitution Principle IV
 * - User authentication status
 * - Quick settings access
 */

export type StandardsFramework = 'IEC' | 'NEC'

interface HeaderProps {
  standards?: StandardsFramework
  onStandardsChange?: (standards: StandardsFramework) => void
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
}

export function Header({
  standards = 'IEC',
  onStandardsChange,
  mobileMenuOpen = false,
  onMobileMenuToggle,
}: HeaderProps) {
  const [currentStandards, setCurrentStandards] = useState<StandardsFramework>(standards)

  const handleStandardsChange = (value: StandardsFramework) => {
    setCurrentStandards(value)
    onStandardsChange?.(value)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Mobile menu button + Page title */}
        <div className="flex items-center space-x-3">
          {/* Mobile menu button (visible on mobile only) */}
          {onMobileMenuToggle && (
            <MobileMenuButton onClick={onMobileMenuToggle} isOpen={mobileMenuOpen} />
          )}

          <h2 className="text-base md:text-lg font-semibold">Electrical Engineering Calculations</h2>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Standards Framework Toggle */}
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Standards:</span>
            <Select value={currentStandards} onValueChange={handleStandardsChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IEC">
                  <div className="flex flex-col">
                    <span className="font-medium">IEC/SI</span>
                    <span className="text-xs text-muted-foreground">mm², meters, °C</span>
                  </div>
                </SelectItem>
                <SelectItem value="NEC">
                  <div className="flex flex-col">
                    <span className="font-medium">NEC/US</span>
                    <span className="text-xs text-muted-foreground">AWG, feet, °F</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calculation Status Badge - hide on very small screens */}
          <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
            Anonymous Mode
          </Badge>

          {/* Auth Button (Future: Better Auth integration) */}
          <Button variant="outline" size="sm" className="text-xs md:text-sm">
            Sign In
          </Button>
        </div>
      </div>
    </header>
  )
}
