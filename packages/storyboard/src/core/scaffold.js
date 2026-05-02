#!/usr/bin/env node
/**
 * storyboard-scaffold — sync scaffold files from @dfosco/storyboard.
 *
 * Reads scaffold/manifest.json and copies files to the consumer repo:
 * - "scaffold" mode: only if target doesn't exist (never overwrites config)
 * - "updateable" mode: always overwrites with latest (skills, scripts)
 *
 * Usage:
 *   npx storyboard-scaffold
 */

import fs from 'node:fs'
import path from 'node:path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const scaffoldRoot = path.resolve(__dirname, '..', '..', 'scaffold')
const consumerRoot = process.cwd()

const manifestPath = path.join(scaffoldRoot, 'manifest.json')
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Could not find scaffold/manifest.json in @dfosco/storyboard-core')
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

function copyFileSync(src, dest) {
  const dir = path.dirname(dest)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.copyFileSync(src, dest)
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

let created = 0
let updated = 0
let skipped = 0

for (const file of manifest.files) {
  const srcPath = path.join(scaffoldRoot, path.relative('scaffold', file.source))
  const destPath = path.join(consumerRoot, file.target)

  if (file.directory) {
    if (file.mode === 'updateable') {
      copyDirSync(srcPath, destPath)
      updated++
      console.log(`  ✔ Updated ${file.target} (sync)`)
    } else {
      if (!fs.existsSync(destPath)) {
        copyDirSync(srcPath, destPath)
        created++
        console.log(`  ✔ Created ${file.target} (scaffold)`)
      } else {
        skipped++
        console.log(`  ⏭ Skipped ${file.target} (already exists)`)
      }
    }
    continue
  }

  if (file.mode === 'scaffold') {
    if (fs.existsSync(destPath)) {
      skipped++
      console.log(`  ⏭ Skipped ${file.target} (already exists)`)
    } else {
      copyFileSync(srcPath, destPath)
      created++
      console.log(`  ✔ Created ${file.target} (scaffold)`)
    }
  } else if (file.mode === 'updateable') {
    copyFileSync(srcPath, destPath)
    updated++
    console.log(`  ✔ Updated ${file.target} (sync)`)
  }

  // Make shell scripts executable
  if (file.target.endsWith('.sh')) {
    fs.chmodSync(destPath, 0o755)
  }
}

console.log('')
console.log(`✔ Scaffold complete: ${created} created, ${updated} updated, ${skipped} skipped.`)
