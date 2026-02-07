#!/usr/bin/env bash
#
# extract-tokens.sh — Extract CSS custom property names from @primer/primitives
#
# Reads all CSS files from node_modules/@primer/primitives/dist/css/,
# extracts CSS custom property declarations (--var-name), deduplicates,
# categorizes, and appends the result to primer-primitives.md after the
# <!-- TOKENS --> marker.
#
# Usage: .github/skills/primer-primitives/extract-tokens.sh

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SKILL_DIR="$REPO_ROOT/.github/skills/primer-primitives"
PRIMITIVES_CSS="$REPO_ROOT/node_modules/@primer/primitives/dist/css"
SKILL_FILE="$SKILL_DIR/primer-primitives.md"

if [ ! -d "$PRIMITIVES_CSS" ]; then
  echo "Error: @primer/primitives not installed. Run npm install first." >&2
  exit 1
fi

if [ ! -f "$SKILL_FILE" ]; then
  echo "Error: $SKILL_FILE not found." >&2
  exit 1
fi

# Get package version
VERSION=$(node -e "console.log(require('$REPO_ROOT/node_modules/@primer/primitives/package.json').version)" 2>/dev/null || echo "unknown")

# ── Extract tokens by source file category ───────────────────

extract_vars() {
  # Extract CSS custom property declarations from a file
  # Matches lines like:  --some-var: value;
  grep -oE -- '--[a-zA-Z0-9_-]+' "$1" | sort -u
}

