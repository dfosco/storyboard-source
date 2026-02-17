# Branch Preview Deploys

Deploy any branch to GitHub Pages at its own URL — no PRs required.

```
main        → https://dfosco.github.io/storyboard/
security-ux → https://dfosco.github.io/storyboard/branch--security-ux/
new-dash    → https://dfosco.github.io/storyboard/branch--new-dash/
```

---

## How it works

The `gh-pages` branch is a **persistent filesystem** that holds all deployed output.
Each branch build is self-contained in its own subfolder. Builds never interfere with each other.

```
gh-pages branch
├── index.html                    ← main build (root)
├── assets/                       ← main build assets
├── 404.html                      ← SPA redirect (dynamic pathSegmentsToKeep)
├── favicon.svg
├── branch--security-ux/          ← branch preview build
│   ├── index.html
│   ├── assets/
│   └── ...
├── branch--new-dashboard/        ← another branch preview
│   ├── index.html
│   ├── assets/
│   └── ...
```

### Three workflow triggers

| Trigger | What happens |
|---------|-------------|
| Push to `main` | Build with `base: /storyboard/`. Overwrite root files on `gh-pages`, preserving all `branch--*/` folders. |
| Push to any other branch | Build with `base: /storyboard/branch--{name}/`. Write output to `branch--{name}/` on `gh-pages`. |
| Branch deleted | Remove the `branch--{name}/` folder from `gh-pages` and push. |

### Why this works

