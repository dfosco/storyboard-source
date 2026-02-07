# Architecture Scanner Skill

> Triggered by: "scan the codebase architecture", "update the architecture", "update arch", "generate architecture docs", "scan arch"

## What This Does

Generates documentation files in `.github/architecture/` that describe every architecturally significant file in the codebase. The system has two layers:

- **`architecture.index.md`** — The architectural overview. Groups files by category and includes a prose summary of each category's purpose, key concepts, and how the parts fit together. A reader should be able to understand the system's architecture from this file alone.
- **Per-file docs** (`{filepath}.md`) — Detailed documentation for individual files, including what they do, how they work (with code samples), their dependencies, and dependents.

## How to Execute

### Step 1: Discover files

```bash
.github/skills/architecture-scanner/scan.sh --discover
```

This scans the repo using discovery rules and creates or updates `files.json` in the skill folder. If `files.json` doesn't exist yet, it creates it with default priorities. If it already exists, it **adds new files** and **removes deleted files**, but **preserves user-set `importance` values** — those are never overwritten.

Run this first to ensure the file list is current.

### Step 2: Determine what needs to be done

Run one of these depending on whether this is a **full scan** or an **incremental update**:

**Full scan** (first time, or when requested explicitly):
```bash
.github/skills/architecture-scanner/scan.sh --manifest
```
This outputs every non-low file that needs documentation. Use this as the authoritative list — do NOT manually pick files.

**Incremental update** (default for subsequent runs):
```bash
.github/skills/architecture-scanner/scan.sh --stale
```
This outputs only files whose documentation is **missing** or **stale** (source file was modified more recently than its doc). Each entry includes a `"status"` field: `"missing"` or `"stale"`. If the output is an empty array `[]`, all docs are up to date — skip to Step 4.

**Low importance files are excluded from both manifests and should NOT get architecture docs.**

### Step 3: Generate or update documentation for each file

For each entry in the manifest, produce a markdown file at:

```
.github/architecture/{filepath}.md
```

For example:
- `src/storyboard/core/loader.js` → `.github/architecture/src/storyboard/core/loader.js.md`
- `vite.config.js` → `.github/architecture/vite.config.js.md`

#### For NEW files (status `"missing"`, or first full scan):

Create subdirectories as needed with `mkdir -p`. Use the **create** tool to write the doc file. The manifest's `doc` field contains the exact relative path to use.

#### For STALE files (status `"stale"`):

The doc already exists but the source file has changed. Follow this process:

1. **Read the source file** to understand what changed
2. **Read the existing doc file** to see what's already documented
3. **Use the edit tool** to update only the sections that are affected by the source changes — preserve the existing structure and any manually-added context that's still accurate
4. Do NOT recreate the file from scratch — make surgical updates

**What to check when updating a stale doc:**
- Has the file's purpose changed? → Update **Goal**
- Have exports/functions/components changed? → Update **Composition**
- Have imports changed? → Update **Dependencies**
- Have downstream consumers changed? → Update **Dependents** (re-grep)
- Any new edge cases or behavior changes? → Update **Notes**

#### Doc template

Each doc file MUST follow this template:

```markdown
# `{filepath}`

<!--
source: {filepath}
category: {category}
importance: {importance}
-->

> [← Architecture Index](../architecture.index.md)

(Adjust the relative path based on nesting depth — e.g., `../../architecture.index.md` for files 2 levels deep like `src/storyboard/core/loader.js.md`)

## Goal

{1-2 paragraph architectural summary: what this file does, why it exists, and how it fits into the broader system. This should be readable by someone unfamiliar with the codebase.}

## Composition

{Detailed description of the file's structure: what it exports, key functions/components, internal organization, type signatures, parameter details. Include code samples from the actual source file to illustrate key exports, signatures, and patterns — don't just describe them in prose.}

## Dependencies

{List of significant imports — what this file depends on, and why}

## Dependents

{What depends on this file — who imports it, derived by grepping}

## Notes

{Any non-obvious behavior, edge cases, circular dependency considerations, or architectural decisions worth noting. Omit this section if there's nothing notable.}
```

**Rules for writing docs:**
- Read each file's actual content before writing its doc — do NOT guess
- The **Goal** section is the most important — it should be a clear, standalone summary (1-2 paragraphs) that anyone can read without expanding the details
- The remaining sections (Composition, Dependencies, Dependents, Notes) are all top-level headings — do NOT wrap them in a `<details>` element
- **Include code samples** — when describing exports, function signatures, component props, data shapes, or usage patterns, include actual code snippets from the source file. This makes docs scannable and concrete.
- The "Dependents" section should be derived by grepping for imports of this file
- For `medium` importance files, keep it concise — shorter Goal, fewer code samples
- For `high` importance files, write a thorough Goal (2 paragraphs), comprehensive Composition with multiple code samples, and complete dependency/dependent lists

### Step 4: Generate the index

```bash
.github/skills/architecture-scanner/scan.sh --index
```

This reads the generated doc files and creates `architecture.index.md` with a categorized table of contents.

**After the script generates the index**, you MUST enhance it by adding a prose overview for each category section. The final index should follow this structure:

```markdown
# Architecture Index

> Auto-generated documentation of architecturally significant files.
> Run `scan the codebase architecture` to regenerate.

## {Category Name}

{1-2 paragraph overview of this category: what role these files play in the system, key concepts and patterns, and how they relate to each other. A reader should understand this subsystem's architecture from this paragraph alone, before clicking into any individual file doc.}

- [`path/to/file.js`](./path/to/file.js.md) — {one-line description}
- [`path/to/other.js`](./path/to/other.js.md) — {one-line description}

## {Next Category}
...
```

**Rules for the index:**
- Each category section gets an architectural overview paragraph — not just a list of links
- Each link gets a brief one-line description (pulled from the file doc's Goal section)
- The overview should explain the category's purpose, key patterns, and how the files within it relate to each other
- Write for someone unfamiliar with the codebase — the index is the entry point to understanding the architecture

### Step 5: Verify

- Confirm every file in the manifest has a corresponding `.md` doc
- Confirm `architecture.index.md` links to all docs
- Confirm every doc has a backlink to the index

### Step 6: Commit

```bash
git add .github/architecture/ .github/skills/architecture-scanner/
git commit -m "Update architecture documentation"
```
