# Update Storyboard Packages

Updates all `@dfosco/storyboard-*` packages together to the same version and runs the scaffold sync.

## Usage

```bash
npm run update          # Update to latest stable
npm run update:beta     # Update to latest beta
npm run update:alpha    # Update to latest alpha
```

## What it does

1. Updates all `@dfosco/storyboard-*` packages to the specified tag
2. Runs `npx storyboard-scaffold` to sync skills and scripts from the latest version
