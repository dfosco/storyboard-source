# `packages/storyboard/src/internals/canvas/widgets/FrozenTerminalOverlay.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/FrozenTerminalOverlay.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`FrozenTerminalOverlay.jsx` is the fallback surface shown when a terminal widget loses its live Ghostty/WebGL slot but the backing tmux session is still alive. It fetches the latest terminal snapshot, renders either ANSI-colored HTML or stripped plain text, then overlays a resume affordance so the user can reactivate the live terminal without losing context.

## Composition

The component resolves snapshot data from two server endpoints, converts ANSI output when the optional dependency is available, and scales the rendered `<pre>` to match the widget width.

```jsx
export default function FrozenTerminalOverlay({ widgetId, onActivate }) {
  const [html, setHtml] = useState(null)
  const [plainText, setPlainText] = useState(null)
  const [scale, setScale] = useState(1)
}
```

Key behavior:

- `getConverter()` dynamically imports `ansi-to-html` with `@vite-ignore`, caches the constructor, and falls back to plain text if loading fails.
- `fetchSnapshot()` tries both `/_storyboard/canvas/terminal-snapshot/:id` and the static `/_storyboard/terminal-snapshots/:id.snapshot.json` path.
- `stripAnsi()` removes escape sequences when rich conversion is unavailable.
- A `ResizeObserver` recalculates `scale` from the container’s padded width versus the `<pre>` scroll width.
- The root overlay is keyboard/click activatable and delegates resume to `onActivate`.

```jsx
{hasSnapshot && (
  <div ref={containerRef} className={styles.snapshotContent}>
    <pre
      ref={preRef}
      className={styles.snapshotPre}
      style={{ transform: `scale(${scale})` }}
    />
  </div>
)}
```

## Dependencies

- React state/effect hooks for async snapshot loading and scale recalculation.
- `ansi-to-html` as an optional dynamic import for colored snapshot rendering.
- `FrozenTerminalOverlay.module.css` for the faded background and status chrome.

## Dependents

- [`TerminalWidget.jsx`](./TerminalWidget.jsx.md) uses it when a live terminal session is running but cannot currently render inline.

## Notes

- `getBaseUrl()` reads `import.meta.env.BASE_URL`, so branch-prefixed Storyboard URLs keep snapshot fetches on the correct path.
- The overlay tolerates missing endpoints and missing converter support by silently degrading to no snapshot or plain text.
