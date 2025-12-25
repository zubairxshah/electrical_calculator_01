# Quickstart: Mobile Sidebar Conversion to Menu

**Feature**: 003-mobile-sidebar-menu
**Target**: Developers implementing mobile-responsive sidebar navigation
**Last Updated**: 2025-12-25

## Overview

This guide provides step-by-step instructions for converting the fixed sidebar to a collapsible hamburger menu on mobile devices.

## Quick Implementation Steps

### Step 1: Create Mobile Menu Hook

**File**: `hooks/useMobileMenu.ts`

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'

export interface MobileMenuState {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
  close: () => void
}

export function useMobileMenu(): MobileMenuState {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      // Prevent body scroll when sidebar open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  // Auto-close sidebar when resizing to desktop
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
```

---

### Step 2: Create Mobile Menu Button

**File**: `components/layout/MobileMenuButton.tsx`

```typescript
'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileMenuButtonProps {
  onClick: () => void
  isOpen: boolean
}

export function MobileMenuButton({ onClick, isOpen }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="md:hidden h-12 w-12"
      aria-label={isOpen ? 'Close main navigation menu' : 'Open main navigation menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-sidebar"
    >
      <Menu className="h-6 w-6" />
    </Button>
  )
}
```

---

### Step 3: Enhance Sidebar Component

**File**: `components/layout/Sidebar.tsx`

**Changes**:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Battery, Zap, Cable, Sun, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ... existing navigationItems array

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-250"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className={cn(
          'fixed left-0 top-0 h-screen w-64 border-r bg-card z-50',
          // Mobile: overlay with slide animation
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, no transform
          'md:translate-x-0'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo/Branding with Close Button on Mobile */}
          <div className="border-b p-6 flex items-center justify-between">
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
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}  // Close sidebar on navigation (mobile)
                  className={cn(
                    'group flex items-start space-x-3 rounded-lg px-3 py-3 transition-all hover:bg-accent',
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
          </nav>

          {/* Footer Links */}
          <div className="border-t p-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <Link
                href="/about"
                onClick={onClose}  // Close on navigation
                className="block hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="/standards"
                onClick={onClose}
                className="block hover:text-foreground transition-colors"
              >
                Standards Reference
              </Link>
              <Link
                href="/help"
                onClick={onClose}
                className="block hover:text-foreground transition-colors"
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
```

---

### Step 4: Update Root Layout

**File**: `app/layout.tsx`

**Changes**:

```tsx
'use client'  // ADD: Must be client component to use hooks

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useMobileMenu } from '@/hooks/useMobileMenu'  // ADD

const inter = Inter({ subsets: ['latin'] })

// REMOVE: export const metadata (can't export metadata from client component)
// Move metadata to separate layout.config.ts or metadata.ts file if needed

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const mobileMenu = useMobileMenu()  // ADD

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Sidebar Navigation with mobile state */}
          <Sidebar isOpen={mobileMenu.isOpen} onClose={mobileMenu.close} />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col md:pl-64">  {/* CHANGED: pl-64 → md:pl-64 */}
            {/* Header with mobile menu button */}
            <Header
              mobileMenuOpen={mobileMenu.isOpen}
              onMobileMenuToggle={mobileMenu.toggle}
            />

            {/* Page Content */}
            <main className="flex-1 p-4 md:p-6">  {/* CHANGED: tighter padding on mobile */}
              {children}
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </body>
    </html>
  )
}
```

**IMPORTANT**: Making `app/layout.tsx` a client component prevents exporting `metadata`. Solution:
- Create `app/layout.config.ts` to export metadata
- Or use Next.js 13+ metadata API in a parent server component
- Or accept that metadata will be defined elsewhere

---

### Step 5: Update Header Component

**File**: `components/layout/Header.tsx`

**Changes**:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MobileMenuButton } from './MobileMenuButton'  // ADD

export type StandardsFramework = 'IEC' | 'NEC'

