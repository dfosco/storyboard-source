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
import { execSync, spawn } from 'child_process'
import { isCaddyInstalled, isCaddyRunning, startCaddy } from './proxy.js'
import { gettingStartedLines, dim, magenta, bold, yellow, green } from './intro.js'
import { parseFlags } from './flags.js'

const flagSchema = {
  'skip-branch': { type: 'boolean', default: false, description: 'Skip the branch prompt at the end' },
  branch: { type: 'string', description: 'Switch to a branch after setup (non-interactive)' },
  'nuke': { type: 'boolean', default: false }, // undocumented: output uninstall command
}

const { flags } = parseFlags(process.argv.slice(3), flagSchema)

// Hidden: output uninstall command for testing fresh setups
if (flags.nuke) {
  const nukeCmd = [
    'sudo pkill caddy 2>/dev/null',
    'brew uninstall caddy gh git 2>/dev/null',
    'rm -f ~/.local/bin/copilot /usr/local/bin/copilot ~/.local/bin/code /usr/local/bin/code',
    '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"',
    'sudo rm -rf /Library/Developer/CommandLineTools',
    'xcode-select --reset',
    'rm -rf ~/.oh-my-zsh ~/.prezto ~/.zprezto ~/.zplug ~/.zinit ~/.zi ~/.antigen ~/.zim ~/.starship.toml ~/.p10k.zsh 2>/dev/null',
    'rm -f ~/.zshrc ~/.zshenv ~/.zprofile ~/.zlogin ~/.zlogout ~/.bashrc ~/.bash_profile ~/.bash_login ~/.bash_logout ~/.profile 2>/dev/null',
    'echo "# macOS default zsh" > ~/.zshrc',
    'chsh -s /bin/zsh',
  ].join('; ')
  console.log(nukeCmd)
  process.exit(0)
}

/**
 * Run a potentially slow task with a spinner that only appears after 500ms.
 * If the task completes quickly, shows the done message immediately.
 * IMPORTANT: `fn` must be async (don't use execSync — it blocks the event loop
 * and prevents the spinner from animating).
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

/**
 * Async command runner — does NOT block the event loop, so spinners animate.
 */
function runAsync(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'ignore', shell: typeof cmd === 'string' && args.length === 0, ...opts })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

/**
 * Install a brew package with a spinner that actually animates.
 */
async function brewInstall(pkg, label) {
  const spin = p.spinner()
  spin.start(`Installing ${label}`)
  try {
    await runAsync('brew', ['install', pkg])
    spin.stop(`${label} installed`)
    return true
  } catch {
    spin.stop(`Failed to install ${label}`)
    p.log.warning(`Install manually: brew install ${pkg}`)
    return false
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
  brewSpin.start('Installing Homebrew')
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

// 3. Git (install via brew if missing — avoids Xcode CLT requirement)
if (hasBrew) {
  if (isInstalled('git')) {
    p.log.success('Git installed')
  } else {
    await brewInstall('git', 'Git')
  }
}

// 4. Caddy
if (hasBrew) {
  if (isCaddyInstalled()) {
    p.log.success('Caddy proxy installed')
  } else {
    await brewInstall('caddy', 'Caddy proxy')
  }

  // 5. GitHub CLI
  if (isInstalled('gh')) {
    p.log.success('GitHub CLI installed')
  } else {
    await brewInstall('gh', 'GitHub CLI')
  }

  // 5a. tmux (required for headless agent sessions)
  if (isInstalled('tmux')) {
    p.log.success('tmux installed')
  } else {
    await brewInstall('tmux', 'tmux')
  }
}

// 6. VS Code CLI
if (isInstalled('code')) {
  p.log.success('VS Code CLI installed')
} else {
  const vsCodeApp = '/Applications/Visual Studio Code.app'
  const shellScript = `${vsCodeApp}/Contents/Resources/app/bin/code`
  let installed = false

  if (existsSync(shellScript)) {
    // Try /usr/local/bin first, then ~/.local/bin as fallback
    const localBin = `${process.env.HOME}/.local/bin`
    const targets = ['/usr/local/bin/code', `${localBin}/code`]

    for (const target of targets) {
      try {
        const dir = path.dirname(target)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        run(`ln -sf "${shellScript}" "${target}"`)
        // Add ~/.local/bin to PATH if that's where we installed
        if (target.includes('.local/bin') && !process.env.PATH.includes(localBin)) {
          process.env.PATH = `${localBin}:${process.env.PATH}`
        }
        p.log.success(`VS Code CLI installed (${target})`)
        installed = true
        break
      } catch {
        // Try next target
      }
    }
  }

  if (!installed) {
    if (existsSync(vsCodeApp)) {
      p.log.warning('VS Code found but could not create symlink. Open VS Code and run:')
    } else {
      p.log.warning('VS Code not found. Install VS Code, then run:')
    }
    p.log.info('  Cmd+Shift+P → "Shell Command: Install \'code\' command in PATH"')
  }
}

// 6a. Copilot CLI
if (isInstalled('copilot')) {
  p.log.success('Copilot CLI installed')
} else if (hasBrew) {
  await brewInstall('copilot-cli', 'Copilot CLI')
} else {
  p.log.warning('Install manually: brew install copilot-cli (or npm i -g @github/copilot)')
}

// 8. Git hooks
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

// 9. Asset directories
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
    // Local-only canvases & prototypes (loaded by `npx storyboard dev`,
    // excluded from `npm run build`)
    'src/canvas/**/~*.canvas.jsonl',
    'src/canvas/~*/',
    'src/prototypes/~*/',
    'src/prototypes/**/~*.{flow,object,record,prototype,folder}.json',
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

// 10. Proxy — runtime daemon owns Caddy's route table; here we only need
// to ensure an empty Caddy instance is reachable. Routes are pushed
// per-devserver via the runtime's admin API on dev start.
if (isCaddyInstalled()) {
  const proxySpin = p.spinner()
  if (isCaddyRunning()) {
    p.log.success('Proxy already running')
  } else {
    proxySpin.start('Starting proxy')
    if (startCaddy()) proxySpin.stop('Proxy started')
    else proxySpin.stop('Proxy failed to start (continuing)')
  }
}

// 11. Install / sync dependencies
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
    const installSpin = p.spinner()
    installSpin.start('Installing dependencies')
    try {
      await runAsync('npm', ['install'])
      installSpin.stop('Dependencies installed')
    } catch {
      installSpin.stop('npm install failed')
      p.log.warning('Run it manually to see details:')
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
