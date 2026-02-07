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

# Format tokens as CSS :root block with ; after each property
write_token_block() {
  local file="$1"
  echo '```css' >> "$OUTPUT"
  echo ':root {' >> "$OUTPUT"
  sed 's/^/  /; s/$/;/' "$file" >> "$OUTPUT"
  echo '}' >> "$OUTPUT"
  echo '```' >> "$OUTPUT"
}

write_section() {
  local title="$1"
  local file="$2"
  local description="$3"
  if [ -f "$file" ] && [ -s "$file" ]; then
    local count
    count=$(wc -l < "$file" | tr -d ' ')
    echo "" >> "$OUTPUT"
    echo "### $title ($count)" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    echo "$description" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    write_token_block "$file"
  fi
}

cat > "$OUTPUT" << 'HEADER'

<!-- TOKENS -->
HEADER

cat >> "$OUTPUT" << HEADER
<!-- Generated from @primer/primitives@$VERSION — do not edit manually -->
<!-- Run .github/skills/primer-primitives/extract-tokens.sh to regenerate -->

---

## Token Index

### Base Tokens
HEADER

write_section "Sizes" "$TMP_DIR/base-size.txt" \
'Raw size scale used as building blocks. Apply to \`width\`, \`height\`, \`margin\`, \`padding\`, \`gap\`, or any length property when a specific pixel value is needed.

```css
.avatar { width: var(--base-size-32); height: var(--base-size-32); }
.icon { width: var(--base-size-16); height: var(--base-size-16); }
.spacer { margin-block: var(--base-size-8); }
```'

write_section "Typography (base)" "$TMP_DIR/base-typography.txt" \
'Base font weight values. Apply to \`font-weight\`.

```css
.label { font-weight: var(--base-text-weight-semibold); }
.body { font-weight: var(--base-text-weight-normal); }
```'

write_section "Motion & Duration" "$TMP_DIR/base-motion.txt" \
'Animation timing values. Apply \`--base-duration-*\` to \`transition-duration\` or \`animation-duration\`, and \`--base-easing-*\` to \`transition-timing-function\` or \`animation-timing-function\`.

```css
.fade { transition: opacity var(--base-duration-200) var(--base-easing-easeInOut); }
.slide { animation-duration: var(--base-duration-300); animation-timing-function: var(--base-easing-easeOut); }
```'

echo "" >> "$OUTPUT"
echo "### Functional Tokens — Layout & Sizing" >> "$OUTPUT"

write_section "Borders & Radii" "$TMP_DIR/func-border.txt" \
'Apply \`--borderRadius-*\` to \`border-radius\`, \`--borderWidth-*\` to \`border-width\`, and \`--outline-*\` to focus outline styling.

```css
.card { border-radius: var(--borderRadius-medium); border-width: var(--borderWidth-thin); }
.pill { border-radius: var(--borderRadius-full); }
.input:focus { outline-width: var(--outline-focus-width); outline-offset: var(--outline-focus-offset); }
```'

write_section "Breakpoints" "$TMP_DIR/func-breakpoint.txt" \
'Responsive breakpoint widths. Use in \`@media\` queries with \`min-width\` or \`max-width\`.

```css
@media (min-width: 768px) { /* --breakpoint-medium */ }
@media (min-width: 1012px) { /* --breakpoint-large */ }
```'

write_section "Viewport Ranges" "$TMP_DIR/func-viewport.txt" \
'Custom media queries for responsive layout. Use directly in \`@media\` rules (resolved by PostCSS).

```css
@media (--viewportRange-narrow) { .sidebar { display: none; } }
@media (--viewportRange-regular) { .sidebar { display: block; } }
```'

write_section "Controls" "$TMP_DIR/func-control.txt" \
'Sizing and spacing for interactive controls (buttons, inputs, selects). Apply \`--control-*-size\` to \`height\`/\`min-height\`, \`--control-*-paddingInline-*\` to \`padding-inline\`, \`--control-*-paddingBlock\` to \`padding-block\`, and \`--control-*-gap\` to \`gap\`. \`--controlStack-*\` tokens are for spacing between grouped controls.

```css
.btn { height: var(--control-medium-size); padding-inline: var(--control-medium-paddingInline-normal); gap: var(--control-medium-gap); }
.btn-sm { height: var(--control-small-size); padding-inline: var(--control-small-paddingInline-condensed); }
.btnGroup { gap: var(--controlStack-medium-gap-condensed); }
```'

write_section "Overlays" "$TMP_DIR/func-overlay.txt" \
'Sizing and spacing for floating panels, dialogs, and popovers. Apply \`--overlay-width-*\` / \`--overlay-height-*\` to \`width\`/\`height\`, \`--overlay-padding-*\` to \`padding\`, \`--overlay-offset\` to positioning offsets, and \`--overlay-borderRadius\` to \`border-radius\`.

```css
.dialog { width: var(--overlay-width-medium); border-radius: var(--overlay-borderRadius); padding: var(--overlay-padding-normal); }
.dropdown { width: var(--overlay-width-small); max-height: var(--overlay-height-small); }
```'

