/**
 * Datasheet parameter extraction (US6, P3 stretch — ADR-005 pattern).
 *
 * Client-side only. Tesseract.js + pdfjs-dist are dynamically imported so the
 * ~2.5MB OCR bundle loads ONLY when a user actually uploads a datasheet (it
 * never enters the initial page bundle). Extraction NEVER auto-applies — it
 * returns candidate fields + a confidence score for explicit user confirmation,
 * and manual entry / library selection remain available on failure (C6, C7).
 */

import type { DatasheetEntry } from './library'
import { legacyToCanonical } from '@/lib/standards/batteryChemistryMap'

export interface ExtractionResult {
  fields: Partial<DatasheetEntry>
  /** 0..1 overall confidence */
  confidence: number
  /** raw OCR text (for debugging / manual review) */
  raw: string
}

const MAX_BYTES = 10 * 1024 * 1024

async function fileToImageDataUrl(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist')
    // Use the bundled worker.
    // @ts-expect-error - worker entry resolved by the bundler
    pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs')).default
    const buf = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: buf }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    return canvas.toDataURL('image/png')
  }
  return URL.createObjectURL(file)
}

/** Parse common datasheet parameters out of raw OCR text. */
function parseFields(text: string): Partial<DatasheetEntry> {
  const fields: Partial<DatasheetEntry> = {}
  const ah = text.match(/(\d+(?:\.\d+)?)\s*Ah/i)
  if (ah) fields.nameplateAh = parseFloat(ah[1])
  const v = text.match(/(\d+(?:\.\d+)?)\s*V(?!A)/i)
  if (v) fields.nominalVoltage = parseFloat(v[1])
  const rate = text.match(/C\/?\s?(\d+)/i)
  if (rate) fields.ratedAtCRate = `C/${rate[1]}`
  // chemistry keyword sniffing
  const lower = text.toLowerCase()
  if (lower.includes('lifepo4') || lower.includes('lfp')) fields.chemistry = legacyToCanonical['LiFePO4']
  else if (lower.includes('agm')) fields.chemistry = 'VRLA-AGM'
  else if (lower.includes('gel')) fields.chemistry = 'VRLA-GEL'
  else if (lower.includes('flooded')) fields.chemistry = 'FLA'
  else if (lower.includes('nicd') || lower.includes('nickel-cadmium')) fields.chemistry = 'NiCd'
  return fields
}

export async function extractFromFile(file: File): Promise<ExtractionResult> {
  if (file.size > MAX_BYTES) throw new Error('File too large (max 10 MB).')
  if (!/pdf|image\//.test(file.type)) throw new Error('Unsupported file type — upload a PDF or image.')

  const { default: Tesseract } = await import('tesseract.js')
  const image = await fileToImageDataUrl(file)
  const worker = await Tesseract.createWorker('eng')
  try {
    const { data } = await worker.recognize(image)
    const fields = parseFields(data.text)
    const detectedCount = Object.keys(fields).length
    // crude confidence: OCR confidence blended with how many fields we recognized
    const confidence = Math.min(1, (data.confidence / 100) * (detectedCount / 4 + 0.25))
    return { fields, confidence, raw: data.text }
  } finally {
    await worker.terminate()
  }
}
