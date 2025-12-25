'use client'

import { useState, useCallback, useEffect } from 'react'

/**
 * Mobile menu state interface
 */
export interface MobileMenuState {
  /** Whether the mobile sidebar overlay is currently open */
  isOpen: boolean
  /** Set the open state directly */
  setIsOpen: (open: boolean) => void
  /** Toggle between open and closed states */
  toggle: () => void
  /** Close the sidebar (convenience method) */
  close: () => void
}

/**
 * Custom hook for managing mobile sidebar menu state
 *
 * Provides:
 * - Open/closed state management
 * - Escape key listener to close sidebar
 * - Window resize listener to auto-close on desktop breakpoint
 * - Body scroll locking when sidebar is open
 *
 * @returns MobileMenuState with isOpen, toggle, and close methods
 *
 * @example
 * const mobileMenu = useMobileMenu()
 * <MobileMenuButton onClick={mobileMenu.toggle} isOpen={mobileMenu.isOpen} />
 * <Sidebar isOpen={mobileMenu.isOpen} onClose={mobileMenu.close} />
 */
export function useMobileMenu(): MobileMenuState {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Close sidebar on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      // Prevent body scroll when sidebar is open (iOS Safari scroll bleed prevention)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  // Auto-close sidebar when resizing to desktop breakpoint (≥768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        close()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, close])

  return { isOpen, setIsOpen, toggle, close }
}
