/**
 * PDF Download Button Component
 *
 * Integrates with lib/pdfGenerator.ts for one-click PDF export
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { generateCalculationPDF, type PDFGenerationOptions } from '@/lib/pdfGenerator'

export interface PDFDownloadButtonProps {
  calculation: PDFGenerationOptions['calculation']
  standards: PDFGenerationOptions['standards']
  chartElementId?: string
  filename?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

export function PDFDownloadButton({
  calculation,
  standards,
  chartElementId,
  filename,
  variant = 'default',
  size = 'default',
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      const chartElement = chartElementId
        ? document.getElementById(chartElementId) ?? undefined
        : undefined

      const pdfBlob = await generateCalculationPDF({
        calculation,
        standards,
        chartElement,
        includeFormulas: true,
        includeBranding: true,
      })

      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `electromate-${calculation.calculationType}-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation failed:', error)
      // TODO: Show error toast
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      variant={variant}
      size={size}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF Report
        </>
      )}
    </Button>
  )
}
