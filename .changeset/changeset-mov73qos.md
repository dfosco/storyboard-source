---
"@dfosco/storyboard": minor
---

Error resilience for workspace and canvas

- Add route-level error boundaries so a broken prototype never crashes the workspace or other prototypes
- Wrap canvas and story lazy renders in error boundaries for cross-section isolation
- Fix NaN width/height in prototype widgets — `readProp` now rejects NaN values and falls through to schema defaults
- Guard `handleWidgetUpdate` against saving NaN dimensions to the JSONL
