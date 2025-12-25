# Research: Mobile Sidebar Conversion to Menu

**Feature**: 003-mobile-sidebar-menu
**Date**: 2025-12-25
**Status**: Complete

## Overview

This document captures research findings and technical decisions for converting the fixed sidebar navigation to a mobile-responsive hamburger menu. All technical unknowns have been resolved.

## Research Areas

### 1. Mobile Navigation Pattern Selection

**Question**: What is the best practice for sidebar-to-menu conversion in Next.js/React applications?

**Research Findings**:

**Option A: Overlay/Drawer Pattern**
- Sidebar slides over main content
- Semi-transparent backdrop behind sidebar
- Main content remains stationary
- **Pros**: No layout shift, familiar mobile pattern, simple implementation
- **Cons**: Requires z-index management

**Option B: Push-Content Pattern**
- Sidebar pushes main content to the right
- No backdrop needed
- Both sidebar and content animate
- **Pros**: No overlapping content
- **Cons**: Complex animation, layout shift causes reflow

**Option C: Slide-Over with Content Shrink**
- Sidebar slides in, content shrinks to accommodate
- Hybrid between overlay and push
- **Pros**: Shows both sidebar and content simultaneously
- **Cons**: Content becomes too narrow on small screens

**Decision**: **Option A (Overlay/Drawer Pattern)**

**Rationale**:
- Maximizes calculator content width (spec requirement: full viewport width on mobile)
- Familiar to users (matches iOS/Android native app conventions)
- Simplest implementation with CSS transforms
- No layout reflow when opening/closing
- Widely used in modern web applications (Gmail, Twitter mobile, etc.)

---

### 2. State Management Approach

**Question**: Where should sidebar open/closed state be stored?

**Research Findings**:

**Option A: React Context Provider**
```typescript
const MobileMenuContext = createContext<MobileMenuState | null>(null)
```
- **Pros**: Accessible anywhere in component tree
- **Cons**: Overkill for local layout state, adds provider wrapper

**Option B: Zustand Global Store**
```typescript
const useMobileMenuStore = create<MobileMenuState>((set) => ({ ... }))
```
- **Pros**: Consistent with existing battery calculator state management
- **Cons**: Global state not needed for layout-only feature

**Option C: Custom Hook with useState**
```typescript
function useMobileMenu(): MobileMenuState {
  const [isOpen, setIsOpen] = useState(false)
  // ... event listeners
  return { isOpen, toggle, close }
}
```
- **Pros**: Simple, scoped to layout, easy to test, no overhead
- **Cons**: Must pass props from layout to components

**Decision**: **Option C (Custom Hook with useState)**

**Rationale**:
- State only needed in `app/layout.tsx` and passed to `Sidebar` and `Header`
- No other components need access to menu state
- Simplest solution (YAGNI principle)
- Custom hook encapsulates Escape key and resize listeners cleanly
- Easy to test in isolation

---

### 3. Responsive Breakpoint Implementation

**Question**: How to implement responsive behavior at 768px breakpoint?

**Research Findings**:

**Option A: CSS-Only (Tailwind responsive classes)**
```tsx
<Sidebar className="hidden md:block" />
<MobileMenuButton className="md:hidden" />
```
- **Pros**: No JavaScript, works without hydration, simpler
- **Cons**: Can't auto-close sidebar on window resize

**Option B: JavaScript matchMedia API**
```typescript
useEffect(() => {
  const mediaQuery = window.matchMedia('(min-width: 768px)')
  const handler = () => { if (mediaQuery.matches) close() }
  mediaQuery.addEventListener('change', handler)
  return () => mediaQuery.removeEventListener('change', handler)
}, [])
```
- **Pros**: Responsive to window resize, can cleanup state
- **Cons**: Requires JavaScript, more complex

**Option C: Hybrid (CSS + JavaScript)**
- CSS for hiding/showing components
- JavaScript for state cleanup on resize
- **Pros**: Best of both worlds, progressive enhancement
- **Cons**: Slightly more code

**Decision**: **Option C (Hybrid Approach)**

**Rationale**:
- CSS handles visual display (Tailwind `md:` classes)
- JavaScript handles edge case: auto-close sidebar when resizing from mobile to desktop
- Progressive enhancement: works without JS (CSS only), enhanced with JS
- Handles user Story edge case: "resize window from desktop to mobile"

**Implementation**:
```tsx
// Tailwind classes for visibility
<Sidebar className="md:flex" />  // Hidden on mobile via overlay logic
<MobileMenuButton className="md:hidden" />  // Hidden on desktop

// JavaScript for state cleanup
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth >= 768 && isOpen) {
      close()  // Auto-close on desktop resize
    }
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [isOpen, close])
```

---

### 4. Animation Strategy

**Question**: How to animate sidebar slide-in/out transitions?

**Research Findings**:

**Option A: CSS Transitions**
```css
transform: translateX(-100%);  /* Closed */
transform: translateX(0);       /* Open */
transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
```
- **Pros**: Simple, GPU-accelerated, no dependencies, 60fps performance
- **Cons**: Less control over complex animations

**Option B: Framer Motion Library**
```tsx
<motion.aside animate={{ x: isOpen ? 0 : -256 }} />
```
- **Pros**: Powerful animation controls, spring physics
- **Cons**: +50KB bundle size, unnecessary for simple slide animation

**Option C: React Spring Library**
- **Pros**: Physics-based animations, performant
- **Cons**: Additional dependency, learning curve

**Decision**: **Option A (CSS Transitions)**

**Rationale**:
- Meets performance requirements (60fps, <300ms duration)
- No additional dependencies (constitution principle: simplicity)
- Tailwind provides transition utilities out of the box
- Transform animations are GPU-accelerated by default
- Simpler to maintain and debug

