# `packages/storyboard/src/core/scaffold.js`
<!--
source: packages/storyboard/src/core/scaffold.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Node.js CLI script (`storyboard-scaffold`) executed via `npx` to bootstrap or update a consumer repository from the `@dfosco/storyboard` npm package. Reads `scaffold/manifest.json` from the installed package and copies files to the consumer project using two modes: `scaffold` (copy only if target doesn't exist) and `updateable` (always overwrite with latest version). Handles individual files and entire directories.

```bash
npx storyboard-scaffold   # run from consumer repo root
```

## Composition

```js
const scaffoldRoot = path.resolve(__dirname, '..', '..', 'scaffold')
const consumerRoot = process.cwd()

const manifest = JSON.parse(fs.readFileSync(manifestPath))

for (const file of manifest.files) {
  // file.mode: 'scaffold' | 'updateable'
  // file.directory: boolean
  // file.source: path relative to scaffold/
  // file.target: destination path in consumer repo
  if (file.mode === 'scaffold' && !exists(destPath)) copyFile(src, dest)
  if (file.mode === 'updateable') copyFile(src, dest)  // always overwrite
}
// Reports: "N created, N updated, N skipped."
// Makes *.sh files executable (chmod 755)
```

## Dependencies

- `node:fs`
- `node:path`
- `scaffold/manifest.json` — the file manifest embedded in the npm package

## Dependents

- Consumer repositories running `npx storyboard-scaffold` after installing `@dfosco/storyboard`
- `package.json` `bin` field — `"storyboard-scaffold": "src/core/scaffold.js"` (the CLI entry point)

## Notes

- `scaffold` mode protects user-customized files (e.g. `storyboard.config.json`, `vite.config.js`) from being overwritten on updates.
- `updateable` mode ensures frequently-changing files like skill scripts in `.agents/` stay up-to-date with the package version.
- Shell scripts (`*.sh`) are made executable after copying so consumers don't need to manually `chmod`.
- The script uses `__dirname` derived from `import.meta.url`, so it works as an ESM module.