write_section "Stack" "$TMP_DIR/func-stack.txt" \
'Spacing for stack/flex layouts. Apply \`--stack-gap-*\` to \`gap\` and \`--stack-padding-*\` to \`padding\`.

```css
.container { padding: var(--stack-padding-normal); gap: var(--stack-gap-condensed); }
.section { padding: var(--stack-padding-spacious); gap: var(--stack-gap-normal); }
```'

write_section "Spinner" "$TMP_DIR/func-spinner.txt" \
'Sizing for loading spinners. Apply \`--spinner-size-*\` to \`width\`/\`height\` and \`--spinner-strokeWidth-*\` to \`stroke-width\` or \`border-width\`.

```css
.spinner { width: var(--spinner-size-medium); height: var(--spinner-size-medium); }
.spinner-sm { width: var(--spinner-size-small); height: var(--spinner-size-small); }
```'

write_section "Typography & Font Stacks" "$TMP_DIR/func-typography.txt" \
'Semantic typography tokens. Use \`--text-*-shorthand-*\` with the \`font\` shorthand property (sets size, line-height, weight in one declaration). Use \`--text-*-size-*\` for \`font-size\`, \`--text-*-lineHeight-*\` for \`line-height\`, \`--text-*-weight-*\` for \`font-weight\`. Use \`--fontStack-*\` for \`font-family\`.

```css
.heading { font: var(--text-title-shorthand-large); }
.body { font: var(--text-body-shorthand-medium); }
.caption { font: var(--text-caption-shorthand); }
.code { font: var(--text-codeBlock-shorthand); font-family: var(--fontStack-monospace); }
.display { font: var(--text-display-shorthand); }
```'

echo "" >> "$OUTPUT"
echo "### Color Tokens" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "> Themed automatically — values change per color scheme." >> "$OUTPUT"

write_section "Background Colors" "$TMP_DIR/color-bg.txt" \
'Apply to \`background-color\` or \`background\`. Use semantic names: \`-default\` for surfaces, \`-muted\` for subtle backgrounds, \`-emphasis\` for bold/filled backgrounds, \`-inset\` for recessed areas.

```css
.page { background-color: var(--bgColor-default); }
.card { background-color: var(--bgColor-muted); }
.badge-green { background-color: var(--bgColor-success-emphasis); }
.well { background-color: var(--bgColor-inset); }
```'

write_section "Foreground / Text Colors" "$TMP_DIR/color-fg.txt" \
'Apply to \`color\`. Use \`-default\` for primary text, \`-muted\` for secondary/deemphasized text, and semantic variants for status messaging.

```css
.text { color: var(--fgColor-default); }
.secondary { color: var(--fgColor-muted); }
.error { color: var(--fgColor-danger); }
.link { color: var(--fgColor-accent); }
.placeholder { color: var(--fgColor-disabled); }
```'

write_section "Border Colors" "$TMP_DIR/color-border.txt" \
'Apply to \`border-color\` or use \`--border-*\` shorthand tokens (which include width+style+color) with the \`border\` shorthand property.

```css
.card { border: var(--borderWidth-thin) solid var(--borderColor-default); }
.input { border-color: var(--borderColor-default); }
.input:focus { border-color: var(--borderColor-accent-emphasis); }
.alert { border: var(--border-danger-emphasis); }
```'

write_section "Shadows & Outlines" "$TMP_DIR/color-shadow.txt" \
'Apply \`--shadow-*\` to \`box-shadow\`. Resting shadows are for static elevation; floating shadows are for overlays/dropdowns.

```css
.card { box-shadow: var(--shadow-resting-small); }
.dropdown { box-shadow: var(--shadow-floating-medium); }
.modal { box-shadow: var(--shadow-floating-large); }
```'

write_section "Component-Specific Colors" "$TMP_DIR/color-component.txt" \
'Scoped color tokens for specific Primer components (buttons, labels, counters, avatars, etc.). Apply to the relevant CSS property for each component — typically \`background-color\`, \`color\`, or \`border-color\`. The token name indicates the component and state (e.g. \`--button-primary-bgColor-rest\`, \`--label-red-fgColor-hover\`).

```css
.btn-primary { background-color: var(--button-primary-bgColor-rest); color: var(--button-primary-fgColor-rest); }
.btn-primary:hover { background-color: var(--button-primary-bgColor-hover); }
.counter { background-color: var(--counter-bgColor-emphasis); color: var(--counter-fgColor-emphasis); }
```'

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
  sed '/<!-- TOKENS -->/,$d' "$SKILL_FILE" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' > "$TMPSKILL"
else
  cat "$SKILL_FILE" > "$TMPSKILL"
fi

cat "$OUTPUT" >> "$TMPSKILL"
mv "$TMPSKILL" "$SKILL_FILE"
rm -f "$OUTPUT"

echo "Updated $SKILL_FILE ($TOTAL tokens from @primer/primitives@$VERSION)"
