# Data Model: Mobile Sidebar Conversion to Menu

**Feature**: 003-mobile-sidebar-menu
**Date**: 2025-12-25
**Status**: Complete

## Overview

This document defines TypeScript interfaces and state management structures for the mobile sidebar navigation enhancement. Since this is primarily a UI/layout feature, the data model focuses on component state and props rather than business entities.

## Core Interfaces

### MobileMenuState

Represents the state and actions for mobile sidebar menu management.

```typescript
interface MobileMenuState {
  /** Whether the mobile sidebar overlay is currently open */
  isOpen: boolean

  /** Set the open state directly */
  setIsOpen: (open: boolean) => void

  /** Toggle between open and closed states */
  toggle: () => void

  /** Close the sidebar (convenience method) */
  close: () => void
}
```

**Rationale**: Separates state from behavior. Provides both imperative (`setIsOpen`) and declarative (`toggle`, `close`) APIs for flexibility.

**Usage**: Returned by `useMobileMenu` custom hook, consumed by layout components.

---

### SidebarProps (Enhanced)

Enhanced props for the Sidebar component to support mobile overlay mode.

```typescript
interface SidebarProps {
  /** Mobile mode: controls visibility of sidebar overlay */
  isOpen?: boolean

  /** Mobile mode: callback when sidebar should close (nav click, backdrop click) */
  onClose?: () => void

  /** Additional CSS classes */
  className?: string
}
```

**Changes from Current**:
- **Added**: `isOpen` - Controls sidebar visibility on mobile
- **Added**: `onClose` - Callback for closing sidebar on mobile
- **Existing**: No current props (Sidebar is stateless currently)

**Behavior**:
- **Desktop (≥768px)**: `isOpen` and `onClose` ignored, sidebar always visible
- **Mobile (<768px)**: `isOpen` controls overlay visibility, `onClose` called on nav clicks

---

### MobileMenuButtonProps

Props for the hamburger menu button component.

```typescript
interface MobileMenuButtonProps {
  /** Click handler to toggle sidebar */
  onClick: () => void

  /** Current open state (for aria-expanded attribute) */
  isOpen: boolean

  /** Accessible label for screen readers */
  'aria-label'?: string

  /** Additional CSS classes */
  className?: string
}
```

**Default Values**:
- `aria-label`: "Open main navigation menu" (when closed) / "Close main navigation menu" (when open)

**Touch Target Requirements**:
- Minimum size: 44x44px (WCAG 2.1 Level AAA)
- Recommended: 48x48px for better touch ergonomics
- Implementation: `h-12 w-12` Tailwind classes (48px)

---

### HeaderProps (Enhanced)

Enhanced Header component props to include mobile menu button.

```typescript
interface HeaderProps {
  /** Current standards framework */
  standards?: StandardsFramework

  /** Callback when standards change */
  onStandardsChange?: (standards: StandardsFramework) => void

  /** NEW: Mobile menu open state for hamburger button */
  mobileMenuOpen?: boolean

  /** NEW: Callback to toggle mobile menu */
  onMobileMenuToggle?: () => void
}
```

**Changes**:
- **Added**: `mobileMenuOpen` - Passed from layout to control hamburger button state
- **Added**: `onMobileMenuToggle` - Callback from layout's `useMobileMenu` hook

---

## Component State Transitions

### Mobile Sidebar States

```typescript
type MobileSidebarState = 'closed' | 'opening' | 'open' | 'closing'
```

**State Transitions**:

```
closed → (user clicks hamburger) → opening → (300ms animation) → open
open → (user clicks backdrop/close/nav) → closing → (300ms animation) → closed
closed → (user resizes to desktop) → [no transition, sidebar becomes fixed]
open → (user resizes to desktop) → closing → closed → [sidebar becomes fixed]
```

**Implementation Note**: Explicit state machine not needed. CSS transitions handle `opening`/`closing` automatically. Component only tracks `isOpen` boolean.

