import { useEffect, RefObject, useRef } from 'react';

interface UseMouseWheelScrollProps {
  targetRef: RefObject<HTMLElement>;
  enabled?: boolean;
  onScroll?: (deltaY: number) => void;
  sensitivity?: number;
  smoothScroll?: boolean;
  smoothDuration?: number;
}

export const useMouseWheelScroll = ({
  targetRef,
  enabled = true,
  onScroll,
  sensitivity = 1.0,
  smoothScroll = true,
  smoothDuration = 200
}: UseMouseWheelScrollProps) => {
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const element = targetRef.current;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      // Apply sensitivity factor
      const deltaY = event.deltaY * sensitivity;

      if (smoothScroll) {
        // Cancel any ongoing smooth scroll
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Smooth scroll to new position
        const startPosition = element.scrollTop;
        const targetPosition = startPosition + deltaY;
        const startTime = performance.now();

        const smoothScrollTo = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / smoothDuration, 1);

          // Ease-in-out function
          const easeInOut = 0.5 - 0.5 * Math.cos(progress * Math.PI);

          const currentPosition = startPosition + (targetPosition - startPosition) * easeInOut;
          element.scrollTop = currentPosition;

          if (progress < 1) {
            requestAnimationFrame(smoothScrollTo);
          }
        };

        requestAnimationFrame(smoothScrollTo);
      } else {
        // Direct scroll without animation
        element.scrollTop += deltaY;
      }

      // Call the optional onScroll callback
      if (onScroll) {
        onScroll(deltaY);
      }
    };

    // Add wheel event listener with passive: false to allow preventDefault
    element.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup function
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      element.removeEventListener('wheel', handleWheel);
    };
  }, [targetRef, enabled, onScroll, sensitivity, smoothScroll, smoothDuration]);

  return {};
};