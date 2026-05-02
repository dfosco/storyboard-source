# Worktree Skill

> Triggered by: "create worktree", "new worktree", "worktree for", "worktree"

## What This Does

Creates a git worktree for a given branch name inside `worktrees/` and switches into it.

---

## How to Execute

When the user asks for a worktree named `<branch-name>`:

### Step 1: Create the worktree

If the branch already exists locally or on the remote:

```bash
git worktree add worktrees/<branch-name> <branch-name>
```

If the branch does NOT exist yet, create it from the current HEAD:

```bash
git worktree add worktrees/<branch-name> -b <branch-name>
```

### Step 2: Register a dev-server port

Assign a unique port for this worktree so multiple dev servers can run simultaneously.

If using `@dfosco/storyboard-core`:

```bash
node -e "import('@dfosco/storyboard-core/worktree/port').then(m => console.log(m.getPort('<branch-name>')))"
```

Or if the project has `scripts/worktree-port.js`:

```bash
node scripts/worktree-port.js <branch-name>
```

This writes to `worktrees/ports.json` (gitignored). The dev server (`npx storyboard-dev`) reads from this file automatically.

### Step 3: Change into the worktree directory

```bash
cd worktrees/<branch-name>
```

All subsequent commands in the session should run from this directory.

### Step 4: Confirm

Print the current working directory, branch, and assigned port to confirm:

```bash
pwd && git branch --show-current
```

### Step 5: Start dev server

Run the dev server in the worktree. If using the storyboard-dev launcher:

```bash
npx storyboard-dev
```

Or if using a custom dev script:

```bash
npm run dev
```

The dev server automatically uses the port assigned in Step 2.

**Skip this step if the worktree skill was invoked from the ship skill** — ship runs the dev server as its own final step to avoid starting it twice.

---

## Notes

- Worktrees live in `worktrees/` at the repo root — this directory is already gitignored.
- The branch name comes from the user's request (e.g., "create worktree comments-redo" → branch is `comments-redo`).
- **Always slugify** the branch name (Step 0) before creating the worktree. Dots cause issues with subdomain routing and are replaced with hyphens.
- If the worktree already exists, inform the user and `cd` into it instead of recreating it.
- Port assignments are stable — once a worktree gets a port, it keeps it across restarts.
- To see all assigned ports, check `worktrees/ports.json`.
