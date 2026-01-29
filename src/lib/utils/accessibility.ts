/**
 * Accessibility Utilities for WCAG 2.1 AA Compliance
 */

export interface AccessibilityCheck {
  id: string;
  description: string;
  level: 'A' | 'AA' | 'AAA';
  element: Element | null;
  passed: boolean;
  message: string;
}

export class AccessibilityChecker {
  private static instance: AccessibilityChecker;
  private checks: AccessibilityCheck[] = [];
  private enabled: boolean = true;

  private constructor() {}

  public static getInstance(): AccessibilityChecker {
    if (!AccessibilityChecker.instance) {
      AccessibilityChecker.instance = new AccessibilityChecker();
    }
    return AccessibilityChecker.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Run a comprehensive accessibility audit
   */
  public runAudit(container?: HTMLElement): AccessibilityCheck[] {
    if (!this.enabled) return [];

    const target = container || document.body;
    const checks: AccessibilityCheck[] = [];

    // Check for alt attributes on images
    checks.push(...this.checkImageAltAttributes(target));

    // Check for proper heading structure
    checks.push(...this.checkHeadingStructure(target));

    // Check for sufficient color contrast
    checks.push(...this.checkColorContrast(target));

    // Check for focusable elements
    checks.push(...this.checkFocusableElements(target));

    // Check for ARIA labels
    checks.push(...this.checkAriaLabels(target));

    // Check for proper landmark roles
    checks.push(...this.checkLandmarks(target));

    // Store the checks
    this.checks = [...this.checks, ...checks];

    return checks;
  }

  /**
   * Check for proper alt attributes on images
   */
  private checkImageAltAttributes(container: HTMLElement): AccessibilityCheck[] {
    const images = container.querySelectorAll('img');
    const checks: AccessibilityCheck[] = [];

    images.forEach(img => {
      const hasAlt = img.hasAttribute('alt');
      const altValue = img.getAttribute('alt');

      checks.push({
        id: `img-alt-${img.outerHTML.substring(0, 20)}`,
        description: 'Image should have appropriate alt attribute',
        level: 'A',
        element: img,
        passed: hasAlt && altValue !== null,
        message: hasAlt && altValue !== null
          ? 'Image has appropriate alt attribute'
          : 'Image is missing alt attribute'
      });
    });

    return checks;
  }

  /**
   * Check for proper heading structure
   */
  private checkHeadingStructure(container: HTMLElement): AccessibilityCheck[] {
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const checks: AccessibilityCheck[] = [];

    // Check if there's at least one H1
    const hasH1 = headings.some(h => h.tagName === 'H1');
    checks.push({
      id: 'heading-h1-check',
      description: 'Page should have at least one H1 heading',
      level: 'A',
      element: hasH1 ? null : container.querySelector('h1'),
      passed: hasH1,
      message: hasH1
        ? 'Page has H1 heading'
        : 'Page is missing H1 heading'
    });

    // Check heading sequence
    let lastLevel = 0;
    for (let i = 0; i < headings.length; i++) {
      const currentLevel = parseInt(headings[i].tagName.charAt(1));

      // Check if heading level jumps more than one level
      if (currentLevel > lastLevel + 1) {
        checks.push({
          id: `heading-sequence-${i}`,
          description: 'Headings should follow proper sequence',
          level: 'AA',
          element: headings[i] as Element,
          passed: false,
          message: `Heading level jumps from H${lastLevel} to H${currentLevel}`
        });
      } else {
        checks.push({
          id: `heading-sequence-${i}`,
          description: 'Heading follows proper sequence',
          level: 'AA',
          element: headings[i] as Element,
          passed: true,
          message: `Heading level correctly follows sequence: H${lastLevel} to H${currentLevel}`
        });
      }

      lastLevel = currentLevel;
    }

    return checks;
  }

  /**
   * Check for sufficient color contrast
   */
  private checkColorContrast(container: HTMLElement): AccessibilityCheck[] {
    const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, a');
    const checks: AccessibilityCheck[] = [];

    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const bgColor = this.hexToRgb(computedStyle.backgroundColor) || this.getElementBackgroundColor(element);
      const textColor = this.hexToRgb(computedStyle.color);

      if (bgColor && textColor) {
        const contrastRatio = this.contrastRatio(bgColor, textColor);
        const isLargeText = parseFloat(computedStyle.fontSize) >= 18 ||
                          (parseFloat(computedStyle.fontSize) >= 14 &&
                           computedStyle.fontWeight === 'bold');

        const requiredRatio = isLargeText ? 3 : 4.5; // WCAG AA requirements
        const passed = contrastRatio >= requiredRatio;

        checks.push({
          id: `contrast-${element.tagName}-${element.textContent?.substring(0, 10)}`,
          description: 'Text should have sufficient color contrast',
          level: 'AA',
          element,
          passed,
          message: passed
            ? `Sufficient contrast ratio: ${contrastRatio.toFixed(2)}:1 (≥${requiredRatio}:1)`
            : `Insufficient contrast ratio: ${contrastRatio.toFixed(2)}:1 (<${requiredRatio}:1)`
        });
      }
    });

