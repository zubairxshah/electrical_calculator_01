# IEEE 1584-2018 golden test data

`ieee1584-golden-subset.csv` holds 2,000 reference results from the **official IEEE 1584-2018 Excel arc flash calculator**. The arc flash engine is tested against them (`__tests__/unit/calculations/arc-flash/golden.test.ts`).

## Provenance

- The 144,000-case dataset was generated from the IEEE 1584-2018 spreadsheet by [LiaungYip/arcflash](https://github.com/LiaungYip/arcflash) (MIT License).
- It's redistributed in [jgrimard/arc-flash-calculator](https://github.com/jgrimard/arc-flash-calculator) (MIT License), file `ieee_1584_spreadsheet_results.csv`.
- The values match the equations in IEEE 1584-2018, including two cases where the IEEE spreadsheet v2.6.6 deviates from the standard (Voc = 600 V exactly; VOA medium-voltage reduced case). See `specs/012-arc-flash/research.md` R3.

## Columns

| Column | Unit | Meaning |
|---|---|---|
| EC | — | Electrode configuration (VCB, VCBB, HCB, VOA, HOA) |
| V_oc | kV | Open-circuit (line-to-line) voltage |
| I_bf | kA | Bolted fault current |
| G | mm | Gap between conductors |
| D | mm | Working distance |
| T | ms | Arcing time (the same for both cases) |
| width, height, depth | mm | Enclosure dimensions |
| I_arc_max, I_arc_min | kA | Arcing current, nominal and reduced (variation-corrected) |
| E_joules_max, E_joules_min | J/cm² | Incident energy, nominal and reduced |
| AFB_max, AFB_min | mm | Arc flash boundary, nominal and reduced |

## Sampling

The rows are a deterministic, stratified sample: an equal share (57–58 rows) from each of the 35 (electrode configuration × voltage) groups, spread evenly through each group. Every level of I_bf, G, D, T, enclosure size and depth in the full dataset is represented.

## Regenerate

```bash
node scripts/arc-flash/make-golden-subset.mjs            # downloads the full CSV
node scripts/arc-flash/make-golden-subset.mjs <local.csv> # or uses a local copy
```