---

## Responsive Behavior Matrix

### Sidebar Display Modes

| Viewport Width | Mode | Position | Visibility | Z-Index | Transform |
|----------------|------|----------|------------|---------|-----------|
| <768px closed | Overlay | `fixed inset-y-0 left-0` | Hidden | 50 | `translate-x-[-100%]` |
| <768px open | Overlay | `fixed inset-y-0 left-0` | Visible | 50 | `translate-x-0` |
| ≥768px | Fixed | `fixed left-0 top-0` | Always visible | auto | `translate-x-0` |

### Main Content Padding

| Viewport Width | Padding Left | Rationale |
|----------------|-------------|-----------|
| <768px | 0 (`pl-0`) | Sidebar hidden, use full width |
| ≥768px | 256px (`pl-64`) | Sidebar fixed, accommodate 256px width |

### Backdrop Display

| Condition | Visibility | Opacity | Z-Index | Click Action |
|-----------|-----------|---------|---------|--------------|
| Mobile closed | Hidden | 0 | - | None |
| Mobile open | Visible | 0.5 | 40 | Close sidebar |
| Desktop | Hidden | 0 | - | None |

---

## Animation Specifications

### Sidebar Slide Animation

```typescript
// Tailwind classes
className={cn(
  'transform transition-transform duration-300 ease-in-out',
  isOpen ? 'translate-x-0' : '-translate-x-full'
)}
```

**Timing**: 300ms duration
**Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
**Property**: `transform` (GPU-accelerated for 60fps)

### Backdrop Fade Animation

```typescript
// Tailwind classes
className={cn(
  'transition-opacity duration-250 ease-in-out',
  isOpen ? 'opacity-100' : 'opacity-0'
)}
```

**Timing**: 250ms duration
**Easing**: Same as sidebar for visual consistency
**Property**: `opacity`

---

## Accessibility Specifications

### ARIA Attributes

**Hamburger Menu Button**:
```tsx
<button
  aria-label="Open main navigation menu"
  aria-expanded={isOpen}
  aria-controls="mobile-sidebar"
  className="md:hidden h-12 w-12"
>
  <Menu className="h-6 w-6" />
</button>
```

**Sidebar**:
```tsx
<aside
  id="mobile-sidebar"
  role="navigation"
  aria-label="Main navigation"
  className={...}
>
  {/* Navigation content */}
</aside>
```

**Close Button** (mobile only):
```tsx
<button
  aria-label="Close navigation menu"
  onClick={onClose}
  className="md:hidden h-11 w-11"
>
  <X className="h-5 w-5" />
</button>
```

### Keyboard Navigation

| Key | Action | Condition |
|-----|--------|-----------|
| Tab | Cycle through nav links | Sidebar open, focus trapped |
| Shift+Tab | Reverse cycle | Sidebar open, focus trapped |
| Escape | Close sidebar | Sidebar open |
| Enter/Space | Activate link | Focus on nav item |
| Enter/Space | Toggle sidebar | Focus on hamburger button |

### Screen Reader Announcements

**On Sidebar Open**:
- Announce: "Main navigation menu opened"
- Focus moves to first nav link

**On Sidebar Close**:
- Announce: "Main navigation menu closed"
- Focus returns to hamburger menu button

---

## Integration Points

### Existing Components to Modify

1. **`app/layout.tsx`**
   - Import and use `useMobileMenu` hook
   - Pass `isOpen` and `onClose` to Sidebar
   - Pass `mobileMenuOpen` and `onMobileMenuToggle` to Header
   - Update main content padding: `pl-64` → `md:pl-64`
   - Render backdrop when mobile menu open

2. **`components/layout/Sidebar.tsx`**
   - Accept `isOpen` and `onClose` props
   - Add responsive classes for mobile overlay mode
   - Add close button (X icon) visible only on mobile
   - Add `onClick={onClose}` to all nav links
   - Add transform and transition classes for animations

