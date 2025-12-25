# Data Model: Mobile-Friendly Battery Calculator UI

**Feature**: 002-mobile-battery-ui
**Date**: 2025-12-25
**Status**: Complete

## Overview

This document defines TypeScript interfaces and data structures for the mobile UI enhancement. Since this is primarily a UI/UX feature, the data model focuses on display formats and component props rather than business entities.

## Core Types

### TimeFormatResult

Represents backup time in both decimal and human-readable formats.

```typescript
interface TimeFormatResult {
  decimalHours: number;           // Original calculation result, e.g., 3.456
  hours: number;                  // Whole hours component, e.g., 3
  minutes: number;                // Minutes component, e.g., 27
  formatted: string;              // Human-readable format, e.g., "3 hours 27 minutes"
  short: string;                  // Compact format, e.g., "3h 27m"
}
```

**Rationale**: Separates time components for flexible display. Components can choose which format to display based on available space.

**Constraints**:
- `decimalHours` must be ≥ 0
- `minutes` must be 0-59 range
- `formatted` handles grammatical cases ("1 hour" vs "2 hours")

**Edge Cases**:
- `decimalHours < 0.0167` (< 1 minute) → `{ hours: 0, minutes: 0, formatted: "< 1 minute" }`
- `decimalHours > 100` → Still displays full hours and minutes, e.g., "127 hours 34 minutes"

---

### ResponsiveBreakpoint (Enum)

Defines standard viewport breakpoints for responsive behavior.

```typescript
enum ResponsiveBreakpoint {
  Mobile = 320,      // Minimum supported width
  MobileLarge = 428, // Large phones (iPhone Pro Max, etc.)
  Tablet = 768,      // iPad portrait
  Laptop = 1024,     // Small laptop / tablet landscape
  Desktop = 1280,    // Standard desktop
  DesktopLarge = 1536, // Large desktop / 4K
}
```

**Rationale**: Aligns with Tailwind CSS default breakpoints (640px, 768px, 1024px, 1280px, 1536px) while documenting minimum supported width (320px).