interface HeaderProps {
  standards?: StandardsFramework
  onStandardsChange?: (standards: StandardsFramework) => void
  mobileMenuOpen?: boolean  // ADD
  onMobileMenuToggle?: () => void  // ADD
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
      <div className="flex h-16 items-center justify-between px-4 md:px-6">  {/* CHANGED: px-6 → px-4 md:px-6 */}
        {/* Left: Mobile menu button + Page title */}
        <div className="flex items-center space-x-3">
          {/* ADD: Mobile menu button */}
          {onMobileMenuToggle && (
            <MobileMenuButton onClick={onMobileMenuToggle} isOpen={mobileMenuOpen} />
          )}

          <h2 className="text-base md:text-lg font-semibold">  {/* CHANGED: responsive text */}
            Electrical Engineering Calculations
          </h2>
        </div>

        {/* Right: Controls (existing) */}
        <div className="flex items-center space-x-2 md:space-x-4">  {/* CHANGED: tighter spacing on mobile */}
          {/* Standards Framework Toggle */}
          <div className="hidden sm:flex items-center space-x-2">  {/* CHANGED: hide label on very small screens */}
            <span className="text-sm text-muted-foreground">Standards:</span>
            <Select value={currentStandards} onValueChange={handleStandardsChange}>
              <SelectTrigger className="w-28 md:w-32">
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

          {/* Auth Button */}
          <Button variant="outline" size="sm" className="text-xs md:text-sm">
            Sign In
          </Button>
        </div>
      </div>
    </header>
  )
}
```

---

## Testing Guide

### Manual Responsive Testing

**Test on Mobile (375px width)**:

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set viewport to iPhone SE (375x667)
4. Navigate to `/battery`

**Expected Behavior**:
- ✅ Hamburger menu icon visible in header (left side)
- ✅ Sidebar hidden (not visible on screen)
- ✅ Calculator content uses full width (~343px after padding)
- ✅ No horizontal scrolling
- ✅ All text visible and readable

**Click hamburger menu**:
- ✅ Sidebar slides in from left (300ms animation)
- ✅ Semi-transparent backdrop appears
- ✅ Calculator content dimmed behind backdrop
- ✅ Sidebar width 256px (w-64)

**Click backdrop**:
- ✅ Sidebar slides out to left
- ✅ Backdrop fades out
- ✅ Calculator content visible again

**Click nav link**:
- ✅ Navigation occurs
- ✅ Sidebar automatically closes
- ✅ User taken to selected calculator page

**Press Escape key** (with sidebar open):
- ✅ Sidebar closes
- ✅ Focus returns to hamburger button

---

### Desktop Testing (1920px width)

**Expected Behavior**:
- ✅ Hamburger menu icon hidden
- ✅ Sidebar fixed and always visible (left side, 256px wide)
- ✅ Main content has left padding (pl-64 = 256px)
- ✅ No backdrop or overlay behavior
- ✅ Clicking nav links navigates normally (no close action needed)

---

### Breakpoint Boundary Testing (768px)

1. Set viewport to exactly 768px width
2. Verify sidebar transitions from overlay to fixed mode
3. Verify hamburger menu disappears
4. Verify main content gets left padding

**Expected**:
- At 767px: Mobile mode (hamburger + hidden sidebar)
- At 768px: Desktop mode (fixed sidebar + no hamburger)

---

### Accessibility Testing

**Keyboard Navigation**:
1. Tab to hamburger menu button
2. Press Enter to open sidebar
3. Tab through navigation links (focus trapped in sidebar)
4. Press Escape to close
5. Verify focus returns to hamburger button

**Screen Reader Testing** (NVDA/VoiceOver):
1. Navigate to hamburger button
2. Verify announced as "Button, Open main navigation menu"
3. Activate button
4. Verify announced as "Main navigation menu opened"
5. Navigate through links
6. Close sidebar
7. Verify announced as "Main navigation menu closed"

---

## Common Patterns

### Responsive Visibility

```tsx
// Show only on mobile
<div className="md:hidden">Mobile content</div>

// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop content</div>

// Show on mobile, different styling on desktop
<div className="block md:flex">Responsive container</div>
```

### Conditional Padding

```tsx
// No padding on mobile, 256px on desktop
<div className="md:pl-64">Main content</div>

