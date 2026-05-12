import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = readFileSync(join(__dirname, 'terminal-welcome.js'), 'utf8')

// Regression guard for the "command not found: claude" bug.
//
// Background: agents spawn via the user's $SHELL with -lc (login shell). On
// zsh that sources /etc/zprofile + ~/.zprofile but NOT ~/.zshrc. Many agent
// CLIs (claude, copilot, nvm/volta/asdf shims) only register PATH in
// ~/.zshrc, so a login-only shell cannot find them. Always use -ilc
// (interactive + login) so both rc files are sourced.
//
// This test scans the source rather than importing the module because
// terminal-welcome.js is a CLI entrypoint with top-level side effects and
// no exports. If you later refactor to export the spawn args, replace this
// with a stub-spawn unit test.
describe('terminal-welcome: agent spawn shell flags', () => {
  it('uses -ilc (not -lc) for every spawn(shell, ...) call', () => {
    const spawnCalls = SOURCE.match(/spawn\(\s*shell\s*,\s*\[[^\]]*\]/g) || []
    expect(spawnCalls.length).toBeGreaterThan(0)

    for (const call of spawnCalls) {
      // Bare interactive shell (no -c flag, no command) is allowed —
      // that's the fallback shell session. Anything passing a command
      // string MUST source .zshrc.
      const passesCommand = /-[il]+c['"]/.test(call)
      if (!passesCommand) continue

      expect(call, `spawn call missing -i flag: ${call}`).toMatch(/['"]-i?l?i?l?c['"]/)
      expect(call, `spawn call must include -i: ${call}`).toMatch(/['"]-(i[l]?c|li?c|il?c)['"]/)
      expect(call, `spawn call must not use bare -lc: ${call}`).not.toMatch(/['"]-lc['"]/)
    }
  })
})
