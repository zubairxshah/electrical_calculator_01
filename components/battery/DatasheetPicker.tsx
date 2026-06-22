/**
 * Datasheet picker (US4) — select a real manufacturer model to pre-fill inputs.
 * Optional upload + OCR confirmation is layered on in a later phase (US6).
 */

'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DATASHEET_LIBRARY, getDatasheet, type DatasheetEntry } from '@/lib/datasheets/library'
import { chemistryDisplayLabel } from '@/lib/standards/batteryChemistryMap'
import { FileText, Upload, Loader2 } from 'lucide-react'

interface DatasheetPickerProps {
  value: string | null | undefined
  onSelect: (entry: DatasheetEntry | null) => void
  /** Optional OCR upload handler (US6). When omitted, the upload control is hidden. */
  onUpload?: (file: File) => Promise<void>
  uploading?: boolean
}

export function DatasheetPicker({ value, onSelect, onUpload, uploading }: DatasheetPickerProps) {
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUpload) return
    setError(null)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10 MB).')
      return
    }
    if (!/pdf|image\//.test(file.type)) {
      setError('Please upload a PDF or image datasheet.')
      return
    }
    try {
      await onUpload(file)
    } catch {
      setError('Could not read the datasheet — enter values manually.')
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Battery datasheet <span className="text-xs text-muted-foreground">(optional)</span>
      </Label>
      <Select
        value={value ?? 'none'}
        onValueChange={(v) => onSelect(v === 'none' ? null : (getDatasheet(v) ?? null))}
      >
        <SelectTrigger className="h-12">
          <SelectValue placeholder="Generic chemistry (no datasheet)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Generic chemistry (no datasheet)</SelectItem>
          {DATASHEET_LIBRARY.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.manufacturer} · {d.model} — {chemistryDisplayLabel[d.chemistry]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onUpload && (
        <div className="pt-1">
          <Button asChild variant="outline" size="sm" className="gap-2" disabled={uploading}>
            <label className="cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Reading…' : 'Upload datasheet (OCR)'}
              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
            </label>
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Detected values are shown for confirmation before they are applied.
          </p>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
