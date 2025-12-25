# Research: Mobile-Friendly Battery Calculator UI

**Feature**: 002-mobile-battery-ui
**Date**: 2025-12-25
**Status**: Complete

## Overview

This document captures research findings and technical decisions for implementing mobile-responsive UI enhancements and dual time format display for the battery calculator. All technical unknowns have been resolved.

## Research Areas

### 1. Time Format Conversion (Hours to Hours/Minutes)

**Question**: What is the most accurate and user-friendly way to convert decimal hours to hours and minutes format?

**Research Findings**:

**Option A: Simple Math Conversion**
```typescript
const hours = Math.floor(decimalHours);
const minutes = Math.round((decimalHours - hours) * 60);
```
- **Pros**: Simple, no dependencies, fast
- **Cons**: Rounding edge cases (0.9999 hours → 59 minutes vs 60 minutes)

**Option B: Duration Library (date-fns, moment, dayjs)**
- **Pros**: Handles edge cases, i18n support
- **Cons**: External dependency, overkill for simple conversion

**Option C: Math with Edge Case Handling**
```typescript
function formatHoursMinutes(decimalHours: number): string {
  if (decimalHours < 0.0167) return '< 1 minute'; // Less than 1 minute

  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hours`;
  return `${hours} hours ${minutes} minutes`;
}
```
- **Pros**: Handles edge cases cleanly, no dependencies, consistent rounding
- **Cons**: Slightly more complex than Option A

**Decision**: **Option C (Math with Edge Case Handling)**

**Rationale**:
- No external dependencies (constitution principle: simplicity)
- Handles all edge cases from spec (< 1 minute, > 100 hours)
- Consistent rounding (avoids 59 vs 60 minute edge cases)
- Total minutes approach ensures hours and minutes always sum correctly

**Test Cases**:
- 0.0083 hours → "< 1 minute" ✓
- 0.75 hours → "45 minutes" ✓
- 1.5 hours → "1 hours 30 minutes" or "1 hour 30 minutes" (grammar handling needed)
- 3.456 hours → "3 hours 27 minutes" ✓
- 127.567 hours → "127 hours 34 minutes" ✓

---

### 2. Responsive Design Strategy (Mobile-First vs Desktop-First)

**Question**: Should we use mobile-first or desktop-first approach for responsive breakpoints?

**Research Findings**:

**Option A: Desktop-First (max-width media queries)**
```css
/* Default: Desktop */
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 768px) { /* Mobile */ }
```
- **Pros**: Matches existing desktop design
- **Cons**: Mobile performance penalty (loads desktop CSS first)

**Option B: Mobile-First (min-width media queries)**
```css
/* Default: Mobile (320px+) */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```
- **Pros**: Better mobile performance, aligns with modern best practices
- **Cons**: Requires rethinking existing component structure

**Decision**: **Option B (Mobile-First)**

**Rationale**:
- SC-009 requires <3s load on 3G connections
- Mobile users are primary target (field engineers)
- Tailwind CSS is mobile-first by default
- Modern best practice for web applications

**Breakpoints** (Tailwind defaults):
- `sm: 640px` - Large mobile / small tablet
- `md: 768px` - Tablet portrait
- `lg: 1024px` - Tablet landscape / small laptop
- `xl: 1280px` - Desktop
- `2xl: 1536px` - Large desktop

---

### 3. Touch Target Sizing and Mobile UX

**Question**: How to ensure touch-friendly UI elements meet WCAG 2.1 guidelines across all components?

**Research Findings**:

**WCAG 2.1 Success Criterion 2.5.5 (Level AAA)**:
- Minimum 44x44 CSS pixels for touch targets
- Exception: inline text links

**iOS Human Interface Guidelines**:
- Minimum 44x44 points for tappable elements
- 88x88 points recommended for primary actions

**Android Material Design**:
- Minimum 48x48 dp for touch targets
- 8dp spacing between adjacent targets

**Decision**: **44x44px minimum with 8px spacing**

**Rationale**:
- Meets WCAG 2.1 Level AAA (exceeds Level AA requirement)
- Compatible with both iOS and Android guidelines
- Sufficient spacing prevents accidental taps

**Implementation Strategy**:
```typescript
// Tailwind utilities
- Buttons: `min-h-[44px] min-w-[44px]` or `h-11 w-11` (44px)
- Form inputs: `h-12` (48px for better usability)
- Icon buttons: `p-3` (12px padding + 20px icon = 44px)
- Spacing: `gap-2` (8px) between touch targets
```

---

### 4. Mobile Keyboard Optimization

**Question**: How to trigger appropriate mobile keyboards for number inputs?

**Research Findings**:

**Option A: input type="number"**
```html
<input type="number" />
```
- **Pros**: Native numeric keyboard on mobile
- **Cons**: Allows 'e' (scientific notation), inconsistent validation across browsers

**Option B: input type="text" + inputMode="decimal"**
```html
<input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" />
```
- **Pros**: Shows numeric keyboard, allows decimal point, better control
- **Cons**: Requires manual validation

**Option C: input type="tel"**
- **Pros**: Numeric keyboard
- **Cons**: Designed for phone numbers, semantically incorrect

**Decision**: **Option B (type="text" + inputMode="decimal")**

**Rationale**:
- Best mobile UX (numeric keyboard with decimal point)
- Semantic correctness (inputs are numbers, not phone numbers)
- Full control over validation
- Works consistently across iOS/Android

**Pattern**: `inputMode="decimal"` for decimal numbers (voltage, efficiency), `inputMode="numeric"` for integers (if needed)

---

### 5. Responsive Layout Pattern

**Question**: How should the calculator layout adapt across breakpoints?

**Research Findings**:

**Current Desktop Layout**:
- Two-column form (label left, input right)
- Wide result cards
- Horizontal button groups

**Proposed Adaptive Strategy**:

| Breakpoint | Layout | Form | Results | Buttons |
|------------|--------|------|---------|---------|
| Mobile (<640px) | Single column | Stacked (label above input) | Full width cards | Stacked, full width |
| Tablet (640px-1024px) | Single column | Two-column form | Full width cards | Horizontal group |
| Desktop (>1024px) | Keep existing | Keep existing two-column | Keep existing | Keep existing horizontal |

**Decision**: **Minimal-Change Adaptive Strategy**

**Rationale**:
- Preserve existing desktop experience (no regression)
- Add mobile adaptations only where needed
- Use Tailwind responsive utilities (sm:, md:, lg:)
- Smallest viable diff

**Implementation**:
```tsx
// Mobile-first responsive classes
<div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
  {/* Stacks on mobile, grid on tablet+ */}
