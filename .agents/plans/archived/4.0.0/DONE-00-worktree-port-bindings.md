# 00 — Storyboard CLI + Caddy Proxy for Worktree Dev Servers

**Clips:** `#g087` (step 0 — prerequisite for all other 4.0 work)

**Goal:** Clean, memorable dev URLs for every worktree — no port numbers. A `storyboard` CLI (`sb` alias) wraps dev tooling into a single entry point.

**Constraint:** Works without proxy (direct port URLs), but `storyboard setup` unlocks clean URLs via Caddy.

**Status:** Implemented on `4.0.0` branch.

---

## URL Scheme

| Context | URL |
|---------|-----|
| Main | `http://storyboard.localhost/storyboard/` |
| Branch `4.0.0` | `http://storyboard.localhost/4.0.0/storyboard/` |
| Direct (no proxy) | `http://localhost:<port>/storyboard/` |

`VITE_BASE_PATH` stays `/storyboard/` for main. For branches, the worktree name is prepended: `/<branchname>/storyboard/`.

`storyboard.localhost` resolves to 127.0.0.1 natively per RFC 6761 — no `/etc/hosts` changes needed.

---

## What Gets Built

### 1. Storyboard CLI (`packages/core/src/cli/`)

Published as `storyboard` and `sb` bins in `@dfosco/storyboard-core`.

| Command | Description |
|---------|-------------|
| `storyboard dev` | Start Vite with correct `VITE_BASE_PATH`, update proxy |
| `storyboard setup` | Install deps, Caddy, `gh` check, start proxy |
| `storyboard proxy` | Generate Caddyfile + start/reload Caddy |
| `storyboard update:flag <key> <value>` | Update feature flag in `storyboard.config.json` |

### 2. Worktree Port Registry (`packages/core/src/worktree/port.js`)

Unchanged from initial implementation. Manages `.worktrees/ports.json` mapping worktree names to unique ports.

```json
{
  "main": 1234,
  "4.0.0": 1235,
  "fix-bug": 1236
}
```

**Exports:** `portsFilePath()`, `detectWorktreeName()`, `getPort()`, `resolvePort()`, `slugify()`

**Published as:** `@dfosco/storyboard-core/worktree/port`

### 3. Caddy Reverse Proxy (auto-generated Caddyfile)

`storyboard proxy` generates `.worktrees/Caddyfile` from `ports.json`:

```
http://storyboard.localhost {
    handle /4.0.0/* {
        reverse_proxy localhost:1235
    }
    handle {
        reverse_proxy localhost:1234
    }
}
```

Caddy listens on port 80 (requires `sudo` on macOS for first start).
Reloads without sudo via Caddy's admin API on subsequent `storyboard dev` invocations.

### 4. Root Repo Scripts

| Script | Purpose |
|--------|---------|
| `scripts/setup.js` | Root `npm run setup` — delegates to CLI setup |
| `scripts/worktree-port.js` | CLI: prints assigned port for a worktree name |

### 5. Worktree Skill Updates

Both source repo and scaffold skills updated with:
- **Step 0 — Slugify branch names:** dots/spaces/underscores → hyphens, lowercase
- **Step 2 — Register dev-server port** after creating worktree

### 6. PrototypeEmbed External URL Support

External `http://` and `https://` URLs embedded as-is in PrototypeEmbed widgets. Storyboard query params only appended to local paths.

---

## User Experience

### First-time setup
```bash
npm run setup
# → installs deps, Caddy, starts proxy (sudo for port 80)
```

### Starting development
```bash
storyboard dev           # main → http://storyboard.localhost/storyboard/
cd .worktrees/fix-bug
storyboard dev           # → http://storyboard.localhost/fix-bug/storyboard/
```

### Without proxy (fallback)
```bash
storyboard dev           # → http://localhost:1234/storyboard/ (direct)
```

### Client repos
```json
{ "dev": "storyboard dev" }
```

### Feature flags
```bash
storyboard update:flag show-banner false
```

---

## File Changes

| File | Published |
|------|-----------|
| `packages/core/src/cli/index.js` | ✅ npm (bin: `storyboard`, `sb`) |
| `packages/core/src/cli/dev.js` | ✅ npm |
| `packages/core/src/cli/proxy.js` | ✅ npm |
| `packages/core/src/cli/setup.js` | ✅ npm |
| `packages/core/src/cli/updateFlag.js` | ✅ npm |
| `packages/core/src/worktree/port.js` | ✅ npm |
| `packages/core/src/worktree/port.test.js` | ❌ local |
| `packages/core/package.json` (bin + export) | ✅ npm |
| `packages/core/scaffold/skills/worktree/SKILL.md` | ✅ scaffold |
| `scripts/setup.js` | ❌ local |
| `scripts/worktree-port.js` | ❌ local |
| `packages/react/src/canvas/widgets/PrototypeEmbed.jsx` | ✅ npm |