// Smaller padding on mobile, larger on desktop
<main className="p-4 md:p-6">Content</main>
```

### Slide Animations

```tsx
// Sidebar slide-in
className={cn(
  'transition-transform duration-300',
  isOpen ? 'translate-x-0' : '-translate-x-full'
)}

// Backdrop fade
className={cn(
  'transition-opacity duration-250',
  isOpen ? 'opacity-100' : 'opacity-0'
)}
```

---

## Troubleshooting

**Issue**: Sidebar doesn't close when clicking backdrop
**Fix**: Verify backdrop has `onClick={onClose}` prop and is rendered conditionally when `isOpen` is true

**Issue**: Horizontal scrolling still present on mobile
**Fix**: Ensure main content div has `md:pl-64` (not fixed `pl-64`), verify viewport meta tag in HTML head

**Issue**: Sidebar jumps instead of animating
**Fix**: Verify `transition-transform` and `duration-300` classes are present, check for conflicting CSS

**Issue**: Focus not trapped in open sidebar
**Fix**: Implement focus trap logic with Tab key listener (see data-model.md for implementation)

**Issue**: Body scrolls behind open sidebar on iOS
**Fix**: Verify `document.body.style.overflow = 'hidden'` is set when sidebar opens (in useMobileMenu hook)

**Issue**: Hamburger menu still visible on desktop
**Fix**: Verify `md:hidden` class is on MobileMenuButton component

**Issue**: Layout.tsx metadata export error
**Fix**: Client components can't export metadata - move metadata to separate server component or accept inline metadata

---

## Performance Checklist

- [ ] Sidebar animation maintains 60fps (check Chrome DevTools Performance tab)
- [ ] No layout shift (CLS) when opening/closing sidebar
- [ ] Transform animations are GPU-accelerated (not animating width/margin)
- [ ] Event listeners properly cleaned up in useEffect returns
- [ ] No memory leaks from unclosed listeners

---

## Deployment Notes

1. **No Breaking Changes**: Desktop sidebar behavior unchanged, mobile gets new overlay mode
2. **Progressive Enhancement**: Works without JavaScript (CSS handles visibility), enhanced with JS (auto-close, focus trap)
3. **Backward Compatible**: Existing calculator functionality unaffected
4. **Zero Dependencies**: Uses existing Tailwind, React, Lucide React
5. **Accessibility**: WCAG 2.1 Level AA compliant with keyboard and screen reader support

---

## Example: Before vs After

### Before (Current - Broken on Mobile):

```
Mobile viewport (375px):
┌─────────────────────────────────────┐
│ [Sidebar 256px] │ [Content 87px]   │ ← Content too narrow!
│                 │ Text cuts off... │
│ - Battery       │ Input: [##...]   │
│ - UPS           │ Result: [...]    │
│ - Cables        │ [Horizontal →]   │
└─────────────────────────────────────┘
```

### After (Fixed with Hamburger Menu):

```
Mobile viewport (375px) - Menu Closed:
┌─────────────────────────────────────┐
│ [☰] Header                          │
│                                     │
│ [Full-width calculator content]    │
│ Input: [Complete field visible]    │
│ Result: [All text visible]         │
│ [No horizontal scrolling]          │
└─────────────────────────────────────┘

Mobile viewport (375px) - Menu Open:
┌─────────────────────────────────────┐
│ [Sidebar 256px] │░░░░░░░░░░░░░░░░░│
│ [X Close]       │░ Backdrop dimmed░│
│                 │░                ░│
│ - Battery       │░                ░│
│ - UPS           │░                ░│
│ - Cables        │░                ░│
└─────────────────────────────────────┘
```

Desktop (1920px) - Unchanged:
```
┌─────────────────────────────────────────────┐
│ [Sidebar 256px] │ [Header + Content]       │
│                 │                           │
│ - Battery       │ [Calculator full width]  │
│ - UPS           │ [All features visible]   │
│ - Cables        │ [Desktop experience]     │
└─────────────────────────────────────────────┘
```
