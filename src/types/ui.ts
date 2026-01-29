// UI State Models for Website Design Improvement

/**
 * Represents the enhanced calculator card component
 */
export interface CalculatorCard {
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

/**
 * Manages the sidebar scrolling and visibility state
 */
export interface SidebarState {
  isOpen: boolean;                // Whether sidebar is open (mobile view)
  scrollTop: number;              // Current scroll position in sidebar
  maxScrollTop: number;           // Maximum scrollable distance
  isScrolling: boolean;           // Animation state indicator
  scrollDirection: 'up' | 'down'; // Direction of last scroll action
  scrollSpeed: number;            // Speed of scrolling (pixels per tick)
  hasOverflow: boolean;           // Whether content overflows container
}

/**
 * Configuration for responsive design behavior
 */
export interface ResponsiveBreakpoints {
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

/**
 * Settings for UI animations and transitions
 */
export interface AnimationConfig {
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