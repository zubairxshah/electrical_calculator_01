'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { generateEarthingReport, type EarthingReportData } from '@/lib/reports/earthingPdfGenerator'

interface EarthingPDFButtonProps {
  data: EarthingReportData
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

export function EarthingPDFButton({ data, variant = 'default', size = 'default' }: EarthingPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      const pdfBlob = await generateEarthingReport(data)

      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `earthing-calculation-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={isGenerating} variant={variant} size={size}>
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
