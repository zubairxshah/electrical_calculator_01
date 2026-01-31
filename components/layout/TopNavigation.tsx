'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Zap, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

/**
 * Top Navigation Component
 *
 * Modern top navigation inspired by pipe.com with dropdown menus
 * Features collapsible mobile menu and organized navigation groups
 */

interface NavItem {
  name: string
  href: string
  description?: string
  priority?: 'P1' | 'P2' | 'P3'
}

interface NavCategory {
  category: string
  items: NavItem[]
}

const navigationItems: NavCategory[] = [
  {
    category: 'Power Systems',
    items: [
      {
        name: 'Battery Calculator',
        href: '/battery',
        description: 'Backup time & capacity sizing',
        priority: 'P1',
      },
      {
        name: 'UPS Sizing',
        href: '/ups',
        description: 'UPS capacity & battery requirements',
        priority: 'P1',
      },
      {
        name: 'Circuit Breaker',
        href: '/breaker',
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
        description: 'Earthing conductor sizing (IEC/NEC)',
        priority: 'P1',
      },
      {
        name: 'Lightning Arrester',
        href: '/lightning-arrester',
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
        description: 'Conductor sizing & voltage drop',
        priority: 'P1',
      },
      {
        name: 'Lighting Design',
        href: '/lighting',
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
        description: 'Panel array configuration',
        priority: 'P2',
      },
      {
        name: 'Charge Controller',
        href: '/charge-controller',
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
        description: 'Compare battery technologies',
        priority: 'P3',
      },
    ]
  }
]

const footerLinks = [
  { name: 'About', href: '/about' },
  { name: 'Standards Reference', href: '/standards' },
  { name: 'Help & Documentation', href: '/help' },
]

export function TopNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown]
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdown(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">ElectroMate</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Engineering Calculations</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((category) => (
              <DropdownMenu
                key={category.category}
                open={openDropdown === category.category}
                onOpenChange={(open) => setOpenDropdown(open ? category.category : null)}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    {category.category}
                    <ChevronDown className="ml-1 h-4 w-4 transition-transform" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 p-0"
                  align="start"
                  ref={(el) => (dropdownRefs.current[category.category] = el)}
                >
                  <div className="p-2">
                    <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category.category}
                    </h3>
                    {category.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-start rounded-sm px-2 py-1.5 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.name}</span>
                            {item.priority && (
                              <span
                                className={`text-xs font-medium ml-2 ${
                                  item.priority === 'P1'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {item.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            {/* Search Button */}
            <Button variant="ghost" size="sm" className="ml-2 hidden md:flex">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex h-full flex-col">
                  {/* Mobile Header */}
                  <div className="border-b p-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Zap className="h-5 w-5" />
                      </div>
                      <span className="font-bold">ElectroMate</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-6">
                      {navigationItems.map((category) => (
                        <div key={category.category}>
                          <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {category.category}
                          </h3>
                          <div className="space-y-1">
                            {category.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-start rounded-lg px-3 py-2 text-sm transition-colors ${
                                  isActive(item.href)
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-accent'
                                }`}
                              >
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{item.name}</span>
                                    {item.priority && (
                                      <span
                                        className={`text-xs font-medium ${
                                          item.priority === 'P1'
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                        }`}
                                      >
                                        {item.priority}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Footer Links */}
                      <div className="border-t pt-4 mt-4">
                        <h3 className="mb-2 px-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Resources
                        </h3>
                        <div className="space-y-1">
                          {footerLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm hover:bg-accent"
                            >
                              {link.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Additional Action Buttons */}
            <Button variant="outline" size="sm" className="hidden md:flex">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}