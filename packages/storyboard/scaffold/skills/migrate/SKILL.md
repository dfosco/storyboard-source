---
name: migrate
description: Migrates a client storyboard project to the latest version. Handles breaking changes in config, routes, and features.
---

# Migrate

> Triggered by: "migrate", "upgrade storyboard", "run migration", "update to latest", "breaking changes", "what changed"

## What This Does

Walks through all breaking changes between storyboard versions and applies the necessary updates to the client project. Each migration step is idempotent — safe to run multiple times.

---

## Migrations

### From 4.1.x / 4.2.x → 4.3.0

#### 1. Homepage route: `/viewfinder` → `/workspace`

The storyboard homepage URL changed from `/viewfinder` to `/workspace`. The old route still works as a redirect for one release cycle.

**Steps:**

1. If the client has `src/prototypes/viewfinder.jsx`, rename it to `src/prototypes/workspace.jsx`
2. Search `storyboard.config.json` for any `"/viewfinder"` strings and replace with `"/workspace"`
3. Search any custom toolbar or command palette config overrides for `"viewfinder"` tool ID references and replace with `"workspace"`
4. If the client has `customerMode.protoHomepage`, no change needed — that overrides the homepage entirely

**localStorage keys migrated automatically at runtime** — no manual action needed:
- `sb-viewfinder-starred` → `sb-workspace-starred`
- `sb-viewfinder-recent` → `sb-workspace-recent`
- `sb-viewfinder-group-folders` → `sb-workspace-group-folders`

---

#### 2. Canvas config — terminal + agents + hot pool

Clients on 4.1.x likely have no `canvas` block at all. The full canvas config is required for terminal widgets, agent widgets, and prompt widgets to work on canvases.

**Read the client's `storyboard.config.json`.** If the `canvas` key is missing or incomplete, merge the missing sections. Here is the complete reference config — adapt values to the client's environment:

```jsonc
{
  "canvas": {
    // Terminal widget settings (the plain terminal, not agents)
    "terminal": {
      "fontSize": 18,
      "fontFamily": "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
      "prompt": "❯ ",
      "startupCommand": null,
      "defaultStartupSequence": null,
      "resizable": true,
      "defaultWidth": 1000,
      "defaultHeight": 600
    },

    // Agent widgets — each key becomes an entry in the "Add Agent" menu
    // Remove any agents the client doesn't have installed
    "agents": {
      "copilot": {
        "label": "Copilot CLI",
        "default": true,
        "icon": "primer/copilot",
        "startupCommand": "copilot --agent terminal-agent",
        "resumeCommand": "copilot --resume",
        "postStartup": "/allow-all on",
        "readinessSignal": "Environment loaded:",
        "resizable": true
      },
      "claude": {
        "label": "Claude Code",
        "icon": "claude",
        "startupCommand": "claude --agent terminal-agent --dangerously-skip-permissions",
        "resumeCommand": "claude --resume",
        "resizable": true,
        "readinessSignal": "bypass permissions"
      },
      "codex": {
        "label": "Codex CLI",
        "icon": "codex",
        "startupCommand": "codex --full-auto",
        "resumeCommand": "codex --resume",
        "configFiles": [".codex/config.toml"],
        "resizable": true
      }
    },

    // Set to true to show agent entries in the canvas "+" add menu
    // Set to false to only show them in the command palette
    "showAgentsInAddMenu": false
  }
}
```

**How to customize for the client:**

| Setting | How to adapt |
|---------|-------------|
| `terminal.fontFamily` | Match the client's preferred monospace font. Remove `'Ghostty'` if they don't use it. |
| `terminal.fontSize` | `14`–`18` is typical. `18` for presentation-style canvases, `14` for compact. |
| `terminal.defaultWidth/Height` | Pixel dimensions for new terminal widgets. `1000×600` is a good default. |
| `agents.copilot.postStartup` | `/allow-all on` auto-approves Copilot tool calls. Remove if the client wants manual approval. |
| `agents.copilot.readinessSignal` | The string to look for in CLI output that means the agent is ready. Must match exactly. |
| `agents.*.configFiles` | Array of config files the agent needs (e.g. `.codex/config.toml`). Only relevant for Codex. |
| `agents` keys | Remove agents the client doesn't have installed. Each key must be a CLI command available in PATH. |

**Agent config property reference:**

