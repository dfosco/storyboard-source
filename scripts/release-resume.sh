#!/usr/bin/env bash
set -euo pipefail

# Resume a failed release — ensures tags exist, pushes, and triggers CI publish.
#
# Use this when `npm run release` failed partway through (e.g. tags weren't
# created, push failed, CI didn't trigger). It skips lint/test/build/versioning
# and picks up from the current committed state.
#
# Usage:
#   npm run release:resume              # resume stable release
#   npm run release:resume:beta         # resume beta prerelease
#   npm run release:resume:alpha        # resume alpha prerelease
#
# Direct invocation:
#   ./scripts/release-resume.sh
#   ./scripts/release-resume.sh --beta
#   ./scripts/release-resume.sh --alpha

PRE_TAG="${PRERELEASE_TAG:-}"

for arg in "$@"; do
  case "$arg" in
    --beta)  PRE_TAG="beta"  ;;
    --alpha) PRE_TAG="alpha" ;;
    *)
      echo "❌ Unknown argument: $arg"
      echo "Usage: npm run release:resume | npm run release:resume:beta | npm run release:resume:alpha"
      exit 1
      ;;
  esac
done

# Read the version from the already-bumped packages
VERSION=$(node -p "require('./packages/storyboard/package.json').version")

if [ -n "$PRE_TAG" ]; then
  echo "🏷️  Resuming prerelease: $PRE_TAG (v${VERSION})"
else
  echo "📦 Resuming stable release (v${VERSION})"
fi

# Confirm
echo ""
echo "┌──────────────────────────────────────────┐"
echo "│  About to resume release: ${VERSION}"
if [ -n "$PRE_TAG" ]; then
  echo "│  npm dist-tag: ${PRE_TAG}"
else
  echo "│  npm dist-tag: latest"
fi
echo "│  Publishing will happen via CI (OIDC)"
echo "└──────────────────────────────────────────┘"
echo ""
read -r -p "Proceed? (y/N) " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "❌ Aborted."
  exit 1
fi

# Ensure tags exist (re-create if they were deleted or never created)
echo "🏷️  Ensuring git tags..."
npx changeset tag 2>/dev/null || true
echo "  ✅ Tags verified"

# Exit prerelease mode if needed
if [ -n "$PRE_TAG" ]; then
  if [ -f ".changeset/pre.json" ]; then
    echo "🔀 Exiting changeset prerelease mode..."
    npx changeset pre exit
    git add -A
    git commit -m "chore: exit prerelease mode" --allow-empty
  fi
fi

TAG="@dfosco/storyboard@${VERSION}"

echo "⬆️  Pushing branch..."
git push --set-upstream origin "$(git branch --show-current)" 2>/dev/null || git push

echo "⬆️  Pushing tags..."
git push --tags

echo "🚀 Triggering publish workflow..."
gh workflow run release-publish.yml -f "tag=${TAG}"

echo ""
echo "✅ Version ${VERSION} tags pushed and publish triggered!"
echo ""
echo "   Track progress: https://github.com/dfosco/storyboard/actions/workflows/release-publish.yml"