- **Vite handles all path rewriting.** Setting `base` at build time rewrites every asset URL, module preload path, `<link>` tag, and chunk import. The output is fully self-contained.
- **The router already uses `import.meta.env.BASE_URL`** (set from Vite's `base`), so SPA routing works with zero additional changes.
- **Additive deploys.** Each workflow run only touches its own folder. No branch build can break another.
- **Concurrency is safe.** A `concurrency` group in the workflow serializes pushes to `gh-pages`, preventing git push conflicts.

---

## Implementation plan

### 1. Make Vite `base` configurable via environment variable

**File:** `vite.config.js`

Change:
```js
const base = '/storyboard/'
```

To:
```js
const base = process.env.VITE_BASE_PATH || '/storyboard/'
```

This is the **only source code change**. Everything else flows from it:
- `import.meta.env.BASE_URL` in `src/index.jsx` (router basename) → automatic
- Asset paths in built HTML/JS → automatic
- `installHashPreserver` base param → automatic

### 2. Make `404.html` dynamically detect branch deploys

**File:** `public/404.html`

The current `404.html` hardcodes `pathSegmentsToKeep = 1` (for `/storyboard/`).
Branch previews live at `/storyboard/branch--X/`, which needs `pathSegmentsToKeep = 2`.

Replace the hardcoded value with dynamic detection:

```js
// Detect branch preview deploys: /storyboard/branch--X/ needs 2 segments kept
var pathSegmentsToKeep = 1;
var pathParts = window.location.pathname.split('/');
if (pathParts.length > 2 && pathParts[2] && pathParts[2].indexOf('branch--') === 0) {
  pathSegmentsToKeep = 2;
}
```

This is backwards-compatible — root deploys still use `pathSegmentsToKeep = 1`.

### 3. Rewrite `deploy.yml` (main branch deploy)

**File:** `.github/workflows/deploy.yml`

The current workflow uses the artifact-based Pages API (`upload-pages-artifact` + `deploy-pages`),
which replaces the **entire site** on every deploy. That would wipe out branch previews.

The new workflow:
1. Builds the project (same as today)
2. Clones the `gh-pages` branch
3. Replaces only the **root-level files** (not `branch--*/` folders)
4. Pushes to `gh-pages`

```yaml
name: Deploy (main)

on:
  push:
    branches:
      - main

concurrency:
  group: gh-pages-deploy
  cancel-in-progress: false   # queue, don't cancel

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      - name: Build project
        run: npm run build

      - name: Deploy to gh-pages (root)
        run: |
          set -e

          # Configure git
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # Clone gh-pages branch (or create it)
          git fetch origin gh-pages:gh-pages 2>/dev/null || true
          DEPLOY_DIR=$(mktemp -d)
          if git show-ref --verify --quiet refs/heads/gh-pages; then
            git worktree add "$DEPLOY_DIR" gh-pages
          else
            git worktree add --orphan "$DEPLOY_DIR" gh-pages
            # Clean the empty worktree
            rm -rf "$DEPLOY_DIR"/*
          fi

          # Remove root-level files only (preserve branch--* folders)
          cd "$DEPLOY_DIR"
          find . -maxdepth 1 ! -name '.' ! -name '.git' ! -name 'branch--*' -exec rm -rf {} +

          # Copy new build output
          cp -r "$GITHUB_WORKSPACE/dist/." .

          # Commit and push
          git add -A
          git diff --cached --quiet && echo "No changes to deploy" && exit 0
          git commit -m "Deploy main @ $(echo $GITHUB_SHA | head -c 7)"
          git push origin gh-pages
```

### 4. Create `preview.yml` (branch preview deploy)

**File:** `.github/workflows/preview.yml`

```yaml
name: Deploy branch preview

on:
  push:
    branches-ignore:
      - main
      - gh-pages
  delete:

concurrency:
  group: gh-pages-deploy
  cancel-in-progress: false

jobs:
  deploy-preview:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4

      - name: Derive branch folder name
        id: branch
        run: |
          # Sanitize branch name: replace / with - and remove unsafe chars
          BRANCH_NAME="${GITHUB_REF_NAME}"
          SAFE_NAME=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9._-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
          FOLDER="branch--${SAFE_NAME}"
          echo "folder=$FOLDER" >> "$GITHUB_OUTPUT"
          echo "base=/storyboard/${FOLDER}/" >> "$GITHUB_OUTPUT"
          echo "Preview folder: $FOLDER"

      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      - name: Build with custom base path
        run: npm run build
        env:
          VITE_BASE_PATH: ${{ steps.branch.outputs.base }}

      - name: Deploy preview to gh-pages
        run: |
          set -e
          FOLDER="${{ steps.branch.outputs.folder }}"

          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          git fetch origin gh-pages:gh-pages 2>/dev/null || true
          DEPLOY_DIR=$(mktemp -d)
          if git show-ref --verify --quiet refs/heads/gh-pages; then
            git worktree add "$DEPLOY_DIR" gh-pages
          else
            git worktree add --orphan "$DEPLOY_DIR" gh-pages
            rm -rf "$DEPLOY_DIR"/*
          fi

          # Replace only this branch's folder
          cd "$DEPLOY_DIR"
          rm -rf "$FOLDER"
          mkdir -p "$FOLDER"
          cp -r "$GITHUB_WORKSPACE/dist/." "$FOLDER/"

          git add -A
          git diff --cached --quiet && echo "No changes to deploy" && exit 0
          git commit -m "Deploy preview: $FOLDER @ $(echo $GITHUB_SHA | head -c 7)"
          git push origin gh-pages

      - name: Print preview URL
        run: |
          echo "## 🔗 Branch Preview" >> "$GITHUB_STEP_SUMMARY"
          echo "" >> "$GITHUB_STEP_SUMMARY"
          echo "https://dfosco.github.io/storyboard/${{ steps.branch.outputs.folder }}/" >> "$GITHUB_STEP_SUMMARY"

  cleanup-preview:
    if: github.event_name == 'delete' && github.event.ref_type == 'branch'
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout gh-pages
        uses: actions/checkout@v4
        with:
          ref: gh-pages

      - name: Remove branch preview folder
        run: |
          set -e
          BRANCH_NAME="${{ github.event.ref }}"
          SAFE_NAME=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9._-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
          FOLDER="branch--${SAFE_NAME}"

          if [ -d "$FOLDER" ]; then
            git config user.name "github-actions[bot]"
            git config user.email "github-actions[bot]@users.noreply.github.com"
            
            rm -rf "$FOLDER"
            git add -A
            git commit -m "Remove preview: $FOLDER"
            git push origin gh-pages
            echo "Removed preview: $FOLDER"
          else
            echo "No preview folder found for: $FOLDER"
          fi
```

### 5. One-time GitHub repo settings change

**This must be done manually in the GitHub UI:**

1. Go to **Settings → Pages**
2. Under **Build and deployment → Source**, change from **"GitHub Actions"** to **"Deploy from a branch"**
3. Select branch: **`gh-pages`**, folder: **`/ (root)`**
4. Save

### 6. Bootstrap the `gh-pages` branch

Before the first run, push an initial `gh-pages` branch so the workflow has something to clone.
The easiest way: just push `main` after the workflows are updated — the `deploy.yml` workflow
will create `gh-pages` automatically via the orphan branch fallback.

Alternatively, create it manually:

```bash
git checkout --orphan gh-pages
git reset --hard
git commit --allow-empty -m "Init gh-pages"
git push origin gh-pages
git checkout main
```

---

## Usage

Once set up, it's fully automatic:

```bash
# Create and push a branch — preview appears in ~1-2 min
git checkout -b security-ux
git push origin security-ux
# → https://dfosco.github.io/storyboard/branch--security-ux/

# Delete the branch — preview is cleaned up
git push origin --delete security-ux
```

The preview URL is printed in the GitHub Actions **job summary** for every branch deploy.

---

## Notes & limitations

- **GitHub Pages has a [soft limit of ~1 GB](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#usage-limits)** for repository size. Each branch build is ~5-10 MB, so this supports ~100+ concurrent branch previews before becoming a concern.
- **No PR comments.** This is branch-based, not PR-based. The preview URL appears in the Actions job summary. A future enhancement could post a commit status check with the URL.
- **The `gh-pages` branch should never be manually edited.** It's fully managed by the workflows.
- **Branch names are sanitized** — slashes become hyphens (e.g. `feature/auth` → `branch--feature-auth`).
- **Local dev is unaffected.** The `VITE_BASE_PATH` env var is only set in CI. Local `npm run dev` continues to use `/storyboard/` as the base.
