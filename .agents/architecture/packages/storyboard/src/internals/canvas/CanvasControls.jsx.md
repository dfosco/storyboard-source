# `packages/storyboard/src/internals/canvas/CanvasControls.jsx`

<!--
source: packages/storyboard/src/internals/canvas/CanvasControls.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/CanvasControls.jsx`](./CanvasControls.jsx.md) is the focused bottom-left creation control used inside the canvas editing surface. It exposes both normal widget creation and story/component insertion while keeping the canvas page itself in charge of placement and persistence.

## Composition

```jsx
export default function CanvasControls({ onAddWidget }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [storyPicker, setStoryPicker] = useState(false)
  const menuRef = useRef(null)
```

```jsx
const handleAddStory = useCallback((storyId) => {
  document.dispatchEvent(new CustomEvent('storyboard:canvas:add-story-widget', { detail: { storyId } }))
  setMenuOpen(false)
  setStoryPicker(false)
}, [])
```

It has three responsibilities: close on outside click, list normal widget types from widget config, and switch into a story picker backed by `listStories()` / `getStoryData()`.

## Dependencies

- Widget menu metadata in `./widgets/widgetConfig.js`.
- Story index helpers from `../../core/index.js`.
- Local CSS in `CanvasControls.module.css`.

## Dependents

This component is part of the canvas control family consumed alongside [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md), although the page now also listens directly for the custom events this control emits.

## Notes

- Story creation is intentionally event-based so [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) remains the single place that computes viewport-aware placement.
