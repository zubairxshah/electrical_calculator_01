/**
 * Calculation Cache Layer
 *
 * Provides in-memory memoization for expensive calculations to avoid redundant computation.
 * Uses a simple LRU (Least Recently Used) cache with configurable size limits.
 *
 * This prevents recalculation of identical inputs, especially useful for:
 * - Voltage drop calculations (expensive math.js operations)
 * - Cable ampacity lookups (table searches)
 * - Solar array sizing (NREL calculations)
 * - Lighting lumen method (room index calculations)
 *
 * @module CalculationCache
 */

import crypto from 'crypto';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  result: T;
  timestamp: number;
  hitCount: number;
  computeTimeMs: number;
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  avgComputeTimeMs: number;
}

/**
 * LRU Cache implementation for calculation results
 *
 * Thread-safe for single-threaded Node.js event loop.
 * Suitable for both server-side calculations and in-memory persistence.
 */
export class CalculationCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0,
    avgComputeTimeMs: 0,
  };

  constructor(private maxSize: number = 1000) {}

  /**
   * Generate cache key from input object (order-independent)
   *
   * Uses SHA256 hash of JSON stringified sorted object to ensure
   * that inputs with same values but different key order produce same key.
   *
   * @param input - Input parameters object
   * @returns Hash key for caching
   */
  private generateKey(input: Record<string, any>): string {
    const sorted = Object.keys(input)
      .sort()
      .reduce((acc, key) => {
        acc[key] = input[key];
        return acc;
      }, {} as Record<string, any>);

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(sorted))
      .digest('hex');

    return hash.substring(0, 16); // Truncate for readability
  }

  /**
   * Get cached result or compute new one
   *
   * @param input - Input parameters (must be serializable)
   * @param computeFn - Function that computes the result if not cached
   * @returns Cached or newly computed result
   */
  async get(input: Record<string, any>, computeFn: () => Promise<T> | T): Promise<T> {
    const key = this.generateKey(input);

    // Cache hit
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.hitCount++;

      // Update access order (move to end for LRU)
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      this.accessOrder.push(key);

      this.stats.hits++;
      this.updateHitRate();

      return entry.result;
    }

    // Cache miss - compute
    this.stats.misses++;
    const startTime = performance.now();

    const result = await Promise.resolve(computeFn());

    const computeTimeMs = performance.now() - startTime;

    // Add to cache
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hitCount: 0,
      computeTimeMs,
    });

    this.accessOrder.push(key);
    this.stats.size = this.cache.size;

    // Evict if over limit (remove least recently used)
    if (this.cache.size > this.maxSize) {
      const keyToEvict = this.accessOrder.shift();
      if (keyToEvict) {
        this.cache.delete(keyToEvict);
        this.stats.evictions++;
      }
    }

    this.updateHitRate();
    return result;
  }

  /**
   * Synchronous get for use in non-async contexts
   *
   * Only returns cached value; does not compute.
   * Use for read-only scenarios where compute cost is handled elsewhere.
   *
   * @param input - Input parameters
   * @returns Cached result or undefined
   */
  getSync(input: Record<string, any>): T | undefined {
    const key = this.generateKey(input);
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.hitCount++;
      this.stats.hits++;
      this.updateHitRate();
      return entry.result;
    }
    return undefined;
  }

  /**
   * Manually set cache entry
   *
   * Useful for pre-populating cache with known values.
   */
  set(input: Record<string, any>, result: T, computeTimeMs: number = 0): void {
    const key = this.generateKey(input);

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hitCount: 0,
      computeTimeMs,
    });

    this.accessOrder.push(key);
    this.stats.size = this.cache.size;

    // Evict if over limit
    if (this.cache.size > this.maxSize) {
      const keyToEvict = this.accessOrder.shift();
      if (keyToEvict) {
        this.cache.delete(keyToEvict);
        this.stats.evictions++;
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      avgComputeTimeMs: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalEntries = this.cache.values();
    let totalComputeTime = 0;
    let count = 0;

    for (const entry of totalEntries) {
      totalComputeTime += entry.computeTimeMs;
      count++;
    }

    return {
      ...this.stats,
      avgComputeTimeMs: count > 0 ? totalComputeTime / count : 0,
    };
  }

  /**
   * Get entries older than specified age (ms)
   */
  getStaleEntries(ageMs: number): Array<{ key: string; age: number }> {
    const now = Date.now();
    const stale: Array<{ key: string; age: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > ageMs) {
        stale.push({ key, age });
      }
    }

    return stale.sort((a, b) => b.age - a.age);
  }

  /**
   * Remove entries older than specified age
   */
  evictStale(ageMs: number): number {
    const stale = this.getStaleEntries(ageMs);
    let evicted = 0;

    for (const { key } of stale) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      evicted++;
    }

    this.stats.size = this.cache.size;
    return evicted;
  }

  /**
   * Export cache for persistence (e.g., to localStorage or database)
   */
  export(): Array<{ input: string; result: T; computeTimeMs: number }> {
    const exported: Array<{ input: string; result: T; computeTimeMs: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      exported.push({
        input: key,
        result: entry.result,
        computeTimeMs: entry.computeTimeMs,
      });
    }

    return exported;
  }

  /**
   * Import cache from persistent storage
   */
  import(data: Array<{ input: string; result: T; computeTimeMs: number }>): void {
    this.clear();

    for (const item of data) {
      this.cache.set(item.input, {
        result: item.result,
        timestamp: Date.now(),
        hitCount: 0,
        computeTimeMs: item.computeTimeMs,
      });
      this.accessOrder.push(item.input);
    }

    this.stats.size = this.cache.size;
  }

  /**
   * Update hit rate statistic
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * Global cache instances for each calculation type
 *
 * Initialize once and reuse throughout application lifecycle.
 */
export const calculationCaches = {
  cable: new CalculationCache(500),
  voltage: new CalculationCache(500),
  battery: new CalculationCache(300),
  solar: new CalculationCache(200),
  ups: new CalculationCache(200),
  lighting: new CalculationCache(300),
  breaker: new CalculationCache(300),
};

/**
 * Log cache statistics to console (useful for debugging)
 */
export function logCacheStats(): void {
  console.group('Cache Statistics');
  for (const [type, cache] of Object.entries(calculationCaches)) {
    const stats = cache.getStats();
    console.log(`${type}: ${stats.hits} hits, ${stats.misses} misses (${(stats.hitRate * 100).toFixed(1)}%), ${stats.evictions} evictions`);
  }
  console.groupEnd();
}

/**
 * Clear all caches (useful for testing or memory pressure)
 */
export function clearAllCaches(): void {
  for (const cache of Object.values(calculationCaches)) {
    cache.clear();
  }
}
