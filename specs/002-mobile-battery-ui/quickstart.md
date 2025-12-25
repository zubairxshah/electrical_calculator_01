# Quickstart: Mobile-Friendly Battery Calculator UI

**Feature**: 002-mobile-battery-ui
**Target**: Developers implementing mobile responsiveness and time format enhancements
**Last Updated**: 2025-12-25

## Overview

This guide shows how to implement dual time format display and mobile-responsive layout for the battery calculator.

## Quick Implementation Steps

### 1. Create Time Formatting Utility

**File**: `lib/utils/formatTime.ts`

```typescript
import type { TimeFormatResult } from '@/specs/002-mobile-battery-ui/contracts/time-format.types';

export function formatTimeDisplay(decimalHours: number): TimeFormatResult {
  // Handle edge case: less than 1 minute
  if (decimalHours < 0.0167) {
    return {
      decimalHours,
      hours: 0,
      minutes: 0,
      formatted: '< 1 minute',
      short: '< 1m',
    };
  }

  // Convert to total minutes and split
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Grammar handling
  const hourText = hours === 1 ? 'hour' : 'hours';
  const minuteText = minutes === 1 ? 'minute' : 'minutes';

  let formatted: string;
  if (hours === 0) {
    formatted = `${minutes} ${minuteText}`;
  } else if (minutes === 0) {
    formatted = `${hours} ${hourText}`;
  } else {
    formatted = `${hours} ${hourText} ${minutes} ${minuteText}`;
  }

  const short = hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`;

  return {
    decimalHours,
    hours,
    minutes,
    formatted,
    short,
  };
}
```

**Test**: Create `__tests__/unit/utils/formatTime.test.ts` with test cases for edge cases.

---

### 2. Update BatteryResults Component

**File**: `components/battery/BatteryResults.tsx`

**Changes**:

```tsx
import { formatTimeDisplay } from '@/lib/utils/formatTime';

// In the render method:
const timeFormat = formatTimeDisplay(toNumber(result.backupTimeHours));

// Display both formats:
<div className="space-y-2">
  <div className="text-3xl md:text-4xl font-bold text-primary">
    {round(result.backupTimeHours, 3).toString()} hours
  </div>
  <div className="text-xl md:text-2xl text-muted-foreground">
    ({timeFormat.formatted})
  </div>
</div>
```

---

### 3. Add Responsive Layout Classes

**File**: `components/battery/BatteryInputForm.tsx`

**Changes**:

```tsx
// Input fields: Add inputMode for mobile keyboards
<input
  type="text"
  inputMode="decimal"
  className="h-12 w-full" // Increased height for touch
  // ... other props
/>

// Form grid: Stack on mobile, 2-column on tablet+
<div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
  {/* Input fields */}
</div>
```

**File**: `components/battery/BatteryCalculator.tsx`

**Changes**:

```tsx
// Responsive padding
<CalculationCard className="p-4 md:p-6">
  {/* ... */}
</CalculationCard>

// Button layout: Stack on mobile, horizontal on tablet+
<div className="flex flex-col sm:flex-row gap-3">
  <Button className="w-full sm:w-auto">Calculate</Button>
  <Button variant="outline" className="w-full sm:w-auto">Reset</Button>
</div>
```

---

### 4. Add Mobile-Optimized Theme

**File**: `tailwind.config.js` (if needed)

Ensure theme includes:

```javascript
module.exports = {
  theme: {
    extend: {
      minHeight: {
        'touch': '44px',  // Touch target minimum
      },
      spacing: {
        'touch': '8px',   // Touch target spacing
      },
    },
  },
};
```

---

## Testing Guide

### Unit Tests (Vitest)

**File**: `__tests__/unit/utils/formatTime.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatTimeDisplay } from '@/lib/utils/formatTime';

describe('formatTimeDisplay', () => {
  it('should handle < 1 minute', () => {
    const result = formatTimeDisplay(0.0083);
    expect(result.formatted).toBe('< 1 minute');
  });

  it('should convert 3.456 hours correctly', () => {
    const result = formatTimeDisplay(3.456);
    expect(result.hours).toBe(3);
    expect(result.minutes).toBe(27);
    expect(result.formatted).toBe('3 hours 27 minutes');
  });

  // Add test cases from data-model.md table
});
```

**Run**: `npm test -- __tests__/unit/utils/formatTime.test.ts`

---

### Manual Responsive Testing

**Devices to Test**:

1. **Mobile (Portrait)**:
   - iPhone SE (375px width)
   - iPhone 14 Pro (393px width)
   - Samsung Galaxy S21 (360px width)

2. **Mobile (Landscape)**:
   - Rotate above devices

3. **Tablet**:
   - iPad Mini (768px portrait)
   - iPad Pro (1024px portrait)

4. **Desktop**:
   - 1280px, 1920px, 2560px widths

**Test Checklist**:

- [ ] No horizontal scrolling on any viewport
- [ ] All touch targets ≥ 44x44px
- [ ] Forms are usable without zooming
- [ ] Text is readable (≥16px on mobile)
- [ ] Orientation change doesn't lose form data
- [ ] Buttons are touch-friendly and properly spaced
- [ ] Results display clearly on small screens
- [ ] Warnings are readable with proper contrast

**Browser DevTools**:

```
1. Open Chrome/Edge DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test responsive breakpoints:
   - 320px (minimum)
   - 375px (iPhone)
   - 768px (iPad)
   - 1024px (laptop)
   - 1920px (desktop)
