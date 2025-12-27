/**
 * Glossary Dialog Component
 *
 * Modal dialog displaying battery terminology definitions
 *
 * @see specs/001-electromate-engineering-app/spec.md#US6
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BATTERY_GLOSSARY } from '@/lib/standards/batteryTypes'

interface GlossaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlossaryDialog({ open, onOpenChange }: GlossaryDialogProps) {
  // Sort glossary terms alphabetically
  const sortedTerms = Object.entries(BATTERY_GLOSSARY).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Battery Terminology Glossary</DialogTitle>
          <DialogDescription>
            Common terms and abbreviations used in battery specifications
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <dl className="space-y-4">
            {sortedTerms.map(([term, definition]) => (
              <div key={term} className="border-b pb-3 last:border-0">
                <dt className="font-semibold text-sm">{term}</dt>
                <dd className="text-sm text-muted-foreground mt-1">{definition}</dd>
              </div>
            ))}
          </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
