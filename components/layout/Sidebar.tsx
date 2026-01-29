'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Battery, Zap, Cable, Sun, Settings, Scale, X, CircuitBoard, Lightbulb, Zap as Ground, ChevronDown, ChevronRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMouseWheelScroll } from '@/hooks/useMouseWheelScroll'
import { motion } from 'framer-motion'

/**
 * Sidebar Navigation Component
 *
 * Provides organized navigation to all calculator tools with engineering-themed design
 * Highlights active route for user orientation
 */

const navigationItems = [
  {
    category: 'Power Systems',
    items: [
      {
        name: 'Battery Calculator',
        href: '/battery',
        icon: Battery,
        description: 'Backup time & capacity sizing',
        priority: 'P1',
      },
      {
        name: 'UPS Sizing',
        href: '/ups',
        icon: Zap,
        description: 'UPS capacity & battery requirements',
        priority: 'P1',
      },
      {
        name: 'Circuit Breaker',
        href: '/breaker',
        icon: CircuitBoard,
        description: 'Breaker sizing with NEC/IEC standards',
        priority: 'P1',
      },
    ]
  },
  {
    category: 'Protection & Safety',
    items: [
      {
        name: 'Earthing Conductor',
        href: '/earthing',
        icon: Ground,
        description: 'Earthing conductor sizing (IEC/NEC)',
        priority: 'P1',
      },
      {
        name: 'Lightning Arrester',
        href: '/lightning-arrester',
        icon: Shield,
        description: 'Surge protection per IEC 60099-4',
        priority: 'P1',
      },
    ]
  },
  {
    category: 'Design & Installation',
    items: [
      {
        name: 'Cable Sizing',
        href: '/cables',
        icon: Cable,
        description: 'Conductor sizing & voltage drop',
        priority: 'P1',
      },
      {
        name: 'Lighting Design',
        href: '/lighting',
        icon: Lightbulb,
        description: 'Indoor lighting calculations (IESNA)',
        priority: 'P1',
      },
    ]
  },
  {
    category: 'Renewable Energy',
    items: [
      {
        name: 'Solar Array',
        href: '/solar',
        icon: Sun,
        description: 'Panel array configuration',
        priority: 'P2',
      },
      {
        name: 'Charge Controller',
        href: '/charge-controller',
        icon: Settings,
        description: 'Controller sizing & selection',
        priority: 'P2',
      },
    ]
  },
  {
    category: 'Analysis Tools',
    items: [
      {
        name: 'Battery Comparison',
        href: '/battery-comparison',
        icon: Scale,
        description: 'Compare battery technologies',
        priority: 'P3',
      },
    ]
  }
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLElement>(null)
  const scrollContainerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Power Systems': true,
    'Protection & Safety': true,
    'Design & Installation': true,
    'Renewable Energy': true,
    'Analysis Tools': true,
  })

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // Persist scroll position across page navigations
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const storedScrollPos = sessionStorage.getItem(`sidebar-scroll-${pathname}`);
    if (storedScrollPos) {
      scrollContainerRef.current.scrollTop = parseInt(storedScrollPos, 10);
    }

    const handleScroll = () => {
      if (scrollContainerRef.current) {
        sessionStorage.setItem(`sidebar-scroll-${pathname}`, scrollContainerRef.current.scrollTop.toString());
      }
    };

    const scrollElement = scrollContainerRef.current;
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  // Apply mouse wheel scrolling to the navigation container
  useMouseWheelScroll({
    targetRef: scrollContainerRef,
    enabled: isOpen,
    sensitivity: 1.2,
    smoothScroll: true,
    smoothDuration: 150
  });

  // Focus trap: cycle through focusable elements when Tab is pressed
  useEffect(() => {
    if (!isOpen) return

    const sidebar = sidebarRef.current
    if (!sidebar) return

    // Focus close button when sidebar opens (for accessibility)
    closeButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = sidebar.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: go to last element if at first
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: go to first element if at last
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      {/* Backdrop (mobile only, shown when sidebar open) */}
      {/* GPU-accelerated opacity transition for smooth 60fps animation */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      {/* GPU-accelerated transform animation (uses compositor, not main thread) for smooth 60fps */}
      <aside
        ref={sidebarRef}
        id="mobile-sidebar"
        className={cn(
          'fixed left-0 top-0 h-screen w-64 border-r bg-card z-50',
          // Mobile: overlay with GPU-accelerated slide animation
          'transform transition-transform duration-300 ease-in-out will-change-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, no transform
          'md:translate-x-0'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo/Branding with Close Button on Mobile */}
          <div className="border-b p-[0.63rem] flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">ElectroMate</h1>
                <p className="text-xs text-muted-foreground">Engineering Calculations</p>
              </div>
            </Link>

            {/* Close button (mobile only) */}
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden h-11 w-11"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4"
          >
            {navigationItems.map((categoryGroup) => (
              <div key={categoryGroup.category} className="mb-4">
                <button
                  onClick={() => toggleCategory(categoryGroup.category)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-expanded={expandedCategories[categoryGroup.category]}
                  aria-controls={`category-${categoryGroup.category.replace(/\s+/g, '-')}`}
                >
                  <span>{categoryGroup.category}</span>
                  {expandedCategories[categoryGroup.category] ?
                    <ChevronDown className="h-4 w-4" /> :
                    <ChevronRight className="h-4 w-4" />
                  }
                </button>

                {expandedCategories[categoryGroup.category] && (
                  <div
                    id={`category-${categoryGroup.category.replace(/\s+/g, '-')}`}
                    className="mt-2 space-y-1"
                  >
                    {categoryGroup.items.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex items-start space-x-3 rounded-lg px-3 py-2 transition-all hover:bg-accent',
                            isActive && 'bg-accent text-accent-foreground'
                          )}
                        >
                          <Icon
                            className={cn(
                              'mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-accent-foreground',
                              isActive && 'text-accent-foreground'
                            )}
                          />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.name}</span>
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  item.priority === 'P1'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {item.priority}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer Links */}
          <div className="border-t p-4 pb-6">
            <div className="space-y-2 text-xs text-muted-foreground">
              <Link
                href="/about"
                onClick={onClose}
                className="block hover:text-foreground transition-colors truncate"
              >
                About
              </Link>
              <Link
                href="/standards"
                onClick={onClose}
                className="block hover:text-foreground transition-colors truncate"
              >
                Standards Reference
              </Link>
              <Link
                href="/help"
                onClick={onClose}
                className="block hover:text-foreground transition-colors truncate"
              >
                Help & Documentation
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
