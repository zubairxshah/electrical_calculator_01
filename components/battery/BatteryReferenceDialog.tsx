/**
 * Battery reference guide — method, factors with defaults/ranges, and the
 * standards cited (015 US7; pattern of ConduitFillReferenceDialog).
 */

'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

const FACTORS: Array<[string, string, string, string]> = [
  ['Depth of discharge', 'Standby 100% · Cycling: chemistry recommended', 'Cycling override ≤ chemistry max', 'IEEE 485 / IEEE 1013, 1561'],
  ['Temperature (lead-acid)', 'IEEE 485 table, 1.00 at 25 °C (no credit above)', 'Table −3.9…51.7 °C, clamped outside', 'IEEE 485-2020 Table 1'],
  ['Temperature (other)', 'Coefficient below optimal band', 'Floor 0.40', 'Manufacturer / IEC 62619'],
  ['Aging (end of life)', '0.80 (≡ ×1.25)', '0.5–1.0', 'IEEE 485-2020'],
  ['Design margin', '1.10', '1.00–1.50', 'IEEE 485 practice 1.10–1.15'],
  ['Conversion efficiency', 'AC 95% · DC 100%', '50–100%', 'Load-side (inverter / DC-DC)'],
  ['Peukert exponent', 'Lead-acid 1.20–1.25 · Ni 1.10 · Li/flow 1.02', 'Override', 'Rate derating vs C/20'],
  ['Recharge factor', 'Lead-acid 1.10 · Ni 1.40 · Li 1.05 · Flow 1.25', '1.00–1.50', 'IEEE 946'],
]

const STANDARDS: Array<[string, string]> = [
  ['IEEE 485-2020', 'Sizing lead-acid batteries for stationary (standby/float) applications'],
  ['IEEE 1115', 'Sizing nickel-cadmium batteries for stationary applications'],
  ['IEEE 1013 / IEEE 1561', 'Sizing batteries for stand-alone / hybrid PV (cycling) systems'],
  ['IEEE 946', 'DC auxiliary power systems — charger sizing and recharge'],
  ['IEC 62485-2 / EN 50272-2', 'Safety requirements for stationary batteries — ventilation (Q = 0.05·n·I_gas·C_rt/1000)'],
  ['NEC 2020 Article 480', 'Storage batteries — disconnect (> 60 V DC), ventilation'],
  ['NEC 2020 Article 706', 'Energy storage systems (> 1 kWh)'],
  ['NFPA 855-2023', 'Stationary ESS installation — energy thresholds (Li-ion 20 kWh, lead-acid/NiCd 70 kWh)'],
]

export function BatteryReferenceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" aria-hidden="true" /> Reference Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Battery Sizing Reference</DialogTitle>
          <DialogDescription>Method, factors and the standards this calculator applies.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="method" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="method">Method</TabsTrigger>
            <TabsTrigger value="factors">Factors</TabsTrigger>
            <TabsTrigger value="standards">Standards</TabsTrigger>
          </TabsList>

          <TabsContent value="method" className="space-y-3 text-sm">
            <p>Required capacity for a single constant load:</p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`I   = P / (η_conv × V)
Ah  = I × t × TCF × DM / (DoD × Aging × K_rate)`}
            </pre>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li><strong>Standby / float</strong> (UPS, DC backup): IEEE 485 sizes to full discharge to the end voltage — no DoD cap. The aging factor is the margin for end of life.</li>
              <li><strong>Cycling</strong> (daily use, off-grid): the chemistry&apos;s recommended DoD limits usable capacity to protect cycle life.</li>
              <li>Cells in series = floor(min load voltage ÷ end voltage per cell); float voltage must stay below the load maximum.</li>
              <li>Runtime mode applies the same factors in reverse, so sizing and runtime round-trip.</li>
              <li>A multi-period duty cycle (momentary loads) is not modelled — size for the worst constant load or use the IEEE 485 worksheet.</li>
            </ul>
          </TabsContent>

          <TabsContent value="factors" className="text-sm">
            <table className="w-full text-xs">
              <caption className="sr-only">Factors, defaults, ranges and sources</caption>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="pb-1 pr-2">Factor</th>
                  <th scope="col" className="pb-1 pr-2">Default</th>
                  <th scope="col" className="pb-1 pr-2">Range</th>
                  <th scope="col" className="pb-1">Source</th>
                </tr>
              </thead>
              <tbody>
                {FACTORS.map(([name, def, range, src]) => (
                  <tr key={name} className="border-b border-muted align-top">
                    <th scope="row" className="py-1 pr-2 text-left font-medium">{name}</th>
                    <td className="py-1 pr-2">{def}</td>
                    <td className="py-1 pr-2">{range}</td>
                    <td className="py-1">{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="standards" className="text-sm">
            <dl className="space-y-2">
              {STANDARDS.map(([code, desc]) => (
                <div key={code}>
                  <dt className="font-medium">{code}</dt>
                  <dd className="text-muted-foreground">{desc}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
