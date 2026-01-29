/**
 * Performance Monitoring Utilities for UI Components
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'frames' | 'bytes' | 'count';
  timestamp: Date;
  component?: string;
  context?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private maxMetrics: number = 500;
  private enabled: boolean = true;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Measure the execution time of a function
   */
  public measure<T>(name: string, fn: () => T, context?: Record<string, any>): T {
    if (!this.enabled) return fn();

    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.recordMetric({
      name,
      value: end - start,
      unit: 'ms',
      timestamp: new Date(),
      context
    });

    return result;
  }

  /**
   * Measure an async function
   */
  public async measureAsync<T>(name: string, fn: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    if (!this.enabled) return fn();

    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    this.recordMetric({
      name,
      value: end - start,
      unit: 'ms',
      timestamp: new Date(),
      context
    });

    return result;
  }

  /**
   * Record a custom performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    if (!this.enabled) return;

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Start observing performance entries
   */
  public observe(entryTypes: ('measure' | 'navigation' | 'resource' | 'paint' | 'largest-contentful-paint' | 'first-input')[]): void {
    if (!this.enabled) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.recordMetric({
          name: entry.name,
          value: entry.startTime,
          unit: 'ms',
          timestamp: new Date(),
          context: {
            duration: entry.duration,
            entryType: entry.entryType,
            ...(entry as any) // Include additional properties if available
          }
        });
      });
    });

    observer.observe({ entryTypes });
    this.observers.push(observer);
  }

  /**
   * Track animation performance
   */
  public trackAnimation(renderCallback: FrameRequestCallback, maxFrameTime: number = 16.67): void {
    if (!this.enabled) {
      requestAnimationFrame(renderCallback);
      return;
    }

    const startTime = performance.now();
    let lastFrameTime = startTime;

    const wrappedCallback = (timestamp: number) => {
      const frameTime = timestamp - lastFrameTime;
      lastFrameTime = timestamp;

      // Record frame timing
      this.recordMetric({
        name: 'frame_render_time',
        value: frameTime,
        unit: 'ms',
        timestamp: new Date()
      });

      // Check for dropped frames
      if (frameTime > maxFrameTime * 2) {
        this.recordMetric({
          name: 'dropped_frame_warning',
          value: frameTime,
          unit: 'ms',
          timestamp: new Date(),
          context: {
            expectedFrameTime: maxFrameTime,
            actualFrameTime: frameTime
          }
        });
      }

      renderCallback(timestamp);
    };

    requestAnimationFrame(wrappedCallback);
  }

  /**
   * Get average value for a specific metric
   */
  public getAverageMetric(name: string): number | null {
    const filteredMetrics = this.metrics.filter(m => m.name === name);
    if (filteredMetrics.length === 0) return null;

    const sum = filteredMetrics.reduce((acc, curr) => acc + curr.value, 0);
    return sum / filteredMetrics.length;
  }

  /**
   * Get metrics for a specific time range
   */
  public getMetrics(from: Date, to: Date): PerformanceMetric[] {
    return this.metrics.filter(m => m.timestamp >= from && m.timestamp <= to);
  }

  /**
   * Get all recorded metrics
   */
  public getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Stop all observers
   */
  public disconnectObservers(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Performance check for frame rate
   */
  public checkFrameRate(callback: (fps: number) => void, interval: number = 1000): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const checkFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= interval) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        callback(fps);

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(checkFPS);
    };

    requestAnimationFrame(checkFPS);
  }
}

// Convenience functions
export const measureFunction = <T>(name: string, fn: () => T, context?: Record<string, any>): T => {
  return PerformanceMonitor.getInstance().measure(name, fn, context);
};

export const measureAsyncFunction = <T>(name: string, fn: () => Promise<T>, context?: Record<string, any>): Promise<T> => {
  return PerformanceMonitor.getInstance().measureAsync(name, fn, context);
};

export const recordMetric = (metric: PerformanceMetric): void => {
  PerformanceMonitor.getInstance().recordMetric(metric);
};

// Initialize performance monitor
PerformanceMonitor.getInstance();