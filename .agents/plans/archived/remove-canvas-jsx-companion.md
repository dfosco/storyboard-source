# Remove .canvas.jsx Companion Support

## Goals
1. Remove all code paths that discover, load, create, or process `.canvas.jsx` companion files
2. Update all documentation and skills to remove `.canvas.jsx` references
3. Keep `.story.jsx` / story widget support fully intact (the replacement)

## Approach
Remove `.canvas.jsx` support from code, tests, docs, and skills. The `component-to-story` skill is entirely about migrating `.canvas.jsx` → `.story.jsx` — delete it entirely since there are no more `.canvas.jsx` files to migrate.

## Files to change

### Code (remove .canvas.jsx paths, keep .story.jsx)
- `packages/react/src/vite/data-plugin.js` — remove auto-detect `.canvas.jsx` companion block (~lines 653-658), keep `.story` paths
- `packages/react/src/canvas/componentIsolate.jsx` — remove `.canvas.jsx` from allowed module validation (~line 101)
- `packages/react/src/canvas/widgets/ComponentWidget.jsx` — remove/update JSDoc mentioning `.canvas.jsx`
- `packages/react/src/canvas/CanvasPage.jsx` — remove comment referencing `.canvas.jsx` (~line 1945)
- `packages/core/src/canvas/server.js` — remove companion `.canvas.jsx` detection/move logic (~lines 485-527), remove JSX creation in canvas create (~lines 625-656)

### Tests (remove .canvas.jsx test cases, update others)
- `packages/core/src/canvas/server.test.js` — remove "moves companion .canvas.jsx" test
- `packages/react/src/canvas/useCanvas.test.js` — update test strings from `.canvas.jsx` to `.story.jsx`
- `packages/react/src/canvas/widgets/embedInteraction.test.jsx` — update mock path from `.canvas.jsx` to `.story.jsx`

### Docs
- `DOCS.md` — remove "Custom component widgets" section about `.canvas.jsx`, update component widget description
- `.github/skills/canvas/SKILL.md` — remove `.canvas.jsx` references
- `packages/core/scaffold/skills/canvas/SKILL.md` — remove `.canvas.jsx` migration mention

### Delete entirely
- `.github/skills/component-to-story/SKILL.md` — entire skill is about migrating `.canvas.jsx`, no longer needed
