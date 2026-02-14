# Changeset Skill

> Triggered by: "bump version", "create changeset", "release a new version", "version bump", "patch bump", "minor bump", "major bump", "tag release", "run changeset", "changeset"

## What This Does

Guides the agent through the changesets versioning workflow using `@changesets/cli` — from creating a changeset file to bumping the version, updating the changelog, creating a git tag, and committing.

## How to Execute

### Step 1: Create a changeset

Run `npx changeset` interactively OR create a changeset file manually in `.changeset/`. The file should have a YAML frontmatter block specifying the package name and bump type (`patch`/`minor`/`major`), followed by a markdown summary.

Example changeset file (`.changeset/some-name.md`):

```md
---
"storyboard": patch
---

fix: resolve missing CSS module build failure
```

For patch/minor/major selection:

- **patch** — bug fixes, small tweaks
- **minor** — new features, non-breaking changes
- **major** — breaking changes

The changeset file name doesn't matter — it gets deleted after versioning.

### Step 2: Version bump

```bash
npm run version
```

This calls `changeset version`, which:

- Consumes all pending changeset files in `.changeset/`
- Bumps the version in `package.json`
- Updates `CHANGELOG.md`
- Deletes the consumed changeset files

**Note:** `changeset version` does NOT create git tags — that's a separate step.

### Step 3: Commit the version bump

```bash
git add .
git commit -m "chore: version X.Y.Z"
```

Replace `X.Y.Z` with the new version from `package.json`.

Always commit the version bump BEFORE running `npm run tag`.

### Step 4: Create git tag

```bash
npm run tag
```

This calls `changeset tag`, which creates a `vX.Y.Z` git tag from the current `package.json` version.

### Step 5: Push

```bash
git push --follow-tags
```

## Notes

- `changeset version` does NOT create git tags — that's why `npm run tag` is a separate step
- Always commit the version bump BEFORE running `npm run tag`
- The `.changeset/config.json` has `"privatePackages": { "version": true, "tag": true }` — this is required because the package is `"private": true` and changesets skips private packages by default
