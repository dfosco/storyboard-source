#!/usr/bin/env bash
# Update all @dfosco/storyboard-* packages and sync scaffold files.
# Run from storyboard client root: npm run update
set -euo pipefail

TAG="${1:-latest}"

PACKAGES=(
  "@dfosco/storyboard-core"
  "@dfosco/storyboard-react"
  "@dfosco/storyboard-react-primer"
  "@dfosco/storyboard-react-reshaped"
  "@dfosco/tiny-canvas"
)

echo "Updating @dfosco/* packages to @${TAG}..."
for pkg in "${PACKAGES[@]}"; do
  npm install "${pkg}@${TAG}" --save
done

echo ""
echo "Running scaffold sync..."
npx storyboard-scaffold

echo ""
echo "✔ All packages updated to @${TAG} and scaffold synced."