# Collect all vars from each category into temp files
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# Base tokens
for f in "$PRIMITIVES_CSS"/base/size/*.css; do
  [ -f "$f" ] && extract_vars "$f" >> "$TMP_DIR/base-size.txt"
done
for f in "$PRIMITIVES_CSS"/base/typography/*.css; do
  [ -f "$f" ] && extract_vars "$f" >> "$TMP_DIR/base-typography.txt"
done
for f in "$PRIMITIVES_CSS"/base/motion/*.css; do
  [ -f "$f" ] && extract_vars "$f" >> "$TMP_DIR/base-motion.txt"
done

# Functional size tokens — split into sub-categories
for f in "$PRIMITIVES_CSS"/functional/size/*.css; do
  [ -f "$f" ] && extract_vars "$f" >> "$TMP_DIR/func-size-all.txt"
done
if [ -f "$TMP_DIR/func-size-all.txt" ]; then
  sort -u "$TMP_DIR/func-size-all.txt" -o "$TMP_DIR/func-size-all.txt"
  grep '^--borderRadius\|^--borderWidth\|^--boxShadow\|^--outline' "$TMP_DIR/func-size-all.txt" > "$TMP_DIR/func-border.txt" 2>/dev/null || true
  grep '^--breakpoint'     "$TMP_DIR/func-size-all.txt" > "$TMP_DIR/func-breakpoint.txt"  2>/dev/null || true
  grep '^--viewportRange'  "$TMP_DIR/func-size-all.txt" > "$TMP_DIR/func-viewport.txt"    2>/dev/null || true
  grep '^--control'        "$TMP_DIR/func-size-all.txt" > "$TMP_DIR/func-control.txt"     2>/dev/null || true
  grep '^--overlay'        "$TMP_DIR/func-size-all.txt" > "$TMP_DIR/func-overlay.txt"     2>/dev/null || true
  grep '^--stack'          "$TMP_DIR/func-size-all.txt" > "$TMP_DIR/func-stack.txt"        2>/dev/null || true
  grep '^--spinner'        "$TMP_DIR/func-size-all.txt" > "$TMP_DIR/func-spinner.txt"      2>/dev/null || true
fi
for f in "$PRIMITIVES_CSS"/functional/typography/*.css; do
  [ -f "$f" ] && extract_vars "$f" >> "$TMP_DIR/func-typography.txt"
done

# Color tokens — use light.css as the canonical set (all themes have the same names)
if [ -f "$PRIMITIVES_CSS/functional/themes/light.css" ]; then
  extract_vars "$PRIMITIVES_CSS/functional/themes/light.css" > "$TMP_DIR/colors-all.txt"
fi

# ── Categorize color tokens ─────────────────────────────────

if [ -f "$TMP_DIR/colors-all.txt" ]; then
  grep '^--bgColor'           "$TMP_DIR/colors-all.txt" > "$TMP_DIR/color-bg.txt"        2>/dev/null || true
  grep '^--fgColor'           "$TMP_DIR/colors-all.txt" > "$TMP_DIR/color-fg.txt"        2>/dev/null || true
  grep '^--borderColor'       "$TMP_DIR/colors-all.txt" > "$TMP_DIR/color-border.txt"    2>/dev/null || true
  grep '^--border-'           "$TMP_DIR/colors-all.txt" >> "$TMP_DIR/color-border.txt"   2>/dev/null || true
  grep '^--shadow'            "$TMP_DIR/colors-all.txt" > "$TMP_DIR/color-shadow.txt"    2>/dev/null || true
  grep '^--outline'           "$TMP_DIR/colors-all.txt" >> "$TMP_DIR/color-shadow.txt"   2>/dev/null || true

  # Component-specific color tokens (everything not already captured)
  grep -v '^--bgColor'    "$TMP_DIR/colors-all.txt" | \
  grep -v '^--fgColor'    | \
  grep -v '^--borderColor' | \
  grep -v '^--border-'    | \
  grep -v '^--shadow'     | \
  grep -v '^--outline'    > "$TMP_DIR/color-component.txt" 2>/dev/null || true
fi

# ── Sort and deduplicate all files ───────────────────────────
for f in "$TMP_DIR"/*.txt; do
  [ -f "$f" ] && sort -u "$f" -o "$f"
done

# ── Build token content into a temp file ─────────────────────

OUTPUT=$(mktemp)

write_section() {
  local title="$1"
  local file="$2"
  if [ -f "$file" ] && [ -s "$file" ]; then
    local count
    count=$(wc -l < "$file" | tr -d ' ')
    echo "" >> "$OUTPUT"
    echo "### $title ($count)" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    echo '```' >> "$OUTPUT"
    cat "$file" >> "$OUTPUT"
    echo '```' >> "$OUTPUT"
  fi
}

cat > "$OUTPUT" << HEADER

<!-- TOKENS -->
<!-- Generated from @primer/primitives@$VERSION — do not edit manually -->
<!-- Run .github/skills/primer-primitives/extract-tokens.sh to regenerate -->

---

## Token Index

Use these CSS custom properties in all CSS Modules (\`*.module.css\`) files.
Reference them with \`var(--token-name)\`.

**Usage example:**
\`\`\`css
.container {
  padding: var(--stack-padding-normal);
  gap: var(--stack-gap-condensed);
  font: var(--text-body-shorthand-medium);
  color: var(--fgColor-default);
  background: var(--bgColor-default);
  border: var(--borderWidth-thin) solid var(--borderColor-default);
  border-radius: var(--borderRadius-medium);
  box-shadow: var(--shadow-resting-small);
}
\`\`\`

### Base Tokens
HEADER

write_section "Sizes" "$TMP_DIR/base-size.txt"
write_section "Typography" "$TMP_DIR/base-typography.txt"
write_section "Motion & Duration" "$TMP_DIR/base-motion.txt"

echo "" >> "$OUTPUT"
echo "### Functional Tokens — Layout & Sizing" >> "$OUTPUT"

write_section "Borders & Radii" "$TMP_DIR/func-border.txt"
write_section "Breakpoints" "$TMP_DIR/func-breakpoint.txt"
write_section "Viewport Ranges" "$TMP_DIR/func-viewport.txt"
write_section "Controls" "$TMP_DIR/func-control.txt"
write_section "Overlays" "$TMP_DIR/func-overlay.txt"
write_section "Stack" "$TMP_DIR/func-stack.txt"
write_section "Spinner" "$TMP_DIR/func-spinner.txt"
write_section "Typography & Font Stacks" "$TMP_DIR/func-typography.txt"

echo "" >> "$OUTPUT"
echo "### Color Tokens" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "> Themed automatically — values change per color scheme." >> "$OUTPUT"

write_section "Background Colors" "$TMP_DIR/color-bg.txt"
write_section "Foreground / Text Colors" "$TMP_DIR/color-fg.txt"
write_section "Border Colors" "$TMP_DIR/color-border.txt"
write_section "Shadows & Outlines" "$TMP_DIR/color-shadow.txt"
write_section "Component-Specific Colors" "$TMP_DIR/color-component.txt"

# Count total
TOTAL=$(cat "$TMP_DIR"/*.txt 2>/dev/null | sort -u | wc -l | tr -d ' ')
echo "" >> "$OUTPUT"
echo "---" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "_${TOTAL} unique tokens total._" >> "$OUTPUT"

# ── Splice token content into the skill file ─────────────────

# Strip everything from <!-- TOKENS --> onward (if present), then append new content
TMPSKILL=$(mktemp)
if grep -q '<!-- TOKENS -->' "$SKILL_FILE"; then
  sed '/<!-- TOKENS -->/,$d' "$SKILL_FILE" > "$TMPSKILL"
else
  cat "$SKILL_FILE" > "$TMPSKILL"
fi

cat "$OUTPUT" >> "$TMPSKILL"
mv "$TMPSKILL" "$SKILL_FILE"
rm -f "$OUTPUT"

echo "Updated $SKILL_FILE ($TOTAL tokens from @primer/primitives@$VERSION)"