4. Test orientation (rotate icon)
5. Verify touch target overlay (Settings > Show rulers)
```

---

## Common Patterns

### Responsive Text Sizing

```tsx
// Primary heading
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

// Body text (ensure ≥16px on mobile)
<p className="text-base md:text-lg">

// Small text (min 14px on mobile for WCAG)
<span className="text-sm md:text-base text-muted-foreground">
```

### Responsive Spacing

```tsx
// Padding: More on mobile for finger comfort
<div className="p-4 md:p-6 lg:p-8">

// Gap: Adequate touch spacing on mobile
<div className="flex gap-3 md:gap-4">

// Margins: Generous on mobile
<div className="mb-4 md:mb-6">
```

### Touch-Friendly Buttons

```tsx
// Primary button
<Button className="h-12 min-w-[120px] text-base">
  {/* 48px height for comfortable touch */}
</Button>

// Icon button
<Button size="icon" className="h-11 w-11">
  {/* 44px minimum touch target */}
  <Icon className="h-5 w-5" />
</Button>
```

---

## Performance Checklist

- [ ] No layout shift (CLS) on page load
- [ ] Smooth transitions (no janky animations)
- [ ] Fast font loading (system fonts or optimized web fonts)
- [ ] Minimal JavaScript for responsiveness (use CSS where possible)
- [ ] Test on real 3G connection (Chrome DevTools throttling)

---

## Accessibility Checklist

- [ ] All touch targets ≥ 44x44px
- [ ] Color contrast ≥ 4.5:1 for normal text
- [ ] Color contrast ≥ 3:1 for large text (≥24px)
- [ ] Focus indicators clearly visible
- [ ] Form labels programmatically associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Semantic HTML (proper heading hierarchy)

---

## Example Usage

### Before (Desktop-Only):

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Voltage (V)</Label>
    <Input type="number" />
  </div>
</div>

<div>Backup Time: {result.backupTimeHours} hours</div>
```

### After (Mobile-Responsive with Dual Time):

```tsx
<div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
  <div>
    <Label>Voltage (V)</Label>
    <Input
      type="text"
      inputMode="decimal"
      className="h-12"
    />
  </div>
</div>

<div className="space-y-2">
  <div className="text-3xl md:text-4xl font-bold">
    {round(result.backupTimeHours, 3).toString()} hours
  </div>
  <div className="text-xl md:text-2xl text-muted-foreground">
    ({formatTimeDisplay(toNumber(result.backupTimeHours)).formatted})
  </div>
</div>
```

**Visual Result**:
- Mobile: Full-width inputs, stacked layout, large touch targets, "3.456 hours (3 hours 27 minutes)"
- Desktop: Two-column grid, existing layout, same dual time format

---

## Deployment Notes

1. **No Breaking Changes**: Existing calculation logic untouched, only display enhancements
2. **Progressive Enhancement**: Works without JavaScript (CSS responsiveness)
3. **Backward Compatible**: Desktop users see improved time format, mobile users get responsive layout
4. **Zero Dependencies Added**: Uses existing Tailwind utilities and React patterns

---

## Troubleshooting

**Issue**: Layout breaks on very small screens (<320px)
**Fix**: Add `min-width: 320px` to body or container

**Issue**: Touch targets too small on Safari
**Fix**: Verify `min-h-11` (44px) or `min-h-12` (48px) classes applied

**Issue**: Mobile keyboard doesn't show numeric pad
**Fix**: Ensure `inputMode="decimal"` is set on number inputs, not just `type="number"`

**Issue**: Orientation change loses form data
**Fix**: Ensure Zustand state persistence is working (already implemented in useBatteryStore)

**Issue**: Text too small on mobile
**Fix**: Verify `text-base` (16px) minimum, avoid `text-sm` (14px) for body content
