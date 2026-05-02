/**
 * storyboard setup — One-time setup for the Storyboard dev environment.
 *
 * Idempotent: safe to run multiple times, only does what's needed.
 *
 * Usage:
 *   npx storyboard setup                          # interactive
 *   npx storyboard setup --skip-branch             # non-interactive, skip branch prompt
 *   npx storyboard setup --branch=<name>           # non-interactive, switch to branch after setup
 */

import * as p from '@clack/prompts'
import { existsSync, writeFileSync, readFileSync, mkdirSync, readdirSync, symlinkSync } from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { generateCaddyfile, isCaddyInstalled, isCaddyRunning, startCaddy, reloadCaddy } from './proxy.js'
import { gettingStartedLines, dim, magenta, bold, yellow, green } from './intro.js'
import { parseFlags } from './flags.js'

const flagSchema = {
  'skip-branch': { type: 'boolean', default: false, description: 'Skip the branch prompt at the end' },
  branch: { type: 'string', description: 'Switch to a branch after setup (non-interactive)' },
}

const { flags } = parseFlags(process.argv.slice(3), flagSchema)

/**
 * Run a potentially slow task with a spinner that only appears after 500ms.
 * If the task completes quickly, shows the done message immediately.
 */
async function withSpin(label, doneMsg, fn) {
  const spin = p.spinner()
  const timer = setTimeout(() => spin.start(label), 500)
  try {
    await fn()
    clearTimeout(timer)
    spin.stop(doneMsg)
  } catch (err) {
    clearTimeout(timer)
    spin.stop(`Failed: ${label}`)
    throw err
  }
}

function mascot() {
  const d = dim('·')
  const f = magenta
  const b = dim
  const msg = `  ${bold('Happy prototyping!')} 🎨`
  return [
    `        ${b('╭─────────────────╮')}`,
    `        ${b('│')}  ${d}  ${f('◠')}  ${f('◡')}  ${f('◠')}  ${d}  ${b('│')}${msg}`,
    `        ${b('│')}  ${d}  ${d}  ${d}  ${d}  ${d}  ${b('│')}`,
    `        ${b('╰─────────────────╯')}`,
  ].join('\n')
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'pipe', ...opts })
}

