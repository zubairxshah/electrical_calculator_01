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

export default function ConduitFillReferenceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" /> Reference Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conduit & Cable Size Reference</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="conduit" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="conduit">Conduit Sizes</TabsTrigger>
            <TabsTrigger value="cable">Cable Types</TabsTrigger>
            <TabsTrigger value="fill">Fill Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="conduit" className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">NEC (US) Conduit Types</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-1 pr-2">Type</th>
                    <th className="pb-1 pr-2">Trade Sizes</th>
                    <th className="pb-1">Typical Use</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">EMT</td><td className="py-1 pr-2">1/2&quot; &ndash; 4&quot;</td><td className="py-1">Commercial buildings, most common</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">RMC</td><td className="py-1 pr-2">1/2&quot; &ndash; 6&quot;</td><td className="py-1">Hazardous locations, exposed areas</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">IMC</td><td className="py-1 pr-2">1/2&quot; &ndash; 4&quot;</td><td className="py-1">Medium-duty, lighter than RMC</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">PVC 40</td><td className="py-1 pr-2">1/2&quot; &ndash; 6&quot;</td><td className="py-1">Underground, non-metallic</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">PVC 80</td><td className="py-1 pr-2">1/2&quot; &ndash; 6&quot;</td><td className="py-1">Exposed PVC, heavy wall</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">FMC</td><td className="py-1 pr-2">3/8&quot; &ndash; 4&quot;</td><td className="py-1">Flexible connections, equipment</td></tr>
                  <tr><td className="py-1 pr-2 font-medium">LFMC</td><td className="py-1 pr-2">3/8&quot; &ndash; 4&quot;</td><td className="py-1">Wet locations, liquidtight</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-semibold mb-2">IEC/BS EN (International) Conduit Types</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-1 pr-2">Type</th>
                    <th className="pb-1 pr-2">Sizes (mm)</th>
                    <th className="pb-1">Typical Use</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">Rigid PVC</td><td className="py-1 pr-2">16 &ndash; 63mm</td><td className="py-1">Standard UK/EU installations</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">Steel</td><td className="py-1 pr-2">16 &ndash; 63mm</td><td className="py-1">Industrial, galvanised</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">Flexible PVC</td><td className="py-1 pr-2">16 &ndash; 50mm</td><td className="py-1">Concealed wiring, partitions</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">Flexible Metal</td><td className="py-1 pr-2">16 &ndash; 50mm</td><td className="py-1">Equipment connections</td></tr>
                  <tr><td className="py-1 pr-2 font-medium">Corrugated</td><td className="py-1 pr-2">16 &ndash; 63mm</td><td className="py-1">Embedded in concrete/plaster</td></tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground italic">
              NEC sizes use imperial trade designations (inches). IEC/BS EN uses metric nominal diameter (mm). These are NOT direct conversions &mdash; internal areas differ between standards.
            </p>
          </TabsContent>

          <TabsContent value="cable" className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">NEC Insulation Types</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-1 pr-2">Type</th>
                    <th className="pb-1 pr-2">Temperature</th>
                    <th className="pb-1">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">THHN/THWN-2</td><td className="py-1 pr-2">90&deg;C dry</td><td className="py-1">~70% of US building wire</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">XHHW-2</td><td className="py-1 pr-2">90&deg;C wet/dry</td><td className="py-1">Cross-linked PE, smaller OD than THW</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">THW</td><td className="py-1 pr-2">75&deg;C</td><td className="py-1">Larger insulation, common in older installs</td></tr>
                  <tr><td className="py-1 pr-2 font-medium">RHH/RHW</td><td className="py-1 pr-2">90&deg;C dry</td><td className="py-1">Rubber insulation, largest OD</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-semibold mb-2">IEC/BS EN Cable Types</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-1 pr-2">Type</th>
                    <th className="pb-1 pr-2">Temperature</th>
                    <th className="pb-1">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">PVC (V) 70&deg;C</td><td className="py-1 pr-2">70&deg;C</td><td className="py-1">Standard single-core PVC</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">XLPE (X) 90&deg;C</td><td className="py-1 pr-2">90&deg;C</td><td className="py-1">Preferred for new installations</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">EPR (R) 90&deg;C</td><td className="py-1 pr-2">90&deg;C</td><td className="py-1">Rubber, flexible</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2 font-medium">LSF/LSOH</td><td className="py-1 pr-2">70&deg;C</td><td className="py-1">Low smoke, zero halogen</td></tr>
                  <tr><td className="py-1 pr-2 font-medium">SWA</td><td className="py-1 pr-2">Varies</td><td className="py-1">Steel wire armoured, larger OD</td></tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground italic">
              NEC wire sizes use AWG/kcmil. IEC uses mm&sup2; conductor cross-section. The overall cable area (including insulation) is what matters for conduit fill.
            </p>
          </TabsContent>

          <TabsContent value="fill" className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">NEC Chapter 9 Table 1 &mdash; Fill Limits</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-1 pr-2">Conductors</th>
                    <th className="pb-1 pr-2">Fill Limit</th>
                    <th className="pb-1">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted"><td className="py-1 pr-2">1 conductor</td><td className="py-1 pr-2 font-medium">53%</td><td className="py-1">NEC Table 1</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2">2 conductors</td><td className="py-1 pr-2 font-medium">31%</td><td className="py-1">NEC Table 1</td></tr>
                  <tr className="border-b border-muted"><td className="py-1 pr-2">3+ conductors</td><td className="py-1 pr-2 font-medium">40%</td><td className="py-1">NEC Table 1</td></tr>
                  <tr><td className="py-1 pr-2">Nipple (&le;24&quot;)</td><td className="py-1 pr-2 font-medium">60%</td><td className="py-1">NEC 376.22</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="font-semibold mb-2">IEC/BS 7671 &mdash; Space Factor</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-1 pr-2">Condition</th>
                    <th className="pb-1 pr-2">Fill Limit</th>
                    <th className="pb-1">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted"><td className="py-1 pr-2">Standard run</td><td className="py-1 pr-2 font-medium">45%</td><td className="py-1">BS 7671 / IEC 60364</td></tr>
                  <tr><td className="py-1 pr-2">Short run (&le;600mm)</td><td className="py-1 pr-2 font-medium">55%</td><td className="py-1">IEC 60364</td></tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground italic">
              IEC uses a single space factor (45%) regardless of conductor count, unlike NEC which varies by count. IEC calculations use overall cable diameter including insulation.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