</div>

<Button className="w-full sm:w-auto">
  {/* Full width on mobile, auto on desktop */}
</Button>
```

---

### 6. Theme and Visual Polish

**Question**: What visual enhancements create an "app-like" experience on mobile?

**Research Findings**:

**Modern Mobile App Characteristics**:
1. **Smooth transitions**: 200-300ms CSS transitions on state changes
2. **Clear hierarchy**: Larger primary text, smaller secondary text
3. **Generous spacing**: More padding/margins on mobile for touch comfort
4. **Subtle shadows**: Card elevation for depth
5. **Focus states**: Clear visual feedback on interaction
6. **Loading states**: Skeleton screens or spinners

**Decision**: **Progressive Enhancement with Tailwind**

**Enhancements**:
- Add `transition-all duration-200` to interactive elements
- Increase mobile padding: `p-4 md:p-6` (16px mobile, 24px desktop)
- Enhanced focus states: `focus:ring-2 focus:ring-primary focus:outline-none`
- Loading state: Use existing component patterns
- Card shadows: `shadow-sm hover:shadow-md transition-shadow`

**Rationale**:
- Uses existing Tailwind utilities (no new CSS files)
- Progressive enhancement (works without JS)
- Maintains existing ElectroMate theme
- Minimal changes to existing components

---

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Time Formatting** | Math with edge case handling (Option C) | No dependencies, handles all edge cases, accurate rounding |
| **Responsive Strategy** | Mobile-first with Tailwind breakpoints | Better mobile performance, modern best practice, Tailwind default |
| **Touch Targets** | 44x44px minimum with 8px spacing | WCAG AAA compliance, iOS/Android compatible |
| **Mobile Keyboards** | inputMode="decimal" with type="text" | Best UX, consistent across devices, full validation control |
| **Layout Pattern** | Minimal-change adaptive (preserve desktop) | No regression, smallest diff, focused mobile improvements |
| **Visual Polish** | Tailwind utilities with transitions | No new dependencies, progressive enhancement |

## Alternatives Considered

### Time Formatting Alternatives Rejected

- **Duration library**: Rejected due to unnecessary dependency for simple conversion
- **Simple Math.floor**: Rejected because it doesn't handle rounding edge cases (0.9999 hours)

### Responsive Strategy Alternatives Rejected

- **Desktop-first**: Rejected due to mobile performance penalty (loads unnecessary CSS)
- **Separate mobile site**: Rejected as over-engineering for single calculator page

### Touch Target Alternatives Rejected

- **48x48px (Material Design)**: Rejected as unnecessary - 44px meets WCAG and is slightly more space-efficient
- **Variable sizing**: Rejected for consistency - all touch targets should meet same minimum

### Mobile Keyboard Alternatives Rejected

- **type="number"**: Rejected due to 'e' character issue and inconsistent browser behavior
- **type="tel"**: Rejected as semantically incorrect (not a phone number)

## Implementation Checklist

- [x] Time formatting approach finalized
- [x] Responsive breakpoint strategy confirmed
- [x] Touch target sizing standards defined
- [x] Mobile keyboard optimization approach selected
- [x] Layout adaptation pattern determined
- [x] Visual polish strategy confirmed
- [ ] Proceed to Phase 1: Data Model and Contracts

## Next Steps

1. **Phase 1**: Design `data-model.md` with TypeScript interfaces for:
   - `TimeFormatResult` (dual format time display)
   - `ResponsiveBreakpoint` enum
   - Component prop interfaces for enhanced components

2. **Phase 1**: Define contracts (TypeScript types, no external API needed)

3. **Phase 1**: Create `quickstart.md` with usage examples and responsive testing guide
