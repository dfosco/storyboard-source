---
"@dfosco/storyboard": minor
---

New `terminal.config.json` + `.storyboard/scaffold/` mechanism — terminal and canvas-agent config now live in their own dedicated, optional file with full library defaults available as a living reference.

- **New file: `terminal.config.json`** (project root). Owns `terminal` widget settings and the `agents` map (copilot/claude/codex). The library ships defaults at `node_modules/@dfosco/storyboard/terminal.config.json`. Most users won't need to create the file at all — defaults already cover Copilot/Claude/Codex with auto-resume.
- **Auto-scaffolded `.storyboard/scaffold/`** — on every dev-server boot, the data plugin syncs `.storyboard/scaffold/` with copies of every library config file (terminal, toolbar, commandpalette, paste, widgets) plus a README. Server NEVER reads from this directory; it's pure copy-source for customizations. Always overwritten so users get up-to-date references on every version bump.
- **Leaf-level merge** preserved: only the specific keys you set are overridden, everything else inherits library defaults — so future agent additions or readinessSignal tweaks reach you automatically.
- **Legacy back-compat**: existing `canvas.terminal` / `canvas.agents` blocks under `storyboard.config.json` continue to work; `terminal.config.json` wins on overlap with a warning logged.
- **Graceful resume fallback**: when a captured sessionId passes pre-flight validation but the agent CLI rejects it at runtime (corrupt session, etc.), the launch command falls through to a fresh session via shell `||` chain.
