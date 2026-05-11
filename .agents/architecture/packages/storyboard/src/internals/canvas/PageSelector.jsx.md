# `packages/storyboard/src/internals/canvas/PageSelector.jsx`

<!--
source: packages/storyboard/src/internals/canvas/PageSelector.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/PageSelector.jsx`](./PageSelector.jsx.md) manages sibling-page navigation inside a canvas group. Beyond switching pages, it also handles canvas-page authoring concerns in local dev: rename, duplicate, create, insert separators, and reorder pages, all while preserving dropdown state across HMR-driven reloads.

## Composition

```jsx
export default function PageSelector({ currentName, pages: initialPages, isLocalDev = false }) {
  const [open, setOpen] = useState(() => {
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sb-open-page-selector')) {
        sessionStorage.removeItem('sb-open-page-selector')
        return true
      }
    } catch {}
    return false
  })
  …
}
```

```jsx
const handleDrop = useCallback(async (toIndex, e) => {
  …
  const newItems = [...orderedItems]
  const [moved] = newItems.splice(fromIndex, 1)
  newItems.splice(toIndex, 0, moved)
  setOrderedItems(newItems)
  if (folder) {
    const order = newItems.map(i => i.type === 'separator' ? i.id : i.name)
    try { await reorderPages(folder, order) } catch (err) { … }
  }
}, [dragIndex, orderedItems, folder])
```

```jsx
const handleAddPage = useCallback(async () => {
  const createBody = isSinglePage
    ? { name: trimmed, convertFrom: currentName }
    : { name: trimmed, folder: folder || undefined }
  const result = await createCanvas(createBody)
  …
}, [newName, currentName, folder, creating, orderedItems])
```

The component keeps `pages` and `orderedItems` separate so it can preserve separators and server-defined order while still reacting to incoming page data.

## Dependencies

- [`packages/storyboard/src/internals/canvas/canvasApi.js`](./canvasApi.js.md) for create/rename/reorder/duplicate operations.
- Local CSS in `PageSelector.module.css`.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) renders it in the canvas title bar.
- `PageSelector.test.jsx` covers interaction and ordering behavior.

## Notes

- Navigation uses `window.location.href` instead of router hooks so the selector can run inside the canvas shell without requiring router context.
