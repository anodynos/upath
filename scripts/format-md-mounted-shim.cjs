#!/usr/bin/env node
/**
 * format-md-mounted-shim — kill-safe markdown formatting for AgenZen-mounted repos (AZ-1756).
 *
 * WHY: `remark . --output` rewrites sources in-place via a DEFERRED terminal burst of
 * non-atomic truncate-then-write calls — one signal landing in that burst (run-p sibling-kill,
 * `timeout`, Ctrl-C) mass-truncates files to 0 bytes (AZ-1755: 736 files gutted on AgenZen
 * main). This repo therefore delegates `format:md` / `format:check:md` to AgenZen's SHARED
 * mirror-isolated, verify-then-atomic-rename implementation (`<AgenZen>/scripts/format-md.ts`)
 * instead of carrying its own drifting copy of the engine (CP#10 — one pattern, one home).
 *
 * CONTRACT:
 *   - This repo is designed to be MOUNTED at `<AgenZen>/.projects/<name>`. The shim resolves
 *     the AgenZen root by walking UP from this repo's git root until it finds the
 *     `agenzen.config.ts` marker (robust to mount depth, never a hardcoded `../..`).
 *   - Outside the mount (standalone clone): FAIL LOUD — clear message, exit 1, ZERO writes.
 *     Fail-safe degradation, never destruction. Markdown formatting is simply unavailable
 *     standalone; everything else about the repo works.
 *   - The shared formatter runs with cwd = THIS repo's root: it scopes to THIS repo's
 *     git-tracked *.md/*.mdc, honors THIS repo's `.remarkrc.json` + `.remarkignore`, and
 *     uses THIS repo's `node_modules/.bin/remark` (fails loud if absent — run npm install).
 *   - Verbs forwarded verbatim: `--check` (non-mutating verify) | `--write` (mutating,
 *     kill-safe: a SIGTERM at ANY instant leaves every source intact).
 *
 * CANONICAL SOURCE: `<AgenZen>/scripts/mounted/format-md-mounted-shim.cjs`. The copy in each
 * mounted repo MUST stay byte-identical — AgenZen's mounted-format-shim drift test enforces it.
 * SEE: AZ-1755 (post-mortem) · AZ-1756 (verse-wide defusal) ·
 *      `<AgenZen>/docs/patterns/mirror-verify-rename.pattern.mdc`
 */
'use strict'

const { execFileSync, spawnSync } = require('node:child_process')
const { existsSync } = require('node:fs')
const path = require('node:path')

function fail(msg) {
  console.error(`✖ format-md-mounted-shim: ${msg}`)
  process.exit(1)
}

// 1. THIS repo's root — the shim lives at <repo>/scripts/, so resolve from its own location.
let repoRoot
try {
  repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: __dirname,
    encoding: 'utf8',
  }).trim()
} catch (e) {
  fail(`cannot resolve this repo's git root from ${__dirname}: ${e.message.split('\n')[0]}`)
}

// 2. The AgenZen root — walk up from ABOVE the repo root until the marker (the repo itself
//    is never the AgenZen root; the contract is "mounted UNDER AgenZen").
let azRoot = null
for (let dir = path.dirname(repoRoot); ; dir = path.dirname(dir)) {
  if (existsSync(path.join(dir, 'agenzen.config.ts'))) {
    azRoot = dir
    break
  }
  if (path.dirname(dir) === dir) break // filesystem root reached
}
if (!azRoot)
  fail(
    `no AgenZen root (agenzen.config.ts marker) found above ${repoRoot}.\n` +
      `  This repo's markdown formatting delegates to AgenZen's shared kill-safe formatter\n` +
      `  (mirror + verify + atomic rename — see AZ-1755) and is only available when the repo\n` +
      `  is mounted at <AgenZen>/.projects/<name>. Standalone clones deliberately get NO\n` +
      `  markdown formatter rather than the in-place 'remark --output' that gutted 736 files.\n` +
      `  Nothing was written.`,
  )

// 3. Sanity-check the delegation target before launching anything.
const formatMd = path.join(azRoot, 'scripts', 'format-md.ts')
const tsxBin = path.join(azRoot, 'node_modules', '.bin', 'tsx')
if (!existsSync(formatMd)) fail(`AgenZen root ${azRoot} found, but scripts/format-md.ts is missing`)
if (!existsSync(tsxBin))
  fail(`AgenZen root ${azRoot} found, but node_modules/.bin/tsx is missing — run npm install there`)

// 4. Delegate. format-md.ts validates the verb itself (--check | --write) and resolves the
//    repo root from cwd; exit codes pass through (0 ok · 1 drift · 2 refusal/usage · 3 error).
const args = process.argv.slice(2)
const res = spawnSync(tsxBin, [formatMd, ...args], { cwd: repoRoot, stdio: 'inherit' })
if (res.error) fail(`failed to launch the shared formatter: ${res.error.message}`)
process.exit(res.signal ? 143 : (res.status ?? 1))
