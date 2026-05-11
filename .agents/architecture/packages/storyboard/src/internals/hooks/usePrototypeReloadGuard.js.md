# `packages/storyboard/src/internals/hooks/usePrototypeReloadGuard.js`

<!--
source: packages/storyboard/src/internals/hooks/usePrototypeReloadGuard.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`usePrototypeReloadGuard` is a lifecycle hook for the dev environment rather than for data consumption. When prototype auto-reload is disabled, it sends a repeating heartbeat over Vite HMR so the dev server knows to suppress full reload payloads for that tab.

That keeps non-canvas prototype sessions stable while still allowing custom storyboard events to flow through. The hook is intentionally effect-only and returns nothing.

## Composition

```js
export default function usePrototypeReloadGuard() {
  useEffect(() => {
    if (!import.meta.hot) return
    function sync() {
      const autoReload = getFlag('prototype-auto-reload')
      if (autoReload) stop()
      else start()
    }
    sync()
    const unsub = subscribeToStorage((key) => { /* resync on flag changes */ })
    return () => { stop(); unsub() }
  }, [])
}
```

- Signature: `usePrototypeReloadGuard(): void`.
- Returns nothing; the effect installs and tears down the guard.
- Subscribes to storage changes for `flag.prototype-auto-reload`.
- It does not re-render from internal state; behavior changes happen inside the effect when the flag toggles.

## Dependencies

- Uses feature-flag and storage helpers from `../../core/index.js`.

## Dependents

- `packages/storyboard/src/internals/context.jsx` mounts this hook so prototype pages opt into the HMR guard.

## Notes

- The 3s heartbeat and explicit cleanup prevent stale guards from surviving closed tabs.
