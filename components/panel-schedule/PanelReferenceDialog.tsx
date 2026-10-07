'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

const th = 'pb-1 pr-3 text-left text-muted-foreground font-normal'
const td = 'py-1 pr-3'

export default function PanelReferenceDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><BookOpen className="h-4 w-4 mr-2" /> Reference</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Panel schedule reference</DialogTitle></DialogHeader>
        <Tabs defaultValue="layout">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="layout">Numbering</TabsTrigger>
            <TabsTrigger value="balance">Balancing</TabsTrigger>
            <TabsTrigger value="nec">NEC demand</TabsTrigger>
            <TabsTrigger value="iec">IEC diversity</TabsTrigger>
            <TabsTrigger value="limits">Limitations</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="space-y-3 text-sm">
            <p>
              Spaces are numbered in two columns: odd numbers on the left, even on the right. Each row of the panel
              connects to one bus phase, rotating A, B, C down the panel (A, B on a 120/240 V single-phase panel).
              NEC 408.3(E) requires the A, B, C phase arrangement.
            </p>
            <table className="text-sm">
              <thead><tr><th className={th}>Row</th><th className={th}>Spaces</th><th className={th}>3φ phase</th><th className={th}>1φ 3W</th></tr></thead>
              <tbody>
                {[1, 2, 3, 4].map((r) => (
                  <tr key={r}><td className={td}>{r}</td><td className={td}>{2 * r - 1} / {2 * r}</td><td className={td}>{'ABC'[(r - 1) % 3]}</td><td className={td}>{'AB'[(r - 1) % 2]}</td></tr>
                ))}
              </tbody>
            </table>
            <p>
              A multi-pole breaker takes consecutive spaces on the same side (n, n+2, n+4), so a 2-pole breaker always
              spans two different phases and a 3-pole breaker spans all three. A circuit&apos;s VA is split equally
              across its poles.
            </p>
          </TabsContent>

          <TabsContent value="balance" className="space-y-3 text-sm">
            <p><strong>Imbalance</strong> = max |phase VA − average| ÷ average × 100 %. The default target is 10 %.</p>
            <p>
              <strong>Per-phase current</strong> = phase VA ÷ V<sub>LN</sub>. <strong>Total current</strong> = total VA ÷ (√3 × V<sub>LL</sub>)
              for three-phase, total VA ÷ V<sub>LL</sub> for single-phase. VA is added arithmetically (conservative).
            </p>
            <p>
              <strong>Neutral estimate</strong> = √(I<sub>A</sub>² + I<sub>B</sub>² + I<sub>C</sub>² − I<sub>A</sub>I<sub>B</sub> − I<sub>B</sub>I<sub>C</sub> − I<sub>C</sub>I<sub>A</sub>), using only line-to-neutral
              (1-pole) loads at unity power factor. Harmonics are ignored. Non-linear loads can carry triplen
              harmonic currents on the neutral that exceed this estimate.
            </p>
            <p>
              <strong>Balance</strong> proposes new space numbers. It tries the current layout with local improvements and a fresh
              largest-first placement, then keeps the better result (fewest moves on a tie). Locked circuits, spares and
              spaces never move, and nothing changes until you accept.
            </p>
          </TabsContent>

          <TabsContent value="nec" className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground">NEC 2020. Verify against the edition adopted by your AHJ.</p>
            <table className="text-sm w-full">
              <thead><tr><th className={th}>Load</th><th className={th}>Rule</th><th className={th}>Reference</th></tr></thead>
              <tbody>
                <tr><td className={td}>General lighting — dwelling</td><td className={td}>first 3,000 VA @100 %, 3,001–120,000 @35 %, rest @25 %</td><td className={td}>Table 220.42</td></tr>
                <tr><td className={td}>General lighting — hotel/motel</td><td className={td}>first 20,000 @60 %, 20,001–100,000 @50 %, rest @35 %</td><td className={td}>Table 220.42</td></tr>
                <tr><td className={td}>General lighting — warehouse</td><td className={td}>first 12,500 @100 %, rest @50 %</td><td className={td}>Table 220.42</td></tr>
                <tr><td className={td}>General lighting — hospital</td><td className={td}>first 50,000 @40 %, rest @20 %</td><td className={td}>Table 220.42</td></tr>
                <tr><td className={td}>General lighting — all others</td><td className={td}>100 %</td><td className={td}>Table 220.42</td></tr>
                <tr><td className={td}>Receptacles (non-dwelling)</td><td className={td}>first 10 kVA @100 %, rest @50 %</td><td className={td}>220.44</td></tr>
                <tr><td className={td}>Receptacles (dwelling)</td><td className={td}>included in general lighting</td><td className={td}>220.14(J)</td></tr>
                <tr><td className={td}>Kitchen equipment (non-dwelling)</td><td className={td}>1–2 units 100 %, 3: 90 %, 4: 80 %, 5: 70 %, ≥6: 65 %; not less than the two largest</td><td className={td}>220.56</td></tr>
                <tr><td className={td}>Heating vs cooling</td><td className={td}>larger of the two only</td><td className={td}>220.60</td></tr>
                <tr><td className={td}>Motors</td><td className={td}>100 % + 25 % of the largest motor; FLC from Tables 430.248/430.250</td><td className={td}>430.24, 430.6(A)(1)</td></tr>
                <tr><td className={td}>Continuous loads</td><td className={td}>+25 % (125 % total) after demand factors</td><td className={td}>215.2(A)(1)</td></tr>
                <tr><td className={td}>Main / feeder OCPD</td><td className={td}>next standard rating ≥ design current</td><td className={td}>240.6(A)</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground">
              Table 220.42 hotel/hospital factors do not apply to areas where all lighting is likely to be used at one time.
              The branch breaker check flags breakers below 125 % of a continuous load (210.20(A)).
            </p>
          </TabsContent>

          <TabsContent value="iec" className="space-y-3 text-sm">
            <p>
              IEC 60364 leaves demand and diversity to the designer. Each load category has an editable factor, 1.0 by
              default (no diversity). Enter the factors from your design basis or local practice.
            </p>
            <p>The optional assembly <strong>rated diversity factor</strong> (IEC 61439-2 assumed loading) is applied to the subtotal:</p>
            <table className="text-sm">
              <thead><tr><th className={th}>Outgoing circuits</th><th className={th}>Factor</th></tr></thead>
              <tbody>
                {[['1', '1.0'], ['2–3', '0.9'], ['4–5', '0.8'], ['6–9', '0.7'], ['10 or more', '0.6']].map(([n, f]) => (
                  <tr key={n}><td className={td}>{n}</td><td className={td}>{f}</td></tr>
                ))}
              </tbody>
            </table>
            <p>IEC mode does not add 125 % for continuous loads. Size the incoming device to the design current and the installation conditions.</p>
          </TabsContent>

          <TabsContent value="limits" className="space-y-2 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>One panelboard per calculation. Enter a sub-panel as a single load circuit with its demand VA.</li>
              <li>High-leg (4-wire) delta panels are not supported. A 3-wire delta allows only 2- and 3-pole loads.</li>
              <li>NEC dwelling optional methods (220.82–220.87), elevator, welder and other special demand rules are not included.</li>
              <li>The neutral estimate excludes harmonics.</li>
              <li>Results are for informational purposes. PE stamp/certification is the user&apos;s responsibility.</li>
            </ul>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
