'use client'

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMotorStartingStore } from '@/stores/useMotorStartingStore'
import {
  IEEE_1668_THRESHOLDS,
  NEMA_CODE_LETTERS,
  IEC_DESIGN_CLASSES,
  NEMA_DESIGN_CLASSES,
} from '@/lib/calculations/motor-starting/motorStartingData'

export default function ReferenceGuideDialog() {
  const { referenceGuideOpen, toggleReferenceGuide } = useMotorStartingStore()

  return (
    <Dialog open={referenceGuideOpen} onOpenChange={(o) => toggleReferenceGuide(o)}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Motor Starting — Reference Guide</DialogTitle>
          <DialogDescription>
            NEC and IEC reference data. Switch tabs for design classes, code letters, and IEEE 1668 voltage-dip thresholds.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="design">Design Classes</TabsTrigger>
            <TabsTrigger value="code">Code Letters</TabsTrigger>
            <TabsTrigger value="dip">IEEE 1668</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-3 pt-4">
            <h4 className="font-semibold text-sm">NEMA Design A–D (NEMA MG 1)</h4>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr><th className="text-left p-2">Design</th><th>I_st / I_rated</th><th>T_st / T_rated</th><th>Slip %</th></tr>
              </thead>
              <tbody>
                {NEMA_DESIGN_CLASSES.map((d) => (
                  <tr key={d.design} className="border-t">
                    <td className="p-2">Design {d.design}</td>
                    <td className="text-center">{d.iStartPerIRatedTypical}</td>
                    <td className="text-center">{d.tStartPerTRated}</td>
                    <td className="text-center">{d.slipPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h4 className="font-semibold text-sm pt-3">IEC Design N/H (IEC 60034-12)</h4>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr><th className="text-left p-2">Design</th><th>I_st / I_rated</th><th>T_st / T_rated</th><th>T_breakdown / T_rated</th></tr>
              </thead>
              <tbody>
                {IEC_DESIGN_CLASSES.map((d) => (
                  <tr key={d.design} className="border-t">
                    <td className="p-2">Design {d.design}</td>
                    <td className="text-center">{d.iStartPerIRatedDefault}</td>
                    <td className="text-center">{d.tStartPerTRatedDefault}</td>
                    <td className="text-center">{d.tBreakdownPerTRated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="code" className="pt-4">
            <h4 className="font-semibold text-sm mb-2">NEMA Code Letters (NEC 430.7(B)) — Locked-Rotor kVA/HP</h4>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr><th className="text-left p-2">Letter</th><th>Min</th><th>Mid</th><th>Max</th></tr>
              </thead>
              <tbody>
                {NEMA_CODE_LETTERS.map((c) => (
                  <tr key={c.letter} className="border-t">
                    <td className="p-2 font-mono">{c.letter}</td>
                    <td className="text-center font-mono">{c.kvaPerHpMin}</td>
                    <td className="text-center font-mono font-semibold">{c.kvaPerHpMid}</td>
                    <td className="text-center font-mono">{c.kvaPerHpMax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-2">
              IEC 60034-12 publishes ranges by design class rather than letter codes; defaults: I_start ≈ 6.5× I_rated.
            </p>
          </TabsContent>

          <TabsContent value="dip" className="pt-4">
            <h4 className="font-semibold text-sm mb-2">IEEE 1668-2017 Voltage-Dip Thresholds</h4>
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr><th className="text-left p-2">Scenario</th><th>Max Dip</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {IEEE_1668_THRESHOLDS.map((t) => (
                  <tr key={t.scenario} className="border-t">
                    <td className="p-2">{t.label}</td>
                    <td className="text-center font-mono">{t.dipPercentMax}%</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {t.scenario === 'sensitive_loads' && 'Hospitals, CNC, computers'}
                      {t.scenario === 'transient_motor_start' && 'During motor start, < 5 s'}
                      {t.scenario === 'steady_state_common' && 'Common industrial loads'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