function isInstalled(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

p.intro('storyboard setup')

// 1. Check for node_modules (quick sanity check — full install runs at the end)
if (!existsSync('node_modules')) {
  p.log.info('node_modules not found — will install at end of setup')
} else {
  p.log.success('Dependencies present')
}

// 2. Homebrew
let hasBrew = isInstalled('brew')
if (!hasBrew) {
  const brewSpin = p.spinner()
  brewSpin.start('Installing Homebrew...')
  try {
    run('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"')
    const brewPaths = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew', '/home/linuxbrew/.linuxbrew/bin/brew']
    for (const bp of brewPaths) {
      if (existsSync(bp)) {
        process.env.PATH = `${bp.replace(/\/brew$/, '')}:${process.env.PATH}`
        break
      }
    }
    hasBrew = true
    brewSpin.stop('Homebrew installed')
  } catch {
    brewSpin.stop('Failed to install Homebrew')
    p.log.warning('Install manually: https://brew.sh')
  }
}

// 3. Caddy
if (hasBrew) {
  if (isCaddyInstalled()) {
    p.log.success('Caddy proxy installed')
  } else {
    const caddySpin = p.spinner()
    caddySpin.start('Installing Caddy...')
    try {
      run('brew install caddy')
      caddySpin.stop('Caddy proxy installed')
    } catch {
      caddySpin.stop('Failed to install Caddy')
      p.log.warning('Install manually: brew install caddy')
    }
  }

  // 4. GitHub CLI
  if (isInstalled('gh')) {
    p.log.success('GitHub CLI installed')
  } else {
    const ghSpin = p.spinner()
    ghSpin.start('Installing GitHub CLI...')
    try {
      run('brew install gh')
      ghSpin.stop('GitHub CLI installed')
    } catch {
      ghSpin.stop('Failed to install GitHub CLI')
      p.log.warning('Install manually: brew install gh')
    }
  }
}

// 5. VS Code CLI
if (isInstalled('code')) {
  p.log.success('VS Code CLI installed')
} else {
  // Try to install the `code` CLI from VS Code's known locations
  const codePaths = [
    '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
    '/usr/local/bin/code',
  ]
  let installed = false
  for (const codePath of codePaths) {
    if (existsSync(codePath)) {
      p.log.success('VS Code CLI available (symlink exists)')
      installed = true
      break
    }
  }
  if (!installed) {
    // Try the VS Code shell command installer
    const vsCodeApp = '/Applications/Visual Studio Code.app'
    if (existsSync(vsCodeApp)) {
      const shellScript = `${vsCodeApp}/Contents/Resources/app/bin/code`
      if (existsSync(shellScript)) {
        try {
          // Create symlink in /usr/local/bin
          run(`ln -sf "${shellScript}" /usr/local/bin/code`)
          p.log.success('VS Code CLI installed (symlinked to /usr/local/bin/code)')
          installed = true
        } catch {
          // Fall through to manual instructions
        }
      }
    }
    if (!installed) {
      p.log.warning('VS Code CLI not found. Open VS Code and run:')
      p.log.info('  Cmd+Shift+P → "Shell Command: Install \'code\' command in PATH"')
    }
  }
}

// 6. Git hooks
{
  // Create .githooks/ if it doesn't exist — copy from scaffold template
  if (!existsSync('.githooks')) {
    const scaffoldHooks = path.resolve(import.meta.dirname, '..', '..', 'scaffold', 'githooks')
    if (existsSync(scaffoldHooks)) {
      try {
        run(`cp -r "${scaffoldHooks}" .githooks`)
        run('chmod +x .githooks/*')
      } catch { /* fall through */ }
    }
  }

  if (existsSync('.githooks')) {
    try {
      run('git config core.hooksPath .githooks')
      if (existsSync('.githooks/pre-push')) {
        run('chmod +x .githooks/pre-push')
      }
      p.log.success('Git hooks activated (.githooks/)')
    } catch {
      p.log.warning('Failed to set git hooks path')
    }
  } else {
    p.log.info(dim('No .githooks/ directory — run storyboard-scaffold first'))
  }
}

// 7. Asset directories
{
  const dirs = ['assets/canvas/images', 'assets/.storyboard-public/terminal-snapshots', '.storyboard', '.storyboard/terminals', '.storyboard/terminal-buffers', '.storyboard/logs']
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      try { mkdirSync(dir, { recursive: true }) } catch { /* ignore */ }
    }
  }

  // Scaffold initial .selectedwidgets.json if missing
  const selectedWidgetsPath = '.storyboard/.selectedwidgets.json'
  if (!existsSync(selectedWidgetsPath)) {
    try {
      writeFileSync(selectedWidgetsPath, JSON.stringify({
        canvasId: null,
        canvasFile: null,
        selectedWidgetIds: [],
        widgets: [],
      }, null, 2) + '\n', 'utf-8')
    } catch { /* ignore */ }
  }

  p.log.success('Canvas asset directories ready')
}

// 7a. Scaffold .gitignore entries for private canvas images
{
  const gitignorePath = '.gitignore'
  const privatePatterns = [
    'src/canvas/images/~*',
    'assets/canvas/images/~*',
    'assets/canvas/snapshots/~*',
    'assets/.storyboard-public/terminal-snapshots/~*',
  ]
  if (existsSync(gitignorePath)) {
    try {
      let content = readFileSync(gitignorePath, 'utf-8')
      const missing = privatePatterns.filter(p => !content.includes(p))
      if (missing.length > 0) {
        const block = '\n# Private canvas images (tilde prefix = not committed)\n' + missing.join('\n') + '\n'
        content = content.trimEnd() + '\n' + block
        writeFileSync(gitignorePath, content, 'utf-8')
        p.log.success('Added private image patterns to .gitignore')
      }
    } catch { /* ignore */ }
  }
}

