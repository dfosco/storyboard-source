---
name: migrate-0.5.0
description: Migrates a client storyboard project from local storyboard/ source to the @dfosco/storyboard npm package (0.5.0+). Handles import rewrites, vite config, scaffold, and config.
---

# Migrate to @dfosco/storyboard 0.5.0

> Triggered by: "migrate to 0.5.0", "migrate to @dfosco/storyboard", "use storyboard package", "upgrade to package", "migration-0.5.0"

## What This Does

Migrates a client storyboard project that previously embedded `storyboard/` source directly (the monorepo pattern) to consuming `@dfosco/storyboard` as an npm dependency. This is a one-time migration.

---

## Prerequisites

```bash
npm install @dfosco/storyboard@latest
```

This installs the package which provides:
- The `storyboard` / `sb` CLI commands (via `bin`)
- All Vite plugins, React hooks, and core utilities (via `exports`)
- The `storyboard-scaffold` command for syncing config files

---

## Migration Steps

### 1. Remove embedded `storyboard/` source

If the client has a local `storyboard/` directory (with `core/`, `internals/`, `vite/`), it should be deleted after migration. All functionality now comes from the package.

```bash
# After all imports are rewritten (step 2), remove the old source
rm -rf storyboard/
```

> **Don't delete yet** — complete all import rewrites first.

---

### 2. Rewrite imports

All local `storyboard/` imports must be rewritten to `@dfosco/storyboard` subpath exports.

#### Import mapping table

| Old import (local) | New import (package) |
|---|---|
| `../storyboard` or `../../storyboard` | `@dfosco/storyboard` |
| `../storyboard/core/loader.js` | `@dfosco/storyboard/core` |
| `../storyboard/core/index.js` | `@dfosco/storyboard/core` |
| `../storyboard/internals/hashPreserver.js` | `@dfosco/storyboard/hash-preserver` |
| `../storyboard/internals/context.jsx` | `@dfosco/storyboard/context` |
| `../storyboard/internals/hooks/useFeatureFlag.js` | `@dfosco/storyboard/hooks/useFeatureFlag` |
| `../storyboard/internals/canvas/CanvasPage.jsx` | `@dfosco/storyboard/canvas/CanvasPage` |

#### Hooks and components (from main export `@dfosco/storyboard`)

These all come from the root export:

```js
import {
  StoryboardProvider,
  useFlowData,
  useFlowLoading,
  useOverride,
  useObject,
  useRecord,
  useRecords,
  init,
  loadFlow,
  loadObject,
  loadRecord,
  findRecord,
  flowExists,
  getByPath,
  subscribeToHash,
} from '@dfosco/storyboard'
```

#### Search patterns

Run these to find all imports that need rewriting:

```bash
# Find all relative storyboard imports
grep -rn "from ['\"]\.\..*storyboard" src/ --include="*.jsx" --include="*.js" --include="*.tsx" --include="*.ts"

# Find virtual module imports (these stay the same — no change needed)
grep -rn "virtual:storyboard" src/ --include="*.jsx" --include="*.js"
```

The `virtual:storyboard-data-index` import does **not** change — it's provided by the Vite plugin at dev/build time.

---

### 3. Update `vite.config.js`

Replace local plugin imports with package imports. Remove all `@dfosco/storyboard` resolve aliases (the package exports handle resolution now).

#### Before (monorepo / local source)

```js
import storyboardData from './packages/storyboard/src/internals/vite/data-plugin.js'
import storyboardServer from './packages/storyboard/src/core/vite/server-plugin.js'
```

#### After (package)

```js
import storyboardData from '@dfosco/storyboard/vite'
import storyboardServer from '@dfosco/storyboard/vite/server'
```

#### Remove resolve aliases

Delete the entire `resolve.alias` block for `@dfosco/storyboard` entries. These are only needed in the monorepo (where npm workspace links point at the main worktree). Consumer projects resolve subpaths via the package's `exports` field in `package.json`.

**Keep** any non-storyboard aliases (e.g. `'@': path.resolve(__dirname, './src')`).

---

### 4. Update `src/index.jsx` (entry point)

The entry point imports should already use `@dfosco/storyboard` paths. Verify these are present:

