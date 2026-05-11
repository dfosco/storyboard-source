# `packages/storyboard/src/internals/hooks/useScene.js`

<!--
source: packages/storyboard/src/internals/hooks/useScene.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useFlow` is the lightweight navigation hook for the current flow, and `useScene` is its backwards-compatible alias. The hook reads the active flow name from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md) and exposes a callback that rewrites the `flow` query param.

This file exists mostly as compatibility glue: new code should think in terms of flows, but older consumers can still call `useScene` and receive the same behavior under renamed keys.

## Composition

```js
export function useFlow() {
  const context = useContext(StoryboardContext)
  const switchFlow = useCallback((name) => {
    const url = new URL(window.location.href)
    url.searchParams.delete('scene')
    url.searchParams.set('flow', name)
    window.location.href = url.toString()
  }, [])
  return { flowName: context.flowName, switchFlow }
}

export function useScene() {
  const { flowName, switchFlow } = useFlow()
  return { sceneName: flowName, switchScene: switchFlow }
}
```

- Signatures: `useFlow()` and deprecated `useScene()`.
- `useFlow` returns `{ flowName, switchFlow }`; `useScene` returns the same values under legacy names.
- Subscription is purely through context.
- Re-renders happen when the provider changes `flowName`; the callback stays stable.

## Dependencies

- Reads from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md).
- Navigation keeps the current hash intact, complementing the global behavior in [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md).

## Dependents

- `packages/storyboard/src/internals/hooks/useScene.test.js` verifies both the new and deprecated APIs.

## Notes

- The callback explicitly deletes the legacy `scene` query param before writing `flow`, which helps migrate old URLs forward.
