'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import type { ElectrodeConfig } from '@/types/arc-flash'
import { TYPICAL_EQUIPMENT } from '@/lib/calculations/arc-flash/ieee1584Tables'
import { PPE_THRESHOLDS, TABLE_130_7_C_15_A } from '@/lib/standards/nfpa70e'
import { ELECTRODE_CONFIGS } from '@/components/arc-flash/ArcFlashInputForm'

/** Simple schematic: three conductors, optionally in a box and/or ending in a barrier */
function ConfigDiagram({ config }: { config: ElectrodeConfig }) {
  const boxed = config === 'VCB' || config === 'VCBB' || config === 'HCB'
  const horizontal = config === 'HCB' || config === 'HOA'
  const barrier = config === 'VCBB'
  return (
    <svg viewBox="0 0 64 48" className="h-12 w-16 shrink-0 text-foreground" aria-hidden>
      {boxed && <path d="M4 4 H60 V44 H4" fill="none" stroke="currentColor" strokeWidth="2" />}
      {horizontal
        ? [16, 24, 32].map((y) => <line key={y} x1="8" y1={y} x2="44" y2={y} stroke="#ea580c" strokeWidth="3" />)
        : [20, 32, 44].map((x) => <line key={x} x1={x} y1="6" x2={x} y2={barrier ? 30 : 34} stroke="#ea580c" strokeWidth="3" />)}
      {barrier && <line x1="12" y1="34" x2="52" y2="34" stroke="currentColor" strokeWidth="3" />}
    </svg>
  )
}

const th = 'pb-1 pr-2 text-left text-muted-foreground'
const td = 'py-1 pr-2'

