'use client'

import { forwardRef } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Mobile Menu Button (Hamburger Icon)
 *
 * Displays on mobile (<768px) to toggle sidebar navigation overlay
 * Hidden on desktop where sidebar is always visible
 *
 * Touch target: 48x48px (exceeds WCAG 2.1 AAA 44px minimum)
 * Keyboard accessible: Enter/Space to activate
 */

interface MobileMenuButtonProps {
  /** Click handler to toggle sidebar */
  onClick: () => void
  /** Current open state (for aria-expanded attribute) */
  isOpen: boolean
  /** Additional CSS classes */
  className?: string
}

export const MobileMenuButton = forwardRef<HTMLButtonElement, MobileMenuButtonProps>(
  function MobileMenuButton({ onClick, isOpen, className }, ref) {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={`md:hidden h-12 w-12 ${className || ''}`}
        aria-label={isOpen ? 'Close main navigation menu' : 'Open main navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu className="h-6 w-6" />
      </Button>
    )
  }
)
