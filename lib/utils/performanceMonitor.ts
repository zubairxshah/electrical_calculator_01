/**
 * Performance Monitoring Utilities
 * 
 * Tracks calculation performance and identifies bottlenecks
 * Target: <100ms calculation response time
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  success: boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000

  /**
   * Time a calculation function
   */
  async timeCalculation<T>(
    name: string,
    calculation: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    let success = true
    
    try {
      const result = await calculation()
      const duration = performance.now() - start
      
      this.addMetric({ name, duration, timestamp: Date.now(), success })
      
      // Warn if calculation exceeds target
      if (duration > 100) {
        console.warn(`⚠️ Slow calculation: ${name} took ${duration.toFixed(2)}ms (target: <100ms)`)
      }
      
      return { result, duration }
    } catch (error) {
      success = false
      const duration = performance.now() - start
      this.addMetric({ name, duration, timestamp: Date.now(), success })
      throw error
    }
  }

  /**
   * Add performance metric
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Limit metrics array size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  /**
   * Get performance statistics
   */
  getStats(calculationType?: string): {
    count: number
    averageTime: number
    p95Time: number
    slowCalculations: number
    successRate: number
  } {
    let filteredMetrics = this.metrics
    
    if (calculationType) {
      filteredMetrics = this.metrics.filter(m => m.name.includes(calculationType))
    }
    
    if (filteredMetrics.length === 0) {
      return { count: 0, averageTime: 0, p95Time: 0, slowCalculations: 0, successRate: 0 }
    }
    
    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b)
    const successfulCalculations = filteredMetrics.filter(m => m.success).length
    
    return {
      count: filteredMetrics.length,
      averageTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95Time: durations[Math.floor(durations.length * 0.95)] || 0,
      slowCalculations: durations.filter(d => d > 100).length,
      successRate: successfulCalculations / filteredMetrics.length
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Get recent slow calculations
   */
  getSlowCalculations(limit = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > 100)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Decorator for timing calculations
 */
export function timed(calculationType: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!
    
    descriptor.value = (async function (this: any, ...args: any[]) {
      const { result } = await performanceMonitor.timeCalculation(
        `${calculationType}.${propertyName}`,
        () => method.apply(this, args)
      )
      return result
    }) as any
    
    return descriptor
  }
}

/**
 * Simple timing wrapper for functions
 */
export async function withTiming<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const { result } = await performanceMonitor.timeCalculation(name, fn)
  return result
}