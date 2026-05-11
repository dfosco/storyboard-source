# `packages/storyboard/src/core/session/localStorage.js`

<!--
source: packages/storyboard/src/core/session/localStorage.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Persistent storage adapter for storyboard session state. It mirrors the hash-session API in localStorage, adds intra-tab and cross-tab reactivity, and namespaces keys by dev domain and branch so parallel apps do not leak state into each other.

## Composition

The module has three responsibilities: compute a `storyboard:{devDomain}:{branch}:` prefix, migrate legacy un-namespaced keys once, and expose a reactive storage API.

```js
export function setLocal(key, value) {
  localStorage.setItem(PREFIX + key, String(value))
  notifyChange()
}

export function subscribeToStorage(callback) {
  window.addEventListener('storage', wrappedCallback)
  window.addEventListener('storyboard-storage', wrappedCallback)
}
```

`getAllLocal()` returns stripped keys, `getStorageSnapshot()` caches a sorted serialized view for external-store consumers, and `notifyChange()` invalidates that cache before dispatching a custom event.

## Dependencies

- `import.meta.env.BASE_URL` and `window.location.hostname` to derive namespaced prefixes.
- Browser `localStorage`, native `storage` events, and a custom `storyboard-storage` event.
- Used by [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md) as its persistence layer.

## Dependents

- [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md) stores hide-mode history and flags here.
- [`packages/storyboard/src/core/session/bodyClasses.js`](./bodyClasses.js.md) subscribes to storage changes.
- ``packages/storyboard/src/core/stores/featureFlags.js`` persists flags here.
- ``packages/storyboard/src/core/index.js`` re-exports the helpers.
- [`packages/storyboard/src/core/session/localStorage.test.js`](./localStorage.test.js.md) and [`packages/storyboard/src/core/session/localStorage.migration.test.js`](./localStorage.migration.test.js.md) cover behavior.

## Notes

The one-shot migration is conservative: it removes only older `storyboard:*` keys that do not already match the new multi-segment namespace scheme.
