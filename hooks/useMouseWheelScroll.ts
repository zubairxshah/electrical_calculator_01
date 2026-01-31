import { useEffect, useRef } from 'react';

interface UseMouseWheelScrollOptions {
  targetRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  sensitivity?: number;
  smoothScroll?: boolean;
  smoothDuration?: number;
}

export const useMouseWheelScroll = ({
  targetRef,
  enabled = true,
  sensitivity = 1.0,
  smoothScroll = false,
  smoothDuration = 150,
}: UseMouseWheelScrollOptions) => {
  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const element = targetRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (element) {
        e.preventDefault();

        // Apply sensitivity factor
        const deltaX = e.deltaX * sensitivity;
        const deltaY = e.deltaY * sensitivity;

        if (smoothScroll) {
          // Smooth scrolling implementation
          element.scrollBy({
            left: deltaX,
            top: deltaY,
            behavior: 'smooth' as ScrollBehavior
          });
        } else {
          // Direct scrolling
          element.scrollLeft += deltaX;
          element.scrollTop += deltaY;
        }
      }
    };

    element?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element?.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, targetRef, sensitivity, smoothScroll, smoothDuration]);
};