**Usage**: Primarily for documentation and testing. Actual breakpoints use Tailwind responsive utilities (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`).

---

### TouchTarget

Interface for validating interactive element sizing.

```typescript
interface TouchTarget {
  minWidth: number;  // Minimum width in pixels (44)
  minHeight: number; // Minimum height in pixels (44)
  spacing: number;   // Minimum spacing between targets (8)
}

const TOUCH_TARGET_STANDARDS: TouchTarget = {
  minWidth: 44,
  minHeight: 44,
  spacing: 8,
};
```

**Rationale**: Codifies WCAG 2.1 and mobile platform guidelines. Can be used in automated tests to verify touch target sizing.

---

## Component Prop Interfaces

### Enhanced BatteryResults Props

```typescript
interface BatteryResultsProps {
  result: BatteryCalculatorResult; // Existing prop
  showDualTimeFormat?: boolean;    // NEW: Toggle dual format display
  compactMode?: boolean;           // NEW: Use compact format on small screens
}
```

**Changes**: Adds optional props for time format display. Defaults to `showDualTimeFormat = true` to enable feature.

---

### Enhanced InputField Props

```typescript
interface InputFieldProps {
  // ... existing props
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url'; // NEW
  touchOptimized?: boolean;        // NEW: Apply mobile-friendly sizing
}
```

**Changes**: Adds `inputMode` for mobile keyboard optimization and `touchOptimized` flag for 48px height on mobile.

---

## Utility Functions

### formatTimeDisplay

Converts decimal hours to dual-format display.

```typescript
/**
 * Convert decimal hours to human-readable time format
 * @param decimalHours - Backup time in decimal hours
 * @returns TimeFormatResult with both formats
 */
function formatTimeDisplay(decimalHours: number): TimeFormatResult {
  // Edge case: Less than 1 minute
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

  return {
    decimalHours,
    hours,
    minutes,
    formatted,
    short: hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`,
  };
}
```

**Test Cases**:

| Input (hours) | Expected Output |
|---------------|-----------------|
| 0.0083 | "< 1 minute" |
| 0.25 | "15 minutes" |
| 0.75 | "45 minutes" |
| 1.0 | "1 hour" |
| 1.5 | "1 hour 30 minutes" |
| 2.0 | "2 hours" |
| 3.456 | "3 hours 27 minutes" |
| 24.5 | "24 hours 30 minutes" |
| 127.567 | "127 hours 34 minutes" |

---

## Responsive Behavior Specifications

### Form Layout Adaptation

| Viewport | Label Position | Input Width | Columns |
|----------|---------------|-------------|---------|
| <640px | Above (stacked) | 100% (full width) | 1 |
| 640px-1024px | Above (stacked) | 100% (full width) | 1-2 (grid) |
| >1024px | Left (inline) | Auto (existing) | 2 (existing) |

### Button Layout Adaptation

| Viewport | Width | Layout | Spacing |
|----------|-------|--------|---------|
| <640px | 100% (full width) | Stacked (vertical) | 8px vertical |
| 640px-1024px | Auto (content) | Horizontal | 8px horizontal |
| >1024px | Auto (existing) | Horizontal (existing) | Existing |

### Result Card Adaptation

| Viewport | Padding | Font Size (Primary) | Font Size (Secondary) |
|----------|---------|-------------------|---------------------|
| <640px | 16px | 24px (1.5rem) | 14px (0.875rem) |
| 640px-1024px | 20px | 28px (1.75rem) | 16px (1rem) |
| >1024px | 24px (existing) | 32px (existing) | 16px (existing) |

---

## Validation Rules

### Time Format Validation

```typescript
function validateTimeFormatResult(result: TimeFormatResult): boolean {
  // Minutes must be in 0-59 range
  if (result.minutes < 0 || result.minutes > 59) return false;

  // Hours must be non-negative
  if (result.hours < 0) return false;

  // Decimal hours must match hours + minutes/60 (within rounding tolerance)
  const reconstructed = result.hours + result.minutes / 60;
  const tolerance = 0.017; // ~1 minute tolerance
  if (Math.abs(reconstructed - result.decimalHours) > tolerance) return false;

  // Formatted string must not be empty
  if (!result.formatted || result.formatted.trim().length === 0) return false;

  return true;
}
```

---

## Integration Points

### Existing Components to Modify

1. **`components/battery/BatteryResults.tsx`**
   - Add `formatTimeDisplay()` utility import
   - Display dual time format for backup time result
   - Apply responsive text sizing classes

2. **`components/battery/BatteryInputForm.tsx`**
   - Add `inputMode="decimal"` to number inputs
   - Apply touch-optimized sizing on mobile (`h-12` instead of default)
   - Add responsive layout classes (stack on mobile, grid on desktop)

3. **`components/battery/BatteryCalculator.tsx`**
   - Add responsive padding (`p-4 md:p-6`)
   - Adjust button layout (stack on mobile, horizontal on desktop)

### New Utilities to Create

1. **`lib/utils/formatTime.ts`**
   - `formatTimeDisplay(decimalHours: number): TimeFormatResult`
   - Export type `TimeFormatResult`
   - Comprehensive test coverage (9 test cases)

---

## Summary

This data model provides:
- ✅ Type-safe interfaces for time formatting
- ✅ Clear responsive breakpoint definitions
- ✅ Touch target sizing standards
- ✅ Component prop interfaces for enhancements
- ✅ Validation rules for time conversion accuracy
- ✅ Integration points with existing components (minimal changes)

**Key Design Decision**: This is a UI enhancement, not a data model transformation. Focus is on display logic (time formatting, responsive layout) rather than business entities. All changes are additive and non-breaking to existing calculation logic.
