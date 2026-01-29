// Animation Configuration Utilities for Website Design Improvement

import { AnimationConfig } from '../types/ui';

export const ANIMATION_CONFIG: AnimationConfig = {
  duration: {
    fast: 200,    // Fast animation duration (ms) - 200ms
    normal: 300,  // Normal animation duration (ms) - 300ms
    slow: 500,    // Slow animation duration (ms) - 500ms
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Standard easing curve
    deceleration: 'cubic-bezier(0.0, 0, 0.2, 1)',  // Deceleration curve
    acceleration: 'cubic-bezier(0.4, 0, 1, 1)',    // Acceleration curve
  },
  sidebar: {
    scrollSensitivity: 1.0,    // Sensitivity for mouse wheel scrolling (0.5-2.0)
    snapThreshold: 5,          // Threshold to trigger scroll snapping (px)
    maxScrollSpeed: 10,        // Maximum speed for smooth scrolling (px/frame)
  },
};

// Animation Presets
export const ANIMATION_PRESETS = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: ANIMATION_CONFIG.duration.normal / 1000 } },
  },
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: ANIMATION_CONFIG.duration.normal / 1000,
        ease: ANIMATION_CONFIG.easing.standard
      }
    },
  },
  sidebarSlide: {
    hidden: { x: -256 },
    visible: {
      x: 0,
      transition: {
        duration: ANIMATION_CONFIG.duration.fast / 1000,
        ease: ANIMATION_CONFIG.easing.standard
      }
    },
  },
};

// Animation Utilities
export const animateScroll = (element: HTMLElement, deltaY: number) => {
  const scrollAmount = deltaY * ANIMATION_CONFIG.sidebar.scrollSensitivity;
  element.scrollTop += scrollAmount;
};

export const smoothScrollTo = (element: HTMLElement, target: number, duration: number) => {
  const start = element.scrollTop;
  const distance = target - start;
  const startTime = performance.now();

  const scrollStep = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-in-out function
    const easeInOut = 0.5 - 0.5 * Math.cos(progress * Math.PI);

    element.scrollTop = start + distance * easeInOut;

    if (progress < 1) {
      requestAnimationFrame(scrollStep);
    }
  };

  requestAnimationFrame(scrollStep);
};