    return checks;
  }

  /**
   * Check for focusable elements
   */
  private checkFocusableElements(container: HTMLElement): AccessibilityCheck[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'area[href]'
    ].join(', ');

    const focusableElements = container.querySelectorAll(focusableSelectors);
    const checks: AccessibilityCheck[] = [];

    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      const hasTabIndex = element.hasAttribute('tabindex');
      const tabIndexValue = tabIndex ? parseInt(tabIndex) : 0;

      // Check for positive tabindex values (which can disrupt focus order)
      if (hasTabIndex && tabIndexValue > 0) {
        checks.push({
          id: `focus-tabindex-${index}`,
          description: 'Avoid positive tabindex values',
          level: 'A',
          element: element as Element,
          passed: false,
          message: `Element has positive tabindex value: ${tabIndexValue}. This can disrupt focus order.`
        });
      } else {
        checks.push({
          id: `focus-tabindex-${index}`,
          description: 'Element has appropriate tabindex',
          level: 'A',
          element: element as Element,
          passed: true,
          message: tabIndex ? `Element has tabindex: ${tabIndexValue}` : 'Element has natural tabindex'
        });
      }
    });

    return checks;
  }

  /**
   * Check for ARIA labels
   */
  private checkAriaLabels(container: HTMLElement): AccessibilityCheck[] {
    const elementsWithAria = container.querySelectorAll('[aria-label], [aria-labelledby], [role]');
    const checks: AccessibilityCheck[] = [];

    elementsWithAria.forEach((element, index) => {
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const role = element.getAttribute('role');

      if (role === 'button' || role === 'link' || role === 'menuitem') {
        const hasLabel = !!ariaLabel || !!ariaLabelledBy;

        checks.push({
          id: `aria-label-${index}`,
          description: `${role} should have accessible name`,
          level: 'A',
          element: element as Element,
          passed: hasLabel,
          message: hasLabel
            ? `${role} has accessible name`
            : `${role} is missing accessible name (aria-label or aria-labelledby)`
        });
      }
    });

    return checks;
  }

  /**
   * Check for proper landmark roles
   */
  private checkLandmarks(container: HTMLElement): AccessibilityCheck[] {
    const landmarkSelectors = [
      'header[role="banner"], [role="banner"]',
      'nav[role="navigation"], [role="navigation"]',
      'main[role="main"], [role="main"]',
      'footer[role="contentinfo"], [role="contentinfo"]',
      'aside[role="complementary"], [role="complementary"]'
    ];

    const checks: AccessibilityCheck[] = [];

    // Check for main landmark
    const mainElements = container.querySelectorAll('main, [role="main"]');
    checks.push({
      id: 'landmark-main',
      description: 'Page should have main landmark',
      level: 'A',
      element: mainElements.length > 0 ? mainElements[0] : null,
      passed: mainElements.length > 0,
      message: mainElements.length > 0
        ? 'Page has main landmark'
        : 'Page is missing main landmark'
    });

    // Check for navigation landmark
    const navElements = container.querySelectorAll('nav, [role="navigation"]');
    checks.push({
      id: 'landmark-nav',
      description: 'Page should have navigation landmark',
      level: 'A',
      element: navElements.length > 0 ? navElements[0] : null,
      passed: navElements.length > 0,
      message: navElements.length > 0
        ? 'Page has navigation landmark'
        : 'Page is missing navigation landmark'
    });

    return checks;
  }

  /**
   * Get element background color considering parent elements
   */
  private getElementBackgroundColor(element: Element): { r: number; g: number; b: number } | null {
    let currentElement: Element | null = element;

    while (currentElement) {
      const computedStyle = window.getComputedStyle(currentElement);
      const bgColor = computedStyle.backgroundColor;

      if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
        return this.hexToRgb(bgColor);
      }

      currentElement = currentElement.parentElement;
    }

    // Default white background if none found
    return { r: 255, g: 255, b: 255 };
  }

  /**
   * Convert color string to RGB object
   */
  private hexToRgb(color: string): { r: number; g: number; b: number } | null {
    // Handle rgb(r, g, b) format
    const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    // Handle hex format
    const hexMatch = color.replace('#', '').match(/.{1,2}/g);
    if (hexMatch && hexMatch.length >= 3) {
      return {
        r: parseInt(hexMatch[0], 16),
        g: parseInt(hexMatch[1], 16),
        b: parseInt(hexMatch[2], 16)
      };
    }

    return null;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private contrastRatio(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number {
    const luminance1 = this.relativeLuminance(color1);
    const luminance2 = this.relativeLuminance(color2);

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   */
  private relativeLuminance(color: { r: number; g: number; b: number }): number {
    const normalize = (val: number): number => {
      val /= 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };

    const r = normalize(color.r);
    const g = normalize(color.g);
    const b = normalize(color.b);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Get all accessibility checks
   */
  public getAllChecks(): AccessibilityCheck[] {
    return [...this.checks];
  }

  /**
   * Get failed checks only
   */
  public getFailedChecks(): AccessibilityCheck[] {
    return this.checks.filter(check => !check.passed);
  }

  /**
   * Clear all checks
   */
  public clearChecks(): void {
    this.checks = [];
  }
}

// Convenience functions
export const runAccessibilityAudit = (container?: HTMLElement): AccessibilityCheck[] => {
  return AccessibilityChecker.getInstance().runAudit(container);
};

export const getAccessibilityFailedChecks = (): AccessibilityCheck[] => {
  return AccessibilityChecker.getInstance().getFailedChecks();
};

// Initialize accessibility checker
AccessibilityChecker.getInstance();