**Implementation**:
```tsx
// Tailwind classes
className={cn(
  'fixed inset-y-0 left-0 w-64 z-50',
  'transform transition-transform duration-300 ease-in-out',
  isOpen ? 'translate-x-0' : '-translate-x-full',
  'md:translate-x-0'  // Always visible on desktop
)}
```

---

### 5. Focus Management and Accessibility

**Question**: How to implement keyboard accessibility for sidebar overlay?

**Research Findings**:

**WCAG 2.1 Modal/Dialog Requirements**:
- Focus must be trapped within open modal/drawer
- Escape key must close
- Focus should return to trigger element on close
- Interactive elements must be keyboard-accessible

**Implementation Strategy**:

**Focus Trap**:
```typescript
useEffect(() => {
  if (!isOpen) return

  const sidebar = sidebarRef.current
  if (!sidebar) return

  // Get all focusable elements
  const focusableElements = sidebar.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftTab && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  sidebar.addEventListener('keydown', handleTab)
  return () => sidebar.removeEventListener('keydown', handleTab)
}, [isOpen])
```

**ARIA Attributes**:
```tsx
<button
  aria-label="Open main navigation menu"
  aria-expanded={isOpen}
  aria-controls="mobile-sidebar"
/>

<aside
  id="mobile-sidebar"
  role="navigation"
  aria-label="Main navigation"
/>
```

**Decision**: Implement manual focus trap with ARIA labels

**Rationale**:
- No additional dependencies (e.g., focus-trap-react library)
- Full control over focus behavior
- Meets WCAG 2.1 Level AA requirements
- Simple implementation (~30 lines of code)

---

### 6. Layout Adjustment Strategy

**Question**: How to make calculator content full-width on mobile when sidebar is hidden?

**Current State**:
```tsx
// app/layout.tsx
<div className="flex flex-1 flex-col pl-64">  // Fixed 256px padding
  <main className="flex-1 p-6">
    {children}
  </main>
</div>
```

**Issue**: `pl-64` applies on all screen sizes, leaving only ~64px-172px for content on 320px-428px mobile screens.

**Solution**:
```tsx
// Remove fixed padding, use conditional responsive padding
<div className="flex flex-1 flex-col md:pl-64">  // Padding only on ≥768px
  <main className="flex-1 p-4 md:p-6">  // Tighter padding on mobile
    {children}
  </main>
</div>
```

**Decision**: Conditional Tailwind responsive classes

**Rationale**:
- Simple one-character change (`pl-64` → `md:pl-64`)
- No layout shift or complex logic
- Mobile gets full viewport width minus padding (320px - 32px = 288px content)
- Desktop behavior unchanged (still has 256px sidebar padding)

**Verification**:
- Mobile (375px): 375px - 32px padding = **343px for calculator content** ✅
- Current broken state: 375px - 256px sidebar - 32px padding = **87px** ❌
- Desktop (1920px): 1920px - 256px sidebar - 48px padding = **1616px** (unchanged)

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Navigation Pattern** | Overlay/drawer with backdrop | Maximizes content width, familiar mobile pattern, no layout shift |
| **State Management** | Custom hook with useState | Simple, scoped to layout layer, no global state needed |
| **Responsive Strategy** | Hybrid (CSS + JavaScript) | CSS for visibility, JS for edge case cleanup (resize/escape) |
| **Animation** | CSS transitions with transform | No dependencies, 60fps GPU-accelerated, simple to maintain |
| **Focus Management** | Manual focus trap with ARIA | No dependencies, full control, WCAG 2.1 AA compliant |
| **Layout Fix** | Conditional responsive padding | One-character fix (`pl-64` → `md:pl-64`), no layout shift |

## Alternatives Considered

### Navigation Pattern Alternatives Rejected

- **Push-content**: Rejected due to layout reflow and complexity
- **Mini-sidebar**: Rejected as too complex and still consumes space on mobile
- **Top navbar conversion**: Rejected as changes navigation paradigm too drastically

### State Management Alternatives Rejected

- **React Context**: Rejected as overkill for local layout state
- **Zustand store**: Rejected as global state not needed for sidebar UI
- **URL state (query params)**: Rejected as sidebar state shouldn't affect URL or bookmarks

### Animation Alternatives Rejected

- **Framer Motion**: Rejected as unnecessary dependency (+50KB) for simple slide animation
- **React Spring**: Rejected as physics-based animations overkill for this use case
- **No animation**: Rejected as spec requires smooth transitions for app-like feel

### Focus Management Alternatives Rejected

- **focus-trap-react library**: Rejected to avoid dependency, manual implementation is simple
- **No focus trap**: Rejected as violates WCAG 2.1 accessibility requirements

## Implementation Checklist

- [x] Navigation pattern finalized (overlay/drawer)
- [x] State management approach confirmed (custom hook)
- [x] Responsive breakpoint strategy defined (hybrid CSS + JS)
- [x] Animation approach selected (CSS transitions)
- [x] Focus management strategy confirmed (manual trap)
- [x] Layout adjustment approach confirmed (responsive padding)
- [ ] Proceed to Phase 1: Data Model and Contracts

## Next Steps

1. **Phase 1**: Design `data-model.md` with TypeScript interfaces for:
   - `MobileMenuState` interface and hook signature
   - `SidebarProps` (enhanced with mobile props)
   - `MobileMenuButtonProps`
   - Component state transitions

2. **Phase 1**: No external API contracts needed (pure UI feature)

3. **Phase 1**: Create `quickstart.md` with step-by-step implementation guide and code examples