```jsx
import { installHashPreserver } from '@dfosco/storyboard/hash-preserver'
import { mountStoryboardCore } from '@dfosco/storyboard/core'
import '@dfosco/storyboard/comments/ui/comment-layout.css'
```

If they still reference local paths, rewrite per the mapping in step 2.

---

### 5. Run scaffold to sync config files

The package ships scaffold files for `AGENTS.md`, `.gitignore`, `storyboard.config.json`, GitHub workflows, skills, and git hooks.

```bash
npx storyboard-scaffold
```

This uses `scaffold/manifest.json` with two modes:
- **`scaffold`** — only copies if the target file doesn't exist (safe for config files like `storyboard.config.json`)
- **`updateable`** — always overwrites with the latest version (skills, scripts, workflows, AGENTS.md)

After running, review what was created/updated.

---

### 6. Update `storyboard.config.json`

The scaffold creates a minimal config. If the client has an existing config, merge any missing sections. The full reference config with all options:

```jsonc
{
  "customDomain": "",
  "repository": { "owner": "", "name": "" },
  "modes": { "enabled": false },
  "comments": { "discussions": { "category": "Comments" } },
  "plugins": { "devtools": true },
  "workshop": {
    "enabled": false,
    "features": {
      "createPrototype": true,
      "createFlow": true,
      "createCanvas": true
    }
  },
  "featureFlags": {},
  "canvas": {
    "github": { "embedBehavior": "link-preview", "ghGuard": "copy" },
    "terminal": {
      "resizable": false,
      "defaultWidth": 800,
      "defaultHeight": 450
    },
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
      }
    },
    "showAgentsInAddMenu": false
  },
  "hotPool": {
    "enabled": true,
    "verbose": false,
    "default_pool_size": 1,
    "default_max_pool_size": 3,
    "pools": {
      "terminal": { "pool_size": 1 },
      "copilot": { "pool_size": 1 },
      "prompt": { "pool_size": 1 }
    }
  },
  "customerMode": {
    "enabled": false,
    "hideChrome": false,
    "hideHomepage": false,
    "protoHomepage": ""
  }
}
```

Only add `canvas.agents` entries for agents the client has installed. Only add `hotPool` if the client uses canvas terminal/agent widgets.

---

### 7. Update `package.json`

#### Remove old local dependencies

If `package.json` has workspace references to the old embedded storyboard, remove them.

#### Verify peer dependencies

The package requires these peers:

```json
{
  "@primer/octicons-react": ">=19",
  "react": ">=18",
  "react-dom": ">=18",
  "react-router-dom": ">=6",
  "vite": ">=5"
}
```

(`vite` is optional — only needed for dev/build, not runtime.)

#### Add postinstall scaffold hook (recommended)

```json
{
  "scripts": {
    "postinstall": "storyboard-scaffold"
  }
}
```

This keeps scaffold files (skills, workflows, AGENTS.md) in sync on every `npm install`.

---

### 8. Run setup and verify

```bash
# Run setup to configure proxy, check dependencies
npx storyboard setup

# Build to verify no broken imports
npm run build

# Start dev server to verify everything works
npx storyboard dev
```

---

### 9. Clean up

After verifying the build works:

1. Delete the old `storyboard/` source directory (if it existed)
2. Delete any `packages/` directory that contained the old package source
3. Remove stale resolve aliases from `vite.config.js`
4. Commit the migration

---

## Procedure (for agents)

### Step 1: Read current state

Read `package.json`, `vite.config.js`, `src/index.jsx`, and `storyboard.config.json` to understand the client's current setup.

### Step 2: Check if already migrated

If `@dfosco/storyboard` is already in `dependencies` and there are no local `storyboard/` imports, the migration is already done. Report that and stop.

### Step 3: Install the package

```bash
npm install @dfosco/storyboard@latest
```

### Step 4: Rewrite imports

Search for all local storyboard imports and rewrite them per the mapping table. Use `grep` to find them, then batch-edit.

### Step 5: Update vite.config.js

Replace plugin imports and remove storyboard resolve aliases.

### Step 6: Run scaffold

```bash
npx storyboard-scaffold
```

### Step 7: Verify

```bash
npm run build
```

### Step 8: Clean up old source

Remove old `storyboard/` or `packages/storyboard/` directories if they existed as embedded source.

### Step 9: Commit

Commit all changes with a descriptive message.