3. **`components/layout/Header.tsx`**
   - Accept `mobileMenuOpen` and `onMobileMenuToggle` props
   - Add `MobileMenuButton` component (visible on mobile only)
   - Position button on left side of header

### New Components to Create

1. **`hooks/useMobileMenu.ts`**
   - Implements `MobileMenuState` interface
   - Manages `isOpen` state with useState
   - Handles Escape key listener
   - Handles window resize listener
   - Returns `{ isOpen, setIsOpen, toggle, close }`

2. **`components/layout/MobileMenuButton.tsx`**
   - Renders hamburger icon (Menu from lucide-react)
   - Hidden on desktop (`md:hidden`)
   - 48x48px touch target (`h-12 w-12`)
   - ARIA labels and `aria-expanded` state

3. **`components/layout/Backdrop.tsx`** (optional, can be inline)
   - Semi-transparent overlay (`bg-black/50`)
   - Fixed positioning covering viewport
   - Fade animation
   - Click handler to close sidebar

---

## Implementation Details

### Z-Index Hierarchy

```
Layer 10: Modals/Dialogs (if exist) - z-50+
Layer 9: Mobile Sidebar - z-50
Layer 8: Backdrop - z-40
Layer 7: Fixed Header - z-30 (existing)
Layer 1: Main Content - z-auto
```

**Rationale**: Sidebar above backdrop, both above main content, below modals.

### Body Scroll Locking

When mobile sidebar is open, prevent body scrolling:

```typescript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => {
    document.body.style.overflow = ''
  }
}, [isOpen])
```

**Rationale**: Prevents scrolling main content while navigating sidebar (iOS Safari scroll bleed prevention).

---

## Testing Strategy

### Unit Tests

**useMobileMenu Hook**:
- Toggle functionality
- Close functionality
- Escape key handling
- Window resize handling

### E2E Tests (Playwright)

```typescript
// __tests__/e2e/navigation/mobile-menu.spec.ts

test('Mobile menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })  // iPhone SE
  await page.goto('/battery')

  // Verify hamburger visible, sidebar hidden
  await expect(page.locator('[aria-label*="Open"]')).toBeVisible()
  await expect(page.locator('#mobile-sidebar')).not.toBeVisible()

  // Open sidebar
  await page.click('[aria-label*="Open"]')
  await expect(page.locator('#mobile-sidebar')).toBeVisible()

  // Close via backdrop
  await page.click('.backdrop')
  await expect(page.locator('#mobile-sidebar')).not.toBeVisible()
})
```

### Manual Responsive Testing

**Breakpoints to Test**:
- 320px (iPhone SE portrait)
- 375px (iPhone 12/13 portrait)
- 428px (iPhone 14 Pro Max portrait)
- 768px (iPad portrait - boundary)
- 1024px (iPad landscape - desktop mode)
- 1920px (Desktop)

**Test Checklist**:
- [ ] Hamburger menu visible only on <768px
- [ ] Sidebar hidden by default on mobile
- [ ] Sidebar slides in smoothly when hamburger clicked
- [ ] Backdrop appears behind sidebar
- [ ] Calculator content uses full width on mobile
- [ ] No text truncation or overflow
- [ ] Touch targets meet 44px minimum
- [ ] Escape key closes sidebar
- [ ] Focus trapped in open sidebar
- [ ] Screen reader announces state changes

---

## Summary

This data model provides:
- ✅ Type-safe interfaces for mobile menu state
- ✅ Clear component prop definitions for enhanced components
- ✅ Responsive behavior specifications across breakpoints
- ✅ Animation timing and easing specifications
- ✅ Accessibility requirements (ARIA, focus trap, keyboard navigation)
- ✅ Integration points with existing layout components
- ✅ Testing strategy for validation

**Key Design Decision**: This is a layout enhancement, not a data transformation. Focus is on UI state management (open/closed), responsive display logic, and accessibility patterns. All changes are additive and non-breaking to existing calculator functionality.
