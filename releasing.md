# Releasing @dfosco/storyboard-* packages

All four packages share a **fixed version** — every release bumps them together.

| Package | Description |
|---------|-------------|
| `@dfosco/storyboard-core` | Framework-agnostic data layer, DevTools, utilities |
| `@dfosco/storyboard-react` | React hooks, context, Vite plugin |
| `@dfosco/storyboard-react-primer` | Primer design system form wrappers |
| `@dfosco/storyboard-react-reshaped` | Reshaped design system form wrappers |

---

## One-time setup

### 1. Make packages public

Remove `"private": true` from each package.json:

```bash
# packages/core/package.json
# packages/react/package.json
# packages/react-primer/package.json
# packages/react-reshaped/package.json
```

Add metadata to each package.json (adjust URLs):

```jsonc
{
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/<org>/storyboard.git",
    "directory": "packages/<name>"
  },
  "files": ["src"]
}
```

### 2. Add missing dependencies

`@dfosco/storyboard-react`'s Vite plugin uses `glob` and `jsonc-parser` — add them as real deps:

```bash
cd packages/react
npm install glob jsonc-parser
```

### 3. Add peer dependencies

```jsonc
// packages/react/package.json
"peerDependencies": {
  "react": ">=18",
  "react-dom": ">=18"
}

// packages/react-primer/package.json
"peerDependencies": {
  "@primer/react": ">=37",
  "react": ">=18"
}

// packages/react-reshaped/package.json
"peerDependencies": {
  "reshaped": ">=3",
  "react": ">=18"
}
```

### 4. Update changeset config

Edit `.changeset/config.json`:

```jsonc
{
  "access": "public",
  "fixed": [["@dfosco/storyboard-*"]]
}
```

### 5. Set up npm authentication for CI

**Option A: Granular Access Token (required for first publish)**

Since OIDC trusted publishing only works for packages that have been published at least once,
you need a granular access token for the initial publish:

1. Go to https://www.npmjs.com/settings/tokens
2. Create a **Granular Access Token** with read/write permissions for your packages
3. **Enable "Bypass 2FA"** on the token (required for non-interactive CI)
4. Set expiration (90 days max for write tokens)
5. Add it as a repository secret named `NPM_TOKEN` in **Settings → Secrets → Actions**

**Option B: OIDC Trusted Publishing (recommended, after first publish)**

After all packages have been published at least once, switch to OIDC trusted publishing
to eliminate token management entirely:

1. Go to each package's settings on npmjs.com → **Trusted Publisher**
2. Add GitHub Actions as a trusted publisher (org/user: `dfosco`, repo: `storyboard`, workflow: `publish.yml`)
3. The workflow already has `id-token: write` permission configured
4. Remove the `NPM_TOKEN` secret — it's no longer needed

### 6. Add the publish workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org

      - run: npm ci

      - name: Create release PR or publish
        uses: changesets/action@v1
        with:
          publish: npx changeset publish
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Day-to-day release process

### 1. Add a changeset

When you make a change worth releasing:

```bash
npx changeset
```

Select the affected packages, choose the bump type (patch / minor / major), and write a summary. This creates a markdown file in `.changeset/`.

Since versioning is fixed, **all packages will be bumped to the same version** regardless of which ones you select.

### 2. Commit and push

```bash
git add .changeset/
git commit -m "chore: add changeset for <description>"
git push
```

### 3. Merge the version PR

When `.changeset/` files exist on `main`, the GitHub Action opens a PR titled **"chore: version packages"**. This PR:

- Bumps `version` in every package.json
- Updates CHANGELOG.md
- Removes consumed changeset files

Merge it to trigger the publish.

### 4. Auto-publish

Once the version PR is merged, the same action runs `changeset publish`, which publishes all packages to npm.

---

## Manual publish (fallback)

If the GitHub Action fails or you need to publish manually:

```bash
npm login
npx changeset version   # bump versions locally
git add -A && git commit -m "chore: version packages"
npx changeset publish   # publish to npm
git push --follow-tags
```

---

## Installing @storyboard in a new project

### Minimal (React + Primer)

```bash
npm install @dfosco/storyboard-core @dfosco/storyboard-react @dfosco/storyboard-react-primer
```

### With Reshaped instead

```bash
npm install @dfosco/storyboard-core @dfosco/storyboard-react @dfosco/storyboard-react-reshaped
```

### Vite config

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { storyboardData } from '@dfosco/storyboard-react/vite'

export default defineConfig({
  plugins: [react(), storyboardData()],
})
```

### App entry

```jsx
import { StoryboardProvider, useSceneData } from '@dfosco/storyboard-react'
import { mountDevTools } from '@dfosco/storyboard-core'

// Mount devtools in dev mode
if (import.meta.env.DEV) mountDevTools()

function App() {
  return (
    <StoryboardProvider>
      <MyPage />
    </StoryboardProvider>
  )
}
```

### Data files

Create `.scene.json`, `.object.json`, and `.record.json` files anywhere in your project. The Vite plugin discovers them automatically.

See `AGENTS.md` for the full data format reference.
