/**
 * storyboard update[:channel|:version] — Update all @dfosco/storyboard-* packages.
 *
 * Usage:
 *   storyboard update                  # update to latest stable
 *   storyboard update:version 4.0.0    # update to specific version
 *   storyboard update:4.0.0-beta.1     # update to specific version (shorthand)
 *   storyboard update:beta             # update to latest beta
 *   storyboard update:alpha            # update to latest alpha
 */

import * as p from '@clack/prompts'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const command = process.argv[2]
const channels = { 'update:beta': 'beta', 'update:alpha': 'alpha' }

let channel, targetVersion
if (channels[command]) {
  channel = channels[command]
} else if (command === 'update:version') {
  targetVersion = process.argv[3]
} else if (command && command.startsWith('update:')) {
  // update:<version> shorthand, e.g. update:4.0.0-beta.1
  targetVersion = command.slice('update:'.length)
}

const pkgPath = resolve(process.cwd(), 'package.json')
let pkg
try {
  pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
} catch (err) {
  p.log.error(`Failed to read package.json: ${err.message}`)
  process.exit(1)
}

// Collect all @dfosco/storyboard-* packages from deps and devDeps
const storyboardPkgs = new Set()
for (const depField of ['dependencies', 'devDependencies']) {
  if (!pkg[depField]) continue
  for (const name of Object.keys(pkg[depField])) {
    if (name.startsWith('@dfosco/storyboard-') || name === '@dfosco/tiny-canvas') {
      storyboardPkgs.add(name)
    }
  }
}

if (storyboardPkgs.size === 0) {
  p.log.warn('No @dfosco/storyboard-* packages found in package.json')
  process.exit(0)
}

const tag = channel || (targetVersion ? undefined : 'latest')
const suffix = targetVersion ? `@${targetVersion}` : `@${tag}`
const packages = [...storyboardPkgs].map(name => `${name}${suffix}`).join(' ')

// Resolve actual version from the registry when using a tag (channel or latest)
let resolvedVersion
if (tag) {
  try {
    const probe = [...storyboardPkgs][0]
    resolvedVersion = execSync(`npm view ${probe}@${tag} version`, { encoding: 'utf8' }).trim()
  } catch { /* fall back to showing the tag */ }
}

const displayVersion = resolvedVersion || targetVersion || tag
const label = resolvedVersion && channel ? `to ${resolvedVersion} (${channel})` : resolvedVersion ? `to ${resolvedVersion}` : channel ? `to ${channel}` : targetVersion ? `to ${targetVersion}` : ''
p.intro(`storyboard ${command}`)
p.log.info(`Updating ${storyboardPkgs.size} package(s)${label ? ` ${label}` : ''}…`)
for (const name of storyboardPkgs) {
  p.log.message(`  ${name}@${displayVersion}`)
}

try {
  execSync(`npm install ${packages}`, { stdio: 'inherit', cwd: process.cwd() })
  p.log.success('All storyboard packages updated')
} catch {
  p.log.error('Failed to update packages — see npm output above')
  process.exit(1)
}

// Sync scaffold files (skills, scripts) from the updated package
p.log.info('Syncing scaffold files…')
try {
  execSync('npx storyboard-scaffold', { stdio: 'inherit', cwd: process.cwd() })
} catch {
  p.log.warn('Scaffold sync failed — run `npx storyboard-scaffold` manually')
}

// Auto-commit the version update (only if package.json or lock file changed)
try {
  // Read the installed version from the core package
  const corePkg = JSON.parse(readFileSync(resolve(process.cwd(), 'node_modules', '@dfosco', 'storyboard-core', 'package.json'), 'utf8'))
  const installedVersion = corePkg.version || suffix.slice(1)
  const commitMsg = `[storyboard-update] Update storyboard to ${installedVersion}`

  // Only stage update-related files (package.json, lock files, scaffold outputs)
  const filesToStage = [
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.github/skills',
    'scripts',
  ]
  for (const f of filesToStage) {
    try { execSync(`git add ${f}`, { cwd: process.cwd(), stdio: 'pipe' }) } catch { /* empty */ }
  }

  // Only commit if there are staged changes
  try {
    execSync('git diff --cached --quiet', { cwd: process.cwd(), stdio: 'pipe' })
    p.log.message('No changes to commit — already up to date')
  } catch {
    execSync(`git commit -m "${commitMsg}"`, { cwd: process.cwd(), stdio: 'pipe' })
    p.log.success(`Committed: ${commitMsg}`)
  }
} catch (err) {
  p.log.warn(`Auto-commit failed: ${err.message}`)
}

p.outro('Done')
