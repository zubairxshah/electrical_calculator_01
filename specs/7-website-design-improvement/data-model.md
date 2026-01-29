# Data Model: Website Design Improvement

## UI State Models

### CalculatorCard
Represents the enhanced calculator card component

```typescript
interface CalculatorCard {
  id: string;                     // Unique identifier for the calculator
  title: string;                  // Display title of the calculator
  description: string;            // Brief description of the calculator's purpose
  icon: string;                   // Icon identifier (Lucide React icon name)
  href: string;                   // Navigation path to the calculator
  priority: 'P1' | 'P2' | 'P3'; // Priority level for display emphasis
  status: 'active' | 'beta' | 'deprecated'; // UI state indicator
  category: string;               // Grouping category for organization
  isNew: boolean;                 // Indicator for new calculators
  tags: string[];                 // Additional classification tags
}
```

### SidebarState
Manages the sidebar scrolling and visibility state

```typescript
interface SidebarState {
  isOpen: boolean;                // Whether sidebar is open (mobile view)
  scrollTop: number;              // Current scroll position in sidebar
  maxScrollTop: number;           // Maximum scrollable distance
  isScrolling: boolean;           // Animation state indicator
  scrollDirection: 'up' | 'down'; // Direction of last scroll action
  scrollSpeed: number;            // Speed of scrolling (pixels per tick)
  hasOverflow: boolean;           // Whether content overflows container
}
```

### ResponsiveBreakpoints
Configuration for responsive design behavior

```typescript
interface ResponsiveBreakpoints {
  sm: number;                     // Small screen threshold (640px)
  md: number;                     // Medium screen threshold (768px)
  lg: number;                     // Large screen threshold (1024px)
  xl: number;                     // Extra-large screen threshold (1280px)
  cardColumns: {
    sm: number;                   // Number of columns on small screens
    md: number;                   // Number of columns on medium screens
    lg: number;                   // Number of columns on large screens
    xl: number;                   // Number of columns on extra-large screens
  };
  sidebarWidth: {
    collapsed: number;            // Width when collapsed (px)
    expanded: number;             // Width when expanded (px)
    mobile: number;               // Width on mobile (px)
  };
}
```

### AnimationConfig
Settings for UI animations and transitions

```typescript
interface AnimationConfig {
  duration: {
    fast: number;                 // Fast animation duration (ms) - 200ms
    normal: number;               // Normal animation duration (ms) - 300ms
    slow: number;                 // Slow animation duration (ms) - 500ms
  };
  easing: {
    standard: string;             // Standard easing curve - cubic-bezier(0.4, 0, 0.2, 1)
    deceleration: string;         // Deceleration curve - cubic-bezier(0.0, 0, 0.2, 1)
    acceleration: string;         // Acceleration curve - cubic-bezier(0.4, 0, 1, 1)
  };
  sidebar: {
    scrollSensitivity: number;    // Sensitivity for mouse wheel scrolling (0.5-2.0)
    snapThreshold: number;        // Threshold to trigger scroll snapping (px)
    maxScrollSpeed: number;       // Maximum speed for smooth scrolling (px/frame)
  };
}
```

## Component Relationships

### LandingPage ←→ CalculatorCardGrid
- LandingPage contains CalculatorCardGrid
- CalculatorCardGrid renders multiple CalculatorCard components
- CalculatorCardGrid manages responsive layout behavior

### Layout ←→ SidebarState
- Layout manages SidebarState
- SidebarState controls sidebar visibility and scroll position
- SidebarState communicates with sidebar component for scroll handling

### ResponsiveBreakpoints ←→ All UI Components
- ResponsiveBreakpoints provides configuration to all responsive components
- UI components subscribe to breakpoint changes
- Breakpoint changes trigger responsive behavior updates

## Validation Rules

### CalculatorCard Validation
- `title` must be 1-50 characters
- `description` must be 1-150 characters
- `href` must be a valid internal path
- `priority` must be one of 'P1', 'P2', 'P3'
- `icon` must correspond to a valid Lucide React icon

### SidebarState Validation
- `scrollTop` must be between 0 and `maxScrollTop`
- `scrollSpeed` must be positive
- `scrollDirection` must be 'up' or 'down'

### AnimationConfig Validation
- All duration values must be positive numbers
- Easing values must be valid CSS timing functions
- `scrollSensitivity` must be between 0.1 and 5.0
- `maxScrollSpeed` must be a positive number

## Performance Constraints

### Rendering Performance
- Calculator cards should render in <16ms (60fps)
- Sidebar scrolling should maintain 60fps on mid-range devices
- Animation frames should not drop below 55fps

### Memory Usage
- Component state should not exceed 5MB in memory
- Animation objects should be properly cleaned up to prevent memory leaks
- Event listeners should be removed when components unmount