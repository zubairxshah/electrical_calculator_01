/**
 * Chart Export Hook
 *
 * Converts Recharts components to canvas/images for PDF export
 * Uses html2canvas integration
 */

'use client'

import { useCallback, useState } from 'react'
import html2canvas from 'html2canvas'

export interface UseChartExportReturn {
  /** Export chart as PNG data URL */
  exportAsImage: (elementId: string) => Promise<string | null>
  /** Export chart as canvas element */
  exportAsCanvas: (elementId: string) => Promise<HTMLCanvasElement | null>
  /** Is export in progress */
  isExporting: boolean
  /** Last export error */
  error: string | null
}

/**
 * Chart export hook with html2canvas
 *
 * @example
 * const { exportAsImage, isExporting } = useChartExport()
 *
 * const handleExport = async () => {
 *   const dataUrl = await exportAsImage('discharge-chart')
 *   if (dataUrl) {
 *     // Use in PDF or download
 *   }
 * }
 */
export function useChartExport(): UseChartExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Export chart element as PNG data URL
   */
  const exportAsImage = useCallback(async (elementId: string): Promise<string | null> => {
    setIsExporting(true)
    setError(null)

    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`)
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution for better quality
        logging: false,
        useCORS: true, // Allow cross-origin images
      })

      const dataUrl = canvas.toDataURL('image/png')
      return dataUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Chart export failed:', err)
      return null
    } finally {
      setIsExporting(false)
    }
  }, [])

  /**
   * Export chart element as canvas
   */
  const exportAsCanvas = useCallback(async (elementId: string): Promise<HTMLCanvasElement | null> => {
    setIsExporting(true)
    setError(null)

    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`)
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      })

      return canvas
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Chart export failed:', err)
      return null
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    exportAsImage,
    exportAsCanvas,
    isExporting,
    error,
  }
}
