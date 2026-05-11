# `packages/storyboard/src/internals/hooks/useFlows.js`

<!--
source: packages/storyboard/src/internals/hooks/useFlows.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useFlows` gives prototype pages a navigation model for their available flows. It reads the active prototype and flow from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md), then combines that context with loader metadata so UI controls can render a flow switcher.

The hook is intentionally read-mostly. It memoizes the available flow list and exposes a single navigation callback that redirects to the resolved route for a chosen flow.

## Composition

```js
export function useFlows() {
  const context = useContext(StoryboardContext)
  const { flowName: activeFlow, prototypeName } = context

  const flows = useMemo(() => {
    if (!prototypeName) return []
    return getFlowsForPrototype(prototypeName).map(f => ({
      key: f.key,
      name: f.name,
      title: getFlowMeta(f.key)?.title || f.name,
      route: resolveFlowRoute(f.key),
    }))
  }, [prototypeName])

  const switchFlow = useCallback((flowKey) => { /* navigate */ }, [flows])
  return { flows, activeFlow, switchFlow, prototypeName }
}
```

- Signature: `useFlows(): { flows, activeFlow, switchFlow, prototypeName }`.
- Returns flow descriptors, the active flow key, the current prototype name, and a `switchFlow(flowKey)` callback.
- Subscribes by reading React context; there is no hash or storage subscription.
- Re-renders when the provider changes `flowName` or `prototypeName`; the memoized flow list only recomputes when `prototypeName` changes.

## Dependencies

- Reads `flowName` and `prototypeName` from [`packages/storyboard/src/internals/StoryboardContext.js`](../StoryboardContext.js.md).
- Uses flow discovery helpers from [`packages/storyboard/src/core/data/loader.js`](../../core/data/loader.js.md) through `getFlowsForPrototype`.

## Dependents

- `packages/storyboard/src/internals/hooks/useFlows.test.js` validates scoped flow discovery and the hook contract.

## Notes

- Navigation uses `window.location.href` rather than the router patch in [`packages/storyboard/src/internals/hashPreserver.js`](../hashPreserver.js.md), so it hands off to route resolution directly.