| Property | Required | Description |
|----------|----------|-------------|
| `label` | yes | Display name in the Add Agent menu |
| `icon` | no | Icon name (`primer/copilot`, `claude`, `codex`, or any Icon.jsx name) |
| `startupCommand` | yes | Shell command to start the agent |
| `resumeCommand` | no | Shell command to resume an existing session |
| `postStartup` | no | Text sent to the agent's stdin after it starts |
| `readinessSignal` | no | Substring to wait for in output before marking agent as ready |
| `configFiles` | no | Array of config file paths the agent requires |
| `resizable` | no | Whether the agent widget can be resized (default `false`) |
| `defaultWidth` | no | Default widget width in pixels |
| `defaultHeight` | no | Default widget height in pixels |
| `default` | no | If `true`, this agent is pre-selected in menus |

---

#### 3. Hot pool config (recommended)

Hot pooling pre-warms agent sessions in the background so they start instantly when a user adds a widget. Without it, there's a cold-start delay every time.

**Add this to `storyboard.config.json` if missing:**

```jsonc
{
  "hotPool": {
    "enabled": true,
    "verbose": false,
    "default_pool_size": 1,
    "default_max_pool_size": 3,
    "load_balancer": true,
    "load_balancer_cooldown_mins": 10,
    "pools": {
      // One pool per widget type. Keys must match agent IDs above
      // plus "terminal" and "prompt" for built-in types.
      "terminal": { "pool_size": 1 },
      "copilot": { "pool_size": 1 },
      "claude": { "pool_size": 1 },
      "codex": { "pool_size": 1 },
      "prompt": { "pool_size": 1 }
    }
  }
}
```

**How to customize:**

| Setting | How to adapt |
|---------|-------------|
| `default_pool_size` | Number of sessions pre-warmed per agent type. `1` is fine for most teams. |
| `default_max_pool_size` | Maximum concurrent sessions per type. `3` handles parallel use. |
| `pools.*.pool_size` | Override pool size for specific types. Remove entries for agents the client doesn't use. |
| `load_balancer` | Distributes sessions across pools. Set `false` if only one agent type is used. |
| `load_balancer_cooldown_mins` | Minutes between load balancer rebalance cycles. `10` is sensible. |

**Important:** Every key in `pools` must either be a built-in type (`terminal`, `prompt`) or match an agent ID defined in `canvas.agents`. Mismatched keys are silently ignored.

---

#### 4. Agent definition files (`.agents/`)

Canvas agents need agent definition files to provide instructions. These are scaffolded automatically by `storyboard setup`, but if the client doesn't have them:

**Check if `.agents/agents/` exists.** If missing, create these two files:

**`.agents/agents/terminal-agent.agent.md`** — Instructions for terminal-based agents (Copilot, Claude, Codex). The `--agent terminal-agent` flag in the startup commands references this file.

**`.agents/agents/prompt-agent.agent.md`** — Instructions for single-shot prompt agents.

Both files are scaffolded from `packages/core/scaffold/agents/`. Run `npx storyboard setup` to auto-create them, or copy them manually from the storyboard-core package.

---

#### 5. Customer mode config (optional)

If the client deploys storyboard for external users (not just internal design), they may want customer mode:

```json
{
  "customerMode": {
    "enabled": false,
    "hideChrome": false,
    "hideHomepage": false,
    "protoHomepage": ""
  }
}
```

| Setting | Description |
|---------|-------------|
| `enabled` | Master toggle for customer mode |
| `hideChrome` | Hides all toolbars, branch bar, cmd+k, cmd+. |
| `hideHomepage` | Removes the workspace homepage (leaves empty page) |
| `protoHomepage` | Internal `/path` that replaces homepage; redirects from `/` and `/workspace` |

This block is optional. Only add it if the client needs to customize the chrome visibility.

---

## Procedure

### Step 1: Read the client's current config

Read `storyboard.config.json` and `package.json` to understand what version they're on and what config blocks already exist.

### Step 2: Apply migrations in order

For each section above, check if the change has already been applied. If not:
- For config additions: show the client what will be added and ask before writing
- For renames: apply directly (they're mechanical)
- For `.agents/` scaffolding: run `npx storyboard setup` or create files manually

### Step 3: Run `npx storyboard setup`

This ensures `.agents/`, `.storyboard/`, asset directories, and proxy configuration are all up to date.

### Step 4: Verify

Run `npm run build` to verify nothing is broken.

### Step 5: Summary

Print a summary of all changes made.
