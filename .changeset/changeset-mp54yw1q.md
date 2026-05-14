---
"@dfosco/storyboard": patch
---

Hide the branch switcher in local dev, surface a clear error when Octicon is imported from @primer/react, and require agents to load connected widgets into context on every prompt.

- Viewfinder no longer shows the branch switcher in local dev
- Importing `Octicon` from `@primer/react` now throws an explicit error pointing at `@primer/octicons-react`
- Agents must read `.storyboard/terminals/$STORYBOARD_WIDGET_ID.json` and treat `connectedWidgets[]` as always-on, per-turn context
