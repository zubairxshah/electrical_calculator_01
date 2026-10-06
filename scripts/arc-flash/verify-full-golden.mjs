// Verifies the Arc Flash engine against ALL 144,000 IEEE 1584-2018 spreadsheet results (not part of CI).
//
// Downloads the full CSV (same source as make-golden-subset.mjs), then runs the env-gated Vitest file
// __tests__/unit/calculations/arc-flash/fullGolden.test.ts on the TypeScript engine and prints the max
// relative error per quantity. Target ≤ 1e-4 (research measured 2.4e-6). Record the output in the PR.
//
// Usage: node scripts/arc-flash/verify-full-golden.mjs [path-to-local-full-csv]

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const SOURCE_URL =
  'https://raw.githubusercontent.com/jgrimard/arc-flash-calculator/main/ieee_1584_spreadsheet_results.csv'

let file = process.argv[2]
if (!file) {
  file = path.join(os.tmpdir(), 'ieee1584-full-golden.csv')
  if (!fs.existsSync(file)) {
    console.log(`Downloading ${SOURCE_URL} ...`)
    const res = await fetch(SOURCE_URL)
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`)
    fs.writeFileSync(file, await res.text())
  }
}
console.log(`Using ${file}`)

const result = spawnSync(
  'npx',
  ['vitest', 'run', '__tests__/unit/calculations/arc-flash/fullGolden.test.ts', '--silent=false'],
  { stdio: 'inherit', shell: true, env: { ...process.env, AF_FULL_GOLDEN: path.resolve(file) } }
)
process.exit(result.status ?? 1)
