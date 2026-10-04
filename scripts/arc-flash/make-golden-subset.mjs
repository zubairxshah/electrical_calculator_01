// Generates the IEEE 1584-2018 golden-data test fixture for the Arc Flash calculator.
//
// Source: 144,000 results from the official IEEE 1584-2018 Excel calculator, produced by
// LiaungYip/arcflash (MIT) and redistributed by jgrimard/arc-flash-calculator (MIT).
// The full file is ~23 MB, so we commit a deterministic, stratified 2,000-row subset:
// an equal share of rows from each of the 35 (electrode config x voltage) groups, spread
// evenly through each group so every I_bf / gap / D / T / enclosure level is represented.
// The 600 V groups and the VOA medium-voltage groups cover the two IEEE spreadsheet
// errata (research R3).
//
// Usage: node scripts/arc-flash/make-golden-subset.mjs [path-to-local-full-csv]

import fs from 'node:fs'
import path from 'node:path'

const SOURCE_URL =
  'https://raw.githubusercontent.com/jgrimard/arc-flash-calculator/main/ieee_1584_spreadsheet_results.csv'
const OUT = path.resolve('__tests__/fixtures/arc-flash/ieee1584-golden-subset.csv')
const TARGET_ROWS = 2000

async function loadSource() {
  const local = process.argv[2]
  if (local) return fs.readFileSync(local, 'utf8')
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`)
  return res.text()
}

const text = (await loadSource()).replace(/\r/g, '').trim()
const [header, ...rows] = text.split('\n')
if (rows.length !== 144000) throw new Error(`Expected 144000 rows, got ${rows.length}`)

const groups = new Map()
rows.forEach((r, i) => {
  const [ec, v] = r.split(',')
  const key = `${ec}|${v}`
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(i)
})

// Spread the budget across groups; the first (TARGET_ROWS % groups) groups take one extra row
const keys = [...groups.keys()].sort()
const base = Math.floor(TARGET_ROWS / keys.length)
const extra = TARGET_ROWS % keys.length
const picked = []
keys.forEach((key, g) => {
  const idx = groups.get(key)
  const n = base + (g < extra ? 1 : 0)
  const step = idx.length / n
  for (let k = 0; k < n; k++) picked.push(idx[Math.floor(k * step + step / 2)])
})

const out = picked.sort((a, b) => a - b).map((i) => rows[i])
fs.writeFileSync(OUT, [header, ...out].join('\n') + '\n')
console.log(`Wrote ${out.length} rows from ${keys.length} groups to ${OUT}`)
