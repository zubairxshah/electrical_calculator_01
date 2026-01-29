// Responsive Breakpoint Configuration for Website Design Improvement

import { ResponsiveBreakpoints } from '../types/ui';

export const RESPONSIVE_CONFIG: ResponsiveBreakpoints = {
  sm: 640,   // Small screen threshold (640px)
  md: 768,   // Medium screen threshold (768px)
  lg: 1024,  // Large screen threshold (1024px)
  xl: 1280,  // Extra-large screen threshold (1280px)
  cardColumns: {
    sm: 1,   // Number of columns on small screens
    md: 2,   // Number of columns on medium screens
    lg: 3,   // Number of columns on large screens
    xl: 4,   // Number of columns on extra-large screens
  },
  sidebarWidth: {
    collapsed: 64,  // Width when collapsed (px)
    expanded: 256,  // Width when expanded (px)
    mobile: 256,    // Width on mobile (px)
  },
};

// CSS Media Query Helpers
export const MEDIA_QUERIES = {
  sm: `(min-width: ${RESPONSIVE_CONFIG.sm}px)`,
  md: `(min-width: ${RESPONSIVE_CONFIG.md}px)`,
  lg: `(min-width: ${RESPONSIVE_CONFIG.lg}px)`,
  xl: `(min-width: ${RESPONSIVE_CONFIG.xl}px)`,
};

// Breakpoint Helper Functions
export const isMobile = () => window.innerWidth < RESPONSIVE_CONFIG.md;
export const isTablet = () =>
  window.innerWidth >= RESPONSIVE_CONFIG.md && window.innerWidth < RESPONSIVE_CONFIG.lg;
export const isDesktop = () => window.innerWidth >= RESPONSIVE_CONFIG.lg;