export default function ArcFlashReferenceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" /> Reference Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Arc Flash Reference Guide</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="configs" className="mt-2">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
            <TabsTrigger value="configs">Configurations</TabsTrigger>
            <TabsTrigger value="typical">Typical values</TabsTrigger>
            <TabsTrigger value="ranges">Model range</TabsTrigger>
            <TabsTrigger value="times">Two times</TabsTrigger>
            <TabsTrigger value="ppe">PPE</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="configs" className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              IEEE 1584-2018 models five electrode configurations. Most enclosed equipment (switchgear, MCCs,
              panelboards) is VCB.
            </p>
            {ELECTRODE_CONFIGS.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <ConfigDiagram config={c.id} />
                <div>
                  <p className="font-semibold">{c.label}</p>
                  <p className="text-muted-foreground">{c.description}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="typical" className="text-sm space-y-2">
            <p className="text-muted-foreground">IEEE 1584-2018 Tables 8 and 10 typical values (use the equipment-class selector to pre-fill).</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className={th}>Equipment</th>
                  <th className={th}>Gap (mm)</th>
                  <th className={th}>H × W × D (mm)</th>
                  <th className={th}>Working distance (mm)</th>
                </tr>
              </thead>
              <tbody>
                {TYPICAL_EQUIPMENT.map((e) => (
                  <tr key={e.id} className="border-b border-muted">
                    <td className={`${td} font-medium`}>{e.label}</td>
                    <td className={td}>{e.gapMm}</td>
                    <td className={td}>
                      {e.heightMm} × {e.widthMm} × {e.depthMm}
                    </td>
                    <td className={td}>{e.workingDistanceMm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="ranges" className="text-sm space-y-3">
            <p className="text-muted-foreground">
              Inputs outside the empirical range are blocked — the model is never extrapolated.
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className={th}>Parameter</th>
                  <th className={th}>208–600 V</th>
                  <th className={th}>601 V–15 kV</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-muted"><td className={td}>Bolted fault current</td><td className={td}>0.5–106 kA</td><td className={td}>0.2–65 kA</td></tr>
                <tr className="border-b border-muted"><td className={td}>Conductor gap</td><td className={td}>6.35–76.2 mm</td><td className={td}>19.05–254 mm</td></tr>
                <tr className="border-b border-muted"><td className={td}>Working distance</td><td className={td}>≥ 305 mm</td><td className={td}>≥ 305 mm</td></tr>
                <tr className="border-b border-muted"><td className={td}>Frequency</td><td className={td}>50 or 60 Hz</td><td className={td}>50 or 60 Hz</td></tr>
              </tbody>
            </table>
            <p className="font-semibold">Warnings (calculation still runs)</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Enclosure height or width above 1244.6 mm — limited to 1244.6 mm</li>
              <li>Enclosure width below 4 × gap</li>
              <li>Arcing time above 2 s — optional 2 s cap where the worker can move away</li>
              <li>Reduced-current time shorter than the nominal time</li>
              <li>208–240 V: arcs may not be sustained</li>
            </ul>
          </TabsContent>

          <TabsContent value="times" className="text-sm space-y-2">
            <p>
              The arcing current varies, so IEEE 1584-2018 calculates a <strong>nominal</strong> and a{' '}
              <strong>reduced</strong> arcing current (reduced by the variation correction factor, VarCf). Each needs
              its own clearing time from the protective device curve.
            </p>
            <p>
              At the lower current an inverse-time device can take much longer to clear. In Annex D.2 (480 V, 45 kA)
              the nominal case clears in 61.3 ms (11.6 J/cm²), but the reduced case takes 319 ms and gives
              53.2 J/cm² — almost five times more. The higher of the two governs.
            </p>
          </TabsContent>

          <TabsContent value="ppe" className="text-sm space-y-3">
            <p className="font-semibold">NFPA 70E-2024 PPE categories (Table 130.7(C)(15)(c))</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className={th}>Incident energy</th>
                  <th className={th}>Outcome</th>
                  <th className={th}>Minimum arc rating</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-muted"><td className={td}>&lt; 1.2 cal/cm²</td><td className={td}>No arc-rated PPE category</td><td className={td}>—</td></tr>
                {PPE_THRESHOLDS.categories.map((c, i) => (
                  <tr key={c.category} className="border-b border-muted">
                    <td className={td}>
                      {i === 0 ? PPE_THRESHOLDS.boundaryCalcm2 : PPE_THRESHOLDS.categories[i - 1].minArcRatingCalcm2}–{c.minArcRatingCalcm2} cal/cm²
                    </td>
                    <td className={td}>Category {c.category}</td>
                    <td className={td}>
                      {c.minArcRatingCalcm2} cal/cm² ({c.minArcRatingJcm2} J/cm²)
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-muted"><td className={td}>&gt; 40 cal/cm²</td><td className={td}>DANGER — no category</td><td className={td}>De-energize</td></tr>
              </tbody>
            </table>
            <p className="font-semibold">Table method (Table 130.7(C)(15)(a))</p>
            <p className="text-muted-foreground">
              Applies only when the voltage, available fault current, clearing time and working distance are all
              within the row&apos;s limits. Otherwise an incident energy analysis is required.
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className={th}>Equipment</th>
                  <th className={th}>Max kA</th>
                  <th className={th}>Max clearing</th>
                  <th className={th}>Cat</th>
                  <th className={th}>AFB</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_130_7_C_15_A.map((r) => (
                  <tr key={r.id} className="border-b border-muted">
                    <td className={td}>{r.label}</td>
                    <td className={td}>{r.maxFaultKA}</td>
                    <td className={td}>{r.maxClearingS} s</td>
                    <td className={td}>{r.category}</td>
                    <td className={td}>{r.afbMm >= 1000 ? `${r.afbMm / 1000} m` : `${r.afbMm} mm`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="notes" className="text-sm space-y-3">
            <div>
              <p className="font-semibold">IEC 61482 mode</p>
              <p className="text-muted-foreground">
                IEC mode shows the same calculated values with metric units first. Clothing is specified by ATPV or
                ELIM (IEC 61482-1-1 open-arc test) at least equal to the incident energy, with garments to IEC
                61482-2. Box-test classes APC 1 / APC 2 (IEC 61482-1-2) are not selected from incident energy.
              </p>
            </div>
            <div>
              <p className="font-semibold">Differences from the IEEE spreadsheet v2.6.6</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>At exactly 600 V the spreadsheet uses the MV equations; this tool follows clause 4.10 and uses the LV equations (Eq. 25).</li>
                <li>For VOA above 600 V in the reduced case, the spreadsheet uses the full arcing current in one term; this tool uses the reduced current in both, as the standard specifies.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Standards</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>IEEE 1584-2018 — Guide for Performing Arc-Flash Hazard Calculations</li>
                <li>NFPA 70E-2024 — Standard for Electrical Safety in the Workplace</li>
                <li>IEC 61482-1-1:2019, IEC 61482-2:2018 — Protective clothing against the thermal hazards of an electric arc</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              Results support, but do not replace, an arc flash risk assessment by a qualified person (NFPA 70E
              130.5). AC systems only.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
