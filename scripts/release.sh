#!/usr/bin/env bash
set -euo pipefail

# Release script for @dfosco/storyboard package
# Runs lint + tests + build before creating a versioned release.
#
# Usage:
#   npm run release              # stable release
#   npm run release:beta         # beta prerelease
#   npm run release:alpha        # alpha prerelease
#
# Direct invocation also works:
#   ./scripts/release.sh --beta
#   ./scripts/release.sh --alpha
#
# Note: "npm run release --beta" does NOT work (npm eats the flag).
# Always use "npm run release:beta" instead.

PRE_TAG="${PRERELEASE_TAG:-}"

for arg in "$@"; do
  case "$arg" in
    --beta)  PRE_TAG="beta"  ;;
    --alpha) PRE_TAG="alpha" ;;
    *)
      echo "❌ Unknown argument: $arg"
      echo "Usage: npm run release:beta | npm run release:alpha | npm run release"
      exit 1
      ;;
  esac
done

if [ -n "$PRE_TAG" ]; then
  echo "🏷️  Prerelease mode: $PRE_TAG"
else
  echo "📦 Stable release"
fi

echo ""
echo "🔍 Running lint..."
npm run lint

echo "🧪 Running tests..."
npm test

echo "🏗️  Running build..."
npm run build

# Enter prerelease mode before creating the changeset
if [ -n "$PRE_TAG" ]; then
  echo "🔀 Entering changeset prerelease mode ($PRE_TAG)..."
  npx changeset pre enter "$PRE_TAG"
fi

echo "📝 Creating changeset..."
echo ""
echo "  What type of version bump?"
echo "    1) patch  (bug fixes)"
echo "    2) minor  (new features)"
echo "    3) major  (breaking changes)"
echo ""
read -r -p "  Choose [1/2/3]: " bump_choice
case "$bump_choice" in
  1) BUMP_TYPE="patch" ;;
  3) BUMP_TYPE="major" ;;
  *) BUMP_TYPE="minor" ;;
esac

echo ""
read -r -p "  Summary: " SUMMARY
if [ -z "$SUMMARY" ]; then
  SUMMARY="Release"
fi

# Generate changeset file (all fixed packages bump together — only need to name one)
CHANGESET_ID=$(node -p "'changeset-' + Date.now().toString(36)")
cat > ".changeset/${CHANGESET_ID}.md" <<EOF
---
"@dfosco/storyboard": ${BUMP_TYPE}
---

${SUMMARY}
EOF
echo "  ✅ Created .changeset/${CHANGESET_ID}.md (${BUMP_TYPE})"

echo "📦 Bumping versions..."
npm run version

# Read the version that was just set
VERSION=$(node -p "require('./packages/storyboard/package.json').version")

# Sanity check: prerelease versions must contain the tag
if [ -n "$PRE_TAG" ] && [[ "$VERSION" != *"-${PRE_TAG}."* ]]; then
  echo ""
  echo "❌ ERROR: Expected a ${PRE_TAG} prerelease version but got ${VERSION}"
  echo "   This usually means 'changeset pre enter' failed silently."
  echo "   Aborting — no packages have been published."
  echo ""
  echo "   To fix: run 'npx changeset pre exit' and try again."
  exit 1
fi

# Confirm before proceeding
echo ""
echo "┌──────────────────────────────────────────┐"
echo "│  About to release version: ${VERSION}"
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
  # Roll back pre mode if we entered it
  if [ -n "$PRE_TAG" ]; then
    npx changeset pre exit 2>/dev/null || true
  fi
  exit 1
fi

echo "📌 Committing version bump..."
git add -A
if [ -n "$PRE_TAG" ]; then
  git commit -m "chore: version packages (${PRE_TAG})"
else
  git commit -m "chore: version packages"
fi

echo "🏷️  Creating git tags..."
npx changeset tag

# Exit prerelease mode so the repo is left clean
if [ -n "$PRE_TAG" ]; then
  echo "🔀 Exiting changeset prerelease mode..."
  npx changeset pre exit
  git add -A
  git commit -m "chore: exit prerelease mode" --allow-empty
fi

TAG="@dfosco/storyboard@${VERSION}"

echo "⬆️  Pushing branch..."
git push --set-upstream origin "$(git branch --show-current)" 2>/dev/null || git push

echo "⬆️  Pushing tags..."
git push --tags

echo "🚀 Triggering publish workflow..."
gh workflow run release-publish.yml -f "tag=${TAG}"

echo ""
echo "✅ Version ${VERSION} tagged, pushed, and publish triggered!"
echo ""
echo "   Track progress: https://github.com/dfosco/storyboard/actions/workflows/release-publish.yml"