// 7b. Copilot agents
{
  const agentsDir = '.agents'
  if (!existsSync(agentsDir)) {
    try { mkdirSync(agentsDir, { recursive: true }) } catch { /* ignore */ }
  }

  const scaffoldAgents = path.resolve(import.meta.dirname, '..', '..', 'scaffold', 'agents')
  if (existsSync(scaffoldAgents)) {
    try {
      const agentFiles = execSync(`ls "${scaffoldAgents}"`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
      for (const file of agentFiles) {
        const dest = path.join(agentsDir, file)
        if (!existsSync(dest)) {
          run(`cp "${path.join(scaffoldAgents, file)}" "${dest}"`)
        }
      }
      if (agentFiles.length > 0) {
        p.log.success('Copilot agents scaffolded (.agents/)')
      }
    } catch { /* ignore */ }
  }

  // Create symlinks in each CLI's expected agent directory.
  // Source of truth: .agents/*.agent.md
  // Copilot CLI reads .github/agents/*.md
  // Claude Code reads .claude/agents/*.md
  // Codex CLI uses .codex/config.toml (no agent files needed)
  try {
    const agentFiles = readdirSync(agentsDir).filter(f => f.endsWith('.agent.md'))
    const targets = [
      { dir: path.join('.github', 'agents'), label: 'Copilot CLI' },
      { dir: path.join('.claude', 'agents'), label: 'Claude Code' },
    ]
    for (const { dir, label } of targets) {
      try { mkdirSync(dir, { recursive: true }) } catch { /* ignore */ }
      let linked = 0
      for (const file of agentFiles) {
        const linkName = file.replace('.agent.md', '.md')
        const linkPath = path.join(dir, linkName)
        const target = path.relative(dir, path.join(agentsDir, file))
        if (!existsSync(linkPath)) {
          try { symlinkSync(target, linkPath); linked++ } catch { /* ignore */ }
        }
      }
      if (linked > 0) {
        p.log.success(`${label} agent symlinks created (${dir}/)`)
      }
    }
  } catch { /* ignore */ }
}

// 8. Proxy
if (isCaddyInstalled()) {
  const proxySpin = p.spinner()
  const caddyfilePath = generateCaddyfile()
  if (isCaddyRunning()) {
    proxySpin.start('Reloading proxy...')
    reloadCaddy(caddyfilePath)
    proxySpin.stop('Proxy reloaded')
  } else {
    proxySpin.start('Starting proxy...')
    startCaddy(caddyfilePath)
    proxySpin.stop('Proxy started')
  }
}

// 9. Install / sync dependencies
// Skip npm install if a dev server is running — it would trigger Vite's
// file watcher and restart the server on a different port.
{
  const { SERVER_PORT } = await import('../server/index.js')
  const { readDevDomain: readDomain } = await import('./proxy.js')
  const http = await import('node:http')

  const devRunning = await new Promise((resolve) => {
    const req = http.get(`http://localhost:${SERVER_PORT}/health`, (res) => {
      if (res.statusCode !== 200) { resolve(false); return }
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const ourDomain = readDomain()
          resolve(json.ok === true && json.devDomain === ourDomain)
        } catch { resolve(false) }
      })
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => { req.destroy(); resolve(false) })
  })

  if (devRunning) {
    p.log.info(dim('Skipping npm install — dev server is running (would cause restart)'))
    p.log.info(dim('Run `npm install` manually after stopping the dev server if needed'))
  } else {
    try {
      await withSpin(
        'Installing dependencies...',
        'Dependencies installed',
        () => { run('npm install', { stdio: 'ignore' }) }
      )
    } catch {
      p.log.warning('npm install failed — run it manually to see details')
      p.log.info(`  ${dim('npm install')}`)
    }
  }
}

p.note(
  [
    ...gettingStartedLines(),
    '',
    `  ${dim('Run')} ${yellow('npx storyboard')} ${dim('to see all commands')}`,
  ].join('\n'),
  'Getting started'
)

// Offer branch guide
{
  // Non-interactive: --branch=<name> or --skip-branch
  if (flags.branch) {
    const { runBranchGuide } = await import('./branch.js')
    await runBranchGuide(flags.branch)
  } else if (flags['skip-branch']) {
    console.log()
    console.log(mascot())
    p.outro('')
  } else {
    // Interactive: ask the user
    let currentBranchName = 'main'
    try {
      currentBranchName = execSync('git branch --show-current', { encoding: 'utf8' }).trim() || 'main'
    } catch { /* empty */ }

    const wantBranch = await p.select({
      message: 'Want to work from a different branch?',
      options: [
        { value: true, label: 'Yes (help me create it)' },
        { value: false, label: `No (stay on current branch ${bold(currentBranchName)})` },
      ],
      initialValue: false,
    })

    if (!p.isCancel(wantBranch) && wantBranch) {
      const { runBranchGuide } = await import('./branch.js')
      await runBranchGuide()
    } else {
      console.log()
      console.log(mascot())
      p.log.info(`${dim('Non-interactive:')} ${green('npx sb setup --skip-branch')}`)
      p.outro('')
    }
  }
}
