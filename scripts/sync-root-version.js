#!/usr/bin/env node

/**
 * Sync root package.json version to match @dfosco/storyboard.
 *
 * Run automatically after `changeset version` via the npm "version" script.
 * All @dfosco/storyboard-* packages share a fixed version — this ensures
 * the root package.json stays in lockstep.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const sbPkg = JSON.parse(readFileSync(resolve(root, 'packages/storyboard/package.json'), 'utf-8'))
const rootPkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))

const isPrerelease = sbPkg.version.includes('-')

if (isPrerelease) {
  console.log(`[sync-version] skipping prerelease ${sbPkg.version} — root tracks stable only`)
} else if (rootPkg.version !== sbPkg.version) {
  rootPkg.version = sbPkg.version
  writeFileSync(resolve(root, 'package.json'), JSON.stringify(rootPkg, null, 4) + '\n')
  console.log(`[sync-version] root package.json → ${sbPkg.version}`)
} else {
  console.log(`[sync-version] already at ${sbPkg.version}`)
}
