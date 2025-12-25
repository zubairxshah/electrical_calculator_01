/**
 * localStorage Hook with Quota Monitoring
 *
 * Provides persistent storage with:
 * - Type-safe storage/retrieval
 * - Quota monitoring
 * - Error handling
 *
 * @see specs/001-electromate-engineering-app/spec.md#FR-016a
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

export interface LocalStorageOptions<T> {
  /** localStorage key */
  key: string
  /** Initial value if key doesn't exist */
  initialValue: T
  /** Serialize function (default: JSON.stringify) */
  serialize?: (value: T) => string
  /** Deserialize function (default: JSON.parse) */
  deserialize?: (value: string) => T
}

export interface LocalStorageReturn<T> {
  /** Current value */
  value: T
  /** Update value */
  setValue: (value: T | ((prev: T) => T)) => void
  /** Remove value */
  removeValue: () => void
  /** Storage quota info */
  quota: {
    /** Estimated quota (bytes) */
    quota?: number
    /** Current usage (bytes) */
    usage?: number
    /** Usage percentage (0-100) */
    usagePercent?: number
    /** Is approaching quota (>80%) */
    isApproachingQuota: boolean
  }
  /** Refresh quota info */
  refreshQuota: () => void
}

/**
 * localStorage hook with quota monitoring
 *
 * @example
 * const { value, setValue, quota } = useLocalStorage({
 *   key: 'battery-calculations',
 *   initialValue: [],
 * })
 */
export function useLocalStorage<T>(
  options: LocalStorageOptions<T>
): LocalStorageReturn<T> {
  const {
    key,
    initialValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options

  // State
  const [value, setValueState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? deserialize(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const [quota, setQuota] = useState<LocalStorageReturn<T>['quota']>({
    isApproachingQuota: false,
  })

  /**
   * Update localStorage quota info
   */
  const refreshQuota = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.storage) {
      return
    }

    navigator.storage.estimate().then((estimate) => {
      const quota = estimate.quota
      const usage = estimate.usage

      if (quota && usage) {
        const usagePercent = (usage / quota) * 100
        const isApproachingQuota = usagePercent > 80

        setQuota({
          quota,
          usage,
          usagePercent,
          isApproachingQuota,
        })

        // Warn if approaching quota
        if (isApproachingQuota) {
          console.warn(
            `localStorage approaching quota: ${usagePercent.toFixed(1)}% used (${(usage / 1024 / 1024).toFixed(1)}MB / ${(quota / 1024 / 1024).toFixed(1)}MB)`
          )
        }
      }
    })
  }, [])

  /**
   * Update value and persist to localStorage
   */
  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue

        setValueState(valueToStore)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialize(valueToStore))
          refreshQuota()
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)

        // Check if quota exceeded
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded!')
          // Trigger quota warning in UI (handled by parent component)
        }
      }
    },
    [key, serialize, value, refreshQuota]
  )

  /**
   * Remove value from localStorage
   */
  const removeValue = useCallback(() => {
    try {
      setValueState(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        refreshQuota()
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue, refreshQuota])

  // Initialize quota on mount
  useEffect(() => {
    refreshQuota()
  }, [refreshQuota])

  return {
    value,
    setValue,
    removeValue,
    quota,
    refreshQuota,
  }
}
